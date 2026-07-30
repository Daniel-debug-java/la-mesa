/**
 * Utilidades de firma para Wompi.
 *
 * Todo lo de este archivo corre en el servidor. El secreto de integridad y
 * el de eventos nunca salen de aquí: si estuvieran en la app, cualquiera
 * que descargue el APK podría firmar transacciones a nombre de La Mesa.
 */

export async function sha256(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Firma de integridad del Web Checkout.
 * El orden importa: referencia + monto en centavos + moneda + secreto,
 * y si hay fecha de expiración, se agrega al final.
 */
export async function firmaIntegridad(
  referencia: string,
  centavos: number,
  moneda: string,
  secreto: string,
  expiraEn?: string,
): Promise<string> {
  const base = `${referencia}${centavos}${moneda}${secreto}`;
  return sha256(expiraEn ? `${base}${expiraEn}` : base);
}

interface EventoWompi {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  signature: { properties: string[]; checksum: string };
}

/**
 * Valida que el evento venga de Wompi y no de alguien que descubrió la URL.
 * Se concatenan los valores de las propiedades que el propio evento lista,
 * más el timestamp y el secreto de eventos, y se compara el SHA-256.
 */
export async function eventoEsAutentico(
  evento: EventoWompi,
  secretoEventos: string,
): Promise<boolean> {
  if (!evento?.signature?.properties || !evento.signature.checksum) return false;

  const valores = evento.signature.properties.map((ruta) => {
    // Las propiedades vienen como "transaction.id", relativas a data
    const valor = ruta.split('.').reduce<unknown>(
      (nodo, llave) => (nodo && typeof nodo === 'object' ? (nodo as Record<string, unknown>)[llave] : undefined),
      evento.data,
    );
    return String(valor ?? '');
  });

  const calculado = await sha256(valores.join('') + evento.timestamp + secretoEventos);
  return comparacionSegura(calculado, evento.signature.checksum.toLowerCase());
}

/** Comparación de tiempo constante: no filtra información por cuánto tarda */
function comparacionSegura(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
