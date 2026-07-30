import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { color } from '@/tema/tokens';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

/**
 * El anillo del isotipo, convertido en medidor.
 * Rodea a quienes comparten mesa, avanza con el pedido y marca el
 * progreso hacia el siguiente nivel. Es el único gesto decorativo
 * que se permite en la app: todo lo demás se mantiene sobrio.
 */
interface Props {
  progreso: number; // 0 a 1
  tamano: number;
  grosor?: number;
  tono?: string;
  pista?: string;
  children?: ReactNode;
}

export function Anillo({
  progreso,
  tamano,
  grosor = 6,
  tono = color.naranja,
  pista = 'rgba(242,107,31,0.16)',
  children,
}: Props) {
  const r = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * r;
  const animado = useRef(new Animated.Value(circunferencia)).current;

  useEffect(() => {
    Animated.timing(animado, {
      toValue: circunferencia * (1 - Math.max(0, Math.min(1, progreso))),
      duration: 900,
      easing: Easing.bezier(0.3, 0.9, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [progreso, circunferencia, animado]);

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={tamano}
        height={tamano}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={tamano / 2} cy={tamano / 2} r={r} stroke={pista} strokeWidth={grosor} fill="none" />
        <CirculoAnimado
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          stroke={tono}
          strokeWidth={grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circunferencia}
          strokeDashoffset={animado}
        />
      </Svg>
      {children}
    </View>
  );
}

/** El isotipo: anillo abierto, la mesa vista desde arriba */
export function Isotipo({ tamano = 26, tono = color.naranja }: { tamano?: number; tono?: string }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 40 40">
      <Circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke={tono}
        strokeWidth={6.4}
        strokeLinecap="round"
        strokeDasharray={`${c * 0.88} ${c * 0.12}`}
        transform="rotate(-16 20 20)"
      />
    </Svg>
  );
}
