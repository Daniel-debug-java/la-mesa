import { createClient } from 'jsr:@supabase/supabase-js@2';
import { eventoEsAutentico, json } from '../_compartido/firma.ts';

/**
 * Recibe la confirmación de pago de Wompi y es lo único que puede mover un
 * pedido de `pendiente_pago` a `recibido`. La app nunca decide que un pago
 * salió bien: solo lo sabe el servidor, cuando Wompi lo dice y la firma cuadra.
 *
 * Esta función se despliega con --no-verify-jwt porque quien llama es Wompi,
 * no un usuario; la autenticidad se comprueba con el checksum del evento.
 */

interface Transaccion {
  id: string;
  reference: string;
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const secretoEventos = Deno.env.get('WOMPI_SECRETO_EVENTOS');
  if (!secretoEventos) {
    console.error('Falta WOMPI_SECRETO_EVENTOS');
    return json({ error: 'Sin configurar' }, 500);
  }

  let evento;
  try {
    evento = await req.json();
  } catch {
    return json({ error: 'Cuerpo ilegible' }, 400);
  }

  if (!(await eventoEsAutentico(evento, secretoEventos))) {
    console.warn('[webhook] checksum inválido, evento descartado');
    return json({ error: 'Firma inválida' }, 401);
  }

  const transaccion = evento?.data?.transaction as Transaccion | undefined;
  if (!transaccion?.reference) return json({ ok: true, nota: 'Evento sin transacción' });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pedido } = await admin
    .from('pedidos')
    .select('id, numero, total, estado, estado_pago')
    .eq('id', transaccion.reference)
    .single();

  // Devolvemos 200 igual: si respondiéramos error, Wompi reintentaría
  // tres veces durante 24 horas un evento que nunca vamos a poder procesar.
  if (!pedido) {
    console.warn(`[webhook] referencia desconocida: ${transaccion.reference}`);
    return json({ ok: true, nota: 'Referencia desconocida' });
  }

  // Idempotencia: Wompi puede reenviar el mismo evento y no debe alterar
  // un pedido que cocina ya movió de estado.
  if (pedido.estado_pago === 'aprobado' && transaccion.status === 'APPROVED') {
    return json({ ok: true, nota: 'Ya estaba aprobado' });
  }

  // El monto tiene que coincidir con lo que la base dice que vale el pedido
  const esperados = Math.round(Number(pedido.total) * 100);
  if (transaccion.status === 'APPROVED' && transaccion.amount_in_cents !== esperados) {
    console.error(
      `[webhook] monto distinto en pedido #${pedido.numero}: ` +
        `llegaron ${transaccion.amount_in_cents}, esperábamos ${esperados}`,
    );
    await admin.from('pedidos').update({
      estado_pago: 'rechazado',
      notas: 'Revisión manual: el monto pagado no coincide con el pedido.',
    }).eq('id', pedido.id);
    return json({ ok: true, nota: 'Monto no coincide' });
  }

  const cambios: Record<string, unknown> = { pago_referencia: transaccion.id };

  switch (transaccion.status) {
    case 'APPROVED':
      cambios.estado_pago = 'aprobado';
      // Solo empujamos a cocina si el pedido seguía esperando el pago
      if (pedido.estado === 'pendiente_pago') {
        cambios.estado = 'recibido';
        cambios.confirmado_en = new Date().toISOString();
      }
      break;

    case 'DECLINED':
    case 'ERROR':
      cambios.estado_pago = 'rechazado';
      if (pedido.estado === 'pendiente_pago') {
        cambios.estado = 'cancelado';
        cambios.cancelado_en = new Date().toISOString();
        cambios.motivo_cancelacion =
          transaccion.status === 'DECLINED' ? 'El pago fue rechazado' : 'Error en la pasarela';
      }
      break;

    case 'VOIDED':
      cambios.estado_pago = 'reembolsado';
      break;

    default:
      return json({ ok: true, nota: `Estado ${transaccion.status} sin acción` });
  }

  const { error } = await admin.from('pedidos').update(cambios).eq('id', pedido.id);
  if (error) {
    // Aquí sí conviene el reintento de Wompi: el evento era válido y
    // fallamos nosotros.
    console.error('[webhook] no se pudo actualizar el pedido', error);
    return json({ error: 'No se pudo guardar' }, 500);
  }

  console.log(`[webhook] pedido #${pedido.numero} → ${transaccion.status}`);
  return json({ ok: true });
});
