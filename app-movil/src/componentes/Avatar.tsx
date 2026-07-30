import { Image, StyleSheet, Text, View } from 'react-native';
import { color } from '@/tema/tokens';
import { familia } from '@/tema/tipografia';

const TONOS = [color.naranja, color.teal, color.carbon, color.amarillo];

function tonoDe(nombre: string) {
  let suma = 0;
  for (let i = 0; i < nombre.length; i++) suma += nombre.charCodeAt(i);
  return TONOS[suma % TONOS.length];
}

export function Avatar({
  nombre,
  url,
  tamano = 40,
  borde = true,
}: {
  nombre: string;
  url?: string | null;
  tamano?: number;
  borde?: boolean;
}) {
  const fondo = tonoDe(nombre || '?');
  const inicial = (nombre || '?').trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        s.caja,
        {
          width: tamano,
          height: tamano,
          borderRadius: tamano / 2,
          backgroundColor: fondo,
          borderWidth: borde ? 3 : 0,
        },
      ]}
    >
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} borderRadius={tamano / 2} />
      ) : (
        <Text
          style={{
            fontFamily: familia.bold,
            fontSize: tamano * 0.36,
            color: fondo === color.amarillo ? color.carbon : color.blanco,
          }}
        >
          {inicial}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  caja: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: color.marfil,
  },
});
