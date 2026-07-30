import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/componentes/Avatar';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { abrirMesa, cerrarMesa, seguirMesa, traerMesa } from '@/datos/mesas';
import { Mesa } from '@/datos/tipos';
import { usarCarrito } from '@/estado/carrito';
import { usarSesion } from '@/estado/sesion';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { pesos } from '@/utils/formato';

/** Comensales de ejemplo mientras no haya backend conectado */
const DEMO = [
  { nombre: 'Daniel', anfitrion: true, items: [{ n: 'Doble Mandarina', q: 1, p: 41900 }] },
  { nombre: 'Sara', anfitrion: false, items: [{ n: 'Bowl Ensalada La Mesa', q: 1, p: 28900 }, { n: 'Limonada de Coco', q: 1, p: 12900 }] },
  { nombre: 'Tomás', anfitrion: false, items: [{ n: 'Punta de Anca a la Brasa', q: 1, p: 46900 }] },
  { nombre: 'Vale', anfitrion: false, items: [] as { n: string; q: number; p: number }[] },
];

export default function MesaCompartida() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const insets = useSafeAreaInsets();
  const perfil = usarSesion((s) => s.perfil);
  const setMesa = usarCarrito((s) => s.setMesa);

  const [mesa, setMesa_] = useState<Mesa | null>(null);
  const [dividir, setDividir] = useState(true);

  useEffect(() => {
    let cortar = () => {};
    (async () => {
      // "nueva" abre una mesa; cualquier otro valor es un código para entrar
      const m = codigo === 'nueva' ? await abrirMesa() : await traerMesa(String(codigo));
      if (!m) return;
      setMesa_(m);
      setMesa(m.id);
      cortar = seguirMesa(m.id, () => {
        traerMesa(m.codigo).then((fresca) => fresca && setMesa_(fresca));
      });
    })();
    return () => cortar();
  }, [codigo, setMesa]);

  const comensales = mesa?.mesa_participantes?.length
    ? mesa.mesa_participantes.map((p) => ({
        nombre: p.perfiles?.nombre ?? 'Invitado',
        anfitrion: p.es_anfitrion,
        items: [] as { n: string; q: number; p: number }[],
      }))
    : DEMO;

  const totalMesa = comensales.reduce(
    (t, c) => t + c.items.reduce((x, i) => x + i.p * i.q, 0),
    0,
  );
  const loMio = comensales.find((c) => c.nombre === (perfil?.nombre ?? 'Daniel'));
  const totalMio = (loMio?.items ?? []).reduce((t, i) => t + i.p * i.q, 0);
  const yaEligieron = comensales.filter((c) => c.items.length).length;
  const R = 134;

  async function compartir() {
    if (!mesa) return;
    await Share.share({
      message:
        `Te guardé un puesto en La Mesa.\n` +
        `Entra a la app y usa el código ${mesa.codigo} para pedir lo tuyo.`,
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>{mesa?.nombre ?? 'Nuestra mesa'}</Text>
        <Pressable onPress={compartir} accessibilityLabel="Compartir el código" hitSlop={10} style={{ marginLeft: 'auto' }}>
          <Icono nombre="compartir" tamano={20} tono={color.carbon} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingTop: e.e5 }}>
          <Text style={texto.caption}>Código de la mesa</Text>
          <Text style={titulo('h1', { fontSize: 44, letterSpacing: 4, color: color.naranjaTexto, marginTop: 4 })}>
            {mesa?.codigo ?? '······'}
          </Text>
          <Text style={[texto.b2, { color: color.tinta60, marginTop: 6 }]}>
            Dile este código a quien quieras sentar contigo.
          </Text>
        </View>

        {/* El isotipo convertido en mesa: cada quien ocupa su silla */}
        <View style={s.mesaAnillo}>
          <View style={s.aro} />
          <View style={s.nucleo}>
            <Text style={[texto.caption, { color: 'rgba(255,246,237,0.5)' }]}>La cuenta</Text>
            <Text style={titulo('h2', { fontSize: 27, color: color.marfil, marginTop: 5 })}>
              {pesos(totalMesa)}
            </Text>
            <Text style={[texto.b2, { color: 'rgba(255,246,237,0.55)', marginTop: 4 }]}>
              {yaEligieron} de {comensales.length} ya eligieron
            </Text>
          </View>

          {comensales.map((c, i) => {
            const ang = (i / comensales.length) * 2 * Math.PI - Math.PI / 2;
            return (
              <View
                key={c.nombre + i}
                style={[s.silla, { left: 160 + Math.cos(ang) * R - 39, top: 160 + Math.sin(ang) * R - 24 }]}
              >
                <Avatar nombre={c.nombre} tamano={48} />
                <Text style={s.sillaNombre}>{c.nombre}</Text>
                <Text
                  style={[
                    s.sillaEstado,
                    { color: c.items.length ? color.tealTexto : color.tinta60 },
                  ]}
                >
                  {c.items.length ? 'Ya eligió' : 'Eligiendo…'}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: e.e4 }}>
          {comensales.map((c, i) => (
            <View key={c.nombre + i} style={{ marginBottom: e.e4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: e.e2, marginBottom: e.e2 }}>
                <Avatar nombre={c.nombre} tamano={26} borde={false} />
                <Text style={texto.h4}>{c.nombre}</Text>
                {c.anfitrion ? (
                  <View style={s.anfitrion}>
                    <Text style={{ fontFamily: familia.semibold, fontSize: 9.5, letterSpacing: 0.4 }}>
                      ANFITRIÓN
                    </Text>
                  </View>
                ) : null}
                <Text style={{ marginLeft: 'auto', fontFamily: familia.bold, fontSize: 14 }}>
                  {pesos(c.items.reduce((t, i2) => t + i2.p * i2.q, 0))}
                </Text>
              </View>

              {c.items.length ? (
                c.items.map((i2) => (
                  <Text key={i2.n} style={[texto.b1, { color: color.tinta60, paddingLeft: 34, paddingVertical: 4 }]}>
                    {i2.q} · {i2.n}
                  </Text>
                ))
              ) : (
                <Text style={[texto.b2, { color: color.tinta60, paddingLeft: 34, paddingVertical: 4 }]}>
                  Todavía está viendo el menú
                </Text>
              )}
            </View>
          ))}

          <View style={s.separador} />

          <Text style={[texto.h3, { marginBottom: e.e3 }]}>Cómo se paga</Text>
          {[
            { valor: true, titulo: 'Cada quien lo suyo', detalle: 'Cada persona paga sus platos desde su celular.' },
            { valor: false, titulo: 'Yo invito', detalle: `Pagas la cuenta completa: ${pesos(totalMesa)}.` },
          ].map((op) => (
            <Pressable
              key={String(op.valor)}
              onPress={() => setDividir(op.valor)}
              style={[s.fila, dividir === op.valor && s.filaOn]}
            >
              <View
                style={[
                  s.marca,
                  dividir === op.valor && { borderColor: color.naranja, backgroundColor: color.naranja },
                ]}
              >
                {dividir === op.valor ? <View style={s.punto} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={texto.h4}>{op.titulo}</Text>
                <Text style={[texto.b2, { color: color.tinta60 }]}>{op.detalle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[s.accion, { paddingBottom: insets.bottom + e.e3 }]}>
        <Boton
          bloque
          onPress={async () => {
            if (mesa) await cerrarMesa(mesa.id, dividir);
            router.push('/checkout');
          }}
        >
          {`Cerrar la mesa y pedir · ${pesos(dividir ? totalMio : totalMesa)}`}
        </Boton>
        <Text style={[texto.b2, { color: color.tinta60, textAlign: 'center', marginTop: e.e2 }]}>
          {dividir
            ? 'Pagas solo lo tuyo. A los demás les llega su parte.'
            : 'Pagas por todos. Hoy la mesa la pones tú.'}
        </Text>
      </View>
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
  mesaAnillo: { width: 320, height: 320, alignSelf: 'center', marginTop: e.e4, marginBottom: e.e7 },
  aro: {
    position: 'absolute',
    left: 26,
    top: 26,
    right: 26,
    bottom: 26,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(242,107,31,0.28)',
  },
  nucleo: {
    position: 'absolute',
    left: 84,
    top: 84,
    right: 84,
    bottom: 84,
    borderRadius: 999,
    backgroundColor: color.carbon,
    alignItems: 'center',
    justifyContent: 'center',
    padding: e.e3,
    ...sombra.fuerte,
  },
  silla: { position: 'absolute', width: 78, alignItems: 'center' },
  sillaNombre: { fontFamily: familia.semibold, fontSize: 11, color: color.carbon, marginTop: 3 },
  sillaEstado: { fontFamily: familia.semibold, fontSize: 9.5, marginTop: 2 },
  anfitrion: {
    paddingHorizontal: 9,
    height: 21,
    borderRadius: radio.redondo,
    backgroundColor: color.amarillo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separador: { height: 1, backgroundColor: color.linea, marginVertical: e.e5 },
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
  filaOn: { borderColor: color.naranja, backgroundColor: 'rgba(242,107,31,0.05)' },
  marca: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: color.blanco },
  accion: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: e.e4,
    paddingTop: e.e4,
    backgroundColor: color.marfil,
    borderTopWidth: 1,
    borderTopColor: color.linea,
  },
});
