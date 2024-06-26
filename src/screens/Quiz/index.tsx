import { useEffect, useState } from 'react';
import { Alert, Text, View, BackHandler } from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';

import { styles } from './styles';

import { QUIZ } from '../../data/quiz';
import { historyAdd } from '../../storage/quizHistoryStorage';

import { GestureDetector, Gesture } from 'react-native-gesture-handler'

import { Loading } from '../../components/Loading';
import { Question } from '../../components/Question';
import { QuizHeader } from '../../components/QuizHeader';
import { ConfirmButton } from '../../components/ConfirmButton';
import { OutlineButton } from '../../components/OutlineButton';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  useAnimatedScrollHandler,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { Audio } from "expo-av"
import { ProgressBar } from '../../components/ProgressBar';
import { THEME } from '../../styles/theme';
import { isLoading } from 'expo-font';
import { OverlayFeedback } from "../../components/OverlayFeedback"

interface Params {
  id: string;
}

const CARD_INCLINATION = 10

type QuizProps = typeof QUIZ[0];

export function Quiz() {
  const [points, setPoints] = useState(0);
  const [statusReplay, setStatusReplay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quiz, setQuiz] = useState<QuizProps>({} as QuizProps);
  const [alternativeSelected, setAlternativeSelected] = useState<null | number>(null);

  const shake = useSharedValue(0)
  const scrollY = useSharedValue(0)
  const cardPosition = useSharedValue(0)
  const CARD_SKIP_AREA = (-200)

  const { navigate } = useNavigation();

  const route = useRoute();
  const { id } = route.params as Params;

  async function palySound(iscorrect: boolean) {
    const file = iscorrect ? require('../../assets/correct.mp3') : require('../../assets/wrong.mp3');
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: true });

    await sound.setPositionAsync(0);
    await sound.playAsync();
  }

  function handleSkipConfirm() {
    Alert.alert('Pular', 'Deseja realmente pular a questão?', [
      { text: 'Sim', onPress: () => handleNextQuestion() },

      { text: 'Não', onPress: () => { } }
    ]);
  }

  async function handleFinished() {
    await historyAdd({
      id: new Date().getTime().toString(),
      title: quiz.title,
      level: quiz.level,
      points,
      questions: quiz.questions.length
    });

    navigate('finish', {
      points: String(points),
      total: String(quiz.questions.length),
    });
  }

  function handleNextQuestion() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prevState => prevState + 1)
    } else {
      handleFinished();
    }
  }

  async function handleConfirm() {
    if (alternativeSelected === null) {
      return handleSkipConfirm();
    }

    if (quiz.questions[currentQuestion].correct === alternativeSelected) {
      setPoints(prevState => prevState + 1);
      await palySound(true)
      setStatusReplay(1)

    } else {
      await palySound(false)
      setStatusReplay(2)
      shakeAnimation()
    }

    setAlternativeSelected(null);
  }

  function handleStop() {
    Alert.alert('Parar', 'Deseja parar agora?', [
      {
        text: 'Não',
        style: 'cancel',
      },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: () => navigate('home')
      },
    ]);

    return true;
  }

  function shakeAnimation() {
    shake.value = withSequence(
      withTiming(3, { duration: 400, easing: Easing.bounce }),
      withTiming(0, undefined, (Finished) => {
        'worklet'
        if (Finished) {
          runOnJS(handleNextQuestion)()
        }
      })
    );
  }

  useEffect(() => {
    if (quiz.questions) {
      handleNextQuestion();
    }
  }, [points]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleStop);

    return () => backHandler.remove()
  }, []);

  const shakeStyleAnimated = useAnimatedStyle(() => {
    return {
      transform: [{
        translateX: interpolate(
          shake.value,
          [0, 5, 1, 1.5, 2, 2, 5, 3],
          [0, -15, 0, 15, 0, -15, 0]
        )
      }]
    }
  })

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    }
  })

  const fixedProgressBarStyles = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      zIndex: 1,
      paddingTop: 50,
      backgroundColor: THEME.COLORS.GREY_500,
      width: "110%",
      left: "-5%",
      opacity: interpolate(scrollY.value, [50, 90], [0, 1], Extrapolate.CLAMP),
      transform: [
        { translateY: interpolate(scrollY.value, [50, 100], [-40, 0], Extrapolate.CLAMP) }
      ]
    }
  });

  const headerStyles = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [50, 90], [1, 0], Extrapolate.CLAMP)
    }
  })

  const onPan = Gesture.Pan()
    .onUpdate((event) => {
      const moveToLeft = event.translationX < 0

      if (moveToLeft) {
        cardPosition.value = event.translationX
      }

      cardPosition.value = event.translationX
    }).onEnd((event) => {

      if (event.translationX < CARD_SKIP_AREA) {
        runOnJS(handleSkipConfirm)()
      }

      cardPosition.value = withTiming(0)
    })

  const dragStyles = useAnimatedStyle(() => {
    const rotateZ = cardPosition.value / CARD_INCLINATION;

    return {

      transform: [
        { translateX: cardPosition.value },
        { rotateZ: `${rotateZ}deg` }
      ]
    }
  })

  useEffect(() => {
    const quizSelected = QUIZ.filter(item => item.id === id)[0];
    setQuiz(quizSelected);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <View style={styles.container}>
      <OverlayFeedback status={statusReplay} />

      <Animated.View style={fixedProgressBarStyles} >
        <Text style={styles.title}>
          {quiz.title}
        </Text>

        <ProgressBar
          total={quiz.questions.length}
          current={currentQuestion + 1}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.question}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >

        <Animated.View style={[styles.header, headerStyles]}>
          <QuizHeader
            title={quiz.title}
            currentQuestion={currentQuestion + 1}
            totalOfQuestions={quiz.questions.length}
          />
        </Animated.View>

        <GestureDetector gesture={onPan}>
          <Animated.View style={[shakeStyleAnimated, dragStyles]}>
            <Question
              key={quiz.questions[currentQuestion].title}
              question={quiz.questions[currentQuestion]}
              alternativeSelected={alternativeSelected}
              setAlternativeSelected={setAlternativeSelected}
              onUnmount={() => setStatusReplay(0)}
            />
          </Animated.View>
        </GestureDetector>

        <View style={styles.footer}>
          <OutlineButton title="Parar" onPress={handleStop} />
          <ConfirmButton onPress={handleConfirm} />
        </View>
      </Animated.ScrollView>
    </View >
  );
}