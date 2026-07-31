import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icono } from '@/componentes/Icono';
import { traerMisPedidos } from '@/datos/pedidos';
import { EstadoPedido, Pedido } from '@/datos/tipos';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { fechaLarga, pesos } from '@/utils/formato';

const ESTADO_ETIQUETA: Record<EstadoPedido, { texto: string; tono: string }> = {
  pendiente_pago: { texto: 'Por pagar', tono: color.tinta60 },
  recibido: { texto: 'Recibido', tono: color.naranjaTexto },
  en_preparacion: { texto: 'En preparación', tono: color.naranjaTexto },
  listo: { texto: 'Listo', tono: color.naranjaTexto },
  en_camino: { texto: 'En camino', tono: color.naranjaTexto },
  entregado: { texto: 'Entregado', tono: color.tealTexto },
  cancelado: { texto: 'Cancelado', tono: color.rojoTexto },
};

export default function Historial() {
  const insets = useSafeAreaInsets();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);

  useEffect(() => {
    traerMisPedidos().then(setPedidos);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Historial de pedidos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        {pedidos !== null && !pedidos.length && (
          <Text style={[texto.b1, { color: color.tinta60 }]}>Todavía no tienes pedidos.</Text>
        )}

        {(pedidos ?? []).map((p) => {
          const est = ESTADO_ETIQUETA[p.estado];
          const resumen = (p.pedido_items ?? []).map((i) => `${i.cantidad} · ${i.nombre}`).join(' · ');
          return (
            <Pressable key={p.id} style={s.tarjeta} onPress={() => router.push(`/pedido/${p.numero}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={texto.h4}>Pedido #{p.numero}</Text>
                <Text style={{ fontFamily: familia.semibold, fontSize: 12.5, color: est.tono }}>
                  {est.texto}
                </Text>
              </View>
              <Text style={[texto.caption, { marginTop: 3, marginBottom: e.e2, textTransform: 'capitalize' }]}>
                {fechaLarga(p.creado_en)} · {p.modalidad === 'domicilio' ? 'Domicilio' : 'Recoger'}
              </Text>
              {resumen ? (
                <Text style={[texto.b2, { color: color.tinta60 }]} numberOfLines={2}>
                  {resumen}
                </Text>
              ) : null}
              <View style={s.pie}>
                <Text style={{ fontFamily: familia.bold, fontSize: 15 }}>{pesos(p.total)}</Text>
                <Icono nombre="flecha" tamano={15} tono={color.tinta40} />
              </View>
            </Pressable>
          );
        })}
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
  tarjeta: {
    padding: e.e4,
    marginBottom: e.e3,
    borderRadius: radio.r3,
    backgroundColor: color.blanco,
    ...sombra.suave,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: e.e3,
    paddingTop: e.e3,
    borderTopWidth: 1,
    borderTopColor: color.linea,
  },
});
