# Funciones de servidor · La Mesa

Tres funciones que corren en Supabase Edge Functions (Deno). Existen porque hay cosas que no pueden vivir dentro de la app: quien descargue el APK puede leer todo lo que esté ahí.

| Función | Quién la llama | Para qué |
|---|---|---|
| `crear-transaccion` | La app, con el token del cliente | Recalcula el total desde la base y firma el cobro |
| `webhook-wompi` | Wompi | Confirma el pago y libera el pedido a cocina |
| `notificar-pedido` | La base de datos, en cada cambio de estado | Manda el aviso al teléfono del cliente |

---

## La regla que sostiene todo esto

**El monto a cobrar nunca viene del teléfono.** La app manda solo el `pedido_id`; el servidor lee el total de la tabla `pedidos` con la llave de servicio y firma sobre ese valor. Si alguien manipula la app para pedir una hamburguesa por mil pesos, el cobro sale igual por el total real.

Y en el otro sentido: **la app nunca decide que un pago salió bien.** Un pedido pasa de `pendiente_pago` a `recibido` únicamente cuando Wompi lo confirma por webhook y el checksum del evento cuadra. Si esa comprobación no existiera, bastaría con conocer la URL del webhook para pedir comida gratis.

---

## Secretos

Se guardan en Supabase, nunca en el repositorio ni en la app:

```bash
supabase secrets set \
  WOMPI_LLAVE_PUBLICA=pub_prod_xxxxxxxx \
  WOMPI_SECRETO_INTEGRIDAD=prod_integrity_xxxxxxxx \
  WOMPI_SECRETO_EVENTOS=prod_events_xxxxxxxx \
  WOMPI_REDIRECCION=lamesa://pago \
  SECRETO_WEBHOOK_INTERNO=$(openssl rand -hex 24)
```

Los tres valores de Wompi salen del panel de comercio, en Desarrolladores → Llaves. Hay un juego para pruebas (`pub_test_`, `test_integrity_`, `test_events_`) y otro para producción: arranca con los de prueba.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` ya existen dentro de las funciones, no hay que declararlas.

## Desplegar

```bash
supabase functions deploy crear-transaccion
supabase functions deploy notificar-pedido
supabase functions deploy webhook-wompi --no-verify-jwt
```

`webhook-wompi` va con `--no-verify-jwt` porque quien llama es Wompi, no un usuario con sesión. No queda desprotegida: sin un checksum válido el evento se descarta.

## Conectar Wompi

En el panel de Wompi, Desarrolladores → Eventos, registra la URL:

```
https://<tu-proyecto>.supabase.co/functions/v1/webhook-wompi
```

Wompi reintenta hasta tres veces en 24 horas si no recibe un 200. Por eso la función responde 200 incluso cuando la referencia no existe: reintentar un evento que nunca vamos a poder procesar no arregla nada. Solo devuelve 500 cuando el fallo es nuestro y el reintento sí tiene sentido.

## Conectar las notificaciones

En Supabase, Database → Webhooks, crea uno nuevo:

- Tabla `pedidos`, evento **Update**
- Tipo **HTTP Request**, método POST
- URL: `https://<tu-proyecto>.supabase.co/functions/v1/notificar-pedido`
- Cabeceras: `x-secreto-interno` con el valor de `SECRETO_WEBHOOK_INTERNO`

La función compara el estado nuevo con el anterior y solo manda aviso si cambió. Un update de notas no suena en el teléfono de nadie.

## Probar sin cobrar dinero

Con las llaves de prueba, Wompi da tarjetas de prueba en su documentación. El flujo completo:

1. Haces un pedido desde la app y llegas a la pasarela
2. Pagas con tarjeta de prueba
3. El webhook recibe `APPROVED` y el pedido aparece en el panel de cocina
4. Cocina lo mueve y te llega la notificación al teléfono

Para ver qué pasa por dentro:

```bash
supabase functions logs webhook-wompi --tail
```

Y para probar el webhook a mano, sin pasar por Wompi:

```bash
deno run --allow-net supabase/functions/_pruebas/evento-falso.ts
```

Ese script arma un evento con el mismo formato de Wompi y lo firma con tu secreto de eventos, así compruebas la validación de checksum sin depender de la pasarela.

## Lo que falta para cobrar de verdad

Una cuenta de comercio Wompi aprobada a nombre de La Mesa, con RUT y cámara de comercio. Mientras esté en revisión funcionan las llaves de prueba, que hacen exactamente el mismo recorrido sin mover plata.
