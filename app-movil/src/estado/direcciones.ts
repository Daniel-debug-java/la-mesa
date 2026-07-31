import { create } from 'zustand';
import {
  actualizarDireccion,
  crearDireccion,
  eliminarDireccion,
  marcarPrincipal,
  traerDirecciones,
} from '@/datos/direcciones';
import { Direccion } from '@/datos/tipos';

interface EstadoDirecciones {
  direcciones: Direccion[];
  cargando: boolean;

  cargar: () => Promise<void>;
  agregar: (d: Omit<Direccion, 'id'>) => Promise<void>;
  actualizar: (id: string, cambios: Partial<Omit<Direccion, 'id'>>) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  hacerPrincipal: (id: string) => Promise<void>;
  principal: () => Direccion | null;
}

/**
 * Las direcciones guardadas del cliente, con la misma dirección disponible
 * en Perfil (para administrarlas) y en Checkout (para elegir con cuál se
 * entrega). En modo demostración los cambios solo duran la sesión — no hay
 * dónde guardarlos sin backend —, igual que el carrito.
 */
export const usarDirecciones = create<EstadoDirecciones>((set, get) => ({
  direcciones: [],
  cargando: true,

  cargar: async () => {
    const direcciones = await traerDirecciones();
    set({ direcciones, cargando: false });
  },

  agregar: async (d) => {
    const nueva = await crearDireccion(d);
    if (!nueva) return;
    set((s) => ({
      direcciones: d.principal
        ? [...s.direcciones.map((x) => ({ ...x, principal: false })), nueva]
        : [...s.direcciones, nueva],
    }));
  },

  actualizar: async (id, cambios) => {
    const ok = await actualizarDireccion(id, cambios);
    if (!ok) return;
    set((s) => ({
      direcciones: s.direcciones.map((d) => (d.id === id ? { ...d, ...cambios } : d)),
    }));
  },

  eliminar: async (id) => {
    const ok = await eliminarDireccion(id);
    if (!ok) return;
    set((s) => ({ direcciones: s.direcciones.filter((d) => d.id !== id) }));
  },

  hacerPrincipal: async (id) => {
    const ok = await marcarPrincipal(id);
    if (!ok) return;
    set((s) => ({
      direcciones: s.direcciones.map((d) => ({ ...d, principal: d.id === id })),
    }));
  },

  principal: () => get().direcciones.find((d) => d.principal) ?? get().direcciones[0] ?? null,
}));
