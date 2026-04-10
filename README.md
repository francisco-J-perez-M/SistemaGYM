# Sistema de Gestión de Gimnasio

Este proyecto es una solución integral para la administración de gimnasios, que abarca desde el control de socios y pagos hasta analíticas avanzadas de Big Data y Machine Learning. Es una aplicación **Full Stack** moderna construida con tecnologías de vanguardia para ofrecer una experiencia premium a administradores, entrenadores y miembros.

### Vistas Previas del Sistema

| Inicio de Sesión | Panel Administrativo | Analíticas de Big Data |
| :---: | :---: | :---: |
| ![Login](screenshots/login_preview.png) | ![Dashboard](screenshots/dashboard_preview.png) | ![Analytics](screenshots/analytics_preview.png) |

---

## Arquitectura del Proyecto

El sistema está diseñado bajo una arquitectura de micro-servicios y procesamiento distribuido:

1.  **Backend (API):** Servidor RESTful robusto para la lógica de negocio.
2.  **Capa de Big Data:** Motor de procesamiento distribuido para analíticas complejas y predicciones.
3.  **Frontend (UI):** Interfaz SPA (Single Page Application) altamente interactiva.
4.  **Persistencia Políglota:**
    *   **MySQL:** Almacenamiento relacional para transacciones, usuarios y gestión operativa.
    *   **MongoDB:** Almacenamiento NoSQL para grandes volúmenes de datos y resultados de analíticas.

---

## Technical Stack

### Backend: Gym Management API & Analytics
Ubicado en la carpeta `gym_api/`.
*   **Lenguaje:** Python 3.10+
*   **Framework Web:** Flask 3.1+
*   **Analítica de Datos:** **Apache Spark (PySpark)** para procesamiento distribuido.
*   **Bases de Datos:** MySQL (SQLAlchemy ORM) y MongoDB (PyMongo).
*   **Seguridad:** JSON Web Tokens (JWT) con rotación de claves y autorización por roles.
*   **Notificaciones:** Flask-Mail para alertas SMTP y reportes automatizados.

### Frontend: Interfaz de Usuario Premium
Ubicado en la carpeta `frontend/`.
*   **Framework:** **React 19** sustentado por **Vite**.
*   **Navegación:** React Router 7.
*   **UX/UI:** Framer Motion (animaciones), SweetAlert2 y CSS Vanilla (Design System Unificado).
*   **Visualización de Datos:** Recharts / Chart.js para visualización de métricas y Big Data.

---

## Módulos y Características

### 1. Big Data & Machine Learning (Spark Integration)
El sistema utiliza Apache Spark para procesar datos masivos almacenados en MongoDB:
*   **Segmentación KMeans:** Agrupación inteligente de miembros basada en comportamiento y objetivos.
*   **Estadísticas MapReduce:** Procesamiento de grandes volúmenes de asistencias y pagos para generar KPIS.
*   **Regresión Lineal:** Predicción del progreso físico y tendencias de salud de los miembros.
*   **Predicción de Peso:** Algoritmo dedicado para estimar la evolución corporal basada en el historial del usuario.

### 2. Gestión Administrativa
*   **Control de Miembros:** CRUD completo, gestión de estados (activo/inactivo) y carga de fotos.
*   **Punto de Venta (POS):** Transacciones rápidas, venta de membresías y registro de métodos de pago.
*   **Backups Maestros:** Sistema experto para copias de seguridad (Full, Incremental, Diferencial) con restauración automatizada.

### 3. Módulo de Entrenadores (Staff)
*   **Gestión de Clientes:** Seguimiento personalizado de alumnos asignados.
*   **Generador de Reportes:** Creación de informes de rendimiento y cumplimiento de objetivos.
*   **Agenda Digital:** Control de sesiones de entrenamiento y calendarios de clases.

### 4. Experiencia del Miembro (User Experience)
*   **Creador de Rutinas:** Herramienta interactiva para diseñar planes de entrenamiento personalizados.
*   **Monitoreo de Salud:** Seguimiento dinámico de IMC, grasa corporal y métricas antropométricas.
*   **Nutrición y Dieta:** Acceso a planes de alimentación sugeridos y recetario saludable.
*   **Historial de Pagos:** Consulta transparente de membresías y renovaciones.

---

## Base de Datos y Persistencia

*   **Esquema Relacional:** El archivo `db2.sql` contiene la estructura para MySQL (Usuarios, Roles, Membresías, Pagos).
*   **Esquema NoSQL:** MongoDB almacena los datasets para los procesos de Spark y los resultados de las analíticas.
*   **Datos de Prueba:** Utiliza los scripts en `gym_api/app` para la población inicial del sistema.

---

## Instalación y Configuración

### Requisitos Previos
*   Python 3.10+
*   Node.js 18+
*   MySQL 8.0+
*   MongoDB Atlas (o instancia local)
*   Apache Spark (opcional para ejecución local de analíticas)

### Configuración del Backend
1. Navegar a `gym_api/`.
2. Crear y activar entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   .\venv\Scripts\activate   # Windows
   ```
3. Instalar dependencias: `pip install -r requirements.txt`.
4. Configurar el archivo `.env`:
   ```env
   MYSQL_URL=mysql+pymysql://user:pass@localhost/gym_db
   MONGO_USER=...
   MONGO_PASSWORD=...
   MONGO_CLUSTER=...
   MONGO_DB=GYMDB
   JWT_SECRET_KEY=su_clave_secreta
   ```
5. Ejecutar servidor: `python run.py`.

### Configuración del Frontend
1. Navegar a `frontend/`.
2. Instalar dependencias: `npm install`.
3. Iniciar desarrollo: `npm run dev`.

---

## Referencia de API Principal

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| POST | `/api/auth/login` | Autenticación y generación de JWT |
| GET | `/api/spark/kmeans` | Ejecuta segmentación de usuarios con Spark |
| GET | `/api/spark/regression` | Obtiene predicciones de salud/peso |
| GET | `/api/miembros` | Listado paginado de socios |
| POST | `/api/user/routine` | Crea una rutina personalizada |
| POST | `/api/backups/trigger` | Ejecuta tarea de backup de base de datos |

---

## Licencia
Proyecto desarrollado con fines académicos y profesionales. Adaptable para implementaciones de alta escalabilidad.

