# GymPro — Plataforma SaaS de Gestión de Gimnasios

GymPro es una plataforma **SaaS multi-tenant** para la administración integral de gimnasios y centros deportivos. Cualquier propietario de gimnasio puede registrarse y operar su negocio con datos completamente aislados de otros tenants.

> **Rama `saas`**: migración activa a arquitectura multi-tenant. Sprint 1: May 11–15 · Sprint 2: May 18–22.

---

## Navegación rápida

| Módulo | README | Descripción |
|---|---|---|
| 🔧 **API** (Flask) | [api/README.md](api/README.md) | Setup Docker, instalación, endpoints, comandos |
| 🌐 **Web** (React) | [web/README.md](web/README.md) | Setup frontend, variables de entorno, comandos |
| 📱 **Mobile** | [mobile/README.md](mobile/README.md) | App móvil (Sprint 4) |
| 📚 **Documentación** | [doc/README.md](doc/README.md) | Propuestas, auditoría, diagramas, respaldos |

---

## Inicio rápido

```bash
# Clonar y entrar al proyecto
git clone <repo-url> && cd SistemaGYM
git checkout saas

# Copiar variables de entorno y completarlas
cp api/.env.example api/.env

# Levantar todos los servicios con Docker
docker compose up --build -d

# Verificar que la API responde
curl http://localhost:5000/api/health
```

> ¿No tienes Docker instalado en WSL? Ver [api/README.md → Instalación de Docker](api/README.md#instalación-de-docker-en-wsl-2-ubuntu).

---

## Estructura del proyecto

```
SistemaGYM/
├── api/          # Backend Flask + PySpark (API REST)
├── web/          # Frontend React 19 + Vite (SPA)
├── mobile/       # App móvil (Expo / React Native)
├── doc/          # Documentación técnica
│   ├── propuestas/     # SaaS proposal, Gantt, Sprint planning
│   ├── auditoria/      # Auditoría técnica (36 hallazgos)
│   ├── diagramas/      # Diagramas ER, relacional, screenshots
│   └── respaldos/      # db2.sql (schema MySQL original)
└── README.md
```

---

## Arquitectura SaaS Multi-tenant

```
Cliente (gymname.gymsaas.com)
        ↓
    Nginx  ──→  Header: X-Tenant-Slug: gymname
        ↓
    Flask API  ──→  Tenant Middleware  ──→  Redis cache
        ↓
    MongoDB Atlas  (todos los queries filtran por id_gimnasio)
```

- **Subdomain routing**: cada gimnasio accede por `sugimnasio.gymsaas.com`
- **JWT multi-tenant**: el token lleva `id_gimnasio` + `slug_gimnasio`
- **Aislamiento total**: imposible acceder a datos de otro tenant
- **Módulos configurables**: cada plan activa un subconjunto de funcionalidades

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| API | Python 3.12 · Flask 3.1 · Gunicorn · PyMongo · PySpark 3.5 |
| Frontend | React 19 · Vite · React Router 7 · Axios · Framer Motion |
| Base de datos | MongoDB Atlas (principal) · Redis (cache/rate-limit) |
| Infraestructura | Docker multi-stage · Docker Compose · Nginx · AWS EC2 |
| Mobile | React Native / Expo *(Sprint 4)* |
| Wearable | BLE + WebSockets *(Sprint 5)* |

---

## Documentación técnica

| Documento | Ubicación |
|---|---|
| Índice de documentación | [doc/README.md](doc/README.md) |
| Propuesta SaaS multi-tenant | [doc/propuestas/GymPro_SaaS_Propuesta.docx](doc/propuestas/GymPro_SaaS_Propuesta.docx) |
| Plan de Sprints + Gantt | [doc/propuestas/GymPro_Sprints_Gantt.docx](doc/propuestas/GymPro_Sprints_Gantt.docx) |
| Auditoría técnica | [doc/auditoria/Auditoria_Tecnica_GymPro.docx](doc/auditoria/Auditoria_Tecnica_GymPro.docx) |
| Diagrama relacional | [doc/diagramas/](doc/diagramas/) |
| Schema MySQL (referencia) | [doc/respaldos/db2.sql](doc/respaldos/db2.sql) |

---

## Roadmap

| Sprint | Período | Objetivo |
|---|---|---|
| ✅ Sprint 0 | May 10 | Reestructura del proyecto, documentación |
| 🔄 Sprint 1 | May 11–15 | Docker + correcciones críticas de seguridad |
| ⏳ Sprint 2 | May 18–22 | Multi-tenant core + deploy EC2 |
| ⏳ Sprint 3 | Jun semana 1 | SaaS billing (Stripe) + onboarding |
| ⏳ Sprint 4 | Jun semana 2-3 | App móvil multi-tenant |
| ⏳ Sprint 5 | Jul 2026 | Integración wearable |

---

## Licencia

Proyecto desarrollado con fines académicos y profesionales.
