import React from 'react';
import { View, Text, StyleSheet, FlatList, Linking } from 'react-native';
import Boton from '../../components/Boton';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { Aparecer } from '../../components/animaciones';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';

// Versión del mapa para el navegador: react-native-maps solo existe en Android e iOS,
// así que aquí se muestra la lista de lavaderos con enlaces a Google Maps.
export function Mapa() {
  const { datos, cargando, error, reintentar } = useCarga<any[]>(() => api('/lavaderos'), []);
  if (cargando) return <Cargando />;
  if (error) return <ErrorCarga mensaje={error} onReintentar={reintentar} />;
  return (
    <View style={styles.screen}>
      <Text style={styles.aviso}>El mapa interactivo está disponible en la app del celular (Android / iOS).</Text>
      <FlatList
        data={datos}
        keyExtractor={(l) => String(l.id_lavadero)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: l, index }) => (
          <Aparecer style={styles.card} retraso={Math.min(index, 8) * 70}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nombre}>{l.nombre}</Text>
              <Text style={styles.dir}>{l.direccion}</Text>
            </View>
            <Boton titulo="Abrir en Google Maps" icono="map-marker" onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${l.latitud},${l.longitud}`)} style={{ minHeight: 40 }} />
          </Aparecer>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  aviso: { backgroundColor: colors.blueLight, color: colors.navy, padding: 12, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  nombre: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  dir: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
