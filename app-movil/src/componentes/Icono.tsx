import { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { color } from '@/tema/tokens';

/**
 * Iconografía del design system: trazo lineal de 2px, esquinas redondeadas.
 * Un solo componente para que nadie meta un set de iconos ajeno.
 */
export type NombreIcono =
  | 'inicio' | 'menu' | 'promos' | 'momentos' | 'perfil'
  | 'hamburguesas' | 'parrilla' | 'bowls' | 'bebidas' | 'postres'
  | 'favoritos' | 'compartir' | 'bolsa' | 'notificaciones' | 'ubicacion'
  | 'atras' | 'mas' | 'menos' | 'check' | 'cerrar' | 'reloj' | 'moto'
  | 'flecha' | 'tarjeta' | 'efectivo' | 'mesa';

const TRAZOS: Record<NombreIcono, string[]> = {
  inicio: ['M3 10.6 12 3.4l9 7.2', 'M5.6 9.6V20h12.8V9.6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  promos: [
    'M3.6 11h16.8v3.2H3.6z', 'M12 11v9.6', 'M5 14.2h14V20H5z',
    'M12 11S11 7.2 8.7 7.2a2 2 0 1 0 0 3.8', 'M12 11s1-3.8 3.3-3.8a2 2 0 1 1 0 3.8',
  ],
  momentos: ['m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z'],
  perfil: ['M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4'],
  hamburguesas: ['M4 11.2a8 8 0 0 1 16 0z', 'M3.6 14.6h16.8', 'M5.2 18h13.6'],
  parrilla: ['M6.4 4v4.6', 'M12 3.2v5.4', 'M17.6 4v4.6', 'M4 11.6h16', 'm7.2 11.6-1 8.4', 'm16.8 11.6 1 8.4'],
  bowls: ['M3.6 11.2h16.8a8.4 8.4 0 0 1-16.8 0z', 'M9 7.6s.4-2 3-2 3 2 3 2'],
  bebidas: ['M6.4 4.8h11.2l-1.4 15H7.8z', 'M5.6 9.4h12.8'],
  postres: ['M5 20.6v-5.8h14v5.8z', 'M4.2 14.8c0-2 2.2-3 7.8-3s7.8 1 7.8 3', 'M12 3.4v4.2'],
  favoritos: ['M12 20s-7-4.4-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.6 12 20 12 20z'],
  compartir: ['m8.9 10.7 6.2-3.5', 'm8.9 13.3 6.2 3.5'],
  bolsa: ['M6 8h12l1 12H5z', 'M9 8V6.2a3 3 0 0 1 6 0V8'],
  notificaciones: ['M6.2 10.4a5.8 5.8 0 1 1 11.6 0c0 4.6 1.8 5.6 1.8 5.6H4.4s1.8-1 1.8-5.6z', 'M10.2 19.4a2 2 0 0 0 3.6 0'],
  ubicacion: ['M12 21s6.8-6.4 6.8-10.8a6.8 6.8 0 1 0-13.6 0C5.2 14.6 12 21 12 21z'],
  atras: ['m14.8 5-7 7 7 7'],
  mas: ['M12 5.6v12.8', 'M5.6 12h12.8'],
  menos: ['M5.6 12h12.8'],
  check: ['m4.6 12.4 5 5L19.4 6.6'],
  cerrar: ['m6.4 6.4 11.2 11.2', 'M17.6 6.4 6.4 17.6'],
  reloj: ['M12 7.4V12l3 2'],
  moto: ['M8.6 17h6.8l-3-8H9.4', 'M14 9h3.4l1.6 5'],
  flecha: ['M5 12h13', 'm12.6 6.4 5.6 5.6-5.6 5.6'],
  tarjeta: ['M3 10h18'],
  efectivo: [],
  mesa: ['M12 4.6v3'],
};

/** Los que además llevan círculos o rectángulos */
const FORMAS: Partial<Record<NombreIcono, React.ReactNode>> = {
  perfil: <Circle cx={12} cy={8.2} r={3.8} />,
  compartir: (
    <>
      <Circle cx={17.5} cy={5.8} r={2.6} />
      <Circle cx={6.5} cy={12} r={2.6} />
      <Circle cx={17.5} cy={18.2} r={2.6} />
    </>
  ),
  ubicacion: <Circle cx={12} cy={10} r={2.5} />,
  reloj: <Circle cx={12} cy={12} r={8.4} />,
  moto: (
    <>
      <Circle cx={5.8} cy={17} r={2.8} />
      <Circle cx={18.2} cy={17} r={2.8} />
    </>
  ),
  tarjeta: <Rect x={3} y={5.6} width={18} height={12.8} rx={2.4} />,
  efectivo: (
    <>
      <Rect x={3} y={6.6} width={18} height={10.8} rx={2} />
      <Circle cx={12} cy={12} r={2.6} />
    </>
  ),
  mesa: <Circle cx={12} cy={12} r={7.4} />,
};

interface Props {
  nombre: NombreIcono;
  tamano?: number;
  tono?: ColorValue;
  grosor?: number;
  /** Relleno sólido en vez de solo trazo — usado en "favoritos" cuando ya está guardado. */
  relleno?: boolean;
}

export function Icono({ nombre, tamano = 22, tono = color.naranjaIcono, grosor = 2, relleno }: Props) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? tono : 'none'}
      stroke={tono}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {FORMAS[nombre]}
      {TRAZOS[nombre].map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </Svg>
  );
}
