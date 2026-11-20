import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Chip from '../../components/Chip';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { cantidad, hoyISO, moneda } from '../../utils/formato';

const COLOR_ESTADO: Record<string, string> = { Pendiente: colors.orange, 'En proceso': colors.blue, Terminada: colors.green, Cancelada: colors.red };

export function Estadisticas() {
  const [rango, setRango] = useState<'hoy' | 'mes' | 'anio'>('mes');
  const hoy = hoyISO();
  const desde = rango === 'hoy' ? hoy : rango === 'mes' ? `${hoy.slice(0, 8)}01` : `${hoy.slice(0, 5)}01-01`;
  const hasta = rango === 'anio' ? `${hoy.slice(0, 5)}12-31` : rango === 'mes' ? `${hoy.slice(0, 8)}31` : hoy;

  const { datos: r, cargando, error, recargando, recargar, reintentar } = useCarga<any>(() => api(`/reportes/resumen?desde=${desde}&hasta=${hasta}`), null);

  // Al cambiar el periodo se vuelve a consultar (se omite la primera vez: ya la hace useCarga)
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    reintentar();
  }, [rango]);

  const totalCitas = r ? r.por_estado.reduce((s: number, e: any) => s + e.cantidad, 0) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}>
      <View style={styles.chips}>
        <Chip texto="Hoy" activo={rango === 'hoy'} onPress={() => setRango('hoy')} />
        <Chip texto="Este mes" activo={rango === 'mes'} onPress={() => setRango('mes')} />
        <Chip texto="Este año" activo={rango === 'anio'} onPress={() => setRango('anio')} />
      </View>

      {cargando && !r ? (
        <Cargando />
      ) : error && !r ? (
        <ErrorCarga mensaje={error} onReintentar={reintentar} />
      ) : r ? (
        <>
          <View style={styles.fila}>
            <View style={[styles.caja, { backgroundColor: colors.greenLight }]}>
              <Text style={styles.cajaLabel}>Ingresos pagados</Text>
              <Text style={[styles.cajaValor, { color: colors.green }]}>{moneda(r.ingresos.pagado)}</Text>
            </View>
            <View style={[styles.caja, { backgroundColor: colors.orangeLight }]}>
              <Text style={styles.cajaLabel}>Por cobrar</Text>
              <Text style={[styles.cajaValor, { color: colors.orange }]}>{moneda(r.ingresos.pendiente)}</Text>
            </View>
          </View>
          <View style={styles.fila}>
            <View style={styles.caja}><Text style={styles.cajaLabel}>Clientes</Text><Text style={styles.cajaValor}>{r.totales.clientes}</Text></View>
            <View style={styles.caja}><Text style={styles.cajaLabel}>Vehículos</Text><Text style={styles.cajaValor}>{r.totales.vehiculos}</Text></View>
          </View>

          <Text style={styles.seccion}>Citas por estado ({totalCitas})</Text>
          <View style={styles.tarjeta}>
            {r.por_estado.length ? r.por_estado.map((e: any) => (
              <View key={e.estado} style={{ marginBottom: 10 }}>
                <View style={styles.barraTexto}><Text style={styles.item}>{e.estado}</Text><Text style={styles.itemValor}>{e.cantidad}</Text></View>
                <View style={styles.barraFondo}><View style={[styles.barra, { width: `${(e.cantidad / totalCitas) * 100}%`, backgroundColor: COLOR_ESTADO[e.estado] || colors.blue }]} /></View>
              </View>
            )) : <Text style={styles.vacio}>Sin citas en este periodo.</Text>}
          </View>

          <Text style={styles.seccion}>Servicios más pedidos</Text>
          <View style={styles.tarjeta}>
            {r.servicios_top.length ? r.servicios_top.map((s: any) => (
              <View key={s.nombre} style={styles.linea}><Text style={styles.item}>{s.nombre}</Text><Text style={styles.itemValor}>{s.cantidad}</Text></View>
            )) : <Text style={styles.vacio}>Sin servicios en este periodo.</Text>}
          </View>

          <Text style={styles.seccion}>Productos vendidos</Text>
          <View style={styles.tarjeta}>
            {r.productos_vendidos.length ? r.productos_vendidos.map((p: any) => (
              <View key={p.nombre} style={styles.linea}><Text style={styles.item}>{p.nombre} · {cantidad(p.cantidad)} {p.unidad_medida}</Text><Text style={styles.itemValor}>{moneda(p.total)}</Text></View>
            )) : <Text style={styles.vacio}>Aún no se venden productos en este periodo.</Text>}
          </View>

          <Text style={styles.seccion}>Inventario con stock bajo</Text>
          <View style={styles.tarjeta}>
            {r.bajo_stock.length ? r.bajo_stock.map((p: any) => (
              <View key={p.nombre} style={styles.linea}><Text style={styles.item}>{p.nombre}</Text><Text style={[styles.itemValor, { color: colors.red }]}>{cantidad(p.cantidad)} {p.unidad_medida}</Text></View>
            )) : <Text style={styles.vacio}>Todo el inventario está por encima del mínimo.</Text>}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 34 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  fila: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  caja: { flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  cajaLabel: { color: colors.muted, fontSize: 12 },
  cajaValor: { color: colors.blue, fontSize: 21, fontWeight: '900', marginTop: 4 },
  seccion: { color: colors.navy, fontWeight: '800', fontSize: 15, marginTop: 12, marginBottom: 8 },
  tarjeta: { backgroundColor: colors.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  linea: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 10 },
  item: { color: colors.text, fontSize: 13, flexShrink: 1 },
  itemValor: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  barraTexto: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barraFondo: { height: 8, borderRadius: 4, backgroundColor: colors.blueLight },
  barra: { height: 8, borderRadius: 4 },
  vacio: { color: colors.muted, fontSize: 13 },
});
