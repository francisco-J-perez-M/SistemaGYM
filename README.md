# GymPro — Plataforma SaaS de Gestión de Gimnasios

GymPro es una plataforma **SaaS multi-tenant** para la administración integral de gimnasios y centros deportivos. Cualquier propietario de gimnasio puede registrarse y operar su negocio con datos completamente aislados de otros tenants. Incluye analíticas avanzadas con Apache Spark, app móvil y soporte para dispositivos wearable.

> **Rama `saas`**: implementación de la migración a arquitectura multi-tenant. Ver [`doc/GymPro_SaaS_Propuesta.docx`](doc/GymPro_SaaS_Propuesta.docx) y [`doc/GymPro_Sprints_Gantt.docx`](doc/GymPro_Sprints_Gantt.docx) para el plan de migración completo.

---

## Estructura del Proyecto

```
SistemaGYM/
├── api/          # Backend Flask (API REST + Apache Spark)
├── web/          # Frontend React + Vite (SPA)
├── mobile/       # App móvil React Native / Flutter
├── doc/          # Documentación técnica, diagramas y propuestas
│   ├── Auditoria_Tecnica_GymPro.docx
│   ├── GymPro_SaaS_Propuesta.docx
│   ├── GymPro_Sprints_Gantt.docx
│   ├── Diagrama Relacional.png
│   ├── Diagrama entidad relacion.png
│   ├── db2.sql        # Schema relacional original (referencia)
│   └── screenshots/   # Capturas del sistema
└── README.md
```

---

## Arquitectura

GymPro opera bajo un modelo **SaaS multi-tenant compartido** (shared database + `id_gimnasio` field):

- **Subdomain routing**: `gymname.gymsaas.com` → Nginx extrae el slug y lo pasa como header `X-Tenant-Slug`
- **Tenant middleware**: Flask resuelve `X-Tenant-Slug → id_gimnasio` en cada request (Redis cache)
- **JWT multi-tenant**: el token incluye `id_gimnasio` y `slug_gimnasio` como claims
- **Aislamiento**: todos los queries de MongoDB filtran por `id_gimnasio` del token

```
Cliente (navegador/móvil)
    ↓  gymname.gymsaas.com
Nginx  →  X-Tenant-Slug: gymname
    ↓
Flask API  →  Tenant Middleware  →  Redis cache
    ↓
MongoDB Atlas  (filtro id_gimnasio en cada query)
```

---

## Tech Stack

### `api/` — Backend

| Componente | Tecnología |
|---|---|
| Lenguaje | Python 3.10+ |
| Framework | Flask 3.1+ con Blueprints |
| Base de datos principal | MongoDB Atlas (PyMongo) |
| Cache / Rate limiting | Redis |
| Analítica Big Data | Apache Spark (PySpark) — K-Means, Regresión Lineal, MapReduce |
| Autenticación | JWT (flask-jwt-extended) con claims multi-tenant |
| Servidor producción | Gunicorn (multi-worker) |
| Contenedor | Docker multi-stage |

### `web/` — Frontend

| Componente | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router 7 con PrivateRoute (multi-tenant) |
| HTTP client | Axios (instancia centralizada con interceptors) |
| Animaciones | Framer Motion |
| Gráficos | Recharts / Chart.js |

### `mobile/` — App Móvil

| Componente | Tecnología |
|---|---|
| Framework | React Native / Flutter *(en desarrollo)* |
| Autenticación | JWT multi-tenant |

---

## Módulos SaaS

| Módulo | Tier requerido | Descripción |
|---|---|---|
| Core (Miembros, Auth, Dashboard) | Todos | Siempre activo |
| Pagos y Membresías | Starter+ | Punto de venta, historial |
| Entrenadores | Starter+ | Staff, rutinas, sesiones |
| Big Data / Analytics | Professional+ | Spark, K-Means, regresión |
| Backups | Professional+ | Full, incremental, diferencial |
| App Móvil | Professional+ | Miembros vía mobile |
| Wearable | Enterprise | Métricas en tiempo real |
| API pública | Enterprise | Integración de terceros |

---

## Instalación (Desarrollo con Docker)

```bash
# Requisitos: Docker + Docker Compose

# 1. Clonar y entrar al proyecto
git clone <repo> && cd SistemaGYM

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales MongoDB Atlas, Redis, JWT secret, etc.

# 3. Levantar todos los servicios
docker-compose up -d

# Servicios disponibles:
#   API:     http://localhost:5000
#   Web:     http://localhost:3000
#   MongoDB: localhost:27017 (dev local)
#   Redis:   localhost:6379
```

### Configuración manual (sin Docker)

**API:**
```bash
cd api/
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # completar variables
python run.py
```

**Web:**
```bash
cd web/
npm install
npm run dev
```

---

## Variables de Entorno

Ver `.env.example` en la raíz del proyecto. Variables principales:

```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/gymdb

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=cambiar_en_produccion

# API
FLASK_ENV=development
FLASK_DEBUG=0

# CORS (producción)
ALLOWED_ORIGINS=https://*.gymsaas.com

# Email (backups / notificaciones)
MAIL_SERVER=smtp.gmail.com
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

---

## API — Endpoints principales

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login, retorna JWT con claims del tenant |
| POST | `/api/auth/register` | — | Registro de nuevo usuario |
| GET | `/api/miembros` | JWT | Listado paginado (filtrado por tenant) |
| GET | `/api/spark/kmeans` | JWT + módulo Analytics | Segmentación con Spark |
| GET | `/api/spark/regression` | JWT + módulo Analytics | Predicciones de salud |
| POST | `/api/backups/trigger` | JWT + Admin | Ejecutar backup |
| GET | `/api/gimnasios/me` | JWT | Info del tenant actual |

> Todos los endpoints filtran automáticamente por `id_gimnasio` del JWT. No existe forma de acceder a datos de otro tenant.

---

## Documentación

La carpeta `doc/` contiene:

| Archivo | Descripción |
|---|---|
| `Auditoria_Tecnica_GymPro.docx` | Auditoría técnica completa: 36 hallazgos de seguridad, arquitectura y rendimiento |
| `GymPro_SaaS_Propuesta.docx` | Propuesta de transformación a SaaS multi-tenant: módulos, planes, arquitectura |
| `GymPro_Sprints_Gantt.docx` | Gantt + definición d