/**
 * themes.ts — Sistema de color de GymPro ("datos primero").
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ CÓMO FUNCIONA                                                            │
 * │ Ningún componente escribe colores a mano. Todos leen useColors(), que    │
 * │ devuelve una de las paletas de este archivo según el tema activo. Por    │
 * │ eso, cambiar un valor aquí repinta TODA la aplicación.                   │
 * │                                                                          │
 * │ PARA AGREGAR UNA PALETA NUEVA                                            │
 * │ 1. Copia darkPalette (o lightPalette) y cambia solo los HEX.             │
 * │ 2. Respeta el SIGNIFICADO de cada token (ver tabla abajo), no su color.  │
 * │ 3. Regístrala en hooks/useColors.ts.                                     │
 * │ No hace falta tocar ninguna pantalla.                                    │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * REGLA DEL SISTEMA: cada color dice UNA sola cosa en toda la app.
 *
 *   dataProgreso   → lo que mejora            rachas, metas, ingresos al alza
 *   dataActividad  → volumen y frecuencia     visitas, asistencias, horarios
 *   dataIa         → generado por los modelos predicciones, grupos, riesgo IA
 *   dataAtencion   → requiere acción pronto   por vencer, stock bajo
 *   dataRiesgo     → problema presente        vencido, abandono, sin stock
 *
 * Si un dato no encaja en ninguna categoría, va en `text` (neutro). Nunca se
 * elige un color por estética: se elige por lo que significa.
 */

/**
 * Contrato de una paleta. Toda paleta nueva debe definir estos campos.
 * El comentario de cada uno indica DÓNDE se usa, para saber qué se repinta.
 */
export interface Palette {
  // ── Superficies ─────────────────────────────────────────────────────────
  /** Fondo de pantalla completo. El nivel más profundo. */
  background: string;
  /** Tarjetas y contenedores de contenido (Card, tarjetas de plan, filas). */
  card: string;
  /** Variante de tarjeta para zonas anidadas o listas alternas. */
  cardAlt: string;
  /** Bloques dentro de una tarjeta: chips, celdas de métrica, barras de fondo. */
  surface: string;
  /** Fondo de campos de formulario (inputs, selects, buscadores). */
  inputBg: string;
  /** Velo detrás de modales y hojas inferiores. */
  overlay: string;
  /** Degradado superior de las cabeceras tipo héroe (login, dashboard). */
  heroTop: string;

  // ── Acento (acción) ─────────────────────────────────────────────────────
  /** Color de marca. Botones principales, selección activa, foco. */
  accent: string;
  /** Variante clara del acento: hover, iconos sobre fondo oscuro. */
  accentLight: string;
  /**
   * Fondo tenue del acento. Es el relleno de todo lo que está SELECCIONADO
   * sin ser un botón: pestaña activa, chip elegido, caja de icono, fila
   * resaltada. Sustituye a los antiguos `rgba(108,99,255,0.1)` sueltos.
   */
  accentBg: string;
  /** Variante oscura del acento: estado presionado, fondo de chips de marca. */
  accentDark: string;
  /**
   * Texto e iconos que van ENCIMA del acento (dentro de un botón primario).
   * No es siempre blanco: en la paleta oscura el acento es muy luminoso y el
   * texto debe ser oscuro para leerse. Toda paleta nueva debe elegirlo según
   * el contraste real de su propio acento.
   */
  onAccent: string;

  // ── Texto ───────────────────────────────────────────────────────────────
  /** Títulos y cifras principales. Máximo contraste. */
  text: string;
  /** Etiquetas, descripciones y apoyo. */
  textSecondary: string;
  /** Metadatos, unidades, marcas de tiempo, placeholders. */
  textMuted: string;

  // ── Bordes ──────────────────────────────────────────────────────────────
  /** Separador por defecto entre elementos y borde de tarjetas. */
  border: string;
  /** Borde con énfasis: elemento seleccionado, divisiones fuertes. */
  borderLight: string;
  /** Color de la sombra de tarjetas elevadas y hojas inferiores. */
  shadow: string;

  // ── Estados semánticos ──────────────────────────────────────────────────
  /** Operación correcta: pago aceptado, guardado, membresía vigente. */
  success: string;
  /** Fondo tenue para insignias y avisos de éxito. */
  successBg: string;
  /** Advertencia: por vencer, stock bajo, sin verificar. */
  warning: string;
  /** Fondo tenue para insignias y avisos de advertencia. */
  warningBg: string;
  /** Error: pago rechazado, membresía vencida, fallo de conexión. */
  error: string;
  /** Fondo tenue para insignias y avisos de error. */
  errorBg: string;
  /** Información neutra: notas, ayudas, datos de contexto. */
  info: string;
  /** Fondo tenue para insignias informativas. */
  infoBg: string;
  /** Reservado para funciones de inteligencia artificial. */
  purple: string;
  /** Fondo tenue para insignias de inteligencia artificial. */
  purpleBg: string;

  // ── Datos (el corazón del sistema) ──────────────────────────────────────
  /** Progreso: rachas, metas cumplidas, ahorro, ingresos al alza. */
  dataProgreso: string;
  /** Fondo tenue de progreso: chips y barras de fondo. */
  dataProgresoBg: string;
  /** Actividad: visitas, asistencias, volumen, horarios concurridos. */
  dataActividad: string;
  /** Fondo tenue de actividad. */
  dataActividadBg: string;
  /** Inteligencia: todo lo que calculan los modelos (predicción, grupos). */
  dataIa: string;
  /** Fondo tenue de inteligencia: chip "IA", tarjetas de predicción. */
  dataIaBg: string;
  /** Atención: vence pronto, stock bajo, pago pendiente. */
  dataAtencion: string;
  /** Fondo tenue de atención. */
  dataAtencionBg: string;
  /** Riesgo: abandono probable, vencido, agotado. */
  dataRiesgo: string;
  /** Fondo tenue de riesgo. */
  dataRiesgoBg: string;

  // ── Comercial ───────────────────────────────────────────────────────────
  /**
   * Destacado comercial: cinta de promoción, halo de plan en oferta, plan
   * recomendado. Es distinto de `dataAtencion` aunque hoy compartan matiz:
   * una promoción es una oportunidad, no una advertencia, y una paleta
   * futura puede querer separarlos.
   */
  promo: string;
  /** Fondo tenue comercial: insignias de descuento y ahorro. */
  promoBg: string;

  /**
   * Serie de gráficas. Se usa por POSICIÓN, no por color: la primera barra o
   * línea toma [0], la segunda [1], y así. Sirve para conjuntos donde las
   * categorías no tienen significado propio (grupos de K-Means, tipos de
   * ejercicio, distribución por día). Cuando el dato SÍ significa algo,
   * se usa su token data* y no esta serie.
   */
  chartSeries: string[];

  // ── Sistema operativo ───────────────────────────────────────────────────
  /** Color de los iconos de la barra de estado del teléfono. */
  statusBar: 'light' | 'dark';

  // ── Degradados ──────────────────────────────────────────────────────────
  /** Degradado de marca: cabeceras destacadas y botones especiales. */
  gradientAccent: [string, string];
  /** Degradado sutil para tarjetas destacadas. */
  gradientCard: [string, string];
  /** Degradado de fondo para pantallas tipo portada. */
  gradientDark: [string, string];
}

/* ══════════════════════════════════════════════════════════════════════════
   PALETA OSCURA — la principal del producto
   Fondos profundos azul-carbón. Los datos brillan; el resto se aparta.
   ══════════════════════════════════════════════════════════════════════════ */
export const darkPalette: Palette = {
  background:    '#0B0E11',
  card:          '#161C22',
  cardAlt:       '#101418',
  surface:       '#1E262E',
  inputBg:       '#161C22',
  overlay:       'rgba(0,0,0,0.66)',
  heroTop:       '#0B0E11',

  accent:        '#00E5A0',
  accentLight:   '#4DFFC3',
  accentBg:      'rgba(0,229,160,0.12)',
  accentDark:    '#04231A',
  onAccent:      '#04231A',   // acento luminoso -> texto oscuro encima

  text:          '#FFFFFF',
  textSecondary: '#A8B3BF',
  textMuted:     '#5C6672',

  border:        '#1E262E',
  borderLight:   '#2A343E',
  shadow:        '#000000',

  success:       '#00E5A0',
  successBg:     'rgba(0,229,160,0.12)',
  warning:       '#FFB020',
  warningBg:     'rgba(255,176,32,0.12)',
  error:         '#FF5C5C',
  errorBg:       'rgba(255,92,92,0.12)',
  info:          '#00B4FF',
  infoBg:        'rgba(0,180,255,0.12)',
  purple:        '#A78BFA',
  purpleBg:      'rgba(167,139,250,0.14)',

  dataProgreso:    '#00E5A0',
  dataProgresoBg:  'rgba(0,229,160,0.12)',
  dataActividad:   '#00B4FF',
  dataActividadBg: 'rgba(0,180,255,0.12)',
  dataIa:          '#A78BFA',
  dataIaBg:        'rgba(167,139,250,0.14)',
  dataAtencion:    '#FFB020',
  dataAtencionBg:  'rgba(255,176,32,0.12)',
  dataRiesgo:      '#FF5C5C',
  dataRiesgoBg:    'rgba(255,92,92,0.12)',

  promo:           '#FFB020',
  promoBg:         'rgba(255,176,32,0.14)',

  chartSeries: ['#00E5A0', '#00B4FF', '#A78BFA', '#FFB020', '#FF5C5C', '#22D3EE'],

  statusBar:      'light',
  gradientAccent: ['#00E5A0', '#00B4FF'],
  gradientCard:   ['#161C22', '#101418'],
  gradientDark:   ['#0B0E11', '#161C22'],
};

/* ══════════════════════════════════════════════════════════════════════════
   PALETA CLARA
   No es la oscura invertida: los acentos se oscurecen 2-3 pasos para que
   contrasten sobre blanco, y las tarjetas bajan (blancas sobre lienzo gris).
   ══════════════════════════════════════════════════════════════════════════ */
export const lightPalette: Palette = {
  background:    '#F2F5F7',
  card:          '#FFFFFF',
  cardAlt:       '#EAEFF3',
  surface:       '#EAEFF3',
  inputBg:       '#EAEFF3',
  overlay:       'rgba(15,23,32,0.38)',
  heroTop:       '#E4EAEF',

  accent:        '#00875A',
  accentLight:   '#00A870',
  accentBg:      'rgba(0,135,90,0.10)',
  accentDark:    '#00603F',
  onAccent:      '#FFFFFF',   // acento oscuro -> texto blanco encima

  text:          '#0F1720',
  textSecondary: '#5A6673',
  textMuted:     '#8B96A3',

  border:        '#E1E6EA',
  borderLight:   '#CFD8DF',
  shadow:        '#0F1720',

  success:       '#00875A',
  successBg:     'rgba(0,135,90,0.10)',
  warning:       '#9A6100',
  warningBg:     'rgba(154,97,0,0.10)',
  error:         '#C62B2B',
  errorBg:       'rgba(198,43,43,0.10)',
  info:          '#0069A8',
  infoBg:        'rgba(0,105,168,0.10)',
  purple:        '#6D3FD1',
  purpleBg:      'rgba(109,63,209,0.10)',

  dataProgreso:    '#00875A',
  dataProgresoBg:  'rgba(0,135,90,0.10)',
  dataActividad:   '#0069A8',
  dataActividadBg: 'rgba(0,105,168,0.10)',
  dataIa:          '#6D3FD1',
  dataIaBg:        'rgba(109,63,209,0.10)',
  dataAtencion:    '#9A6100',
  dataAtencionBg:  'rgba(154,97,0,0.10)',
  dataRiesgo:      '#C62B2B',
  dataRiesgoBg:    'rgba(198,43,43,0.10)',

  promo:           '#B87400',
  promoBg:         'rgba(184,116,0,0.12)',

  chartSeries: ['#00875A', '#0069A8', '#6D3FD1', '#9A6100', '#C62B2B', '#0E7490'],

  statusBar:      'dark',
  gradientAccent: ['#00875A', '#0069A8'],
  gradientCard:   ['#FFFFFF', '#EAEFF3'],
  gradientDark:   ['#F2F5F7', '#E4EAEF'],
};

/* ══════════════════════════════════════════════════════════════════════════
   ALTO CONTRASTE — accesibilidad
   Solo se sobrescriben superficies, texto y bordes. Los colores de dato se
   heredan intactos para no romper el significado del sistema.
   ══════════════════════════════════════════════════════════════════════════ */
export const darkHighContrast: Palette = {
  ...darkPalette,
  background:    '#000000',
  card:          '#0D0D0D',
  cardAlt:       '#080808',
  surface:       '#1A1A1A',
  inputBg:       '#1A1A1A',
  text:          '#FFFFFF',
  textSecondary: '#E0E0E0',
  textMuted:     '#AAAAAA',
  border:        '#555555',
  borderLight:   '#777777',
  accent:        '#4DFFC3',
  accentLight:   '#8CFFDB',
  heroTop:       '#000000',
};

export const lightHighContrast: Palette = {
  ...lightPalette,
  background:    '#FFFFFF',
  card:          '#F4F6F8',
  cardAlt:       '#E8ECEF',
  surface:       '#DDE3E8',
  inputBg:       '#DDE3E8',
  text:          '#000000',
  textSecondary: '#1A1A1A',
  textMuted:     '#444444',
  border:        '#8A949C',
  borderLight:   '#6B757D',
  accent:        '#00603F',
  accentLight:   '#00875A',
  heroTop:       '#EDF1F4',
};

export type ThemeMode = 'dark' | 'light' | 'system';
export type FontScale = 1 | 1.15 | 1.3;

/* ══════════════════════════════════════════════════════════════════════════
   TONOS DE DATO
   Un componente no elige un color: declara QUÉ significa el número que
   muestra y el sistema le da el par (color, fondo) de la paleta activa.

     <KPICard tono="progreso" ... />   ->  verde en oscuro, verde profundo en claro

   Así, cuando se añade una paleta, ningún componente cambia.
   ══════════════════════════════════════════════════════════════════════════ */
export type TonoDato =
  | 'progreso'    // mejora: rachas, metas, ingresos al alza
  | 'actividad'   // volumen: visitas, asistencias, horarios
  | 'ia'          // calculado por los modelos: predicción, grupo, score
  | 'atencion'    // requiere acción pronto: por vencer, stock bajo
  | 'riesgo'      // problema presente: vencido, abandono, agotado
  | 'neutro';     // sin carga semántica: totales, conteos simples

/**
 * Convierte un token de la paleta en `rgba(...)` con la opacidad indicada.
 *
 * Lo necesitan las gráficas (react-native-chart-kit), cuya API pide una función
 * `color: (opacidad) => string`. Así las gráficas también leen de la paleta en
 * lugar de llevar su propio color escrito a mano:
 *
 *   color: (o = 1) => conAlfa(colors.dataActividad, o)
 *
 * Acepta '#RGB', '#RRGGBB' y devuelve rgba() sin tocar si ya lo era.
 */
export function conAlfa(color: string, alfa = 1): string {
  if (!color.startsWith('#')) return color;
  let hex = color.slice(1);
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex.slice(0, 6), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

/** Devuelve el par (color, fondo) que corresponde a un tono en la paleta dada. */
export function tonoDato(
  colors: Palette,
  tono: TonoDato = 'neutro',
): { color: string; bg: string } {
  switch (tono) {
    case 'progreso':  return { color: colors.dataProgreso,  bg: colors.dataProgresoBg  };
    case 'actividad': return { color: colors.dataActividad, bg: colors.dataActividadBg };
    case 'ia':        return { color: colors.dataIa,        bg: colors.dataIaBg        };
    case 'atencion':  return { color: colors.dataAtencion,  bg: colors.dataAtencionBg  };
    case 'riesgo':    return { color: colors.dataRiesgo,    bg: colors.dataRiesgoBg    };
    default:          return { color: colors.text,          bg: colors.surface         };
  }
}
