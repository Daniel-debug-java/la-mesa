# La Mesa — Brief del proyecto

**Versión 1.0 · Julio 2026 · Sede El Poblado, Medellín**

---

## 1. Objetivo del proyecto

Construir la app móvil de **La Mesa**, un restaurante de El Poblado (Medellín) cuya promesa de marca es *"donde todo se comparte"*. La app debe permitir pedir para recoger en tienda o a domicilio, ofrecer descuentos exclusivos por ser usuario de la app, y premiar a los clientes frecuentes — todo con una experiencia que se sienta cálida y cercana, no transaccional.

El referente funcional son las apps de Vips y McDonald's. El diferencial no es la funcionalidad de pedido (que es estándar), sino cómo la app traduce la cercanía de la marca a la pantalla.

## 2. Usuarios

**Cliente final.** Persona en Medellín, mayoritariamente entre 20 y 45 años, que pide almuerzo o cena para recoger camino a casa, o a domicilio. Paga con Nequi, PSE, Bancolombia, tarjeta o efectivo. Le importa la rapidez, saber cuándo estará listo su pedido, y sentir que le dan algo por volver.

**Personal del restaurante.** Cocina y caja necesitan ver los pedidos entrantes en tiempo real y moverlos por estados sin fricción. Administración necesita editar el menú, precios, fotos y promociones sin depender de un desarrollador.

## 3. Alcance del lanzamiento

Una sola sede: El Poblado, Medellín. Precios en COP. La arquitectura se construye desde el inicio con soporte multi-sede y multi-moneda en la base de datos, de forma que abrir una franquicia en España más adelante sea cargar una sede nueva, no reescribir el sistema.

## 4. Funcionalidad

**Pedidos.** Dos modalidades: recoger en tienda (el restaurante empieza a preparar al recibir el pedido) y domicilio. El cliente arma el carrito desde el menú, elige modalidad, paga y sigue el estado de su pedido en vivo: recibido, en preparación, listo o en camino, entregado.

**Domicilio — modelo híbrido.** La app controla el pedido, el pago y la relación con el cliente. El transporte físico se contrata a un mensajero externo por viaje (Picap, Mensajeros Urbanos o similar), sin flota propia. Esto evita comisiones del 20–30% de las plataformas de delivery, conserva el dato del cliente dentro de la marca y se replica igual en cualquier ciudad nueva. En la versión 1 el pedido queda asignado a un mensajero desde el panel admin; automatizar la asignación vía API queda para una fase posterior.

**Pagos.** Nequi, PSE, Bancolombia, tarjeta de crédito/débito y efectivo (contra entrega o en caja). Los cuatro primeros se resuelven con una sola integración: Wompi, la pasarela de Bancolombia, que cubre exactamente ese conjunto en Colombia. Efectivo se marca como pendiente de cobro y lo confirma el restaurante.

**Cupones y promociones.** Descuentos visibles dentro de la app, con vigencia y condiciones, del tipo "2x1 en hamburguesas" o "20% en tu primer pedido". Se crean y se apagan desde el panel admin.

**Programa de puntos.** Un punto por cada $1.000 COP gastados. Tres niveles: Bronce (0–500 puntos acumulados), Plata (500–1.500) y Oro (1.500+), cada uno con beneficios propios. Los puntos se canjean por recompensas concretas: postre de cortesía, domicilio gratis, plato principal.

**Mesa Compartida — el diferencial.** El usuario abre una "mesa" y comparte un código con quienes lo acompañan. Cada persona agrega sus propios platos desde su teléfono al mismo pedido, y al cerrar la mesa cada quien paga lo suyo o alguien invita. Es la promesa de la marca convertida en función: en La Mesa, hasta el pedido se comparte. Ninguna app de la categoría en Colombia lo tiene resuelto bien, y es lo que hace que la app se recuerde.

**Momentos.** El historial no se presenta como una lista de facturas sino como las mesas que el usuario ha compartido: con quién, qué pidieron, cuándo. Alimenta el programa de puntos y da una razón emocional para volver a abrir la app.

## 5. Panel de administración

Tablero de pedidos entrantes en tiempo real, con cambio de estado en un toque y aviso sonoro al entrar un pedido nuevo. Gestión completa del menú: crear y editar productos, categorías, precios, fotos, disponibilidad y badges (nuevo, popular, agotado). Gestión de cupones y promociones con vigencia. Vista básica de ventas del día.

## 6. Decisiones técnicas

| Capa | Decisión | Por qué |
|---|---|---|
| App móvil | Expo (React Native) + TypeScript | Un solo código para iOS y Android, ruta más corta a ambas tiendas, push notifications incluidas |
| Backend y datos | Supabase (PostgreSQL, Auth, Storage, Realtime) | Sin servidor que mantener, tiempo real nativo para el tablero de pedidos, seguridad por fila, costo inicial cero |
| Panel admin | React + Vite + TypeScript | Herramienta interna, no necesita SEO ni renderizado en servidor; arranca y compila rápido |
| Pagos | Wompi (Bancolombia) | Cubre Nequi, PSE, Bancolombia y tarjetas con una sola integración |
| Notificaciones | Expo Push | Avisos de estado de pedido y promociones |

## 7. Identidad visual

El design system entregado (versión 1.0, mayo 2024) es la única fuente de verdad y se sigue al pie de la letra: paleta, tipografías, escala tipográfica, sistema de espaciado de 8px, radios, sombras, botones, campos, tarjetas, badges, iconografía lineal de 2px y la barra de navegación de cinco pestañas (Inicio, Menú, Promos, Momentos, Perfil).

**Elemento estructural.** El isotipo de La Mesa es un anillo abierto — una mesa vista desde arriba. Ese anillo se usa como dispositivo recurrente en la app y significa algo distinto en cada lugar: rodea los avatares de quienes están en una mesa compartida, se llena a medida que avanza el pedido, y marca el progreso hacia el siguiente nivel de fidelidad. Es el único gesto decorativo que se permite; todo lo demás se mantiene sobrio.

**Nota sobre tipografía.** Canela es una fuente comercial de Commercial Type y requiere licencia (escritorio y aplicación móvil se licencian por separado). Hasta que La Mesa la adquiera, el código usa `Instrument Serif` como sustituto de carácter similar, declarada después de Canela en la cascada: en cuanto se instale el archivo de Canela, la app la toma sin cambiar una línea. Montserrat es de Google Fonts y se usa tal cual.

## 8. Reglas y casos límite

El restaurante puede marcar un producto como agotado y desaparece del menú del cliente sin romper pedidos en curso. Los cupones tienen vigencia y no se pueden acumular entre sí salvo que se marque explícitamente. Un pedido pagado no se puede editar; se cancela y se rehace, y la devolución la gestiona el restaurante. Si el restaurante está cerrado, la app permite programar el pedido para el siguiente horario de apertura en lugar de bloquear la compra. En una mesa compartida, si alguien no paga su parte dentro del tiempo definido, el anfitrión decide si cubre esa parte o se retira ese ítem. Los puntos se acreditan cuando el pedido pasa a entregado, no al pagar, para evitar acreditar pedidos cancelados.

## 9. Criterios de calidad

Un cliente nuevo debe poder instalar la app y completar su primer pedido sin ayuda en menos de dos minutos. El estado del pedido debe reflejarse en el teléfono del cliente en menos de cinco segundos desde que cocina lo cambia. Cualquier persona del equipo debe poder editar un precio o agotar un producto sin instrucción previa. Y la app debe verse inequívocamente como La Mesa: si se le quita el logo, la marca todavía se reconoce por el color, la tipografía y el anillo.

## 10. Qué queda fuera de mi alcance

Publicar en Google Play y App Store requiere cuentas de desarrollador a nombre de La Mesa y pasar la revisión de cada tienda. Activar cobros reales requiere una cuenta de comercio en Wompi con los documentos de la empresa. Yo dejo el código, la configuración y la documentación listos para que ese paso final sea cargar credenciales y publicar.

## 11. Plan de construcción

**Fase 1 — Fundamentos y prototipo.** Esquema de base de datos, tokens de marca en código, menú de ejemplo y prototipo interactivo navegable de la app para validar flujos y estética antes de escribir la app real.

**Fase 2 — Panel de administración.** Tablero de pedidos en tiempo real y gestión de menú, cupones y promociones.

**Fase 3 — App móvil real.** Proyecto Expo con las pantallas validadas, conectado a Supabase, con autenticación y notificaciones.

**Fase 4 — Pagos y salida a producción.** Integración con Wompi, pruebas de extremo a extremo y preparación de los builds para tiendas.
