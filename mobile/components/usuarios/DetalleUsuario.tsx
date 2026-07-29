/**
 * DetalleUsuario — hoja inferior con la ficha completa de una persona.
 *
 * La usan las listas de Miembros y de Staff, que solo muestran nombre, correo
 * y estado. Aquí se ve todo lo que la API ya devuelve en esas mismas listas,
 * sin pedir nada extra al servidor.
 *
 * Recibe los campos ya normalizados para no acoplarse a la forma de cada
 * endpoint: la lista de miembros usa `foto_perfil`/`membresia`, la de staff
 * usa `rol`/`especialidad`, y el mapeo se hace en cada pantalla.
 *
 * SECCIONES QUE PINTA
 *   velo ............. colors.overlay
 *   hoja ............. colors.background
 *   avatar ........... colors.accent + colors.onAccent
 *   filas de datos ... colors.card, etiqueta en textSecondary, valor en text
 *   estado ........... dataProgreso si está activo, dataRiesgo si no
 */
import React, { useMemo } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useFontScale } from '../../hooks/useColors';
import { toStr, toDateStr } from '../../utils/format';

/** Un dato de la ficha. Las filas sin valor no se dibujan. */
export interface DatoUsuario {
  icono: string;
  etiqueta: string;
  valor?: string | number | null;
}

export interface UsuarioDetalle {
  nombre?:  string | null;
  email?:   string | null;
  telefono?: string | null;
  foto?:    string | null;
  activo?:  boolean;
  /** Texto bajo el nombre: la membresía, el puesto, la especialidad… */
  subtitulo?: string | null;
  /** Filas de la ficha, en el orden en que deben aparecer. */
  datos?:   DatoUsuario[];
}

interface Props {
  usuario: UsuarioDetalle | null;
  onClose: () => void;
  /** Título de la hoja. Por defecto, "Detalle". */
  titulo?: string;
}

export default function DetalleUsuario({ usuario, onClose, titulo = 'Detalle' }: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const activo = usuario?.activo !== false;
  const filas  = (usuario?.datos ?? []).filter(
    (d) => d.valor !== null && d.valor !== undefined && String(d.valor).trim() !== '',
  );

  const escribir = () => {
    if (usuario?.email) Linking.openURL(`mailto:${usuario.email}`);
  };
  const llamar = () => {
    if (usuario?.telefono) Linking.openURL(`tel:${String(usuario.telefono).replace(/\s/g, '')}`);
  };

  return (
    <Modal
      visible={!!usuario}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.velo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Cerrar detalle"
          accessibilityRole="button"
        />

        <View style={[styles.hoja, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.asa} />

          <View style={styles.encabezado}>
            <Text style={styles.tituloHoja}>{titulo}</Text>
            <TouchableOpacity onPress={onClose} style={styles.cerrar} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Identidad */}
            <View style={styles.identidad}>
              {usuario?.foto && usuario.foto.startsWith('data:image') ? (
                <Image source={{ uri: usuario.foto }} style={styles.fotoGrande} resizeMode="cover" />
              ) : (
                <View style={styles.avatarGrande}>
                  <Text style={styles.iniciales}>
                    {toStr(usuario?.nombre, '?').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text style={styles.nombre} numberOfLines={2}>{toStr(usuario?.nombre)}</Text>
              {usuario?.subtitulo ? (
                <Text style={styles.subtitulo}>{usuario.subtitulo}</Text>
              ) : null}

              <View style={[
                styles.estado,
                { backgroundColor: activo ? colors.dataProgresoBg : colors.dataRiesgoBg },
              ]}>
                <View style={[
                  styles.estadoPunto,
                  { backgroundColor: activo ? colors.dataProgreso : colors.dataRiesgo },
                ]} />
                <Text style={[
                  styles.estadoText,
                  { color: activo ? colors.dataProgreso : colors.dataRiesgo },
                ]}>
                  {activo ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>

            {/* Contacto directo */}
            {(usuario?.email || usuario?.telefono) && (
              <View style={styles.contactoRow}>
                {usuario?.email ? (
                  <TouchableOpacity
                    style={styles.contactoBtn} onPress={escribir}
                    accessibilityRole="button" accessibilityLabel={`Escribir a ${usuario.email}`}
                  >
                    <Ionicons name="mail-outline" size={17} color={colors.accent} />
                    <Text style={styles.contactoText}>Correo</Text>
                  </TouchableOpacity>
                ) : null}
                {usuario?.telefono ? (
                  <TouchableOpacity
                    style={styles.contactoBtn} onPress={llamar}
                    accessibilityRole="button" accessibilityLabel={`Llamar a ${usuario.telefono}`}
                  >
                    <Ionicons name="call-outline" size={17} color={colors.accent} />
                    <Text style={styles.contactoText}>Llamar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Ficha */}
            {filas.length > 0 ? (
              <View style={styles.ficha}>
                {filas.map((d, i) => (
                  <View
                    key={`${d.etiqueta}-${i}`}
                    style={[styles.fila, i === filas.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.filaIcono}>
                      <Ionicons name={d.icono as any} size={16} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.filaEtiqueta}>{d.etiqueta}</Text>
                    <Text style={styles.filaValor} numberOfLines={2}>{String(d.valor)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.sinDatos}>No hay más información registrada.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Formatea una fecha para la ficha; devuelve null si no hay valor. */
export function fechaFicha(valor?: string | null): string | null {
  if (!valor) return null;
  const txt = toDateStr(valor);
  return txt || String(valor).slice(0, 10);
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    velo: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    hoja: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 10, maxHeight: '88%',
    },
    asa: {
      width: 40, height: 4, borderRadius: 2, alignSelf: 'center',
      backgroundColor: colors.border, marginBottom: 10,
    },

    encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    tituloHoja: { color: colors.text, fontSize: 17 * fs, fontWeight: '700' },
    cerrar: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
    },

    identidad:   { alignItems: 'center', gap: 8, paddingVertical: 16 },
    avatarGrande: {
      width: 84, height: 84, borderRadius: 26,
      backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    },
    fotoGrande:  { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.surface },
    iniciales:   { color: colors.onAccent, fontSize: 32 * fs, fontWeight: '800' },
    nombre:      { color: colors.text, fontSize: 20 * fs, fontWeight: '800', textAlign: 'center' },
    subtitulo:   { color: colors.accent, fontSize: 13 * fs, fontWeight: '600' },
    estado: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 2,
    },
    estadoPunto: { width: 7, height: 7, borderRadius: 4 },
    estadoText:  { fontSize: 12 * fs, fontWeight: '700' },

    contactoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    contactoBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
      paddingVertical: 11, borderRadius: 12,
      backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent,
    },
    contactoText: { color: colors.accent, fontSize: 13 * fs, fontWeight: '700' },

    ficha: {
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
    },
    fila: {
      flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    filaIcono:    { width: 24, alignItems: 'center' },
    filaEtiqueta: { color: colors.textSecondary, fontSize: 13 * fs, flex: 1 },
    filaValor:    { color: colors.text, fontSize: 13.5 * fs, fontWeight: '600',
                    flex: 1.2, textAlign: 'right' },

    sinDatos: { color: colors.textMuted, fontSize: 13 * fs, textAlign: 'center', paddingVertical: 24 },
  });
}
