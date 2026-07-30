#!/usr/bin/env python3
"""
Comprueba el contraste de la paleta de La Mesa contra WCAG 2.1 AA.

    python3 docs/contraste.py

Texto normal necesita 4,5:1. Texto grande (24px o 19px en negrita) y los
componentes de interfaz necesitan 3:1. Correr esto cada vez que se toque un
color: un contraste malo no se nota en el escritorio del diseñador, se nota
en un celular al sol.
"""


def lineal(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminancia(hexa: str) -> float:
    h = hexa.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b)


def mezclar(frente: str, alfa: float, fondo: str) -> str:
    f = [int(frente.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(fondo.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02X%02X%02X' % tuple(round(f[i] * alfa + b[i] * (1 - alfa)) for i in range(3))


def contraste(a: str, b: str) -> float:
    la, lb = luminancia(a), luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# Paleta del design system
NARANJA, AMARILLO = '#F26B1F', '#F9C65C'
MARFIL, CARBON, TEAL = '#FFF6ED', '#1F1F1F', '#2EBC83'
CREMA, BLANCO = '#FBEEE1', '#FFFFFF'

# Variantes solo para texto
NARANJA_TEXTO, TEAL_TEXTO, ROJO_TEXTO = '#B8480A', '#1C7A54', '#D23232'

TINTA60 = 0.66  # texto secundario
TINTA40 = 0.42  # solo decorativo, nunca texto

# (descripción, frente, fondo, mínimo exigido)
CASOS = [
    ('Texto principal sobre marfil', CARBON, MARFIL, 4.5),
    ('Texto secundario sobre marfil', mezclar(CARBON, TINTA60, MARFIL), MARFIL, 4.5),
    ('Texto secundario sobre crema', mezclar(CARBON, TINTA60, CREMA), CREMA, 4.5),
    ('Texto secundario sobre blanco', mezclar(CARBON, TINTA60, BLANCO), BLANCO, 4.5),
    ('CAPTION sobre marfil', mezclar(CARBON, TINTA60, MARFIL), MARFIL, 4.5),
    ('Precio y enlaces (naranja texto)', NARANJA_TEXTO, MARFIL, 4.5),
    ('Ahorro y confirmación (teal texto)', TEAL_TEXTO, MARFIL, 4.5),
    ('Errores (rojo texto)', ROJO_TEXTO, MARFIL, 4.5),
    ('Badge Nuevo: carbón sobre amarillo', CARBON, AMARILLO, 4.5),
    ('Badge Descuento: carbón sobre teal', CARBON, TEAL, 4.5),
    ('Badge Exclusivo app: blanco sobre naranja', BLANCO, NARANJA, 3.0),
    ('Botón primario: blanco sobre naranja', BLANCO, NARANJA, 3.0),
    ('Botón secundario: carbón sobre crema', CARBON, CREMA, 4.5),
    ('Barra de navegación activa', NARANJA_TEXTO, MARFIL, 4.5),
]

if __name__ == '__main__':
    fallos = 0
    print(f"{'':46} {'medido':>7} {'mínimo':>7}")
    for descripcion, frente, fondo, minimo in CASOS:
        r = contraste(frente, fondo)
        ok = r >= minimo
        if not ok:
            fallos += 1
        print(f'{descripcion:46} {r:7.2f} {minimo:7.1f}  {"ok" if ok else "FALLA"}')

    print()
    decorativo = contraste(mezclar(CARBON, TINTA40, MARFIL), MARFIL)
    print(f'Gris decorativo (tinta-40): {decorativo:.2f} — por debajo de AA a propósito.')
    print('Solo para elementos deshabilitados y adornos, nunca para texto que haya que leer.')
    print()
    print('Todo pasa.' if not fallos else f'{fallos} caso(s) por debajo del mínimo.')
    raise SystemExit(1 if fallos else 0)
