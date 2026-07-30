import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color, radio } from '@/tema/tokens';

/**
 * Foto del plato. Mientras un producto no tenga foto cargada desde el panel,
 * se dibuja un tejido de color propio de su categoría con el anillo de la
 * marca: se lee como una decisión, no como una imagen rota.
 */
const TEJIDOS: Record<string, [string, string]> = {
  hamburguesas: ['#F9C65C', '#F26B1F'],
  parrilla: ['#F26B1F', '#1F1F1F'],
  bowls: ['#8FE0BE', '#2EBC83'],
  bebidas: ['#FFF6ED', '#F9C65C'],
  postres: ['#FBEEE1', '#F26B1F'],
};

interface Props {
  url?: string | null;
  categoria?: string;
  ancho?: number | `${number}%`;
  alto: number;
  redondez?: number;
  estilo?: ViewStyle;
}

export function FotoPlato({
  url,
  categoria = 'hamburguesas',
  ancho = '100%',
  alto,
  redondez = radio.r3,
  estilo,
}: Props) {
  const [desde, hasta] = TEJIDOS[categoria] ?? TEJIDOS.hamburguesas;

  return (
    <View
      style={[
        { width: ancho, height: alto, borderRadius: redondez, overflow: 'hidden', backgroundColor: color.crema },
        estilo,
      ]}
    >
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="tejido" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={desde} />
              <Stop offset="1" stopColor={hasta} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#tejido)" />
          <Circle
            cx="50%"
            cy="50%"
            r={alto * 0.28}
            stroke="rgba(255,255,255,0.34)"
            strokeWidth={5}
            fill="none"
          />
        </Svg>
      )}
    </View>
  );
}
