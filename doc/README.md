# 📚 GymPro — Documentación

Índice central de toda la documentación técnica del proyecto.

---

## 📁 Estructura

```
doc/
├── propuestas/          # Documentos de diseño y planificación
├── auditoria/           # Auditoría técnica del código
├── diagramas/           # Diagramas de arquitectura y capturas
│   └── screenshots/     # Capturas del sistema en funcionamiento
└── respaldos/           # Esquemas y backups de referencia
```

---

## 📋 Propuestas y Planificación

| Documento | Descripción |
|---|---|
| [GymPro_SaaS_Propuesta.docx](propuestas/GymPro_SaaS_Propuesta.docx) | Propuesta completa de transformación a SaaS multi-tenant: arquitectura, módulos, planes de precios, estrategia de migración |
| [GymPro_Sprints_Gantt.docx](propuestas/GymPro_Sprints_Gantt.docx) | Diagrama de Gantt + definición de Sprints Scrum para la migración (Sprint 1: May 11–15 · Sprint 2: May 18–22) |

---

## 🔍 Auditoría Técnica

| Documento | Descripción |
|---|---|
| [Auditoria_Tecnica_GymPro.docx](auditoria/Auditoria_Tecnica_GymPro.docx) | 36 hallazgos clasificados: vulnerabilidades críticas de seguridad, malas prácticas, problemas de arquitectura y deficiencias de rendimiento |

**Hallazgos críticos documentados:**
- 7 endpoints de backups sin `@jwt_required()` (cualquier usuario anónimo podía restaurar la BD)
- `debug=True` hardcoded en producción (RCE risk)
- CORS wildcard sin restricción de origen
- `requirements.txt` con paquetes de sistema Ubuntu en vez de dependencias reales
- `sys.exit(1)` a nivel de módulo en `spark_config.py`

---

## 🗂️ Diagramas

| Archivo | Descripción |
|---|---|
| [Diagrama Relacional.png](diagramas/Diagrama%20Relacional.png) | Diagrama de relaciones entre entidades del schema original MySQL |
| [Diagrama entidad relacion.png](diagramas/Diagrama%20entidad%20relacion.png) | Diagrama ER completo del sistema |
| [screenshots/](diagramas/screenshots/) | Capturas del sistema: login, dashboard, analytics |

---

## 💾 Respaldos

| Archivo | Descripción |
|---|---|
| [db2.sql](respaldos/db2.sql) | Schema MySQL original (20+ tablas). **Referencia histórica únicamente.** El proyecto migró completamente a MongoDB Atlas. No ejecutar contra la base de datos activa. |

---

## 📖 READMEs por Módulo

| Módulo | README | Descripción |
|---|---|---|
| API (Flask) | [api/README.md](../api/README.md) | Setup Docker, comandos de desarrollo, variables de entorno |
| Web (React) | [web/README.md](../web/README.md) | Setup frontend, comandos Vite, estructura de componentes |
| Mobile | [mobile/README.md](../mobile/README.md) | Setup app móvil, configuración del entorno |

---

## 🗺️ Roadmap de Documentación

| Sprint | Documentos pendientes |
|---|---|
| Sprint 2 | Documento de arquitectura multi-tenant (schemas MongoDB, tenant middleware) |
| Sprint 3 | Guía de onboarding de nuevos gimnasios, documentación de la API pública |
| Sprint 4 | Guía de configuración de la app móvil en producción |
| Sprint 5 | Integración con dispositivos wearable (BLE, WebSockets) |
