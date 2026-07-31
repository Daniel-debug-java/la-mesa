import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FotoPlato } from '@/componentes/FotoPlato';
import { Icono } from '@/componentes/Icono';
import { traerCategorias, traerProductos } from '@/datos/menu';
import { Categoria, Producto } from '@/datos/tipos';
import { usarFavoritos } from '@/estado/favoritos';
import { color, e } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { pesos } from '@/utils/formato';

export default function Favoritos() {
  const insets = useSafeAreaInsets();
  const { ids, cargando, cargar } = usarFavoritos();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    cargar();
    traerProductos().then(setProductos);
    traerCategorias().then(setCategorias);
  }, [cargar]);

  const guardados = productos.filter((p) => ids.includes(p.id));

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Favoritos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        {!cargando && !guardados.length && (
          <View style={{ alignItems: 'center', paddingTop: e.e7 }}>
            <Icono nombre="favoritos" tamano={34} tono={color.tinta40} grosor={1.6} />
            <Text style={[texto.b1, { color: color.tinta60, marginTop: e.e3, textAlign: 'center', maxWidth: 240 }]}>
              Toca el corazón en cualquier plato para guardarlo aquí.
            </Text>
          </View>
        )}

        <View style={s.rejilla}>
          {guardados.map((p) => (
            <Pressable key={p.id} style={s.tarjeta} onPress={() => router.push(`/producto/${p.id}`)}>
              <FotoPlato
                url={p.imagen_url}
                categoria={categorias.find((c) => c.id === p.categoria_id)?.icono}
                alto={130}
              />
              <Text style={[texto.h4, { marginTop: e.e2, fontSize: 13.5 }]} numberOfLines={2}>
                {p.nombre}
              </Text>
              <Text style={{ fontFamily: familia.semibold, fontSize: 13, color: color.naranjaTexto, marginTop: 2 }}>
                {pesos(p.precio)}
              </Text>
            </Pressable>
          ))}
        </View>
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
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: e.e3 },
  tarjeta: { width: '47%' },
});
