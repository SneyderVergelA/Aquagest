import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { NOMBRE_ROL, useAuth } from '../context/AuthContext';

import { Login } from './screens/Login';
import { CrearCuenta } from './screens/CrearCuenta';
import { Recuperar } from './screens/Recuperar';
import { Home } from './screens/Home';
import { Citas } from './screens/Citas';
import { Vehiculos } from './screens/Vehiculos';
import { Inventario } from './screens/Inventario';
import { Usuarios } from './screens/Usuarios';
import { Registro } from './screens/Registro';
import { Mapa } from './screens/Mapa';
import { AgendarCita } from './screens/AgendarCita';
import { CitaDetalle } from './screens/CitaDetalle';
import { Factura } from './screens/Factura';
import { VehiculoForm } from './screens/VehiculoForm';
import { ProductoForm } from './screens/ProductoForm';
import { Movimientos } from './screens/Movimientos';
import { UsuarioForm } from './screens/UsuarioForm';
import { Estadisticas } from './screens/Estadisticas';
import { avisar } from '../utils/aviso';
import { BarraCarga, Spinner } from '../components/animaciones';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const estiloEncabezado = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '800' as const },
};

const ICONOS: Record<string, string> = {
  Inicio: 'view-dashboard-outline',
  Citas: 'calendar-clock',
  Vehiculos: 'car-outline',
  MapaTab: 'map-marker-radius-outline',
  Inventario: 'cube-outline',
  Usuarios: 'account-group-outline',
  Registro: 'clipboard-text-outline',
};

// Las pestañas de abajo cambian según el rol de quien inició sesión
function Pestanas() {
  const { esCliente, esAdmin, esPersonal } = useAuth();
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false, // el encabezado lo muestra el Drawer
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 62, paddingBottom: 7, paddingTop: 5, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name={ICONOS[route.name] as any} color={color} size={size} />,
      })}>
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Citas" component={Citas} options={{ tabBarLabel: esCliente ? 'Mis citas' : 'Citas' }} />
      {esCliente ? <Tab.Screen name="Vehiculos" component={Vehiculos} options={{ tabBarLabel: 'Vehículos' }} /> : null}
      {esCliente ? <Tab.Screen name="MapaTab" component={Mapa} options={{ tabBarLabel: 'Mapa' }} /> : null}
      {esPersonal ? <Tab.Screen name="Inventario" component={Inventario} /> : null}
      {esAdmin ? <Tab.Screen name="Usuarios" component={Usuarios} /> : null}
      {esPersonal ? <Tab.Screen name="Registro" component={Registro} /> : null}
    </Tab.Navigator>
  );
}

function ContenidoDrawer(props: any) {
  const { usuario, esAdmin, esPersonal, cerrarSesion } = useAuth();
  const ir = (pantalla: string) => { props.navigation.closeDrawer(); props.navigation.navigate(pantalla); };
  const icono = (nombre: string) => ({ color, size }: any) => <MaterialCommunityIcons name={nombre as any} color={color} size={size} />;
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={styles.header}>
        <View style={styles.logo}><MaterialCommunityIcons name="car-wash" size={34} color={colors.white} /></View>
        <Text style={styles.brand}>AquaGest</Text>
        <Text style={styles.caption}>Gestor de Lavadero Vehicular</Text>
        <Text style={styles.user}>{usuario ? `${usuario.nombre} ${usuario.apellido}` : ''}</Text>
        <Text style={styles.rol}>{usuario ? NOMBRE_ROL[usuario.fk_pk_id_rol] : ''}</Text>
      </View>
      
      <DrawerItem label="Mapa de lavaderos" icon={icono('map-marker-radius-outline')} labelStyle={styles.itemLabel} onPress={() => ir('Mapa')} />
      {esAdmin ? <DrawerItem label="Estadísticas" icon={icono('chart-bar')} labelStyle={styles.itemLabel} onPress={() => ir('Estadisticas')} /> : null}
      {esPersonal ? <DrawerItem label="Historial de inventario" icon={icono('history')} labelStyle={styles.itemLabel} onPress={() => ir('Movimientos')} /> : null}
      <DrawerItem label="Cerrar sesión" icon={icono('logout')} labelStyle={styles.itemLabel} onPress={async () => { await cerrarSesion(); avisar('Sesión cerrada', 'info'); }} />
    </DrawerContentScrollView>
  );
}

function TituloEncabezado() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <MaterialCommunityIcons name="car-wash" size={26} color="#28B9F4" />
      <View>
        <Text style={{ color: colors.white, fontSize: 18, fontWeight: '900' }}>Aqua<Text style={{ color: '#28B9F4' }}>Gest</Text></Text>
        <Text style={{ color: '#D8E9FA', fontSize: 9 }}>Gestor de Lavadero Vehicular</Text>
      </View>
    </View>
  );
}

function Principal() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <ContenidoDrawer {...props} />}
      screenOptions={{
        ...estiloEncabezado,
        headerTitle: () => <TituloEncabezado />,
        headerRight: () => <MaterialCommunityIcons name="account-circle" size={32} color={colors.white} style={{ marginRight: 14 }} />,
        drawerActiveTintColor: colors.blue,
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: { fontWeight: '700' },
        drawerStyle: { backgroundColor: colors.white, width: 285 },
      }}>
      <Drawer.Screen
        name="InicioDrawer"
        component={Pestanas}
        options={{ title: 'Inicio', drawerIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} /> }}
      />
    </Drawer.Navigator>
  );
}

function Rutas() {
  const { usuario } = useAuth();
  return (
    <Stack.Navigator screenOptions={estiloEncabezado}>
      {!usuario ? (
        <>
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="CrearCuenta" component={CrearCuenta} options={{ title: 'Crear cuenta' }} />
          <Stack.Screen name="Recuperar" component={Recuperar} options={{ title: 'Recuperar contraseña' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Principal" component={Principal} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="Mapa" component={Mapa} options={{ title: 'Lavaderos cercanos' }} />
          <Stack.Screen name="AgendarCita" component={AgendarCita} options={{ title: 'Agendar cita' }} />
          <Stack.Screen name="CitaDetalle" component={CitaDetalle} options={{ title: 'Detalle de la cita' }} />
          <Stack.Screen name="Factura" component={Factura} options={{ title: 'Factura' }} />
          <Stack.Screen name="VehiculoForm" component={VehiculoForm} options={{ title: 'Registrar vehículo' }} />
          <Stack.Screen name="ProductoForm" component={ProductoForm} options={{ title: 'Producto' }} />
          <Stack.Screen name="Movimientos" component={Movimientos} options={{ title: 'Historial de inventario' }} />
          <Stack.Screen name="UsuarioForm" component={UsuarioForm} options={{ title: 'Usuario' }} />
          <Stack.Screen name="Estadisticas" component={Estadisticas} options={{ title: 'Estadísticas' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export function Navigation() {
  const { cargando } = useAuth();
  if (cargando) {
    return (
      <View style={styles.splash}>
        <MaterialCommunityIcons name="car-wash" size={72} color={colors.white} />
        <View style={{ marginTop: 24 }}><Spinner tamano={56} color={colors.white} /></View>
        <View style={{ marginTop: 22 }}><BarraCarga ancho={180} color="#28B9F4" /></View>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Rutas />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.navy, padding: 22, paddingTop: 50, marginBottom: 8 },
  logo: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#245987', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  brand: { color: colors.white, fontSize: 25, fontWeight: '900' },
  caption: { color: '#D8E9FA', fontSize: 11, marginTop: 3 },
  user: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: 20 },
  rol: { color: '#D8E9FA', fontSize: 12, marginTop: 2 },
  itemLabel: { fontWeight: '700', color: colors.text },
});
