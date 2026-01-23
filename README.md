Gym Management API
Documentación oficial del Backend para el sistema de gestión de gimnasio.

Stack Tecnológico
Python 3.10+

Flask 2.0+

JWT para autenticación

SQLAlchemy como ORM

Configuración General
Base URL: http://localhost:5000

Autenticación: JWT (Bearer Token)

Content-Type: application/json

Autenticación Requerida
Para todos los endpoints marcados como protegidos, debes enviar el token en el header:

http
Authorization: Bearer <tu_access_token>
1. Autenticación (Auth)
Iniciar Sesión
Genera un token de acceso para utilizar la API.

Endpoint: POST /api/auth/login

Body:

json
{
  "email": "admin@gym.com",
  "password": "password123"
}
Respuesta (200 OK):

json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "role": "admin"
  }
}
Errores:

Código	Causa
401	Contraseña incorrecta
404	Usuario no encontrado
2. System Health
Verificar estado
Comprueba si la API está en línea.

Endpoint: GET /api/health

Respuesta:

json
{ "status": "ok" }
3. Gestión de Miembros
Base: /api/miembros
Autenticación: Requiere Token JWT

Listar todos los miembros
Endpoint: GET /api/miembros

Respuesta:

json
[
  {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "telefono": "555-1234",
    "activo": true
  }
]
Crear un miembro
Endpoint: POST /api/miembros

Body:

json
{
  "nombre": "Ana López",
  "email": "ana@email.com",
  "telefono": "555-9876"
}
Actualizar miembro
Endpoint: PUT /api/miembros/<id>

Body:

json
{
  "nombre": "Ana López Gómez",
  "telefono": "555-0000"
}
Eliminar miembro
Endpoint: DELETE /api/miembros/<id>

Respuesta:

json
{ "msg": "Miembro eliminado correctamente" }
4. Gestión de Pagos
Base: /api/pagos
Autenticación: Requiere Token JWT

Registrar nuevo pago
Endpoint: POST /api/pagos

Body:

json
{
  "id_miembro": 1,
  "monto": 50,
  "metodo": "Efectivo"
}
Respuesta (201 Created):

json
{ "msg": "Pago registrado correctamente" }
Historial de pagos
Endpoint: GET /api/pagos

Respuesta:

json
[
  {
    "id": 10,
    "miembro": "Juan Pérez",
    "monto": 50,
    "fecha": "2026-01-23",
    "metodo": "Efectivo"
  }
]
5. Sistema de Backups
Base: /api/backups
Autenticación: Requiere Token JWT (Rol Admin)

Este módulo gestiona las copias de seguridad de la base de datos de forma asíncrona.

Dashboard General
Obtiene un resumen del estado del sistema de backups.

Endpoint: GET /api/backups/dashboard-summary

Respuesta:

json
{
  "system_status": "OK",
  "last_backup": "2026-01-22T03:00:00",
  "config": {
    "frequency": "Diaria",
    "next_scheduled": "2026-01-24T03:00:00"
  },
  "recent_history": []
}
Ejecutar Backup Manual
Inicia el proceso de respaldo en segundo plano.

Endpoint: POST /api/backups/trigger

Body (Opcional):

json
{
  "type": "full" 
}
Tipos válidos: full, incremental, differential.

Respuesta (202 Accepted):

json
{
  "message": "Backup full iniciado",
  "job_id": "job_a1b2c3d4",
  "status": "running"
}
Estado del Backup (Progreso)
Verifica el progreso del backup que se está ejecutando actualmente.

Endpoint: GET /api/backups/status

Respuesta:

json
{
  "is_running": true,
  "progress_percentage": 60,
  "current_step": "Comprimiendo archivos",
  "last_backup": null
}
Historial de Backups
Obtiene la lista de todos los backups generados anteriormente.

Endpoint: GET /api/backups/history

Descargar Backup
Descarga el archivo físico generado.

Endpoint: GET /api/backups/download/<filename>

Prueba de Correo
Envía un email de prueba para verificar la configuración SMTP de notificaciones.

Endpoint: GET /api/backups/test-email

Respuesta:

json
{ "message": "Correo enviado con éxito" }