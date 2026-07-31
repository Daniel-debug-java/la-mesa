import { conRespaldo, HAY_BACKEND, supabase, SEDE_ID } from './supabase';
import { CATEGORIAS_DEMO, CUPONES_DEMO, CUPONES_USADOS_DEMO, PRODUCTOS_DEMO, RECOMPENSAS_DEMO } from './demo';
import { Categoria, Cupon, Producto, Recompensa, Sede } from './tipos';

export async function traerCategorias(): Promise<Categoria[]> {
  return conRespaldo<Categoria[]>(
    () => supabase.from('categorias').select('id,nombre,icono,orden').eq('activa', true).order('orden'),
    CATEGORIAS_DEMO,
  );
}

export async function traerProductos(): Promise<Producto[]> {
  return conRespaldo<Producto[]>(
    () =>
      supabase
        .from('productos')
        .select(
          'id,categoria_id,nombre,descripcion,precio,precio_antes,imagen_url,badges,disponible,solo_app,' +
            'grupos_opcion(id,nombre,min_sel,max_sel,opciones(id,nombre,precio_extra,disponible))',
        )
        .order('orden')
        // La relación anidada no se puede inferir sin los tipos generados
        // de la base; cuando se generen con `supabase gen types`, esta
        // anotación sobra y se puede quitar.
        .returns<Producto[]>(),
    PRODUCTOS_DEMO,
  );
}

export async function traerProducto(id: string): Promise<Producto | null> {
  const todos = await traerProductos();
  return todos.find((p) => p.id === id) ?? null;
}

export async function traerCupones(): Promise<Cupon[]> {
  return conRespaldo<Cupon[]>(
    () =>
      supabase
        .from('cupones')
        .select('id,codigo,titulo,descripcion,tipo,valor,monto_minimo,categoria_id,vence_en,activo')
        .eq('activo', true),
    CUPONES_DEMO,
  );
}

/** Cuántos cupones se ha canjeado el cliente en total. */
export async function contarCuponesUsados(): Promise<number> {
  if (!HAY_BACKEND) return CUPONES_USADOS_DEMO;
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return 0;
  const { data } = await supabase
    .from('cupones_usados')
    .select('id')
    .eq('usuario_id', usuario.user.id);
  return data ? data.length : 0;
}

export async function traerRecompensas(): Promise<Recompensa[]> {
  return conRespaldo<Recompensa[]>(
    () =>
      supabase
        .from('recompensas')
        .select('id,titulo,descripcion,puntos_costo,nivel_minimo,activa')
        .eq('activa', true)
        .order('puntos_costo'),
    RECOMPENSAS_DEMO,
  );
}

const SEDE_DEMO: Sede = {
  id: SEDE_ID,
  nombre: 'La Mesa El Poblado',
  ciudad: 'Medellín',
  moneda: 'COP',
  direccion: 'Cra. 35 #8A-45, El Poblado',
  costo_domicilio: 6900,
  pedido_minimo: 25000,
  activa: true,
};

export async function traerSede(): Promise<Sede> {
  const sedes = await conRespaldo<Sede[]>(
    () =>
      supabase
        .from('sedes')
        .select('id,nombre,ciudad,moneda,direccion,costo_domicilio,pedido_minimo,activa')
        .eq('id', SEDE_ID)
        .limit(1),
    [SEDE_DEMO],
  );
  return sedes[0] ?? SEDE_DEMO;
}

/** ¿Está abierta la sede ahora? Si no, la app ofrece programar el pedido. */
export async function estaAbierta(): Promise<boolean> {
  const ahora = new Date();
  const dia = ahora.getDay();
  const filas = await conRespaldo<{ abre: string; cierra: string }[]>(
    () => supabase.from('sede_horarios').select('abre,cierra').eq('sede_id', SEDE_ID).eq('dia', dia),
    [{ abre: '11:00', cierra: '22:30' }],
  );
  if (!filas.length) return false;
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  return filas.some(({ abre, cierra }) => {
    const [ha, ma] = abre.split(':').map(Number);
    const [hc, mc] = cierra.split(':').map(Number);
    return minutos >= ha * 60 + ma && minutos <= hc * 60 + mc;
  });
}
