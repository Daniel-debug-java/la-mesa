import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { Icono, NombreIcono } from '@/componentes/Icono';
import { usarCarrito } from '@/estado/carrito';
import { color, radio } from '@/tema/tokens';
import { familia } from '@/tema/tipografia';

/** Las cinco pestañas del design system, en su orden */
const PESTANAS: { name: string; title: string; icono: NombreIcono }[] = [
  { name: 'index', title: 'Inicio', icono: 'inicio' },
  { name: 'menu', title: 'Menú', icono: 'menu' },
  { name: 'promos', title: 'Promos', icono: 'promos' },
  { name: 'momentos', title: 'Momentos', icono: 'momentos' },
  { name: 'perfil', title: 'Perfil', icono: 'perfil' },
];

export default function Pestanas() {
  const piezas = usarCarrito((s) => s.piezas());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.naranjaIcono,
        tabBarInactiveTintColor: color.tinta40,
        tabBarStyle: {
          backgroundColor: color.marfil,
          borderTopColor: color.linea,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        },
        tabBarLabelStyle: { fontFamily: familia.medium, fontSize: 10 },
      }}
    >
      {PESTANAS.map((p) => (
        <Tabs.Screen
          key={p.name}
          name={p.name}
          options={{
            title: p.title,
            tabBarIcon: ({ color: tono }) => (
              <View>
                <Icono nombre={p.icono} tamano={22} tono={tono} />
                {p.name === 'menu' && piezas > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -12,
                      minWidth: 16,
                      height: 16,
                      paddingHorizontal: 4,
                      borderRadius: radio.redondo,
                      backgroundColor: color.naranja,
                      borderWidth: 1.5,
                      borderColor: color.marfil,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: familia.bold, fontSize: 9.5, color: color.blanco }}>
                      {piezas}
                    </Text>
                  </View>
                ) : null}
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
