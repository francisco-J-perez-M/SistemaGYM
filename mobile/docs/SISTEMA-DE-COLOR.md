# Sistema de color de la aplicación móvil

Guía de referencia del tema de GymPro Mobile. Explica qué significa cada color,
en qué parte de la interfaz aparece y cómo añadir una paleta nueva sin tocar
ninguna pantalla.

- **Archivo único de definición:** `mobile/constants/themes.ts`
- **Punto de lectura:** `mobile/hooks/useColors.ts` (`useColors()`)
- **Regla:** ninguna pantalla escribe un color a mano.

> `constants/Colors.ts` fue eliminado. Era una segunda paleta fija, anterior a
> los temas, que ya no se usaba en ninguna pantalla y contradecía la regla de
> una sola fuente de color. Si aparece en una rama antigua, hay que retirarla.

---

## 1. Cómo funciona

Cada pantalla llama a `useColors()`, que devuelve la paleta activa según el tema
elegido por el usuario (oscuro, claro o el del sistema, más la variante de alto
contraste). Los estilos se construyen dentro de una función `make_styles(colors)`
memorizada, de modo que al cambiar de tema la pantalla se repinta sola.

```tsx
export default function Pantalla() {
  const colors = useColors();
  const fs     = useFontScale();
  const styles = useMemo(() => make_styles(colors, fs), [colors, fs]);
  return <View style={styles.pantalla} />;
}

function make_styles(colors: ReturnType<typeof useColors>, fs = 1) {
  return StyleSheet.create({
    pantalla: { backgroundColor: colors.background },
  });
}
```

Consecuencia práctica: **cambiar un valor en `themes.ts` repinta toda la
aplicación**. No hay colores duplicados en las pantallas.

---

## 2. Principio de diseño

> Cada color dice una sola cosa en toda la aplicación.

El producto es un sistema de datos: asistencia, progreso, predicciones,
vencimientos. Si el color se usa como decoración, el usuario deja de poder
interpretarlo. Por eso el color se elige por **significado**, nunca por estética,
y la interfaz es deliberadamente neutra: fondos apagados, tarjetas sobrias y
color reservado para las cifras.

Cinco categorías de dato cubren toda la aplicación:

| Categoría | Significa | Ejemplos reales |
|---|---|---|
| `dataProgreso` | Algo que mejora | Racha de días, meta cumplida, ingresos al alza, ahorro de un plan |
| `dataActividad` | Volumen y frecuencia | Visitas, asistencias, entrenamientos, horarios concurridos |
| `dataIa` | Calculado por los modelos | Predicción de abandono, grupo de K-Means, recomendación |
| `dataAtencion` | Requiere acción pronto | Membresía por vencer, stock bajo, pago pendiente |
| `dataRiesgo` | Problema presente | Membresía vencida, abandono probable, producto agotado |

Si un dato no encaja en ninguna, va en `text` (neutro). El violeta (`dataIa`)
está reservado a lo que genera el sistema: es lo que distingue a GymPro de una
aplicación de gimnasio corriente, así que no se usa para nada más.

---

## 3. Catálogo de tokens

### Superficies — de más profundo a más cercano

| Token | Dónde aparece |
|---|---|
| `background` | Fondo de la pantalla completa. El nivel más profundo. |
| `card` | Tarjetas y contenedores de contenido: `<Card>`, tarjetas de plan, filas de lista. |
| `cardAlt` | Variante de tarjeta: cabecera de tarjeta, zonas anidadas, listas alternas. |
| `surface` | Bloques dentro de una tarjeta: chips, celdas de métrica, barras de fondo, cajas de icono neutras. |
| `inputBg` | Fondo de campos de formulario: inputs, selects, buscadores. |
| `overlay` | Velo detrás de modales y hojas inferiores. |
| `heroTop` | Degradado superior de cabeceras tipo héroe (login, panel de inicio). |

### Acento — acción

| Token | Dónde aparece |
|---|---|
| `accent` | Color de marca. Botón principal, elemento seleccionado, foco, precio destacado. |
| `accentLight` | Variante clara: iconos sobre fondo oscuro, estados de realce. |
| `accentBg` | Relleno tenue de lo que está **seleccionado sin ser botón**: pestaña activa, chip elegido, caja de icono, fila resaltada. |
| `accentDark` | Variante oscura: estado presionado, chip de marca. |
| `onAccent` | Texto e iconos **encima** del acento. No es siempre blanco: en la paleta oscura el acento es luminoso y el texto debe ser oscuro. |

`onAccent` es el token que evita el error más común al añadir una paleta. Si el
acento nuevo es claro, `onAccent` debe ser oscuro, y al revés.

### Texto

| Token | Dónde aparece |
|---|---|
| `text` | Títulos y cifras principales. Máximo contraste. |
| `textSecondary` | Etiquetas, descripciones, texto de apoyo. |
| `textMuted` | Metadatos, unidades, marcas de tiempo, placeholders, estados vacíos. |

### Bordes y sombra

| Token | Dónde aparece |
|---|---|
| `border` | Separador por defecto y borde de tarjetas. |
| `borderLight` | Borde con énfasis: elemento seleccionado, divisiones fuertes. |
| `shadow` | Color de sombra de tarjetas elevadas y hojas inferiores. |

### Estados semánticos

| Token | Dónde aparece |
|---|---|
| `success` / `successBg` | Operación correcta: pago aceptado, guardado, membresía vigente. |
| `warning` / `warningBg` | Advertencia: por vencer, stock bajo, sin verificar. |
| `error` / `errorBg` | Error: pago rechazado, membresía vencida, fallo de conexión. |
| `info` / `infoBg` | Información neutra: notas, ayudas, datos de contexto. |
| `purple` / `purpleBg` | Funciones de inteligencia artificial en elementos de interfaz. |

### Datos

`dataProgreso`, `dataActividad`, `dataIa`, `dataAtencion`, `dataRiesgo` y su
variante `…Bg` (fondo tenue para chips, insignias y barras). Ver la tabla de
significados del apartado 2.

Estos no se escriben directamente cuando se trata de un indicador: se declara el
tono y el sistema resuelve el par de colores.

```tsx
import { tonoDato } from '../constants/themes';

const t = tonoDato(colors, 'riesgo');   // { color, bg } de la paleta activa
<View style={{ backgroundColor: t.bg }}>
  <Text style={{ color: t.color }}>{valor}</Text>
</View>
```

En componentes que ya lo soportan basta una propiedad:

```tsx
<KPICard label="Entrenamientos" value={42} tono="actividad" icon={...} />
```

### Comercial

| Token | Dónde aparece |
|---|---|
| `promo` | Cinta de promoción, halo del plan en oferta, estrella de valoración, plan recomendado. |
| `promoBg` | Insignias de descuento y de ahorro. |

Se mantiene separado de `dataAtencion` aunque hoy compartan matiz: una promoción
es una oportunidad, no una advertencia, y una paleta futura puede querer
distinguirlas.

### Series de gráficas

`chartSeries` es un arreglo que se usa **por posición**, no por color: la primera
categoría toma `[0]`, la segunda `[1]`, y así sucesivamente. Sirve para
conjuntos cuyas categorías no tienen significado propio.

```tsx
// Grupos de K-Means, grupos musculares, distribución por día
backgroundColor: colors.chartSeries[i % colors.chartSeries.length]
```

Cuando el dato **sí** significa algo, se usa su token `data*` y no la serie.

### Sistema operativo y degradados

| Token | Dónde aparece |
|---|---|
| `statusBar` | Color de los iconos de la barra de estado del teléfono (`'light'` o `'dark'`). |
| `gradientAccent` | Degradado de marca: cabeceras destacadas y botones especiales. |
| `gradientCard` | Degradado sutil de tarjetas destacadas. |
| `gradientDark` | Degradado de fondo en pantallas tipo portada. |

---

## 4. Mapa de pantallas

Qué token pinta cada zona de la aplicación:

| Zona | Tokens implicados |
|---|---|
| Fondo de cualquier pantalla | `background` |
| Cajón de navegación | `card` (fondo), `accent` (avatar), `onAccent` (iniciales), `accentBg` (elemento activo), `border` |
| Barra inferior de pestañas | `card`, `accent` (activa), `textMuted` (inactiva) |
| Tarjeta genérica (`<Card>`) | `card`, `border`, `shadow` si es elevada |
| Botón principal (`<Button variant="primary">`) | `accent` + `onAccent` |
| Botón secundario | `surface`, `border`, `text` |
| Botón de peligro | `error` + blanco |
| Campos de formulario | `inputBg`, `border`, `text`, `textMuted` (placeholder) |
| Chips y pestañas seleccionables | `accentBg` + `accent` cuando están activos; `surface` + `textSecondary` cuando no |
| Indicadores (`<KPICard>`) | `card`, `border`, tono del dato en icono y cifra |
| Tarjeta de membresía | `card`, `dataProgreso` o `dataAtencion` según los días restantes |
| Tarjetas de plan y promociones | `card`, `accent` (precio), `promo` (cinta y halo), `dataProgreso` (beneficios y ahorro) |
| Burbujas de chat propias | `accent` de fondo, `onAccent` para el texto, la hora y la marca de leído (con opacidad) |
| Burbujas de chat ajenas | `card`, `border`, `text` |
| Gráficas y agrupamientos | `chartSeries` |
| Analíticas de predicción | `dataIa` para todo lo que sale de un modelo |
| Modales y hojas inferiores | `overlay` (velo), `background` (hoja), `border` (asa) |
| Botones de PayPal y Mercado Pago | Colores de marca fijos — ver apartado 6 |

---

## 5. Añadir una paleta nueva

1. Copiar `darkPalette` (o `lightPalette`) en `themes.ts` y cambiar solo los HEX.
2. Respetar el **significado** de cada token, no su color actual. Por ejemplo,
   `dataRiesgo` puede dejar de ser rojo, pero debe seguir siendo el color con el
   que la aplicación avisa de un problema presente.
3. Comprobar dos cosas que suelen fallar:
   - `onAccent` debe contrastar contra el `accent` nuevo.
   - Los cinco colores de dato deben distinguirse entre sí a simple vista, y
     también para daltonismo rojo-verde (no confiar solo en el matiz: la app usa
     además iconos y texto).
4. Registrarla en `hooks/useColors.ts`, junto a las existentes.
5. No hace falta tocar ninguna pantalla.

La variante de alto contraste no se escribe entera: parte de la paleta base y
sobrescribe únicamente superficies, texto y bordes, heredando los colores de dato
para no romper su significado.

```ts
export const miPaletaAltoContraste: Palette = {
  ...miPaleta,
  background: '#000000',
  text:       '#FFFFFF',
  border:     '#555555',
};
```

---

## 6. Excepciones deliberadas

Tres lugares no usan la paleta, a propósito:

1. **`components/BotonesPago.tsx`** — el amarillo de PayPal (`#FFC439`) y el
   celeste de Mercado Pago (`#00B1EA`) los exigen sus guías de marca para que el
   usuario reconozca el botón. No deben migrarse a tokens.
2. **`app/_layout.tsx`, pantalla de error de arranque** — se dibuja cuando la
   aplicación falló al iniciar y los hooks de tema pueden no estar disponibles.
   Lee `darkPalette` directamente, que sigue siendo la misma fuente de color.
3. **`ExerciseDetailSheet`, lienzo del reproductor** — negro fijo porque es el
   fondo de un vídeo, no una superficie de la interfaz.

Cualquier otro color escrito a mano en el código es un error a corregir. Se
detectan con:

```bash
cd mobile
grep -rnE "'#[0-9a-fA-F]{3,8}'" app components
```

---

## 7. Reglas al escribir pantallas nuevas

- Construir los estilos en `make_styles(colors, fs)` y memorizarlos con
  `useMemo`. Nunca declarar un `StyleSheet.create` de nivel de módulo con colores.
- Multiplicar todos los tamaños de fuente por `fs` (`useFontScale()`), que es la
  preferencia de accesibilidad del usuario.
- Para jerarquía dentro de un mismo color, usar `opacity`, no un HEX más claro.
- Antes de introducir un token nuevo, comprobar que ninguno existente ya expresa
  ese significado. El valor del sistema está en que los colores sean pocos.
