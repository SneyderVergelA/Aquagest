import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Campo from '../../components/Campo';
import Selector from '../../components/Selector';
import Boton from '../../components/Boton';
import { Aparecer } from '../../components/animaciones';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { GENEROS, TIPOS_DOC } from '../../utils/opciones';

const VACIO = { nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '', genero: 'Masculino', correo: '', telefono: '', contrasena: '', confirmar: '' };

export function CrearCuenta({ navigation }: any) {
  const { registrarCliente } = useAuth();
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const cambiar = (k: string, v: string) => { setForm((p) => ({ ...p, [k]: v })); setErrores((p) => ({ ...p, [k]: '' })); };

  async function crear() {
    const e: Record<string, string> = {};
    ['nombre', 'apellido', 'numero_documento', 'telefono', 'correo', 'contrasena'].forEach((k) => {
      if (!(form as any)[k].trim()) e[k] = 'Este campo es obligatorio.';
    });
    if (form.numero_documento && !/^\d{5,15}$/.test(form.numero_documento)) e.numero_documento = 'Usa entre 5 y 15 dígitos.';
    if (form.telefono && !/^\d{7,15}$/.test(form.telefono)) e.telefono = 'Usa entre 7 y 15 dígitos.';
    if (form.correo && !/^\S+@\S+\.\S+$/.test(form.correo.trim())) e.correo = 'Escribe un correo válido.';
    if (form.contrasena && form.contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres.';
    if (form.contrasena !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden.';
    setErrores(e);
    if (Object.keys(e).length) { Alert.alert('Revisa el formulario', 'Completa los campos y corrige los datos marcados.'); return; }

    setCargando(true);
    try {
      const { confirmar, ...datos } = form;
      await registrarCliente(datos); // crea la cuenta (rol Cliente) y entra directo a la app
    } catch (err: any) {
      setCargando(false);
      Alert.alert('No se pudo crear la cuenta', err.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Aparecer>
        <View style={styles.icon}><MaterialCommunityIcons name="account-plus-outline" size={38} color={colors.blue} /></View>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Regístrate como cliente para agendar tus lavados.</Text>
      </Aparecer>
      <Aparecer style={styles.form} retraso={150} desde={36}>
        <Campo label="Nombre" icon="account-outline" value={form.nombre} onChangeText={(v) => cambiar('nombre', v)} autoCapitalize="words" error={errores.nombre} />
        <Campo label="Apellido" icon="account-outline" value={form.apellido} onChangeText={(v) => cambiar('apellido', v)} autoCapitalize="words" error={errores.apellido} />
        <Selector label="Tipo de documento" value={form.tipo_documento} onChange={(v) => cambiar('tipo_documento', v)} opciones={TIPOS_DOC} />
        <Campo label="Número de documento" icon="pound" value={form.numero_documento} onChangeText={(v) => cambiar('numero_documento', v)} keyboardType="numeric" maxLength={15} error={errores.numero_documento} />
        <Selector label="Género" value={form.genero} onChange={(v) => cambiar('genero', v)} opciones={GENEROS} />
        <Campo label="Número de celular" icon="phone" value={form.telefono} onChangeText={(v) => cambiar('telefono', v)} keyboardType="phone-pad" maxLength={15} error={errores.telefono} />
        <Campo label="Correo electrónico" icon="email-outline" value={form.correo} onChangeText={(v) => cambiar('correo', v)} keyboardType="email-address" autoCapitalize="none" placeholder="nombre@correo.com" error={errores.correo} />
        <Campo
          label="Contraseña"
          icon="lock-outline"
          value={form.contrasena}
          onChangeText={(v) => cambiar('contrasena', v)}
          secureTextEntry={!mostrar}
          autoCapitalize="none"
          placeholder="Mínimo 6 caracteres"
          error={errores.contrasena}
          right={
            <TouchableOpacity onPress={() => setMostrar(!mostrar)}>
              <MaterialCommunityIcons name={mostrar ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
            </TouchableOpacity>
          }
        />
        <Campo label="Confirmar contraseña" icon="lock-check-outline" value={form.confirmar} onChangeText={(v) => cambiar('confirmar', v)} secureTextEntry={!mostrar} autoCapitalize="none" placeholder="Repite la contraseña" error={errores.confirmar} />
        <Boton titulo="Crear cuenta" icono="check" onPress={crear} cargando={cargando} />
      </Aparecer>
      <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()}>
        <Text style={styles.volverTexto}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 30 },
  icon: { width: 70, height: 70, borderRadius: 20, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 4, marginBottom: 12 },
  title: { color: colors.navy, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 5, marginBottom: 18, lineHeight: 19 },
  form: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  volver: { alignItems: 'center', marginTop: 18, padding: 8 },
  volverTexto: { color: colors.brightBlue, fontWeight: '700' },
});
