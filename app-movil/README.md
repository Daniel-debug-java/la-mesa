# La Mesa · App móvil

App de clientes de La Mesa para iOS y Android. Un solo código, Expo (React Native) con TypeScript, conectada a Supabase.

Sede de arranque: El Poblado, Medellín. La estructura de datos ya soporta varias sedes y monedas, así que abrir en España es cargar una sede nueva, no reescribir el sistema.

---

## Correrla por primera vez

```bash
npm install
npm start
```

Escanea el código QR con la app **Expo Go** en tu celular y la app abre ahí mismo.

Sin credenciales de Supabase la app arranca en modo demostración: menú completo, carrito, cupones y puntos funcionan con los datos de `src/datos/demo.ts`, que son los mismos de `supabase/seed.sql`. Sirve para revisar diseño y flujos sin depender de nadie.

## Conectarla a Supabase

Crea el proyecto en Supabase, corre `supabase/schema.sql` y después `supabase/seed.sql` desde el editor SQL. Luego copia el archivo de variables y pega tus credenciales:

```bash
cp .env.example .env
```

En cuanto `.env` tenga la URL y la clave anónima, la app deja el modo demostración y empieza a leer del proyecto real. No hay que tocar código: `HAY_BACKEND` en `src/datos/supabase.ts` lo detecta solo.

Falta un paso en el panel de Supabase: crear el bucket público **`productos`** en Storage, que es donde el panel de administración sube las fotos de los platos.

## Cómo está organizado

```
app/                       rutas (expo-router: cada archivo es una pantalla)
  (tabs)/                  las cinco pestañas del design system
    index.tsx              Inicio · la mesa con las categorías como platos
    menu.tsx               la carta
    promos.tsx             cupones y canje de puntos
    momentos.tsx           las mesas que el cliente ha compartido
    perfil.tsx             puntos, nivel y ajustes
  producto/[id].tsx        detalle y personalización
  carrito.tsx              pedido en curso
  checkout.tsx             entrega, pago y confirmación
  pedido/[numero].tsx      seguimiento en vivo
  mesa/[codigo].tsx        Mesa Compartida
  entrar.tsx               acceso con código al correo

src/
  tema/                    tokens del design system, tipografía, fuentes
  componentes/             Botón, Badge, Anillo, Icono, Avatar, Contador, FotoPlato
  datos/                   Supabase, consultas, notificaciones, datos de demostración
  estado/                  carrito y sesión (zustand)
  utils/                   formato de moneda, fechas y puntos
```

Ningún color, tamaño, radio o sombra se escribe a mano fuera de `src/tema/tokens.ts`. Si algo necesita un valor que no está ahí, el valor está mal o falta en el design system.

## Tipografías

Montserrat viene de Google Fonts y se carga sola.

**Canela es comercial** (Commercial Type) y necesita licencia; escritorio y aplicación móvil se licencian por separado. Mientras tanto la app usa Instrument Serif como sustituto. Cuando compres la licencia:

1. Copia los `.otf` a `assets/fuentes/`
2. Descomenta las dos líneas marcadas en `src/tema/fuentes.ts`

Nada más cambia: todas las pantallas piden la familia display, no un nombre de archivo.

## Pagos

Los cuatro métodos digitales —Nequi, PSE, Bancolombia y tarjeta— los resuelve **Wompi** con una sola integración. Efectivo lo cobra el restaurante al entregar y no pasa por la pasarela.

La app **no arma la URL de la pasarela ni conoce el monto que se firma**. Manda solo el id del pedido a la función `crear-transaccion`, que recalcula el total desde la base de datos y devuelve la URL firmada. El secreto de integridad vive en el servidor: quien tenga el APK puede leer cualquier cosa que esté dentro de la app.

En el otro sentido, volver de la pasarela no significa que el pago esté aprobado. Eso lo confirma Wompi contra `webhook-wompi`, que es lo único que puede mover un pedido de `pendiente_pago` a `recibido`. Ver `supabase/functions/README.md`.

## Notificaciones

El permiso se pide después del primer pedido, no al abrir la app por primera vez. Pedirlo antes de haber dado algo a cambio se traduce en un "no" que en iOS ya no se puede revertir sin ir a Ajustes.

Para que funcionen hace falta un `projectId` de EAS en `app.json` (`extra.eas.projectId`), que se genera al correr `eas init`.

## Seguimiento en vivo

Cuando cocina mueve un pedido en el panel de administración, el cambio llega al teléfono del cliente por Realtime de Supabase, sin recargar y sin polling. La suscripción vive en `seguirPedido()` y se corta sola al salir de la pantalla.

Lo mismo pasa en Mesa Compartida: cada plato que agrega alguien aparece en el teléfono de los demás.

## Antes de publicar

```bash
npm run tipos     # TypeScript sin errores
npx expo export --platform android   # verifica que todo el bundle resuelve
```

Para publicar hacen falta cuentas de desarrollador a nombre de La Mesa: Google Play (pago único) y Apple Developer (anual). Con esas cuentas:

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform all
eas submit --platform all
```

Antes de enviar a revisión hay que tener publicadas la política de privacidad y los términos, y en la ficha de App Store declarar qué datos recoge la app (correo, nombre, dirección de entrega e historial de pedidos).

## Lo que queda pendiente

La asignación automática de mensajero por API, que hoy se hace a mano desde el panel. Y las direcciones guardadas del cliente, que en esta versión están fijas en el checkout.
