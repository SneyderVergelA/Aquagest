import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * Animación "Arrastrar y rotar": el contenido sigue el dedo (o el mouse) y gira hacia el lado
 * al que se mueve; al soltarlo vuelve a su lugar con un resorte.
 */
export function Arrastrable({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const giro = useSharedValue(0);
  const elevar = useSharedValue(0);

  const arrastrar = Gesture.Pan()
    .onBegin(() => {
      elevar.value = withSpring(1);
    })
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
      // Izquierda -> grados negativos; derecha -> positivos.
      giro.value = Math.max(-70, Math.min(70, e.translationX / 2.2));
    })
    .onFinalize(() => {
      x.value = withSpring(0, { damping: 8, stiffness: 120 });
      y.value = withSpring(0, { damping: 8, stiffness: 120 });
      giro.value = withSpring(0, { damping: 7, stiffness: 110 });
      elevar.value = withSpring(0);
    });

  const estilo = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${giro.value}deg` },
      { scale: 1 + elevar.value * 0.12 },
    ],
  }));

  return (
    <GestureDetector gesture={arrastrar}>
      <Animated.View style={[style, estilo]}>{children}</Animated.View>
    </GestureDetector>
  );
}
