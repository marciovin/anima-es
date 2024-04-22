import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  useValue,
  runTiming,
  BlurMask,
  Circle,
  Easing
} from "@shopify/react-native-skia"

import { styles } from './styles';
import { THEME } from '../../styles/theme';
import { useEffect } from 'react';

type Props = TouchableOpacityProps & {
  checked: boolean;
  title: string;
}

const CHECK_SIZE = 28;
const CHECK_STROKE = 2

export function Option({ checked, title, ...rest }: Props) {
  const percentage = useValue(0)
  const Cicle = useValue(0)

  const Radius = (CHECK_SIZE - CHECK_STROKE) / 2;
  const CENTER_CICLE = Radius / 2;

  const path = Skia.Path.Make();
  path.addCircle(CHECK_SIZE, CHECK_SIZE, Radius)

  useEffect(() => {
    if (checked) {
      runTiming(percentage, 1, { duration: 700 });
      runTiming(Cicle, CENTER_CICLE, { easing: Easing.bounce });
    } else {
      runTiming(percentage, 0, { duration: 700 });
      runTiming(Cicle, 0, { duration: 300 });
    }

  }, [checked])

  return (
    <TouchableOpacity
      style={
        [
          styles.container,
          checked && styles.checked
        ]
      }
      {...rest}
    >
      <Text style={styles.title}>
        {title}
      </Text>
      <Canvas style={{ height: CHECK_SIZE * 2, width: CHECK_SIZE * 2 }}>
        <Path
          path={path}
          color={THEME.COLORS.GREY_500}
          style={"stroke"}
          strokeWidth={CHECK_STROKE}
        />

        <Path
          path={path}
          color={THEME.COLORS.BRAND_LIGHT}
          style={"stroke"}
          strokeWidth={CHECK_STROKE}
          start={0}
          end={percentage}
        >
          <BlurMask blur={1} style={'solid'} />
        </Path>

        <Circle
          cx={CHECK_SIZE}
          cy={CHECK_SIZE}
          r={Cicle}
          color={THEME.COLORS.BRAND_LIGHT}
        >
          <BlurMask blur={4} style={'inner'} />
        </Circle>

      </Canvas>
    </TouchableOpacity>
  );
}