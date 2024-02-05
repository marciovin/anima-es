import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, ScrollView, TouchableOpacity, Alert, Pressable } from 'react-native';
import { HouseLine, Trash } from 'phosphor-react-native';
import { THEME } from '../../styles/theme';

import { Swipeable } from "react-native-gesture-handler"

import { Header } from '../../components/Header';
import { HistoryCard, HistoryProps } from '../../components/HistoryCard';

import { styles } from './styles';
import { historyGetAll, historyRemove } from '../../storage/quizHistoryStorage';
import { Loading } from '../../components/Loading';
import Animated, { Layout, SlideInRight } from 'react-native-reanimated';

export function History() {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryProps[]>([]);

  const { goBack } = useNavigation();

  const swipeableRefs = useRef<Swipeable[]>([]); 

  async function fetchHistory() {
    const response = await historyGetAll();
    setHistory(response);
    setIsLoading(false);
  }

  async function remove(id: string, index: number) {
    swipeableRefs.current?.[index].close()

    await historyRemove(id);

    fetchHistory();
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <View style={styles.container}>
      <Header
        title="Histórico"
        subtitle={`Seu histórico de estudos${'\n'}realizados`}
        icon={HouseLine}
        onPress={goBack}
      />

      <ScrollView
        contentContainerStyle={styles.history}
        showsVerticalScrollIndicator={false}
      >
        {
          history.map((item, index) => (
            <Animated.View 
            key={item.id}
            entering={SlideInRight}
            exiting={SlideInRight}
            layout={Layout.springify()}
            >
            <Swipeable
            ref={(ref) => {
              if(ref){
                swipeableRefs.current.push(ref)
              }
            }}
            overshootLeft={false}
            renderLeftActions={() => (
              <Pressable
               style={styles.swipeableRemove}
               onPress={() => remove(item.id, index)}
               >
                  <Trash size={32} color={THEME.COLORS.DANGER_LIGHT}/>
              </Pressable>
            )}
            >
              <HistoryCard data={item} />
            </Swipeable>
            </Animated.View>
          ))
        }
      </ScrollView>
    </View>
  );
}