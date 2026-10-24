# GymPro Móvil

Aplicación móvil de GymPro para Android, construida con React Native y Expo
(enrutamiento con expo-router). Consume la misma API REST que el portal web y ofrece la
experiencia orientada al uso diario de miembros, entrenadores, recepción y propietarios.

Documentación completa del proyecto: [../doc/README.md](../doc/README.md)

---

## Requisitos

| Herramienta | Notas |
|---|---|
| Node.js | Versión LTS |
| Expo CLI / EAS CLI | `npx expo` y `npx eas` (no requieren instalación global) |
| Dispositivo o emulador Android | Expo Go para desarrollo; development build para push |

La API debe estar levantada (ver [../api/README.md](../api/README.md)) y accesible desde
el dispositivo en la misma red.

---

## Ejecución en desarrollo

```bash
cd mobile/
npm install

# Iniciar el bundler de Expo
npm start          # equivale a: expo start --host lan
```

El teléfono y la computadora deben estar en la **misma red WiFi**, y los contenedores
del backend levantados (`docker compose up -d`), porque la app consume la API en el
puerto 8080 de esa máquina.

### Development build (recomendado)

El proyecto usa **development build** en lugar de Expo Go. La razón: Expo Go solo
soporta la última versión del SDK y trae un conjunto fijo de módulos nativos, por lo
que rompe cada vez que Expo publica un SDK nuevo o cuando el proyecto agrega una
librería nativa propia (por ejemplo `expo-web-browser`, que usa el checkout de pagos).

Se genera **una sola vez** y luego se reutiliza:

```bash
# 1. Generar el APK de desarrollo (tarda unos minutos, corre en la nube de Expo)
npx eas build -p android --profile development

# 2. Instalar el APK en el teléfono (link o QR que entrega EAS al terminar)

# 3. A partir de aquí, el día a día es solo esto:
npm start
#   Se abre la app instalada y se conecta al bundler. Fast Refresh incluido.
```

Solo hay que volver a generar el build cuando se agregan o actualizan **dependencias
nativas**; los cambios de JavaScript se aplican al instante con Fast Refresh.

> Si se prefiere Expo Go, debe instalarse la versión correspondiente al SDK del
> proyecto desde https://expo.dev/go (la de Google Play siempre es la más reciente y
> suele ser incompatible).

### Resolución de la URL de la API

La app detecta automáticamente la URL de la API en desarrollo a partir del host del
bundler de Expo. Para fijarla de forma explícita (emuladores o producción) se usa la
variable de entorno:

```
EXPO_PUBLIC_API_BASE_URL=http://<host>:8080/api
```

Referencias por defecto: emulador Android usa `10.0.2.2:8080`; en un dispositivo físico
se usa la IP de la máquina que corre la API.

**Importante para los builds de release** (`preview` y `production`): en esos perfiles
`__DEV__` es `false`, por lo que la detección automática NO aplica y la app usaría
`localhost` — que dentro del teléfono apunta al propio teléfono. La URL debe fijarse en
el bloque `env` del perfil correspondiente en `eas.json`. En el perfil `preview` hay un
valor de ejemplo (`192.168.1.100`) que debe reemplazarse por la IP real de la máquina
(`ipconfig` → IPv4 del adaptador WiFi).

El perfil `development` no necesita esa variable: se conecta al bundler y resuelve la
IP automáticamente.

---

## Compilación (Android)

```bash
# Development build — para desarrollar (se instala una vez y se reutiliza)
npx eas build -p android --profile development

# APK instalable para probar la app compilada (requiere EXPO_PUBLIC_API_BASE_URL)
npx eas build -p android --profile preview

# Build de producción (App Bundle para Google Play)
npx eas build -p android --profile production
```

La primera vez EAS pedirá iniciar sesión (`npx eas login`) y generará automáticamente
la keystore de firma de Android.

> El proyecto no incluye `expo-updates`, por lo que **no hay actualizaciones por aire
> (OTA)**: cualquier cambio en un APK ya instalado (`preview` / `production`) exige
> generar e instalar un build nuevo. Esto no aplica al development build, donde el
> código se sirve desde el bundler.

---

## Estructura del proyecto

```
mobile/
├── app/                       # Rutas (expo-router), agrupadas por rol
│   ├── (auth)/                # login, forgot-password
│   ├── (member)/              # inicio, entrenamiento, mi-rutina, registrar entreno,
│   │                          #   nutrición, membresía, pagos, salud, predicción, chat
│   ├── (trainer)/             # dashboard, clientes, rutinas, dietas, agenda,
│   │                          #   solicitudes PT, reportes, chat
│   ├── (admin)/               # dashboard, miembros, membresías, pagos, POS, staff
│   ├── (receptionist)/        # check-ins, miembros
│   └── notifications.tsx      # Centro de notificaciones
├── components/                # UI reutilizable (ui, member, admin, navigation, ...)
├── constants/                 # Api.ts (endpoints y resolución de URL), Colors, themes
├── hooks/                     # useAuth, useColors, useFetch, ...
├── services/                  # api (axios), auth, push, reminders, download
├── store/                     # Estado global (auth, accesibilidad)
├── types/                     # Tipos TypeScript
└── utils/                     # Utilidades (formato, etc.)
```

---

## Características

- Navegación por menú lateral (drawer) por rol, con cabecera de usuario, notificaciones
  y ajustes de accesibilidad.
- Miembro: inicio con racha y KPIs, rutina de hoy, "Mi Rutina" (crear/editar rutinas
  propias con grupos musculares y unidades kg/lb), registro de entrenamiento, nutrición,
  membresía y pagos, salud y progreso, y predicción de peso con gráfica.
- Entrenador: clientes, rutinas y dietas, agenda, solicitudes de entrenamiento personal,
  reportes de desempeño (con opción de compartir) y mensajería.
- Autenticación con JWT y recuperación de contraseña por correo (código de 6 dígitos).
- Notificaciones: push remoto (registro de token en el backend) y recordatorios locales
  proactivos (racha de entrenamiento diaria y vencimiento de membresía).

---

## Stack

| Área | Tecnologías |
|---|---|
| Base | React Native, Expo, expo-router, TypeScript |
| Red | Axios (cliente con JWT y cabecera X-Gym-ID) |
| Gráficas | react-native-chart-kit, react-native-svg |
| Notificaciones | expo-notifications, expo-device |
| Almacenamiento seguro | expo-secure-store |

---

## Notas

- Las notificaciones push remotas y algunas capacidades nativas requieren un development
  build o un build de producción; en Expo Go se degradan de forma controlada.
- La app está pensada como cliente de uso diario. Las tareas administrativas pesadas
  (respaldos, analítica avanzada, gestión de plataforma) se realizan desde el portal web.
