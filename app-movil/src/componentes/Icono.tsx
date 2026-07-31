import { useEffect } from 'react';
import { ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { color } from '@/tema/tokens';

/**
 * Iconografía del design system: trazo lineal de 2px, esquinas redondeadas.
 * Un solo componente para que nadie meta un set de iconos ajeno.
 */
export type IconoCategoria = 'hamburguesas' | 'parrilla' | 'bowls' | 'bebidas' | 'postres';

export type NombreIcono =
  | IconoCategoria
  | 'inicio' | 'menu' | 'promos' | 'momentos' | 'perfil'
  | 'favoritos' | 'compartir' | 'bolsa' | 'notificaciones' | 'ubicacion'
  | 'atras' | 'mas' | 'menos' | 'check' | 'cerrar' | 'reloj' | 'moto'
  | 'flecha' | 'tarjeta' | 'efectivo' | 'mesa';

/**
 * Las cinco categorías no se guardan como una lista plana de trazos sino por
 * piezas, y eso habilita las dos cosas que las distinguen del resto del set:
 *
 * · el duotono — la `masa` de cada icono lleva el mismo tono detrás, muy
 *   diluido, así la silueta se reconoce antes de leer el trazo; y
 * · el movimiento — en la mesa giratoria, al tocar un plato entra desplazada
 *   una sola pieza, la que cuenta la historia de esa categoría: el pan se
 *   destapa, la cereza cae, el bowl y el vaso se llenan, la reja toma calor.
 *
 * Es una sola animación con distinto punto de partida, no cinco animaciones
 * sueltas: la pieza que se mueve es lo que cambia, no el gesto.
 */
interface PiezaIcono {
  n: string;
  /** Se rellena con el tono al 15%: es lo que da el duotono. */
  masa?: string;
  /** Se rellena entero (la cereza del postre). */
  solido?: string;
  trazos?: string[];
}

export const CATEGORIAS: Record<
  IconoCategoria,
  { viva: string; desde: number; piezas: PiezaIcono[] }
> = {
  hamburguesas: {
    viva: 'tapa',
    desde: -3.4,
    piezas: [
      {
        n: 'tapa',
        masa: 'M4 11.2a8 8 0 0 1 16 0z',
        // ajonjolí: puntos, aprovechando el remate redondo del trazo
        trazos: ['M9.5 7.9h.01', 'M12 7h.01', 'M14.5 7.9h.01'],
      },
      { n: 'base', trazos: ['M3.6 14.6h16.8', 'M5.2 18h13.6'] },
    ],
  },
  parrilla: {
    viva: 'barras',
    desde: 2.2,
    piezas: [
      { n: 'reja', masa: 'M4 11.4a8 8 0 1 0 16 0 8 8 0 1 0-16 0' },
      { n: 'barras', trazos: ['M5.6 7.4h12.8', 'M4.2 11.4h15.6', 'M5.6 15.4h12.8'] },
      { n: 'patas', trazos: ['m8.6 17.8-1.5 3.4', 'm15.4 17.8 1.5 3.4'] },
    ],
  },
  bowls: {
    viva: 'contenido',
    desde: 3,
    piezas: [
      { n: 'cuenco', masa: 'M3.4 11.8h17.2a8.6 8.6 0 0 1-17.2 0z' },
      { n: 'contenido', trazos: ['M6.8 11.8a5.2 5.2 0 0 1 10.4 0'] },
    ],
  },
  bebidas: {
    viva: 'liquido',
    desde: 3,
    piezas: [
      { n: 'vaso', masa: 'M6.6 6.6h10.8l-1.3 13.6H7.9z' },
      { n: 'pitillo', trazos: ['m14 6.6 3-4.2'] },
      { n: 'liquido', trazos: ['M5.9 10.8h12.2'] },
    ],
  },
  postres: {
    viva: 'cereza',
    desde: -4,
    piezas: [
      {
        n: 'capacillo',
        masa: 'M5.8 12.6h12.4l-1.3 7.5a1.5 1.5 0 0 1-1.5 1.3H8.6a1.5 1.5 0 0 1-1.5-1.3z',
      },
      { n: 'crema', trazos: ['M6.6 12.6c0-3.2 2.4-5.2 5.4-5.2s5.4 2 5.4 5.2'] },
      { n: 'cereza', solido: 'M10.7 5.2a1.3 1.3 0 1 0 2.6 0 1.3 1.3 0 1 0-2.6 0' },
    ],
  },
};

const esCategoria = (n: NombreIcono): n is IconoCategoria => n in CATEGORIAS;

const TRAZOS: Record<Exclude<NombreIcono, IconoCategoria>, string[]> = {
  inicio: ['M3 10.6 12 3.4l9 7.2', 'M5.6 9.6V20h12.8V9.6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  promos: [
    'M3.6 11h16.8v3.2H3.6z', 'M12 11v9.6', 'M5 14.2h14V20H5z',
    'M12 11S11 7.2 8.7 7.2a2 2 0 1 0 0 3.8', 'M12 11s1-3.8 3.3-3.8a2 2 0 1 1 0 3.8',
  ],
  momentos: ['m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z'],
  perfil: ['M4.8 20c.9-3.4 3.8-5.4 7.2-5.4s6.3 2 7.2 5.4'],
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
const FORMAS: Partial<Record<Exclude<NombreIcono, IconoCategoria>, React.ReactNode>> = {
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

function Pieza({ pieza, tono }: { pieza: PiezaIcono; tono: ColorValue }) {
  return (
    <>
      {pieza.masa ? <Path d={pieza.masa} fill={tono} fillOpacity={0.15} /> : null}
      {pieza.solido ? <Path d={pieza.solido} fill={tono} /> : null}
      {(pieza.trazos ?? []).map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </>
  );
}

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
      {esCategoria(nombre) ? (
        CATEGORIAS[nombre].piezas.map((p) => <Pieza key={p.n} pieza={p} tono={tono} />)
      ) : (
        <>
          {FORMAS[nombre]}
          {TRAZOS[nombre].map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </>
      )}
    </Svg>
  );
}

const GAnimado = Animated.createAnimatedComponent(G);

/**
 * El icono de una categoría en la mesa giratoria. Igual al de siempre, pero
 * cada vez que `toque` cambia, su pieza viva entra desplazada y encaja.
 *
 * La pieza descansa siempre en su sitio: si la animación no llega a correr
 * —"reducir movimiento" activado, o el hilo de UI ocupado— lo que se ve es
 * el icono quieto y correcto, nunca uno a medio armar.
 */
export function IconoCategoriaVivo({
  nombre,
  toque,
  tamano = 26,
  tono = color.naranjaIcono,
  grosor = 1.9,
}: {
  nombre: IconoCategoria;
  /** Contador: cada incremento vuelve a lanzar la animación. */
  toque: number;
  tamano?: number;
  tono?: ColorValue;
  grosor?: number;
}) {
  const { viva, desde, piezas } = CATEGORIAS[nombre];
  const y = useSharedValue(0);
  const movimientoReducido = useReducedMotion();

  useEffect(() => {
    if (!toque || movimientoReducido) return;
    y.value = desde;
    y.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.back(1.8)) });
  }, [toque, desde, movimientoReducido, y]);

  const propsVivos = useAnimatedProps(() => ({ transform: `translate(0 ${y.value})` }));

  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke={tono}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {piezas.map((p) =>
        p.n === viva ? (
          <GAnimado key={p.n} animatedProps={propsVivos}>
            <Pieza pieza={p} tono={tono} />
          </GAnimado>
        ) : (
          <Pieza key={p.n} pieza={p} tono={tono} />
        ),
      )}
    </Svg>
  );
}
