# GymPro Web

Frontend de GymPro: aplicación de una sola página (SPA) construida con React y Vite.
Se conecta a la API REST y ofrece vistas diferenciadas por rol. En Docker se compila a
estáticos y se sirve con nginx, que además hace de proxy inverso hacia la API.

Documentación completa del proyecto: [../doc/README.md](../doc/README.md)

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x o superior |
| npm | 9.x o superior |

Para el flujo con contenedores basta con Docker; Node sólo es necesario para el
desarrollo local con recarga en caliente.

---

## Desarrollo local

```bash
cd web/

# Instalar dependencias
npm install

# Variables de entorno (opcional en desarrollo)
cp .env.example .env.local
#   Editar .env.local con la URL de tu API

# Servidor de desarrollo con recarga en caliente
npm run dev
```

### Variables de entorno

```env
# URL base de la API (Vite usa el prefijo VITE_)
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

Importante: este proyecto usa Vite, no Create React App. Las variables de entorno deben
usar el prefijo `VITE_`.

---

## Comandos disponibles

```bash
npm run dev        # Servidor de desarrollo con recarga en caliente
npm run build      # Build de producción en dist/
npm run preview    # Previsualiza el build de producción localmente
npm run lint       # Análisis estático con ESLint
```

---

## Con Docker Compose

Desde la raíz del proyecto, el frontend se construye y sirve con nginx en el puerto 8080:

```bash
docker compose up --build -d web
# Portal disponible en http://localhost:8080
```

En este modo, nginx sirve el bundle estático y proxea las llamadas a `/api/` hacia el
contenedor de la API (`api:5000`), por lo que el frontend no necesita conocer la URL
absoluta de la API.

---

## Estructura de carpetas

```
web/src/
├── api/              # Clientes HTTP (fetch/axios) por módulo: auth, owner_gym, ...
├── components/       # Componentes reutilizables: auth, compartido (Layout, Sidebar), ...
├── hooks/            # Hooks propios (ThemeContext, useTheme, useMetricsHistory, ...)
├── pages/            # Páginas por rol:
│   ├── publico/          # Login, registro, registro de gimnasio, olvidé contraseña
│   ├── miembro/          # Dashboard, entrenamiento, Mi Rutina, salud, nutrición, pagos
│   ├── entrenador/       # Clientes, rutinas, dietas, agenda, reportes, analítica
│   ├── owner_gym/        # Dashboard, miembros, membresías, pagos, POS, staff, suscripción
│   ├── admin/            # Analítica y tableros administrativos
│   ├── recepcionista/    # Check-in, miembros, citas, pagos
│   └── superadmin/       # Gimnasios, planes, suscripciones, usuarios, respaldos
├── css/              # Estilos
└── App.jsx           # Enrutador principal (React Router)
```

---

## Stack

| Librería | Uso |
|---|---|
| React | Framework de interfaz |
| Vite | Bundler y servidor de desarrollo |
| React Router | Navegación de la SPA |
| Axios / fetch | Cliente HTTP hacia la API |
| Recharts / Chart.js | Visualización de datos y analítica |
| Framer Motion | Animaciones |

---

## Autenticación y roles

El login guarda el token JWT y redirige a la vista del rol correspondiente. Las
llamadas a la API incluyen el token y, cuando aplica, el identificador de gimnasio para
el aislamiento multi-tenant. Existe recuperación de contraseña por correo (código de 6
dígitos) accesible desde el enlace "¿Olvidaste tu contraseña?" en el login.
