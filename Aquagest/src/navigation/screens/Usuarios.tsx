import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BotonFlotante from '../../components/BotonFlotante';
import Chip from '../../components/Chip';
import { Cargando, ErrorCarga, Vacio } from '../../components/Estados';
import { Rebote } from '../../components/animaciones';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';

const ICONO: Record<number, string> = { 1: 'shield-account-outline', 2: 'car-wrench', 3: 'account-outline' };

export function Usuarios({ navigation }: any) {
  const [rol, setRol] = useState<number>(0);
  const { datos, cargando, error, recargando, recargar, reintentar } = useCarga<any[]>(() => api('/usuarios'), []);
  const lista = datos.filter((u) => !rol || u.fk_pk_id_rol === rol);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Usuarios</Text>
      <Text style={styles.subtitle}>Personas con acceso al sistema</Text>
      <View style={styles.chips}>
        <Chip texto="Todos" activo={rol === 0} onPress={() => setRol(0)} />
        <Chip texto="Administradores" activo={rol === 1} onPress={() => setRol(1)} />
        <Chip texto="Empleados" activo={rol === 2} onPress={() => setRol(2)} />
        <Chip texto="Clientes" activo={rol === 3} onPress={() => setRol(3)} />
      </View>
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorCarga mensaje={error} onReintentar={reintentar} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(u) => String(u.id_usuario)}
          contentContainerStyle={{ paddingBottom: 90, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={recargando} onRefresh={recargar} />}
          ListEmptyComponent={<Vacio icono="account-off-outline" texto="No hay usuarios con ese rol." />}
          renderItem={({ item: u, index }) => (
            <Rebote style={styles.card} escala={0.97} entrada={Math.min(index, 8) * 70} onPress={() => navigation.navigate('UsuarioForm', { usuario: u })}>
              <View style={styles.avatar}><MaterialCommunityIcons name={ICONO[u.fk_pk_id_rol] as any} size={26} color={colors.blue} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.nombre} {u.apellido}</Text>
                <Text style={styles.email}>{u.correo}</Text>
                <Text style={styles.role}>{u.nombre_rol}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Rebote>
          )}
        />
      )}
      <BotonFlotante texto="Usuario" icono="account-plus-outline" onPress={() => navigation.navigate('UsuarioForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 18, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: '900', color: colors.navy },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 15, marginBottom: 10, borderColor: colors.border, borderWidth: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  name: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  email: { color: colors.muted, fontSize: 11, marginTop: 3 },
  role: { color: colors.blue, fontSize: 11, fontWeight: '800', marginTop: 5 },
});
