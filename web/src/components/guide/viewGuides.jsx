/**
 * viewGuides.jsx — Guía contextual por VISTA.
 *
 * Para cada ruta del sistema se define un recorrido paso a paso que explica, en
 * lenguaje sencillo, qué significa cada componente que el usuario ve en esa
 * pantalla. Cubre las vistas de los 4 roles comerciales (dueño, miembro,
 * entrenador, recepción). Solo iconos (react-icons), sin emojis.
 */
import {
  FiInfo, FiGrid, FiSearch, FiPlus, FiEdit, FiFilter, FiList,
  FiBarChart2, FiPieChart, FiTrendingUp, FiDollarSign, FiUsers, FiUser,
  FiCalendar, FiShoppingCart, FiCreditCard, FiHeart, FiActivity,
  FiTarget, FiCheckCircle, FiUserCheck, FiUserPlus, FiSettings, FiDatabase,
  FiUpload, FiDownload, FiMessageSquare, FiCheckSquare, FiCamera, FiFileText,
  FiRefreshCw, FiTag, FiCpu, FiBell,
} from "react-icons/fi";
import { GiMeal, GiMuscleUp } from "react-icons/gi";

// target (opcional): selector del elemento a resaltar en la vista (data-guide).
const s = (icon, title, body, target) => ({ icon, title, body, target });
const g = (key) => `[data-guide="${key}"]`;

// ── Vistas compartidas entre roles ──────────────────────────────────────────
const POS = {
  title: "Punto de Venta",
  steps: [
    s(FiShoppingCart, "Catálogo de productos", "En esta pantalla se venden productos del gimnasio (suplementos, bebidas, accesorios). Cada tarjeta es un producto con su precio y existencia."),
    s(FiSearch, "Buscar producto", "Usa el buscador para encontrar rápido lo que quieres vender sin recorrer todo el catálogo."),
    s(FiPlus, "Agregar al carrito", "Al tocar un producto se suma al carrito. Puedes ajustar la cantidad de cada artículo antes de cobrar."),
    s(FiDollarSign, "Cobrar", "Cuando termines, confirmas la venta y eliges el método de pago. La venta queda registrada automáticamente en los ingresos."),
  ],
};

const MAPREDUCE = {
  title: "Finanzas y Flujo",
  steps: [
    s(FiPieChart, "Resumen financiero", "Este análisis procesa todos tus pagos y asistencias para mostrarte patrones que a simple vista no se notan."),
    s(FiDollarSign, "Métodos de pago", "Verás qué métodos de pago usan más tus miembros (efectivo, tarjeta, transferencia) y cómo se reparten tus ingresos."),
    s(FiBarChart2, "Días con más actividad", "Las gráficas señalan los días y horarios de mayor afluencia, útil para organizar personal y promociones."),
    s(FiTrendingUp, "Evolución mensual", "Ves cómo crecen o bajan tus ingresos mes a mes para anticipar tendencias."),
  ],
};

const KMEANS = {
  title: "Segmentación de miembros",
  steps: [
    s(FiUsers, "Grupos de miembros", "La inteligencia artificial agrupa a tus miembros en perfiles parecidos: por ejemplo muy activos, ocasionales o en riesgo de irse."),
    s(FiTarget, "Para qué sirve", "Conocer estos grupos te ayuda a dirigir cada acción a quien corresponde: retener a los que se enfrían, premiar a los más fieles."),
    s(FiBarChart2, "Cómo leerlo", "Cada color o sección representa un grupo. El tamaño indica cuántos miembros hay en cada uno."),
  ],
};

const REGRESION = {
  title: "Tendencias y predicción",
  steps: [
    s(FiTrendingUp, "Proyección a futuro", "Con base en el historial, el modelo proyecta hacia dónde va un indicador (por ejemplo asistencia o peso de un miembro)."),
    s(FiActivity, "Precisión", "Mientras más datos haya, más confiable es la predicción. El sistema te indica qué tan preciso es el modelo."),
    s(FiInfo, "Cómo usarlo", "Úsalo como apoyo para decidir, no como una certeza. Es una guía de hacia dónde apuntan los números."),
  ],
};

// ── Dueño / Administrador ────────────────────────────────────────────────────
const OWNER = {
  "/owner": {
    title: "Panel del gimnasio",
    steps: [
      s(FiBarChart2, "Indicadores clave", "Estas tarjetas son los números más importantes: miembros activos, ingresos del mes, ventas, membresías por vencer y total de miembros. Son la salud de tu negocio de un vistazo.", g("ow-kpis")),
      s(FiTrendingUp, "Gráficas de ingresos", "Aquí ves cómo han subido o bajado tus ingresos mes a mes, separando membresías y ventas, para detectar tendencias y temporadas.", g("ow-ingresos")),
      s(FiActivity, "Actividad reciente", "Este panel muestra lo último que pasó en tu gimnasio: pagos, altas y ventas, sin tener que entrar a cada sección.", g("ow-actividad")),
      s(FiBell, "Alertas del sistema", "Aquí el sistema te avisa de lo que requiere tu atención, como membresías por vencer o miembros en riesgo de cancelar.", g("ow-alertas")),
      s(FiRefreshCw, "Actualizar", "Este botón recarga los datos del panel al momento más reciente.", g("ow-refresh")),
    ],
  },
  "/owner/members": {
    title: "Miembros",
    steps: [
      s(FiSearch, "Buscador", "Escribe un nombre para encontrar rápido a cualquier miembro de tu gimnasio."),
      s(FiUserPlus, "Nuevo miembro", "El botón de alta abre un formulario para registrar un miembro: datos, contacto, plan y foto."),
      s(FiUsers, "Lista de miembros", "La tabla muestra a tus miembros con su estado (activo o inactivo) y sus datos principales."),
      s(FiCamera, "Foto del miembro", "Puedes subir o cambiar su foto haciendo clic en la imagen del miembro."),
      s(FiEdit, "Acciones por fila", "En cada miembro puedes editar sus datos, o desactivar y reactivar su cuenta."),
    ],
  },
  "/owner/payments": {
    title: "Pagos",
    steps: [
      s(FiPlus, "Registrar pago", "Registra un pago eligiendo el miembro, el monto y el método (efectivo, tarjeta o transferencia)."),
      s(FiDollarSign, "Resumen de ingresos", "Arriba ves el total cobrado en el periodo para llevar el control del dinero."),
      s(FiList, "Historial de pagos", "Abajo está el listado de todos los pagos, con fecha, monto y método usado."),
      s(FiFilter, "Filtros", "Filtra por fecha o método para encontrar transacciones específicas."),
    ],
  },
  "/owner/cobrar": {
    title: "Cobrar membresía",
    steps: [
      s(FiUser, "Elegir miembro", "Selecciona al miembro al que le vas a cobrar o renovar la membresía."),
      s(FiTag, "Elegir plan", "Escoge el plan de membresía que se le aplicará, con su precio y duración."),
      s(FiDollarSign, "Confirmar pago", "Eliges el método de pago y confirmas. La membresía del miembro queda activada o renovada."),
    ],
  },
  "/owner/pos": POS,
  "/owner/staff": {
    title: "Personal",
    steps: [
      s(FiUserCheck, "Tu equipo", "Aquí está tu personal: entrenadores y recepcionistas, con su rol y estado de cuenta."),
      s(FiUserPlus, "Dar de alta", "Crea la cuenta de un empleado, asígnale su rol y genera su acceso al sistema."),
      s(FiEdit, "Editar", "Actualiza los datos o la foto de cada miembro del equipo, o desactiva su acceso."),
    ],
  },
  "/owner/memberships": {
    title: "Tipos de membresía",
    steps: [
      s(FiTag, "Tus planes", "Aquí defines los planes que ofreces: nombre, precio, duración y beneficios."),
      s(FiPlus, "Crear plan", "Agrega un plan nuevo. Estos planes son los que se asignan y renuevan a los miembros."),
      s(FiEdit, "Editar o activar", "Modifica un plan existente o actívalo/desactívalo cuando lo necesites."),
    ],
  },
  "/owner/profile": {
    title: "Perfil del gimnasio",
    steps: [
      s(FiSettings, "Datos del gimnasio", "Configura el nombre, logo e información de contacto de tu gimnasio."),
      s(FiEdit, "Guardar cambios", "Edita los campos y guarda; estos datos aparecen en recibos y en la app de tus miembros."),
    ],
  },
  "/owner/backups": {
    title: "Respaldos y restauración",
    steps: [
      s(FiDatabase, "Generar respaldo", "Crea un respaldo completo de la información de tu gimnasio cuando quieras."),
      s(FiList, "Historial", "La lista muestra los respaldos generados con su fecha y tamaño, listos para descargar."),
      s(FiUpload, "Restaurar", "Si algo sale mal, restaura tu información desde un respaldo y vuelve a un estado anterior."),
    ],
  },
  "/owner/analytics": {
    title: "IA y Analíticas",
    steps: [
      s(FiBarChart2, "Pestañas de análisis", "Arriba cambias entre los análisis disponibles: finanzas y flujo, segmentación de miembros, tendencias y cancelaciones."),
      s(FiCpu, "Inteligencia artificial", "Estos análisis usan IA para darte información que ayuda a tomar mejores decisiones de negocio."),
      s(FiInfo, "Cómo aprovecharlo", "Revísalos periódicamente para detectar oportunidades y problemas antes de que crezcan."),
    ],
  },
  "/owner/mapreduce": MAPREDUCE,
  "/owner/kmeans": KMEANS,
  "/owner/regresion": REGRESION,
};

// ── Miembro ──────────────────────────────────────────────────────────────────
const USER = {
  "/user/dashboard": {
    title: "Mi panel",
    steps: [
      s(FiActivity, "Tu resumen del día", "Aquí arriba el sistema te saluda y te muestra la fecha. Es tu punto de partida cada vez que entras.", g("us-header")),
      s(FiGrid, "Accesos rápidos", "Estos botones te llevan directo a lo que más usas: tu rutina, progreso, nutrición y más, sin buscar en el menú.", g("us-quicklinks")),
      s(FiCreditCard, "Estado de membresía", "Aquí ves qué plan tienes y cuándo vence, para que no te tome por sorpresa.", g("us-membership")),
      s(FiUser, "Tu perfil", "Tu foto, arriba a la derecha, te lleva a tu perfil para editar tus datos cuando quieras.", g("us-avatar")),
    ],
  },
  "/user/training": {
    title: "Entrenamiento",
    steps: [
      s(GiMuscleUp, "Rutinas asignadas", "Aquí están las rutinas que tu entrenador te asignó, con ejercicios, series y videos para hacerlas bien."),
      s(FiUsers, "Entrenadores", "Conoce a los entrenadores disponibles del gimnasio y solicita uno como entrenador personal."),
      s(FiUserPlus, "Solicitar entrenador", "Pide entrenamiento personalizado; el entrenador acepta o rechaza tu solicitud."),
      s(FiMessageSquare, "Chat", "Una vez asignado, puedes platicar con tu entrenador por el chat integrado."),
    ],
  },
  "/user/routine": {
    title: "Mi rutina",
    steps: [
      s(FiFileText, "Tu rutina", "Aquí ves tu rutina con los ejercicios, series y repeticiones que te corresponden."),
      s(FiCheckCircle, "Marcar avance", "Conforme entrenas puedes marcar lo que completaste para llevar control."),
    ],
  },
  "/user/progress": {
    title: "Progreso físico",
    steps: [
      s(FiTrendingUp, "Tus gráficas", "Muestran tu evolución de peso, IMC y medidas a lo largo del tiempo. Así ves claramente tus avances."),
      s(FiTarget, "Tus metas", "Comparan tus valores actuales con las metas que te propusiste."),
      s(FiHeart, "Perfil médico", "Resume tus condiciones, alergias, medicamentos y lesiones registradas."),
      s(FiActivity, "Recomendaciones", "Consejos de bienestar pensados a partir de tus datos."),
    ],
  },
  "/user/prediction": {
    title: "Mi predicción",
    steps: [
      s(FiCpu, "Predicción de peso", "El sistema estima tu peso futuro con base en tu historial, para saber si vas por buen camino."),
      s(FiInfo, "Necesita datos", "Entre más mediciones registres en Progreso, más precisa será la predicción."),
    ],
  },
  "/user/health": {
    title: "Salud",
    steps: [
      s(FiHeart, "Tus indicadores", "Ves tus indicadores clave: IMC, peso y estatura, con un color que indica si están en buen rango."),
      s(FiPlus, "Registrar medidas", "Con el botón de agregar registras tu peso y medidas para mantener tu historial al día."),
      s(FiActivity, "Información médica", "Tus datos médicos: condiciones, alergias, medicamentos y lesiones, importantes para tu seguridad."),
    ],
  },
  "/user/meal-plan": {
    title: "Nutrición y recetas",
    steps: [
      s(GiMeal, "Plan de comidas", "Tu plan de alimentación, organizado por comidas del día, preparado para apoyar tu objetivo."),
      s(FiList, "Recetas", "Recetas sugeridas que acompañan tu plan, con sus ingredientes y preparación."),
    ],
  },
  "/user/payments": {
    title: "Pagos",
    steps: [
      s(FiList, "Tu historial", "Aquí están todos tus pagos de membresía y compras, con su fecha y monto."),
      s(FiDownload, "Descargar recibo", "Puedes descargar el comprobante oficial de cada pago cuando lo necesites."),
    ],
  },
  "/user/renew": {
    title: "Renovar membresía",
    steps: [
      s(FiCreditCard, "Tu plan actual", "Ves el plan que tienes y la fecha en que vence."),
      s(FiTag, "Elegir plan", "Escoge el plan con el que quieres renovar, con su precio y beneficios."),
      s(FiDollarSign, "Pagar", "Seleccionas el método de pago, confirmas y tu membresía queda renovada."),
    ],
  },
  "/user/profile": {
    title: "Mi perfil",
    steps: [
      s(FiUser, "Tus datos", "Aquí ves tus datos personales y físicos: contacto, objetivo, nivel y medidas."),
      s(FiEdit, "Editar perfil", "Con el botón Editar actualizas tu información, tu foto y tu objetivo."),
    ],
  },
  "/user/pos": POS,
};

// ── Entrenador ───────────────────────────────────────────────────────────────
const TRAINER = {
  "/trainer-dashboard": {
    title: "Panel del entrenador",
    steps: [
      s(FiBarChart2, "Tus indicadores", "Estas tarjetas muestran tus números: clientes, sesiones, asistencia y calificación.", g("tr-kpis")),
      s(FiCalendar, "Sesiones de hoy", "Aquí ves qué tienes agendado hoy y con quién, para organizar tu jornada.", g("tr-today")),
      s(FiGrid, "Accesos rápidos", "Estos botones te llevan directo a tus clientes, rutinas, dietas y agenda.", g("tr-quick")),
    ],
  },
  "/trainer/clients": {
    title: "Mis clientes",
    steps: [
      s(FiUsers, "Lista de clientes", "Aquí están los miembros que entrenas, con sus datos principales."),
      s(FiUser, "Ver detalle", "Entra a cada cliente para revisar su progreso, medidas y salud, y darle seguimiento."),
    ],
  },
  "/trainer/requests": {
    title: "Solicitudes de entrenamiento",
    steps: [
      s(FiUserPlus, "Solicitudes recibidas", "Aquí llegan las peticiones de miembros que quieren que seas su entrenador personal."),
      s(FiCheckCircle, "Aceptar o rechazar", "Decides si tomas al miembro como cliente. Al aceptar, se suma a tu lista y podrán chatear."),
    ],
  },
  "/trainer/routines": {
    title: "Rutinas",
    steps: [
      s(FiPlus, "Crear rutina", "Arma una rutina con ejercicios, series, repeticiones y pesos sugeridos según el nivel del cliente."),
      s(FiActivity, "Videos de ejercicios", "Puedes grabar o adjuntar un video de cada ejercicio para que el cliente lo haga bien."),
      s(FiUsers, "Asignar", "Asigna la rutina a uno o varios miembros; les aparecerá en su sección de entrenamiento."),
    ],
  },
  "/trainer/diets": {
    title: "Dietas",
    steps: [
      s(FiPlus, "Crear dieta", "Diseña un plan de alimentación organizado por comidas para tus clientes."),
      s(FiCpu, "Importar con IA", "Sube un PDF o Excel y la inteligencia artificial extrae las comidas; tú revisas y confirmas antes de guardar."),
      s(FiList, "Tus dietas", "La lista muestra las dietas creadas para reutilizarlas o asignarlas."),
    ],
  },
  "/trainer/schedule": {
    title: "Agenda",
    steps: [
      s(FiCalendar, "Tus horarios", "Organiza y consulta tus sesiones de entrenamiento agendadas."),
      s(FiCheckCircle, "Asistencia", "Marca la asistencia de cada sesión para llevar un registro claro de tu trabajo."),
    ],
  },
  "/trainer/reports": {
    title: "Reportes",
    steps: [
      s(FiBarChart2, "Tu desempeño", "Consulta tus indicadores: sesiones impartidas, asistencia de clientes y calificaciones."),
      s(FiTrendingUp, "Mejora continua", "Te ayudan a medir tu trabajo y detectar en qué puedes mejorar."),
    ],
  },
  "/trainer/profile": {
    title: "Mi perfil",
    steps: [
      s(FiUser, "Tu información profesional", "Mantén al día tus datos, especialidad y foto, que ven tus clientes."),
      s(FiEdit, "Editar", "Actualiza tu información cuando lo necesites."),
    ],
  },
  "/trainer/pos": POS,
  "/trainer/trainer-kmeans": KMEANS,
  "/trainer/trainer-regresion": REGRESION,
};

// ── Recepción ────────────────────────────────────────────────────────────────
const RECEPTIONIST = {
  "/receptionist-dashboard": {
    title: "Panel de recepción",
    steps: [
      s(FiBarChart2, "Indicadores del día", "Estas tarjetas muestran los números de hoy: check-ins, pagos y tareas pendientes.", g("rec-kpis")),
      s(FiActivity, "Resumen visual", "Aquí ves de forma gráfica el movimiento del día, como los check-ins, para tener el pulso de la recepción.", g("rec-charts")),
      s(FiRefreshCw, "Actualizar", "Este botón recarga los datos para ver la información más reciente del día.", g("rec-refresh")),
    ],
  },
  "/receptionist/checkins": {
    title: "Check-ins",
    steps: [
      s(FiCheckSquare, "Registrar entrada", "Marca la asistencia de los miembros conforme llegan al gimnasio."),
      s(FiList, "Asistencias de hoy", "La lista muestra quién ha asistido y a qué hora durante el día."),
      s(FiSearch, "Buscar miembro", "Busca al miembro por nombre para registrar su entrada rápidamente."),
    ],
  },
  "/receptionist/members": {
    title: "Miembros",
    steps: [
      s(FiSearch, "Buscar", "Busca a cualquier miembro para consultar su información al instante."),
      s(FiUserCheck, "Estado de membresía", "Verifica si su membresía está vigente y sus datos de contacto, útil para atender dudas y accesos."),
    ],
  },
  "/receptionist/appointments": {
    title: "Citas",
    steps: [
      s(FiCalendar, "Agenda", "Gestiona las citas y la programación del gimnasio para que todo fluya."),
      s(FiPlus, "Nueva cita", "Registra una cita nueva eligiendo miembro, fecha y hora."),
    ],
  },
  "/receptionist/payments": {
    title: "Pagos",
    steps: [
      s(FiDollarSign, "Registrar pago", "Registra el pago de un miembro de forma rápida en el mostrador."),
      s(FiList, "Historial", "Consulta el historial de pagos para resolver cualquier aclaración."),
    ],
  },
  "/receptionist/messages": {
    title: "Bitácora",
    steps: [
      s(FiMessageSquare, "Bitácora de la operación", "Aquí quedan registrados los eventos y mensajes del día a día de recepción."),
      s(FiInfo, "Avisos", "Úsala para dejar notas y mantenerte al tanto de la coordinación con el equipo."),
    ],
  },
  "/receptionist/tasks": {
    title: "Tareas",
    steps: [
      s(FiList, "Tus pendientes", "Lleva control de las tareas del día asignadas a recepción."),
      s(FiCheckCircle, "Completar", "Marca cada tarea conforme la terminas para no olvidar nada en tu turno."),
    ],
  },
  "/receptionist/analytics": {
    title: "Analítica",
    steps: [
      s(FiBarChart2, "Indicadores", "Consulta indicadores y predicciones útiles para la recepción, como tendencias de asistencia."),
      s(FiCpu, "Apoyo con IA", "Estos análisis usan inteligencia artificial para anticipar comportamientos."),
    ],
  },
  "/receptionist/pos": POS,
  "/receptionist/mapreduce": MAPREDUCE,
  "/receptionist/kmeans": KMEANS,
  "/receptionist/regresion": REGRESION,
};

// Mapa completo + alias de rutas que comparten componente.
export const VIEW_GUIDES = {
  ...OWNER,
  ...USER,
  ...TRAINER,
  ...RECEPTIONIST,
  // Alias: rutas distintas que muestran la misma vista
  "/user/body-metrics": USER["/user/progress"],
  "/user/nutrition":    USER["/user/meal-plan"],
  "/user/recipes":      USER["/user/meal-plan"],
};

export const GUIDE_FALLBACK = {
  title: "Guía del sistema",
  steps: [
    s(FiInfo, "Estás en esta sección", "Explora los elementos de la pantalla: cada botón y tarjeta tiene una función. Pasa el cursor sobre ellos para ver más detalles."),
    s(FiGrid, "Menú lateral", "Desde el menú de la izquierda puedes ir a cualquier otra sección del sistema en cualquier momento."),
  ],
};

/** Resuelve la guía para una ruta (normaliza la barra final). */
export function resolveGuide(path) {
  if (!path) return GUIDE_FALLBACK;
  const clean = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return VIEW_GUIDES[clean] || GUIDE_FALLBACK;
}
