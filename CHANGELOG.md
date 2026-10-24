# Registro de cambios — GymPro

Historial de lo que se ha ido incorporando al sistema, con el estado de su
documentación. Sirve para dos cosas: saber qué se hizo y cuándo, y detectar lo que ya
funciona pero todavía no está documentado o cerrado del todo.

Las versiones agrupan trabajo por bloques temáticos, no por publicaciones formales. La
fecha es la del último commit del bloque.

**Cómo leer las etiquetas de estado:**

| Etiqueta | Significado |
|---|---|
| Completo | Funciona y está documentado |
| Sin documentar | Funciona, falta escribirlo en algún README o manual |
| Parcial | Implementado a medias o solo en una plataforma |
| Pendiente | Identificado pero no empezado |

---

## Sin publicar — pendientes conocidos

Lo que está detectado y aún no se ha resuelto. Es el punto de partida para planear el
siguiente cuatrimestre.

| Tema | Detalle | Estado |
|---|---|---|
| Bloqueo por plan de suscripción | Los planes ya guardan sus límites en el campo `limites` (JSON) y el modelo tiene el método `permite()`, pero **ningún módulo lo consulta todavía**. Falta aplicar el bloqueo real: máximo de miembros, acceso a analítica, número de administradores | Pendiente |
| `api/.env` versionado | El archivo con secretos sigue en el repositorio. Hay que sacarlo con `git rm --cached api/.env` y rotar credenciales si el repositorio es público | Pendiente |
| Webhooks de pago | En desarrollo no llegan a `localhost`, por eso existe la reconciliación manual. En producción con dominio público habría que activarlos y quitar esa muleta | Parcial |
| Manuales de usuario | Solo MU-04 se entregó en el formato nuevo; faltan MU-01, MU-02, MU-03 y MU-05 | Parcial |
| Combos de membresías y productos | Se muestran en el móvil pero solo se editan desde el portal web | Parcial |
| Imágenes de productos | Se administran únicamente desde la web; el móvil no las sube | Parcial |
| Reportes del propietario | El PDF se descarga; podría verse dentro de la app con el visor ya construido para certificados | Pendiente |
| Almacenamiento de archivos | Fotos, logotipos y certificados se guardan como base64 en la propia base. Funciona, pero un servidor de archivos u objeto sería lo correcto al crecer | Pendiente |
| Webhooks del cargo recurrente en producción | Funciona con reconciliación manual. Al desplegar con dominio público hay que registrar la URL de webhook en PayPal y Mercado Pago para que el estado se actualice solo | Parcial |

---

## v1.1 — Predicciones que sí predicen y gráficos que se explican · 7 de agosto de 2026

**Predicciones** · Completo

- Corregido el fallo por el que "Mi Predicción" mostraba "6 / 3 registros" con la
  barra llena y, debajo, que faltaban datos. La predicción individual exigía que el
  modelo del gimnasio estuviera entrenado —10 registros repartidos entre varios
  miembros—, así que alguien con seis mediciones propias se quedaba sin proyección.
  Ahora hay un segundo modelo que ajusta una recta sobre el historial del propio
  miembro y basta con tres mediciones. Es además más fiel para el individuo, porque
  describe su tendencia real en lugar de aplicarle los coeficientes promedio.
- El modelo del gimnasio entrenaba solo con miembros en estado "Activo". Las
  mediciones de un miembro con la membresía vencida siguen siendo válidas para
  relacionar peso con tiempo, y descartarlas dejaba sin datos a gimnasios donde la
  mayoría figura como inactiva.
- Cuando de verdad faltan datos, la respuesta dice cuántos registros hay y cuántos
  se necesitan, en vez de un mensaje genérico. La pantalla usa esas cifras en lugar
  de contarlas por su cuenta, que era el origen de la contradicción.
- La proyección se acota a un rango humano: un ajuste lineal extrapolado a seis
  meses podía dar pesos negativos o de 300 kg.

**Gráficos** · Completo

- Nuevo componente `InfoGrafico` con un botón "Cómo leerlo" que explica qué
  representa cada color, de dónde salen los datos y cómo interpretar los ejes.
  Aplicado a las predicciones de los tres roles, al panel del propietario y a
  Finanzas y Flujo.
- Paleta única con significado fijo: el dinero, lo medido y lo proyectado se ven
  igual en todo el sistema, sin tener que releer la leyenda en cada pantalla.

**Reportes** · Completo

- Los PDF admiten gráficas: reparto por método de pago, origen de los ingresos,
  rankings de membresías y productos, sesiones mes a mes y tipos de sesión. Se
  dibujan con `reportlab.graphics`, que ya venía incluido, en lugar de añadir
  matplotlib y unos 60 MB a la imagen de Docker.
- Casilla "Incluir gráficas" en el reporte del propietario y en el del entrenador,
  tanto en web como en móvil.

**Mis Clientes del entrenador** · Completo

- La edad mostraba un "?" porque el backend nunca la enviaba. Ahora se calcula y,
  si no hay fecha de nacimiento, se omite en lugar de pintar un interrogante que
  parecía un error.
- La ficha del cliente incorpora correo, teléfono, sexo, antigüedad y su última
  medición corporal con peso, IMC y grasa.

**Limpieza** · Completo

- Retirados los emojis que el backend enviaba en las alertas del panel. El icono es
  decisión de presentación y cada cliente elige el suyo según el nivel de la alerta.
- Las casillas del reporte del entrenador usan iconos en lugar de caracteres.

---

## v1.0 — Paridad web/móvil, respaldos y arranque reproducible · 5 de agosto de 2026

**Arranque en cualquier computadora** · Completo

- Resuelto el fallo que impedía levantar los contenedores en algunas computadoras:
  `exec /app/entrypoint.sh: no such file or directory`, seguido de
  `host not found in upstream "api"` en nginx. La causa eran los finales de línea de
  Windows (CRLF) en el script de arranque; el segundo error era solo una consecuencia
  del primero. Explicado a fondo en el apartado 10.1 del README.
- `.gitattributes` ampliado con `* text=auto` y reglas explícitas para `.sh`,
  `Dockerfile`, `.yml` y `.conf`. El resultado de `git clone` ya no depende de la
  configuración personal de `core.autocrlf` de cada quien.
- `api/Dockerfile` normaliza el `entrypoint.sh` durante el build. Cubre el caso que el
  punto anterior no puede: `docker build` copia desde el disco, no desde Git.
- `backups/` y `uploads/` viajan con un `.gitkeep`. Antes no existían en un clon nuevo,
  Docker las creaba como `root` y el contenedor —que corre como `gymuser`— no podía
  escribir respaldos ni fotos de perfil.

**Respaldos** · Completo

- El respaldo por gimnasio guardaba las rutinas pero no sus días ni sus ejercicios, así
  que al restaurar aparecían rutinas vacías. Se añadió la cascada completa
  `rutinas → rutina_dias → rutina_ejercicios`, las asignaciones a miembros, y las
  colecciones que faltaban: chats, citas, solicitudes PT, recetas, consumos, métricas
  históricas, entrenamientos y las certificaciones y perfiles del staff.
- El Excel y el PDF del respaldo global solo recorrían MongoDB. Ahora incluyen las
  tablas de PostgreSQL —entre ellas el catálogo de ejercicios—, dejando fuera a
  propósito las credenciales cifradas de las pasarelas de pago.
- La restauración descarta documentos de otro gimnasio en lugar de mezclarlos.

**Cobro recurrente de la suscripción** · Completo

- `auto_renovar` era una casilla que se guardaba y nadie leía: activarla no renovaba
  ni cobraba nada. Ahora el cargo recurrente es real, con **PayPal Subscriptions** y
  **Mercado Pago Preapproval**.
- El modelo es el de cualquier SaaS: el dueño autoriza una vez en la pasarela y ella
  cobra sola cada 30 días. GymPro no guarda tarjetas ni dispara cargos, así que no
  queda sujeto a PCI-DSS ni depende de permisos especiales de PayPal.
- La capa de pasarelas gana un contrato de suscripciones (`crear_suscripcion`,
  `consultar_suscripcion`, `cancelar_suscripcion`) que normaliza el vocabulario de
  ambos proveedores: PayPal dice `ACTIVE` y Mercado Pago `authorized`, y quien
  consume la capa no debería tener que saberlo.
- El ciclo diario dejó de renovar a ciegas y pasó a reconciliar: pregunta a la
  pasarela cómo quedó cada acuerdo y registra lo que reporta. Si la pasarela no
  responde, no toca la suscripción y reintenta al día siguiente, porque cortarle el
  servicio a un gimnasio que sí pagó por un fallo de red sería peor.
- El interruptor de la web y del móvil se sustituyó por el flujo real de
  autorización, con un botón para comprobar el estado al volver de la pasarela. Un
  acuerdo creado pero sin autorizar ahora se ve como tal en lugar de aparentar estar
  activo.
- Las facturas de un cobro recurrente llevan la referencia del cargo, con
  restricción de unicidad: las pasarelas reenvían la misma notificación si no reciben
  respuesta, y sin eso el historial mostraría el doble de lo cobrado.
- Migración 015. Documentado en el apartado 3.1 del README.

**Limpieza** · Completo

- Eliminado `web/src/pages/owner_gym/sedkodaW0`, una copia antigua de
  `POSProductoModal.jsx` anterior a los combos que nadie importaba.

**Propietario** · Completo

- Panel de control sincronizado entre web y móvil: el móvil incorpora los indicadores
  que le faltaban (punto de venta, tipos de membresía, mes anterior, recepcionistas),
  más alertas operativas y actividad reciente.
- La web dejó de mostrar una variación engañosa cuando no hay mes previo con ingresos.
- Pagos y punto de venta en la web con filtro por año y mes, y el total de todo el
  filtro, no solo de la página visible.

**Entrenador** · Completo

- Reporte de desempeño en PDF con filtros de año, mes y secciones. Lo genera el
  servidor y lo consumen igual la web y el móvil, así que ambos documentos son el
  mismo. Nuevo módulo `api/app/routes/entrenador/reportes_entrenador.py`.
- Alta y edición de ejercicios desde el móvil, y creación de rutinas completas en dos
  pasos eligiendo de la biblioteca personal.

**Miembro** · Completo

- Marcar un día de rutina como completado desde el móvil: registra la bitácora, cuenta
  la asistencia del día y alimenta la racha y las gráficas de progreso.
- Plan alimenticio completo. Antes solo leía las comidas planas e ignoraba la
  estructura `semanas → días → comidas` que usa el entrenador, y por eso el plan se
  veía a medias.
- Recetas con imagen y ficha de detalle con ingredientes y preparación. Los valores
  nutrimentales no aparecían porque llegan como `proteinas_g` y se leían como
  `proteinas`.
- Comprobantes del punto de venta en el móvil, para propietario y miembro, con opción
  de compartir.
- Se retiraron los accesos rápidos del panel web: repetían punto por punto el menú
  lateral, que está siempre visible.

---

## v0.9 — Documentación y puesta a punto · 4 de agosto de 2026

**Documentación** · Completo

- README principal reescrito con instalación desde cero para Windows, macOS y Linux,
  enlaces oficiales de descarga, configuración de Git y credenciales, comandos del día a
  día, migraciones y tabla de problemas frecuentes.
- Se documentaron seis variables de entorno que existían en `.env.example` pero no
  aparecían en ningún README: `ALLOWED_ORIGINS`, `FRONTEND_URL`, `PUBLIC_API_URL`,
  `MONGO_DB`, `POSTGRES_URI` y `SPARK_ENABLED`.
- README de la API: pruebas de correo y zona horaria, tabla de endpoints ampliada y
  explicación del esquema de tokens.
- README del móvil: dependencias nativas y cuándo obligan a regenerar el build.
- README de la web: apartado de pagos y distinción entre credenciales de gimnasio y de
  plataforma.
- Este registro de cambios.

---

## v0.8 — Sesión persistente y perfiles · 31 de julio de 2026

**Sesión que no caduca** · Completo

- El acceso entrega un token de refresco de 90 días además del de acceso de 8 horas.
  Nuevo endpoint `POST /api/auth/refresh`.
- El interceptor del móvil renueva el token y reintenta la petición en vez de expulsar
  al usuario. Las peticiones simultáneas comparten un único refresco.
- Al renovar se revalidan el rol y el estado contra la base, de modo que una baja surte
  efecto en la siguiente renovación.

**Certificaciones con documento** · Completo

- El entrenador adjunta el certificado en PDF o imagen, con límite de 3 MB.
- El miembro lo previsualiza desde la ficha del entrenador, antes o después de
  contratarlo. Los PDF se renderizan dentro de la aplicación con PDF.js sobre un WebView,
  que es la única forma de que Android e iOS se comporten igual.
- Corregido: el móvil trataba las certificaciones como texto cuando la API devuelve un
  arreglo de objetos, así que siempre aparecían vacías.

**Perfiles** · Completo

- Migración `014`: `usuarios.telefono` y `gimnasios.logo`.
- Nuevo `PUT /api/owner_gym/perfil/propietario` para editar los datos de la persona,
  separado del endpoint del gimnasio.
- Foto de perfil del propietario y logotipo del gimnasio desde la galería.
- Rol centrado bajo el nombre en los cuatro perfiles.

**Nuevas dependencias nativas** (obligan a regenerar el development build):
`expo-image-picker`, `expo-document-picker`, `react-native-webview`.

---

## v0.7 — Zona horaria, auditoría de datos y cierre de los tres roles · 31 de julio de 2026

**Zona horaria** · Completo — *afectaba a todos los registros*

- La imagen de la API no incluía `tzdata` y el contenedor corría en UTC, así que las
  ~100 llamadas a `datetime.now()` guardaban la hora equivocada: un movimiento de las
  19:00 quedaba registrado con la fecha del día siguiente.
- Se instaló `tzdata` y se añadió `TZ`/`APP_TIMEZONE`, lo que corrige todos los puntos de
  escritura sin tocar el código.
- El mismo fallo existía en el cliente: `toDateStr` usaba `toISOString()`, que convierte
  a UTC. Ahora lee la fecha local del dispositivo.

**Datos incorrectos del propietario** · Completo

- «Por vencer» daba siempre 0 por tres motivos acumulados: consultaba una colección con
  el nombre en plural que no existe, filtraba el estado en minúscula cuando se guarda
  capitalizado, y buscaba un campo de gimnasio que esa colección no tiene.
- «Ingresos del mes» ignoraba el punto de venta, así que el panel mostraba $0 mientras
  Reportes mostraba el importe real. Ahora es el total con desglose.
- En Reportes, el total del mes contaba el punto de venta dos veces y la fila
  «Membresías» mostraba el total en vez de su parte.
- El historial de cobros pintaba los centavos como pesos: una factura de $499 aparecía
  como $49,900.
- «Mi Perfil» del propietario mostraba los datos del gimnasio en lugar de los suyos.

**Filtros e historial** · Completo

- Movimientos y ventas filtrables por mes y año, con paginación. El importe que se
  muestra es el del filtro completo, no el de la página visible.
- Componentes compartidos `SelectorPeriodo` y `Paginador`.

**Reportes** · Completo

- Nuevo `GET /api/owner_gym/reportes/pdf`: reporte ejecutivo con portada e identidad del
  gimnasio, periodo y secciones a elegir, y comparativa opcional contra el periodo
  anterior. El anterior era un volcado de analítica sin personalizar.

**Cierre de los tres roles** · Completo

- Miembro: detalle de rutina ejercicio por ejercicio, perfil del entrenador con
  certificaciones y calificación —que además libera la pantalla donde el chat quedaba
  aplastado—, y autoselección del día en Registrar Entrenamiento.
- Entrenador: ficha de clientes, agenda con hora seleccionable y cliente obligatorio
  limitado a los suyos, y ver/editar en dietas y recetas.
- Propietario: membresías editables desde el móvil y Perfil del Gym con el tipo elegido
  de un catálogo, mostrado en lenguaje natural.

**Tipos de TypeScript** · Completo

- El `tsconfig.json` tenía `baseUrl`, deprecado en TS 7.0, y eso hacía que `tsc` muriera
  antes de revisar el código. Al corregirlo salieron a la luz ~300 errores preexistentes.
- La causa de unos 270 era que `toArray<T>` no tenía valor por defecto en el genérico:
  cada llamada sin tipo explícito infería `unknown[]`.
- `CustomDrawer` declara ahora solo las cuatro props que consume, porque expo-router y
  `@react-navigation/drawer` traen copias distintas de los mismos tipos.

---

## v0.6 — Pagos en línea · 27 al 29 de julio de 2026

**PayPal y Mercado Pago** · Completo

- Integración con credenciales por gimnasio, cifradas con Fernet. Cada gimnasio decide a
  qué cuenta llega su dinero; las suscripciones al SaaS las cobra la plataforma con las
  suyas.
- Disponible en membresías, productos del punto de venta y suscripciones, tanto en web
  como en móvil.
- Migración `011`: pasarelas y transacciones.
- El pago aprobado aplica su efecto de verdad: renueva la membresía respetando los días
  restantes, registra la venta y descuenta el inventario, incluidos los componentes de
  los combos.
- Reconciliación para desarrollo: como los webhooks no alcanzan `localhost`, las
  pantallas de cobro recuperan los pagos que quedaron pendientes.
- Retorno a la app móvil mediante el enlace profundo `gympro://`. Antes la URL de retorno
  apuntaba a `localhost`, inalcanzable desde el teléfono.
- Métodos unificados a efectivo, PayPal y Mercado Pago en todo el sistema.

**Membresías y punto de venta** · Parcial *(los combos solo se editan desde la web)*

- Migración `012`: planes SaaS con características, límites y destacado.
- Migración `013`: beneficios, combos y fecha de caducidad en las membresías.
- Promociones con vigencia que se destacan visualmente y dejan de ofrecerse al vencer.

**Sistema de color del móvil** · Completo

- `constants/themes.ts` como única fuente: 45 tokens con significado, no estético.
  Ninguna pantalla escribe colores a mano.
- Se eliminó `constants/Colors.ts`, una segunda paleta que 23 archivos importaban sin
  usar.
- Documentado en `mobile/docs/SISTEMA-DE-COLOR.md`.

**Otros del móvil** · Completo

- Carrusel horizontal de planes con desplazamiento por posiciones e indicadores.
- Punto de venta del propietario con alta, edición y baja de productos.
- Ficha detallada de miembros y de staff.
- Pantalla de suscripción del propietario.

---

## v0.5 — Analítica y despliegue · 14 de julio de 2026

**Laboratorio de modelos** · Completo

- Los módulos de K-Means, regresión y modelos pasaron del propietario al
  superadministrador.
- Método del codo y coeficiente de silueta, y flujo de entrenamiento, prueba y error en
  cinco pasos, con datos reales por gimnasio.

**Infraestructura** · Completo

- nginx resuelve el backend por DNS dinámico, lo que evita el fallo «host not found in
  upstream» y las direcciones obsoletas tras reiniciar.
- `env_file` en cascada: un clon nuevo arranca sin crear `.env` a mano.
- Construcción más rápida con caché de pip y npm.

---

## v0.4 — Recuperación de contraseña · 4 al 8 de julio de 2026

· Completo

- Código de 6 dígitos por correo, guardado con hash y 15 minutos de vigencia.
- La respuesta es siempre la misma exista o no la cuenta, para no revelar qué correos
  están registrados. Como efecto, un fallo de envío solo se ve en los registros.

---

## v0.3 — Móvil: entrenamiento y entrenadores · 2 al 4 de julio de 2026

· Completo

- «Mi Rutina»: el miembro crea y edita sus propias rutinas con grupos musculares y
  unidades kg/lb.
- Predicción de peso con gráfica, reportes de entrenador y recordatorios locales.
- Calificación de entrenador, cambio de entrenador conservando el historial, y
  suscripción del propietario con cargo recurrente.
- Corregido: el historial del cliente omitía las rutinas asignadas por entrenadores
  anteriores.

---

## Cómo mantener este registro

Al cerrar un bloque de trabajo, añadir una entrada con:

1. **Qué cambió**, en términos de lo que el usuario puede hacer ahora.
2. **Por qué**, cuando se corrigió un error: la causa concreta, no solo el síntoma. Es
   lo que evita repetirlo.
3. **Estado de la documentación**, para que lo no documentado quede a la vista.
4. **Migraciones o dependencias nuevas**, que es lo que obliga a los demás a reconstruir.

Para ver los commits de un periodo:

```bash
git log --pretty=format:"%ad %s" --date=short --since="2026-07-01"
```
