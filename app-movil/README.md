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

## Fotos de los platos

Los diez platos y bebidas de la carta traen foto real por defecto, tomada de [Pexels](https://www.pexels.com) (banco de imágenes de licencia libre, sin necesidad de atribución). Viven como URL en `imagen_url` — no están descargadas al repositorio, así que necesitan conexión a internet para verse, igual que cualquier imagen de producto en una app real. `FotoPlato` cae de vuelta al tejido de color de la categoría si la foto no carga (sin conexión, o si el enlace deja de existir).

Para reemplazarlas por fotos propias del restaurante: sube la imagen al bucket `productos` de Supabase Storage desde el panel de administración (el editor de encuadre ya está armado, ver `panel/README` más abajo) y el `imagen_url` del producto se actualiza solo.

## La mesa giratoria

En Inicio las categorías se sirven alrededor de una mesa vista desde arriba. Se gira arrastrando con el dedo —`react-native-gesture-handler` mide el ángulo respecto al centro y `react-native-reanimated` lo anima en el hilo de UI, así que sigue al dedo sin pasar por JavaScript— y al soltar encaja en el plato más cercano, con un punto de inercia tomado de la velocidad del gesto. Tocar un plato gira la mesa hasta traerlo al frente y solo entonces abre su categoría.

Solo el gesto horizontal gira (`activeOffsetX` / `failOffsetY`): un deslizamiento vertical sigue desplazando la pantalla, y un toque llega limpio al plato. Con "reducir movimiento" activado en el sistema, la navegación es directa y sin animación.

## Iniciar sesión

Sin contraseñas: un código de seis dígitos al correo (`entrarConCorreo` / `verificarCodigo`) o entrar con **Google** (`entrarConGoogle`), ambos vía Supabase Auth. En modo demostración cualquiera de los dos entra directo con el perfil de prueba.

Para que Google funcione de verdad con un backend real hacen falta dos cosas que no puede resolver el código solo, porque dependen de cuentas externas:

1. **Credenciales OAuth en Google Cloud Console** — crea un proyecto (o usa uno existente), habilita la pantalla de consentimiento OAuth, y crea credenciales de tipo "ID de cliente de OAuth" → "Aplicación web". En "URIs de redirección autorizados" pega la URL de callback que te da el siguiente paso.
2. **Activar el proveedor Google en Supabase** — en el panel del proyecto: Authentication → Providers → Google, pega el Client ID y Client Secret de Google Cloud, y guarda. Supabase te muestra ahí mismo la URL de callback que Google necesita.

Con eso conectado, `entrarConGoogle()` abre el navegador del sistema (`expo-web-browser`), la persona confirma su cuenta de Google, y vuelve a la app por el esquema `lamesa://auth/callback` (declarado en `app.json`) con un código de un solo uso que Supabase canjea por una sesión real — flujo PKCE, el token nunca viaja expuesto en la URL.

## Cómo está organizado

```
app/                       rutas (expo-router: cada archivo es una pantalla)
  (tabs)/                  las cinco pestañas del design system
    index.tsx              Inicio · la mesa giratoria con las categorías como platos
    menu.tsx               la carta
    promos.tsx             cupones y canje de puntos
    momentos.tsx           las mesas que el cliente ha compartido
    perfil.tsx             puntos, nivel y ajustes
  producto/[id].tsx        detalle y personalización
  carrito.tsx              pedido en curso
  checkout.tsx             entrega, pago y confirmación
  pedido/[numero].tsx      seguimiento en vivo
  mesa/[codigo].tsx        Mesa Compartida
  entrar.tsx               acceso con Google o con código al correo

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
