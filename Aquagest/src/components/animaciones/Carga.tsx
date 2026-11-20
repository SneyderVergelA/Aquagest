import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const PUNTOS = 9;

/** Spinner de la animación de carga: puntos que crecen formando una cola de cometa. */
export function Spinner({ tamano = 96, color = colors.blue }: { tamano?: number; color?: string }) {
  const giro = useSharedValue(0);

  useEffect(() => {
    giro.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(giro);
  }, [giro]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ rotate: `${giro.value}deg` }] }));
  const radio = tamano * 0.38;

  return (
    <Animated.View style={[{ width: tamano, height: tamano }, estilo]}>
      {Array.from({ length: PUNTOS }).map((_, i) => {
        const angulo = (i / PUNTOS) * 2 * Math.PI;
        const t = (i + 1) / PUNTOS;
        const d = tamano * (0.06 + t * 0.12);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              backgroundColor: color,
              opacity: 0.2 + 0.8 * t,
              left: tamano / 2 + Math.cos(angulo) * radio - d / 2,
              top: tamano / 2 + Math.sin(angulo) * radio - d / 2,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

/** Barra de carga que se llena sola y se repite sin detenerse. */
export function BarraCarga({ ancho = 220, color = colors.brightBlue }: { ancho?: number; color?: string }) {
  const avance = useSharedValue(0);

  useEffect(() => {
    avance.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: 350 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(avance);
  }, [avance]);

  const estilo = useAnimatedStyle(() => ({ width: `${avance.value * 100}%` }));

  return (
    <View style={[styles.pista, { width: ancho }]}>
      <Animated.View style={[styles.relleno, { backgroundColor: color }, estilo]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pista: { height: 12, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 6 },
});
