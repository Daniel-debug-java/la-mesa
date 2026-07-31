import { HAY_BACKEND, SEDE_ID, supabase } from './supabase';
import { Mesa } from './tipos';

/** Sin I, O, 0 ni 1: el código se dicta en voz alta en la mesa. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function codigoLegible(largo = 6): string {
  let c = '';
  for (let i = 0; i < largo; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return c;
}

export async function abrirMesa(nombre = 'Nuestra mesa'): Promise<Mesa | null> {
  if (!HAY_BACKEND) {
    return {
      id: 'demo', codigo: codigoLegible(), nombre, anfitrion_id: 'demo',
      estado: 'abierta', dividir_cuenta: true, mesa_participantes: [],
    };
  }
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return null;

  const { data, error } = await supabase
    .from('mesas')
    .insert({ codigo: codigoLegible(), anfitrion_id: usuario.user.id, sede_id: SEDE_ID, nombre })
    .select()
    .single();
  if (error || !data) return null;

  await supabase
    .from('mesa_participantes')
    .insert({ mesa_id: data.id, usuario_id: usuario.user.id, es_anfitrion: true });

  return data as Mesa;
}

export async function unirseAMesa(codigo: string): Promise<Mesa | null> {
  if (!HAY_BACKEND) return null;
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return null;

  const { data: mesa } = await supabase
    .from('mesas')
    .select('*')
    .eq('codigo', codigo.toUpperCase())
    .eq('estado', 'abierta')
    .single();
  if (!mesa) return null;

  await supabase
    .from('mesa_participantes')
    .upsert({ mesa_id: mesa.id, usuario_id: usuario.user.id, es_anfitrion: false });

  return mesa as Mesa;
}

export async function traerMesa(codigo: string): Promise<Mesa | null> {
  if (!HAY_BACKEND) return null;
  const { data } = await supabase
    .from('mesas')
    .select('*, mesa_participantes(usuario_id,es_anfitrion,listo,perfiles(nombre,avatar_url))')
    .eq('codigo', codigo.toUpperCase())
    .single();
  return (data as Mesa) ?? null;
}

/** Cada plato que agrega alguien aparece en el teléfono de los demás */
export function seguirMesa(mesaId: string, alCambiar: () => void): () => void {
  if (!HAY_BACKEND) return () => {};
  const canal = supabase
    .channel(`mesa-${mesaId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_participantes', filter: `mesa_id=eq.${mesaId}` }, alCambiar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, alCambiar)
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

export async function cerrarMesa(mesaId: string, dividir: boolean) {
  if (!HAY_BACKEND) return;
  await supabase.from('mesas').update({ estado: 'cerrada', dividir_cuenta: dividir, cerrada_en: new Date().toISOString() }).eq('id', mesaId);
}

/** Cuántas mesas ha compartido el cliente, como anfitrión o invitado. */
export async function contarMisMesas(): Promise<number> {
  if (!HAY_BACKEND) return 3; // igual al número de Momentos de ejemplo
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return 0;
  const { data } = await supabase
    .from('mesa_participantes')
    .select('mesa_id')
    .eq('usuario_id', usuario.user.id);
  return data ? data.length : 0;
}
