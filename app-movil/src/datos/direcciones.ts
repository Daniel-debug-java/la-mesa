import { conRespaldo, HAY_BACKEND, supabase } from './supabase';
import { DIRECCIONES_DEMO } from './demo';
import { Direccion } from './tipos';

export async function traerDirecciones(): Promise<Direccion[]> {
  return conRespaldo<Direccion[]>(async () => {
    const { data: usuario } = await supabase.auth.getUser();
    if (!usuario.user) return { data: [], error: null };
    return supabase
      .from('direcciones')
      .select('id,etiqueta,direccion,detalle,principal')
      .eq('usuario_id', usuario.user.id)
      .order('principal', { ascending: false });
  }, DIRECCIONES_DEMO);
}

export async function crearDireccion(
  d: Omit<Direccion, 'id'>,
): Promise<Direccion | null> {
  if (!HAY_BACKEND) return { ...d, id: `dir-${Date.now()}` };
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return null;

  // Una sola dirección principal: si esta nace principal, las demás dejan
  // de serlo antes de insertarla.
  if (d.principal) {
    await supabase.from('direcciones').update({ principal: false }).eq('usuario_id', usuario.user.id);
  }

  const { data, error } = await supabase
    .from('direcciones')
    .insert({
      usuario_id: usuario.user.id,
      etiqueta: d.etiqueta,
      direccion: d.direccion,
      detalle: d.detalle,
      principal: d.principal,
    })
    .select('id,etiqueta,direccion,detalle,principal')
    .single();

  if (error || !data) return null;
  return data as Direccion;
}

export async function actualizarDireccion(
  id: string,
  cambios: Partial<Omit<Direccion, 'id'>>,
): Promise<boolean> {
  if (!HAY_BACKEND) return true;
  const { error } = await supabase.from('direcciones').update(cambios).eq('id', id);
  return !error;
}

export async function eliminarDireccion(id: string): Promise<boolean> {
  if (!HAY_BACKEND) return true;
  const { error } = await supabase.from('direcciones').delete().eq('id', id);
  return !error;
}

/** Deja `id` como la única dirección principal del usuario. */
export async function marcarPrincipal(id: string): Promise<boolean> {
  if (!HAY_BACKEND) return true;
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return false;
  await supabase.from('direcciones').update({ principal: false }).eq('usuario_id', usuario.user.id);
  const { error } = await supabase.from('direcciones').update({ principal: true }).eq('id', id);
  return !error;
}
