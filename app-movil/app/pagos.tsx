import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icono } from '@/componentes/Icono';
import { METODOS_PAGO } from '@/datos/metodosPago';
import { usarCarrito } from '@/estado/carrito';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';

export default function Pagos() {
  const insets = useSafeAreaInsets();
  const { metodoPago, setMetodoPago } = usarCarrito();

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Métodos de pago</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        <Text style={[texto.b1, { color: color.tinta60, marginBottom: e.e4 }]}>
          Elige con cuál prefieres pagar. Se preselecciona la próxima vez que vayas a pagar, y siempre
          puedes cambiarlo ahí mismo.
        </Text>

        {METODOS_PAGO.map((m) => {
          const on = metodoPago === m.id;
          return (
            <Pressable key={m.id} onPress={() => setMetodoPago(m.id)} style={[s.fila, on && s.filaOn]}>
              <View style={[s.marca, on && { borderColor: color.naranja, backgroundColor: color.naranja }]}>
                {on ? <View style={s.punto} /> : null}
              </View>
              <View style={[s.sello, { backgroundColor: m.fondo ?? color.crema }]}>
                {m.icono ? (
                  <Icono nombre={m.icono} tamano={18} grosor={2} />
                ) : (
                  <Text style={{ fontFamily: familia.bold, fontSize: 10, color: m.tinta ?? color.carbon }}>
                    {m.sigla}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={texto.h4}>{m.nombre}</Text>
                <Text style={[texto.b2, { color: color.tinta60 }]}>{m.detalle}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={[texto.b2, { color: color.tinta60, marginTop: e.e3, textAlign: 'center' }]}>
          Nunca guardamos números de tarjeta en la app: eso lo maneja Wompi, la pasarela de pago.
        </Text>
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
  sello: { width: 36, height: 36, borderRadius: radio.r2, alignItems: 'center', justifyContent: 'center' },
});
