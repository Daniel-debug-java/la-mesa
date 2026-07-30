-- =====================================================================
-- LA MESA · Esquema de base de datos (PostgreSQL / Supabase)
-- v1.0 · Sede El Poblado, Medellín — preparado para multi-sede y multi-moneda
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- SEDES  (hoy una: El Poblado. Mañana: España, sin migrar nada)
-- ---------------------------------------------------------------------
create table sedes (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  ciudad          text not null,
  pais            text not null default 'CO',
  moneda          char(3) not null default 'COP',
  direccion       text not null,
  lat             numeric(10,7),
  lng             numeric(10,7),
  telefono        text,
  radio_domicilio_km numeric(4,1) default 6.0,
  costo_domicilio numeric(12,2) default 0,
  pedido_minimo   numeric(12,2) default 0,
  activa          boolean not null default true,
  creada_en       timestamptz not null default now()
);

-- Horarios: 0 = domingo … 6 = sábado
create table sede_horarios (
  id        uuid primary key default uuid_generate_v4(),
  sede_id   uuid not null references sedes(id) on delete cascade,
  dia       smallint not null check (dia between 0 and 6),
  abre      time not null,
  cierra    time not null
);

-- ---------------------------------------------------------------------
-- USUARIOS  (extiende auth.users de Supabase)
-- ---------------------------------------------------------------------
create type rol_usuario as enum ('cliente', 'cocina', 'caja', 'admin');

create table perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre          text not null,
  telefono        text,
  email           text,
  avatar_url      text,
  rol             rol_usuario not null default 'cliente',
  sede_id         uuid references sedes(id),          -- solo para staff
  puntos          integer not null default 0,          -- saldo canjeable
  puntos_historicos integer not null default 0,        -- define el nivel, nunca baja
  acepta_promos   boolean not null default true,
  push_token      text,
  creado_en       timestamptz not null default now()
);

-- Nivel derivado de puntos_historicos: Bronce 0–499, Plata 500–1499, Oro 1500+
create or replace function nivel_de(puntos integer) returns text
language sql immutable as $$
  select case when puntos >= 1500 then 'oro'
              when puntos >= 500  then 'plata'
              else 'bronce' end;
$$;

create table direcciones (
  id         uuid primary key default uuid_generate_v4(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  etiqueta   text not null default 'Casa',
  direccion  text not null,
  detalle    text,                                     -- apto, torre, indicaciones
  barrio     text,
  lat        numeric(10,7),
  lng        numeric(10,7),
  principal  boolean not null default false
);

-- ---------------------------------------------------------------------
-- MENÚ
-- ---------------------------------------------------------------------
create table categorias (
  id        uuid primary key default uuid_generate_v4(),
  nombre    text not null,
  icono     text,                                      -- clave del set de iconos
  orden     smallint not null default 0,
  activa    boolean not null default true
);

create type badge_producto as enum ('nuevo', 'popular', 'exclusivo_app', 'agotado', 'descuento');

create table productos (
  id            uuid primary key default uuid_generate_v4(),
  categoria_id  uuid not null references categorias(id) on delete restrict,
  nombre        text not null,
  descripcion   text,
  precio        numeric(12,2) not null check (precio >= 0),
  precio_antes  numeric(12,2),                         -- para mostrar tachado
  imagen_url    text,
  calorias      integer,
  badges        badge_producto[] not null default '{}',
  disponible    boolean not null default true,
  solo_app      boolean not null default false,
  orden         smallint not null default 0,
  creado_en     timestamptz not null default now()
);

-- Disponibilidad y precio por sede (multi-sede sin duplicar el catálogo)
create table producto_sede (
  producto_id uuid not null references productos(id) on delete cascade,
  sede_id     uuid not null references sedes(id) on delete cascade,
  precio      numeric(12,2),                           -- null = usa productos.precio
  disponible  boolean not null default true,
  primary key (producto_id, sede_id)
);

-- Personalización: "Punto de la carne", "Extras", "Sin cebolla"…
create table grupos_opcion (
  id          uuid primary key default uuid_generate_v4(),
  producto_id uuid not null references productos(id) on delete cascade,
  nombre      text not null,
  min_sel     smallint not null default 0,
  max_sel     smallint not null default 1,
  orden       smallint not null default 0
);

create table opciones (
  id        uuid primary key default uuid_generate_v4(),
  grupo_id  uuid not null references grupos_opcion(id) on delete cascade,
  nombre    text not null,
  precio_extra numeric(12,2) not null default 0,
  disponible boolean not null default true,
  orden     smallint not null default 0
);

-- ---------------------------------------------------------------------
-- CUPONES Y PROMOCIONES
-- ---------------------------------------------------------------------
create type tipo_descuento as enum ('porcentaje', 'monto_fijo', 'dos_por_uno', 'envio_gratis');

create table cupones (
  id              uuid primary key default uuid_generate_v4(),
  codigo          text unique,                         -- null = promo automática sin código
  titulo          text not null,
  descripcion     text,
  imagen_url      text,
  tipo            tipo_descuento not null,
  valor           numeric(12,2) not null default 0,    -- % o monto según tipo
  monto_minimo    numeric(12,2) not null default 0,
  categoria_id    uuid references categorias(id),      -- limita a una categoría
  solo_app        boolean not null default true,
  acumulable      boolean not null default false,
  usos_max        integer,                             -- null = ilimitado
  usos_por_usuario integer not null default 1,
  usos_actuales   integer not null default 0,
  inicia_en       timestamptz not null default now(),
  vence_en        timestamptz,
  activo          boolean not null default true
);

create table cupones_usados (
  id         uuid primary key default uuid_generate_v4(),
  cupon_id   uuid not null references cupones(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  pedido_id  uuid,
  usado_en   timestamptz not null default now()
);

-- Recompensas canjeables con puntos
create table recompensas (
  id            uuid primary key default uuid_generate_v4(),
  titulo        text not null,
  descripcion   text,
  puntos_costo  integer not null check (puntos_costo > 0),
  nivel_minimo  text not null default 'bronce',
  producto_id   uuid references productos(id),         -- si la recompensa es un plato
  tipo          tipo_descuento,
  valor         numeric(12,2) default 0,
  activa        boolean not null default true
);

-- ---------------------------------------------------------------------
-- MESA COMPARTIDA  (el diferencial de la marca)
-- ---------------------------------------------------------------------
create type estado_mesa as enum ('abierta', 'cerrada', 'convertida', 'cancelada');

create table mesas (
  id          uuid primary key default uuid_generate_v4(),
  codigo      char(6) not null unique,                 -- el que se comparte: "MESA4K"
  anfitrion_id uuid not null references perfiles(id) on delete cascade,
  sede_id     uuid not null references sedes(id),
  nombre      text default 'Nuestra mesa',
  estado      estado_mesa not null default 'abierta',
  dividir_cuenta boolean not null default true,        -- false = el anfitrión invita
  pedido_id   uuid,
  abierta_en  timestamptz not null default now(),
  cerrada_en  timestamptz
);

create table mesa_participantes (
  mesa_id    uuid not null references mesas(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  es_anfitrion boolean not null default false,
  listo       boolean not null default false,          -- "ya elegí lo mío"
  entro_en    timestamptz not null default now(),
  primary key (mesa_id, usuario_id)
);

-- ---------------------------------------------------------------------
-- PEDIDOS
-- ---------------------------------------------------------------------
create type modalidad_pedido as enum ('recoger', 'domicilio', 'en_mesa');
create type estado_pedido    as enum ('pendiente_pago','recibido','en_preparacion','listo','en_camino','entregado','cancelado');
create type metodo_pago      as enum ('nequi','pse','bancolombia','tarjeta','efectivo','puntos');
create type estado_pago      as enum ('pendiente','aprobado','rechazado','reembolsado');

create table pedidos (
  id              uuid primary key default uuid_generate_v4(),
  numero          serial unique,                       -- el que ve cocina: #1043
  usuario_id      uuid not null references perfiles(id) on delete restrict,
  sede_id         uuid not null references sedes(id),
  mesa_id         uuid references mesas(id),
  modalidad       modalidad_pedido not null,
  estado          estado_pedido not null default 'pendiente_pago',

  direccion_id    uuid references direcciones(id),
  direccion_texto text,                                -- congelada al momento del pedido
  notas           text,
  programado_para timestamptz,                         -- pedido fuera de horario

  subtotal        numeric(12,2) not null default 0,
  descuento       numeric(12,2) not null default 0,
  costo_domicilio numeric(12,2) not null default 0,
  propina         numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  moneda          char(3) not null default 'COP',

  cupon_id        uuid references cupones(id),
  puntos_ganados  integer not null default 0,
  puntos_usados   integer not null default 0,

  metodo_pago     metodo_pago,
  estado_pago     estado_pago not null default 'pendiente',
  pago_referencia text,                                -- id de transacción Wompi

  mensajero_nombre    text,                            -- mensajería externa por viaje
  mensajero_telefono  text,
  mensajero_empresa   text,

  creado_en       timestamptz not null default now(),
  confirmado_en   timestamptz,
  listo_en        timestamptz,
  entregado_en    timestamptz,
  cancelado_en    timestamptz,
  motivo_cancelacion text
);

create table pedido_items (
  id           uuid primary key default uuid_generate_v4(),
  pedido_id    uuid not null references pedidos(id) on delete cascade,
  producto_id  uuid not null references productos(id) on delete restrict,
  usuario_id   uuid references perfiles(id),           -- quién lo pidió en la mesa compartida
  nombre       text not null,                          -- congelado por si cambia el menú
  precio_unit  numeric(12,2) not null,
  cantidad     smallint not null check (cantidad > 0),
  opciones     jsonb not null default '[]',            -- [{grupo, opcion, precio_extra}]
  notas        text,
  total_linea  numeric(12,2) not null
);

-- Bitácora de estados: alimenta el seguimiento en vivo del cliente
create table pedido_eventos (
  id         uuid primary key default uuid_generate_v4(),
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  estado     estado_pedido not null,
  actor_id   uuid references perfiles(id),
  nota       text,
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MOMENTOS  (historial con sentido, no una lista de facturas)
-- ---------------------------------------------------------------------
create table momentos (
  id         uuid primary key default uuid_generate_v4(),
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  titulo     text,
  foto_url   text,
  nota       text,
  creado_en  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MOVIMIENTOS DE PUNTOS  (trazabilidad completa del programa)
-- ---------------------------------------------------------------------
create type tipo_movimiento as enum ('ganados','canjeados','ajuste','vencidos');

create table puntos_movimientos (
  id          uuid primary key default uuid_generate_v4(),
  usuario_id  uuid not null references perfiles(id) on delete cascade,
  pedido_id   uuid references pedidos(id),
  recompensa_id uuid references recompensas(id),
  tipo        tipo_movimiento not null,
  puntos      integer not null,                        -- positivo o negativo
  descripcion text,
  creado_en   timestamptz not null default now()
);

alter table mesas add constraint mesas_pedido_fk
  foreign key (pedido_id) references pedidos(id) on delete set null;

-- ---------------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------------
create index idx_productos_categoria on productos(categoria_id) where disponible;
create index idx_pedidos_sede_estado on pedidos(sede_id, estado, creado_en desc);
create index idx_pedidos_usuario     on pedidos(usuario_id, creado_en desc);
create index idx_pedido_items_pedido on pedido_items(pedido_id);
create index idx_eventos_pedido      on pedido_eventos(pedido_id, creado_en);
create index idx_mesas_codigo        on mesas(codigo) where estado = 'abierta';
create index idx_puntos_usuario      on puntos_movimientos(usuario_id, creado_en desc);

-- ---------------------------------------------------------------------
-- LÓGICA DE NEGOCIO
-- ---------------------------------------------------------------------

-- Los puntos se acreditan al ENTREGAR, no al pagar: así un pedido
-- cancelado nunca deja puntos regalados en la cuenta del cliente.
create or replace function acreditar_puntos() returns trigger
language plpgsql as $$
declare
  ganados integer;
begin
  if new.estado = 'entregado' and old.estado is distinct from 'entregado' then
    ganados := floor(new.total / 1000)::integer;   -- 1 punto por cada $1.000 COP

    update perfiles
       set puntos = puntos + ganados,
           puntos_historicos = puntos_historicos + ganados
     where id = new.usuario_id;

    insert into puntos_movimientos (usuario_id, pedido_id, tipo, puntos, descripcion)
    values (new.usuario_id, new.id, 'ganados', ganados, 'Pedido #' || new.numero);

    new.puntos_ganados := ganados;
    new.entregado_en   := now();
  end if;
  return new;
end;
$$;

create trigger trg_acreditar_puntos
  before update on pedidos
  for each row execute function acreditar_puntos();

-- Cada cambio de estado queda registrado para el seguimiento en vivo.
create or replace function registrar_evento() returns trigger
language plpgsql as $$
begin
  if new.estado is distinct from old.estado then
    insert into pedido_eventos (pedido_id, estado) values (new.id, new.estado);
  end if;
  return new;
end;
$$;

create trigger trg_registrar_evento
  after update on pedidos
  for each row execute function registrar_evento();

-- Código de mesa legible y fácil de dictar en voz alta.
create or replace function generar_codigo_mesa() returns char(6)
language plpgsql as $$
declare
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sin I, O, 0, 1
  codigo   text;
begin
  loop
    codigo := '';
    for i in 1..6 loop
      codigo := codigo || substr(alfabeto, floor(random() * length(alfabeto) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from mesas where mesas.codigo = codigo);
  end loop;
  return codigo;
end;
$$;

-- ---------------------------------------------------------------------
-- TIEMPO REAL
-- Sin esto el seguimiento del pedido y la mesa compartida no reciben nada:
-- Supabase solo emite cambios de las tablas publicadas explícitamente.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table pedidos;
alter publication supabase_realtime add table pedido_items;
alter publication supabase_realtime add table mesa_participantes;

-- ---------------------------------------------------------------------
-- SEGURIDAD POR FILA
-- ---------------------------------------------------------------------
alter table perfiles            enable row level security;
alter table direcciones         enable row level security;
alter table pedidos             enable row level security;
alter table pedido_items        enable row level security;
alter table momentos            enable row level security;
alter table puntos_movimientos  enable row level security;
alter table mesas               enable row level security;
alter table mesa_participantes  enable row level security;

create or replace function es_staff() returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from perfiles
     where id = auth.uid() and rol in ('cocina','caja','admin')
  );
$$;

create policy "cada quien ve su perfil"
  on perfiles for select using (id = auth.uid() or es_staff());
create policy "cada quien edita su perfil"
  on perfiles for update using (id = auth.uid());

create policy "sus direcciones"
  on direcciones for all using (usuario_id = auth.uid());

create policy "sus pedidos"
  on pedidos for select using (usuario_id = auth.uid() or es_staff());
create policy "crear pedidos propios"
  on pedidos for insert with check (usuario_id = auth.uid());
create policy "staff mueve estados"
  on pedidos for update using (es_staff());

create policy "items de sus pedidos"
  on pedido_items for select
  using (exists (select 1 from pedidos p
                  where p.id = pedido_id
                    and (p.usuario_id = auth.uid() or es_staff())));

create policy "sus momentos"      on momentos for all using (usuario_id = auth.uid());
create policy "sus puntos"        on puntos_movimientos for select using (usuario_id = auth.uid() or es_staff());

create policy "mesas donde participa"
  on mesas for select
  using (anfitrion_id = auth.uid()
      or exists (select 1 from mesa_participantes mp
                  where mp.mesa_id = id and mp.usuario_id = auth.uid())
      or es_staff());

create policy "participantes de sus mesas"
  on mesa_participantes for all using (usuario_id = auth.uid());

-- El menú, los cupones y las recompensas son públicos para leer;
-- solo el staff escribe (se controla desde el panel admin con service role).
alter table categorias  enable row level security;
alter table productos   enable row level security;
alter table cupones     enable row level security;
alter table recompensas enable row level security;
alter table sedes       enable row level security;

create policy "menu publico"        on categorias  for select using (true);
create policy "productos publicos"  on productos   for select using (true);
create policy "cupones publicos"    on cupones     for select using (activo);
create policy "recompensas publicas" on recompensas for select using (activa);
create policy "sedes publicas"      on sedes       for select using (activa);
