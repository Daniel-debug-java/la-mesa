import { createClient } from 'jsr:@supabase/supabase-js@2';
import { CORS, firmaIntegridad, json } from '../_compartido/firma.ts';

/**
 * Prepara el cobro de un pedido.
 *
 * Regla de oro: el monto NUNCA se recibe del teléfono. Se vuelve a leer de
 * la base de datos con la llave de servicio, y sobre ese valor se firma.
 * Si alguien manipula la app para pedir una hamburguesa por $1.000, el
 * cobro sigue saliendo por el total real del pedido.
 */

const URL_CHECKOUT = 'https://checkout.wompi.co/p/';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const llavePublica = Deno.env.get('WOMPI_LLAVE_PUBLICA');
  const secretoIntegridad = Deno.env.get('WOMPI_SECRETO_INTEGRIDAD');
  const redireccion = Deno.env.get('WOMPI_REDIRECCION') ?? 'lamesa://pago';

  if (!llavePublica || !secretoIntegridad) {
    console.error('Faltan WOMPI_LLAVE_PUBLICA o WOMPI_SECRETO_INTEGRIDAD');
    return json({ error: 'El cobro no está configurado todavía.' }, 500);
  }

  // Quién pide el cobro: se valida con el token del usuario, no con lo que diga el cuerpo
  const autorizacion = req.headers.get('Authorization') ?? '';
  const comoUsuario = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: autorizacion } } },
  );

  const { data: sesion } = await comoUsuario.auth.getUser();
  if (!sesion?.user) return json({ error: 'Necesitas iniciar sesión.' }, 401);

  let cuerpo: { pedido_id?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: 'No pudimos leer la solicitud.' }, 400);
  }
  if (!cuerpo.pedido_id) return json({ error: 'Falta el pedido.' }, 400);

  // Lectura autoritativa del pedido
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pedido, error } = await admin
    .from('pedidos')
    .select('id, numero, usuario_id, total, moneda, estado, estado_pago, metodo_pago')
    .eq('id', cuerpo.pedido_id)
    .single();

  if (error || !pedido) return json({ error: 'Ese pedido no existe.' }, 404);
  if (pedido.usuario_id !== sesion.user.id) return json({ error: 'Ese pedido no es tuyo.' }, 403);
  if (pedido.estado_pago === 'aprobado') return json({ error: 'Ese pedido ya está pagado.' }, 409);
  if (pedido.estado === 'cancelado') return json({ error: 'Ese pedido fue cancelado.' }, 409);
  if (pedido.metodo_pago === 'efectivo') {
    return json({ error: 'El efectivo se cobra al entregar, no por la pasarela.' }, 409);
  }
  if (!pedido.total || pedido.total <= 0) return json({ error: 'El pedido no tiene monto.' }, 422);

  const centavos = Math.round(Number(pedido.total) * 100);
  const moneda = pedido.moneda ?? 'COP';
  const referencia = pedido.id; // uuid único: el webhook lo usa para encontrar el pedido

  // Media hora para pagar; pasada la ventana la referencia deja de servir
  const expiraEn = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const firma = await firmaIntegridad(referencia, centavos, moneda, secretoIntegridad, expiraEn);

  const url =
    `${URL_CHECKOUT}?public-key=${encodeURIComponent(llavePublica)}` +
    `&currency=${moneda}` +
    `&amount-in-cents=${centavos}` +
    `&reference=${encodeURIComponent(referencia)}` +
    `&signature:integrity=${firma}` +
    `&expiration-time=${encodeURIComponent(expiraEn)}` +
    `&redirect-url=${encodeURIComponent(redireccion)}` +
    (sesion.user.email ? `&customer-data:email=${encodeURIComponent(sesion.user.email)}` : '');

  await admin
    .from('pedidos')
    .update({ pago_referencia: referencia })
    .eq('id', pedido.id);

  return json({ url, referencia, centavos, moneda, expira_en: expiraEn, numero: pedido.numero });
});
