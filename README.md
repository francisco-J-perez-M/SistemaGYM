# GymPro — Sistema para Gimnasios (Plataforma SaaS multi-tenant)

GymPro es una plataforma de gestión integral para gimnasios y centros deportivos,
construida como un servicio SaaS multi-tenant. Cada gimnasio (tenant) opera con sus
datos aislados de los demás. El sistema se compone de tres clientes —un portal web,
una aplicación móvil y consumidores de API— sobre una API REST central, y se despliega
por completo con Docker Compose.

Rama de trabajo activa: `saas`.

---

## Navegación rápida

| Módulo | README | Descripción |
|---|---|---|
| API (Flask) | [api/README.md](api/README.md) | Backend, contenedores, variables de entorno, endpoints |
| Web (React) | [web/README.md](web/README.md) | Frontend, comandos, estructura, build |
| Móvil (Expo) | [mobile/README.md](mobile/README.md) | Aplicación móvil Android, ejecución y build |
| Documentación | [doc/README.md](doc/README.md) | Índice de documentación técnica del proyecto |

---

## Inicio rápido

Requisitos: Docker, Docker Compose y Git.

```bash
# 1. Clonar y situarse en la rama de trabajo
git clone <repo-url> && cd SistemaGYM
git checkout saas

# 2. Crear el archivo de entorno del backend y completarlo
cp api/.env.example api/.env
#    Editar api/.env (ver api/README.md -> Variables de entorno)

# 3. Construir y levantar todos los servicios
docker compose up --build -d

# 4. Verificar el estado
curl http://localhost:5000/api/health     # API
#    Portal web:  http://localhost:8080
```

El contenedor de la API ejecuta automáticamente las migraciones de PostgreSQL
(`flask db upgrade`, Alembic) antes de arrancar Gunicorn, por lo que no hay que
correr migraciones a mano.

---

## Contenedores (docker-compose.yml)

| Servicio | Imagen | Puerto (host:contenedor) | Función |
|---|---|---|---|
| postgres | postgres:16-alpine | 5433:5432 | Datos relacionales: usuarios, roles, gimnasios, planes y suscripciones |
| mongo | mongo:7 | 27035:27017 | Datos flexibles: miembros, rutinas, progreso, asistencias, pagos, notificaciones |
| redis | redis:7-alpine | interno | Caché y rate limiting (Flask-Limiter) |
| api | build ./api (Flask + Gunicorn) | 5000 | API REST; corre migraciones Alembic al arrancar |
| web | build ./web (React + nginx) | 8080:80 | Frontend; nginx sirve el bundle y proxea /api/ hacia api:5000 |
| ollama | ollama/ollama:latest | 11434:11434 | Motor de IA local para el ETL de rutinas (opcional) |

---

## Arquitectura

```
   Portal Web (React)      App Móvil (Expo)      Consumidores de API
           \                     |                      /
            \                    |                     /
                       API REST  —  Flask + Gunicorn
                                  |
        ┌──────────────┬──────────┴───────────┬───────────────┐
   PostgreSQL        MongoDB                 Redis           Ollama
  (relacional)     (documental)         (caché/limits)     (IA local)
```

- Multi-tenant: cada peticion se filtra por el gimnasio del token JWT y la cabecera
  `X-Gym-ID`, garantizando el aislamiento de datos entre gimnasios.
- Autenticacion: JWT (Flask-JWT-Extended); el token incluye el rol y el id de gimnasio.
- Autorizacion: control de acceso por rol (RBAC) en cada blueprint.
- Seguridad: TLS 1.3 en tránsito, contraseñas con hash, rate limiting en endpoints
  sensibles (login, registro, recuperación de contraseña).

Roles del sistema: Miembro, Entrenador, Recepcionista, Propietario del gimnasio
(owner_gym), Administrador y Superadministrador (plataforma).

---

## Funcionalidades principales

- Gestion del gimnasio (propietario/administrador): dashboard en tiempo real,
  miembros, planes de membresia, pagos, punto de venta (POS), personal, suscripcion
  del gimnasio al SaaS y respaldos.
- Miembro: rutina asignada y rutinas propias ("Mi Rutina") con grupos musculares y
  unidades kg/lb, registro de entrenamiento, nutricion y recetas, salud y progreso
  fisico, prediccion de peso, membresia y pagos, y eleccion/cambio/calificacion de
  entrenador con chat.
- Entrenador: clientes, rutinas y dietas, agenda y sesiones, solicitudes de
  entrenamiento personal, reportes de desempeño y mensajeria.
- Recepcion: check-ins de asistencia y consulta de miembros.
- Superadmin: gestion de gimnasios, planes, suscripciones y usuarios de la plataforma.
- Inteligencia artificial (scikit-learn en proceso): deteccion de riesgo de abandono,
  laboratorio de modelos (regresion, clasificacion y matriz de confusion), segmentacion
  de clientes (K-Means) y prediccion de peso corporal.
- Cuenta: recuperacion de contraseña por correo mediante un codigo de 6 digitos.

---

## Estructura del proyecto

```
SistemaGYM/
├── api/            Backend Flask (API REST) + IA (scikit-learn)
├── web/            Frontend React (Vite), servido por nginx
├── mobile/         Aplicacion movil Expo / React Native
├── doc/            Documentacion tecnica del proyecto
├── docs/           Notas de infraestructura y hosting
├── docker-compose.yml       / docker-compose.prod.yml
└── README.md
```

---

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Backend | Python, Flask, Gunicorn, SQLAlchemy, Alembic, PyMongo, Flask-JWT-Extended, Flask-Mail, Flask-Limiter |
| IA / analítica | scikit-learn (en proceso), Ollama (ETL de rutinas) |
| Web | React, Vite, React Router, Axios, Recharts / Chart.js |
| Móvil | React Native, Expo, expo-router, Axios, react-native-chart-kit, expo-notifications |
| Datos | PostgreSQL 16, MongoDB 7, Redis 7 |
| Infraestructura | Docker, Docker Compose, nginx |

---

## Despliegue

- Desarrollo: `docker compose up --build -d` (usa `docker-compose.yml`).
- Produccion: `docker compose -f docker-compose.prod.yml up --build -d api web`,
  sobre un servidor Linux (VPS) con credenciales productivas y HTTPS.
- Movil: build con EAS y publicacion en Google Play (ver mobile/README.md).

---

## Licencia

Proyecto desarrollado con fines académicos y profesionales en la Incubadora TIC de la
Universidad Tecnológica del Valle de Toluca.
