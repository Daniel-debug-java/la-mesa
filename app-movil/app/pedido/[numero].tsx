import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Anillo } from '@/componentes/Anillo';
import { Avatar } from '@/componentes/Avatar';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { PASOS, pasoActual, seguirPedido, traerPedido } from '@/datos/pedidos';
import { EstadoPedido, Modalidad, Pedido } from '@/datos/tipos';
import { usarSesion } from '@/estado/sesion';
import { color, e, radio } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { horaCorta } from '@/utils/formato';

const MINUTOS_RESTANTES = [22, 18, 4, 0];

export default function Seguimiento() {
  const { numero } = useLocalSearchParams<{ numero: string }>();
  const insets = useSafeAreaInsets();
  const refrescarPerfil = usarSesion((s) => s.refrescarPerfil);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [estado, setEstado] = useState<EstadoPedido>('recibido');
  const [modalidad, setModalidad] = useState<Modalidad>('recoger');

  useEffect(() => {
    let cortar = () => {};
    traerPedido(Number(numero)).then((p) => {
      if (!p) return;
      setPedido(p);
      setEstado(p.estado);
      setModalidad(p.modalidad);
      // Cocina cambia el estado en el panel y esto llega al teléfono
      // sin que el cliente tenga que hacer nada.
      cortar = seguirPedido(p.id, (nuevo) => {
        setEstado(nuevo);
        if (nuevo === 'entregado') refrescarPerfil();
      });
    });
    return () => cortar();
  }, [numero, refrescarPerfil]);

  const paso = pasoActual(estado);
  const progreso = (paso + 1) / PASOS.length;
  const enCamino = estado === 'en_camino' || (paso === 2 && modalidad === 'domicilio');

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.replace('/')} accessibilityLabel="Volver al inicio" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Pedido #{numero}</Text>
        <Pressable style={{ marginLeft: 'auto' }} hitSlop={10}>
          <Text style={[texto.b2, { color: color.naranjaTexto, fontFamily: familia.semibold }]}>Ayuda</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: e.e6 }}>
          <Anillo progreso={progreso} tamano={190} grosor={9}>
            <View style={{ alignItems: 'center', maxWidth: 120 }}>
              <Text style={texto.caption}>{modalidad === 'recoger' ? 'Recoges en' : 'Llega en'}</Text>
              <Text style={titulo('h1', { fontSize: 40, marginTop: 6 })}>{MINUTOS_RESTANTES[paso]}</Text>
              <Text style={[texto.b2, { color: color.tinta60 }]}>minutos</Text>
            </View>
          </Anillo>

          <Text style={titulo('h2', { marginTop: e.e5 })}>{PASOS[paso].titulo}</Text>
          <Text style={[texto.b1, { color: color.tinta60, marginTop: 6, textAlign: 'center', paddingHorizontal: e.e6 }]}>
            {PASOS[paso].detalle(modalidad)}
          </Text>
        </View>

        {enCamino && (
          <View style={s.mensajero}>
            <Avatar nombre={pedido?.mensajero_nombre ?? 'Julián'} tamano={44} />
            <View style={{ flex: 1, marginLeft: e.e3 }}>
              <Text style={texto.h4}>{pedido?.mensajero_nombre ?? 'Julián'} lleva tu pedido</Text>
              <Text style={[texto.b2, { color: color.tinta60 }]}>
                {pedido?.mensajero_empresa ?? 'Mensajería aliada'}
              </Text>
            </View>
            <View style={s.llamar}>
              <Icono nombre="moto" tamano={19} tono={color.blanco} grosor={2} />
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: e.e4, marginTop: e.e5 }}>
          {PASOS.map((p, i) => {
            const hecho = i < paso;
            const ahora = i === paso;
            return (
              <View key={p.estado} style={s.paso}>
                <View style={s.rieles}>
                  <View
                    style={[
                      s.punto,
                      hecho && { backgroundColor: color.teal, borderColor: color.teal },
                      ahora && { backgroundColor: color.naranja, borderColor: color.naranja },
                    ]}
                  >
                    {hecho ? <Icono nombre="check" tamano={14} tono={color.blanco} grosor={3} /> : null}
                    {ahora ? <View style={s.latido} /> : null}
                  </View>
                  {i < PASOS.length - 1 ? (
                    <View style={[s.linea, hecho && { backgroundColor: color.teal }]} />
                  ) : null}
                </View>

                <View style={{ flex: 1, paddingBottom: e.e5 }}>
                  <Text style={[texto.h4, i > paso && { color: color.tinta40 }]}>{p.titulo}</Text>
                  <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>
                    {i <= paso ? p.detalle(modalidad) : 'Pendiente'}
                  </Text>
                </View>

                {i <= paso && pedido ? (
                  <Text style={[texto.b2, { color: color.tinta60 }]}>{horaCorta(pedido.creado_en)}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {estado === 'entregado' && (
          <View style={{ paddingHorizontal: e.e4, marginTop: e.e2 }}>
            <Boton bloque variante="secundario" onPress={() => router.replace('/momentos')}>
              Guardar este momento
            </Boton>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: e.e4,
    paddingVertical: e.e3,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  mensajero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: e.e4,
    padding: e.e4,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.naranja,
    backgroundColor: 'rgba(242,107,31,0.05)',
  },
  llamar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paso: { flexDirection: 'row', gap: e.e4 },
  rieles: { alignItems: 'center', width: 28 },
  punto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: color.linea,
    backgroundColor: color.marfil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latido: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.blanco },
  linea: { flex: 1, width: 2, backgroundColor: color.linea },
});
