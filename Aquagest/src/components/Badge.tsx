import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ESTILOS: Record<string, { fondo: string; texto: string }> = {
  Pendiente: { fondo: colors.orangeLight, texto: colors.orange },
  'En proceso': { fondo: colors.blueLight, texto: colors.blue },
  Terminada: { fondo: colors.greenLight, texto: colors.green },
  Pagado: { fondo: colors.greenLight, texto: colors.green },
  Cancelada: { fondo: colors.redLight, texto: colors.red },
};

export default function Badge({ texto, etiqueta }: { texto: string; etiqueta?: string }) {
  const e = ESTILOS[texto] || { fondo: colors.blueLight, texto: colors.blue };
  return (
    <View style={[styles.badge, { backgroundColor: e.fondo }]}>
      <Text style={[styles.texto, { color: e.texto }]}>{etiqueta || texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  texto: { fontSize: 11, fontWeight: '800' },
});
