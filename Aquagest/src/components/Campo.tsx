import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  right?: React.ReactNode;
  icon?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
  error?: string;
};

export default function Campo({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, right, icon, autoCapitalize = 'sentences', maxLength, multiline = false, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {icon ? <MaterialCommunityIcons name={icon as any} size={20} color={colors.muted} style={styles.icon} /> : null}
        <TextInput
          style={[styles.input, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Ingresa ${label.toLowerCase()}`}
          placeholderTextColor="#8CA0B6"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
        />
        {right}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.white, paddingHorizontal: 12 },
  inputError: { borderColor: colors.red },
  icon: { marginRight: 8 },
  input: { flex: 1, color: colors.text, paddingVertical: 11, fontSize: 14 },
  error: { color: colors.red, fontSize: 11, marginTop: 4 },
});
