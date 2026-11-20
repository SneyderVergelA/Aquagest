import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

type Props = {
  children?: React.ReactNode;
  /** Milisegundos de espera antes de aparecer (sirve para escalonar varios bloques). */
  retraso?: number;
  /** Cuántos píxeles sube mientras aparece. */
  desde?: number;
  style?: StyleProp<ViewStyle>;
};

/** Entrada suave: el bloque aparece y sube con un pequeño resorte. */
export function Aparecer({ children, retraso = 0, desde = 20, style }: Props) {
  const avance = useSharedValue(0);

  useEffect(() => {
    avance.value = withDelay(retraso, withSpring(1, { damping: 15, stiffness: 110 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(avance.value, [0, 0.6], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: (1 - avance.value) * desde }],
  }));

  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}
