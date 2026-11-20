import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Badge from '../../components/Badge';
import Chip from '../../components/Chip';
import BotonFlotante from '../../components/BotonFlotante';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { Rebote } from '../../components/animaciones';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { formatFecha, formatHora, hoyISO, moneda } from '../../utils/formato';

export function Citas({ navigation }: any) {
  const { usuario, esCliente, esEmpleado } = useAuth();
  const [filtro, setFiltro] = useState<'hoy' | 'proximas' | 'anteriores'>(esCliente ? 'proximas' : 'hoy');
  const [soloMias, setSoloMias] = useState(esEmpleado);
  const { datos, cargando, error, recargando, recargar, reintentar } = useCarga<any[]>(() => api('/citas'), []);

  const hoy = hoyISO();
  const lista = datos
    .filter((c) => (filtro === 'hoy' ? c.fecha === hoy : filtro === 'proximas' ? c.fecha >= hoy : c.fecha < hoy))
    .filter((c) => !esEmpleado || !soloMias || c.fk_pk_id_empleado === usuario?.id_usuario)
    .sort((a, b) => {
      const x = `${a.fecha} ${a.hora}`;
      const y = `${b.fecha} ${b.hora}`;
      return filtro === 'anteriores' ? (x < y ? 1 : -1) : x < y ? -1 : 1;
    });

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{esCliente ? 'Mis citas' : 'Agenda de servicios'}</Text>
      <Text style={styles.subtitle}>{esCliente ? 'Tus lavados agendados' : 'Turnos, facturas y estado de los servicios'}</Text>
      <View style={styles.chips}>
        <Chip texto="Hoy" activo={filtro === 'hoy'} onPress={() => setFiltro('hoy')} />
        <Chip texto="Próximas" activo={filtro === 'proximas'} onPress={() => setFiltro('proximas')} />
        <Chip texto="Anteriores" activo={filtro === 'anteriores'} onPress={() => setFiltro('anteriores')} />
        {esEmpleado ? <Chip texto="Solo mías" activo={soloMias} onPress={() => setSoloMias(!soloMias)} /> : null}
      </View>

      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga mensaje={error} onReintentar={reintentar} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(c) => String(c.id_cita)}
          contentContainerStyle={{ paddingBottom: 90, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
          ListEmptyComponent={<Vacio icono="calendar-blank-outline" texto={filtro === 'hoy' ? 'No hay citas para hoy.' : filtro === 'proximas' ? 'No hay citas próximas.' : 'Aún no hay citas anteriores.'} />}
          renderItem={({ item: c, index }) => (
            <Rebote style={styles.card} escala={0.97} entrada={Math.min(index, 8) * 70} onPress={() => navigation.navigate('CitaDetalle', { id: c.id_cita })}>
              <View style={styles.hora}>
                <Text style={styles.horaTexto}>{formatHora(c.hora)}</Text>
                <Text style={styles.fecha}>{formatFecha(c.fecha)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.servicio}>{c.servicio}</Text>
                <Text style={styles.detalle}>{c.placa}{c.marca ? ` · ${c.marca}` : ''}</Text>
                {!esCliente ? <Text style={styles.detalle}>Cliente: {c.cliente}</Text> : null}
                {!esCliente && c.empleado ? <Text style={styles.detalle}>Operario: {c.empleado}</Text> : null}
                <View style={styles.fila}>
                  <Badge texto={c.estado} />
                  {c.estado !== 'Cancelada' ? <Badge texto={c.estado_pago} etiqueta={c.estado_pago === 'Pagado' ? 'Pagado' : 'Pago pendiente'} /> : null}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.total}>{moneda(c.total)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
              </View>
            </Rebote>
          )}
        />
      )}
      <BotonFlotante texto="Agendar" icono="calendar-plus" onPress={() => navigation.navigate('AgendarCita')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 18, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: '900', color: colors.navy },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderColor: colors.border, borderWidth: 1, gap: 12 },
  hora: { width: 78, alignItems: 'center', backgroundColor: colors.blueLight, borderRadius: 12, paddingVertical: 10 },
  horaTexto: { color: colors.blue, fontWeight: '900', fontSize: 13 },
  fecha: { color: colors.muted, fontSize: 10, marginTop: 3, textAlign: 'center' },
  servicio: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  detalle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  fila: { flexDirection: 'row', gap: 6, marginTop: 7, flexWrap: 'wrap' },
  total: { color: colors.navy, fontWeight: '800', fontSize: 13 },
});
