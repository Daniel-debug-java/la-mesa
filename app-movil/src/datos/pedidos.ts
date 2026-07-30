import { HAY_BACKEND, SEDE_ID, supabase } from './supabase';
import { EstadoPedido, LineaCarrito, MetodoPago, Modalidad, Pedido } from './tipos';

export interface BorradorPedido {
  modalidad: Modalidad;
  metodo_pago: MetodoPago;
  lineas: LineaCarrito[];
  subtotal: number;
  descuento: number;
  costo_domicilio: number;
  total: number;
  cupon_id?: string | null;
  direccion_texto?: string | null;
  notas?: string | null;
  mesa_id?: string | null;
  programado_para?: string | null;
}

/**
 * Crea el pedido. Nace en `pendiente_pago` y solo pasa a `recibido`
 * cuando la pasarela confirma — salvo efectivo, que entra directo
 * porque el cobro ocurre al entregar.
 */
export async function crearPedido(b: BorradorPedido): Promise<Pedido | null> {
  if (!HAY_BACKEND) {
    return {
      id: 'demo',
      numero: 1043,
      estado: b.metodo_pago === 'efectivo' ? 'recibido' : 'pendiente_pago',
      modalidad: b.modalidad,
      metodo_pago: b.metodo_pago,
      estado_pago: 'pendiente',
      subtotal: b.subtotal,
      descuento: b.descuento,
      costo_domicilio: b.costo_domicilio,
      total: b.total,
      moneda: 'COP',
      puntos_ganados: 0,
      direccion_texto: b.direccion_texto ?? null,
      notas: b.notas ?? null,
      mensajero_nombre: null,
      mensajero_empresa: null,
      creado_en: new Date().toISOString(),
      pedido_items: b.lineas.map((l, i) => ({
        id: String(i),
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio_unit: l.precio_unitario,
        opciones: l.opciones,
        usuario_id: null,
      })),
    };
  }

  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return null;

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      usuario_id: usuario.user.id,
      sede_id: SEDE_ID,
      mesa_id: b.mesa_id ?? null,
      modalidad: b.modalidad,
      estado: b.metodo_pago === 'efectivo' ? 'recibido' : 'pendiente_pago',
      metodo_pago: b.metodo_pago,
      subtotal: b.subtotal,
      descuento: b.descuento,
      costo_domicilio: b.costo_domicilio,
      total: b.total,
      cupon_id: b.cupon_id ?? null,
      direccion_texto: b.direccion_texto ?? null,
      notas: b.notas ?? null,
      programado_para: b.programado_para ?? null,
    })
    .select()
    .single();

  if (error || !pedido) {
    console.warn('[La Mesa] no se pudo crear el pedido', error);
    return null;
  }

  const items = b.lineas.map((l) => ({
    pedido_id: pedido.id,
    producto_id: l.producto_id,
    usuario_id: usuario.user!.id,
    nombre: l.nombre,
    precio_unit: l.precio_unitario,
    cantidad: l.cantidad,
    opciones: l.opciones,
    notas: l.notas ?? null,
    total_linea: l.precio_unitario * l.cantidad,
  }));
  await supabase.from('pedido_items').insert(items);

  return pedido as Pedido;
}

export async function traerPedido(numero: number): Promise<Pedido | null> {
  if (!HAY_BACKEND) return null;
  const { data } = await supabase
    .from('pedidos')
    .select('*, pedido_items(id,nombre,cantidad,precio_unit,opciones,usuario_id)')
    .eq('numero', numero)
    .single();
  return (data as Pedido) ?? null;
}

export async function traerMisPedidos(): Promise<Pedido[]> {
  if (!HAY_BACKEND) return [];
  const { data: usuario } = await supabase.auth.getUser();
  if (!usuario.user) return [];
  const { data } = await supabase
    .from('pedidos')
    .select('*, pedido_items(id,nombre,cantidad,precio_unit,opciones,usuario_id)')
    .eq('usuario_id', usuario.user.id)
    .order('creado_en', { ascending: false })
    .limit(30);
  return (data as Pedido[]) ?? [];
}

/**
 * El seguimiento en vivo. Cocina cambia el estado en el panel y esto
 * dispara en el teléfono del cliente en menos de cinco segundos.
 * Devuelve la función para cortar la suscripción al salir de la pantalla.
 */
export function seguirPedido(
  pedidoId: string,
  alCambiar: (estado: EstadoPedido, pedido: Pedido) => void,
): () => void {
  if (!HAY_BACKEND) return () => {};
  const canal = supabase
    .channel(`pedido-${pedidoId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${pedidoId}` },
      (evento) => {
        const p = evento.new as Pedido;
        alCambiar(p.estado, p);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}

export const PASOS: { estado: EstadoPedido; titulo: string; detalle: (m: Modalidad) => string }[] = [
  {
    estado: 'recibido',
    titulo: 'Pedido recibido',
    detalle: () => 'La Mesa ya lo tiene.',
  },
  {
    estado: 'en_preparacion',
    titulo: 'En preparación',
    detalle: () => 'Tu comida se está preparando en cocina.',
  },
  {
    estado: 'listo',
    titulo: 'Listo',
    detalle: (m) =>
      m === 'recoger' ? 'Pásalo a buscar en la barra.' : 'Un mensajero va en camino.',
  },
  {
    estado: 'entregado',
    titulo: 'Entregado',
    detalle: () => 'Que lo disfrutes. Y que se comparta.',
  },
];

export function pasoActual(estado: EstadoPedido): number {
  if (estado === 'en_camino') return 2;
  const i = PASOS.findIndex((p) => p.estado === estado);
  return i < 0 ? 0 : i;
}
