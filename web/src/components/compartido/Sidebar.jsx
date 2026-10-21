import { useState, useRef, useEffect } from "react";
import useTheme from "../../hooks/ThemeContext";
import useIsMobile from "../../hooks/useIsMobile";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiSun, FiMoon, FiStar, FiBarChart2, FiUsers, FiDollarSign,
  FiSettings, FiUpload, FiClipboard, FiTrendingUp,
  FiRefreshCw, FiUser, FiUserCheck, FiCalendar,
  FiFileText, FiLogOut, FiActivity, FiLock, FiCreditCard,
  FiShoppingCart, FiCpu, FiPieChart, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiGlobe, FiPackage, FiServer,
  FiMoreHorizontal, FiHelpCircle, FiMapPin, FiSearch, FiBriefcase, FiImage,
  FiMenu, FiX, FiClock,
} from "react-icons/fi";
import { GiMuscleUp, GiMeal } from "react-icons/gi";
// HU-45: para ocultar "Sucursales" a Administrador -- comparte el panel
// owner_gym con Propietario pero el backend restringe ese módulo solo a
// Propietario (ver routes/owner_gym/sucursales.py), así que aquí se evita
// mostrar un enlace que de cualquier forma le devolvería 403.
import { normalizarRol, ROL_ADMINISTRADOR } from "../../constants/roles";

// ── Palette (sin CSS externo) ─────────────────────────────────
// La barra lateral tiene fondo oscuro en todos los temas, por eso su texto,
// bordes y hover usan variables propias (--sidebar-*) que siempre son claras,
// evitando que en el tema claro el texto se pierda. El acento sí sigue al tema.
const P = {
  bg:        "var(--bg-sidebar, var(--bg-card, #151820))",
  bgHover:   "var(--sidebar-hover, rgba(255,255,255,.06))",
  bgActive:  "var(--accent-dim, rgba(99,102,241,.18))",
  accent:    "var(--accent, #6366f1)",
  accentSoft:"var(--accent-soft, #818cf8)",
  border:    "var(--sidebar-border, rgba(255,255,255,.1))",
  text:      "var(--sidebar-text, #f1f5f9)",
  muted:     "var(--sidebar-text-muted, #94a3b8)",
  dim:       "var(--sidebar-text-dim, #64748b)",
  badge:     "var(--warning, #eab308)",
  badgeBg:   "var(--warning-bg, rgba(234,179,8,.15))",
};

const MENUS = {
  owner_gym: [
    { id: "ow-dashboard",  label: "Dashboard",       icon: <FiBarChart2 />    },
    { id: "ow-miembros",   label: "Miembros",         icon: <FiUsers />        },
    { id: "ow-pagos",      label: "Pagos",            icon: <FiDollarSign />   },
    { id: "ow-cobrar",     label: "Cobrar Membresía", icon: <FiDollarSign />   },
    { id: "ow-pos",        label: "Punto de Venta",   icon: <FiShoppingCart /> },
    // HU-47/SCRUM-218: solo visible si la organización tiene 2+ sucursales
    // (multiSucursal, prop venida de /api/auth/me) -- ver filtrarOcultos abajo.
    { id: "ow-verificar-sucursal", label: "Verificar Visitante", icon: <FiSearch /> },
    { type: "divider" },
    // Agrupados bajo un mismo desplegable (antes 3 filas sueltas + Reportes
    // suelto): reduce el amontonamiento del panel sin esconder nada más de
    // un clic de profundidad.
    {
      id: "ow-negocio", label: "Gestión del Negocio", icon: <FiBriefcase />,
      children: [
        { id: "ow-staff",      label: "Staff",       icon: <FiUserCheck />  },
        { id: "ow-sucursales", label: "Sucursales",  icon: <FiMapPin />     },
        { id: "ow-membresias", label: "Membresías",   icon: <FiCreditCard /> },
        { id: "ow-reportes",   label: "Reportes",    icon: <FiFileText />   },
        { id: "ow-reportes-auto", label: "Automatizar reportes", icon: <FiClock />   },
      ],
    },
    {
      id: "ow-ia", label: "IA & Analíticas", icon: <FiCpu />,
      children: [
        { id: "ow-mapreduce",      label: "Finanzas y Flujo",  icon: <FiPieChart />   },
        { id: "ow-kmeans",         label: "Segmentación",      icon: <FiUsers />      },
        { id: "ow-regresion",      label: "Tendencias",        icon: <FiTrendingUp /> },
        { id: "ow-cancelaciones",  label: "Cancelaciones IA",  icon: <FiActivity />   },
      ],
    },
    {
      id: "ow-config", label: "Configuración", icon: <FiSettings />,
      children: [
        // Mi Perfil = la persona; Perfil del Gym = el negocio. Son pantallas
        // distintas y antes solo existía la segunda.
        { id: "ow-mi-perfil",    label: "Mi Perfil",                 icon: <FiUser />       },
        { id: "ow-profile",      label: "Perfil del Gym",            icon: <FiGlobe />      },
        { id: "ow-subscription", label: "Mi Suscripción",            icon: <FiCreditCard /> },
        { id: "ow-pagos-online", label: "Cobros en línea",           icon: <FiDollarSign /> },
        { id: "ow-perfil-publico", label: "Perfil público",          icon: <FiImage />      },
        { id: "ow-backups",      label: "Respaldos y Restauración", icon: <FiUpload /> },
      ],
    },
  ],
  user: [
    { id: "dashboard", label: "Mi Dashboard",    icon: <FiActivity />     },
    { id: "pos",       label: "Punto de Venta",  icon: <FiShoppingCart /> },
    { type: "divider" },
    {
      id: "training", label: "Entrenamiento", icon: <GiMuscleUp />,
      children: [
        { id: "training-hub", label: "Entrenamiento Personal", icon: <GiMuscleUp />   },
        { id: "workout-log",  label: "Registrar Entreno",      icon: <FiActivity />   },
        { id: "progress",     label: "Progreso Físico",        icon: <FiTrendingUp /> },
        { id: "prediction",   label: "Mi Predicción",          icon: <FiCpu />        },
      ],
    },
    { id: "nutrition", label: "Nutrición & Recetas", icon: <GiMeal /> },
    { type: "divider" },
    {
      id: "membership", label: "Mi Membresía", icon: <FiCreditCard />,
      children: [
        { id: "payments", label: "Historial",          icon: <FiClipboard /> },
        { id: "renew",    label: "Renovar Membresía",  icon: <FiRefreshCw /> },
      ],
    },
    { id: "profile", label: "Mi Perfil", icon: <FiUser /> },
  ],
  trainer: [
    { id: "tr-dashboard", label: "Dashboard",    icon: <FiBarChart2 />    },
    { id: "verificar-sucursal", label: "Verificar Visitante", icon: <FiSearch /> },
    { type: "divider" },
    {
      id: "tr-clientes", label: "Mis Clientes", icon: <FiUsers />,
      children: [
        { id: "clients",  label: "Mis Clientes",   icon: <FiUsers />    },
        // Mensajes y solicitudes son cosas distintas: una es conversación
        // con clientes actuales y la otra, peticiones de quienes aún no lo son.
        { id: "messages", label: "Mensajes",        icon: <FiActivity /> },
        { id: "requests", label: "Solicitudes PT",  icon: <GiMuscleUp /> },
      ],
    },
    {
      id: "tr-plan", label: "Planificación", icon: <FiCalendar />,
      children: [
        { id: "schedule", label: "Agenda",   icon: <FiCalendar />  },
        { id: "routines", label: "Rutinas",  icon: <FiFileText /> },
        { id: "diets",    label: "Dietas",   icon: <GiMeal />      },
      ],
    },
    {
      id: "ia-coach", label: "IA Coach", icon: <FiCpu />,
      children: [
        { id: "trainer-kmeans",    label: "Segmentación", icon: <FiUsers />      },
        { id: "trainer-regresion", label: "Predicciones", icon: <FiTrendingUp /> },
      ],
    },
    { id: "reports", label: "Reportes",  icon: <FiBarChart2 /> },
    { id: "profile", label: "Mi Perfil", icon: <FiUser />      },
  ],
  receptionist: [
    { id: "rec-dashboard", label: "Dashboard",      icon: <FiBarChart2 />    },
    { id: "pos",           label: "Punto de Venta", icon: <FiShoppingCart /> },
    { id: "verificar-sucursal", label: "Verificar Visitante", icon: <FiSearch /> },
    { type: "divider" },
    {
      id: "rec-atencion", label: "Atención a Miembros", icon: <FiUserCheck />,
      children: [
        { id: "checkins",     label: "Check-ins", icon: <FiUserCheck /> },
        { id: "appointments", label: "Citas",     icon: <FiCalendar />  },
        { id: "members",      label: "Miembros",  icon: <FiUsers />     },
      ],
    },
    {
      id: "rec-admin", label: "Pagos y Tareas", icon: <FiClipboard />,
      children: [
        { id: "payments", label: "Pagos",    icon: <FiDollarSign /> },
        { id: "cobrar", label: "Cobrar Membresía", icon: <FiDollarSign /> },
        { id: "messages", label: "Bitácora", icon: <FiActivity />   },
        { id: "tasks",    label: "Tareas",   icon: <FiClipboard />  },
      ],
    },
    {
      id: "rec-ai", label: "AI Analytics", icon: <FiCpu />,
      children: [
        { id: "rec-analytics", label: "Vista General",      icon: <FiBarChart2 />  },
        { id: "rec-mapreduce", label: "Finanzas y Flujo",   icon: <FiPieChart />   },
        { id: "rec-kmeans",    label: "Tipos de Clientes",  icon: <FiUsers />      },
        { id: "rec-regresion", label: "Prediccion de Peso", icon: <FiTrendingUp /> },
      ],
    },
  ],
  superadmin: [
    { id: "sa-dashboard",    label: "Plataforma",      icon: <FiGlobe />        },
    { id: "sa-gimnasios",    label: "Gimnasios",        icon: <FiUsers />        },
    { id: "sa-suscripciones",label: "Suscripciones",   icon: <FiCreditCard />   },
    { id: "sa-planes",       label: "Planes",           icon: <FiPackage />      },
    { type: "divider" },
    { id: "sa-usuarios",     label: "Usuarios",         icon: <FiUser />         },
    { type: "divider" },
    {
      id: "sa-ops", label: "Operaciones", icon: <FiSettings />,
      children: [
        { id: "sa-backups",   label: "Backups",       icon: <FiServer />        },
        { id: "sa-analytics", label: "Analytics",     icon: <FiBarChart2 />     },
        { id: "sa-modelos",   label: "Laboratorio ML", icon: <FiCpu />          },
      ],
    },
  ],
};

const ROLE_LABELS = {
  admin: "ADMIN", user: "MIEMBRO", trainer: "ENTRENADOR", receptionist: "RECEPCIÓN",
  superadmin: "SUPERADMIN",
};

const THEMES = [
  { id: "light",  label: "Claro",    icon: <FiSun />    },
  { id: "dark",   label: "Oscuro",   icon: <FiMoon />   },
  { id: "forest", label: "Bosque",   icon: <FiStar /> },
  { id: "nebula", label: "Nebulosa", icon: <FiStar />   },
];

export default function Sidebar({
  role = "admin",
  activeTab = "overview",
  onTabChange = () => {},
  onLogout = () => {},
  onOpenGuide,
  multiSucursal = false,
}) {
  const { theme, changeTheme } = useTheme();
  // En escritorio "collapsed" sigue significando lo de siempre (sidebar
  // angosto, solo iconos). En movil ese concepto no aplica -- ahi el
  // sidebar es un drawer que se oculta por completo (mobileOpen) y, al
  // abrirse, siempre se muestra a ancho completo, nunca colapsado -- por
  // eso "collapsed" (el valor que usa el resto del componente para
  // pintarse) se deriva de ambos en vez de ser directamente el estado.
  const [collapsedPref,  setCollapsedPref]  = useState(false);
  const [openSubmenu,    setOpenSubmenu]    = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [accessLevel,    setAccessLevel]    = useState("premium");
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const optionsRef = useRef(null);
  const isMobile = useIsMobile(768);
  const collapsed = isMobile ? false : collapsedPref;

  // Si la pantalla deja de ser movil (girar a horizontal, devtools, etc.)
  // el drawer no debe quedarse "abierto" de forma invisible.
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  // Obtener access level del miembro
  useEffect(() => {
    if (role !== "user" && role !== "miembro") { setAccessLevel("premium"); return; }
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("/api/miembro/membresia-activa", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
      if (res.data.tiene_membresia) setAccessLevel(res.data.membresia.tipo);
      else setAccessLevel("basico");
    })
    .catch(() => {});
  }, [role]);

  // Cerrar theme menu al hacer click fuera
  useEffect(() => {
    const fn = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) setShowOptionsMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  });

  // Re-sync user when photo or profile fields are updated from any module
  useEffect(() => {
    const onUserUpdate = () => {
      try { setUser(JSON.parse(localStorage.getItem("user") || "{}")); } catch {}
    };
    window.addEventListener("userDataUpdated", onUserUpdate);
    return () => window.removeEventListener("userDataUpdated", onUserUpdate);
  }, []);

  const initials  = (user.nombre || "US").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  const isRestricted = accessLevel === "basico";
  // TODO(membresías): bloqueo de secciones premium desactivado temporalmente
  // para la demo. Restaurar con ["training", "health", "nutrition"] cuando
  // se ajuste la lógica de niveles de membresía.
  const BLOCKED = [];
  // HU-45: Administrador comparte el panel owner_gym con Propietario,
  // pero varias secciones son exclusivas del dueño real de la organización
  // -- se filtran aquí para no mostrarle enlaces que terminarían en 403
  // (o, para "Mi Suscripción"/billing SaaS, que no debería tocar aunque el
  // backend hoy solo bloquee sus endpoints de escritura, no la lectura; ver
  // SCRUM-221/HU-50, Lote 2, para el control formal de esa cuenta):
  //   - "ow-sucursales"    -- alta de sucursales/administradores (sucursales.py, Propietario-only)
  //   - "ow-subscription"  -- suscripción SaaS con GymPro (billing.py, afecta a TODA la organización)
  //   - "ow-backups"       -- respaldos y restauración (tenant_backups_bp, Propietario-only)
  // "ow-pagos-online" (Cobros en línea) SÍ se deja visible: pasarelas.py ya
  // permite a un Administrador configurar el cobro de SU propia sucursal
  // (ver _ROLES_ADMIN en ese archivo), a propósito.
  const esAdministrador = normalizarRol(user.role) === ROL_ADMINISTRADOR;
  // HU-45: "role" (prop del panel) es compartido ("owner_gym") entre
  // Propietario y Administrador -- el rol real para el badge viene de
  // esAdministrador (que sí lee user.role), no de ROLE_LABELS.
  const roleLabel = role === "owner_gym"
    ? (esAdministrador ? "ADMINISTRADOR" : "PROPIETARIO")
    : (ROLE_LABELS[role] || "USER");
  const OCULTOS_PARA_ADMINISTRADOR = ["ow-sucursales", "ow-subscription", "ow-backups"];
  // "ow-subscription" y "ow-backups" viven dentro de children (submenú
  // "Configuración"), no al nivel raíz -- hay que filtrar ahí también, no
  // solo el arreglo de primer nivel.
  // HU-47/SCRUM-218: "Verificar Visitante" solo tiene sentido con 2+
  // sucursales en la organización -- independiente de si es Administrador
  // o Propietario, así que es una segunda condición de ocultado, no una
  // regla exclusiva de Administrador como la de arriba.
  const ID_SOLO_MULTISUCURSAL = ["ow-verificar-sucursal", "verificar-sucursal"];
  const filtrarOcultos = (items) => items
    .filter((item) => !(esAdministrador && OCULTOS_PARA_ADMINISTRADOR.includes(item.id)))
    .filter((item) => !(!multiSucursal && ID_SOLO_MULTISUCURSAL.includes(item.id)))
    .map((item) => item.children ? { ...item, children: filtrarOcultos(item.children) } : item);
  const menu = filtrarOcultos(MENUS[role] || MENUS.user);

  const handleRestricted = (label) => {
    Swal.fire({
      icon: "warning",
      title: "Acceso Restringido",
      html: `<p><strong>${label}</strong> requiere membresía <b style="color:#eab308">Premium</b>.</p>`,
      confirmButtonText: "Renovar",
      confirmButtonColor: "#6366f1",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary, #f1f5f9)",
    }).then(r => { if (r.isConfirmed) onTabChange("renew"); });
  };

  const W = collapsed ? 72 : 260;

  // ── Estilos base ──────────────────────────────────────────────
  const S = {
    aside: {
      width: W,
      minWidth: W,
      // En movil el drawer es un overlay a ancho fijo; se limita a 85vw
      // para no tapar la pantalla entera en telefonos muy angostos.
      maxWidth: isMobile ? "85vw" : W,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: P.bg,
      borderRight: `1px solid ${P.border}`,
      flexShrink: 0,
      // overflow visible: el boton de colapsar sobresale del borde derecho
      // (right: -14) y con "hidden" quedaba recortado, asi que no se veia.
      // El recorte que si hace falta esta en la lista de navegacion.
      overflow: "visible",
      transition: "width .3s cubic-bezier(.4,0,.2,1), min-width .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1)",
      // En movil el sidebar sale del flujo normal (fixed) y vive oculto
      // fuera de pantalla hasta que se abre, en vez de compartir el ancho
      // con el contenido -- esto es lo que corrige que todo se viera
      // encimado: antes el sidebar (260px fijos) le quitaba ese espacio a
      // un viewport de 360-400px sin que ningun media query pudiera hacer
      // nada, porque todo este componente usa estilos inline, no clases.
      position: isMobile ? "fixed" : "relative",
      top: 0,
      left: 0,
      transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "none",
      boxShadow: isMobile && mobileOpen ? "8px 0 32px rgba(0,0,0,.45)" : "none",
      zIndex: 1000,
    },
    collapseBtn: {
      position: "absolute",
      top: 18,
      right: -14,
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: P.accent,
      // Borde del color del fondo de la página: recorta el círculo contra el
      // contenido y hace que se lea como un control, no como un adorno pegado.
      border: "2px solid var(--bg-body, #0f1117)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      // Por encima del contenido de la página, que tiene su propio apilamiento.
      zIndex: 300,
      boxShadow: "0 2px 10px rgba(0,0,0,.35)",
      transition: "transform .2s",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: collapsed ? "20px 0" : "20px 16px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: `1px solid ${P.border}`,
      flexShrink: 0,
    },
    brandText: {
      fontSize: 16,
      fontWeight: 800,
      color: P.text,
      letterSpacing: ".05em",
      whiteSpace: "nowrap",
      overflow: "hidden",
    },
    badge: {
      fontSize: 9,
      fontWeight: 700,
      padding: "2px 7px",
      borderRadius: 99,
      background: P.bgActive,
      color: P.accentSoft,
      letterSpacing: ".08em",
      whiteSpace: "nowrap",
    },
    nav: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      overflowX: "hidden",
      padding: "10px 8px",
      gap: 2,
    },
    divider: {
      height: 1,
      background: P.border,
      margin: "6px 4px",
      flexShrink: 0,
    },
    menuItem: (isActive, isRestr) => ({
      display: "flex",
      flexDirection: "column",
      borderRadius: 8,
      cursor: "pointer",
      background: isActive ? P.bgActive : "transparent",
      opacity: isRestr ? 0.55 : 1,
      transition: "background .15s",
      flexShrink: 0,
      overflow: "hidden",
    }),
    menuRow: (isActive) => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: collapsed ? "10px 0" : "10px 12px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderLeft: isActive ? `3px solid ${P.accent}` : "3px solid transparent",
      transition: "border-color .15s",
    }),
    icon: { flexShrink: 0, color: "inherit", display: "flex", alignItems: "center" },
    label: {
      fontSize: 13.5,
      fontWeight: 500,
      color: P.text,
      whiteSpace: "nowrap",
      flex: 1,
      overflow: "hidden",
    },
    submenu: {
      paddingLeft: 16,
      display: "flex",
      flexDirection: "column",
      gap: 1,
      paddingBottom: 4,
    },
    subItem: (isActive) => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px 8px 8px",
      borderRadius: 6,
      cursor: "pointer",
      background: isActive ? P.bgHover : "transparent",
      fontSize: 13,
      color: isActive ? P.accentSoft : P.muted,
      transition: "background .15s",
    }),
    footer: {
      borderTop: `1px solid ${P.border}`,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      padding: "8px",
      flexShrink: 0,
    },
    footerBtn: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: collapsed ? "9px 0" : "9px 12px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: 8,
      cursor: "pointer",
      color: P.muted,
      fontSize: 13,
      background: "transparent",
      border: "none",
      textDecoration: "none",
      transition: "background .15s, color .15s",
      width: "100%",
      textAlign: "left",
    },
    userSection: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: collapsed ? "12px 0" : "12px 12px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderTop: `1px solid ${P.border}`,
      flexShrink: 0,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: `linear-gradient(135deg, ${P.accent}, ${P.accentSoft})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "#fff",
      flexShrink: 0,
    },
    themeDropdown: {
      position: "absolute",
      bottom: "100%",
      left: 8,
      right: 8,
      background: "var(--sidebar-elevated, #232A3D)",
      border: `1px solid ${P.border}`,
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 -8px 24px rgba(0,0,0,.3)",
      zIndex: 200,
    },
  };

  return (
    <>
      {/* Boton hamburguesa: fijo fuera del <aside>, sigue visible y
          clicable aunque el drawer este totalmente fuera de pantalla
          (transform: translateX(-100%)). Solo en movil -- en escritorio
          el control sigue siendo el boton circular de colapsar de abajo. */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
          title={mobileOpen ? "Cerrar menu" : "Abrir menu"}
          style={{
            position: "fixed", top: 14, left: 14, width: 42, height: 42,
            borderRadius: 10, background: P.bg, border: `1px solid ${P.border}`,
            color: P.text, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 1100, boxShadow: "0 2px 10px rgba(0,0,0,.35)",
          }}
        >
          {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      )}

      {/* Fondo semitransparente detras del drawer abierto: tocarlo lo
          cierra, patron estandar de menu off-canvas. */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 999 }}
        />
      )}

      <aside style={S.aside}>
      {/* Collapse button: solo aplica en escritorio -- en movil el drawer
          siempre se muestra a ancho completo y se abre/cierra con el
          boton hamburguesa de arriba, no con este. */}
      {!isMobile && (
        <button
          style={S.collapseBtn}
          onClick={() => setCollapsedPref(c => !c)}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>
      )}

      {/* Header */}
      <div style={S.header}>
        <img
          src="/logo64.png"
          alt="GymPro"
          style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, objectFit: "cover" }}
        />
        {!collapsed && (
          <>
            <span style={S.brandText}>GYM PRO</span>
            <span style={S.badge}>{roleLabel}</span>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav style={S.nav}>
        {menu.map((item, i) => {
          if (item.type === "divider") return <div key={i} style={S.divider} />;

          const hasChildren  = !!item.children?.length;
          const isChildActive = hasChildren && item.children.some(c => c.id === activeTab);
          const isActive     = activeTab === item.id || isChildActive;
          const isOpen       = openSubmenu === item.id;
          const isRestr      = isRestricted && BLOCKED.includes(item.id);

          return (
            <div key={item.id} style={S.menuItem(isActive, isRestr)}>
              <div
                style={S.menuRow(isActive)}
                onClick={() => {
                  if (isRestr) { handleRestricted(item.label); return; }
                  if (hasChildren) setOpenSubmenu(isOpen ? null : item.id);
                  else {
                    setOpenSubmenu(null);
                    onTabChange(item.id);
                    if (isMobile) setMobileOpen(false);
                  }
                }}
                onMouseEnter={e => { e.currentTarget.style.background = P.bgHover; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ ...S.icon, color: isActive ? P.accentSoft : P.muted }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span style={{ ...S.label, color: isActive ? P.text : P.muted }}>{item.label}</span>
                    {isRestr && <FiLock size={12} style={{ color: P.dim }} />}
                    {hasChildren && (
                      <FiChevronDown
                        size={13}
                        style={{ color: P.dim, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Submenu */}
              {hasChildren && isOpen && !collapsed && !isRestr && (
                <div style={S.submenu}>
                  {item.children.map(sub => (
                    <div
                      key={sub.id}
                      style={S.subItem(activeTab === sub.id)}
                      onClick={e => { e.stopPropagation(); onTabChange(sub.id); setOpenSubmenu(null); if (isMobile) setMobileOpen(false); }}
                      onMouseEnter={e => { if (activeTab !== sub.id) e.currentTarget.style.background = P.bgHover; }}
                      onMouseLeave={e => { if (activeTab !== sub.id) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{sub.icon}</span>
                      <span>{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer -- Temas/Guía/Términos/Manual viven en un solo desplegable
          ("Más opciones") para no apilar 4 filas sueltas; Salir se queda
          fuera, siempre visible, por ser la acción más usada y la que
          conviene que nunca quede escondida. */}
      <div style={S.footer}>
        <div ref={optionsRef} style={{ position: "relative" }}>
          {showOptionsMenu && (
            <div style={S.themeDropdown}>
              {/* Selector de tema: fila compacta de iconos -- evita anidar
                  un segundo desplegable dentro de este. */}
              <div style={{
                display: "flex", justifyContent: "space-around",
                padding: "10px 8px", borderBottom: `1px solid ${P.border}`,
              }}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    title={t.label}
                    onClick={() => changeTheme(t.id)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                      background: theme === t.id ? P.bgActive : "transparent",
                      color: theme === t.id ? P.accentSoft : P.muted,
                    }}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>

              {onOpenGuide && (
                <button
                  style={{ ...S.footerBtn, padding: "10px 14px", borderRadius: 0, color: P.accentSoft }}
                  onClick={() => { onOpenGuide(); setShowOptionsMenu(false); }}
                  onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={S.icon}><FiHelpCircle size={15} /></span>
                  {!collapsed && <span>Guía del sistema</span>}
                </button>
              )}

              <a
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...S.footerBtn, padding: "10px 14px", borderRadius: 0 }}
                onClick={() => setShowOptionsMenu(false)}
                onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={S.icon}><FiFileText size={15} /></span>
                {!collapsed && <span>Términos y Cond.</span>}
              </a>

            </div>
          )}
          <button
            style={{ ...S.footerBtn, borderRadius: 8 }}
            onClick={() => setShowOptionsMenu(v => !v)}
            onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={S.icon}><FiMoreHorizontal size={15} /></span>
            {!collapsed && <span>Más opciones</span>}
          </button>
        </div>

        <button
          style={{ ...S.footerBtn, color: "var(--danger, #ef4444)" }}
          onClick={onLogout}
          onMouseEnter={e => e.currentTarget.style.background = "var(--danger-bg, rgba(239,68,68,.1))"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={S.icon}><FiLogOut size={15} /></span>
          {!collapsed && <span>Salir</span>}
        </button>
      </div>

      {/* User info */}
      <div style={S.userSection}>
        <div style={S.avatar}>
          {(() => {
            const raw = user.foto || user.foto_perfil;
            if (!raw) return initials;
            // If already a data URL or absolute URL, use directly; otherwise prefix with upload path
            const src = (raw.startsWith("data:") || raw.startsWith("http") || raw.startsWith("/"))
              ? raw
              : `/api/uploads/${raw}`;
            return <img src={src} alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              onError={e => { e.currentTarget.style.display = "none"; }} />;
          })()}
        </div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={S.brandText}>{user.nombre || "Usuario"}</span>
            <span style={S.badge}>{roleLabel}</span>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}
