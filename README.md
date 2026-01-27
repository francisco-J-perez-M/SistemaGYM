# Gym Management API

Backend oficial para el **Sistema de Gestión de Gimnasio**, diseñado para administrar usuarios, miembros, pagos y respaldos de la base de datos de forma segura y escalable.

---

##  Descripción General

Esta API REST proporciona los servicios necesarios para la operación administrativa de un gimnasio, incluyendo:

* Autenticación y control de acceso mediante JWT
* Gestión de miembros
* Registro y consulta de pagos
* Sistema de copias de seguridad (backups) con monitoreo de estado

El backend está construido siguiendo buenas prácticas de diseño, seguridad y mantenibilidad.

---

##  Stack Tecnológico

* **Lenguaje:** Python 3.10+
* **Framework:** Flask 2.0+
* **Autenticación:** JSON Web Tokens (JWT)
* **ORM:** SQLAlchemy
* **Formato de intercambio:** JSON

---

##  Configuración General

* **Base URL:** `http://localhost:5000`
* **Autenticación:** JWT (Bearer Token)
* **Headers requeridos:**

```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

---

##  Autenticación

Todos los endpoints marcados como **protegidos** requieren un token JWT válido en el header `Authorization`.

### Iniciar Sesión

Genera un token de acceso para consumir la API.

* **Endpoint:** `POST /api/auth/login`

**Body:**

```json
{
  "email": "admin@gym.com",
  "password": "password123"
}
```

**Respuesta exitosa (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "role": "admin"
  }
}
```

**Posibles errores:**

| Código | Descripción           |
| ------ | --------------------- |
| 401    | Contraseña incorrecta |
| 404    | Usuario no encontrado |

---

##  System Health

### Verificar estado del sistema

Comprueba si la API se encuentra operativa.

* **Endpoint:** `GET /api/health`

**Respuesta:**

```json
{ "status": "ok" }
```

---

## Gestión de Miembros

* **Base:** `/api/miembros`
* **Autenticación:** Requiere JWT

### Listar miembros

* **Endpoint:** `GET /api/miembros`
Parámetros (Query Params):

page: Número de página (default: 1).

inactivos: true para ver papelera, false para ver activos (default: false).
GET /api/miembros?page=1&inactivos=false

```json
{
  "miembros": [
    {
      "id": 10,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "telefono": "555-1234",
      "sexo": "M",
      "peso_inicial": 75.5,
      "estatura": 1.75,
      "activo": true
    }
  ],
  "total": 15,
  "pages": 3,
  "current_page": 1
}
```

### Crear miembro

* **Endpoint:** `POST /api/miembros`

```json
{
  "id_usuario": 5,
  "telefono": "555-9876",
  "fecha_nacimiento": "1998-05-20",
  "sexo": "M",
  "peso_inicial": 80.0,
  "estatura": 1.80,
  "fecha_registro": "2024-01-27"
}
```

### Actualizar miembro

* **Endpoint:** `PUT /api/miembros/<id>`

```json
{
  "telefono": "555-0000",
  "peso_inicial": 78.5
}
```

### Eliminar miembro

* **Endpoint:** `DELETE /api/miembros/<id>`

```json
{ "msg": "Miembro eliminado correctamente" }
```

---

##  Gestión de Pagos

* **Base:** `/api/pagos`
* **Autenticación:** Requiere JWT

### Registrar pago

* **Endpoint:** `POST /api/pagos`

```json
{
  "id_miembro": 1,
  "monto": 50,
  "metodo": "Efectivo"
}
```

**Respuesta (201 Created):**

```json
{ "msg": "Pago registrado correctamente" }
```

### Historial de pagos

* **Endpoint:** `GET /api/pagos`

```json
[
  {
    "id": 10,
    "miembro": "Juan Pérez",
    "monto": 50,
    "fecha": "2026-01-23",
    "metodo": "Efectivo"
  }
]
```

---

##  Sistema de Backups

* **Base:** `/api/backups`
* **Autenticación:** JWT (Rol **Admin**)

Este módulo gestiona copias de seguridad de la base de datos de forma asíncrona, permitiendo seguimiento del progreso y descarga de archivos.

### Dashboard de Backups

* **Endpoint:** `GET /api/backups/dashboard-summary`

```json
{
  "system_status": "OK",
  "last_backup": "2026-01-22T03:00:00",
  "config": {
    "frequency": "Diaria",
    "next_scheduled": "2026-01-24T03:00:00"
  },
  "recent_history": []
}
```

### Ejecutar backup manual

* **Endpoint:** `POST /api/backups/trigger`

```json
{
  "type": "full"
}
```

**Tipos válidos:** `full`, `incremental`, `differential`

```json
{
  "message": "Backup full iniciado",
  "job_id": "job_a1b2c3d4",
  "status": "running"
}
```

### Estado del backup

* **Endpoint:** `GET /api/backups/status`

```json
{
  "is_running": true,
  "progress_percentage": 60,
  "current_step": "Comprimiendo archivos",
  "last_backup": null
}
```

### Historial de backups

* **Endpoint:** `GET /api/backups/history`

### Descargar backup

* **Endpoint:** `GET /api/backups/download/<filename>`

### Prueba de correo

Verifica la configuración SMTP para notificaciones.

* **Endpoint:** `GET /api/backups/test-email`

```json
{ "message": "Correo enviado con éxito" }
```

---

## Licencia

Proyecto de uso académico / interno. Adaptable a producción bajo configuración adecuada de seguridad y despliegue.
