import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Badge from '../../components/Badge';
import Boton from '../../components/Boton';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { construirFacturaHtml } from '../../utils/facturaHtml';
import { cantidad, formatFecha, formatHora, moneda, numeroFactura } from '../../utils/formato';
import { avisar } from '../../utils/aviso';

export function Factura({ route }: any) {
  const { id } = route.params;
  const { esAdmin } = useAuth();
  const { datos: c, cargando, error, reintentar } = useCarga<any>(() => api(`/citas/${id}`), null);
  const [generando, setGenerando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function descargarPdf() {
    setGenerando(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: construirFacturaHtml(c) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Factura ${numeroFactura(c.id_cita)}`, UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('PDF generado', uri);
      }
    } catch (e: any) {
      Alert.alert('No se pudo generar el PDF', e.message);
    } finally {
      setGenerando(false);
    }
  }

  async function cambiarPago() {
    setGuardando(true);
    try {
      await api(`/citas/${id}/pago`, { method: 'PUT', body: { estado_pago: c.estado_pago === 'Pagado' ? 'Pendiente' : 'Pagado' } });
      avisar('Estado de pago actualizado');
      await reintentar();
    } catch (e: any) {
      Alert.alert('No se pudo actualizar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error || !c) return <ErrorCarga mensaje={error || 'No se encontró la factura'} onReintentar={reintentar} />;
  const pagada = c.estado_pago === 'Pagado';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hoja}>
        <View style={styles.top}>
          <View>
            <Text style={styles.marca}>Aqua<Text style={{ color: '#28B9F4' }}>Gest</Text></Text>
            <Text style={styles.marcaSub}>Gestor de Lavadero Vehicular</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.marcaSub}>Factura No.</Text>
            <Text style={styles.numero}>{numeroFactura(c.id_cita)}</Text>
          </View>
        </View>

        <Text style={styles.etiqueta}>Cliente</Text>
        <Text style={styles.dato}>{c.cliente}</Text>
        <Text style={styles.datoSub}>{c.cliente_tipo_doc} {c.cliente_documento} · Tel. {c.cliente_telefono}</Text>

        <Text style={styles.etiqueta}>Servicio</Text>
        <Text style={styles.dato}>{formatFecha(c.fecha)} · {formatHora(c.hora)}</Text>
        <Text style={styles.datoSub}>Vehículo {c.placa}{c.marca ? ' · ' + c.marca : ''}{c.empleado ? ` · Atendió ${c.empleado}` : ''}</Text>

        <View style={styles.tabla}>
          <Fila a={c.servicio} b={moneda(c.valor_servicio)} />
          {c.adicionales.map((x: any) => <Fila key={x.id_adicional} a={`${x.nombre} (adicional)`} b={moneda(x.valor)} />)}
          {c.productos.map((p: any) => <Fila key={p.id_productos} a={`${p.nombre} · ${cantidad(p.cantidad)} x ${moneda(p.precio_unitario)}`} b={moneda(p.subtotal)} />)}
        </View>

        <View style={styles.total}>
          <Text style={styles.totalTexto}>Total</Text>
          <Text style={styles.totalValor}>{moneda(c.total)}</Text>
        </View>
        <View style={{ marginTop: 12 }}>
          <Badge texto={c.estado_pago} etiqueta={pagada ? 'PAGADO' : 'PAGO PENDIENTE'} />
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 16 }}>
        <Boton titulo="Descargar / compartir PDF" icono="file-pdf-box" onPress={descargarPdf} cargando={generando} />
        {esAdmin && c.estado === 'Terminada' ? (
          <Boton titulo={pagada ? 'Marcar como pago pendiente' : 'Marcar como pagado'} icono={pagada ? 'cash-remove' : 'cash-check'} tipo={pagada ? 'secundario' : 'exito'} onPress={cambiarPago} cargando={guardando} />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Fila({ a, b }: { a: string; b: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaA}>{a}</Text>
      <Text style={styles.filaB}>{b}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 34 },
  hoja: { backgroundColor: colors.white, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border },
  top: { backgroundColor: colors.navy, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  marca: { color: colors.white, fontSize: 24, fontWeight: '900' },
  marcaSub: { color: '#D8E9FA', fontSize: 11 },
  numero: { color: colors.white, fontSize: 20, fontWeight: '900' },
  etiqueta: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 12 },
  dato: { color: colors.navy, fontWeight: '800', fontSize: 14, marginTop: 3 },
  datoSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tabla: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  filaA: { flex: 1, color: colors.text, fontSize: 13 },
  filaB: { color: colors.navy, fontWeight: '700', fontSize: 13 },
  total: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  totalTexto: { color: colors.navy, fontWeight: '800', fontSize: 17 },
  totalValor: { color: colors.blue, fontWeight: '900', fontSize: 22 },
});
