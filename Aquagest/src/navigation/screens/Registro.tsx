import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import Selector from '../../components/Selector';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { tomarFotoBase64, uriDeFoto } from '../../utils/foto';
import { GENEROS, TIPOS_DOC, TIPOS_VEHICULO } from '../../utils/opciones';

const VACIO = { nombre: '', apellido: '', tipo_documento: 'CC', numero_documento: '', genero: 'Masculino', correo: '', telefono: '', tipo_vehiculo: 'Automóvil', marca: '', placa: '' };

export function Registro({ navigation }: any) {
  const [form, setForm] = useState(VACIO);
  const [foto, setFoto] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [tomando, setTomando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const cambiar = (k: string, v: string) => { setForm((p) => ({ ...p, [k]: v })); setErrores((p) => ({ ...p, [k]: '' })); };

  async function tomarFoto() {
    setTomando(true);
    try {
      const f = await tomarFotoBase64();
      if (f) setFoto(f);
    } catch (e: any) {
      Alert.alert('No se pudo tomar la foto', e.message);
    } finally {
      setTomando(false);
    }
  }

  async function guardar() {
    const e: Record<string, string> = {};
    ['nombre', 'apellido', 'numero_documento', 'telefono', 'correo', 'placa'].forEach((k) => {
      if (!(form as any)[k].trim()) e[k] = 'Este campo es obligatorio.';
    });
    if (form.numero_documento && !/^\d{6,15}$/.test(form.numero_documento)) e.numero_documento = 'Usa entre 6 y 15 dígitos.';
    if (form.telefono && !/^\d{7,15}$/.test(form.telefono)) e.telefono = 'Usa entre 7 y 15 dígitos.';
    if (form.correo && !/^\S+@\S+\.\S+$/.test(form.correo.trim())) e.correo = 'Escribe un correo válido.';
    if (form.placa && !/^[A-Za-z0-9-]{5,10}$/.test(form.placa.trim())) e.placa = 'Revisa el formato de la placa.';
    setErrores(e);
    if (Object.keys(e).length) { Alert.alert('Revisa el formulario', 'Completa los campos y corrige los datos marcados.'); return; }

    setGuardando(true);
    try {
      const r = await api('/clientes', { method: 'POST', body: { ...form, foto } });
      const id = r.id_usuario;
      setForm(VACIO);
      setFoto(null);
      Alert.alert('Cliente registrado', 'Su contraseña inicial es su número de documento.', [
        { text: 'Listo' },
        { text: 'Agendar cita', onPress: () => navigation.navigate('AgendarCita', { clienteId: id }) },
      ]);
    } catch (err: any) {
      Alert.alert('No se pudo registrar', err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Registro de Cliente</Text>
      <Text style={styles.subtitle}>Completa la información del cliente y su vehículo.</Text>
      <View style={styles.form}>
        <Campo label="Nombre" icon="account-outline" value={form.nombre} onChangeText={(v) => cambiar('nombre', v)} autoCapitalize="words" error={errores.nombre} />
        <Campo label="Apellido" icon="account-outline" value={form.apellido} onChangeText={(v) => cambiar('apellido', v)} autoCapitalize="words" error={errores.apellido} />
        <Selector label="Tipo de documento" value={form.tipo_documento} onChange={(v) => cambiar('tipo_documento', v)} opciones={TIPOS_DOC} />
        <Campo label="Número de documento" icon="pound" value={form.numero_documento} onChangeText={(v) => cambiar('numero_documento', v)} keyboardType="numeric" maxLength={15} error={errores.numero_documento} />
        <Selector label="Género" value={form.genero} onChange={(v) => cambiar('genero', v)} opciones={GENEROS} />
        <Campo label="Número de celular" icon="phone" value={form.telefono} onChangeText={(v) => cambiar('telefono', v)} keyboardType="phone-pad" maxLength={15} error={errores.telefono} />
        <Campo label="Correo electrónico" icon="email-outline" value={form.correo} onChangeText={(v) => cambiar('correo', v)} keyboardType="email-address" autoCapitalize="none" placeholder="nombre@correo.com" error={errores.correo} />
        <Selector label="Tipo de vehículo" value={form.tipo_vehiculo} onChange={(v) => cambiar('tipo_vehiculo', v)} opciones={TIPOS_VEHICULO} />
        <Campo label="Marca del vehículo" icon="car-info" value={form.marca} onChangeText={(v) => cambiar('marca', v)} autoCapitalize="words" maxLength={30} />
        <Campo label="Placa de vehículo" icon="card-text-outline" value={form.placa} onChangeText={(v) => cambiar('placa', v.toUpperCase())} autoCapitalize="characters" maxLength={10} error={errores.placa} />

        <Text style={styles.label}>Foto del vehículo (opcional)</Text>
        {foto ? <Image source={uriDeFoto(foto)} style={styles.preview} resizeMode="cover" /> : null}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <Boton titulo={foto ? 'Tomar otra' : 'Tomar foto'} icono="camera" tipo="secundario" onPress={tomarFoto} cargando={tomando} style={{ flex: 1 }} />
          {foto ? <Boton titulo="Quitar" icono="delete-outline" tipo="secundario" onPress={() => setFoto(null)} style={{ flex: 1 }} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton titulo="Limpiar" tipo="secundario" onPress={() => { setForm(VACIO); setFoto(null); setErrores({}); }} style={{ flex: 1 }} />
          <Boton titulo="Guardar" icono="content-save-outline" onPress={guardar} cargando={guardando} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 28 },
  title: { color: colors.navy, fontSize: 25, fontWeight: '900' },
  subtitle: { color: colors.muted, marginTop: 5, marginBottom: 16, lineHeight: 19 },
  form: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  preview: { width: '100%', height: 190, borderRadius: 14, marginBottom: 12 },
});
