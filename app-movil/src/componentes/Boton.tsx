import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia } from '@/tema/tipografia';

type Variante = 'primario' | 'secundario' | 'fantasma';

interface Props {
  children: string;
  onPress?: () => void;
  variante?: Variante;
  bloque?: boolean;
  cargando?: boolean;
  deshabilitado?: boolean;
  izquierda?: React.ReactNode;
  derecha?: React.ReactNode;
  estilo?: ViewStyle;
}

export function Boton({
  children,
  onPress,
  variante = 'primario',
  bloque,
  cargando,
  deshabilitado,
  izquierda,
  derecha,
  estilo,
}: Props) {
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactivo), busy: Boolean(cargando) }}
      style={({ pressed }) => [
        s.base,
        variante === 'primario' && s.primario,
        variante === 'secundario' && s.secundario,
        variante === 'fantasma' && s.fantasma,
        bloque && { width: '100%' },
        inactivo && (variante === 'primario' ? s.primarioInactivo : { opacity: 0.45 }),
        pressed && !inactivo && { transform: [{ scale: 0.975 }] },
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? color.blanco : color.naranja} />
      ) : (
        <>
          {izquierda ? <View style={{ marginRight: e.e2 }}>{izquierda}</View> : null}
          <Text
            style={[
              s.texto,
              variante === 'primario' && { color: color.blanco },
              variante === 'fantasma' && { color: color.naranjaTexto },
              inactivo && variante === 'primario' && { color: 'rgba(31,31,31,0.35)' },
            ]}
          >
            {children}
          </Text>
          {derecha ? <View style={{ marginLeft: e.e2 }}>{derecha}</View> : null}
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    height: 48,
    paddingHorizontal: e.e5,
    borderRadius: radio.r3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: color.naranja, ...sombra.suave },
  primarioInactivo: { backgroundColor: '#F7DCC7' },
  secundario: { backgroundColor: color.crema },
  fantasma: { backgroundColor: 'transparent', height: 'auto', paddingHorizontal: e.e2 },
  texto: {
    fontFamily: familia.semibold,
    fontSize: 14,
    letterSpacing: 0.14,
    color: color.carbon,
  },
});
