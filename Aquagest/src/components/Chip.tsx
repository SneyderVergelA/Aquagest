import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Rebote } from './animaciones';

type Props = { texto: string; activo: boolean; onPress: () => void; deshabilitado?: boolean };

export default function Chip({ texto, activo, onPress, deshabilitado = false }: Props) {
  return (
    <Rebote
      disabled={deshabilitado}
      onPress={onPress}
      escala={0.88}
      style={[styles.chip, activo && styles.activo, deshabilitado && styles.apagado]}>
      <Text style={[styles.texto, activo && { color: colors.white }, deshabilitado && { color: '#A6B6C8' }]}>{texto}</Text>
    </Rebote>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  activo: { backgroundColor: colors.brightBlue, borderColor: colors.brightBlue },
  apagado: { backgroundColor: '#EEF2F7' },
  texto: { color: colors.navy, fontWeight: '700', fontSize: 13 },
});
