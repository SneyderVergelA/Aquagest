import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import Chip from '../../components/Chip';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { avisar } from '../../utils/aviso';

export function ProductoForm({ navigation, route }: any) {
  const p = route.params?.producto;
  const editando = !!p;
  const [nombre, setNombre] = useState(p?.nombre || '');
  const [descripcion, setDescripcion] = useState(p?.descripcion || '');
  const [tipo, setTipo] = useState<'Insumo' | 'Venta'>(p?.tipo || 'Insumo');
  const [unidad, setUnidad] = useState(p?.unidad_medida || '');
  const [inicial, setInicial] = useState('');
  const [precio, setPrecio] = useState(p ? String(Number(p.precio)) : '');
  const [minimo, setMinimo] = useState(p ? String(Number(p.stock_minimo)) : '');
  const [guardando, setGuardando] = useState(false);

  const num = (t: string) => Number(String(t).replace(',', '.')) || 0;

  async function guardar() {
    if (!nombre.trim() || !unidad.trim()) { Alert.alert('Faltan datos', 'El nombre y la unidad de medida son obligatorios.'); return; }
    if (tipo === 'Venta' && !(num(precio) > 0)) { Alert.alert('Falta el precio', 'Un producto para vender necesita un precio mayor a 0.'); return; }
    setGuardando(true);
    try {
      const cuerpo: any = { nombre, descripcion, tipo, unidad_medida: unidad, precio: num(precio), stock_minimo: num(minimo) };
      if (editando) {
        await api(`/productos/${p.id_productos}`, { method: 'PUT', body: cuerpo });
      } else {
        await api('/productos', { method: 'POST', body: { ...cuerpo, cantidad: num(inicial) } });
      }
      avisar(editando ? 'Producto actualizado' : 'Producto creado');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>Tipo de producto</Text>
        <View style={styles.chips}>
          <Chip texto="Insumo de lavado" activo={tipo === 'Insumo'} onPress={() => setTipo('Insumo')} />
          <Chip texto="Para vender" activo={tipo === 'Venta'} onPress={() => setTipo('Venta')} />
        </View>
        <Campo label="Nombre" icon="tag-outline" value={nombre} onChangeText={setNombre} maxLength={50} autoCapitalize="words" />
        <Campo label="Descripción (opcional)" value={descripcion} onChangeText={setDescripcion} maxLength={100} />
        <Campo label="Unidad de medida" icon="scale" value={unidad} onChangeText={setUnidad} placeholder="litros, unidades, kg..." maxLength={20} autoCapitalize="none" />
        {!editando ? <Campo label="Cantidad inicial" icon="cube-outline" value={inicial} onChangeText={setInicial} keyboardType="decimal-pad" placeholder="0" /> : null}
        {tipo === 'Venta' ? <Campo label="Precio de venta (COP)" icon="cash" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad" placeholder="0" /> : null}
        <Campo label="Stock mínimo (alerta)" icon="alert-outline" value={minimo} onChangeText={setMinimo} keyboardType="decimal-pad" placeholder="0" />
        {editando ? <Text style={styles.nota}>Para cambiar la cantidad en inventario usa “Agregar” o “Usar” en la lista, así queda registrado en el historial.</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Boton titulo="Cancelar" tipo="secundario" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Boton titulo="Guardar" icono="content-save-outline" onPress={guardar} cargando={guardando} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  form: { backgroundColor: colors.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.navy, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  nota: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 14 },
});
