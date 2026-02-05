# Sistema de Gestión de Gimnasio

Este proyecto es una solución integral para la administración de gimnasios, que abarca desde el control de socios y pagos hasta un robusto sistema de copias de seguridad. Es una aplicación **Full Stack** moderna construida con tecnologías de vanguardia.

### Vistas Previas del Sistema

| Inicio de Sesión | Panel Administrativo |
| :---: | :---: |
| ![Login](screenshots/login_preview.png) | ![Dashboard](screenshots/dashboard_preview.png) |

---

## Arquitectura del Proyecto

El sistema está dividido en tres capas principales:

1.  **Backend (API):** Servidor RESTful encargado de la lógica de negocio y persistencia.
2.  **Frontend (UI):** Interfaz de usuario interactiva y responsiva.
3.  **Base de Datos:** Estructura relacional para el almacenamiento seguro de la información.

---

## Backend: Gym Management API

Ubicado en la carpeta `gym_api/`, es el núcleo del sistema.

### Stack Tecnológico
*   **Lenguaje:** Python 3.10+
*   **Framework:** Flask
*   **ORM:** SQLAlchemy (para manejo de base de datos)
*   **Seguridad:** JSON Web Tokens (JWT) para autenticación y autorización por roles.

### Módulos Principales
*   **Autenticación (`/api/auth`):** Inicio de sesión y registro seguro.
*   **Miembros (`/api/miembros`):** Gestión completa de socios, incluyendo seguimiento de peso, estatura y estado físico.
*   **Pagos (`/api/pagos`):** Registro de ingresos, métodos de pago y consulta de historial.
*   **Dashboards de Usuario:** Endpoints específicos para estadísticas, rutinas y progreso físico.
*   **Sistema de Backups (`/api/backups`):** Sistema experto para la creación de copias de seguridad (Full, Incremental, Diferencial) con monitoreo de progreso y notificaciones SMTP.

---

## Frontend: Interfaz de Usuario

Ubicado en la carpeta `frontend/`, ofrece una experiencia de usuario fluida y moderna.

### Stack Tecnológico
*   **Framework:** React 19 (Vite)
*   **Navegación:** React Router 7
*   **Animaciones:** Framer Motion para transiciones suaves y efectos visuales premium.
*   **Estilos:** CSS Vanilla con sistema de diseño unificado (`CSSUnificado.css`).
*   **Gestión de Estado:** React Context para temas y autenticación.
*   **Feedback Visual:** SweetAlert2 para alertas interactivas.

### Características y Roles
*   **Dashboard Administrativo:** Gestión total de miembros, pagos, planes y sistema de respaldos.
*   **Dashboard de Entrenador:** Seguimiento de clientes asignados, agenda diaria y métricas de rendimiento.
*   **Dashboard de Recepcionista:** Optimizado para el registro rápido de asistencia y punto de venta.
*   **Panel de Miembro (Usuario):**
    *   **Mi Progreso:** Visualización gráfica de evolución de peso y métricas corporales.
    *   **Creador de Rutinas:** Herramienta interactiva para diseñar y personalizar planes de entrenamiento.
    *   **Planes de Alimentación:** Acceso a dietas sugeridas y recetas saludables.
    *   **Estado de Salud:** Monitoreo de IMC y condiciones físicas.
*   **Punto de Venta (POS):** Sistema integrado para transacciones rápidas y venta de membresías.
*   **Registro Público:** Página dedicada para que nuevos socios se unan al gimnasio.

---

## Base de Datos

El sistema utiliza un esquema relacional optimizado.
*   **Esquema:** El archivo `db.sql` contiene la estructura de tablas para usuarios, miembros, pagos, planes, roles, asistencias, rutinas y progreso físico.
*   **Población de datos:** Dispones de `poblar_gym.py` para generar datos de prueba automáticamente y facilitar el desarrollo.

---

## Referencia Completa de la API

Todos los endpoints (excepto `/health`, `/api/auth/login` y `/api/auth/register`) requieren el encabezado:
`Authorization: Bearer <access_token>`

### 1. Autenticación (`/api/auth`)

#### Iniciar Sesión
*   **Endpoint:** `POST /api/auth/login`
*   **Request:** `{"email": "admin@gym.com", "password": "..."}`
*   **Response (200 OK):** `{"access_token": "...", "user": {"id": 1, "nombre": "...", "role": "admin", ...}}`

#### Registro de Miembro
*   **Endpoint:** `POST /api/auth/register`
*   **Request:** `{"nombre": "...", "email": "...", "password": "...", "telefono": "...", "sexo": "M/F"}`
*   **Response (201 Created):** `{"msg": "Usuario registrado exitosamente"}`

### 2. Gestión de Miembros (`/api/miembros`)

#### Listar Miembros
*   **Endpoint:** `GET /api/miembros`
*   **Query Params:** `page`, `search`, `inactivos` (bool)
*   **Response:** `{"miembros": [...], "total": 50, "pages": 5, "current_page": 1}`

#### Crear Miembro
*   **Endpoint:** `POST /api/miembros` (FormData)
*   **Campos:** `nombre`, `email`, `password`, `telefono`, `sexo`, `peso_inicial`, `estatura`, `foto` (file)
*   **Response:** Objeto del miembro creado con su ID y datos.

#### Actualizar Miembro
*   **Endpoint:** `PUT /api/miembros/<id>` (FormData)
*   **Campos:** Cualquiera de los de creación para actualizar.

#### Eliminar Miembro (Lógico)
*   **Endpoint:** `DELETE /api/miembros/<id>`
*   **Response:** `{"message": "Miembro desactivado correctamente"}`

#### Reactivar Miembro
*   **Endpoint:** `PUT /api/miembros/<id>/reactivar`
*   **Response:** `{"message": "Miembro reactivado correctamente"}`

### 3. Gestión de Pagos (`/api/pagos`)

#### Registrar Pago
*   **Endpoint:** `POST /api/pagos`
*   **Request:** `{"id_miembro": 1, "id_membresia": 2, "metodo_pago": "Tarjeta", "numero_tarjeta": "4532..."}`
*   **Response:** Datos del pago registrado.

#### Listar Pagos
*   **Endpoint:** `GET /api/pagos`
*   **Query Params:** `page`
*   **Response:** `{"pagos": [...], "total": 100}`

### 4. Dashboards de Usuario (`/api/user`)

#### Resumen de Dashboard
*   **Endpoint:** `GET /api/user/dashboard`
*   **Response:** Datos del usuario, estadísticas de workout, rutina de hoy, progreso semanal y estado de membresía.

#### Registrar Asistencia (Check-in)
*   **Endpoint:** `POST /api/user/checkin`
*   **Response:** `{"message": "Asistencia registrada exitosamente", "fecha": "2024-02-05"}`

#### Progreso Corporal (Métricas)
*   **Endpoint:** `GET /api/user/body-progress`
*   **Response:** `{"bodyMetrics": {"peso": {...}, "grasaCorporal": {...}, "imc": 24.5}, "progressHistory": [...]}`
*   **Endpoint:** `POST /api/user/body-progress`
*   **Request:** `{"peso": 75.5, "cintura": 85, "cadera": 95}`

#### Gestión de Rutinas
*   **Listar Rutinas:** `GET /api/user/routines`
*   **Obtener Detalle:** `GET /api/user/routines/<id>`
*   **Crear Rutina:** `POST /api/user/routines` (Estructura compleja de días y ejercicios)
*   **Actualizar Rutina:** `PUT /api/user/routines/<id>`
*   **Duplicar Rutina:** `POST /api/user/routines/<id>/duplicate`

#### Salud y Condiciones
*   **Endpoint:** `GET /api/user/health`
*   **Response:** Lista de condiciones físicas calculadas (estatura, IMC, perímetros).

#### Membresía y Renovación
*   **Estado Actual:** `GET /api/user/membership`
*   **Planes Disponibles:** `GET /api/user/membership/plans`
*   **Renovar:** `POST /api/user/membership/renew` (`{"id_membresia": 1, "metodo_pago": "Tarjeta"}`)

### 5. Sistema de Backups (`/api/backups`)

#### Resumen y Estado
*   **Endpoint:** `GET /api/backups/dashboard-summary`
*   **Status Actual:** `GET /api/backups/status`
*   **Historial:** `GET /api/backups/history`

#### Ejecución de Tareas
*   **Trigger Backup:** `POST /api/backups/trigger` (`{"type": "full/incremental/differential"}`)
*   **Descargar:** `GET /api/backups/download/<filename>`
*   **Restaurar:** `POST /api/backups/restore` (`{"filename": "..."}`)

---

## Instalación y Configuración

### Requisitos Previos
*   Python 3.10+
*   Node.js & npm (v18+)
*   Servidor MySQL / MariaDB

### Configuración del Backend
1. Ir a la carpeta `gym_api`.
2. Crear un entorno virtual: `python -m venv venv`.
3. Activar el entorno: `.\venv\Scripts\activate` (Windows).
4. Instalar dependencias: `pip install -r requirements.txt`.
5. Configurar el archivo `.env` con tus credenciales de base de datos y SMTP.
6. Ejecutar: `python run.py`.

### Configuración del Frontend
1. Ir a la carpeta `frontend`.
2. Instalar dependencias: `npm install`.
3. Iniciar el servidor de desarrollo: `npm run dev` (o `npm start`).

---

## Herramientas de Desarrollo
*   **Diagrama Relacional:** Consulta `Diagrama Relacional.png` para entender los vínculos entre tablas.
*   **Diagrama Entidad-Relación:** Localizado en `Diagrama entidad relacion.png`.

---

## Licencia
Proyecto de uso académico / interno. Adaptable para entornos de producción bajo configuración adecuada.

