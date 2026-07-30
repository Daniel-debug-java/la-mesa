import { StyleSheet, Text, View } from 'react-native';
import { color, radio } from '@/tema/tokens';
import { familia } from '@/tema/tipografia';
import { BadgeProducto } from '@/datos/tipos';

const ETIQUETAS: Record<BadgeProducto, { texto: string; fondo: string; tinta: string }> = {
  exclusivo_app: { texto: 'Exclusivo app', fondo: color.naranja, tinta: color.blanco },
  nuevo: { texto: 'Nuevo', fondo: color.amarillo, tinta: color.carbon },
  descuento: { texto: '20% off', fondo: color.teal, tinta: color.carbon },
  popular: { texto: 'Popular', fondo: color.carbon, tinta: color.blanco },
  agotado: { texto: 'Agotado', fondo: '#EDE6DE', tinta: color.tinta40 },
};

export function Badge({ tipo }: { tipo: BadgeProducto }) {
  const b = ETIQUETAS[tipo];
  return (
    <View style={[s.caja, { backgroundColor: b.fondo }]}>
      <Text style={[s.texto, { color: b.tinta }]}>{b.texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    height: 22,
    paddingHorizontal: 10,
    borderRadius: radio.redondo,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  texto: {
    fontFamily: familia.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
