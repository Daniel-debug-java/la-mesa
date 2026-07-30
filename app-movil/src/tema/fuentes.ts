import * as Font from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { usarCanela } from './tipografia';

/**
 * Carga las fuentes de la marca.
 *
 * Canela va primero y es opcional: si los archivos no están (todavía no se
 * ha comprado la licencia), se ignora el error y la app arranca con el
 * sustituto. Así nadie queda bloqueado esperando una licencia.
 */
export async function cargarFuentes() {
  await Font.loadAsync({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    InstrumentSerif: InstrumentSerif_400Regular,
  });

  try {
    // Al comprar la licencia de Canela, descomenta estas líneas y copia
    // los archivos a assets/fuentes/. Nada más cambia en la app.
    // await Font.loadAsync({ Canela: require('../../assets/fuentes/Canela-Regular.otf') });
    // usarCanela();
    void usarCanela;
  } catch {
    // Sin Canela seguimos con el sustituto, sin romper el arranque.
  }
}
