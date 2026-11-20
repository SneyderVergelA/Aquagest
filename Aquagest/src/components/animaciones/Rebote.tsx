import React, { useEffect } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PresionableAnimado = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Escala a la que se encoge al presionar (1 = no se encoge). */
  escala?: number;
  /** Si se indica (en milisegundos de retraso), el elemento también aparece subiendo al montarse. */
  entrada?: number;
  children?: React.ReactNode;
};

/**
 * Animación "Rebote" del proyecto animacionHibridas: al presionar se encoge y al soltar
 * vuelve con un resorte poco amortiguado, así que rebota. Reemplaza a TouchableOpacity.
 */
export function Rebote({ style, escala = 0.92, entrada, onPressIn, onPressOut, children, ...resto }: Props) {
  const conEntrada = entrada !== undefined;
  const tam = useSharedValue(1);
  const aparece = useSharedValue(conEntrada ? 0 : 1);

  useEffect(() => {
    if (entrada === undefined) return;
    aparece.value = withDelay(entrada, withSpring(1, { damping: 14, stiffness: 110 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estilo = useAnimatedStyle(() => {
    if (conEntrada) {
      return {
        opacity: interpolate(aparece.value, [0, 0.6], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: (1 - aparece.value) * 22 }, { scale: tam.value }],
      };
    }
    return { transform: [{ scale: tam.value }] };
  });

  return (
    <PresionableAnimado
      accessibilityRole="button"
      {...resto}
      onPressIn={(e) => {
        tam.value = withTiming(escala, { duration: 120 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        // Poco amortiguamiento = rebote.
        tam.value = withSpring(1, { damping: 4, stiffness: 170, mass: 0.7 });
        onPressOut?.(e);
      }}
      style={[style, estilo] as any}>
      {children}
    </PresionableAnimado>
  );
}
