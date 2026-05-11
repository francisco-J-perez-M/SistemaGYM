# GymPro Mobile

App móvil de GymPro para miembros y entrenadores. Actualmente en desarrollo; se integrará con la API multi-tenant en Sprint 4.

→ [Documentación completa del proyecto](../doc/README.md)

---

> ⚠️ **Estado**: en desarrollo. La integración con la API multi-tenant está planificada para **Sprint 4 (Junio 2026)**, una vez que el API y el frontend estén estables.

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 18.x+ |
| npm | 9.x+ |
| Expo CLI | latest |
| Android Studio / Xcode | Para emuladores nativos |

---

## Setup

```bash
cd mobile/

# Instalar dependencias
npm install

# Iniciar con Expo
npx expo start

# Opciones de ejecución:
#   → Presionar 'a' para Android emulator
#   → Presionar 'i' para iOS simulator
#   → Escanear QR con la app Expo Go en tu teléfono
```

---

## Pendiente (Sprint 4)

- [ ] Adaptar autenticación a JWT multi-tenant (claims `id_gimnasio`)
- [ ] Implementar detección de tenant por deep link / configuración
- [ ] Centralizar cliente HTTP con interceptor de tenant header
- [ ] Actualizar screens para consumir la nueva API multi-tenant

---

## Estructura

```
mobile/
├── app/              # Rutas y navegación (Expo Router)
├── screens/          # Pantallas: Login, Dashboard, Trainer, User
├── components/       # Componentes reutilizables
├── api/              # Clientes HTTP
├── navigation/       # AppNavigator
└── constants/        # Theme, colores
```
