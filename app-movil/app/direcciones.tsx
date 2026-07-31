import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Boton } from '@/componentes/Boton';
import { Icono } from '@/componentes/Icono';
import { usarDirecciones } from '@/estado/direcciones';
import { color, e, radio, sombra } from '@/tema/tokens';
import { familia, texto, titulo } from '@/tema/tipografia';

const ETIQUETAS = ['Casa', 'Oficina', 'Otro'] as const;

export default function Direcciones() {
  const insets = useSafeAreaInsets();
  const { direcciones, cargando, cargar, agregar, actualizar, eliminar, hacerPrincipal } =
    usarDirecciones();

  const [editando, setEditando] = useState<string | null>(null); // id, o 'nueva'
  const [etiqueta, setEtiqueta] = useState<string>('Casa');
  const [direccion, setDireccion] = useState('');
  const [detalle, setDetalle] = useState('');

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirNueva() {
    setEditando('nueva');
    setEtiqueta('Casa');
    setDireccion('');
    setDetalle('');
  }

  function abrirEdicion(id: string) {
    const d = direcciones.find((x) => x.id === id);
    if (!d) return;
    setEditando(id);
    setEtiqueta(d.etiqueta);
    setDireccion(d.direccion);
    setDetalle(d.detalle ?? '');
  }

  function cancelar() {
    setEditando(null);
  }

  async function guardar() {
    if (!direccion.trim()) return;
    if (editando === 'nueva') {
      await agregar({
        etiqueta,
        direccion: direccion.trim(),
        detalle: detalle.trim() || null,
        principal: direcciones.length === 0,
      });
    } else if (editando) {
      await actualizar(editando, { etiqueta, direccion: direccion.trim(), detalle: detalle.trim() || null });
    }
    setEditando(null);
  }

  function confirmarEliminar(id: string) {
    Alert.alert('Eliminar dirección', '¿Seguro que quieres quitar esta dirección?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(id) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: color.marfil, paddingTop: insets.top }}>
      <View style={s.superior}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" hitSlop={10}>
          <Icono nombre="atras" tamano={20} tono={color.carbon} />
        </Pressable>
        <Text style={titulo('h2', { fontSize: 22, marginLeft: e.e3 })}>Mis direcciones</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: e.e4, paddingBottom: e.e9 }} showsVerticalScrollIndicator={false}>
        {!cargando && !direcciones.length && editando !== 'nueva' && (
          <Text style={[texto.b1, { color: color.tinta60, marginBottom: e.e4 }]}>
            Todavía no tienes direcciones guardadas.
          </Text>
        )}

        {direcciones.map((d) =>
          editando === d.id ? (
            <FormularioDireccion
              key={d.id}
              etiqueta={etiqueta}
              setEtiqueta={setEtiqueta}
              direccion={direccion}
              setDireccion={setDireccion}
              detalle={detalle}
              setDetalle={setDetalle}
              onGuardar={guardar}
              onCancelar={cancelar}
            />
          ) : (
            <Pressable key={d.id} style={[s.fila, d.principal && s.filaOn]} onPress={() => hacerPrincipal(d.id)}>
              <View style={[s.marca, d.principal && { borderColor: color.naranja, backgroundColor: color.naranja }]}>
                {d.principal ? <View style={s.punto} /> : null}
              </View>
              <View style={[s.sello, { backgroundColor: color.crema }]}>
                <Icono nombre="ubicacion" tamano={18} grosor={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={texto.h4}>
                  {d.etiqueta} {d.principal ? '· Principal' : ''}
                </Text>
                <Text style={[texto.b2, { color: color.tinta60 }]}>{d.direccion}</Text>
                {d.detalle ? (
                  <Text style={[texto.b2, { color: color.tinta40, marginTop: 1 }]}>{d.detalle}</Text>
                ) : null}
              </View>
              <Pressable
                hitSlop={10}
                onPress={(ev) => {
                  ev.stopPropagation();
                  abrirEdicion(d.id);
                }}
                style={{ marginRight: e.e2 }}
              >
                <Icono nombre="mas" tamano={16} tono={color.tinta40} />
              </Pressable>
              <Pressable
                hitSlop={10}
                onPress={(ev) => {
                  ev.stopPropagation();
                  confirmarEliminar(d.id);
                }}
              >
                <Icono nombre="cerrar" tamano={16} tono={color.tinta40} />
              </Pressable>
            </Pressable>
          ),
        )}

        {editando === 'nueva' ? (
          <FormularioDireccion
            etiqueta={etiqueta}
            setEtiqueta={setEtiqueta}
            direccion={direccion}
            setDireccion={setDireccion}
            detalle={detalle}
            setDetalle={setDetalle}
            onGuardar={guardar}
            onCancelar={cancelar}
          />
        ) : (
          <Boton variante="secundario" estilo={{ marginTop: e.e2 }} onPress={abrirNueva}>
            + Añadir dirección
          </Boton>
        )}
      </ScrollView>
    </View>
  );
}

function FormularioDireccion({
  etiqueta,
  setEtiqueta,
  direccion,
  setDireccion,
  detalle,
  setDetalle,
  onGuardar,
  onCancelar,
}: {
  etiqueta: string;
  setEtiqueta: (v: string) => void;
  direccion: string;
  setDireccion: (v: string) => void;
  detalle: string;
  setDetalle: (v: string) => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  return (
    <View style={s.formulario}>
      <View style={{ flexDirection: 'row', gap: e.e2, marginBottom: e.e3 }}>
        {ETIQUETAS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setEtiqueta(t)}
            style={[s.chip, etiqueta === t && s.chipOn]}
          >
            <Text style={[s.chipTexto, etiqueta === t && { color: color.blanco }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={direccion}
        onChangeText={setDireccion}
        placeholder="Calle, carrera, número…"
        placeholderTextColor={color.tinta40}
        style={s.campo}
      />
      <TextInput
        value={detalle}
        onChangeText={setDetalle}
        placeholder="Apto, torre, indicaciones (opcional)"
        placeholderTextColor={color.tinta40}
        style={[s.campo, { marginTop: e.e2 }]}
      />
      <View style={{ flexDirection: 'row', gap: e.e2, marginTop: e.e3 }}>
        <Boton variante="secundario" estilo={{ flex: 1 }} onPress={onCancelar}>
          Cancelar
        </Boton>
        <Boton estilo={{ flex: 1 }} deshabilitado={!direccion.trim()} onPress={onGuardar}>
          Guardar
        </Boton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  superior: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: e.e4,
    paddingVertical: e.e3,
    borderBottomWidth: 1,
    borderBottomColor: color.linea,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: e.e3,
    padding: e.e4,
    marginBottom: e.e2,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.blanco,
  },
  filaOn: { borderColor: color.naranja, backgroundColor: 'rgba(242,107,31,0.05)' },
  marca: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: color.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punto: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: color.blanco },
  sello: { width: 36, height: 36, borderRadius: radio.r2, alignItems: 'center', justifyContent: 'center' },
  formulario: {
    padding: e.e4,
    marginBottom: e.e3,
    borderRadius: radio.r3,
    backgroundColor: color.blanco,
    ...sombra.suave,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radio.redondo,
    backgroundColor: color.crema,
  },
  chipOn: { backgroundColor: color.naranja },
  chipTexto: { fontFamily: familia.semibold, fontSize: 12.5, color: color.carbon },
  campo: {
    height: 48,
    paddingHorizontal: e.e4,
    borderRadius: radio.r3,
    borderWidth: 1.5,
    borderColor: color.linea,
    backgroundColor: color.marfil,
    fontFamily: familia.regular,
    fontSize: 14,
    color: color.carbon,
  },
});
