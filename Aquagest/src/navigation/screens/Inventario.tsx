import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Boton from '../../components/Boton';
import BotonFlotante from '../../components/BotonFlotante';
import Campo from '../../components/Campo';
import Chip from '../../components/Chip';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { Aparecer } from '../../components/animaciones';
import { useAuth } from '../../context/AuthContext';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { cantidad, moneda } from '../../utils/formato';
import { avisar } from '../../utils/aviso';

export function Inventario({ navigation }: any) {
  const { esAdmin } = useAuth();
  const [tipo, setTipo] = useState<'Insumo' | 'Venta'>('Insumo');
  const { datos, cargando, error, recargando, recargar, reintentar } = useCarga<any[]>(() => api('/productos'), []);
  const [mov, setMov] = useState<{ producto: any; tipo: 'Uso' | 'Entrada' } | null>(null);
  const [cant, setCant] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const lista = datos.filter((p) => p.tipo === tipo);

  function abrir(producto: any, t: 'Uso' | 'Entrada') {
    setMov({ producto, tipo: t });
    setCant('');
    setNota('');
  }

  async function guardarMovimiento() {
    const n = Number(cant.replace(',', '.'));
    if (!mov || !(n > 0)) { Alert.alert('Revisa la cantidad', 'Escribe una cantidad mayor a 0.'); return; }
    setGuardando(true);
    try {
      const r = await api(`/productos/${mov.producto.id_productos}/movimiento`, { method: 'POST', body: { tipo: mov.tipo, cantidad: n, nota: nota.trim() } });
      setMov(null);
      avisar(`${r.message}. Quedan ${cantidad(r.cantidad)} ${mov.producto.unidad_medida}`);
      reintentar();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Inventario</Text>
      <Text style={styles.subtitle}>Control de insumos y productos del lavadero</Text>
      <View style={styles.chips}>
        <Chip texto="Insumos de lavado" activo={tipo === 'Insumo'} onPress={() => setTipo('Insumo')} />
        <Chip texto="Para vender" activo={tipo === 'Venta'} onPress={() => setTipo('Venta')} />
      </View>

      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga mensaje={error} onReintentar={reintentar} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(p) => String(p.id_productos)}
          contentContainerStyle={{ paddingBottom: 90, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
          ListEmptyComponent={<Vacio icono="cube-off-outline" texto="No hay productos en esta categoría." />}
          renderItem={({ item: p, index }) => (
            <Aparecer style={[styles.card, p.bajo && { borderColor: colors.red }]} retraso={Math.min(index, 8) * 70}>
              <View style={styles.fila}>
                <View style={[styles.icon, p.tipo === 'Venta' && { backgroundColor: colors.purpleLight }]}>
                  <MaterialCommunityIcons name={p.tipo === 'Venta' ? 'tag-outline' : 'bottle-tonic-outline'} size={26} color={p.tipo === 'Venta' ? colors.purple : colors.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.nombre}</Text>
                  <Text style={styles.muted}>{p.tipo === 'Venta' ? `Precio: ${moneda(p.precio)}` : p.descripcion || 'Disponible en almacén'}</Text>
                  {p.bajo ? <Text style={styles.bajo}>Stock bajo (mínimo {cantidad(p.stock_minimo)})</Text> : null}
                </View>
                <View style={styles.qty}>
                  <Text style={[styles.number, p.bajo && { color: colors.red }]}>{cantidad(p.cantidad)}</Text>
                  <Text style={styles.unit}>{p.unidad_medida}</Text>
                </View>
              </View>
              <View style={styles.acciones}>
                {p.tipo === 'Insumo' ? <Boton titulo="Usar" icono="minus" tipo="secundario" onPress={() => abrir(p, 'Uso')} style={styles.btn} /> : null}
                <Boton titulo="Agregar" icono="plus" tipo="secundario" onPress={() => abrir(p, 'Entrada')} style={styles.btn} />
                {esAdmin ? (
                  <TouchableOpacity style={styles.editar} onPress={() => navigation.navigate('ProductoForm', { producto: p })}>
                    <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.blue} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </Aparecer>
          )}
        />
      )}
      {esAdmin ? <BotonFlotante texto="Producto" onPress={() => navigation.navigate('ProductoForm')} /> : null}

      <Modal visible={!!mov} transparent animationType="fade" onRequestClose={() => setMov(null)}>
        <View style={styles.fondoModal}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{mov?.tipo === 'Uso' ? 'Descontar lo usado' : 'Agregar al inventario'}</Text>
            <Text style={styles.modalSub}>{mov?.producto.nombre} · hay {mov ? cantidad(mov.producto.cantidad) : ''} {mov?.producto.unidad_medida}</Text>
            <Campo label={`Cantidad (${mov?.producto.unidad_medida || ''})`} value={cant} onChangeText={setCant} keyboardType="decimal-pad" placeholder="0" />
            <Campo label="Nota (opcional)" value={nota} onChangeText={setNota} placeholder={mov?.tipo === 'Uso' ? 'Ej: lavado de camioneta' : 'Ej: compra al proveedor'} maxLength={150} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Boton titulo="Cancelar" tipo="secundario" onPress={() => setMov(null)} style={{ flex: 1 }} />
              <Boton titulo={mov?.tipo === 'Uso' ? 'Descontar' : 'Agregar'} tipo={mov?.tipo === 'Uso' ? 'peligro' : 'exito'} onPress={guardarMovimiento} cargando={guardando} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 18, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: '900', color: colors.navy },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 14 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderColor: colors.border, borderWidth: 1 },
  fila: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  muted: { color: colors.muted, fontSize: 11, marginTop: 4 },
  bajo: { color: colors.red, fontSize: 11, fontWeight: '700', marginTop: 3 },
  qty: { alignItems: 'center', minWidth: 60 },
  number: { color: colors.green, fontSize: 20, fontWeight: '900' },
  unit: { color: colors.muted, fontSize: 10 },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  btn: { flex: 1, minHeight: 40 },
  editar: { width: 42, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#9BC7FF' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(10,30,55,0.55)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: colors.white, borderRadius: 20, padding: 18 },
  modalTitulo: { color: colors.navy, fontSize: 19, fontWeight: '900' },
  modalSub: { color: colors.muted, marginTop: 4, marginBottom: 14 },
});
