import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Rebote } from './animaciones';

export default function BotonFlotante({ texto, icono = 'plus', onPress }: { texto: string; icono?: string; onPress: () => void }) {
  return (
    <Rebote style={styles.fab} onPress={onPress} escala={0.9} entrada={250}>
      <MaterialCommunityIcons name={icono as any} size={22} color={colors.white} />
      <Text style={styles.texto}>{texto}</Text>
    </Rebote>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.brightBlue, borderRadius: 28, paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  texto: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
