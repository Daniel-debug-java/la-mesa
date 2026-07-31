import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE = 'la-mesa:preferencias-notificaciones';

interface Preferencias {
  pedidos: boolean;
  promos: boolean;
}

const PREDETERMINADAS: Preferencias = { pedidos: true, promos: true };

interface EstadoPreferencias extends Preferencias {
  cargando: boolean;
  cargar: () => Promise<void>;
  setPedidos: (v: boolean) => void;
  setPromos: (v: boolean) => void;
}

/**
 * Qué tipo de notificación quiere recibir el cliente. Se guarda en el
 * dispositivo (no en Supabase): es una preferencia del teléfono, no un dato
 * del negocio. `registrarNotificaciones()` sigue pidiendo el permiso del
 * sistema aparte — esto solo decide qué categorías se muestran activadas.
 */
export const usarPreferencias = create<EstadoPreferencias>((set, get) => ({
  ...PREDETERMINADAS,
  cargando: true,

  cargar: async () => {
    try {
      const guardado = await AsyncStorage.getItem(CLAVE);
      if (guardado) set({ ...PREDETERMINADAS, ...JSON.parse(guardado), cargando: false });
      else set({ cargando: false });
    } catch {
      set({ cargando: false });
    }
  },

  setPedidos: (pedidos) => {
    set({ pedidos });
    AsyncStorage.setItem(CLAVE, JSON.stringify({ pedidos, promos: get().promos })).catch(() => {});
  },

  setPromos: (promos) => {
    set({ promos });
    AsyncStorage.setItem(CLAVE, JSON.stringify({ pedidos: get().pedidos, promos })).catch(() => {});
  },
}));
