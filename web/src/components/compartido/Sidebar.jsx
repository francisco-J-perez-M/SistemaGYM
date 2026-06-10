import { useState, useRef, useEffect } from "react";
import useTheme from "../../hooks/ThemeContext";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiSun, FiMoon, FiStar, FiBarChart2, FiUsers, FiDollarSign,
  FiSettings, FiUpload, FiDownload, FiClipboard, FiTrendingUp,
  FiRefreshCw, FiUser, FiUserCheck, FiCalendar, FiClock,
  FiFileText, FiMail, FiLogOut, FiActivity, FiLock, FiCreditCard,
  FiShoppingCart, FiBookOpen, FiCpu, FiPieChart, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiGlobe, FiPackage, FiServer,
  FiSliders,
} from "react-icons/fi";
import { GiMuscleUp, GiFruitBowl, GiMeal } from "react-icons/gi";

// ── Palette (sin CSS externo) ─────────────────────────────────
const P = {
  bg:        "var(--bg-sidebar, var(--bg-card, #151820))",
  bgHover:   "var(--bg-hover, #1e2233)",
  bgActive:  "var(--accent-dim, rgba(99,102,241,.18))",
  accent:    "var(--accent, #6366f1)",
  accentSoft:"var(--accent-soft, #818cf8)",
  border:    "var(--border)",
  text:      "var(--text-primary, #f1f5f9)",
  muted:     "var(--text-secondary, #94a3b8)",
  dim:       "var(--text-tertiary, #64748b)",
  badge:     "var(--warning, #eab308)",
  badgeBg:   "var(--warning-bg, rgba(234,179,8,.15))",
};

const MENUS = {
  owner_gym: [
    { id: "ow-dashboard",  label: "Dashboard",       icon: <FiBarChart2 />    },
    { id: "ow-miembros",   label: "Miembros",         icon: <FiUsers />        },
    { id: "ow-pagos",      label: "Pagos",            icon: <FiDollarSign />   },
    { id: "ow-pos",        label: "Punto de Venta",   icon: <FiShoppingCart /> },
    { type: "divider" },
    { id: "ow-staff",      label: "Staff",            icon: <FiUserCheck />    },
    { id: "ow-membresias", label: "Membresías",        icon: <FiCreditCard />   },
    { type: "divider" },
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
        { id: "ow-profile", label: "Perfil del Gym",            icon: <FiUser />   },
        { id: "ow-backups", label: "Respaldos y Restauración", icon: <FiUpload /> },
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
        { id: "routine",      label: "Mi Rutina",              icon: <FiFileText />   },
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
    { id: "clients",   label: "Mis Clientes",    icon: <FiUsers />        },
    { id: "requests",  label: "Solicitudes PT",  icon: <GiMuscleUp />     },
    { id: "schedule",  label: "Agenda",          icon: <FiCalendar />     },
    { id: "routines",  label: "Rutinas",         icon: <FiFileText />     },
    { id: "diets",     label: "Dietas",          icon: <GiMeal />         },
    { type: "divider" },
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
    { type: "divider" },
    { id: "checkins",     label: "Check-ins", icon: <FiUserCheck /> },
    { id: "appointments", label: "Citas",     icon: <FiCalendar />  },
    { id: "payments",     label: "Pagos",     icon: <FiDollarSign />},
    { id: "members",      label: "Miembros",  icon: <FiUsers />     },
    { type: "divider" },
    { id: "messages", label: "Bitácora", icon: <FiActivity />  },
    { id: "tasks",    label: "Tareas",   icon: <FiClipboard /> },
    { type: "divider" },
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
        { id: "sa-backups",   label: "Backups",   icon: <FiServer />        },
        { id: "sa-analytics", label: "Analytics", icon: <FiBarChart2 />     },
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
}) {
  const { theme, changeTheme } = useTheme();
  const [collapsed,      setCollapsed]      = useState(false);
  const [openSubmenu,    setOpenSubmenu]    = useState(null);
  const [showThemeMenu,  setShowThemeMenu]  = useState(false);
  const [accessLevel,    setAccessLevel]    = useState("premium");
  const themeRef = useRef(null);

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
      if (themeRef.current && !themeRef.current.contains(e.target)) setShowThemeMenu(false);
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
  const menu = MENUS[role] || MENUS.user;

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
      maxWidth: W,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: P.bg,
      borderRight: `1px solid ${P.border}`,
      flexShrink: 0,
      overflow: "hidden",
      transition: "width .3s cubic-bezier(.4,0,.2,1), min-width .3s cubic-bezier(.4,0,.2,1)",
      position: "relative",
      zIndex: 100,
    },
    collapseBtn: {
      position: "absolute",
      top: 18,
      right: -14,
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: P.accent,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      zIndex: 10,
      boxShadow: "0 2px 8px rgba(99,102,241,.4)",
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
      background: "var(--bg-card)",
      border: `1px solid ${P.border}`,
      borderRadius: 10,
      overflow: "hidden",
      boxShadow: "0 -8px 24px rgba(0,0,0,.3)",
      zIndex: 200,
    },
  };

  const currentThemeIcon = <FiSliders size={15} />;

  return (
    <aside style={S.aside}>
      {/* Collapse button */}
      <button
        style={S.collapseBtn}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expandir" : "Colapsar"}
      >
        {collapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
      </button>

      {/* Header */}
      <div style={S.header}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: P.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>G</span>
        </div>
        {!collapsed && (
          <>
            <span style={S.brandText}>GYM PRO</span>
            <span style={S.badge}>{ROLE_LABELS[role] || "USER"}</span>
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
                  else { setOpenSubmenu(null); onTabChange(item.id); }
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
                      onClick={e => { e.stopPropagation(); onTabChange(sub.id); setOpenSubmenu(null); }}
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

      {/* Footer */}
      <div style={S.footer}>
        {/* Theme selector */}
        <div ref={themeRef} style={{ position: "relative" }}>
          {showThemeMenu && (
            <div style={S.themeDropdown}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  style={{
                    ...S.footerBtn,
                    padding: "10px 14px",
                    borderRadius: 0,
                    fontWeight: theme === t.id ? 600 : 400,
                    color: theme === t.id ? P.accentSoft : P.muted,
                    background: theme === t.id ? P.bgActive : "transparent",
                  }}
                  onClick={() => { changeTheme(t.id); setShowThemeMenu(false); }}
                >
                  <span style={S.icon}>{t.icon}</span>
                  {!collapsed && <span>{t.label}</span>}
                </button>
              ))}
            </div>
          )}
          <button
            style={{ ...S.footerBtn, borderRadius: 8 }}
            onClick={() => setShowThemeMenu(v => !v)}
            onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={S.icon}>{currentThemeIcon}</span>
            {!collapsed && <span>Temas</span>}
          </button>
        </div>

        <a
          href="/Terminos y Condiciones.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={S.footerBtn}
          onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={S.icon}><FiFileText size={15} /></span>
          {!collapsed && <span>Términos y Cond.</span>}
        </a>

        <a
          href={role === "admin" ? "/Manual de Administrador.pdf" : role === "trainer" ? "/Manual de Entrenador.pdf" : "/Manual de Usuario.pdf"}
          target="_blank"
          rel="noopener noreferrer"
          style={S.footerBtn}
          onMouseEnter={e => e.currentTarget.style.background = P.bgHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={S.icon}><FiBookOpen size={15} /></span>
          {!collapsed && <span>Manual de Ayuda</span>}
        </a>

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
            <span style={S.brandText}>GYM PRO</span>
            <span style={S.badge}>{ROLE_LABELS[role] || "USER"}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
