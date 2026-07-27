# Pagos en línea con PayPal y Mercado Pago

Guía de puesta en marcha del módulo de cobros de GymPro.

---

## 1. Modelo adoptado

**Credenciales propias por gimnasio.** Cada gimnasio registra sus propias
credenciales desde la aplicación, de modo que el dinero de **membresías** y
**productos** se deposita **directamente en su cuenta**. La plataforma no
custodia ni retiene esos fondos, lo que evita requisitos de licencia financiera.

Las **suscripciones SaaS** (el gimnasio paga su plan a GymPro) se cobran con las
credenciales de la plataforma, definidas en `api/.env`.

| Contexto de cobro | Quién paga | A qué cuenta llega | Credenciales |
|---|---|---|---|
| `membresia` | El miembro | Cuenta del gimnasio | Las que carga el dueño en la app |
| `producto` | El cliente (POS) | Cuenta del gimnasio | Las que carga el dueño en la app |
| `suscripcion` | El gimnasio | Cuenta de GymPro | Variables de entorno de la plataforma |

---

## 2. Qué debes hacer tú (paso a paso)

### Paso 1 — Generar la clave de cifrado (obligatorio)

Las credenciales de los gimnasios se guardan cifradas. Genera una clave propia:

```bash
docker compose exec api python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copia el resultado en `api/.env`:

```
PAYMENTS_ENCRYPTION_KEY=<la clave generada>
```

> El archivo `api/.env.example` ya trae una clave de desarrollo funcional. Para
> producción genera una nueva y **no la pierdas**: si cambia, los gimnasios
> tendrán que volver a capturar sus credenciales.

### Paso 2 — Registrarte en PayPal (para pruebas y para la plataforma)

1. Entra a **https://developer.paypal.com** e inicia sesión (o crea una cuenta).
2. Ve a **Dashboard → Apps & Credentials**.
3. Selecciona la pestaña **Sandbox** (pruebas) y pulsa **Create App**.
   - Nombre: `GymPro` · Tipo: **Merchant**.
4. Copia el **Client ID** y el **Secret** que aparecen.
5. Para probar cobros, PayPal crea cuentas de comprador de prueba en
   **Testing Tools → Sandbox Accounts** (usa esa cuenta al pagar, no la tuya).
6. Cuando quieras cobrar dinero real, repite en la pestaña **Live** (requiere
   cuenta PayPal Business verificada).

### Paso 3 — Registrarte en Mercado Pago

1. Entra a **https://www.mercadopago.com.mx/developers** e inicia sesión.
2. Ve a **Tus integraciones → Crear aplicación**.
   - Producto: **Pagos en línea** · Modelo: **Checkout Pro**.
3. Abre la aplicación creada y entra a **Credenciales de prueba**.
4. Copia el **Access Token** (empieza con `TEST-`) y la **Public Key**.
5. Mercado Pago genera usuarios de prueba en **Cuentas de prueba** (crea uno
   comprador y uno vendedor para simular el flujo completo).
6. Para dinero real, usa **Credenciales de producción** (`APP_USR-...`), lo que
   requiere completar los datos fiscales de la cuenta.

### Paso 4 — Cargar las credenciales de la plataforma (solo suscripciones SaaS)

En `api/.env`:

```
PLATAFORMA_PAYPAL_CLIENT_ID=<client id de tu app PayPal>
PLATAFORMA_PAYPAL_SECRET=<secret de tu app PayPal>
PLATAFORMA_MP_ACCESS_TOKEN=<access token de Mercado Pago>
PLATAFORMA_PAGOS_MODO=sandbox
PLATAFORMA_PAGOS_MONEDA=MXN
FRONTEND_URL=http://localhost:8080
```

Si dejas estas variables vacías, el cobro de suscripciones queda desactivado
pero **membresías y productos siguen funcionando** (usan las credenciales que
carga cada gimnasio).

### Paso 5 — Aplicar la migración y levantar

```bash
docker compose up --build -d
```

El contenedor de la API ejecuta `alembic upgrade head` al arrancar, creando las
tablas `configuracion_pasarela` y `transacciones_pago` (migración `011`).

### Paso 6 — Configurar un gimnasio desde la app

1. Inicia sesión como **dueño del gimnasio**.
2. Menú lateral → **Configuración → Cobros en línea**.
3. Pega el Client ID / Secret (PayPal) o el Access Token / Public Key (Mercado Pago).
4. Deja el modo en **Pruebas**, elige la moneda y pulsa **Guardar**.
5. Pulsa **Probar conexión**: debe responder que la conexión es correcta.
6. Pulsa **Activar cobros**. A partir de ahí aparecen los botones de pago.

---

## 3. Webhooks (notificaciones de la pasarela)

Los webhooks permiten que la pasarela avise al sistema cuando un pago se acredita,
incluso si el usuario cerró el navegador.

- **Endpoint:** `POST /api/pagos/webhook/paypal` y `POST /api/pagos/webhook/mercadopago`
- Están exentos de autenticación JWT (la pasarela no envía token).

En **local no llegan**, porque `localhost` no es accesible desde internet. Para
probarlos, expón la API con un túnel:

```bash
ngrok http 5000
```

y coloca la URL pública en `api/.env`:

```
PUBLIC_API_URL=https://<tu-subdominio>.ngrok-free.app
```

Después regístrala en cada proveedor:

- **PayPal:** Dashboard → tu App → *Webhooks* → *Add Webhook*, URL
  `https://<tu-dominio>/api/pagos/webhook/paypal`, eventos:
  `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`.
- **Mercado Pago:** Tus integraciones → tu App → *Webhooks*, URL
  `https://<tu-dominio>/api/pagos/webhook/mercadopago`, evento **Pagos**.

> Aunque no configures webhooks, el sistema **igual confirma el pago**: al
> regresar del checkout consulta el estado directamente contra la pasarela
> (`GET /api/pagos/estado/<id>`). Los webhooks son el respaldo asíncrono.

---

## 4. Qué se implementó en el proyecto

### API (`api/`)

| Archivo | Contenido |
|---|---|
| `app/models/pg/pasarela_pago.py` | Modelos `ConfiguracionPasarela` y `TransaccionPago` |
| `app/utils/crypto.py` | Cifrado Fernet de credenciales |
| `app/services/payments/base.py` | Interfaz común de pasarelas |
| `app/services/payments/paypal.py` | Proveedor PayPal (Orders API v2) |
| `app/services/payments/mercadopago.py` | Proveedor Mercado Pago (Checkout Pro) |
| `app/services/payments/factory.py` | Resuelve credenciales de gimnasio o plataforma |
| `app/routes/owner_gym/pasarelas.py` | Configuración de cobros del gimnasio |
| `app/routes/pagos_online.py` | Checkout, estado y webhooks |
| `migrations/versions/011_pasarelas_pago.py` | Migración de las tablas |

**Endpoints principales**

```
GET    /api/owner/pasarelas              estado de configuración
PUT    /api/owner/pasarelas/<proveedor>  guardar credenciales
POST   /api/owner/pasarelas/<p>/probar   verificar credenciales
PATCH  /api/owner/pasarelas/<p>/toggle   activar / desactivar
GET    /api/pagos/metodos                métodos activos del gimnasio
POST   /api/pagos/checkout               crear cobro -> URL de pago
GET    /api/pagos/estado/<id>            confirmar estado
POST   /api/pagos/webhook/<proveedor>    notificación de la pasarela
```

### Web (`web/`)

| Archivo | Contenido |
|---|---|
| `src/api/pagos.js` | Cliente HTTP de pagos |
| `src/pages/owner_gym/OwnerPagos.jsx` | Pantalla de configuración de cobros |
| `src/components/compartido/BotonesPago.jsx` | Botones de pago reutilizables |
| `src/pages/publico/PagoResultado.jsx` | Páginas de retorno éxito / cancelado |

Rutas nuevas: `/owner/pagos-online`, `/pago/exito`, `/pago/cancelado`.

### Móvil (`mobile/`)

| Archivo | Contenido |
|---|---|
| `services/pagos.ts` | Checkout con navegador seguro y deep link `gympro://` |
| `components/BotonesPago.tsx` | Botones de pago nativos |

Requiere instalar la dependencia añadida:

```bash
cd mobile && npm install
```

---

## 5. Cómo integrar el pago en una pantalla existente

**Web:**

```jsx
import BotonesPago from "../../components/compartido/BotonesPago";

<BotonesPago
  contexto="membresia"
  monto={499}
  descripcion="Membresía mensual - Juan Pérez"
  referenciaLocal={idMiembro}
/>
```

**Móvil:**

```tsx
import BotonesPago from '../components/BotonesPago';

<BotonesPago
  contexto="membresia"
  monto={499}
  descripcion="Membresía mensual"
  referenciaLocal={idMiembro}
  onPagado={() => recargar()}
/>
```

---

## 6. Resumen de costos y requisitos

| Concepto | PayPal | Mercado Pago |
|---|---|---|
| Registro de cuenta de desarrollador | Gratis | Gratis |
| Pruebas (sandbox) | Gratis, sin dinero real | Gratis, sin dinero real |
| Comisión en producción | Según país y volumen | Según país y plazo de liberación |
| Requisito para dinero real | Cuenta Business verificada | Cuenta con datos fiscales |

No se requiere aprobación de partner ni contrato de marketplace, porque cada
gimnasio cobra con su propia cuenta.
