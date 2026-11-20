import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Linking, Alert, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Boton from '../../components/Boton';
import { Cargando, ErrorCarga } from '../../components/Estados';
import { Rebote } from '../../components/animaciones';
import { useCarga } from '../../hooks';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { distanciaKm, textoDistancia } from '../../utils/formato';

const SEPARACION = 12;

// Tarjeta del carrusel: la que está en el centro se ve grande y las de los lados se encogen y se apagan
function Tarjeta({ l, indice, desplazamiento, ancho, paso, alVer, alLlegar }: { l: any; indice: number; desplazamiento: SharedValue<number>; ancho: number; paso: number; alVer: () => void; alLlegar: () => void }) {
  const estilo = useAnimatedStyle(() => {
    const entrada = [(indice - 1) * paso, indice * paso, (indice + 1) * paso];
    return {
      opacity: interpolate(desplazamiento.value, entrada, [0.55, 1, 0.55], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(desplazamiento.value, entrada, [0.88, 1, 0.88], Extrapolation.CLAMP) }],
    };
  });
  return (
    <View style={{ width: paso, alignItems: 'center' }}>
      <Animated.View style={[styles.card, { width: ancho }, estilo]}>
        <Text style={styles.nombre} numberOfLines={1}>{l.nombre}</Text>
        <Text style={styles.dir} numberOfLines={2}>{l.direccion}</Text>
        {l.km !== null ? <Text style={styles.dist}>A {textoDistancia(l.km)} de ti</Text> : null}
        <View style={styles.botones}>
          <Boton titulo="Ver" icono="map-marker" tipo="secundario" onPress={alVer} style={styles.btn} />
          <Boton titulo="Cómo llegar" icono="directions" onPress={alLlegar} style={styles.btn} />
        </View>
      </Animated.View>
    </View>
  );
}

function Punto({ indice, desplazamiento, paso }: { indice: number; desplazamiento: SharedValue<number>; paso: number }) {
  const estilo = useAnimatedStyle(() => {
    const entrada = [(indice - 1) * paso, indice * paso, (indice + 1) * paso];
    return {
      width: interpolate(desplazamiento.value, entrada, [8, 22, 8], Extrapolation.CLAMP),
      opacity: interpolate(desplazamiento.value, entrada, [0.3, 1, 0.3], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.punto, estilo]} />;
}

const BOGOTA = { latitude: 4.65, longitude: -74.08, latitudeDelta: 0.15, longitudeDelta: 0.15 };

export function Mapa() {
  const mapa = useRef<MapView>(null);
  const { width: anchoPantalla } = useWindowDimensions();
  const desplazamiento = useSharedValue(0);
  const alDesplazar = useAnimatedScrollHandler((e) => {
    desplazamiento.value = e.contentOffset.x;
  });
  const { datos: lavaderos, cargando, error, reintentar } = useCarga<any[]>(() => api('/lavaderos'), []);
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (!permiso.granted) return;
        const p = await Location.getCurrentPositionAsync({});
        setPos({ latitude: p.coords.latitude, longitude: p.coords.longitude });
      } catch (e) { /* sin ubicación: el mapa funciona igual */ }
    })();
  }, []);

  const conDistancia = lavaderos
    .map((l) => ({ ...l, km: pos ? distanciaKm(pos.latitude, pos.longitude, Number(l.latitud), Number(l.longitud)) : null }))
    .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));

  const enfocar = (lat: number, lng: number) =>
    mapa.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);

  const anchoTarjeta = Math.min(340, anchoPantalla * 0.8);
  const paso = anchoTarjeta + SEPARACION;
  const relleno = Math.max(0, (anchoPantalla - paso) / 2);

  // Al terminar de deslizar el carrusel, el mapa se centra en el lavadero que quedó al medio
  const alTerminarDeslizar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / paso);
    const l = conDistancia[Math.min(conDistancia.length - 1, Math.max(0, i))];
    if (l) enfocar(Number(l.latitud), Number(l.longitud));
  };

  const comoLlegar = (l: any) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}`).catch(() =>
      Alert.alert('No se pudo abrir', 'Instala o abre Google Maps para ver la ruta.')
    );

  if (cargando) return <Cargando />;
  if (error) return <ErrorCarga mensaje={error} onReintentar={reintentar} />;

  const inicial = lavaderos[0]
    ? { latitude: Number(lavaderos[0].latitud), longitude: Number(lavaderos[0].longitud), latitudeDelta: 0.12, longitudeDelta: 0.12 }
    : BOGOTA;

  return (
    <View style={styles.screen}>
      <View style={styles.mapaCaja}>
        <MapView ref={mapa} style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE} initialRegion={inicial} showsUserLocation={!!pos} showsMyLocationButton={false}>
          {lavaderos.map((l) => (
            <Marker key={l.id_lavadero} coordinate={{ latitude: Number(l.latitud), longitude: Number(l.longitud) }} title={l.nombre} description={l.direccion} />
          ))}
        </MapView>
        {pos ? (
          <Rebote style={styles.miUbicacion} onPress={() => enfocar(pos.latitude, pos.longitude)} accessibilityLabel="Mi ubicación">
            <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.blue} />
          </Rebote>
        ) : null}
      </View>

      <View style={styles.carrusel}>
        {conDistancia.length === 0 ? (
          <Text style={styles.vacio}>Aún no hay lavaderos registrados.</Text>
        ) : (
          <>
            <Animated.FlatList
              data={conDistancia}
              keyExtractor={(l: any) => String(l.id_lavadero)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={paso}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={alDesplazar}
              onMomentumScrollEnd={alTerminarDeslizar}
              contentContainerStyle={{ paddingHorizontal: relleno }}
              renderItem={({ item: l, index }: { item: any; index: number }) => (
                <Tarjeta
                  l={l}
                  indice={index}
                  desplazamiento={desplazamiento}
                  ancho={anchoTarjeta}
                  paso={paso}
                  alVer={() => enfocar(Number(l.latitud), Number(l.longitud))}
                  alLlegar={() => comoLlegar(l)}
                />
              )}
            />
            <View style={styles.puntos}>
              {conDistancia.map((l, i) => (
                <Punto key={l.id_lavadero} indice={i} desplazamiento={desplazamiento} paso={paso} />
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  mapaCaja: { flex: 1.2, minHeight: 240 },
  miUbicacion: { position: 'absolute', right: 12, top: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  carrusel: { paddingTop: 14, paddingBottom: 12 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  nombre: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  dir: { color: colors.muted, fontSize: 12, marginTop: 3, minHeight: 30 },
  dist: { color: colors.blue, fontWeight: '700', fontSize: 12, marginTop: 4 },
  botones: { flexDirection: 'row', gap: 8, marginTop: 10 },
  puntos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  punto: { height: 8, borderRadius: 4, backgroundColor: colors.blue },
  btn: { minHeight: 40, paddingHorizontal: 10, flex: 1 },
  vacio: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
