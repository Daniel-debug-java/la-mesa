import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Anillo, Isotipo } from '@/componentes/Anillo';
import { Avatar } from '@/componentes/Avatar';
import { Icono, NombreIcono } from '@/componentes/Icono';
import { usarSesion } from '@/estado/sesion';
import { color, e, nivelDe, radio, siguienteNivel } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';

const ACCESOS: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  { icono: 'ubicacion', titulo: 'Mis direcciones', detalle: 'Casa y oficina' },
  { icono: 'tarjeta', titulo: 'Métodos de pago', detalle: 'Nequi y una tarjeta guardada' },
  { icono: 'notificaciones', titulo: 'Notificaciones', detalle: 'Pedidos y promociones' },
  { icono: 'favoritos', titulo: 'Favoritos', detalle: 'Los platos que guardaste' },
  { icono: 'bolsa', titulo: 'Historial de pedidos', detalle: 'Todo lo que has pedido' },
];

const NOMBRE_NIVEL = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro' } as const;

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { perfil, salir } = usarSesion();

  const historicos = perfil?.puntos_historicos ?? 0;
  const avance = siguienteNivel(historicos);
  const nivel = NOMBRE_NIVEL[nivelDe(historicos)];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.marfil }}
      contentContainerStyle={{ paddingTop: insets.top + e.e3, paddingBottom: e.e9 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: e.e4 }}>
        <Text style={titulo('h2', { fontSize: 22 })}>Perfil</Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: e.e5 }}>
        <Anillo progreso={avance?.progreso ?? 1} tamano={140} grosor={6}>
          <Avatar nombre={perfil?.nombre ?? 'Invitado'} url={perfil?.avatar_url} tamano={96} borde={false} />
        </Anillo>

        <Text style={titulo('h2', { marginTop: e.e4 })}>{perfil?.nombre ?? 'Invitado'}</Text>

        <View style={s.chip}>
          <Icono nombre="momentos" tamano={14} grosor={2} />
          <Text style={[texto.b2, { fontFamily: familia.semibold }]}>
            Nivel {nivel} · {perfil?.puntos ?? 0} puntos
          </Text>
        </View>

        <Text style={[texto.b2, { color: color.tinta60, marginTop: e.e3, textAlign: 'center', maxWidth: 250 }]}>
          {avance
            ? `Te faltan ${avance.faltan} puntos para el siguiente nivel. Cada $1.000 que gastas suma un punto.`
            : 'Estás en el nivel más alto. Gracias por seguir volviendo.'}
        </Text>
      </View>

      <View style={s.fichas}>
        {[
          [String(12), 'Pedidos'],
          [String(3), 'Mesas'],
          [String(2), 'Cupones'],
        ].map(([n, l]) => (
          <View key={l} style={s.ficha}>
            <Text style={titulo('h2', { fontSize: 26 })}>{n}</Text>
            <Text style={[texto.caption, { marginTop: 2 }]}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: e.e4 }}>
        {ACCESOS.map((a) => (
          <Pressable key={a.titulo} style={s.fila}>
            <View style={s.sello}>
              <Icono nombre={a.icono} tamano={18} grosor={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={texto.h4}>{a.titulo}</Text>
              <Text style={[texto.b2, { color: color.tinta60 }]}>{a.detalle}</Text>
            </View>
            <Icono nombre="flecha" tamano={17} tono={color.tinta40} />
          </Pressable>
        ))}

        <Pressable
          style={{ alignSelf: 'center', marginTop: e.e5 }}
          onPress={async () => {
            await salir();
            router.replace('/entrar');
          }}
        >
          <Text style={[texto.b1, { color: color.rojoTexto, fontFamily: familia.semibold }]}>Cerrar sesión</Text>
        </Pressable>

        <View style={{ alignItems: 'center', paddingTop: e.e6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={titulo('h2', { fontSize: 20, color: color.tinta40 })}>La Mesa</Text>
            <Isotipo tamano={16} tono={color.tinta40} />
          </View>
          <Text style={[texto.caption, { marginTop: e.e2, letterSpacing: 1.6 }]}>
            Donde todo se comparte
          </Text>
          <Text style={[texto.b2, { color: color.tinta60, marginTop: e.e2 }]}>
            Versión 1.0 · El Poblado, Medellín
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: e.e2,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radio.redondo,
    backgroundColor: color.crema,
  },
  fichas: { flexDirection: 'row', gap: e.e2, paddingHorizontal: e.e4, marginBottom: e.e5 },
  ficha: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: e.e4,
    borderRadius: radio.r3,
    backgroundColor: color.crema,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    padding: e.e4,
    marginBottom: e.e2,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.blanco,
  },
  sello: {
    width: 36,
    height: 36,
    borderRadius: radio.r2,
    backgroundColor: color.crema,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
