import React from 'react';
import { Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Rebote, Spinner } from './animaciones';

type Props = {
  titulo: string;
  onPress: () => void;
  tipo?: 'primario' | 'secundario' | 'peligro' | 'exito';
  icono?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  style?: ViewStyle;
};

export default function Boton({ titulo, onPress, tipo = 'primario', icono, cargando = false, deshabilitado = false, style }: Props) {
  const secundario = tipo === 'secundario';
  const fondo = tipo === 'peligro' ? colors.red : tipo === 'exito' ? colors.green : colors.brightBlue;
  const textoColor = secundario ? colors.blue : colors.white;
  return (
    <Rebote
      disabled={deshabilitado || cargando}
      onPress={onPress}
      style={[styles.boton, secundario ? styles.secundario : { backgroundColor: fondo }, (deshabilitado || cargando) && { opacity: 0.55 }, style]}>
      {cargando ? (
        <Spinner tamano={26} color={textoColor} />
      ) : (
        <>
          {icono ? <MaterialCommunityIcons name={icono as any} size={18} color={textoColor} /> : null}
          <Text style={[styles.texto, { color: textoColor }]}>{titulo}</Text>
        </>
      )}
    </Rebote>
  );
}

const styles = StyleSheet.create({
  boton: { minHeight: 48, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secundario: { borderWidth: 1, borderColor: '#9BC7FF', backgroundColor: colors.white },
  texto: { fontWeight: '800', fontSize: 14 },
});
