/** Formatos de la sede de Medellín. Al abrir en España solo cambia la moneda. */

export function pesos(valor: number, moneda: string = 'COP'): string {
  if (moneda === 'EUR') {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(valor);
  }
  return '$' + Math.round(valor).toLocaleString('es-CO');
}

export function minutosDesde(fechaISO: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(fechaISO).getTime()) / 60000));
}

export function horaCorta(fechaISO: string): string {
  return new Date(fechaISO)
    .toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace('a. m.', 'a. m.')
    .replace('p. m.', 'p. m.');
}

export function fechaLarga(fechaISO: string): string {
  return new Date(fechaISO).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function saludo(fecha: Date = new Date()): string {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Puntos que deja un pedido: 1 por cada $1.000 */
export function puntosDe(total: number): number {
  return Math.floor(total / 1000);
}
