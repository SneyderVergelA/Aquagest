import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Campo from '../../components/Campo';
import Boton from '../../components/Boton';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { avisar } from '../../utils/aviso';

export function Recuperar({ navigation }: any) {
  const [correo, setCorreo] = useState('');
  const [documento, setDocumento] = useState('');
  const [nueva, setNueva] = useState('');
  const [cargando, setCargando] = useState(false);

  async function restablecer() {
    if (!correo.includes('@') || !documento.trim() || nueva.length < 6) {
      Alert.alert('Revisa los datos', 'Escribe tu correo, tu número de documento y una contraseña nueva de mínimo 6 caracteres.');
      return;
    }
    setCargando(true);
    try {
      const r = await api('/recuperar', { method: 'POST', body: { correo: correo.trim(), numero_documento: documento.trim(), nueva_contrasena: nueva } });
      avisar(r.message);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo cambiar', e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.icon}><MaterialCommunityIcons name="lock-reset" size={42} color={colors.blue} /></View>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Confirma tu correo y tu número de documento para crear una contraseña nueva.</Text>
      <Campo label="Correo electrónico" icon="email-outline" value={correo} onChangeText={setCorreo} placeholder="nombre@correo.com" keyboardType="email-address" autoCapitalize="none" />
      <Campo label="Número de documento" icon="pound" value={documento} onChangeText={setDocumento} keyboardType="numeric" maxLength={15} />
      <Campo label="Contraseña nueva" icon="lock-outline" value={nueva} onChangeText={setNueva} secureTextEntry autoCapitalize="none" placeholder="Mínimo 6 caracteres" />
      <Boton titulo="Cambiar contraseña" icono="check" onPress={restablecer} cargando={cargando} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 22, justifyContent: 'center' },
  icon: { width: 76, height: 76, borderRadius: 22, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 25, color: colors.navy, fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: colors.muted, lineHeight: 21, marginTop: 8, marginBottom: 28 },
});
