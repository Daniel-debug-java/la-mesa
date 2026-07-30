-- =====================================================================
-- LA MESA · Datos de arranque
-- Menú base editable desde el panel de administración
-- =====================================================================

insert into sedes (id, nombre, ciudad, pais, moneda, direccion, lat, lng, telefono, costo_domicilio, pedido_minimo)
values ('11111111-1111-1111-1111-111111111111',
        'La Mesa El Poblado', 'Medellín', 'CO', 'COP',
        'Cra. 35 #8A-45, El Poblado, Medellín',
        6.2088, -75.5672, '+57 604 000 0000', 6900, 25000);

insert into sede_horarios (sede_id, dia, abre, cierra)
select '11111111-1111-1111-1111-111111111111', d, '11:00', '22:30'
from generate_series(0, 6) d;

insert into categorias (id, nombre, icono, orden) values
  ('c0000001-0000-0000-0000-000000000001', 'Hamburguesas', 'hamburguesa', 1),
  ('c0000002-0000-0000-0000-000000000002', 'Parrilla',     'parrilla',    2),
  ('c0000003-0000-0000-0000-000000000003', 'Bowls',        'bowl',        3),
  ('c0000004-0000-0000-0000-000000000004', 'Bebidas',      'bebida',      4),
  ('c0000005-0000-0000-0000-000000000005', 'Postres',      'postre',      5);

insert into productos (categoria_id, nombre, descripcion, precio, precio_antes, badges, solo_app, orden) values
  ('c0000001-0000-0000-0000-000000000001', 'La Clásica de la Casa',
   'Carne de res madurada, queso costeño, tomate asado y salsa de la casa en pan brioche.',
   32900, null, '{popular}', false, 1),

  ('c0000001-0000-0000-0000-000000000001', 'Doble Mandarina',
   'Doble carne, cheddar fundido, cebolla caramelizada y nuestra salsa mandarina ligeramente picante.',
   41900, 46900, '{exclusivo_app,descuento}', true, 2),

  ('c0000002-0000-0000-0000-000000000002', 'Punta de Anca a la Brasa',
   'Punta de anca 300 g al carbón, papa criolla y chimichurri fresco. Para compartir de a dos.',
   46900, null, '{}', false, 1),

  ('c0000002-0000-0000-0000-000000000002', 'Costilla BBQ de la Mesa',
   'Costilla de cerdo cocinada seis horas, glaseada con BBQ de panela y ensalada de repollo.',
   44900, null, '{nuevo}', false, 2),

  ('c0000003-0000-0000-0000-000000000003', 'Bowl Ensalada La Mesa',
   'Mezcla verde, quinua, aguacate, tomates confitados y vinagreta de maracuyá. Ligera, fresca y deliciosa.',
   28900, null, '{}', false, 1),

  ('c0000003-0000-0000-0000-000000000003', 'Bowl de Pollo y Aguacate',
   'Pollo a la parrilla, arroz integral, fríjol rojo, aguacate y maíz tierno.',
   31900, null, '{popular}', false, 2),

  ('c0000004-0000-0000-0000-000000000004', 'Limonada de Coco',
   'La de siempre, la que todos piden. Servida bien fría.',
   12900, null, '{popular}', false, 1),

  ('c0000004-0000-0000-0000-000000000004', 'Café del Poblado',
   'Grano de origen antioqueño, tostión media. Filtrado o espresso.',
   7900, null, '{}', false, 2),

  ('c0000005-0000-0000-0000-000000000005', 'Postre de Maracuyá',
   'Crema suave de maracuyá con galleta de mantequilla. Nuestro final favorito.',
   14900, null, '{nuevo}', false, 1),

  ('c0000005-0000-0000-0000-000000000005', 'Brownie para Compartir',
   'Brownie tibio con helado de vainilla y dos cucharas. Siempre dos cucharas.',
   18900, null, '{popular}', false, 2);

-- Personalización de ejemplo sobre la hamburguesa insignia
insert into grupos_opcion (id, producto_id, nombre, min_sel, max_sel)
select 'a0000001-0000-0000-0000-000000000001', id, 'Término de la carne', 1, 1
from productos where nombre = 'La Clásica de la Casa';

insert into opciones (grupo_id, nombre, precio_extra, orden) values
  ('a0000001-0000-0000-0000-000000000001', 'Tres cuartos', 0, 1),
  ('a0000001-0000-0000-0000-000000000001', 'Al punto',     0, 2),
  ('a0000001-0000-0000-0000-000000000001', 'Bien asada',   0, 3);

insert into grupos_opcion (id, producto_id, nombre, min_sel, max_sel)
select 'a0000002-0000-0000-0000-000000000002', id, 'Agrega algo más', 0, 4
from productos where nombre = 'La Clásica de la Casa';

insert into opciones (grupo_id, nombre, precio_extra, orden) values
  ('a0000002-0000-0000-0000-000000000002', 'Tocineta',        4900, 1),
  ('a0000002-0000-0000-0000-000000000002', 'Queso extra',     3900, 2),
  ('a0000002-0000-0000-0000-000000000002', 'Huevo de codorniz',2900, 3),
  ('a0000002-0000-0000-0000-000000000002', 'Papas rústicas',  8900, 4);

-- Promociones visibles en la pestaña Promos
insert into cupones (codigo, titulo, descripcion, tipo, valor, categoria_id, solo_app, usos_por_usuario, vence_en) values
  ('2X1MESA', '2x1 en Hamburguesas',
   'Pide dos hamburguesas y paga una. Solo desde la app, todos los martes.',
   'dos_por_uno', 0, 'c0000001-0000-0000-0000-000000000001', true, 4, now() + interval '30 days'),

  ('PRIMERA20', '20% en tu primer pedido',
   'Bienvenido a la mesa. Tu primer pedido lleva 20% de descuento.',
   'porcentaje', 20, null, true, 1, now() + interval '90 days'),

  (null, 'Domicilio gratis desde $60.000',
   'Pedidos de $60.000 en adelante llegan sin costo de envío.',
   'envio_gratis', 0, null, true, 99, now() + interval '60 days');

-- Recompensas del programa de puntos
insert into recompensas (titulo, descripcion, puntos_costo, nivel_minimo, tipo, valor) values
  ('Postre de cortesía',  'Cualquier postre de la carta, por cuenta de la casa.', 300,  'bronce', 'monto_fijo', 18900),
  ('Domicilio gratis',    'Tu próximo pedido llega sin costo de envío.',          500,  'bronce', 'envio_gratis', 0),
  ('Limonada para la mesa','Una jarra de limonada de coco para compartir.',       800,  'plata',  'monto_fijo', 26900),
  ('Plato principal',     'Elige cualquier plato fuerte de la carta.',            1200, 'plata',  'monto_fijo', 46900),
  ('Mesa para dos',       'Dos platos fuertes y dos bebidas, invita La Mesa.',    2500, 'oro',    'monto_fijo', 110000);
