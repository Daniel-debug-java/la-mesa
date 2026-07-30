/**
 * Manda un evento de Wompi falso pero correctamente firmado, para probar
 * el webhook sin depender de la pasarela.
 *
 *   deno run --allow-net --allow-env supabase/functions/_pruebas/evento-falso.ts \
 *     --url https://<proyecto>.supabase.co/functions/v1/webhook-wompi \
 *     --secreto test_events_xxxx \
 *     --pedido <uuid del pedido> \
 *     --centavos 5870000 \
 *     --estado APPROVED
 */

function argumento(nombre: string, pordefecto = ''): string {
  const i = Deno.args.indexOf(`--${nombre}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : pordefecto;
}

async function sha256(texto: string) {
  const resumen = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const url = argumento('url');
const secreto = argumento('secreto');
const pedido = argumento('pedido');
const centavos = Number(argumento('centavos', '0'));
const estado = argumento('estado', 'APPROVED');

if (!url || !secreto || !pedido || !centavos) {
  console.error('Faltan argumentos. Mira el comentario de arriba para el uso.');
  Deno.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000);
const transaccion = {
  id: `01-${timestamp}-00000`,
  reference: pedido,
  status: estado,
  amount_in_cents: centavos,
  currency: 'COP',
  payment_method_type: 'NEQUI',
};

// Mismo orden que usa Wompi: valores de las propiedades + timestamp + secreto
const propiedades = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
const valores = [transaccion.id, transaccion.status, String(transaccion.amount_in_cents)];
const checksum = await sha256(valores.join('') + timestamp + secreto);

const evento = {
  event: 'transaction.updated',
  data: { transaction: transaccion },
  sent_at: new Date().toISOString(),
  timestamp,
  signature: { properties: propiedades, checksum },
};

const respuesta = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Event-Checksum': checksum },
  body: JSON.stringify(evento),
});

console.log(respuesta.status, await respuesta.text());
