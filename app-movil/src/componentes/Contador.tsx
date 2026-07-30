import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia } from '@/tema/tipografia';
import { Icono } from './Icono';

export function Contador({
  valor,
  onCambiar,
  minimo = 1,
  escala = 1,
}: {
  valor: number;
  onCambiar: (delta: number) => void;
  minimo?: number;
  escala?: number;
}) {
  const lado = 34 * escala;

  return (
    <View style={[s.caja, { borderRadius: radio.redondo, padding: 5 * escala }]}>
      <Pressable
        onPress={valor > minimo ? () => onCambiar(-1) : undefined}
        accessibilityLabel="Quitar uno"
        style={[s.boton, { width: lado, height: lado, borderRadius: lado / 2, opacity: valor > minimo ? 1 : 0.4 }]}
      >
        <Icono nombre="menos" tamano={16 * escala} tono={color.carbon} grosor={2.4} />
      </Pressable>

      <Text style={[s.numero, { fontSize: 15 * escala, marginHorizontal: e.e3 * escala }]}>{valor}</Text>

      <Pressable
        onPress={() => onCambiar(1)}
        accessibilityLabel="Agregar uno"
        style={[s.boton, { width: lado, height: lado, borderRadius: lado / 2 }]}
      >
        <Icono nombre="mas" tamano={16 * escala} tono={color.carbon} grosor={2.4} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: color.crema,
  },
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.marfil,
    ...sombra.suave,
  },
  numero: {
    fontFamily: familia.bold,
    color: color.carbon,
    minWidth: 20,
    textAlign: 'center',
  },
});
