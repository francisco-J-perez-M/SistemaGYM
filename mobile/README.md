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
npx expo start
#   Escanea el QR con Expo Go, o abre en un emulador Android.
```

En Windows también existe el script `start-mobile.ps1` en la raíz del proyecto como
atajo para iniciar el entorno móvil.

### Resolución de la URL de la API

La app detecta automáticamente la URL de la API en desarrollo a partir del host del
bundler de Expo. Para fijarla de forma explícita (emuladores o producción) se usa la
variable de entorno:

```
EXPO_PUBLIC_API_BASE_URL=http://<host>:5000/api
```

Referencias por defecto: emulador Android usa `10.0.2.2:5000`; en un dispositivo físico
se usa la IP de la máquina que corre la API.

---

## Compilación (Android)

```bash
# Build de producción (App Bundle para Google Play)
npx eas build -p android --profile production

# Build de desarrollo (habilita notificaciones push reales, que no funcionan en Expo Go)
npx eas build -p android --profile development
```

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
