/**
 * SelectorFecha — campo de fecha con calendario desplegable.
 *
 * Por qué un calendario propio y no @react-native-community/datetimepicker:
 * ese paquete trae código nativo, así que añadirlo obliga a regenerar el
 * development build en cada equipo del proyecto. Este está escrito en JS puro,
 * funciona con el build actual y, sobre todo, se pinta con la paleta activa
 * (useColors), cosa que el selector del sistema no permite.
 *
 * SECCIONES QUE PINTA
 *   campo cerrado ........ colors.inputBg + colors.border
 *   velo del modal ....... colors.overlay
 *   hoja del calendario .. colors.card
 *   cabecera del mes ..... colors.text / colors.textSecondary
 *   día seleccionado ..... colors.accent + colors.onAccent
 *   día de hoy ........... borde colors.accent
 *   días fuera de rango .. colors.textMuted
 *
 * El valor se maneja siempre como 'dd/mm/aaaa', que es el formato que la API
 * de perfiles espera y devuelve.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useFontScale } from '../../hooks/useColors';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  /** Fecha en formato dd/mm/aaaa. Cadena vacía si no hay valor. */
  value: string;
  onChange: (valor: string) => void;
  label?: string;
  placeholder?: string;
  /** Año más antiguo seleccionable. Por defecto, hace 100 años. */
  anioMinimo?: number;
  /** Año más reciente seleccionable. Por defecto, el actual. */
  anioMaximo?: number;
  accessibilityLabel?: string;
}

// ── Utilidades de fecha ──────────────────────────────────────────────────────

/** 'dd/mm/aaaa' -> Date. Devuelve null si el texto no es una fecha válida. */
function parsear(txt: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((txt || '').trim());
  if (!m) return null;
  const [, d, mes, a] = m;
  const fecha = new Date(Number(a), Number(mes) - 1, Number(d));
  // Rechaza fechas imposibles como 31/02/2024, que Date corregiría en silencio
  if (fecha.getDate() !== Number(d) || fecha.getMonth() !== Number(mes) - 1) return null;
  return fecha;
}

/** Date -> 'dd/mm/aaaa' */
function formatear(f: Date): string {
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${f.getFullYear()}`;
}

const mismoDia = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

/**
 * Celdas del mes: huecos iniciales para alinear con el día de la semana
 * (la semana empieza en lunes) y luego los días.
 */
function celdasDelMes(anio: number, mes: number): (number | null)[] {
  const primero    = new Date(anio, mes, 1);
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const offset     = (primero.getDay() + 6) % 7;   // domingo=0 -> lunes=0
  return [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => i + 1),
  ];
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function SelectorFecha({
  value, onChange, label, placeholder = 'dd/mm/aaaa',
  anioMinimo, anioMaximo, accessibilityLabel,
}: Props) {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);

  const hoy        = useMemo(() => new Date(), []);
  const anioTope   = anioMaximo ?? hoy.getFullYear();
  const anioPiso   = anioMinimo ?? anioTope - 100;
  const seleccion  = parsear(value);

  const [abierto,  setAbierto]  = useState(false);
  const [verAnios, setVerAnios] = useState(false);
  // Mes que se está mostrando; arranca en la fecha guardada o hace 25 años
  const [cursor, setCursor] = useState<Date>(
    seleccion ?? new Date(anioTope - 25, 0, 1),
  );

  const abrir = () => {
    setCursor(parsear(value) ?? new Date(anioTope - 25, 0, 1));
    setVerAnios(false);
    setAbierto(true);
  };

  const elegirDia = (dia: number) => {
    const elegida = new Date(cursor.getFullYear(), cursor.getMonth(), dia);
    onChange(formatear(elegida));
    setAbierto(false);
  };

  const moverMes = (delta: number) => {
    const nuevo = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    if (nuevo.getFullYear() < anioPiso || nuevo.getFullYear() > anioTope) return;
    setCursor(nuevo);
  };

  const fueraDeRango = (dia: number) => {
    const f = new Date(cursor.getFullYear(), cursor.getMonth(), dia);
    return f > new Date(anioTope, 11, 31) || f < new Date(anioPiso, 0, 1);
  };

  const celdas = celdasDelMes(cursor.getFullYear(), cursor.getMonth());
  const anios  = Array.from({ length: anioTope - anioPiso + 1 }, (_, i) => anioTope - i);

  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Campo cerrado */}
      <TouchableOpacity
        style={styles.campo}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label ?? 'Seleccionar fecha'}
        accessibilityHint="Abre un calendario para elegir la fecha"
      >
        <Text style={[styles.campoTexto, !value && styles.campoPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.accent} />
      </TouchableOpacity>

      {/* Calendario */}
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <View style={styles.velo}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAbierto(false)}
            accessibilityLabel="Cerrar calendario"
            accessibilityRole="button"
          />

          <View style={styles.hoja}>
            {/* Cabecera: mes y navegación */}
            <View style={styles.cabecera}>
              <TouchableOpacity
                onPress={() => moverMes(-1)}
                style={styles.navBtn}
                accessibilityLabel="Mes anterior" accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setVerAnios((v) => !v)}
                style={styles.tituloMes}
                accessibilityLabel="Elegir año" accessibilityRole="button"
              >
                <Text style={styles.tituloMesText}>
                  {MESES[cursor.getMonth()]} {cursor.getFullYear()}
                </Text>
                <Ionicons name={verAnios ? 'chevron-up' : 'chevron-down'} size={15} color={colors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => moverMes(1)}
                style={styles.navBtn}
                accessibilityLabel="Mes siguiente" accessibilityRole="button"
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {verAnios ? (
              /* Rejilla de años: evita decenas de toques para una fecha de nacimiento */
              <ScrollView style={styles.aniosScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.aniosGrid}>
                  {anios.map((a) => {
                    const activo = a === cursor.getFullYear();
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[styles.anio, activo && styles.anioActivo]}
                        onPress={() => {
                          setCursor(new Date(a, cursor.getMonth(), 1));
                          setVerAnios(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Año ${a}`}
                        accessibilityState={{ selected: activo }}
                      >
                        <Text style={[styles.anioText, activo && styles.anioTextActivo]}>{a}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <>
                {/* Días de la semana */}
                <View style={styles.semana}>
                  {DIAS_SEMANA.map((d, i) => (
                    <Text key={i} style={styles.diaSemana}>{d}</Text>
                  ))}
                </View>

                {/* Rejilla del mes */}
                <View style={styles.mes}>
                  {celdas.map((dia, i) => {
                    if (dia === null) return <View key={`h${i}`} style={styles.celda} />;
                    const fecha      = new Date(cursor.getFullYear(), cursor.getMonth(), dia);
                    const esHoy      = mismoDia(fecha, hoy);
                    const elegido    = !!seleccion && mismoDia(fecha, seleccion);
                    const deshabilit = fueraDeRango(dia);
                    return (
                      <TouchableOpacity
                        key={dia}
                        style={[
                          styles.celda,
                          esHoy && !elegido && styles.celdaHoy,
                          elegido && styles.celdaElegida,
                        ]}
                        onPress={() => elegirDia(dia)}
                        disabled={deshabilit}
                        accessibilityRole="button"
                        accessibilityLabel={`${dia} de ${MESES[cursor.getMonth()]} de ${cursor.getFullYear()}`}
                        accessibilityState={{ selected: elegido, disabled: deshabilit }}
                      >
                        <Text style={[
                          styles.celdaText,
                          elegido && styles.celdaTextElegida,
                          deshabilit && styles.celdaTextDeshabilitada,
                        ]}>
                          {dia}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Pie */}
            <View style={styles.pie}>
              <TouchableOpacity
                onPress={() => { onChange(''); setAbierto(false); }}
                accessibilityRole="button" accessibilityLabel="Borrar fecha"
              >
                <Text style={styles.pieBorrar}>Borrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAbierto(false)}
                accessibilityRole="button" accessibilityLabel="Cerrar"
              >
                <Text style={styles.pieCerrar}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    label: { color: colors.textSecondary, fontSize: 12 * fs, fontWeight: '600', marginBottom: 6 },

    campo: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.inputBg, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    campoTexto:       { color: colors.text, fontSize: 14 * fs },
    campoPlaceholder: { color: colors.textMuted },

    velo: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
    hoja: {
      width: '100%', maxWidth: 360,
      backgroundColor: colors.card, borderRadius: 20, padding: 16,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }, elevation: 12,
    },

    cabecera:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                 backgroundColor: colors.surface },
    tituloMes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tituloMesText: { color: colors.text, fontSize: 15 * fs, fontWeight: '700' },

    semana:    { flexDirection: 'row', marginBottom: 4 },
    diaSemana: { flex: 1, textAlign: 'center', color: colors.textMuted,
                 fontSize: 11 * fs, fontWeight: '700' },

    mes:   { flexDirection: 'row', flexWrap: 'wrap' },
    celda: {
      width: `${100 / 7}%`, aspectRatio: 1,
      alignItems: 'center', justifyContent: 'center', borderRadius: 10,
    },
    celdaHoy:     { borderWidth: 1, borderColor: colors.accent },
    celdaElegida: { backgroundColor: colors.accent },
    celdaText:              { color: colors.text, fontSize: 14 * fs },
    celdaTextElegida:       { color: colors.onAccent, fontWeight: '800' },
    celdaTextDeshabilitada: { color: colors.textMuted },

    aniosScroll: { maxHeight: 260 },
    aniosGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
    anio: {
      width: '22%', paddingVertical: 10, borderRadius: 10,
      alignItems: 'center', backgroundColor: colors.surface,
    },
    anioActivo:     { backgroundColor: colors.accent },
    anioText:       { color: colors.text, fontSize: 13 * fs, fontWeight: '600' },
    anioTextActivo: { color: colors.onAccent, fontWeight: '800' },

    pie: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
    },
    pieBorrar: { color: colors.dataRiesgo, fontSize: 14 * fs, fontWeight: '600' },
    pieCerrar: { color: colors.accent,     fontSize: 14 * fs, fontWeight: '700' },
  });
}
