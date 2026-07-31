import { create } from 'zustand';
import { HAY_BACKEND } from '@/datos/supabase';
import { guardarFavorito, quitarFavorito, traerFavoritos } from '@/datos/favoritos';

interface EstadoFavoritos {
  ids: string[];
  cargando: boolean;

  cargar: () => Promise<void>;
  esFavorito: (productoId: string) => boolean;
  alternar: (productoId: string) => Promise<void>;
}

/**
 * Los platos guardados por el cliente. Con backend viven en la tabla
 * `favoritos`; en modo demostración —sin dónde guardarlos— el corazón
 * igual responde al toque, pero solo dura la sesión, como el carrito.
 */
export const usarFavoritos = create<EstadoFavoritos>((set, get) => ({
  ids: [],
  cargando: true,

  cargar: async () => {
    const ids = await traerFavoritos();
    set({ ids, cargando: false });
  },

  esFavorito: (productoId) => get().ids.includes(productoId),

  alternar: async (productoId) => {
    const activo = get().ids.includes(productoId);
    // Optimista: el corazón cambia ya mismo; si el backend falla, se revierte.
    set((s) => ({
      ids: activo ? s.ids.filter((id) => id !== productoId) : [...s.ids, productoId],
    }));
    if (!HAY_BACKEND) return;
    const ok = activo ? await quitarFavorito(productoId) : await guardarFavorito(productoId);
    if (!ok) {
      set((s) => ({
        ids: activo ? [...s.ids, productoId] : s.ids.filter((id) => id !== productoId),
      }));
    }
  },
}));
