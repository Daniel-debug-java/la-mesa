import { TextStyle } from 'react-native';
import { color } from './tokens';

/**
 * Escala tipográfica del design system.
 *
 * Canela es una fuente comercial de Commercial Type y necesita licencia
 * (escritorio y app se licencian por separado). Mientras llega, la familia
 * `Canela` apunta a un archivo que todavía no existe, así que el cargador
 * de fuentes usa el sustituto y la app funciona igual. El día que se compre
 * la licencia se copian los .otf a assets/fuentes/ y se activan las dos
 * líneas comentadas en cargarFuentes(): no hay que tocar ninguna pantalla.
 */
export const familia = {
  display: 'Canela',
  displaySustituto: 'InstrumentSerif',
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
} as const;

/** Se resuelve en tiempo de ejecución según lo que haya cargado */
export let displayActiva: string = familia.displaySustituto;
export function usarCanela() {
  displayActiva = familia.display;
}

const t = (s: TextStyle) => s;

export const texto = {
  h1: t({ fontSize: 42, lineHeight: 50, letterSpacing: -0.42, color: color.carbon }),
  h2: t({ fontSize: 32, lineHeight: 38, letterSpacing: -0.32, color: color.carbon }),
  h3: t({ fontFamily: familia.semibold, fontSize: 20, lineHeight: 24, color: color.carbon }),
  h4: t({ fontFamily: familia.medium, fontSize: 16, lineHeight: 19, color: color.carbon }),
  b1: t({ fontFamily: familia.regular, fontSize: 14, lineHeight: 21, color: color.carbon }),
  b2: t({ fontFamily: familia.regular, fontSize: 12, lineHeight: 18, color: color.carbon }),
  caption: t({
    fontFamily: familia.medium,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.66,
    textTransform: 'uppercase',
    color: color.tinta60,
  }),
} as const;

/** Los títulos usan la display, que se resuelve al montar la app */
export const titulo = (nivel: 'h1' | 'h2', extra?: TextStyle): TextStyle => ({
  ...texto[nivel],
  fontFamily: displayActiva,
  ...extra,
});
