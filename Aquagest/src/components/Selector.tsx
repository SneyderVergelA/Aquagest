import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../theme/colors';

type Opcion = { label: string; value: string | number };
type Props = { label: string; value: string | number; onChange: (v: any) => void; opciones: Opcion[]; vacio?: string };

export default function Selector({ label, value, onChange, opciones, vacio }: Props) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.picker}>
        <Picker selectedValue={value} onValueChange={onChange}>
          {vacio ? <Picker.Item label={vacio} value="" /> : null}
          {opciones.map((o) => <Picker.Item key={String(o.value)} label={o.label} value={o.value} />)}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  picker: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.white },
});
