/**
 * guideData.jsx — Contenido de la guía interactiva del sistema, por rol.
 *
 * Cada paso describe a detalle una sección del sistema para que el usuario
 * aprenda poco a poco qué puede hacer y cómo. `route` (opcional) permite que la
 * guía lleve al usuario a esa ventana con el botón "Ver esta sección".
 *
 * Solo iconos (react-icons), nada de emojis.
 */
import {
  FiHome, FiHeart, FiTrendingUp, FiActivity, FiDollarSign, FiShoppingCart,
  FiUser, FiUsers, FiUserPlus, FiUserCheck, FiCalendar, FiBarChart2, FiTag,
  FiDatabase, FiSettings, FiCheckSquare, FiMessageSquare, FiList, FiCreditCard,
} from "react-icons/fi";
import { GiMeal } from "react-icons/gi";

// ── Miembro ────────────────────────────────────────────────────────────────
const USER = [
  {
    icon: FiHome, route: "/user/dashboard",
    title: "Tu panel principal",
    body: "Este es tu inicio. Aquí ves de un vistazo el estado de tu membresía, tus próximas clases, tu progreso reciente y accesos rápidos. Desde el menú lateral puedes llegar a cualquier sección. Vamos a recorrerlas una por una.",
  },
  {
    icon: FiCreditCard, route: "/user/renew",
    title: "Tu membresía",
    body: "Consulta qué plan tienes, cuándo vence y los beneficios incluidos. Cuando esté por terminar, desde aquí puedes renovarla en línea eligiendo el plan y el método de pago. El sistema te avisará antes de que expire.",
  },
  {
    icon: FiHeart, route: "/user/health",
    title: "Salud y medidas",
    body: "Registra tu peso y medidas corporales (cintura, cadera, pecho, brazos, etc.) para llevar control. También administras tu información médica: condiciones, alergias, medicamentos y lesiones. Mantenerla al día ayuda a tu entrenador a cuidarte mejor.",
  },
  {
    icon: FiTrendingUp, route: "/user/progress",
    title: "Progreso físico",
    body: "Aquí ves tu evolución en gráficas: peso, IMC y medidas a lo largo del tiempo, comparadas con tus metas. Cada vez que registres nuevas medidas, este panel se actualiza para que veas claramente tus avances.",
  },
  {
    icon: FiActivity, route: "/user/training",
    title: "Entrenamiento y rutinas",
    body: "Revisa las rutinas que tu entrenador te asignó, con ejercicios, series y videos. Puedes solicitar un entrenador personal, chatear con él y marcar tus entrenamientos completados. Es tu centro de actividad física.",
  },
  {
    icon: GiMeal, route: "/user/nutrition",
    title: "Nutrición",
    body: "Consulta los planes de alimentación y recetas que tu entrenador prepara para ti, organizados por comidas del día. Te ayudan a complementar tu entrenamiento con una dieta adecuada a tu objetivo.",
  },
  {
    icon: FiDollarSign, route: "/user/payments",
    title: "Pagos y recibos",
    body: "Encuentra el historial de todos tus pagos de membresía y compras. Puedes descargar el comprobante oficial de cada pago cuando lo necesites para tus registros.",
  },
  {
    icon: FiShoppingCart, route: "/user/pos",
    title: "Tienda del gimnasio",
    body: "Compra productos disponibles en tu gimnasio (suplementos, accesorios, bebidas) directamente desde la app. Agregas al carrito, confirmas y la compra queda registrada en tu historial.",
  },
  {
    icon: FiUser, route: "/user/profile",
    title: "Tu perfil",
    body: "Actualiza tus datos personales, foto, objetivo y nivel. Mantener tu perfil completo permite que el sistema y tu entrenador personalicen mejor tu experiencia. ¡Listo, ya conoces todo el sistema!",
  },
];

// ── Entrenador ───────────────────────────────────────────────────────────────
const TRAINER = [
  {
    icon: FiHome, route: "/trainer-dashboard",
    title: "Tu panel de entrenador",
    body: "Tu inicio resume tus indicadores: número de clientes, sesiones, asistencia y calificación. Desde el menú lateral accedes a cada herramienta. Recorramos juntos lo que puedes hacer.",
  },
  {
    icon: FiUsers, route: "/trainer/clients",
    title: "Tus clientes",
    body: "Aquí está la lista de los miembros que entrenas. Puedes ver el perfil de cada uno, su progreso, medidas y salud, para dar seguimiento personalizado y ajustar su plan cuando sea necesario.",
  },
  {
    icon: FiUserPlus, route: "/trainer/requests",
    title: "Solicitudes de entrenamiento",
    body: "Cuando un miembro pide que seas su entrenador personal, la solicitud llega aquí. Puedes aceptarla o rechazarla. Al aceptar, el cliente se suma a tu lista y podrán comunicarse por chat.",
  },
  {
    icon: FiActivity, route: "/trainer/routines",
    title: "Rutinas",
    body: "Crea rutinas con ejercicios, series, repeticiones y pesos sugeridos según el nivel del cliente. Puedes grabar o adjuntar videos de cada ejercicio y asignar la rutina a uno o varios miembros.",
  },
  {
    icon: GiMeal, route: "/trainer/diets",
    title: "Dietas",
    body: "Diseña planes de alimentación para tus clientes. Incluso puedes importar una dieta desde un PDF o Excel: la IA extrae las comidas y tú confirmas antes de guardarla. Quedan visibles para el miembro en su sección de Nutrición.",
  },
  {
    icon: FiCalendar, route: "/trainer/schedule",
    title: "Agenda y sesiones",
    body: "Organiza tus horarios y sesiones de entrenamiento. Lleva control de la asistencia de cada sesión para tener un registro claro de tu trabajo con cada cliente.",
  },
  {
    icon: FiBarChart2, route: "/trainer/reports",
    title: "Reportes",
    body: "Consulta tus indicadores de desempeño: sesiones impartidas, asistencia de clientes y calificaciones. Te ayudan a medir tu trabajo y detectar en qué puedes mejorar.",
  },
  {
    icon: FiShoppingCart, route: "/trainer/pos",
    title: "Punto de venta",
    body: "Si tu gimnasio lo permite, puedes registrar la venta de productos a los miembros desde aquí, de forma rápida durante tu jornada.",
  },
  {
    icon: FiUser, route: "/trainer/profile",
    title: "Tu perfil",
    body: "Mantén tu información profesional al día: datos de contacto, especialidad y foto. Con eso terminamos el recorrido. ¡Ya conoces tus herramientas!",
  },
];

// ── Dueño / Administrador del gimnasio ───────────────────────────────────────
const OWNER = [
  {
    icon: FiHome, route: "/owner",
    title: "Panel del gimnasio",
    body: "Tu inicio muestra los indicadores clave del negocio: ingresos, miembros activos, asistencia y tendencias. Es tu vista general para tomar decisiones. Recorramos cada módulo de administración.",
  },
  {
    icon: FiUsers, route: "/owner/members",
    title: "Miembros",
    body: "Administra a todos los miembros del gimnasio: da de alta nuevos, edita sus datos, sube su foto y reactiva o desactiva cuentas. Es el registro central de tus clientes.",
  },
  {
    icon: FiTag, route: "/owner/memberships",
    title: "Tipos de membresía",
    body: "Define los planes que ofreces: nombre, duración, precio y beneficios. Estos planes son los que se asignan a los miembros y los que ellos pueden renovar.",
  },
  {
    icon: FiDollarSign, route: "/owner/payments",
    title: "Cobros y pagos",
    body: "Registra pagos de membresía, consulta el historial completo y da seguimiento a los ingresos. Tienes el detalle de cada transacción para mantener las cuentas claras.",
  },
  {
    icon: FiShoppingCart, route: "/owner/pos",
    title: "Punto de venta",
    body: "Vende productos del gimnasio (suplementos, accesorios, bebidas). Gestionas el catálogo, registras ventas y todo queda contabilizado en tus ingresos.",
  },
  {
    icon: FiUserCheck, route: "/owner/staff",
    title: "Personal",
    body: "Administra a tu equipo: entrenadores y recepcionistas. Crea sus cuentas, asígnales su rol y controla su acceso al sistema según sus funciones.",
  },
  {
    icon: FiBarChart2, route: "/owner/analytics",
    title: "Analítica avanzada",
    body: "Aquí están los análisis inteligentes: segmentación de miembros, predicción de cancelaciones y tendencias de ingresos y asistencia. Te dan información valiosa para hacer crecer tu gimnasio.",
  },
  {
    icon: FiDatabase, route: "/owner/backups",
    title: "Respaldos",
    body: "Genera respaldos de toda la información de tu gimnasio y restáuralos cuando lo necesites. Es tu seguro ante cualquier imprevisto: nunca pierdas tus datos.",
  },
  {
    icon: FiSettings, route: "/owner/profile",
    title: "Perfil del gimnasio",
    body: "Configura los datos de tu gimnasio: nombre, logo, contacto e información general. Con esto terminamos el recorrido por la administración. ¡Ya dominas el panel!",
  },
];

// ── Recepcionista ────────────────────────────────────────────────────────────
const RECEPTIONIST = [
  {
    icon: FiHome, route: "/receptionist-dashboard",
    title: "Panel de recepción",
    body: "Tu inicio muestra los indicadores del día: asistencias, pagos y tareas pendientes. Es tu punto de partida para la operación diaria. Veamos cada herramienta que tienes a la mano.",
  },
  {
    icon: FiCheckSquare, route: "/receptionist/checkins",
    title: "Registro de asistencias",
    body: "Registra la entrada de los miembros conforme llegan al gimnasio. Llevas el control de quién asiste y cuándo, de forma rápida en el mostrador.",
  },
  {
    icon: FiUsers, route: "/receptionist/members",
    title: "Miembros",
    body: "Busca y consulta la información de cualquier miembro: estado de su membresía, datos de contacto y vigencia. Útil para atender dudas y verificar accesos al instante.",
  },
  {
    icon: FiCalendar, route: "/receptionist/appointments",
    title: "Citas y agenda",
    body: "Gestiona las citas y la agenda del gimnasio. Coordina sesiones y atiende la programación para que todo fluya sin contratiempos.",
  },
  {
    icon: FiDollarSign, route: "/receptionist/payments",
    title: "Pagos",
    body: "Consulta y registra pagos de los miembros. Tienes el historial a la mano para resolver cualquier aclaración en recepción.",
  },
  {
    icon: FiShoppingCart, route: "/receptionist/pos",
    title: "Punto de venta",
    body: "Vende productos del gimnasio a los miembros desde el mostrador: agregas al carrito, cobras y la venta queda registrada automáticamente.",
  },
  {
    icon: FiMessageSquare, route: "/receptionist/messages",
    title: "Mensajes",
    body: "Comunícate y revisa los mensajes relacionados con la operación. Mantente al tanto de avisos y coordinación con el equipo.",
  },
  {
    icon: FiList, route: "/receptionist/tasks",
    title: "Tareas",
    body: "Lleva control de tus tareas pendientes del día. Marca lo que vas completando para no olvidar nada durante tu turno.",
  },
  {
    icon: FiBarChart2, route: "/receptionist/analytics",
    title: "Analítica",
    body: "Consulta indicadores y predicciones útiles para la recepción, como tendencias de asistencia. Con esto terminamos el recorrido. ¡Ya conoces tu panel de trabajo!",
  },
];

export const GUIDES = {
  user:         USER,
  trainer:      TRAINER,
  owner_gym:    OWNER,
  receptionist: RECEPTIONIST,
};

export const GUIDE_TITLES = {
  user:         "Guía del miembro",
  trainer:      "Guía del entrenador",
  owner_gym:    "Guía del administrador",
  receptionist: "Guía de recepción",
};
