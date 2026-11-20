import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Aviso, registrarAvisos } from '../utils/aviso';
import { colors } from '../theme/colors';

const ESTILO = {
  exito: { fondo: colors.green, icono: 'check-circle-outline' },
  error: { fondo: colors.red, icono: 'alert-circle-outline' },
  info: { fondo: colors.navy, icono: 'information-outline' },
};

export default function AvisoHost() {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const entrada = useSharedValue(0);
  const ocultar = useRef<any>(null);
  const quitar = useRef<any>(null);

  useEffect(() => {
    registrarAvisos((a) => {
      if (ocultar.current) clearTimeout(ocultar.current);
      if (quitar.current) clearTimeout(quitar.current);
      setAviso(a);
      // Baja desde arriba con un pequeño rebote
      entrada.value = 0;
      entrada.value = withSpring(1, { damping: 9, stiffness: 140 });
      ocultar.current = setTimeout(() => {
        entrada.value = withTiming(0, { duration: 250 });
        quitar.current = setTimeout(() => setAviso(null), 270);
      }, 2800);
    });
    return () => {
      registrarAvisos(null);
      if (ocultar.current) clearTimeout(ocultar.current);
      if (quitar.current) clearTimeout(quitar.current);
    };
  }, [entrada]);

  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(entrada.value, [0, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: (1 - entrada.value) * -48 }],
  }));

  if (!aviso) return null;
  const e = ESTILO[aviso.tipo];
  return (
    <View pointerEvents="none" style={styles.contenedor}>
      <Animated.View style={[styles.aviso, { backgroundColor: e.fondo }, estilo]}>
        <MaterialCommunityIcons name={e.icono as any} size={22} color={colors.white} />
        <Text style={styles.texto}>{aviso.texto}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 44, left: 16, right: 16, alignItems: 'center', zIndex: 999, elevation: 20 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, maxWidth: 520, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 8 },
  texto: { color: colors.white, fontWeight: '700', fontSize: 14, flexShrink: 1 },
});
