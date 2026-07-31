import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Anillo } from '@/componentes/Anillo';
import { Badge } from '@/componentes/Badge';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { traerCupones, traerProductos, traerRecompensas } from '@/datos/menu';
import { Cupon, Producto, Recompensa } from '@/datos/tipos';
import { usarCarrito } from '@/estado/carrito';
import { usarSesion } from '@/estado/sesion';
import { color, e, nivelDe, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';

export default function Promos() {
  const insets = useSafeAreaInsets();
  const perfil = usarSesion((s) => s.perfil);
  const setCupon = usarCarrito((s) => s.setCupon);

  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    traerCupones().then(setCupones);
    traerRecompensas().then(setRecompensas);
    traerProductos().then(setProductos);
  }, []);

  const puntos = perfil?.puntos ?? 0;
  const nivel = nivelDe(perfil?.puntos_historicos ?? 0);
  const orden = { bronce: 0, plata: 1, oro: 2 } as const;

  function usar(c: Cupon) {
    setCupon(c);
    router.push('/carrito');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.marfil }}
      contentContainerStyle={{ paddingTop: insets.top + e.e3, paddingBottom: e.e9 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: e.e4 }}>
        <Text style={titulo('h2', { fontSize: 22 })}>Promos</Text>
        <Text style={titulo('h1', { fontSize: 34, marginTop: e.e4 })}>Comparte lo{'\n'}que te gusta</Text>
        <Text style={[texto.b1, { color: color.tinta60, marginTop: e.e2, marginBottom: e.e5 }]}>
          Descuentos que solo existen aquí, en la app.
        </Text>
      </View>

      {cupones.map((c, i) =>
        i === 0 ? (
          <Pressable key={c.id} style={s.destacado} onPress={() => usar(c)}>
            {(() => {
              // Foto del cupón destacado: un plato de su categoría si tiene
              // una asociada, o el primero disponible como respaldo.
              const foto =
                (c.categoria_id
                  ? productos.find((p) => p.categoria_id === c.categoria_id)?.imagen_url
                  : undefined) ?? productos.find((p) => p.disponible)?.imagen_url;
              return foto ? (
                <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : null;
            })()}
            <View style={[StyleSheet.absoluteFill, s.destacadoTinte]} />
            <View style={s.anilloFondo} />
            <Badge tipo="exclusivo_app" />
            <Text style={titulo('h2', { fontSize: 30, color: color.blanco, marginTop: e.e3 })}>
              {c.titulo}
            </Text>
            <Text style={[texto.b2, { color: 'rgba(255,255,255,0.86)', marginTop: e.e2, maxWidth: '80%' }]}>
              {c.descripcion}
            </Text>
            <View style={s.vale}>
              <Icono nombre="reloj" tamano={14} tono={color.blanco} grosor={1.9} />
              <Text style={[texto.b2, { color: color.blanco, fontFamily: familia.semibold }]}>
                Usar en mi pedido
              </Text>
            </View>
          </Pressable>
        ) : (
          <Pressable key={c.id} style={s.cupon} onPress={() => usar(c)}>
            <View style={[s.sello, { backgroundColor: color.crema }]}>
              <Icono nombre="promos" tamano={18} grosor={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={texto.h4}>{c.titulo}</Text>
              <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>{c.descripcion}</Text>
            </View>
            <Icono nombre="flecha" tamano={18} tono={color.tinta40} />
          </Pressable>
        ),
      )}

      <View style={s.separador} />

      <View style={s.encabezado}>
        <Text style={titulo('h2', { fontSize: 24 })}>Canjea tus puntos</Text>
        <Text style={[texto.b2, { color: color.tinta60 }]}>{puntos} disponibles</Text>
      </View>

      <View style={{ paddingHorizontal: e.e4 }}>
        {recompensas.map((r) => {
          const alcanzable =
            puntos >= r.puntos_costo &&
            orden[nivel] >= orden[(r.nivel_minimo as keyof typeof orden) ?? 'bronce'];
          return (
            <View key={r.id} style={[s.premio, !alcanzable && { opacity: 0.55 }]}>
              <Anillo
                progreso={Math.min(1, puntos / r.puntos_costo)}
                tamano={52}
                grosor={4}
                tono={alcanzable ? color.teal : color.naranja}
              >
                <Text style={{ fontFamily: familia.bold, fontSize: 11, color: color.carbon }}>
                  {r.puntos_costo}
                </Text>
              </Anillo>
              <View style={{ flex: 1 }}>
                <Text style={texto.h4}>{r.titulo}</Text>
                <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>{r.descripcion}</Text>
              </View>
              <Boton
                variante={alcanzable ? 'primario' : 'secundario'}
                deshabilitado={!alcanzable}
                estilo={{ height: 36, paddingHorizontal: e.e4 }}
              >
                {alcanzable ? 'Canjear' : `Faltan ${Math.max(0, r.puntos_costo - puntos)}`}
              </Boton>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  destacado: {
    marginHorizontal: e.e4,
    marginBottom: e.e3,
    padding: e.e5,
    borderRadius: radio.r4,
    backgroundColor: color.naranja,
    overflow: 'hidden',
    ...sombra.media,
  },
  destacadoTinte: {
    // Mismo tinte naranja de marca semitransparente que la promo de Inicio.
    backgroundColor: 'rgba(242,107,31,0.78)',
  },
  anilloFondo: {
    position: 'absolute',
    right: -58,
    top: -46,
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 26,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  vale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: e.e4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radio.redondo,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  cupon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    marginHorizontal: e.e4,
    marginBottom: e.e3,
    padding: e.e4,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.blanco,
  },
  sello: { width: 36, height: 36, borderRadius: radio.r2, alignItems: 'center', justifyContent: 'center' },
  separador: { height: 1, backgroundColor: color.linea, marginHorizontal: e.e4, marginVertical: e.e5 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: e.e4,
    marginBottom: e.e3,
  },
  premio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e4,
    padding: e.e4,
    marginBottom: e.e3,
    borderRadius: radio.r3,
    backgroundColor: color.blanco,
    ...sombra.suave,
  },
});
