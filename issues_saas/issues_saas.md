# Issues de documentación — Rama `saas` · SistemaGYM

Documentación de actividades realizadas, agrupadas por módulo/feature a partir de los 100 commits más recientes de la rama `saas` (repo `francisco-J-perez-M/SistemaGYM`). Cada issue se crea y se cierra como **completed**, con el label común `saas` para filtrarlos en el project **"sistema gym"**.

| # | Issue | Labels |
|---|-------|--------|
| 1 | IA/Analíticas: migración de Spark a scikit-learn + pymongo | saas, backend, ia-analiticas, refactor |
| 2 | Onboarding: registro y primer login para dueños de gimnasio | saas, web, feature |
| 3 | Portal del entrenador: asignación de clientes, perfil editable y fixes | saas, web, backend, feature |
| 4 | Portal de recepción: panel completo, notificaciones y fixes | saas, web, feature |
| 5 | Sistema de temas web con paletas y variables CSS | saas, web, refactor |
| 6 | Portal del miembro: overhaul completo de UX | saas, web, feature |
| 7 | Portal del miembro: POS modo miembro, membresías y avatares | saas, web, backend, fix |
| 8 | App móvil GymPro (Expo): fundación y navegación por roles | saas, mobile, feature |
| 9 | App móvil: accesibilidad, theming y estabilidad | saas, mobile, fix |
| 10 | Staff y superadmin: fotos de perfil y fixes de plataforma | saas, web, backend, fix |
| 11 | Documentación: Normativa, estándares e ITIL | saas, docs |
| 12 | Nutrición: Dietas v2 + Recetas + AI ETL con Ollama local | saas, backend, web, ia-analiticas, feature |
| 13 | Rutinas: importación AI ETL desde PDF/Excel y deduplicación | saas, backend, web, feature |
| 14 | Multi-tenancy: ejercicios scoped por entrenador (migración 009) | saas, backend, feature |
| 15 | DevOps: Docker, healthchecks y despliegue en VPS 8GB | saas, devops |
| 16 | Auth: JWT 8h, manejo de 401 y recuperación de contraseña por correo | saas, backend, security |
| 17 | Nutrición: gestión avanzada y portal de alimentación del miembro | saas, web, backend, feature |
| 18 | Ejercicios: selección múltiple, papelera y borrado definitivo | saas, web, backend, fix |
| 19 | Backups y restauración multi-motor portable | saas, backend, devops, feature |
| 20 | Salud y progreso: modelo 3D y fixes de predicción | saas, web, mobile, feature |
| 21 | Guía interactiva del sistema (spotlight) por rol | saas, web, feature |
| 22 | UI: reemplazo de emojis por iconos en los 5 roles | saas, web, refactor |
| 23 | Entrenamientos: bitácora real, registro por rutina y auto-detección de día | saas, web, mobile, backend, feature |
| 24 | Rutinas: grupos musculares por día, kg/lb y series flexibles | saas, web, backend, feature |
| 25 | Analíticas: laboratorio de modelos y métricas de negocio | saas, ia-analiticas, feature |
| 26 | Entrenador: calificación, cambio con historial y suscripción del owner | saas, web, mobile, backend, feature |
| 27 | Móvil: Mi Rutina, predicción de peso, reportes y paridad de roles | saas, mobile, feature |
| 28 | Perfil del miembro: persistencia de datos y análisis IA por entrenador | saas, web, backend, fix |

---

## 1. IA/Analíticas: migración de Spark a scikit-learn + pymongo

**Objetivo:** eliminar la dependencia de PySpark/JVM del módulo de IA, ejecutando el procesamiento de forma local con scikit-learn + pymongo (sin JVM, sin internet), reduciendo consumo de recursos y complejidad de despliegue.

**Actividades:**
- Migración de los pipelines de IA de Spark a scikit-learn + pymongo.
- Fix crítico en `_to_naive_datetime`: `val[:len(fmt)]` usaba la longitud del formato y no de la fecha, rompiendo la regresión (400 "Datos de progreso insuficientes").
- Mejoras de UX en cancelaciones y regresión.
- Lenguaje no técnico en todas las páginas de IA y Analíticas.

**Commits:** [`1c25fde`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/1c25fde30f07fdf1a686cef3c53c4ea46c3230e3), [`5f5a535`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/5f5a535a67a75674b3ec1ecf8bc4bbd3c3ed5a4e), [`d080b2e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/d080b2e9fa37c0832c1165cc317bdab0acb13c3d), [`0945f8f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/0945f8fb034f64e464b84861ca6f63c16c7423cf)

## 2. Onboarding: registro y primer login para dueños de gimnasio

**Objetivo:** habilitar el modelo SaaS multi-gimnasio permitiendo que un dueño cree su cuenta y configure su gimnasio sin intervención del superadmin.

**Actividades:**
- `AuthPage`: opción "Crear Cuenta" con flujo de registro para dueños.
- Flujo de primer login con configuración inicial del gimnasio.

**Commits:** [`be32404`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/be3240475757139444cfe7e17f3521cc336b3666)

## 3. Portal del entrenador: asignación de clientes, perfil editable y fixes

**Objetivo:** completar el portal del entrenador con gestión real de clientes y perfil.

**Actividades:**
- Asignación de clientes, perfil editable y calificación de entrenador (`trainer_routes`).
- Fixes de portal: sidebar, rutinas, dietas, perfil y agenda.
- Modal de cliente funcional: métricas reales (racha, asistencia, sesiones), objetivo editable (`PUT /clients/<id>/goal`) e historial de sesiones (`GET /clients/<id>/history`).
- Sidebar: el pie muestra el nombre del usuario en lugar de "GYM PRO" hardcodeado.

**Commits:** [`f4bbb66`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f4bbb667bc42abc5c7f2eb34f3ad287f4d3165d7), [`d10a1b0`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/d10a1b08e55d0d033c3e223d7ae3b212a0806b6e), [`fde7396`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/fde739675cf06e3be4ef6459ce7be3c8748b6e65), [`c85d06d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/c85d06d4cd3228f3bdc936e506f202a32284529b)

## 4. Portal de recepción: panel completo, notificaciones y fixes

**Objetivo:** rediseñar el portal del rol recepcionista con panel completo y comunicación con miembros.

**Actividades:**
- Panel completo con notificaciones in-app y por email en citas.
- Rediseño de sidebar: Dashboard y Punto de Venta.
- Fixes: nombres en pagos, paginación server-side y estado normalizado.

**Commits:** [`e0d6dbc`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e0d6dbc7a2013848c0cacae00664e85dc961c914), [`bd10cb4`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/bd10cb466222ba24d8547696b00c86b8016926fd), [`96b9bcf`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/96b9bcfe956a5a7b3442b320cc64fae6d8ad3511)

## 5. Sistema de temas web con paletas y variables CSS

**Objetivo:** theming consistente en toda la web mediante variables CSS y paletas por tema.

**Actividades:**
- Sistema de temas completo con paletas por tema (`Layout.jsx`, fondo principal).
- Refactor: colores neutros hardcodeados migrados a variables CSS (grises, fondos, acento legacy).
- Variables propias de sidebar para texto siempre legible.
- Empty states elegantes en 401 + fix `tipo_gimnasio` en perfil del owner.

**Commits:** [`2e76551`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/2e76551745854aee214b5f119e5fcc3c31fc17ab), [`81df736`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/81df73660c028c2c319e2670edc70dd3f31a1ff3), [`4615593`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/46155931c0c6ab623ae01c606fa2e9c1c3b44eb3), [`4d8dd02`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/4d8dd0217ce7736cf386be71a5031979921cbcd6)

## 6. Portal del miembro: overhaul completo de UX

**Objetivo:** rediseño integral de la experiencia del miembro en web.

**Actividades:**
- Overhaul completo (tareas #7-#14): onboarding multi-step (`CompleteProfile`), perfil rediseñado.
- Ronda 2: rutinas, predicción de peso (fix NaN), meal plan y recetario.
- Reemplazo de emojis por react-icons + fix de membresía + meal plan reimaginado.
- Dashboard: entrenamiento de hoy conectado a la rutina real; limpieza de iconos (`gi`→`fi`), fixes menores (imports, `CAT_EMOJI`, duración de video 15→30s).

**Commits:** [`9d6da6d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/9d6da6d9cb8a151dbfee0dfc504f8f8b649d08cf), [`cca601f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/cca601fed9be84a6c04c63c87d57db580895cb1e), [`b53135d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/b53135d1906ed39b445d4e32b5cf47f0f7a75688), [`5bdfb31`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/5bdfb31c77976c68c4c24f843748b6ba85e4cdf6), [`f6590ff`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f6590ffed634b0e885684d551ccf57ce69c97340), [`859c03a`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/859c03a537587c2ae4f1ad8c6b05f6c6a3453c32), [`e8ea223`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e8ea2230472463ef47c9ec9e7d893c0e8caccc15), [`49963e9`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/49963e937bc35ddb7f556974c2e36d958678c7ee)

## 7. Portal del miembro: POS modo miembro, membresías y avatares

**Objetivo:** completar el portal del miembro con POS, series de métricas y manejo robusto de fotos.

**Actividades:**
- POS modo miembro: historial y compras; series de tiempo de métricas; sync de foto.
- Fix `membresia-activa` 500: `ObjectId(get_jwt_identity())` fallaba con identidad PG; corregido a `id_usuario_pg` (int).
- Avatar URL guard: soporta data URLs base64 legacy y filenames (`/api/uploads/<filename>`), evitando 414 Request-URI Too Large; `foto_preview` separado de `foto_base64` en `MiembroForm`.

**Commits:** [`66e2a34`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/66e2a34fbe02157685d20f9081066d4d13ed0504), [`d54a51a`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/d54a51a2f54821c8cf386d2c21bd7eb8c5a71009), [`e91760e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e91760e95a0f0b5606c2be35130b03ba81b15e0f), [`a279e4f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/a279e4fd709a35df1c9011803bf20d405354f9f4)

## 8. App móvil GymPro (Expo): fundación y navegación por roles

**Objetivo:** reconstruir la app móvil desde cero sobre Expo con módulos Miembro, Entrenador y Admin.

**Actividades:**
- Eliminación del proyecto móvil anterior y bootstrap de GymPro Mobile (Expo).
- Fix de arranque de Metro + script helper de IP LAN.
- Fix crash Fabric (Trainer Dashboard) y alineación de rutas/tipos con la API Flask.
- Navegación por roles (Owner/Trainer/Member), pantallas faltantes, fix de endpoints y crashes.

**Commits:** [`470bd8d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/470bd8d745659e5da010a3d77a81b5aa62b44a3d), [`ebf2963`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/ebf29631e72b762eb0d76b5fc5e048150742d21a), [`1eea6c2`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/1eea6c21601f523e27947ef3a3d658013cfee3b3), [`de5faa7`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/de5faa75dc8d3414524340340d3002b9ca112e2a), [`e74a35e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e74a35e4c972988a63b136b65ed684249e9cd093), [`3e3a854`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/3e3a854ed5a88d3f2cfbeb36a911c538e96f08a9)

## 9. App móvil: accesibilidad, theming y estabilidad

**Objetivo:** app móvil accesible, con theming uniforme y estable en Expo Go/APK.

**Actividades:**
- Sistema de accesibilidad completo: tema, fuente, contraste, movimiento.
- Modo claro/oscuro uniforme (28 archivos) + modal de detalle de rutinas.
- Fix `ReferenceError` (helpers fuera de scope) y colores hardcodeados → tokens del tema.
- App funcional en Expo Go; video inline, fix crash de APK y build universal.

**Commits:** [`fba4b5b`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/fba4b5bdd8ccb324505c2d8551945dcfdab4bd27), [`fd7d125`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/fd7d12590e50edf4b6d18239088b445afd2bd897), [`469d7d9`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/469d7d93db7efe433a64e250498e7252bcbd9b7e), [`76189e2`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/76189e21b6a2edd94df434ebef35009302002d18), [`0cb9b2b`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/0cb9b2b4885cf7d42ff99e22115f969da92119b9), [`f54d45f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f54d45f94a5d42c1fd289cf03e7ddaee0b4bc15b), [`bfa5d6b`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/bfa5d6b45bc62a27ef0386a2a94f7f534aaec091)

## 10. Staff y superadmin: fotos de perfil y fixes de plataforma

**Objetivo:** mejorar gestión de staff y las vistas del superadmin.

**Actividades:**
- Foto de perfil en staff (columna en `models/pg/usuario.py`) + rediseño UI en cards.
- Superadmin: búsqueda por `q` en gimnasios y correcciones en vistas de plataforma.

**Commits:** [`17d18e9`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/17d18e9d1a2723d71a828780c8570272bfd71bf8), [`75c880d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/75c880d19e0086fcaa27494a6de1fd9681de67dd)

## 11. Documentación: Normativa, estándares e ITIL

**Objetivo:** documentar normativa, estándares y gestión de servicios del proyecto.

**Actividades:**
- Documento de Normativa, Estándares y Generalidades del Proyecto.
- Documentación ITIL (v5) del servicio.

**Commits:** [`831d7d4`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/831d7d44dee45974cdf22ad0988439d2e5ed1247), [`00a22ee`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/00a22ee4b1ba3694e6ba7fe2d95241b70a944880), [`74a2d2f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/74a2d2feeac422753243013e917ffb8945000bdf)

## 12. Nutrición: Dietas v2 + Recetas + AI ETL con Ollama local

**Objetivo:** módulo de nutrición completo con importación asistida por LLM local (sin API externa).

**Actividades:**
- `diet_routes.py`: blueprint independiente, Dietas v2 + Recetas + AI ETL.
- Reemplazo del SDK de Anthropic por Ollama local para el AI ETL.
- `ImportarIATab`: status de Ollama en tiempo real, indicador de modelo activo y botón deshabilitado si no está listo.
- Parser determinístico para PDFs + fix de timeout de gunicorn; timeout de Ollama 180→270s con manejo de excepciones.

**Commits:** [`095d2f2`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/095d2f25022a01ed22097715a09a09e92f121245), [`edebd7c`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/edebd7c247de278a5a6c1c5bf6e2c38bc6f23905), [`9e07eab`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/9e07eabfbddb0aa5f381e874eee910566d66a021), [`847209f`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/847209f3f48a545cb6017afa7ff8ff5f44e9167c), [`e0e68ea`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e0e68ea53497efdbfcbfb03697f73c1ddfe208bc)

## 13. Rutinas: importación AI ETL desde PDF/Excel y deduplicación

**Objetivo:** importar rutinas/ejercicios desde PDF/Excel vía Ollama con control granular.

**Actividades:**
- `etl_ollama.py` compartido (`extract_text`/`call_ollama`/`check_ready`); `POST /routines/import-ai` + `GET /routines/ai-status`; tab "Importar IA" con preview y selección granular.
- Dedup IA, pesos por nivel y limpieza de recetas en el ETL.
- Reactivación al importar, ver/reactivar inactivos y agrupación por día.

**Commits:** [`4eec738`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/4eec7380bfbe922e3a531cde766aacabef39cc1c), [`1f3cb25`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/1f3cb25f742d347d616a4895c517246a963e3986), [`e8f6193`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/e8f6193ae498a038687074aaeed05623b66e3be3)

## 14. Multi-tenancy: ejercicios scoped por entrenador (migración 009)

**Objetivo:** aislar el catálogo de ejercicios por entrenador dentro de cada gimnasio.

**Actividades:**
- Modelo `Ejercicio`: campo `id_entrenador` (FK usuarios, nullable).
- CRUD scoped al entrenador del JWT (GET filtra, POST asigna, PUT/DELETE solo propios).
- Migración 009: add column + reemplazo de constraint `uq_ejercicio_gym_nombre` → `uq_ejercicio_gym_trainer_nombre`.

**Commits:** [`84cef95`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/84cef9563753b91442da2597676b5b68f125156a), [`673a9dd`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/673a9dd049d4cd637be2b22ed75b29ce18877fcb)

## 15. DevOps: Docker, healthchecks y despliegue en VPS 8GB

**Objetivo:** stack productivo optimizado para VPS de 8GB.

**Actividades:**
- Healthcheck de Ollama: `start_period` 90s, `retries` 8; `api` con `service_started` (verificación por request vía `_check_ollama_ready()`).
- Reparación de `docker-compose.yml` truncado.
- Optimización: Dockerfile sin Java 17 (−200MB), gunicorn 2 gthread×4, `mem_limits`, cache de Mongo capada a 1GB, puertos de datos cerrados; estudio de hosting (Contabo/Hetzner).
- `.gitattributes` forzando LF en entrypoints (CRLF rompía exec en contenedor); trabajo de despliegue en VPS.

**Commits:** [`32dc801`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/32dc8013805621ca9df40397526bf80e2197c49d), [`a1eecda`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/a1eecdaf8f4ecb0ecde14667263f8354d3f97627), [`778c63d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/778c63dc62c76da5360adbe496cb74009131906c), [`0ffe9ae`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/0ffe9ae8894ce8adb82444d87148beb6cbfa49f5), [`cb3d592`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/cb3d592621a90a0378b0c9dabd68c4adf92ba1c7)

## 16. Auth: JWT 8h, manejo de 401 y recuperación de contraseña por correo

**Objetivo:** sesiones estables y recuperación de cuenta self-service.

**Actividades:**
- `JWT_ACCESS_TOKEN_EXPIRES = 8h` (el default de 1h causaba 401 en sesiones largas con Ollama); `apiFetch` limpia localStorage y redirige a /login en 401; soporte de `data.msg` (Flask-JWT).
- Recuperación de contraseña por correo con código de 6 dígitos (endpoints `/auth/...`).
- Configuración de correo saliente.

**Commits:** [`b39d41d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/b39d41d13c65bae2b1515d08c1b8337e29d01c46), [`94898ff`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/94898ffa1e3ddbdcdde47f7ce4dc89fb68d6711f), [`faa87e7`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/faa87e7d46e6fa2b2f3e8e149ab89aad512444e1)

## 17. Nutrición: gestión avanzada y portal de alimentación del miembro

**Objetivo:** cerrar el ciclo de nutrición entre entrenador y miembro.

**Actividades:**
- Bulk delete, modales rediseñados, fixes de routing y filtros en dietas.
- `UserMealPlan`: tabs de plan asignado, dietas propias y recetario con tracking diario; `confirm-import` y fallback `_derivar_recetas_de_plan`.
- Importación de historial de dieta del cliente + indicador de plan nutricional en el progreso (tarjeta "Plan Nutricional").

**Commits:** [`7b12922`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/7b12922dee48cf600a175f24b5a79194b565293a), [`cb122bf`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/cb122bf347d385da4e0f56854fc43ee321e75e13), [`9e57a38`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/9e57a3892385f896be4f7a86b16ba7bec1205a32)

## 18. Ejercicios: selección múltiple, papelera y borrado definitivo

**Objetivo:** flujo completo de borrado activo → papelera → eliminación total.

**Actividades:**
- Selección múltiple y borrado masivo; fix hora de chat (UTC); retiro de bloqueo premium temporal.
- `DELETE /trainer/exercises/<id>/permanent` (hard delete) + botón "Eliminar definitivamente"; peso corporal opcional y calorías estimadas (MET × peso × duración) en resultado, bitácora y resumen.
- Borrado masivo inteligente: activo → papelera, inactivo → definitivo (antes todo iba a soft-delete y reportaba fallidos).

**Commits:** [`b5142e1`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/b5142e13aae241d35b0482cdf1d79d36193ba9c3), [`cde9ab8`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/cde9ab8ddd2ba6adf67ea1724f7129528259caf9), [`00e1241`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/00e124169292dc388a126fcc67b78c4541a46ad8)

## 19. Backups y restauración multi-motor portable

**Objetivo:** backup completo portable y restauración tipo clon del sistema.

**Actividades:**
- Restauración multi-motor (PG + Mongo) incluyendo medios; backup completo portable.
- Backup en paquete único (`service.py: build_...`) + restauración como clon total.
- Mejoras de UX y fix CRLF en el flujo de backups.

**Commits:** [`c3bce09`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/c3bce099cd460277a07fc4626772a67cfe8f386e), [`0556361`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/0556361a61cf1146d685868f29f8a5d03905bf8f), [`07b16dc`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/07b16dc2a297e4e50ca1b37632c83e08c3613150), [`858998d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/858998d685d03bd56e8f9505ee1d1a5be338ebca)

## 20. Salud y progreso: modelo 3D y fixes de predicción

**Objetivo:** visualización 3D del progreso físico consistente en web y móvil.

**Actividades:**
- Modelo 3D mejorado, 2 pantorrillas, modal de datos y fix de predicción.
- Fix de género en el modelo 3D: `_norm_sexo()` normaliza M/F, Masculino/Femenino, male/female, hombre/mujer antes de derivar género y grasa corporal.
- Salud rediseñada en móvil con edición total y perfil completo editable.

**Commits:** [`79dc67e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/79dc67e563471ecf5d1d4a5ad78c58a35c649ce2), [`242c31d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/242c31df9af3b421867009e0a06613c1c76c8a7b), [`d99196e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/d99196e2d0c5a41e95d2dfd0be48b38438f65c6e)

## 21. Guía interactiva del sistema (spotlight) por rol

**Objetivo:** onboarding in-app guiado por vista y por rol.

**Actividades:**
- Guía interactiva paso a paso por rol (modal guiado con icono y explicación).
- Guía inmersiva con motor de spotlight por vista; botón "Guía del sistema" en el sidebar.
- Extensión a dashboards, rol Dueño y POS; fix de encuadre y guía de superadmin.

**Commits:** [`419c2e6`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/419c2e6977a7f47c17b5adb3062bca34362ee902), [`5c3cb49`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/5c3cb4911e517b545f42444b7ecb5c8ecfafc327), [`784e952`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/784e9520afba74cd0bdec8c5760ba60fb96affb5), [`8e5df99`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/8e5df992251bacc13717777ab19aa8782d84038b)

## 22. UI: reemplazo de emojis por iconos en los 5 roles

**Objetivo:** identidad visual profesional y consistente en toda la web.

**Actividades:**
- Sustitución de emojis por react-icons (Feather/Game Icons) en miembro, dueño/admin, superadmin, entrenador y recepción; limpieza en options, plantillas de impresión, SweetAlert y logs.

**Commits:** [`f60d2e6`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f60d2e612e109c11da08211e1921cf99b312f190)

## 23. Entrenamientos: bitácora real, registro por rutina y auto-detección de día

**Objetivo:** registro de entrenamientos basado en la rutina asignada, con historial real.

**Actividades:**
- Bitácora real de entrenamientos del miembro (web + móvil), endpoint `/api/user...`.
- Consistencia de unidades e IMC (normalización cm→m); registro a partir de la rutina, sin ejercicios libres.
- Auto-detección del día de la rutina según la fecha actual (web + móvil).

**Commits:** [`f997697`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f997697af5d9b5a6d4c32a6631040a037837c8d2), [`b55dd88`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/b55dd88e186026da62e7daff5228a8b419f8eaa0), [`a823c7b`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/a823c7bec96aea212e83e3c6473a9d7e39607561)

## 24. Rutinas: grupos musculares por día, kg/lb y series flexibles

**Objetivo:** editor de rutinas más expresivo para entrenadores y miembros.

**Actividades:**
- Varios grupos musculares por día, peso con kg/lb y series flexibles (backend + web miembro).
- Grupo y kg/lb por ejercicio + series flexibles en el editor del entrenador y en registrar entreno móvil.

**Commits:** [`b2d4290`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/b2d42904676275094636bf5f5ecf75adadee1986), [`69ea27e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/69ea27ec988bfed0d5cefeda898fa94bb683a75c)

## 25. Analíticas: laboratorio de modelos y métricas de negocio

**Objetivo:** analítica avanzada accesible para el usuario de negocio.

**Actividades:**
- Laboratorio de modelos: regresión, clasificación, SVM, árbol de decisión y matriz de confusión.
- Lenguaje sencillo y reglas del árbol legibles para usuario no técnico.
- Nuevas métricas: horarios concurridos, clientes por valor y fuerza + fix de riesgo de abandono.

**Commits:** [`c02dabd`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/c02dabd0954854df91e863da572acf1ad1e66688), [`682491e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/682491ee7939e1689a2db6716fe56274b19bd311), [`4277ab4`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/4277ab419969244c2199a7b09fc9b660c4de21b7)

## 26. Entrenador: calificación, cambio con historial y suscripción del owner

**Objetivo:** ciclo de vida completo de la relación miembro-entrenador + monetización del owner.

**Actividades:**
- Calificación de entrenador (web + móvil), terminar/cambiar de entrenador con historial del entrenador previo.
- Vista de suscripción del owner con pago demo y cargo recurrente; alertas automáticas y "Mi Rutina" integrada.
- Fix: rutinas asignadas por entrenadores previos incluidas en el historial del cliente.

**Commits:** [`f6459d4`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/f6459d48f96b6515c60646473f69355e02eba0a2), [`87fb83e`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/87fb83e48e58c9ab862b6f871f2a6ff94465a6e3), [`ce6e17a`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/ce6e17a20efcb12bc76dc1e3b2bdb69d9cf442a2), [`df31079`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/df31079bb2d585b184723b642867142819b6a0bb)

## 27. Móvil: Mi Rutina, predicción de peso, reportes y paridad de roles

**Objetivo:** paridad funcional de la app móvil con la web.

**Actividades:**
- Mi Rutina, predicción de peso, reportes de entrenador y recordatorios en móvil.
- Paridad de roles, analítica IA, rol recepcionista y fixes de UX/timezone (mobile + API).

**Commits:** [`35ee68d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/35ee68d7569fb03d345011240b3a28628120f307), [`547f59d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/547f59da6922c83374e98f517e3163a463b76f50)

## 28. Perfil del miembro: persistencia de datos y análisis IA por entrenador

**Objetivo:** perfil del miembro confiable y análisis IA correctamente segmentado.

**Actividades:**
- Dirección persistente (antes hardcodeada e ignorada en PUT), fecha de nacimiento con selector de calendario (dd/mm/aaaa ↔ ISO), género "Prefiero no decir"→"Otro" y objetivo persistente.
- Análisis IA por entrenador y correcciones de perfil de miembro.

**Commits:** [`ae265ec`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/ae265ece975d87fa8384469201cb03ee491e9e5e), [`c3e743d`](https://github.com/francisco-J-perez-M/SistemaGYM/commit/c3e743d4d3fdbcffc0b9e6148220ef5a60febe3c)
