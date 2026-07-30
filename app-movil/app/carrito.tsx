import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Boton } from '@/componentes/Boton';
import { Contador } from '@/componentes/Contador';
import { FotoPlato } from '@/componentes/FotoPlato';
import { Icono } from '@/componentes/Icono';
import { usarCarrito } from '@/estado/carrito';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';
import { pesos, puntosDe } from '@/utils/formato';

export default function Carrito() {
  const insets = useSafeAreaInsets();
  const { lineas, cupon, setCupon, cambiarCantidad } = usarCarrito();
  const subtotal = usarCarrito((s) => s.subtotal());
  const descuento = usarCarrito((s) => s.descuento());
  const envio = usarCarrito((s) => s.envio());
  const total = usarCarrito((s) => s.total());
  const modalidad = usarCarrito((s) => s.modalidad);

  if (!lineas.length) {
    return (
      <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
        <Cabecera />
        <View style={s.vacio}>
          <View style={s.aro} />
          <Text style={titulo('h2', { fontSize: 24, marginBottom: e.e2 })}>Tu mesa está servida</Text>
          <Text style={[texto.b1, { color: color.tinta60, textAlign: 'center', marginBottom: e.e5 }]}>
            Todavía no has agregado nada. Empieza por lo que más piden en El Poblado.
          </Text>
          <Boton onPress={() => router.replace('/menu')}>Ver el menú</Boton>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <Cabecera />

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {lineas.map((l) => (
          <View key={l.clave} style={s.linea}>
            <FotoPlato url={l.imagen_url} alto={64} ancho={64} redondez={radio.r2} />
            <View style={{ flex: 1 }}>
              <Text style={texto.h4}>{l.nombre}</Text>
              {l.opciones.length ? (
                <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>
                  {l.opciones.map((o) => o.opcion).join(' · ')}
                </Text>
              ) : null}
              {l.notas ? (
                <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>“{l.notas}”</Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: e.e2 }}>
                <Text style={{ fontFamily: familia.bold, fontSize: 14 }}>
                  {pesos(l.precio_unitario * l.cantidad)}
                </Text>
                <View style={{ marginLeft: 'auto' }}>
                  <Contador
                    valor={l.cantidad}
                    minimo={0}
                    escala={0.82}
                    onCambiar={(d) => cambiarCantidad(l.clave, d)}
                  />
                </View>
              </View>
            </View>
          </View>
        ))}

        <Boton variante="secundario" bloque estilo={{ marginTop: e.e4 }} onPress={() => router.replace('/menu')}>
          Agregar algo más
        </Boton>

        <Text style={[texto.h3, { marginTop: e.e6, marginBottom: e.e3 }]}>Cupones</Text>
        {cupon ? (
          <View style={[s.fila, s.filaOn]}>
            <View style={[s.sello, { backgroundColor: color.teal }]}>
              <Icono nombre="check" tamano={18} tono={color.blanco} grosor={2.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={texto.h4}>{cupon.titulo}</Text>
              <Text style={[texto.b2, { color: color.tinta60 }]}>Aplicado a tu pedido</Text>
            </View>
            <Pressable onPress={() => setCupon(null)} accessibilityLabel="Quitar cupón" hitSlop={10}>
              <Icono nombre="cerrar" tamano={18} tono={color.tinta40} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={s.fila} onPress={() => router.push('/promos')}>
            <View style={[s.sello, { backgroundColor: color.crema }]}>
              <Icono nombre="promos" tamano={18} grosor={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={texto.h4}>Tienes cupones disponibles</Text>
              <Text style={[texto.b2, { color: color.tinta60 }]}>Uno de ellos te ahorra 20%</Text>
            </View>
            <Icono nombre="flecha" tamano={18} tono={color.tinta40} />
          </Pressable>
        )}

        <View style={s.cuenta}>
          <Renglon etiqueta="Subtotal" valor={pesos(subtotal)} />
          {descuento > 0 && <Renglon etiqueta="Descuento" valor={`− ${pesos(descuento)}`} verde />}
          {modalidad === 'domicilio' && (
            <Renglon etiqueta="Domicilio" valor={envio ? pesos(envio) : 'Gratis'} />
          )}
          <View style={s.renglonTotal}>
            <Text style={{ fontFamily: familia.bold, fontSize: 17 }}>Total</Text>
            <Text style={{ fontFamily: familia.bold, fontSize: 17 }}>{pesos(total)}</Text>
          </View>
          <Text style={[texto.b2, { color: color.tealTexto, textAlign: 'right', marginTop: 6 }]}>
            Ganas {puntosDe(total)} puntos con este pedido
          </Text>
        </View>
      </ScrollView>

      <View style={[s.accion, { paddingBottom: insets.bottom + e.e3 }]}>
        <Boton bloque onPress={() => router.push('/checkout')}>
          {`Continuar al pago · ${pesos(total)}`}
        </Boton>
      </View>
    </View>
  );
}

function Cabecera() {
  return (
    <View style={s.superior}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
        <Icono nombre="atras" tamano={20} tono={color.carbon} />
      </Pressable>
      <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Tu pedido</Text>
    </View>
  );
}

function Renglon({ etiqueta, valor, verde }: { etiqueta: string; valor: string; verde?: boolean }) {
  return (
    <View style={s.renglon}>
      <Text style={[texto.b1, { color: color.tinta60 }]}>{etiqueta}</Text>
      <Text style={[texto.b1, verde && { color: color.tealTexto, fontFamily: familia.semibold }]}>{valor}</Text>
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
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: e.e6 },
  aro: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 5,
    borderColor: 'rgba(242,107,31,0.2)',
    marginBottom: e.e4,
  },
  linea: {
    flexDirection: 'row',
    gap: e.e3,
    paddingVertical: e.e3,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    padding: e.e4,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.blanco,
  },
  filaOn: { borderColor: color.naranja, backgroundColor: 'rgba(242,107,31,0.05)' },
  sello: { width: 36, height: 36, borderRadius: radio.r2, alignItems: 'center', justifyContent: 'center' },
  cuenta: {
    marginTop: e.e5,
    padding: e.e4,
    borderRadius: radio.r4,
    backgroundColor: color.blanco,
    ...sombra.suave,
  },
  renglon: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  renglonTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: color.linea,
    marginTop: e.e2,
    paddingTop: e.e3,
  },
  accion: {
    paddingHorizontal: e.e4,
    paddingTop: e.e4,
    backgroundColor: color.marfil,
    borderTopWidth: 1,
    borderTopColor: color.linea,
  },
});
