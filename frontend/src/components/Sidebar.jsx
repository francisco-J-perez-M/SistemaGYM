import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useTheme from "../hooks/ThemeContext";
import { 
  FiSun, 
  FiMoon, 
  FiStar,
  FiBarChart2,
  FiUsers,
  FiDollarSign,
  FiSettings,
  FiUpload,
  FiDownload,
  FiClipboard,
  FiTrendingUp,
  FiRefreshCw,
  FiUser,
  FiUserCheck,
  FiCalendar,
  FiClock,
  FiFileText,
  FiMail,
  FiLogOut,
  FiActivity,
  FiHeart,
  FiTarget,
  FiAward,
  FiCreditCard
} from "react-icons/fi";
import { GiPineTree, GiMuscleUp, GiFruitBowl, GiBodyHeight } from "react-icons/gi";

export default function Sidebar({ role = "admin", activeTab = "overview", onTabChange = () => {}, onLogout = () => {} }) {
  const { theme, changeTheme } = useTheme();
  
  const [collapsed, setCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const menuRef = useRef(null);

  const themeOptions = [
    { id: "light", label: "Claro", icon: <FiSun /> },
    { id: "dark", label: "Oscuro", icon: <FiMoon /> },
    { id: "forest", label: "Bosque", icon: <GiPineTree /> },
    { id: "nebula", label: "Nebulosa", icon: <FiStar /> },
  ];

  const currentTheme = themeOptions.find(t => t.id === theme);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menus = {
    admin: [
      { 
        id: "overview", 
        label: "Resumen KPIs", 
        icon: <FiBarChart2 />
      },
      { 
        id: "miembros", 
        label: "Miembros", 
        icon: <FiUsers />
      },
      { 
        id: "pagos", 
        label: "Pagos", 
        icon: <FiDollarSign />
      },
      { type: "divider" },
      {
        id: "settings",
        label: "Configuración",
        icon: <FiSettings />,
        children: [
          {
            id: "backups",
            label: "Copias de seguridad",
            icon: <FiUpload />
          },
          {
            id: "restore",
            label: "Restaurar respaldo",
            icon: <FiDownload />
          }
        ]
      }
    ],

    user: [
      { 
        id: "dashboard", 
        label: "Mi Dashboard", 
        icon: <FiActivity />
      },
      { type: "divider" },
      {
        id: "training",
        label: "Entrenamiento",
        icon: <GiMuscleUp />,
        children: [
          {
            id: "routine",
            label: "Mi Rutina",
            icon: <FiFileText />
          },
          {
            id: "progress",
            label: "Progreso Físico",
            icon: <FiTrendingUp />
          },
          {
            id: "body-metrics",
            label: "Métricas Corporales",
            icon: <GiBodyHeight />
          }
        ]
      },
      {
        id: "nutrition",
        label: "Nutrición",
        icon: <GiFruitBowl />,
        children: [
          {
            id: "meal-plan",
            label: "Plan Alimenticio",
            icon: <FiCalendar />
          },
          {
            id: "health",
            label: "Salud y Bienestar",
            icon: <FiHeart />
          }
        ]
      },
      { type: "divider" },
      {
        id: "membership",
        label: "Mi Membresía",
        icon: <FiCreditCard />,
        children: [
          {
            id: "payments",
            label: "Historial de Pagos",
            icon: <FiClipboard />
          },
          {
            id: "renew",
            label: "Renovar Membresía",
            icon: <FiRefreshCw />
          }
        ]
      },
      { 
        id: "profile", 
        label: "Mi Perfil", 
        icon: <FiUser />
      }
    ],

    trainer: [
      { 
        id: "clients", 
        label: "Mis Clientes", 
        icon: <FiUsers />
      },
      { 
        id: "schedule", 
        label: "Agenda", 
        icon: <FiCalendar />
      },
      { 
        id: "sessions", 
        label: "Sesiones", 
        icon: <FiClock />
      },
      { 
        id: "routines", 
        label: "Rutinas", 
        icon: <FiFileText />
      },
      { type: "divider" },
      { 
        id: "reports", 
        label: "Reportes", 
        icon: <FiBarChart2 />
      },
      { 
        id: "profile", 
        label: "Mi Perfil", 
        icon: <FiUser />
      }
    ],

    receptionist: [
      { 
        id: "checkins", 
        label: "Check-ins", 
        icon: <FiUserCheck />
      },
      { 
        id: "appointments", 
        label: "Citas", 
        icon: <FiCalendar />
      },
      { 
        id: "payments", 
        label: "Pagos", 
        icon: <FiDollarSign />
      },
      { 
        id: "members", 
        label: "Miembros", 
        icon: <FiUsers />
      },
      { type: "divider" },
      { 
        id: "messages", 
        label: "Mensajes", 
        icon: <FiMail />
      },
      { 
        id: "tasks", 
        label: "Tareas", 
        icon: <FiClipboard />
      }
    ]
  };

  const currentMenu = menus[role] || menus.user;

  const getRoleName = () => {
    const roleNames = {
      admin: "ADMIN",
      user: "MIEMBRO",
      trainer: "ENTRENADOR",
      receptionist: "RECEPCIÓN"
    };
    return roleNames[role] || "USER";
  };

  const getUserName = () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      const initials = userData.nombre?.split(" ").map(n => n[0]).join("") || "US";
      return {
        initials,
        name: userData.nombre || "Usuario",
        role: userData.role || "Miembro"
      };
    }
    return { initials: "US", name: "Usuario", role: "Miembro" };
  };

  const userData = getUserName();

  return (
    <motion.aside 
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Botón de colapsar */}
      <motion.button 
        className="collapse-btn" 
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Colapsar menú"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </motion.svg>
      </motion.button>

      <motion.div 
        className="sidebar-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="brand-name">GYM PRO</span>
        <motion.span 
          className="admin-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          {getRoleName()}
        </motion.span>
      </motion.div>

      <ul className="sidebar-menu">
        <AnimatePresence>
          {currentMenu.map((item, i) => {
            if (item.type === "divider") {
              return (
                <motion.li 
                  key={i} 
                  className="divider"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              );
            }

            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children.some(child => child.id === activeTab);
            const isOpen = openSubmenu === item.id || isChildActive;
            const isParentActive = activeTab === item.id && !hasChildren;

            return (
              <motion.li 
                key={item.id}
                className={isParentActive || isChildActive ? "active" : ""}
                onClick={() => {
                  if (hasChildren) {
                    setOpenSubmenu(openSubmenu === item.id ? null : item.id);
                  } else {
                    onTabChange(item.id);
                  }
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                
                {hasChildren && (
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center' }}
                  >
                    <FiBarChart2 style={{ transform: 'rotate(90deg)' }} size={14} />
                  </motion.div>
                )}

                {/* SUBMENÚ */}
                <AnimatePresence>
                  {hasChildren && isOpen && (
                    <motion.div 
                      className="submenu-wrapper open"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="submenu-inner">
                        <ul className="submenu">
                          {item.children.map((sub, idx) => (
                            <motion.li
                              key={sub.id}
                              className={activeTab === sub.id ? "active" : ""}
                              onClick={(e) => {
                                e.stopPropagation();
                                onTabChange(sub.id);
                              }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ x: 5 }}
                            >
                              <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center' }}>
                                {sub.icon}
                              </div>
                              <span>{sub.label}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="sidebar-footer">
        {/* SELECTOR DE TEMA */}
        <div className="theme-menu-container" ref={menuRef}>
          <AnimatePresence>
            {showThemeMenu && (
              <motion.div 
                className="theme-dropdown"
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {themeOptions.map((t, idx) => (
                  <motion.button
                    key={t.id}
                    className={`theme-option ${theme === t.id ? "active" : ""}`}
                    onClick={() => {
                      changeTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="theme-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className={`theme-toggle-btn ${showThemeMenu ? "active" : ""}`}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="theme-btn-left">
              <span className="theme-toggle-icon">
                {currentTheme?.icon || <FiStar />}
              </span>
              <span className="theme-btn-text">Temas</span>
            </div>

            <motion.div
              animate={{ rotate: showThemeMenu ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </motion.div>
          </motion.button>
        </div>

        {/* BOTÓN LOGOUT */}
        <motion.button 
          onClick={onLogout} 
          className="logout-btn-sidebar"
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiLogOut />
          <span>Salir</span>
        </motion.button>
      </div>

      {/* INFO DE USUARIO AL FINAL */}
      <motion.div 
        className="user-info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="avatar">{userData.initials}</div>
        <div className="user-info">
          <span className="name">{userData.name}</span>
          <span className="role">{userData.role}</span>
        </div>
      </motion.div>
    </motion.aside>
  );
}