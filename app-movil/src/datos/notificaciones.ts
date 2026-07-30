import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { HAY_BACKEND, supabase } from './supabase';
import { color } from '@/tema/tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso y guarda el token en el perfil.
 * Se llama después de que el cliente hace su primer pedido, no al abrir la
 * app por primera vez: pedir permiso antes de dar algo a cambio se traduce
 * en un "no" que ya no se puede revertir.
 */
export async function registrarNotificaciones(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pedidos', {
      name: 'Estado de tu pedido',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: color.naranja,
    });
  }

  const { status: actual } = await Notifications.getPermissionsAsync();
  let estado = actual;
  if (estado !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    estado = status;
  }
  if (estado !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('[La Mesa] falta el projectId de EAS para las notificaciones push');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  if (HAY_BACKEND) {
    const { data: usuario } = await supabase.auth.getUser();
    if (usuario.user) {
      await supabase.from('perfiles').update({ push_token: token }).eq('id', usuario.user.id);
    }
  }
  return token;
}
