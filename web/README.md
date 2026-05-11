# GymPro Web

Frontend de GymPro: SPA construida con React 19 + Vite. Se conecta a la API REST y soporta multi-tenant via subdomain.

→ [Documentación completa del proyecto](../doc/README.md)

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x+ |
| npm | 9.x+ |

---

## Setup de desarrollo

```bash
cd web/

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu API local

# Iniciar servidor de desarrollo (hot-reload)
npm run dev
# → http://localhost:3000
```

### Variables de entorno

```env
# URL base de la API
VITE_API_URL=http://localhost:5000/api

# Entorno (development | production)
VITE_ENV=development
```

> **Importante**: este proyecto usa Vite, no Create React App. Las variables de entorno deben usar el prefijo `VITE_` (no `REACT_APP_`).

---

## Comandos disponibles

```bash
npm run dev        # Servidor de desarrollo con HMR en puerto 3000
npm run build      # Build de producción en dist/
npm run preview    # Preview del build de producción localmente
npm run lint       # Análisis estático con ESLint
```

---

## Levantar con Docker Compose

Desde la raíz del proyecto:

```bash
docker compose up -d web
# → http://localhost:3000
```

---

## Estructura de carpetas

```
web/src/
├── api/              # Clientes HTTP (axios) por módulo
├── components/       # Componentes reutilizables (Layout, Cards, etc.)
├── hooks/            # Custom hooks (ThemeContext, useTheme, etc.)
├── pages/            # Páginas por rol: admin, trainer, user
├── services/         # Servicios de negocio (trainerService, etc.)
└── App.jsx           # Router principal
```

---

## Stack

| Librería | Versión | Uso |
|---|---|---|
| React | ^19.2 | Framework UI |
| React Router | ^7.12 | Navegación SPA |
| Axios | ^1.13 | HTTP client |
| Framer Motion | ^12.29 | Animaciones |
| Recharts / Chart.js | — | Visualización de datos |
