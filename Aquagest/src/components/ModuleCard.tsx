import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Rebote } from './animaciones';

type Props = { title: string; description: string; icon: string; color: string; tint: string; onPress: () => void; indice?: number };

export default function ModuleCard({ title, description, icon, color, tint, onPress, indice = 0 }: Props) {
  return (
    <Rebote style={[styles.card, { backgroundColor: tint }]} onPress={onPress} escala={0.94} entrada={indice * 90}>
      <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={34} color={color} />
      </View>
      <Text style={[styles.title, { color }]}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={[styles.arrow, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />
      </View>
    </Rebote>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', minHeight: 175, borderRadius: 18, padding: 15, margin: '1.5%', borderWidth: 1, borderColor: '#E1EAF3' },
  iconCircle: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', marginBottom: 5 },
  description: { color: '#4E6782', fontSize: 12, lineHeight: 17, paddingRight: 4 },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', marginTop: 10 },
});
