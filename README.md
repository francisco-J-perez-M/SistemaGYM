# 🏋️ Gym Management API

Documentación oficial del Backend para el sistema de gestión de gimnasio.

## 📦 Stack Tecnológico
![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0%2B-black?style=for-the-badge&logo=flask&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-orange?style=for-the-badge)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-red?style=for-the-badge)

## ⚙️ Configuración General

- **Base URL:** `http://localhost:5000`
- **Autenticación:** JWT (Bearer Token)
- **Content-Type:** `application/json`

### 🔑 Autenticación Requerida
Para todos los endpoints marcados como protegidos, debes enviar el token en el header:
```http
Authorization: Bearer <tu_access_token>
🔐 1. Autenticación (Auth)
▶️ Iniciar Sesión
Genera un token de acceso para utilizar la API.

POST /api/auth/login

📥 Body:

JSON
{
  "email": "admin@gym.com",
  "password": "password123"
}
📤 Respuesta (200 OK):

JSON
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "role": "admin"
  }
}
❌ Errores: | Código | Causa | | :--- | :--- | | 401 | Contraseña incorrecta | | 404 | Usuario no encontrado |

❤️ 2. System Health
▶️ Verificar estado
Comprueba si la API está en línea.

GET /api/health

📤 Respuesta:

JSON
{ "status": "ok" }
👥 3. Gestión de Miembros
📌 Base: /api/miembros | 🔒 Requiere: Token JWT

▶️ Listar todos los miembros
GET /api/miembros

📤 Respuesta:

JSON
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "telefono": "555-1234",
    "activo": true
  }
]
▶️ Crear un miembro
POST /api/miembros

📥 Body:

JSON
{
  "nombre": "Ana López",
  "email": "ana@email.com",
  "telefono": "555-9876"
}
▶️ Actualizar miembro
PUT /api/miembros/<id>

📥 Body:

JSON
{
  "nombre": "Ana López Gómez",
  "telefono": "555-0000"
}
▶️ Eliminar miembro
DELETE /api/miembros/<id>

📤 Respuesta:

JSON
{ "msg": "Miembro eliminado correctamente" }
💳 4. Gestión de Pagos
📌 Base: /api/pagos | 🔒 Requiere: Token JWT

▶️ Registrar nuevo pago
POST /api/pagos

📥 Body:

JSON
{
  "id_miembro": 1,
  "monto": 50,
  "metodo": "Efectivo"
}
📤 Respuesta (201 Created):

JSON
{ "msg": "Pago registrado correctamente" }
▶️ Historial de pagos
GET /api/pagos

📤 Respuesta:

JSON
[
  {
    "id": 10,
    "miembro": "Juan Pérez",
    "monto": 50,
    "fecha": "2026-01-23",
    "metodo": "Efectivo"
  }
]
💾 5. Sistema de Backups
📌 Base: /api/backups | 🔒 Requiere: Token JWT (Rol Admin)

Este módulo gestiona las copias de seguridad de la base de datos de forma asíncrona.

▶️ Dashboard General
Obtiene un resumen del estado del sistema de backups.

GET /api/backups/dashboard-summary

📤 Respuesta:

JSON
{
  "system_status": "OK",
  "last_backup": "2026-01-22T03:00:00",
  "config": {
    "frequency": "Diaria",
    "next_scheduled": "2026-01-24T03:00:00"
  },
  "recent_history": []
}
▶️ Ejecutar Backup Manual
Inicia el proceso de respaldo en segundo plano.

POST /api/backups/trigger

📥 Body (Opcional):

JSON
{
  "type": "full" 
}
Tipos válidos: full, incremental, differential.

📤 Respuesta (202 Accepted):

JSON
{
  "message": "Backup full iniciado",
  "job_id": "job_a1b2c3d4",
  "status": "running"
}
▶️ Estado del Backup (Progreso)
Verifica el progreso del backup que se está ejecutando actualmente.

GET /api/backups/status

📤 Respuesta:

JSON
{
  "is_running": true,
  "progress_percentage": 60,
  "current_step": "Comprimiendo archivos",
  "last_backup": null
}
▶️ Historial de Backups
Obtiene la lista de todos los backups generados anteriormente.

GET /api/backups/history

▶️ Descargar Backup
Descarga el archivo físico generado.

GET /api/backups/download/<filename>

▶️ Prueba de Correo
Envía un email de prueba para verificar la configuración SMTP de notificaciones.

GET /api/backups/test-email

📤 Respuesta:

JSON
{ "message": "Correo enviado con éxito" }