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
| **Novedades** | [CHANGELOG.md](CHANGELOG.md) | **Qué se ha agregado, cuándo, y qué queda pendiente** |
| API (Flask) | [api/README.md](api/README.md) | Backend, contenedores, variables de entorno, endpoints |
| Web (React) | [web/README.md](web/README.md) | Frontend, comandos, estructura, build |
| Móvil (Expo) | [mobile/README.md](mobile/README.md) | Aplicación móvil, ejecución y build con EAS |
| Documentación | [doc/README.md](doc/README.md) | Índice de documentación técnica del proyecto |
| Pagos | [doc/PAGOS_CONFIGURACION.md](doc/PAGOS_CONFIGURACION.md) | Alta y configuración de PayPal y Mercado Pago |
| Sistema de color | [mobile/docs/SISTEMA-DE-COLOR.md](mobile/docs/SISTEMA-DE-COLOR.md) | Tokens de color de la app móvil y cómo añadir paletas |

---

# 1. Instalación desde cero

Todo el backend corre en contenedores, así que **no hace falta instalar Python,
PostgreSQL, MongoDB ni Redis**. Solo Docker y Git.

## 1.1 Instalar Docker

| Sistema | Qué instalar | Enlace |
|---|---|---|
| Windows 10/11 | Docker Desktop | https://www.docker.com/products/docker-desktop/ |
| macOS (Intel o Apple Silicon) | Docker Desktop | https://www.docker.com/products/docker-desktop/ |
| Linux (Ubuntu/Debian) | Docker Engine + plugin Compose | https://docs.docker.com/engine/install/ubuntu/ |
| Linux (Fedora) | Docker Engine + plugin Compose | https://docs.docker.com/engine/install/fedora/ |

Descargar imágenes no requiere cuenta de Docker Hub. Solo es necesaria si se van a
publicar imágenes propias: https://hub.docker.com/signup

### Windows

1. Descargar Docker Desktop del enlace de arriba e instalarlo.
2. El instalador habilita **WSL 2** automáticamente. Si pide reiniciar, hacerlo.
3. Abrir Docker Desktop y esperar a que el icono de la ballena deje de animarse.
4. Comprobar en PowerShell o Git Bash:

```bash
docker --version
docker compose version
```

Si `wsl --install` falla, ejecutar PowerShell **como administrador**:

```powershell
wsl --install
wsl --set-default-version 2
```

### macOS

1. Descargar Docker Desktop eligiendo el chip correcto (**Apple Silicon** para M1/M2/M3,
   **Intel** para los anteriores).
2. Arrastrar Docker a Aplicaciones y abrirlo.
3. Comprobar en Terminal:

```bash
docker --version
docker compose version
```

### Linux (Ubuntu / Debian)

```bash
# Dependencias
sudo apt update
sudo apt install -y ca-certificates curl gnupg git

# Clave GPG oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker Engine y plugin de Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
                    docker-buildx-plugin docker-compose-plugin

# Usar docker sin sudo (cerrar sesión y volver a entrar después)
sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

En **WSL 2** el servicio no arranca solo. Añadir a `~/.bashrc`:

```bash
sudo service docker start
```

## 1.2 Instalar Git

Git es necesario para descargar el proyecto y para enviar cambios. En Windows conviene
instalarlo aunque se use otra terminal, porque **Git Bash** permite usar los mismos
comandos que en macOS y Linux, y así toda la documentación sirve igual para el equipo.

| Sistema | Cómo | Enlace |
|---|---|---|
| Windows | Instalador oficial; incluye Git Bash | https://git-scm.com/download/win |
| macOS | `brew install git`, o se instala al ejecutar `git` la primera vez | https://git-scm.com/download/mac |
| Linux | `sudo apt install git` | https://git-scm.com/download/linux |

Comprobar:

```bash
git --version
```

### GitHub CLI (opcional, pero facilita mucho las credenciales)

`gh` resuelve el inicio de sesión en GitHub sin tener que crear tokens a mano. Es la vía
más cómoda para quien se incorpora al proyecto.

| Sistema | Instalación |
|---|---|
| Windows | https://cli.github.com — o `winget install --id GitHub.cli` |
| macOS | `brew install gh` |
| Linux | https://github.com/cli/cli/blob/trunk/docs/install_linux.md |

## 1.3 Configurar tus credenciales

**Identidad** (aparece en cada commit que hagas):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tucorreo@ejemplo.com"
```

Usa el mismo correo que tienes en GitHub para que los commits se asocien a tu cuenta.

**Autenticación.** GitHub no acepta contraseñas desde 2021: hay que usar un token o una
llave SSH. La forma más simple es con GitHub CLI:

```bash
gh auth login
```

Responde: `GitHub.com` → `HTTPS` → `Y` (autenticar Git con tus credenciales) → `Login
with a web browser`. Copia el código que aparece, pégalo en el navegador y listo. A
partir de ahí `git clone`, `git pull` y `git push` funcionan sin pedir nada.

**Sin GitHub CLI**, se usa un token personal:

1. Entrar a https://github.com/settings/tokens → *Generate new token (classic)*.
2. Marcar el permiso `repo` y generar. Copiar el token: solo se muestra una vez.
3. La primera vez que Git pida contraseña, pegar el token en su lugar.

Para no repetirlo en cada operación, activa el gestor de credenciales:

```bash
# Windows (viene incluido con Git for Windows)
git config --global credential.helper manager

# macOS (guarda en el Llavero del sistema)
git config --global credential.helper osxkeychain

# Linux (guarda en disco; alternativa: libsecret para cifrado real)
git config --global credential.helper store
```

**Con SSH**, si prefieres llaves a tokens:

```bash
ssh-keygen -t ed25519 -C "tucorreo@ejemplo.com"     # Enter en todas las preguntas
cat ~/.ssh/id_ed25519.pub                            # copiar la salida
```

Pegar esa llave en https://github.com/settings/keys y comprobar:

```bash
ssh -T git@github.com
```

## 1.4 Flujo de trabajo

```bash
# Clonar (HTTPS)
git clone https://github.com/<usuario>/SistemaGYM.git
# o con SSH
git clone git@github.com:<usuario>/SistemaGYM.git

cd SistemaGYM
git checkout saas          # rama de trabajo del proyecto

# Traer los cambios del equipo antes de empezar
git pull

# Ver qué has modificado
git status

# Enviar tus cambios
git add .
git commit -m "feat(modulo): descripcion breve de lo que hiciste"
git push
```

> Tras un `git pull` que traiga migraciones o cambios en el `Dockerfile`, hay que
> reconstruir: `docker compose up -d --build`. Y si cambiaron las dependencias del
> móvil, `npm install` dentro de `mobile/`.

Los mensajes de commit del proyecto siguen el formato `tipo(ámbito): descripción`, con
tipos `feat`, `fix`, `docs`, `refactor`, `chore` y `style`. Ayuda a que el registro de
cambios se lea solo.

---

# 2. Arrancar el proyecto

Estos comandos son **idénticos en Windows, macOS y Linux**. En Windows conviene usar
Git Bash o PowerShell.

```bash
# 1. Clonar el repositorio y entrar en la rama de trabajo
git clone <URL-del-repositorio>
cd SistemaGYM
git checkout saas

# 2. Crear el archivo de variables de entorno del backend
cp api/.env.example api/.env
#    Windows sin Git Bash:  copy api\.env.example api\.env

# 3. Editar api/.env con los valores reales (ver el apartado 3)

# 4. Construir las imágenes y levantar todos los servicios
docker compose up -d --build

# 5. Seguir el arranque de la API
docker compose logs -f api
```

Cuando en los registros aparezca `==> Migraciones OK` seguido de las líneas de
gunicorn, el sistema está listo:

| Servicio | Dirección |
|---|---|
| Portal web | http://localhost:8080 |
| API | http://localhost:5000/api/health |

La primera construcción descarga las imágenes base y puede tardar varios minutos.
Las siguientes son mucho más rápidas gracias a la caché.

## 2.1 Comandos del día a día

```bash
# Levantar (sin reconstruir)
docker compose up -d

# Detener conservando los datos
docker compose down

# Reiniciar solo la API tras cambiar api/.env
docker compose restart api

# Reconstruir la API tras cambiar requirements.txt o el Dockerfile
docker compose up -d --build api

# Ver el estado de todos los contenedores
docker compose ps

# Registros de un servicio
docker compose logs -f api
```

> **Nunca uses `docker compose down -v` salvo que quieras vaciar el sistema.** La `-v`
> borra los volúmenes, es decir, **todas las bases de datos**: miembros, pagos,
> asistencias y configuración. No hay deshacer.

## 2.2 Migraciones

El contenedor de la API ejecuta `alembic upgrade head` antes de arrancar gunicorn, así
que las migraciones se aplican solas. Alembic lleva la cuenta de cuáles ya corrieron y
aplica únicamente las que faltan, sin tocar los datos existentes.

Para comprobar en qué revisión está la base:

```bash
docker compose exec postgres psql -U gymuser -d gymprodb -c "SELECT * FROM alembic_version;"
```

Si una base se creó sin Alembic y el arranque falla diciendo que una tabla ya existe,
hay que marcar la revisión correspondiente sin ejecutarla:

```bash
docker compose exec api alembic stamp <revision>
docker compose restart api
```

---

# 3. Configuración (api/.env)

`api/.env` se crea copiando `api/.env.example`. Las conexiones a PostgreSQL, MongoDB y
Redis ya vienen resueltas por el compose; lo que hay que completar son los secretos y
los servicios externos.

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `SECRET_KEY`, `JWT_SECRET_KEY` | Firma de sesiones y tokens | Sí |
| `APP_TIMEZONE` | Zona horaria del gimnasio; determina con qué fecha se guardan ventas, pagos y asistencias | Sí |
| `MAIL_*` | Envío del código de recuperación de contraseña | Para recuperar contraseñas |
| `PLATAFORMA_PAYPAL_*`, `PLATAFORMA_MP_*` | Cobro de las suscripciones del SaaS | Para cobrar suscripciones |
| `PAYMENTS_ENCRYPTION_KEY` | Cifra las credenciales de pago de cada gimnasio | Si se usan pagos |
| `OLLAMA_MODEL` | Modelo local para el ETL de rutinas | No |

Generar secretos:

```bash
docker run --rm python:3.12-slim python -c "import secrets; print(secrets.token_hex(32))"
```

**Zona horaria.** Sin `APP_TIMEZONE` el contenedor usa UTC y un movimiento registrado
por la noche queda guardado con la fecha del día siguiente. Se indica con nombre IANA
(`America/Mexico_City`, `America/Bogota`, `America/Argentina/Buenos_Aires`). Comprobar:

```bash
docker compose exec api python -c "from datetime import datetime; print(datetime.now())"
```

Debe mostrar la hora local, no UTC.

**Correo.** Con Gmail, `MAIL_PASSWORD` no es la contraseña de la cuenta: es una
contraseña de aplicación de 16 letras que se genera en
https://myaccount.google.com/apppasswords (requiere verificación en dos pasos activa).
Se escribe seguida, sin espacios. Detalles y prueba de envío en
[api/README.md](api/README.md).

**Pagos.** El alta en PayPal y Mercado Pago y la configuración por gimnasio están en
[doc/PAGOS_CONFIGURACION.md](doc/PAGOS_CONFIGURACION.md).

> `api/.env` contiene secretos. Si el repositorio es público, conviene sacarlo del
> control de versiones (`git rm --cached api/.env`) y rotar las credenciales.

## 3.1 Cargo recurrente de la suscripción

El gimnasio puede dejar que su plan se cobre solo cada 30 días. **GymPro no guarda
tarjetas ni dispara cargos**: el dueño autoriza una vez en la pasarela y a partir de
ahí es ella quien cobra, igual que Netflix o Spotify. El sistema se limita a preguntar
cómo va el acuerdo y a registrar lo que la pasarela reporta.

Esto es deliberado. Almacenar medios de pago obligaría a cumplir PCI-DSS, y disparar
cargos desde nuestro servidor requiere permisos que PayPal concede caso por caso.

| Pasarela | Qué se crea |
|---|---|
| PayPal | *Subscription* (producto → plan → suscripción) |
| Mercado Pago | *Preapproval* con `auto_recurring` |

Cómo se usa, desde **Mi Suscripción** en la web o el móvil:

1. **Activar cargo recurrente** y elegir la pasarela.
2. El sistema lleva al dueño a PayPal o Mercado Pago para que autorice.
3. Al volver, **Comprobar estado** confirma que el acuerdo quedó activo.
4. La pasarela cobra sola; cada cargo aparece en el historial de facturas.
5. **Cancelar cargo recurrente** lo da de baja. El plan sigue vigente hasta la fecha
   ya pagada.

El paso 3 es necesario porque en desarrollo los webhooks no llegan a `localhost`: sin
él, el acuerdo se quedaría marcado como "pendiente" aunque la pasarela ya lo tuviera
activo. Es la misma reconciliación manual que el sistema ya usa para los pagos de
membresías. En producción, con `PUBLIC_API_URL` apuntando a un dominio real, los
webhooks llegan y el estado se actualiza solo.

Un proceso diario a las 03:00 revisa las suscripciones cuya fecha de cobro ya pasó y
pregunta a la pasarela cómo quedó cada acuerdo. Si sigue activo, lee de ella la nueva
fecha de cobro; si se canceló o quedó suspendido por pagos fallidos, marca la
suscripción como `past_due`. Si la pasarela no responde, no toca nada y reintenta al
día siguiente: cortarle el servicio a un gimnasio que sí pagó por un fallo de red
sería peor que esperar.

Para probarlo en sandbox hace falta `PLATAFORMA_PAYPAL_CLIENT_ID` /
`PLATAFORMA_PAYPAL_SECRET` o `PLATAFORMA_MP_ACCESS_TOKEN` en `api/.env`, con
`PLATAFORMA_PAGOS_MODO=sandbox`. En PayPal hay que activar además *Subscriptions* en
la app de developer.paypal.com; sin eso la creación del plan responde 403.

Para forzar el ciclo diario sin esperar (solo superadministrador):

```bash
curl -X POST http://localhost:8080/api/billing/suscripcion/auto-renovar \
  -H "Authorization: Bearer <token>"
```

---

# 4. Aplicación móvil

La app se ejecuta fuera de Docker, contra la API que corre en los contenedores.

```bash
cd mobile
npm install
npm start
```

El teléfono y la computadora deben estar en la **misma red WiFi**. Instrucciones
completas, generación del development build con EAS y resolución de la URL de la API en
[mobile/README.md](mobile/README.md).

Requisitos: Node.js LTS (https://nodejs.org) y una cuenta de Expo
(https://expo.dev/signup) para compilar con EAS.

---

# 5. Contenedores

| Servicio | Imagen | Puerto (host:contenedor) | Función |
|---|---|---|---|
| postgres | postgres:16-alpine | 5433:5432 | Datos relacionales: usuarios, roles, gimnasios, planes y suscripciones |
| mongo | mongo:7 | 27035:27017 | Datos flexibles: miembros, rutinas, progreso, asistencias, ventas, pagos |
| redis | redis:7-alpine | interno | Caché y límite de peticiones (Flask-Limiter) |
| api | build ./api (Flask + Gunicorn) | 5000 | API REST; aplica migraciones al arrancar |
| web | build ./web (React + nginx) | 8080:80 | Portal; nginx sirve el bundle y redirige `/api/` a `api:5000` |
| ollama | ollama/ollama | 11434:11434 | Modelo de lenguaje local para el ETL de rutinas (opcional) |

Los datos viven en volúmenes de Docker (`pg_data`, `mongo_data`, `ollama_models`) y
sobreviven a `docker compose down`.

---

# 6. Arquitectura

```
   Portal Web (React)      App Móvil (Expo)      Consumidores de API
           \                     |                      /
            \                    |                     /
                       API REST  —  Flask + Gunicorn
                                  |
        ┌──────────────┬──────────┴───────────┬───────────────┐
   PostgreSQL        MongoDB                 Redis           Ollama
  (relacional)     (documental)         (caché/límites)    (IA local)
```

- **Multi-tenant**: cada petición se filtra por el gimnasio del token JWT y la cabecera
  `X-Gym-ID`, lo que aísla los datos entre gimnasios.
- **Autenticación**: JWT con token de acceso (8 horas) y token de refresco (90 días).
  La sesión se renueva sola, así que el usuario no vuelve a escribir su contraseña
  hasta que cierra sesión a propósito.
- **Autorización**: control de acceso por rol en cada blueprint.
- **Seguridad**: contraseñas con hash, credenciales de pago cifradas con Fernet y
  límite de peticiones en los endpoints sensibles (acceso, registro, recuperación).

Roles: Miembro, Entrenador, Recepcionista, Propietario del gimnasio (owner_gym),
Administrador y Superadministrador de la plataforma.

---

# 7. Funcionalidades

**Propietario / administrador.** Panel con indicadores del mes, miembros, tipos de
membresía (con beneficios, combos y promociones con caducidad), punto de venta con
inventario, movimientos filtrables por mes y año, reportes en PDF configurables por
periodo y secciones, personal, suscripción del gimnasio al SaaS y respaldos.

**Miembro.** Rutina asignada y rutinas propias con grupos musculares y unidades kg/lb,
registro de entrenamiento con autoselección del día, nutrición y recetas, salud y
progreso físico, predicción de peso, membresía y pagos, punto de venta, y elección,
cambio y calificación de entrenador con chat.

**Entrenador.** Clientes con ficha detallada, rutinas y dietas, agenda de sesiones,
solicitudes de entrenamiento personal, certificaciones con documento adjunto, reportes
de desempeño y mensajería.

**Recepción.** Registro de asistencias y consulta de miembros.

**Superadministrador.** Gimnasios, planes, suscripciones, usuarios de la plataforma y
laboratorio de modelos de aprendizaje automático.

**Pagos.** Efectivo, PayPal y Mercado Pago en membresías, productos del punto de venta
y suscripciones al SaaS. Cada gimnasio configura las cuentas donde recibe su dinero;
las suscripciones las cobra la plataforma con sus propias credenciales.

**Inteligencia artificial** (scikit-learn en proceso): riesgo de abandono, laboratorio
de modelos con regresión y clasificación, segmentación de clientes con K-Means y
predicción de peso corporal.

---

# 8. Estructura del proyecto

```
SistemaGYM/
├── api/                     Backend Flask (API REST) e IA
│   ├── app/                 Modelos, rutas por rol, servicios y utilidades
│   ├── migrations/          Migraciones de Alembic
│   ├── Dockerfile
│   └── .env.example         Plantilla de variables de entorno
├── web/                     Portal React (Vite), servido por nginx
├── mobile/                  Aplicación Expo / React Native
│   └── docs/                Sistema de color de la app
├── doc/                     Documentación técnica, propuestas y diagramas
├── docker-compose.yml       Desarrollo
├── docker-compose.prod.yml  Producción
└── README.md
```

---

# 9. Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Backend | Python 3.12, Flask, Gunicorn, SQLAlchemy, Alembic, PyMongo, Flask-JWT-Extended, Flask-Mail, Flask-Limiter, ReportLab |
| IA y analítica | scikit-learn, pandas, NumPy, Ollama |
| Web | React, Vite, React Router, Axios, Recharts |
| Móvil | React Native, Expo, expo-router, TypeScript, Axios |
| Datos | PostgreSQL 16, MongoDB 7, Redis 7 |
| Pagos | PayPal Orders API v2, Mercado Pago Checkout Pro |
| Infraestructura | Docker, Docker Compose, nginx |

---

# 10. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `exec /app/entrypoint.sh: no such file or directory` | Finales de línea de Windows (CRLF) en el script | Ya resuelto en el repositorio; ver el recuadro de abajo |
| `host not found in upstream "api"` en el contenedor `web` | La API está en bucle de reinicio, no es un problema de red | Resolver primero el error de `api`: `docker compose logs api` |
| `permission denied` al guardar respaldos o fotos de perfil | Las carpetas `backups/` o `uploads/` las creó Docker como `root` | Ya resuelto con `.gitkeep`; si persiste: `sudo chown -R 1000:1000 backups uploads` |
| `port is already allocated` | Otro proceso ocupa 8080, 5000 o 5433 | Liberar el puerto o cambiar el mapeo en `docker-compose.yml` |
| El contenedor `api` queda en `unhealthy` | Falló una migración o falta una variable | `docker compose logs api` |
| Las fechas se guardan con un día de diferencia | Falta `APP_TIMEZONE` | Añadirla a `api/.env` y `docker compose up -d --build api` |
| El correo de recuperación no llega | Se usó la contraseña de la cuenta y no una de aplicación | Ver el apartado 3; revisar `docker compose logs api \| grep forgot-password` |
| El cargo recurrente se queda en "pendiente" | Falta terminar de autorizarlo, o el webhook no llegó a `localhost` | Pulsar **Comprobar estado** en Mi Suscripción; ver el apartado 3.1 |
| PayPal responde 403 al activar el cargo recurrente | La app de sandbox no tiene habilitado *Subscriptions* | Activarlo en developer.paypal.com → Apps & Credentials → tu app |
| La app móvil no conecta con la API | Teléfono en otra red, o la IP no coincide | Misma WiFi; ver [mobile/README.md](mobile/README.md) |
| `docker: command not found` en WSL | El servicio no está arrancado | `sudo service docker start` |
| Falta espacio en disco | Imágenes y capas huérfanas | `docker system prune -a` (no toca los volúmenes de datos) |

## 10.1 Por qué el proyecto no arrancaba en algunas computadoras

Durante un tiempo el mismo commit levantaba los contenedores en una computadora
y fallaba en otra. El síntoma eran dos errores encadenados:

```
api  | exec /app/entrypoint.sh: no such file or directory
web  | host not found in upstream "api" in /etc/nginx/conf.d/app.conf:50
```

El segundo era una consecuencia: nginx no podía resolver un contenedor que
estaba reiniciándose sin parar. El verdadero problema era el primero, y el
mensaje engañaba, porque el archivo sí existía y `chmod +x` funcionaba.

La causa era el final de línea. Al descargar el proyecto en Windows, Git podía
convertir `entrypoint.sh` a CRLF (`\r\n`). El kernel de Linux entonces lee el
shebang como `#!/bin/sh\r`, busca un intérprete llamado `sh\r` que no existe y
aborta con ese mensaje de "archivo no encontrado".

Queda resuelto en el repositorio con tres defensas, **no hay que hacer nada al
clonar**:

1. **`.gitattributes`** declara `* text=auto` y fuerza LF en `.sh`, `Dockerfile`,
   `.yml` y `.conf`. Así el resultado de `git clone` ya no depende de la
   configuración personal de `core.autocrlf` de cada quien.
2. **`api/Dockerfile`** normaliza el archivo durante el build
   (`sed -i 's/\r$//' /app/entrypoint.sh`). Esto cubre lo que el punto anterior
   no puede: `docker build` copia desde el disco, no desde Git, así que un
   editor que guarde el archivo con CRLF rompería el arranque aun con el
   repositorio correcto.
3. **`web/nginx.conf`** resuelve `api` en tiempo de ejecución con
   `resolver 127.0.0.11` en lugar de exigirlo al iniciar, de modo que el
   contenedor `web` ya no muere si la API tarda en levantar.

Si alguna vez vuelves a ver ese error, comprueba los finales de línea así:

```powershell
# Windows (PowerShell)
Get-Content .\api\entrypoint.sh -Raw | Select-String "`r"
```

```bash
# Git Bash, macOS o Linux — debe decir "LF", no "CRLF"
file api/entrypoint.sh
```

Si aparece CRLF, basta con volver a normalizar y reconstruir:

```bash
git add --renormalize .
docker compose up -d --build api
```

---

# 11. Despliegue

- **Desarrollo**: `docker compose up -d --build`
- **Producción**: `docker compose -f docker-compose.prod.yml up -d --build api web`,
  sobre un servidor Linux con credenciales productivas y HTTPS.
- **Móvil**: compilación con EAS y publicación en Google Play; ver
  [mobile/README.md](mobile/README.md).

---

## Licencia

Proyecto desarrollado con fines académicos y profesionales en la Incubadora TIC de la
Universidad Tecnológica del Valle de Toluca.
