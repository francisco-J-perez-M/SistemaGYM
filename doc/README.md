# GymPro — Documentación

Índice central de la documentación técnica del proyecto.

---

## Estructura

```
doc/
├── propuestas/          # Documentos de diseño y planificación
├── auditoria/           # Auditoría técnica del código
├── diagramas/           # Diagramas de arquitectura y capturas
│   └── screenshots/     # Capturas del sistema en funcionamiento
└── respaldos/           # Esquemas de referencia histórica
```

Además, en `docs/` (raíz del repositorio) se encuentran notas de infraestructura y
hosting (estudio de hosting, optimización de recursos, decisiones de VPS).

---

## READMEs por módulo

| Módulo | README | Descripción |
|---|---|---|
| Proyecto | [../README.md](../README.md) | Instalación paso a paso, arquitectura, contenedores y stack |
| API (Flask) | [../api/README.md](../api/README.md) | Variables de entorno, comandos, estructura y endpoints |
| Web (React) | [../web/README.md](../web/README.md) | Desarrollo, build, estructura por rol, proxy nginx |
| Móvil (Expo) | [../mobile/README.md](../mobile/README.md) | Ejecución, build con EAS, estructura y características |

---

## Guías

| Documento | Descripción |
|---|---|
| [PAGOS_CONFIGURACION.md](PAGOS_CONFIGURACION.md) | Alta en PayPal y Mercado Pago, credenciales de plataforma y configuración por gimnasio |
| [../mobile/docs/SISTEMA-DE-COLOR.md](../mobile/docs/SISTEMA-DE-COLOR.md) | Tokens de color de la app móvil, qué pinta cada uno y cómo añadir una paleta |

---

## Arquitectura y contenedores

El sistema se despliega con Docker Compose y se compone de: API (Flask + Gunicorn),
Web (React servido por nginx), PostgreSQL 16 (datos relacionales), MongoDB 7 (datos
documentales), Redis 7 (caché y límite de peticiones) y Ollama (modelo local para el ETL
de rutinas). El detalle de puertos y servicios está en el README raíz y en el de la API.

- Autenticación con JWT: token de acceso de 8 horas y token de refresco de 90 días, con
  renovación automática desde el cliente.
- Multi-tenant por gimnasio mediante el claim del token y la cabecera `X-Gym-ID`.
- Migraciones de PostgreSQL con Alembic, aplicadas al arrancar el contenedor de la API.
- Zona horaria configurable con `APP_TIMEZONE`: determina la fecha con la que se
  registran ventas, pagos y asistencias.
- Pagos con PayPal y Mercado Pago; cada gimnasio guarda sus credenciales cifradas con
  Fernet y la plataforma cobra las suscripciones con las suyas.
- Módulos de inteligencia artificial con scikit-learn en proceso.

---

## Propuestas y planificación

| Documento | Descripción |
|---|---|
| [GymPro_SaaS_Propuesta.docx](propuestas/GymPro_SaaS_Propuesta.docx) | Propuesta de la plataforma SaaS multi-tenant: arquitectura, módulos y estrategia |
| [GymPro_Sprints_Gantt.docx](propuestas/GymPro_Sprints_Gantt.docx) | Planificación por sprints y cronograma del proyecto |

---

## Auditoría técnica

| Documento | Descripción |
|---|---|
| [Auditoria_Tecnica_GymPro.docx](auditoria/Auditoria_Tecnica_GymPro.docx) | Hallazgos de seguridad, arquitectura y rendimiento detectados y corregidos durante la evolución del proyecto |

---

## Diagramas

| Archivo | Descripción |
|---|---|
| [Diagrama Relacional.png](diagramas/Diagrama%20Relacional.png) | Relaciones entre entidades del modelo de datos |
| [Diagrama entidad relacion.png](diagramas/Diagrama%20entidad%20relacion.png) | Diagrama entidad-relación del sistema |
| [screenshots/](diagramas/screenshots/) | Capturas del sistema en funcionamiento |

---

## Respaldos y referencia

| Archivo | Descripción |
|---|---|
| [db2.sql](respaldos/db2.sql) | Esquema SQL original. Referencia histórica únicamente; el proyecto opera hoy sobre PostgreSQL (relacional) y MongoDB (documental). No ejecutar contra la base de datos activa. |

---

## Documentación de servicio (ITIL v4)

La documentación de gestión del servicio —manuales técnicos (instalación y despliegue,
arquitectura, referencia de la API, usuario, administración y operación), fichas
técnicas y entregables de gestión de proyecto— se mantiene en el repositorio documental
del equipo (Google Drive), organizada por las fases del ciclo de vida de ITIL v4.
