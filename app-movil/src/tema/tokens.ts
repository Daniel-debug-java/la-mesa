/**
 * La Mesa · Design tokens
 * Traducción literal del design system v1.0 (mayo 2024).
 * Ningún color, tamaño o sombra debería escribirse a mano fuera de aquí.
 */

export const color = {
  naranja: '#F26B1F',      // primario · llamadas a la acción
  naranjaIcono: '#F2681F', // iconografía
  naranjaOscuro: '#E15E15',
  amarillo: '#F9C65C',     // secundario · destacados
  marfil: '#FFF6ED',       // fondos y superficies
  carbon: '#1F1F1F',       // texto principal
  teal: '#2EBC83',         // acento · confirmaciones
  crema: '#FBEEE1',        // superficie secundaria
  blanco: '#FFFFFF',
  rojo: '#D64545',         // solo errores

  /**
   * Variantes de texto.
   *
   * El naranja y el teal de la marca son magníficos como relleno y malos
   * como letra pequeña: sobre marfil dan 2,85 y 2,28 de contraste, muy por
   * debajo del 4,5 que exige WCAG AA. Estas dos versiones conservan el tono
   * y la saturación, bajan la luminosidad y pasan con margen (4,95 y 4,96)
   * sobre marfil, crema y blanco.
   *
   * Regla: naranja/teal para superficies y acciones, estas para texto.
   */
  naranjaTexto: '#B8480A',
  tealTexto: '#1C7A54',
  rojoTexto: '#D23232',

  /** Texto secundario. Pasa AA sobre marfil, crema y blanco. */
  tinta60: 'rgba(31,31,31,0.66)',
  /** Solo decorativo o deshabilitado. Nunca para texto que haya que leer. */
  tinta40: 'rgba(31,31,31,0.42)',
  linea: 'rgba(31,31,31,0.10)',
  naranjaSuave: 'rgba(242,107,31,0.12)',
} as const;

/** Sistema de 8px */
export const e = {
  e1: 4,
  e2: 8,
  e3: 12,
  e4: 16,
  e5: 24,
  e6: 32,
  e7: 40,
  e8: 48,
  e9: 64,
  e10: 80,
} as const;

export const radio = {
  r1: 4,
  r2: 8,
  r3: 12,
  r4: 16,
  redondo: 999,
} as const;

/**
 * Sombras. iOS y Android las expresan distinto, así que cada nivel
 * trae ambas y se aplican con un solo spread.
 */
export const sombra = {
  suave: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  media: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  fuerte: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 10,
  },
} as const;

/** Grid móvil del design system: 375px, margen 16, canal 16 */
export const grid = {
  margen: 16,
  canal: 16,
} as const;

/** Programa de fidelidad */
export const fidelidad = {
  pesosPorPunto: 1000,
  niveles: [
    { id: 'bronce', nombre: 'Bronce', desde: 0 },
    { id: 'plata', nombre: 'Plata', desde: 500 },
    { id: 'oro', nombre: 'Oro', desde: 1500 },
  ],
} as const;

export type Nivel = (typeof fidelidad.niveles)[number]['id'];

export function nivelDe(puntosHistoricos: number): Nivel {
  if (puntosHistoricos >= 1500) return 'oro';
  if (puntosHistoricos >= 500) return 'plata';
  return 'bronce';
}

export function siguienteNivel(puntosHistoricos: number) {
  const actual = nivelDe(puntosHistoricos);
  if (actual === 'oro') return null;
  const meta = actual === 'bronce' ? 500 : 1500;
  return { meta, faltan: meta - puntosHistoricos, progreso: puntosHistoricos / meta };
}
