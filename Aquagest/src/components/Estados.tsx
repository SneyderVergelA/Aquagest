import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Aparecer, BarraCarga, Spinner } from './animaciones';

export function Cargando() {
  return (
    <View style={styles.centro}>
      <Spinner tamano={92} color={colors.blue} />
      <Text style={styles.cargando}>Cargando…</Text>
      <BarraCarga ancho={200} />
    </View>
  );
}

export function Vacio({ icono = 'inbox-outline', texto }: { icono?: string; texto: string }) {
  return (
    <Aparecer style={styles.centro}>
      <MaterialCommunityIcons name={icono as any} size={46} color="#9FB3C8" />
      <Text style={styles.texto}>{texto}</Text>
    </Aparecer>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <View style={styles.centro}>
      <MaterialCommunityIcons name="wifi-off" size={46} color={colors.red} />
      <Text style={styles.texto}>{mensaje}</Text>
      <Text style={styles.reintentar} onPress={onReintentar}>Reintentar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, minHeight: 200 },
  cargando: { color: colors.navy, fontWeight: '800', fontSize: 15, marginTop: 18, marginBottom: 12 },
  texto: { color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  reintentar: { color: colors.brightBlue, fontWeight: '800', marginTop: 14, padding: 8 },
});
