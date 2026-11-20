import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BotonFlotante from '../../components/BotonFlotante';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { Aparecer, Rebote, VisorFoto } from '../../components/animaciones';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { uriDeFoto } from '../../utils/foto';

export function Vehiculos({ navigation }: any) {
  const { datos, cargando, error, recargando, recargar, reintentar } = useCarga<any[]>(() => api('/vehiculos'), []);
  const [verFoto, setVerFoto] = useState<string | null>(null);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Mis vehículos</Text>
      <Text style={styles.subtitle}>Los que puedes agendar para lavado</Text>
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga mensaje={error} onReintentar={reintentar} />
      ) : (
        <FlatList
          data={datos}
          keyExtractor={(v) => String(v.id_vehiculo)}
          contentContainerStyle={{ paddingBottom: 90, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
          ListEmptyComponent={<Vacio icono="car-off" texto="Aún no has registrado vehículos. Toca “Vehículo” para agregar el primero." />}
          renderItem={({ item: v, index }) => (
            <Aparecer style={styles.card} retraso={Math.min(index, 8) * 70}>
              {v.foto ? (
                <Rebote onPress={() => setVerFoto(v.foto)} escala={0.9} accessibilityLabel="Ver foto del vehículo">
                  <Image source={uriDeFoto(v.foto)} style={styles.foto} />
                </Rebote>
              ) : (
                <View style={[styles.foto, styles.sinFoto]}><MaterialCommunityIcons name="car-outline" size={32} color={colors.blue} /></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.placa}>{v.placa}</Text>
                <Text style={styles.detalle}>{v.tipo_vehiculo}{v.marca ? ` · ${v.marca}` : ''}</Text>
              </View>
            </Aparecer>
          )}
        />
      )}
      <BotonFlotante texto="Vehículo" onPress={() => navigation.navigate('VehiculoForm')} />
      <VisorFoto visible={!!verFoto} foto={verFoto ?? ''} onCerrar={() => setVerFoto(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 18, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: '900', color: colors.navy },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.white, borderRadius: 16, padding: 12, marginBottom: 10, borderColor: colors.border, borderWidth: 1 },
  foto: { width: 78, height: 78, borderRadius: 14 },
  sinFoto: { backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  placa: { color: colors.navy, fontSize: 19, fontWeight: '900', letterSpacing: 1 },
  detalle: { color: colors.muted, marginTop: 4 },
});
