import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge } from '@/componentes/Badge';
import { FotoPlato } from '@/componentes/FotoPlato';
import { Icono } from '@/componentes/Icono';
import { traerCategorias, traerProductos } from '@/datos/menu';
import { Categoria, Producto } from '@/datos/tipos';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { pesos } from '@/utils/formato';

export default function Menu() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoria?: string }>();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    traerCategorias().then((c) => {
      setCategorias(c);
      setActiva((prev) => prev ?? params.categoria ?? c[0]?.id ?? null);
    });
    traerProductos().then(setProductos);
  }, [params.categoria]);

  useEffect(() => {
    if (params.categoria) setActiva(params.categoria);
  }, [params.categoria]);

  const categoria = categorias.find((c) => c.id === activa);
  const platos = useMemo(
    () => productos.filter((p) => p.categoria_id === activa),
    [productos, activa],
  );
  const indice = categorias.findIndex((c) => c.id === activa);

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil }}>
      <View style={[s.superior, { paddingTop: insets.top + e.e3 }]}>
        <Text style={titulo('h2', { fontSize: 22 })}>Menú</Text>
      </View>

      {/* Categorías */}
      <View style={s.fichas}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: e.e2, paddingHorizontal: e.e4 }}>
          {categorias.map((c) => {
            const on = c.id === activa;
            return (
              <Pressable key={c.id} onPress={() => setActiva(c.id)} style={[s.ficha, on && s.fichaOn]}>
                <Icono
                  nombre={c.icono as never}
                  tamano={16}
                  grosor={1.9}
                  tono={on ? color.marfil : color.naranjaIcono}
                />
                <Text style={[s.fichaTexto, { color: on ? color.marfil : color.tinta60 }]}>
                  {c.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* La carta */}
      <ScrollView
        contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.cartaEncabezado}>
          <Text style={titulo('h1', { fontSize: 56, lineHeight: 50, color: 'rgba(242,107,31,0.24)' })}>
            {String(indice + 1).padStart(2, '0')}
          </Text>
          <View style={{ marginLeft: e.e3 }}>
            <Text style={[texto.b2, { color: color.tinta60 }]}>
              {platos.length} {platos.length === 1 ? 'plato' : 'platos'}
            </Text>
            <Text style={titulo('h2', { fontSize: 30 })}>{categoria?.nombre ?? ''}</Text>
          </View>
        </View>

        {platos.map((p) => {
          const agotado = !p.disponible;
          return (
            <Pressable
              key={p.id}
              disabled={agotado}
              onPress={() => router.push(`/producto/${p.id}`)}
              style={[s.plato, agotado && { opacity: 0.45 }]}
            >
              <View>
                <FotoPlato url={p.imagen_url} categoria={categoria?.icono} alto={186} redondez={radio.r4} />
                <View style={s.cinta}>
                  {agotado ? <Badge tipo="agotado" /> : p.badges[0] ? <Badge tipo={p.badges[0]} /> : null}
                </View>
                <View style={s.precio}>
                  {p.precio_antes ? (
                    <Text style={[texto.b2, { color: color.tinta60, textDecorationLine: 'line-through' }]}>
                      {pesos(p.precio_antes)}
                    </Text>
                  ) : null}
                  <Text style={{ fontFamily: familia.bold, fontSize: 14, color: color.carbon }}>
                    {pesos(p.precio)}
                  </Text>
                </View>
              </View>

              <Text style={titulo('h2', { fontSize: 26, marginTop: e.e4 })}>{p.nombre}</Text>
              <Text style={[texto.b1, { color: color.tinta60, marginTop: 6, paddingRight: 56 }]}>
                {p.descripcion}
              </Text>

              {!agotado && (
                <View style={s.sumar}>
                  <Icono nombre="mas" tamano={20} tono={color.blanco} grosor={2.4} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  superior: { paddingHorizontal: e.e4, paddingBottom: e.e3, backgroundColor: color.marfil },
  fichas: { paddingBottom: e.e3, borderBottomWidth: 1, borderBottomColor: color.linea },
  ficha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingHorizontal: e.e4,
    borderRadius: radio.redondo,
    backgroundColor: color.crema,
  },
  fichaOn: { backgroundColor: color.carbon },
  fichaTexto: { fontFamily: familia.semibold, fontSize: 12.5 },

  cartaEncabezado: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: e.e5, marginTop: e.e2 },

  plato: { marginBottom: e.e5, paddingBottom: e.e5, borderBottomWidth: 1, borderBottomColor: color.linea },
  cinta: { position: 'absolute', left: 12, top: 12 },
  precio: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radio.r3,
    backgroundColor: color.marfil,
    ...sombra.media,
  },
  sumar: {
    position: 'absolute',
    right: 0,
    bottom: e.e5 - 6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.naranja,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.media,
  },
});
