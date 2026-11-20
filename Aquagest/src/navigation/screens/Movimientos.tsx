import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { cantidad, formatFechaHoraDB } from '../../utils/formato';

const COLOR: Record<string, string> = { Entrada: colors.green, Uso: colors.orange, Venta: colors.blue };
const SIGNO: Record<string, string> = { Entrada: '+', Uso: '-', Venta: '-' };

export function Movimientos() {
  const { datos, cargando, error, recargando, recargar, reintentar } = useCarga<any[]>(() => api('/movimientos'), []);
  if (cargando) return <Cargando />;
  if (error) return <ErrorCarga mensaje={error} onReintentar={reintentar} />;
  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={datos}
      keyExtractor={(m) => String(m.id_movimiento)}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
      ListEmptyComponent={<Vacio icono="history" texto="Aún no hay movimientos de inventario." />}
      renderItem={({ item: m }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.producto}>{m.producto}</Text>
            <Text style={styles.detalle}>{m.tipo} · {m.usuario || 'Usuario eliminado'}</Text>
            {m.nota ? <Text style={styles.detalle}>{m.nota}</Text> : null}
            <Text style={styles.fecha}>{formatFechaHoraDB(m.fecha)}</Text>
          </View>
          <Text style={[styles.cant, { color: COLOR[m.tipo] }]}>{SIGNO[m.tipo]}{cantidad(m.cantidad)} {m.unidad_medida}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  producto: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  detalle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  fecha: { color: '#8CA0B6', fontSize: 11, marginTop: 4 },
  cant: { fontWeight: '900', fontSize: 15 },
});
