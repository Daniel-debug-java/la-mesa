import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json } from '../_compartido/firma.ts';

/**
 * Avisa al cliente cuando su pedido cambia de estado.
 *
 * La dispara un Database Webhook de Supabase en cada UPDATE de `pedidos`.
 * El seguimiento dentro de la app ya llega por Realtime; esto es para cuando
 * el cliente tiene el teléfono guardado, que es casi siempre.
 */

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

/** Un aviso por cambio que le importe al cliente. Los demás no se mandan. */
const MENSAJES: Record<string, { titulo: string; cuerpo: (n: number, m: string) => string }> = {
  recibido: {
    titulo: 'Recibimos tu pedido',
    cuerpo: (n) => `Pedido #${n} confirmado. Ya está en cocina.`,
  },
  en_preparacion: {
    titulo: 'Manos a la obra',
    cuerpo: (n) => `Estamos preparando tu pedido #${n}.`,
  },
  listo: {
    titulo: 'Tu pedido está listo',
    cuerpo: (n, m) =>
      m === 'recoger'
        ? `Pásalo a buscar en la barra. Pedido #${n}.`
        : `Va en camino. Pedido #${n}.`,
  },
  en_camino: {
    titulo: 'Va en camino',
    cuerpo: (n) => `Tu pedido #${n} salió hacia tu dirección.`,
  },
  entregado: {
    titulo: 'Que lo disfrutes',
    cuerpo: (n) => `Pedido #${n} entregado. Y que se comparta.`,
  },
  cancelado: {
    titulo: 'Tu pedido se canceló',
    cuerpo: (n) => `El pedido #${n} no se pudo completar. No se te cobró nada.`,
  },
};

interface CargaWebhook {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: {
    id: string;
    numero: number;
    estado: string;
    modalidad: string;
    usuario_id: string;
    puntos_ganados: number;
  };
  old_record: { estado: string } | null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  // Solo lo llama la base de datos, con un secreto compartido en la cabecera
  const esperado = Deno.env.get('SECRETO_WEBHOOK_INTERNO');
  if (esperado && req.headers.get('x-secreto-interno') !== esperado) {
    return json({ error: 'No autorizado' }, 401);
  }

  let carga: CargaWebhook;
  try {
    carga = await req.json();
  } catch {
    return json({ error: 'Cuerpo ilegible' }, 400);
  }

  const nuevo = carga.record;
  const anterior = carga.old_record?.estado;

  // Sin cambio de estado no hay nada que avisar: un update de notas
  // no debería sonar en el teléfono de nadie.
  if (!nuevo || nuevo.estado === anterior) return json({ ok: true, nota: 'Sin cambio de estado' });

  const plantilla = MENSAJES[nuevo.estado];
  if (!plantilla) return json({ ok: true, nota: `Estado ${nuevo.estado} sin aviso` });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: perfil } = await admin
    .from('perfiles')
    .select('push_token, acepta_promos')
    .eq('id', nuevo.usuario_id)
    .single();

  if (!perfil?.push_token) return json({ ok: true, nota: 'Sin token de notificaciones' });

  let cuerpo = plantilla.cuerpo(nuevo.numero, nuevo.modalidad);
  if (nuevo.estado === 'entregado' && nuevo.puntos_ganados > 0) {
    cuerpo += ` Ganaste ${nuevo.puntos_ganados} puntos.`;
  }

  const respuesta = await fetch(EXPO_PUSH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: perfil.push_token,
      sound: 'default',
      title: plantilla.titulo,
      body: cuerpo,
      channelId: 'pedidos',
      priority: 'high',
      // Al tocar el aviso, la app abre el seguimiento de ese pedido
      data: { ruta: `/pedido/${nuevo.numero}` },
    }),
  });

  const resultado = await respuesta.json().catch(() => null);

  // Un token que ya no sirve se limpia para no seguir intentando
  const detalle = resultado?.data?.details?.error;
  if (detalle === 'DeviceNotRegistered') {
    await admin.from('perfiles').update({ push_token: null }).eq('id', nuevo.usuario_id);
    return json({ ok: true, nota: 'Token dado de baja' });
  }

  if (!respuesta.ok) {
    console.error('[push] Expo respondió con error', resultado);
    return json({ ok: false }, 502);
  }

  return json({ ok: true, estado: nuevo.estado });
});
