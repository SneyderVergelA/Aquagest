import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import Boton from '../../components/Boton';
import { Rebote, VisorFoto } from '../../components/animaciones';
import Campo from '../../components/Campo';
import Selector from '../../components/Selector';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { tomarFotoBase64, uriDeFoto } from '../../utils/foto';
import { TIPOS_VEHICULO } from '../../utils/opciones';
import { avisar } from '../../utils/aviso';

export function VehiculoForm({ navigation, route }: any) {
  const clienteId = route.params?.clienteId; // solo lo envía el personal, el cliente registra el suyo
  const [tipo, setTipo] = useState('Automóvil');
  const [marca, setMarca] = useState('');
  const [placa, setPlaca] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [tomando, setTomando] = useState(false);
  const [verFoto, setVerFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
    if (!/^[A-Za-z0-9-]{5,10}$/.test(placa.trim())) { setError('Revisa el formato de la placa.'); return; }
    setGuardando(true);
    try {
      await api('/vehiculos', {
        method: 'POST',
        body: { fk_pk_id_usuario: clienteId, tipo_vehiculo: tipo, marca: marca.trim(), placa: placa.trim().toUpperCase(), foto },
      });
      avisar('Vehículo registrado correctamente');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo registrar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Selector label="Tipo de vehículo" value={tipo} onChange={setTipo} opciones={TIPOS_VEHICULO} />
        <Campo label="Marca" icon="car-info" value={marca} onChangeText={setMarca} placeholder="Ej: Chevrolet" autoCapitalize="words" maxLength={30} />
        <Campo label="Placa del vehículo" icon="card-text-outline" value={placa} onChangeText={(v) => { setPlaca(v.toUpperCase()); setError(''); }} autoCapitalize="characters" maxLength={10} error={error} />

        <Text style={styles.label}>Foto del vehículo (opcional)</Text>
        {foto ? <Text style={styles.pista}>Toca la foto para verla en grande: pellizca para acercar y gira con dos dedos.</Text> : null}
        {foto ? (
          <Rebote onPress={() => setVerFoto(true)} escala={0.97} accessibilityLabel="Ver foto en grande">
            <Image source={uriDeFoto(foto)} style={styles.preview} resizeMode="cover" />
          </Rebote>
        ) : (
          <View style={[styles.preview, styles.vacia]}><Text style={styles.vaciaTexto}>Aún no has tomado la foto</Text></View>
        )}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <Boton titulo={foto ? 'Tomar otra' : 'Tomar foto'} icono="camera" tipo="secundario" onPress={tomarFoto} cargando={tomando} style={{ flex: 1 }} />
          {foto ? <Boton titulo="Quitar" icono="delete-outline" tipo="secundario" onPress={() => setFoto(null)} style={{ flex: 1 }} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton titulo="Cancelar" tipo="secundario" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Boton titulo="Guardar" icono="content-save-outline" onPress={guardar} cargando={guardando} style={{ flex: 1 }} />
        </View>
      </View>
      {foto ? <VisorFoto visible={verFoto} foto={foto} onCerrar={() => setVerFoto(false)} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  form: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  pista: { color: colors.muted, fontSize: 11, marginBottom: 8 },
  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },
  vacia: { backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  vaciaTexto: { color: colors.muted },
});
