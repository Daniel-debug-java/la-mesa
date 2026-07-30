import { Categoria, Cupon, Producto, Recompensa } from './tipos';

/**
 * Menú de arranque, idéntico a supabase/seed.sql.
 * Sirve para desarrollar sin backend y como respaldo si la red falla:
 * el cliente ve la carta aunque no haya conexión.
 */

export const CATEGORIAS_DEMO: Categoria[] = [
  { id: 'c1', nombre: 'Hamburguesas', icono: 'hamburguesas', orden: 1 },
  { id: 'c2', nombre: 'Parrilla', icono: 'parrilla', orden: 2 },
  { id: 'c3', nombre: 'Bowls', icono: 'bowls', orden: 3 },
  { id: 'c4', nombre: 'Bebidas', icono: 'bebidas', orden: 4 },
  { id: 'c5', nombre: 'Postres', icono: 'postres', orden: 5 },
];

const p = (
  id: string,
  categoria_id: string,
  nombre: string,
  descripcion: string,
  precio: number,
  extra: Partial<Producto> = {},
): Producto => ({
  id,
  categoria_id,
  nombre,
  descripcion,
  precio,
  precio_antes: null,
  imagen_url: null,
  badges: [],
  disponible: true,
  solo_app: false,
  ...extra,
});

export const PRODUCTOS_DEMO: Producto[] = [
  p('p1', 'c1', 'La Clásica de la Casa',
    'Carne de res madurada, queso costeño, tomate asado y salsa de la casa en pan brioche.',
    32900, {
      badges: ['popular'],
      grupos_opcion: [
        {
          id: 'g1', nombre: 'Término de la carne', min_sel: 1, max_sel: 1,
          opciones: [
            { id: 'o1', nombre: 'Tres cuartos', precio_extra: 0, disponible: true },
            { id: 'o2', nombre: 'Al punto', precio_extra: 0, disponible: true },
            { id: 'o3', nombre: 'Bien asada', precio_extra: 0, disponible: true },
          ],
        },
        {
          id: 'g2', nombre: 'Agrega algo más', min_sel: 0, max_sel: 4,
          opciones: [
            { id: 'o4', nombre: 'Tocineta', precio_extra: 4900, disponible: true },
            { id: 'o5', nombre: 'Queso extra', precio_extra: 3900, disponible: true },
            { id: 'o6', nombre: 'Papas rústicas', precio_extra: 8900, disponible: true },
          ],
        },
      ],
    }),
  p('p2', 'c1', 'Doble Mandarina',
    'Doble carne, cheddar fundido, cebolla caramelizada y nuestra salsa mandarina.',
    41900, { precio_antes: 46900, badges: ['exclusivo_app', 'descuento'], solo_app: true }),
  p('p3', 'c2', 'Punta de Anca a la Brasa',
    'Punta de anca 300 g al carbón, papa criolla y chimichurri fresco. Para compartir de a dos.',
    46900),
  p('p4', 'c2', 'Costilla BBQ de la Mesa',
    'Costilla de cerdo cocinada seis horas, glaseada con BBQ de panela y ensalada de repollo.',
    44900, { badges: ['nuevo'] }),
  p('p5', 'c3', 'Bowl Ensalada La Mesa',
    'Mezcla verde, quinua, aguacate, tomates confitados y vinagreta de maracuyá.',
    28900),
  p('p6', 'c3', 'Bowl de Pollo y Aguacate',
    'Pollo a la parrilla, arroz integral, fríjol rojo, aguacate y maíz tierno.',
    31900, { badges: ['popular'] }),
  p('p7', 'c4', 'Limonada de Coco',
    'La de siempre, la que todos piden. Servida bien fría.',
    12900, { badges: ['popular'] }),
  p('p8', 'c4', 'Café del Poblado',
    'Grano de origen antioqueño, tostión media. Filtrado o espresso.',
    7900),
  p('p9', 'c5', 'Postre de Maracuyá',
    'Crema suave de maracuyá con galleta de mantequilla. Nuestro final favorito.',
    14900, { badges: ['nuevo'] }),
  p('p10', 'c5', 'Brownie para Compartir',
    'Brownie tibio con helado de vainilla y dos cucharas. Siempre dos cucharas.',
    18900, { badges: ['popular'], disponible: false }),
];

export const CUPONES_DEMO: Cupon[] = [
  {
    id: 'cu1', codigo: '2X1MESA', titulo: '2x1 en Hamburguesas',
    descripcion: 'Pide dos hamburguesas y paga una. Solo desde la app, todos los martes.',
    tipo: 'dos_por_uno', valor: 0, monto_minimo: 0, categoria_id: 'c1',
    vence_en: null, activo: true,
  },
  {
    id: 'cu2', codigo: 'PRIMERA20', titulo: '20% en tu primer pedido',
    descripcion: 'Bienvenido a la mesa. Tu primer pedido lleva 20% de descuento.',
    tipo: 'porcentaje', valor: 20, monto_minimo: 0, categoria_id: null,
    vence_en: null, activo: true,
  },
  {
    id: 'cu3', codigo: null, titulo: 'Domicilio gratis desde $60.000',
    descripcion: 'Pedidos de $60.000 en adelante llegan sin costo de envío.',
    tipo: 'envio_gratis', valor: 0, monto_minimo: 60000, categoria_id: null,
    vence_en: null, activo: true,
  },
];

export const RECOMPENSAS_DEMO: Recompensa[] = [
  { id: 'r1', titulo: 'Postre de cortesía', descripcion: 'Cualquier postre de la carta, por cuenta de la casa.', puntos_costo: 300, nivel_minimo: 'bronce', activa: true },
  { id: 'r2', titulo: 'Domicilio gratis', descripcion: 'Tu próximo pedido llega sin costo de envío.', puntos_costo: 500, nivel_minimo: 'bronce', activa: true },
  { id: 'r3', titulo: 'Limonada para la mesa', descripcion: 'Una jarra de limonada de coco para compartir.', puntos_costo: 800, nivel_minimo: 'plata', activa: true },
  { id: 'r4', titulo: 'Plato principal', descripcion: 'Elige cualquier plato fuerte de la carta.', puntos_costo: 1200, nivel_minimo: 'plata', activa: true },
  { id: 'r5', titulo: 'Mesa para dos', descripcion: 'Dos platos fuertes y dos bebidas, invita La Mesa.', puntos_costo: 2500, nivel_minimo: 'oro', activa: true },
];
