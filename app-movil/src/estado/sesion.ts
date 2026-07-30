import { create } from 'zustand';
import { HAY_BACKEND, supabase } from '@/datos/supabase';
import { Perfil } from '@/datos/tipos';

const PERFIL_DEMO: Perfil = {
  id: 'demo',
  nombre: 'Daniel',
  telefono: null,
  avatar_url: null,
  puntos: 1180,
  puntos_historicos: 1180,
};

interface EstadoSesion {
  cargando: boolean;
  autenticado: boolean;
  perfil: Perfil | null;

  iniciar: () => Promise<void>;
  entrarConCorreo: (correo: string) => Promise<{ ok: boolean; mensaje: string }>;
  verificarCodigo: (correo: string, codigo: string) => Promise<{ ok: boolean; mensaje: string }>;
  salir: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
}

export const usarSesion = create<EstadoSesion>((set, get) => ({
  cargando: true,
  autenticado: false,
  perfil: null,

  iniciar: async () => {
    if (!HAY_BACKEND) {
      set({ cargando: false, autenticado: true, perfil: PERFIL_DEMO });
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      set({ autenticado: true });
      await get().refrescarPerfil();
    }
    supabase.auth.onAuthStateChange((_evento, sesion) => {
      set({ autenticado: Boolean(sesion) });
      if (sesion) void get().refrescarPerfil();
      else set({ perfil: null });
    });
    set({ cargando: false });
  },

  /** Código de seis dígitos al correo: sin contraseñas que recordar */
  entrarConCorreo: async (correo) => {
    if (!HAY_BACKEND) {
      set({ autenticado: true, perfil: PERFIL_DEMO });
      return { ok: true, mensaje: 'Modo demostración: entraste sin código.' };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: correo.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    return error
      ? { ok: false, mensaje: 'No pudimos enviar el código. Revisa el correo e intenta otra vez.' }
      : { ok: true, mensaje: 'Te enviamos un código de seis dígitos.' };
  },

  verificarCodigo: async (correo, codigo) => {
    if (!HAY_BACKEND) return { ok: true, mensaje: '' };
    const { error } = await supabase.auth.verifyOtp({
      email: correo.trim().toLowerCase(),
      token: codigo.trim(),
      type: 'email',
    });
    if (error) return { ok: false, mensaje: 'Ese código no coincide. Revísalo e intenta de nuevo.' };
    await get().refrescarPerfil();
    return { ok: true, mensaje: '' };
  },

  salir: async () => {
    if (HAY_BACKEND) await supabase.auth.signOut();
    set({ autenticado: false, perfil: null });
  },

  refrescarPerfil: async () => {
    if (!HAY_BACKEND) return;
    const { data: usuario } = await supabase.auth.getUser();
    if (!usuario.user) return;
    const { data } = await supabase
      .from('perfiles')
      .select('id,nombre,telefono,avatar_url,puntos,puntos_historicos')
      .eq('id', usuario.user.id)
      .single();
    if (data) set({ perfil: data as Perfil, autenticado: true });
  },
}));
