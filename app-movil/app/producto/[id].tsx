import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Badge } from '@/componentes/Badge';
import { Boton } from '@/componentes/Boton';
import { Contador } from '@/componentes/Contador';
import { FotoPlato } from '@/componentes/FotoPlato';
import { Icono } from '@/componentes/Icono';
import { traerCategorias, traerProducto } from '@/datos/menu';
import { Categoria, LineaCarrito, Producto } from '@/datos/tipos';
import { usarCarrito } from '@/estado/carrito';
import { usarFavoritos } from '@/estado/favoritos';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { pesos } from '@/utils/formato';

type Seleccion = Record<string, LineaCarrito['opciones']>;

export default function DetalleProducto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const agregar = usarCarrito((s) => s.agregar);
  const esFavorito = usarFavoritos((s) => s.esFavorito);
  const alternarFavorito = usarFavoritos((s) => s.alternar);
  const cargarFavoritos = usarFavoritos((s) => s.cargar);

  const [producto, setProducto] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    cargarFavoritos();
    traerCategorias().then(setCategorias);
    traerProducto(String(id)).then((p) => {
      setProducto(p);
      // Los grupos obligatorios arrancan con la primera opción marcada:
      // nadie debería poder llegar al botón con el pedido incompleto.
      if (p?.grupos_opcion) {
        const inicial: Seleccion = {};
        p.grupos_opcion.forEach((g) => {
          if (g.min_sel > 0 && g.opciones[0]) {
            inicial[g.id] = [
              { grupo: g.nombre, opcion: g.opciones[0].nombre, precio_extra: g.opciones[0].precio_extra },
            ];
          }
        });
        setSeleccion(inicial);
      }
    });
  }, [id]);

  if (!producto) return <View style={{ flex: 1, backgroundColor: color.marfil }} />;

  const slug = categorias.find((c) => c.id === producto.categoria_id)?.icono;
  const elegidas = Object.values(seleccion).flat();
  const extra = elegidas.reduce((t, o) => t + o.precio_extra, 0);
  const total = (producto.precio + extra) * cantidad;

  function alternar(grupoId: string, grupoNombre: string, nombre: string, precio: number, max: number) {
    setSeleccion((prev) => {
      const actuales = prev[grupoId] ?? [];
      if (max === 1) return { ...prev, [grupoId]: [{ grupo: grupoNombre, opcion: nombre, precio_extra: precio }] };
      const existe = actuales.some((o) => o.opcion === nombre);
      const siguientes = existe
        ? actuales.filter((o) => o.opcion !== nombre)
        : [...actuales, { grupo: grupoNombre, opcion: nombre, precio_extra: precio }];
      return { ...prev, [grupoId]: siguientes.slice(0, max) };
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View>
          <FotoPlato url={producto.imagen_url} categoria={slug} alto={270} redondez={0} />
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Volver"
            style={[s.flotante, { top: insets.top + e.e2, left: e.e4 }]}
          >
            <Icono nombre="atras" tamano={20} tono={color.carbon} />
          </Pressable>
          <Pressable
            accessibilityLabel={esFavorito(producto.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            onPress={() => alternarFavorito(producto.id)}
            style={[s.flotante, { top: insets.top + e.e2, right: e.e4 }]}
          >
            <Icono
              nombre="favoritos"
              tamano={20}
              tono={esFavorito(producto.id) ? color.naranja : color.carbon}
              relleno={esFavorito(producto.id)}
            />
          </Pressable>
        </View>

        <View style={s.hoja}>
          {producto.badges[0] ? <Badge tipo={producto.badges[0]} /> : null}
          <Text style={titulo('h2', { marginTop: e.e3, marginBottom: e.e2 })}>{producto.nombre}</Text>
          <Text style={[texto.b1, { color: color.tinta60 }]}>{producto.descripcion}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: e.e2, marginTop: e.e4 }}>
            <Text style={{ fontFamily: familia.bold, fontSize: 24, color: color.carbon }}>
              {pesos(producto.precio)}
            </Text>
            {producto.precio_antes ? (
              <Text style={[texto.b1, { color: color.tinta60, textDecorationLine: 'line-through' }]}>
                {pesos(producto.precio_antes)}
              </Text>
            ) : null}
          </View>

          {producto.grupos_opcion?.map((g) => (
            <View key={g.id} style={{ marginTop: e.e6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: e.e2, marginBottom: e.e3 }}>
                <Text style={texto.h3}>{g.nombre}</Text>
                <Text style={[texto.b2, { color: color.tinta60 }]}>
                  {g.min_sel > 0 ? 'Obligatorio' : 'Opcional'}
                </Text>
              </View>

              {g.opciones.map((o) => {
                const marcada = (seleccion[g.id] ?? []).some((x) => x.opcion === o.nombre);
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => alternar(g.id, g.nombre, o.nombre, o.precio_extra, g.max_sel)}
                    style={[s.fila, marcada && s.filaOn]}
                  >
                    <View
                      style={[
                        s.marca,
                        g.max_sel > 1 && { borderRadius: radio.r1 },
                        marcada && { borderColor: color.naranja, backgroundColor: color.naranja },
                      ]}
                    >
                      {marcada ? <Icono nombre="check" tamano={12} tono={color.blanco} grosor={3} /> : null}
                    </View>
                    <Text style={[texto.b1, { flex: 1, fontFamily: familia.medium }]}>{o.nombre}</Text>
                    {o.precio_extra ? (
                      <Text style={[texto.b1, { color: color.tinta60 }]}>+ {pesos(o.precio_extra)}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={{ marginTop: e.e6 }}>
            <Text style={[texto.h3, { marginBottom: e.e3 }]}>Alguna indicación</Text>
            <TextInput
              value={notas}
              onChangeText={setNotas}
              placeholder="Sin cebolla, por favor…"
              placeholderTextColor={color.tinta40}
              style={s.campo}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[s.accion, { paddingBottom: insets.bottom + e.e3 }]}>
        <Contador valor={cantidad} onCambiar={(d) => setCantidad((c) => Math.max(1, c + d))} />
        <Boton
          estilo={{ flex: 1 }}
          onPress={() => {
            agregar(producto, cantidad, elegidas, notas || undefined);
            router.replace('/carrito');
          }}
        >
          {`Agregar ${pesos(total)}`}
        </Boton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flotante: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.marfil,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra.suave,
  },
  hoja: {
    backgroundColor: color.marfil,
    borderTopLeftRadius: radio.r4,
    borderTopRightRadius: radio.r4,
    marginTop: -20,
    paddingHorizontal: e.e4,
    paddingTop: e.e5,
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
  campo: {
    height: 48,
    paddingHorizontal: e.e4,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.blanco,
    fontFamily: familia.regular,
    fontSize: 14,
    color: color.carbon,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    paddingHorizontal: e.e4,
    paddingTop: e.e4,
    backgroundColor: color.marfil,
    borderTopWidth: 1,
    borderTopColor: color.linea,
  },
});
