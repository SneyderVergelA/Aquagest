import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { uriDeFoto } from '../../utils/foto';
import { Rebote } from './Rebote';

const ESCALA_MIN = 0.5;
const ESCALA_MAX = 5;

type Props = { visible: boolean; foto: string; onCerrar: () => void };

/**
 * Animación "Gestos multitáctiles": con dos dedos se acerca, aleja y gira la foto; con uno se mueve.
 * En el navegador del PC (sin dos dedos) se usan los botones.
 */
export function VisorFoto({ visible, foto, onCerrar }: Props) {
  const insets = useSafeAreaInsets();
  const escala = useSharedValue(1);
  const escalaGuardada = useSharedValue(1);
  const giro = useSharedValue(0);
  const giroGuardado = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xGuardado = useSharedValue(0);
  const yGuardado = useSharedValue(0);

  const pellizco = Gesture.Pinch()
    .onUpdate((e) => {
      escala.value = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escalaGuardada.value * e.scale));
    })
    .onEnd(() => {
      escalaGuardada.value = escala.value;
    });

  const rotacion = Gesture.Rotation()
    .onUpdate((e) => {
      giro.value = giroGuardado.value + e.rotation;
    })
    .onEnd(() => {
      giroGuardado.value = giro.value;
    });

  const arrastre = Gesture.Pan()
    .onUpdate((e) => {
      x.value = xGuardado.value + e.translationX;
      y.value = yGuardado.value + e.translationY;
    })
    .onEnd(() => {
      xGuardado.value = x.value;
      yGuardado.value = y.value;
    });

  const gesto = Gesture.Simultaneous(pellizco, rotacion, arrastre);

  const estilo = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: escala.value },
      { rotate: `${giro.value}rad` },
    ],
  }));

  const zoom = (factor: number) => {
    const siguiente = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escalaGuardada.value * factor));
    escalaGuardada.value = siguiente;
    escala.value = withSpring(siguiente);
  };

  const girar = () => {
    const siguiente = giroGuardado.value + Math.PI / 4;
    giroGuardado.value = siguiente;
    giro.value = withSpring(siguiente);
  };

  const restablecer = (animado = true) => {
    escalaGuardada.value = 1;
    giroGuardado.value = 0;
    xGuardado.value = 0;
    yGuardado.value = 0;
    escala.value = animado ? withSpring(1) : 1;
    giro.value = animado ? withSpring(0) : 0;
    x.value = animado ? withSpring(0) : 0;
    y.value = animado ? withSpring(0) : 0;
  };

  // Cada vez que se abre, la foto empieza centrada y sin zoom.
  useEffect(() => {
    if (visible) restablecer(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      {/* Dentro de un Modal los gestos necesitan su propia raíz (Android) */}
      <GestureHandlerRootView style={styles.fondo}>
        <GestureDetector gesture={gesto}>
          <Animated.View style={[styles.lamina, estilo]}>
            <Animated.Image source={uriDeFoto(foto)} style={styles.imagen} resizeMode="contain" />
          </Animated.View>
        </GestureDetector>

        <Rebote onPress={onCerrar} accessibilityLabel="Cerrar" style={[styles.cerrar, { top: insets.top + 12 }]}>
          <MaterialCommunityIcons name="close" size={24} color={colors.white} />
        </Rebote>

        <View style={[styles.barra, { bottom: insets.bottom + 18 }]}>
          <Rebote onPress={() => zoom(0.8)} accessibilityLabel="Alejar" style={styles.boton}>
            <MaterialCommunityIcons name="magnify-minus-outline" size={24} color={colors.white} />
          </Rebote>
          <Rebote onPress={() => zoom(1.25)} accessibilityLabel="Acercar" style={styles.boton}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={24} color={colors.white} />
          </Rebote>
          <Rebote onPress={girar} accessibilityLabel="Girar" style={styles.boton}>
            <MaterialCommunityIcons name="rotate-right" size={24} color={colors.white} />
          </Rebote>
          <Rebote onPress={() => restablecer()} accessibilityLabel="Restablecer" style={styles.boton}>
            <MaterialCommunityIcons name="backup-restore" size={24} color={colors.white} />
          </Rebote>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(8,24,44,0.94)', alignItems: 'center', justifyContent: 'center' },
  lamina: { width: '92%', height: '70%' },
  imagen: { width: '100%', height: '100%', borderRadius: 12 },
  cerrar: { position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  barra: { position: 'absolute', flexDirection: 'row', gap: 14 },
  boton: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brightBlue, alignItems: 'center', justifyContent: 'center' },
});
