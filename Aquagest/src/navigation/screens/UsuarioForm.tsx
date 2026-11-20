import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import Selector from '../../components/Selector';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { GENEROS, ROLES_OPCIONES, TIPOS_DOC } from '../../utils/opciones';
import { avisar } from '../../utils/aviso';

export function UsuarioForm({ navigation, route }: any) {
  const u = route.params?.usuario;
  const editando = !!u;
  const [f, setF] = useState({
    nombre: u?.nombre || '', apellido: u?.apellido || '', tipo_documento: u?.tipo_documento || 'CC',
    numero_documento: u?.numero_documento || '', genero: u?.genero || 'Masculino', correo: u?.correo || '',
    telefono: u?.telefono || '', contrasena: '', fk_pk_id_rol: u?.fk_pk_id_rol || 2,
  });
  const [guardando, setGuardando] = useState(false);
  const c = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function guardar() {
    const obligatorios = editando ? ['nombre', 'apellido', 'telefono'] : ['nombre', 'apellido', 'numero_documento', 'correo', 'telefono', 'contrasena'];
    if (obligatorios.some((k) => !String((f as any)[k]).trim())) { Alert.alert('Faltan datos', 'Completa todos los campos obligatorios.'); return; }
    if (f.contrasena && f.contrasena.length < 6) { Alert.alert('Contraseña corta', 'Debe tener mínimo 6 caracteres.'); return; }
    setGuardando(true);
    try {
      if (editando) {
        await api(`/usuarios/${u.id_usuario}`, { method: 'PUT', body: { nombre: f.nombre, apellido: f.apellido, telefono: f.telefono, genero: f.genero, fk_pk_id_rol: f.fk_pk_id_rol, contrasena: f.contrasena || undefined } });
      } else {
        await api('/usuarios', { method: 'POST', body: f });
      }
      avisar(editando ? 'Usuario actualizado' : 'Usuario creado');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Selector label="Rol" value={f.fk_pk_id_rol} onChange={(v) => c('fk_pk_id_rol', Number(v))} opciones={ROLES_OPCIONES} />
        <Campo label="Nombre" icon="account-outline" value={f.nombre} onChangeText={(v) => c('nombre', v)} autoCapitalize="words" maxLength={30} />
        <Campo label="Apellido" icon="account-outline" value={f.apellido} onChangeText={(v) => c('apellido', v)} autoCapitalize="words" maxLength={30} />
        {editando ? (
          <Text style={styles.fijo}>Documento: {u.tipo_documento} {u.numero_documento}{'\n'}Correo: {u.correo}</Text>
        ) : (
          <>
            <Selector label="Tipo de documento" value={f.tipo_documento} onChange={(v) => c('tipo_documento', v)} opciones={TIPOS_DOC} />
            <Campo label="Número de documento" icon="pound" value={f.numero_documento} onChangeText={(v) => c('numero_documento', v)} keyboardType="numeric" maxLength={15} />
            <Campo label="Correo electrónico" icon="email-outline" value={f.correo} onChangeText={(v) => c('correo', v)} keyboardType="email-address" autoCapitalize="none" />
          </>
        )}
        <Selector label="Género" value={f.genero} onChange={(v) => c('genero', v)} opciones={GENEROS} />
        <Campo label="Número de celular" icon="phone" value={f.telefono} onChangeText={(v) => c('telefono', v)} keyboardType="phone-pad" maxLength={15} />
        <Campo
          label={editando ? 'Contraseña nueva (opcional)' : 'Contraseña'}
          icon="lock-outline"
          value={f.contrasena}
          onChangeText={(v) => c('contrasena', v)}
          secureTextEntry
          autoCapitalize="none"
          placeholder={editando ? 'Déjala vacía para no cambiarla' : 'Mínimo 6 caracteres'}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton titulo="Cancelar" tipo="secundario" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Boton titulo="Guardar" icono="content-save-outline" onPress={guardar} cargando={guardando} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  form: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  fijo: { color: colors.muted, fontSize: 12, lineHeight: 19, marginBottom: 14, backgroundColor: colors.background, padding: 10, borderRadius: 10 },
});
