import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Badge from '../../components/Badge';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import Chip from '../../components/Chip';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { cantidad, formatFecha, formatHora, moneda, numeroFactura } from '../../utils/formato';
import { uriDeFoto } from '../../utils/foto';
import { avisar } from '../../utils/aviso';

export function CitaDetalle({ navigation, route }: any) {
  const { id } = route.params;
  const { esCliente, esAdmin, esPersonal } = useAuth();
  const { datos: c, cargando, error, reintentar } = useCarga<any>(() => api(`/citas/${id}`), null);
  const [ocupado, setOcupado] = useState(false);
  const [ventaAbierta, setVentaAbierta] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [productoId, setProductoId] = useState<any>('');
  const [cant, setCant] = useState('1');

  async function accion(fn: () => Promise<any>, exito?: string) {
    setOcupado(true);
    try {
      const r = await fn();
      if (exito || r?.message) avisar(exito || r.message);
      await reintentar();
    } catch (e: any) {
      Alert.alert('No se pudo completar', e.message);
    } finally {
      setOcupado(false);
    }
  }

  const confirmar = (titulo: string, msg: string, fn: () => void) =>
    Alert.alert(titulo, msg, [{ text: 'No', style: 'cancel' }, { text: 'Sí', onPress: fn }]);

  async function abrirVenta() {
    try {
      const todos = await api('/productos');
      const venta = todos.filter((p: any) => p.tipo === 'Venta');
      setProductos(venta);
      setProductoId(venta[0] ? venta[0].id_productos : '');
      setCant('1');
      setVentaAbierta(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function vender() {
    const n = Number(cant.replace(',', '.'));
    if (!productoId || !(n > 0)) { Alert.alert('Revisa los datos', 'Escoge un producto y una cantidad mayor a 0.'); return; }
    setVentaAbierta(false);
    await accion(() => api(`/citas/${id}/productos`, { method: 'POST', body: { fk_pk_id_producto: productoId, cantidad: n } }));
  }

  if (cargando) return <Cargando />;
  if (error || !c) return <ErrorCarga mensaje={error || 'No se encontró la cita'} onReintentar={reintentar} />;

  const horas = (new Date(`${c.fecha}T${c.hora}:00`).getTime() - Date.now()) / 3600000;
  const puedeModificarCliente = c.estado === 'Pendiente' && horas >= 10;
  const pagada = c.estado_pago === 'Pagado';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tarjeta}>
        <View style={styles.encabezado}>
          <View style={{ flex: 1 }}>
            <Text style={styles.servicio}>{c.servicio}</Text>
            <Text style={styles.fecha}>{formatFecha(c.fecha)} · {formatHora(c.hora)}</Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Badge texto={c.estado} />
            {c.estado !== 'Cancelada' ? <Badge texto={c.estado_pago} etiqueta={pagada ? 'Pagado' : 'Pago pendiente'} /> : null}
          </View>
        </View>
        <Fila icono="car-outline" texto={`${c.placa}${c.marca ? ' · ' + c.marca : ''}${c.tipo_vehiculo ? ' (' + c.tipo_vehiculo + ')' : ''}`} />
        {!esCliente ? <Fila icono="account-outline" texto={`${c.cliente} · ${c.cliente_telefono}`} /> : null}
        {c.empleado ? <Fila icono="account-hard-hat-outline" texto={`Operario: ${c.empleado}`} /> : null}
        {c.observaciones ? <Fila icono="text-box-outline" texto={c.observaciones} /> : null}
        {c.vehiculo_foto ? <Image source={uriDeFoto(c.vehiculo_foto)} style={styles.foto} resizeMode="cover" /> : null}
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.seccion}>Detalle de la factura No. {numeroFactura(c.id_cita)}</Text>
        <Linea nombre={c.servicio} valor={moneda(c.valor_servicio)} />
        {c.adicionales.map((a: any) => <Linea key={a.id_adicional} nombre={`${a.nombre} (adicional)`} valor={moneda(a.valor)} />)}
        {c.productos.map((p: any) => (
          <View key={p.id_productos} style={styles.linea}>
            <Text style={styles.lineaNombre}>{p.nombre} · {cantidad(p.cantidad)} x {moneda(p.precio_unitario)}</Text>
            <Text style={styles.lineaValor}>{moneda(p.subtotal)}</Text>
            {esPersonal && !pagada ? (
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={() => confirmar('Quitar producto', `¿Quitar ${p.nombre} de la factura? El stock se devuelve al inventario.`, () => accion(() => api(`/citas/${id}/productos/${p.id_productos}`, { method: 'DELETE' })))}>
                <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.red} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        <View style={styles.total}>
          <Text style={styles.totalTexto}>Total</Text>
          <Text style={styles.totalValor}>{moneda(c.total)}</Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {esPersonal && c.estado === 'Pendiente' ? <Boton titulo="Iniciar servicio" icono="play" onPress={() => accion(() => api(`/citas/${id}/estado`, { method: 'PUT', body: { estado: 'En proceso' } }))} cargando={ocupado} /> : null}
        {esPersonal && c.estado === 'En proceso' ? <Boton titulo="Finalizar servicio" icono="check-circle-outline" tipo="exito" onPress={() => accion(() => api(`/citas/${id}/estado`, { method: 'PUT', body: { estado: 'Terminada' } }))} cargando={ocupado} /> : null}
        {esPersonal && ['En proceso', 'Terminada'].includes(c.estado) && !pagada ? <Boton titulo="Vender un producto" icono="cart-plus" tipo="secundario" onPress={abrirVenta} deshabilitado={ocupado} /> : null}
        {c.estado !== 'Cancelada' ? <Boton titulo="Ver factura / descargar PDF" icono="file-pdf-box" tipo="secundario" onPress={() => navigation.navigate('Factura', { id })} /> : null}
        {esAdmin && c.estado === 'Terminada' ? (
          <Boton
            titulo={pagada ? 'Marcar como pago pendiente' : 'Marcar como pagado'}
            icono={pagada ? 'cash-remove' : 'cash-check'}
            tipo={pagada ? 'secundario' : 'exito'}
            onPress={() => accion(() => api(`/citas/${id}/pago`, { method: 'PUT', body: { estado_pago: pagada ? 'Pendiente' : 'Pagado' } }))}
            cargando={ocupado}
          />
        ) : null}
        {(esCliente || esAdmin) && c.estado === 'Pendiente' && (esAdmin || puedeModificarCliente) ? (
          <>
            <Boton titulo="Reprogramar" icono="calendar-edit" tipo="secundario" onPress={() => navigation.navigate('AgendarCita', { cita: c })} />
            <Boton titulo="Cancelar cita" icono="calendar-remove" tipo="peligro" onPress={() => confirmar('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', () => accion(() => api(`/citas/${id}/cancelar`, { method: 'PUT' })))} cargando={ocupado} />
          </>
        ) : null}
        {esCliente && c.estado === 'Pendiente' && !puedeModificarCliente ? (
          <Text style={styles.nota}>Solo puedes cancelar o reprogramar con mínimo 10 horas de anticipación.</Text>
        ) : null}
      </View>

      <Modal visible={ventaAbierta} transparent animationType="fade" onRequestClose={() => setVentaAbierta(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Vender un producto</Text>
            {productos.length ? (
              <>
                <View style={styles.chips}>
                  {productos.map((p) => (
                    <Chip key={p.id_productos} texto={`${p.nombre} · ${moneda(p.precio)}`} activo={productoId === p.id_productos} deshabilitado={Number(p.cantidad) <= 0} onPress={() => setProductoId(p.id_productos)} />
                  ))}
                </View>
                <Text style={styles.nota}>Stock: {cantidad((productos.find((p) => p.id_productos === productoId) || {}).cantidad || 0)}</Text>
                <Campo label="Cantidad" value={cant} onChangeText={setCant} keyboardType="decimal-pad" />
              </>
            ) : (
              <Text style={styles.nota}>No hay productos para vender. El administrador puede crearlos en Inventario.</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Boton titulo="Cancelar" tipo="secundario" onPress={() => setVentaAbierta(false)} style={{ flex: 1 }} />
              {productos.length ? <Boton titulo="Agregar" onPress={vender} style={{ flex: 1 }} /> : null}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Fila({ icono, texto }: { icono: string; texto: string }) {
  return (
    <View style={styles.fila}>
      <MaterialCommunityIcons name={icono as any} size={19} color={colors.blue} />
      <Text style={styles.filaTexto}>{texto}</Text>
    </View>
  );
}

function Linea({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <View style={styles.linea}>
      <Text style={styles.lineaNombre}>{nombre}</Text>
      <Text style={styles.lineaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 34, gap: 14 },
  tarjeta: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  servicio: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  fecha: { color: colors.muted, marginTop: 3 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  filaTexto: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  foto: { width: '100%', height: 190, borderRadius: 14, marginTop: 12, backgroundColor: colors.blueLight },
  seccion: { color: colors.navy, fontWeight: '800', marginBottom: 8 },
  linea: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  lineaNombre: { flex: 1, color: colors.text, fontSize: 13 },
  lineaValor: { color: colors.navy, fontWeight: '700', fontSize: 13 },
  total: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  totalTexto: { color: colors.navy, fontWeight: '800', fontSize: 16 },
  totalValor: { color: colors.blue, fontWeight: '900', fontSize: 20 },
  nota: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(10,30,55,0.55)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: colors.white, borderRadius: 20, padding: 18 },
  modalTitulo: { color: colors.navy, fontSize: 19, fontWeight: '900', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
});
