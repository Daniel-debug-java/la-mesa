import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Con las credenciales vacías la app corre con el menú de demostración */
export const HAY_BACKEND = Boolean(url && anon);

export const SEDE_ID =
  process.env.EXPO_PUBLIC_SEDE_ID ?? '11111111-1111-1111-1111-111111111111';

export const supabase = createClient(url || 'https://sin-configurar.supabase.co', anon || 'sin-clave', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Envuelve una consulta para que un backend caído nunca tumbe una pantalla:
 * devuelve el respaldo y deja el error en consola para diagnóstico.
 */
export async function conRespaldo<T>(
  consulta: () => PromiseLike<{ data: T | null; error: unknown }>,
  respaldo: T,
): Promise<T> {
  if (!HAY_BACKEND) return respaldo;
  try {
    const { data, error } = await consulta();
    if (error || !data) {
      console.warn('[La Mesa] consulta sin resultado', error);
      return respaldo;
    }
    return data;
  } catch (e) {
    console.warn('[La Mesa] error de red', e);
    return respaldo;
  }
}
