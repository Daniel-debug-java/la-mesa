import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { permisoNotificaciones, registrarNotificaciones } from '@/datos/notificaciones';
import { usarPreferencias } from '@/estado/preferencias';
import { color, e, radio, sombra } from '@/tema/tokens';
import { texto, titulo } from '@/tema/tipografia';

export default function Notificaciones() {
  const insets = useSafeAreaInsets();
  const { pedidos, promos, cargar, setPedidos, setPromos } = usarPreferencias();

  const [permiso, setPermiso] = useState<boolean | null>(null);
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    cargar();
    permisoNotificaciones().then(setPermiso);
  }, [cargar]);

  async function activar() {
    setActivando(true);
    try {
      const token = await registrarNotificaciones();
      setPermiso(Boolean(token));
    } finally {
      setActivando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Notificaciones</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        {permiso === false && (
          <View style={s.aviso}>
            <Icono nombre="notificaciones" tamano={18} grosor={2} />
            <View style={{ flex: 1, marginLeft: e.e3 }}>
              <Text style={texto.h4}>Las notificaciones están desactivadas</Text>
              <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>
                Actívalas para saber cuándo cambia el estado de tu pedido.
              </Text>
            </View>
          </View>
        )}

        {permiso === false && (
          <Boton estilo={{ marginBottom: e.e5 }} cargando={activando} onPress={activar}>
            Activar notificaciones
          </Boton>
        )}

        <Text style={[texto.h3, { marginBottom: e.e2 }]}>Qué quieres recibir</Text>
        <Text style={[texto.b2, { color: color.tinta60, marginBottom: e.e3 }]}>
          Esto decide qué categorías te llegan cuando las notificaciones están activadas.
        </Text>

        <View style={s.fila}>
          <View style={{ flex: 1 }}>
            <Text style={texto.h4}>Estado de mis pedidos</Text>
            <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>
              Cuando cocina recibe, prepara y entrega tu pedido.
            </Text>
          </View>
          <Switch
            value={pedidos}
            onValueChange={setPedidos}
            trackColor={{ false: color.linea, true: color.naranja }}
            thumbColor={color.blanco}
          />
        </View>

        <View style={s.fila}>
          <View style={{ flex: 1 }}>
            <Text style={texto.h4}>Promociones y novedades</Text>
            <Text style={[texto.b2, { color: color.tinta60, marginTop: 2 }]}>
              Cupones nuevos y anuncios de La Mesa. Nunca más de un par al mes.
            </Text>
          </View>
          <Switch
            value={promos}
            onValueChange={setPromos}
            trackColor={{ false: color.linea, true: color.naranja }}
            thumbColor={color.blanco}
          />
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
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: e.e4,
    marginBottom: e.e3,
    borderRadius: radio.r3,
    backgroundColor: '#FDF6E4',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    padding: e.e4,
    marginBottom: e.e2,
    borderRadius: radio.r3,
    backgroundColor: color.blanco,
    ...sombra.suave,
  },
});
