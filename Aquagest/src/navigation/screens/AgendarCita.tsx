import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import Chip from '../../components/Chip';
import Selector from '../../components/Selector';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Spinner } from '../../components/animaciones';
import { colors } from '../../theme/colors';
import { diaSemana, distanciaKm, fechaISO, formatFecha, formatHora, hoyISO, mesCorto, moneda, sumarDias, textoDistancia } from '../../utils/formato';
import { avisar } from '../../utils/aviso';

export function AgendarCita({ navigation, route }: any) {
  const { esCliente } = useAuth();
  const citaOriginal = route.params?.cita; // si viene, la pantalla funciona en modo "reprogramar"
  const reprogramando = !!citaOriginal;

  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState<any>(route.params?.clienteId || '');
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [vehiculoId, setVehiculoId] = useState<any>('');
  const [servicios, setServicios] = useState<any[]>([]);
  const [adicionales, setAdicionales] = useState<any[]>([]);
  const [servicioId, setServicioId] = useState<any>('');
  const [extras, setExtras] = useState<number[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const dias = useMemo(() => Array.from({ length: 14 }, (_, i) => sumarDias(new Date(), i)), []);
  const [fecha, setFecha] = useState(hoyISO());
  const [slots, setSlots] = useState<any[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [hora, setHora] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cercano, setCercano] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: reprogramando ? 'Reprogramar cita' : 'Agendar cita' });
  }, [navigation, reprogramando]);

  // Catálogos (servicios, adicionales y, para el personal, la lista de clientes)
  useEffect(() => {
    if (reprogramando) return;
    api('/servicios').then((s) => { setServicios(s); if (s[0]) setServicioId(s[0].id_servicio); }).catch(() => {});
    api('/adicionales').then(setAdicionales).catch(() => {});
    if (!esCliente) api('/clientes').then(setClientes).catch(() => {});
  }, [esCliente, reprogramando]);

  // Vehículos del cliente (se recargan al volver de registrar uno nuevo)
  useFocusEffect(
    useCallback(() => {
      if (reprogramando) return;
      if (!esCliente && !clienteId) { setVehiculos([]); return; }
      api(esCliente ? '/vehiculos' : `/vehiculos?cliente=${clienteId}`)
        .then((v) => {
          setVehiculos(v);
          setVehiculoId((prev: any) => (v.some((x: any) => x.id_vehiculo === prev) ? prev : v[0] ? v[0].id_vehiculo : ''));
        })
        .catch(() => {});
    }, [clienteId, esCliente, reprogramando])
  );

  // Franjas disponibles del día elegido
  useEffect(() => {
    let vivo = true;
    setCargandoSlots(true);
    setHora('');
    api(`/citas/disponibilidad?fecha=${fecha}${reprogramando ? `&excluir=${citaOriginal.id_cita}` : ''}`)
      .then((s) => { if (vivo) setSlots(s); })
      .catch(() => { if (vivo) setSlots([]); })
      .finally(() => { if (vivo) setCargandoSlots(false); });
    return () => { vivo = false; };
  }, [fecha, reprogramando, citaOriginal]);

  // Lavadero más cercano (GPS)
  useEffect(() => {
    if (reprogramando || !esCliente) return;
    (async () => {
      try {
        const permiso = await Location.requestForegroundPermissionsAsync();
        if (!permiso.granted) return;
        const [lavaderos, pos] = await Promise.all([api('/lavaderos'), Location.getCurrentPositionAsync({})]);
        let mejor: any = null;
        lavaderos.forEach((l: any) => {
          const km = distanciaKm(pos.coords.latitude, pos.coords.longitude, Number(l.latitud), Number(l.longitud));
          if (!mejor || km < mejor.km) mejor = { nombre: l.nombre, km };
        });
        if (mejor) setCercano(`${mejor.nombre} · a ${textoDistancia(mejor.km)} de ti`);
      } catch (e) { /* sin ubicación: no se muestra la distancia */ }
    })();
  }, [esCliente, reprogramando]);

  const servicio = servicios.find((s) => s.id_servicio === servicioId);
  const total = (servicio ? Number(servicio.valor) : 0) + adicionales.filter((a) => extras.includes(a.id_adicional)).reduce((s, a) => s + Number(a.valor), 0);
  const alternarExtra = (id: number) => setExtras((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function guardar() {
    if (!hora) { Alert.alert('Falta la hora', 'Escoge una franja disponible.'); return; }
    setGuardando(true);
    try {
      if (reprogramando) {
        await api(`/citas/${citaOriginal.id_cita}/reprogramar`, { method: 'PUT', body: { fecha, hora } });
        avisar(`Cita reprogramada para el ${formatFecha(fecha)} a las ${formatHora(hora)}`);
        navigation.goBack();
        return;
      }
      if (!esCliente && !clienteId) { Alert.alert('Falta el cliente', 'Escoge el cliente de la cita.'); setGuardando(false); return; }
      if (!servicioId) { Alert.alert('Falta el servicio', 'Escoge un servicio.'); setGuardando(false); return; }
      if (!vehiculoId) { Alert.alert('Falta el vehículo', 'Registra o escoge un vehículo.'); setGuardando(false); return; }
      const r = await api('/citas', {
        method: 'POST',
        body: { fk_pk_id_usuario: esCliente ? undefined : clienteId, fk_pk_id_servicio: servicioId, fk_pk_id_vehiculo: vehiculoId, fecha, hora, adicionales: extras, observaciones: observaciones.trim() },
      });
      avisar('¡Cita agendada con éxito!');
      navigation.replace('CitaDetalle', { id: r.id_cita });
    } catch (e: any) {
      Alert.alert('No se pudo guardar', e.message);
    } finally {
      setGuardando(false);
    }
  }

  const Titulo = ({ t }: { t: string }) => <Text style={styles.seccion}>{t}</Text>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {reprogramando ? (
        <View style={styles.aviso}>
          <MaterialCommunityIcons name="calendar-edit" size={20} color={colors.blue} />
          <Text style={styles.avisoTexto}>Cita actual: {formatFecha(citaOriginal.fecha)} · {formatHora(citaOriginal.hora)}. Escoge la nueva fecha y hora.</Text>
        </View>
      ) : (
        <>
          {!esCliente ? (
            <Selector
              label="Cliente"
              value={clienteId}
              onChange={(v) => setClienteId(v)}
              vacio="Selecciona un cliente"
              opciones={clientes.map((c) => ({ label: `${c.nombre} ${c.apellido} · ${c.numero_documento}`, value: c.id_usuario }))}
            />
          ) : null}

          <Titulo t="Vehículo" />
          {vehiculos.length ? (
            <View style={styles.chips}>
              {vehiculos.map((v) => (
                <Chip key={v.id_vehiculo} texto={`${v.placa}${v.marca ? ' · ' + v.marca : ''}`} activo={vehiculoId === v.id_vehiculo} onPress={() => setVehiculoId(v.id_vehiculo)} />
              ))}
            </View>
          ) : (
            <Text style={styles.nota}>{!esCliente && !clienteId ? 'Primero escoge un cliente.' : 'Aún no hay vehículos registrados.'}</Text>
          )}
          {(esCliente || clienteId) ? (
            <TouchableOpacity style={styles.enlace} onPress={() => navigation.navigate('VehiculoForm', { clienteId: esCliente ? undefined : clienteId })}>
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.brightBlue} />
              <Text style={styles.enlaceTexto}>Registrar un vehículo nuevo</Text>
            </TouchableOpacity>
          ) : null}

          <Titulo t="Servicio" />
          {servicios.map((s) => (
            <TouchableOpacity key={s.id_servicio} activeOpacity={0.85} style={[styles.opcion, servicioId === s.id_servicio && styles.opcionActiva]} onPress={() => setServicioId(s.id_servicio)}>
              <MaterialCommunityIcons name={servicioId === s.id_servicio ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={servicioId === s.id_servicio ? colors.brightBlue : colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.opcionNombre}>{s.nombre}</Text>
                {s.descripcion ? <Text style={styles.opcionDesc}>{s.descripcion}</Text> : null}
              </View>
              <Text style={styles.precio}>{moneda(s.valor)}</Text>
            </TouchableOpacity>
          ))}

          <Titulo t="Adicionales (opcional)" />
          {adicionales.map((a) => {
            const marcado = extras.includes(a.id_adicional);
            return (
              <TouchableOpacity key={a.id_adicional} activeOpacity={0.85} style={[styles.opcion, marcado && styles.opcionActiva]} onPress={() => alternarExtra(a.id_adicional)}>
                <MaterialCommunityIcons name={marcado ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={marcado ? colors.brightBlue : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcionNombre}>{a.nombre}</Text>
                  {a.descripcion ? <Text style={styles.opcionDesc}>{a.descripcion}</Text> : null}
                </View>
                <Text style={styles.precio}>+ {moneda(a.valor)}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <Titulo t="Fecha" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {dias.map((d) => {
          const iso = fechaISO(d);
          const activo = iso === fecha;
          return (
            <TouchableOpacity key={iso} activeOpacity={0.85} onPress={() => setFecha(iso)} style={[styles.dia, activo && styles.diaActivo]}>
              <Text style={[styles.diaSemana, activo && { color: '#D8E9FA' }]}>{diaSemana(d)}</Text>
              <Text style={[styles.diaNumero, activo && { color: colors.white }]}>{d.getDate()}</Text>
              <Text style={[styles.diaSemana, activo && { color: '#D8E9FA' }]}>{mesCorto(d)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Titulo t="Hora (franjas de 30 min, de 8:00 a. m. a 5:00 p. m.)" />
      {cargandoSlots ? (
        <View style={{ alignItems: 'center', marginVertical: 16 }}><Spinner tamano={44} color={colors.blue} /></View>
      ) : slots.some((s) => s.disponible) ? (
        <View style={styles.chips}>
          {slots.map((s) => (
            <Chip key={s.hora} texto={formatHora(s.hora)} activo={hora === s.hora} deshabilitado={!s.disponible} onPress={() => setHora(s.hora)} />
          ))}
        </View>
      ) : (
        <Text style={styles.nota}>No hay franjas disponibles ese día. Prueba con otra fecha.</Text>
      )}

      {!reprogramando ? (
        <>
          <Campo label="Observaciones (opcional)" value={observaciones} onChangeText={setObservaciones} placeholder="Ej: rayón en la puerta derecha" maxLength={200} multiline />
          {cercano ? (
            <TouchableOpacity style={styles.aviso} onPress={() => navigation.navigate('Mapa')} activeOpacity={0.85}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color={colors.blue} />
              <Text style={[styles.avisoTexto, { fontWeight: '700' }]}>{cercano}</Text>
              <Text style={styles.verMapa}>Ver mapa</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.resumen}>
            <Text style={styles.resumenTexto}>Total estimado</Text>
            <Text style={styles.resumenTotal}>{moneda(total)}</Text>
          </View>
        </>
      ) : null}

      <Boton titulo={reprogramando ? 'Confirmar nueva fecha' : 'Agendar cita'} icono="check" onPress={guardar} cargando={guardando} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  seccion: { color: colors.navy, fontSize: 14, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  nota: { color: colors.muted, marginBottom: 8, lineHeight: 19 },
  enlace: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 },
  enlaceTexto: { color: colors.brightBlue, fontWeight: '700' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  opcionActiva: { borderColor: colors.brightBlue, backgroundColor: colors.blueLight },
  opcionNombre: { color: colors.navy, fontWeight: '800', fontSize: 14 },
  opcionDesc: { color: colors.muted, fontSize: 11, marginTop: 2 },
  precio: { color: colors.navy, fontWeight: '800', fontSize: 13 },
  dia: { width: 56, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  diaActivo: { backgroundColor: colors.brightBlue, borderColor: colors.brightBlue },
  diaSemana: { color: colors.muted, fontSize: 11, textTransform: 'capitalize' },
  diaNumero: { color: colors.navy, fontSize: 20, fontWeight: '900', marginVertical: 2 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blueLight, borderRadius: 14, padding: 12, marginBottom: 12 },
  avisoTexto: { flex: 1, color: colors.navy, fontSize: 13, lineHeight: 18 },
  verMapa: { color: colors.brightBlue, fontWeight: '800' },
  resumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  resumenTexto: { color: colors.muted, fontWeight: '700' },
  resumenTotal: { color: colors.navy, fontSize: 20, fontWeight: '900' },
});
