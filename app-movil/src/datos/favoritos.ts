import { HAY_BACKEND, supabase } from './supabase';

export async function traerFavoritos(): Promise<string[]> {
  if (!HAY_BACKEND) return [];
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return [];
  const { data } = await supabase
    .from('favoritos')
    .select('producto_id')
    .eq('usuario_id', usuario.user.id);
  return (data ?? []).map((f) => f.producto_id as string);
}

export async function guardarFavorito(productoId: string): Promise<boolean> {
  if (!HAY_BACKEND) return true;
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return false;
  const { error } = await supabase.from('favoritos').insert({
    usuario_id: usuario.user.id,
    producto_id: productoId,
  });
  return !error;
}

export async function quitarFavorito(productoId: string): Promise<boolean> {
  if (!HAY_BACKEND) return true;
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return false;
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .eq('usuario_id', usuario.user.id)
    .eq('producto_id', productoId);
  return !error;
}
