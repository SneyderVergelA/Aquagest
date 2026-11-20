import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Campo from '../../components/Campo';
import { Aparecer, Arrastrable, Rebote, Spinner } from '../../components/animaciones';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export function Login({ navigation }: any) {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function ingresar() {
    if (!correo.trim() || !password) {
      Alert.alert('Campos requeridos', 'Escribe tu correo y contraseña para continuar.');
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(correo, password);
    } catch (e: any) {
      setCargando(false);
      Alert.alert('No se pudo ingresar', e.message);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Aparecer style={styles.brand} desde={-30}>
          {/* Arrastra y rota: se puede mover el logo y vuelve con rebote */}
          <Arrastrable>
            <MaterialCommunityIcons name="car-wash" size={72} color={colors.white} />
          </Arrastrable>
          <Text style={styles.brandName}>Aqua<Text style={{ color: '#28B9F4' }}>Gest</Text></Text>
          <Text style={styles.brandSub}>Gestor de Lavadero Vehicular</Text>
        </Aparecer>
        <Aparecer style={styles.panel} retraso={180} desde={40}>
          <Text style={styles.heading}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          <Campo label="Correo electrónico" icon="email-outline" value={correo} onChangeText={setCorreo} placeholder="nombre@correo.com" keyboardType="email-address" autoCapitalize="none" />
          <Campo
            label="Contraseña"
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry={!mostrar}
            autoCapitalize="none"
            right={
              <TouchableOpacity onPress={() => setMostrar(!mostrar)}>
                <MaterialCommunityIcons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
              </TouchableOpacity>
            }
          />
          <TouchableOpacity style={styles.forgot} onPress={() => navigation.navigate('Recuperar')}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
          <Rebote style={[styles.button, cargando && { opacity: 0.7 }]} onPress={ingresar} disabled={cargando}>
            {cargando ? (
              <Spinner tamano={30} color={colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Ingresar</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
              </>
            )}
          </Rebote>
          <View style={styles.crear}>
            <Text style={styles.crearTexto}>¿Aún no tienes cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CrearCuenta')}>
              <Text style={styles.crearLink}> Créala aquí</Text>
            </TouchableOpacity>
          </View>
        </Aparecer>
        <Aparecer retraso={450} desde={14}>
          <Text style={styles.tagline}>Tu lavadero, mejor gestionado</Text>
        </Aparecer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brand: { alignItems: 'center', paddingVertical: 28 },
  brandName: { color: colors.white, fontSize: 38, fontWeight: '900', marginTop: 5 },
  brandSub: { color: '#E2F1FF', fontSize: 13, marginTop: 2 },
  panel: { backgroundColor: colors.white, borderRadius: 24, padding: 24, marginBottom: 18 },
  heading: { color: colors.navy, fontSize: 27, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, marginTop: 3, marginBottom: 24 },
  forgot: { alignSelf: 'flex-start', marginTop: 1, marginBottom: 22 },
  forgotText: { color: colors.brightBlue, fontWeight: '700' },
  button: { backgroundColor: colors.brightBlue, borderRadius: 30, minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  crear: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  crearTexto: { color: colors.muted },
  crearLink: { color: colors.brightBlue, fontWeight: '800' },
  tagline: { color: '#E2F1FF', textAlign: 'center', fontSize: 13, marginBottom: 8 },
});
