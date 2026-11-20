import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ModuleCard from '../../components/ModuleCard';
import { Aparecer } from '../../components/animaciones';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { hoyISO, moneda } from '../../utils/formato';

type Stats = { a: string | number; b: string | number; la: string; lb: string };
const SIN_DATOS: Stats = { a: '-', b: '-', la: '', lb: '' };

export function Home({ navigation }: any) {
  const { usuario, esCliente, esAdmin } = useAuth();
  const fecha = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  const { datos, recargando, recargar } = useCarga<Stats>(async () => {
    const hoy = hoyISO();
    if (esCliente) {
      const [citas, vehiculos] = await Promise.all([api('/citas'), api('/vehiculos')]);
      const proximas = citas.filter((c: any) => c.fecha >= hoy && (c.estado === 'Pendiente' || c.estado === 'En proceso'));
      return { a: proximas.length, b: vehiculos.length, la: 'Citas próximas', lb: 'Mis vehículos' };
    }
    if (esAdmin) {
      const [citasHoy, resumen] = await Promise.all([
        api(`/citas?desde=${hoy}&hasta=${hoy}`),
        api(`/reportes/resumen?desde=${hoy.slice(0, 8)}01&hasta=${hoy}`),
      ]);
      return { a: citasHoy.filter((c: any) => c.estado !== 'Cancelada').length, b: moneda(resumen.ingresos.pagado), la: 'Citas de hoy', lb: 'Ingresos pagados del mes' };
    }
    const [citasHoy, productos] = await Promise.all([api(`/citas?desde=${hoy}&hasta=${hoy}`), api('/productos')]);
    const mias = citasHoy.filter((c: any) => c.fk_pk_id_empleado === usuario?.id_usuario && c.estado !== 'Cancelada');
    return { a: mias.length, b: productos.filter((p: any) => p.bajo).length, la: 'Mis servicios de hoy', lb: 'Productos con stock bajo' };
  }, SIN_DATOS);

  const modulos = esCliente
    ? [
        { title: 'Agendar cita', description: 'Reserva tu lavado en la franja que prefieras.', icon: 'calendar-plus', color: colors.brightBlue, tint: colors.blueLight, ir: () => navigation.navigate('AgendarCita') },
        { title: 'Mis citas', description: 'Consulta, cancela o reprograma tus citas.', icon: 'calendar-clock', color: colors.green, tint: colors.greenLight, ir: () => navigation.navigate('Citas') },
        { title: 'Mis vehículos', description: 'Registra tus vehículos y su foto.', icon: 'car-outline', color: colors.purple, tint: colors.purpleLight, ir: () => navigation.navigate('Vehiculos') },
        { title: 'Mapa', description: 'Encuentra los lavaderos más cercanos.', icon: 'map-marker-radius-outline', color: colors.orange, tint: colors.orangeLight, ir: () => navigation.navigate('Mapa') },
      ]
    : esAdmin
    ? [
        { title: 'Estadísticas', description: 'Consulta reportes y datos del lavadero.', icon: 'chart-bar', color: colors.brightBlue, tint: colors.blueLight, ir: () => navigation.navigate('Estadisticas') },
        { title: 'Citas', description: 'Agenda, facturas y estado de los pagos.', icon: 'calendar-clock', color: colors.green, tint: colors.greenLight, ir: () => navigation.navigate('Citas') },
        { title: 'Inventario', description: 'Gestiona insumos y productos.', icon: 'cube-outline', color: colors.purple, tint: colors.purpleLight, ir: () => navigation.navigate('Inventario') },
        { title: 'Usuarios', description: 'Administra los usuarios del sistema.', icon: 'account-group-outline', color: colors.orange, tint: colors.orangeLight, ir: () => navigation.navigate('Usuarios') },
        { title: 'Registro', description: 'Crea nuevos registros de clientes.', icon: 'clipboard-plus-outline', color: colors.brightBlue, tint: colors.blueLight, ir: () => navigation.navigate('Registro') },
        { title: 'Mapa', description: 'Lavaderos que usan AquaGest.', icon: 'map-marker-radius-outline', color: colors.green, tint: colors.greenLight, ir: () => navigation.navigate('Mapa') },
      ]
    : [
        { title: 'Servicios', description: 'Inicia, finaliza y cobra tus servicios del día.', icon: 'car-wash', color: colors.brightBlue, tint: colors.blueLight, ir: () => navigation.navigate('Citas') },
        { title: 'Inventario', description: 'Descuenta lo que usas o agrega stock.', icon: 'cube-outline', color: colors.green, tint: colors.greenLight, ir: () => navigation.navigate('Inventario') },
        { title: 'Registro', description: 'Registra clientes y sus vehículos.', icon: 'clipboard-plus-outline', color: colors.orange, tint: colors.orangeLight, ir: () => navigation.navigate('Registro') },
        { title: 'Agendar cita', description: 'Agenda un lavado para un cliente.', icon: 'calendar-plus', color: colors.purple, tint: colors.purpleLight, ir: () => navigation.navigate('AgendarCita') },
      ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}>
      <Aparecer style={styles.greeting}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hola, {usuario?.nombre}</Text>
          <Text style={styles.sub}>¿Qué deseas hacer hoy?</Text>
        </View>
        <View style={styles.date}>
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.navy} />
          <Text style={styles.dateText}>{fecha}</Text>
        </View>
      </Aparecer>
      <View style={styles.statsRow}>
        <View style={styles.miniStat}><Text style={styles.miniNumber}>{datos.a}</Text><Text style={styles.miniLabel}>{datos.la}</Text></View>
        <View style={styles.miniStat}><Text style={[styles.miniNumber, typeof datos.b === 'string' && datos.b.length > 6 && { fontSize: 19, paddingVertical: 3 }]}>{datos.b}</Text><Text style={styles.miniLabel}>{datos.lb}</Text></View>
      </View>
      <View style={styles.grid}>
        {modulos.map((m, i) => (
          <ModuleCard key={m.title} indice={i} title={m.title} description={m.description} icon={m.icon} color={m.color} tint={m.tint} onPress={m.ir} />
        ))}
      </View>
      <View style={styles.footer}>
        <MaterialCommunityIcons name="car-wash" size={28} color={colors.blue} />
        <Text style={styles.footerText}>Un mejor control, un servicio impecable</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 28 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 7, paddingVertical: 15 },
  hello: { fontSize: 23, fontWeight: '800', color: colors.navy },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  date: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dateText: { color: colors.navy, fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  miniStat: { flex: 1, backgroundColor: colors.white, borderRadius: 15, padding: 14, borderWidth: 1, borderColor: colors.border },
  miniNumber: { fontSize: 25, fontWeight: '900', color: colors.blue },
  miniLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  footer: { alignItems: 'center', marginTop: 18 },
  footerText: { color: colors.muted, fontSize: 12, marginTop: 6 },
});
