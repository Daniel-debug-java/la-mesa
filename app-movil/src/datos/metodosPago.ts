import { NombreIcono } from '@/componentes/Icono';
import { color } from '@/tema/tokens';
import { MetodoPago } from './tipos';

/**
 * Los cuatro primeros los resuelve Wompi con una sola integración. Efectivo
 * lo cobra el restaurante al entregar. La misma lista alimenta el Checkout
 * y la pantalla de "Métodos de pago" del Perfil, así nunca se desalinean.
 */
export const METODOS_PAGO: {
  id: MetodoPago;
  nombre: string;
  detalle: string;
  sigla?: string;
  icono?: NombreIcono;
  fondo?: string;
  tinta?: string;
}[] = [
  { id: 'nequi', nombre: 'Nequi', detalle: 'Pagas desde tu celular', sigla: 'N', fondo: color.teal, tinta: color.blanco },
  { id: 'pse', nombre: 'PSE', detalle: 'Débito desde tu banco', sigla: 'PSE', fondo: color.carbon, tinta: color.blanco },
  { id: 'bancolombia', nombre: 'Bancolombia', detalle: 'Botón de pagos', sigla: 'B', fondo: color.amarillo, tinta: color.carbon },
  { id: 'tarjeta', nombre: 'Tarjeta', detalle: 'Crédito o débito', icono: 'tarjeta' },
  { id: 'efectivo', nombre: 'Efectivo', detalle: 'Pagas al recibir tu pedido', icono: 'efectivo' },
];
