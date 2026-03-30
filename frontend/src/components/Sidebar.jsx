import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useTheme from "../hooks/ThemeContext";
import Swal from "sweetalert2";
import axios from "axios";
import { 
  FiSun, FiMoon, FiStar, FiBarChart2, FiUsers, FiDollarSign,
  FiSettings, FiUpload, FiDownload, FiClipboard, FiTrendingUp,
  FiRefreshCw, FiUser, FiUserCheck, FiCalendar, FiClock,
  FiFileText, FiMail, FiLogOut, FiActivity, FiLock, FiCreditCard,
  FiShoppingCart, FiBookOpen, FiCpu, FiPieChart
} from "react-icons/fi";
import { GiMuscleUp, GiFruitBowl, GiPineTree, GiMeal } from "react-icons/gi";

export default function Sidebar({ role = "admin", activeTab = "overview", onTabChange = () => {}, onLogout = () => {} }) {
  const { theme, changeTheme } = useTheme();
  
  const [collapsed, setCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  
  // --- LÓGICA PARA EL MANUAL DE USUARIO ---
  const getManualUrl = () => {
    switch (role) {
      case "admin":
        return "/Manual de Administrador.pdf";
      case "trainer":
        return "/Manual de Entrenador.pdf";
      default:
        // Cubre: 'user', 'miembro', 'receptionist' y cualquier otro
        return "/Manual de Usuario.pdf";
    }
  };
  
  const manualUrl = getManualUrl();
  // ----------------------------------------

  const [accessLevel, setAccessLevel] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const initialLevel = user.access_level || "basico";
      console.log("🎯 [SIDEBAR] Access level inicial desde localStorage:", initialLevel);
      return initialLevel;
    } catch {
      console.warn("⚠️ [SIDEBAR] Error al leer localStorage, usando 'basico'");
      return "basico";
    }
  });
  
  const menuRef = useRef(null);

  useEffect(() => {
    const verificarMembresia = async () => {
      console.log("🔍 [SIDEBAR] Iniciando verificación de membresía");
      console.log("🔍 [SIDEBAR] Role:", role);
      
      if (role !== "user" && role !== "miembro") {
        console.log("✅ [SIDEBAR] Usuario no es miembro, acceso premium automático");
        setAccessLevel("premium");
        setIsLoadingAccess(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        console.log("🔍 [SIDEBAR] Token presente:", !!token);
        
        if (!token) {
          console.warn("⚠️ [SIDEBAR] No hay token, usando access_level del localStorage");
          setIsLoadingAccess(false);
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const endpoint = `${API_URL}/miembro/membresia-activa`;
        
        console.log("🔍 [SIDEBAR] Llamando a:", endpoint);
        
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("✅ [SIDEBAR] Respuesta recibida:", response.data);

        if (response.data.tiene_membresia) {
          const tipo = response.data.membresia.tipo;
          console.log("✅ [SIDEBAR] Membresía activa detectada:", {
            nombre: response.data.membresia.nombre,
            tipo: tipo,
            fecha_fin: response.data.membresia.fecha_fin
          });
          
          setAccessLevel(tipo);
          console.log("✅ [SIDEBAR] AccessLevel actualizado a:", tipo);
          
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.access_level = tipo;
          user.membership_plan = response.data.membresia.nombre;
          localStorage.setItem("user", JSON.stringify(user));
          console.log("✅ [SIDEBAR] localStorage actualizado");
        } else {
          console.warn("⚠️ [SIDEBAR] No tiene membresía activa");
          setAccessLevel("basico");
        }
      } catch (error) {
        console.error("❌ [SIDEBAR] Error verificando membresía:", error);
        console.error("❌ [SIDEBAR] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        console.log("⚠️ [SIDEBAR] Manteniendo access_level actual:", accessLevel);
      } finally {
        setIsLoadingAccess(false);
        console.log("🏁 [SIDEBAR] Verificación completada");
      }
    };

    verificarMembresia();
  }, [role, activeTab]);

  const getUserData = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return { role: "miembro", nombre: "Usuario" };
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return { role: "miembro", nombre: "Usuario" };
    }
  };

  const userDataRaw = getUserData();
  const isRestricted = accessLevel === "basico";
  
  // IDs de menús bloqueados para usuarios básicos
  const blockedMenuIds = ["training", "health", "nutrition"];

  console.log("🔍 [SIDEBAR RENDER] Estado actual:", {
    accessLevel,
    isRestricted,
    isLoadingAccess,
    blockedMenuIds
  });

  const handleRestrictedAccess = (itemName = "esta sección") => {
    Swal.fire({
      icon: "warning",
      title: "Acceso Restringido",
      html: `
        <div style="text-align: left;">
          <p>La sección <strong>${itemName}</strong> requiere una membresía <span style="color: #eab308; font-weight: bold;">Premium</span>.</p>
          <p style="font-size: 0.9em; color: var(--text-secondary); margin-top: 10px;">
            Tu plan actual: <b>${userDataRaw.membership_plan || "Básico"}</b>
          </p>
        </div>
      `,
      confirmButtonText: "Renovar Membresía",
      confirmButtonColor: "#eab308",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      background: 'var(--bg-card-dark, #1f2937)',
      color: 'var(--text-primary, #fff)',
    }).then((result) => {
      if (result.isConfirmed) {
        setOpenSubmenu("membership");
        onTabChange("renew");
      }
    });
  };

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
      { id: "overview", label: "Resumen KPIs", icon: <FiBarChart2 /> },
      { id: "miembros", label: "Miembros", icon: <FiUsers /> },
      { id: "pagos", label: "Pagos", icon: <FiDollarSign /> },
      { type: "divider" },
      {
        id: "analytics",
        label: "IA & Analíticas",
        icon: <FiCpu />,
        children: [
          { id: "mapreduce", label: "Finanzas y Flujo", icon: <FiPieChart /> },
          { id: "kmeans", label: "Segmentación", icon: <FiUsers /> },
          { id: "regresion", label: "Tendencias", icon: <FiTrendingUp /> }
        ]
      },
      {
        id: "settings",
        label: "Configuración",
        icon: <FiSettings />,
        children: [
          { id: "backups", label: "Copias de seguridad", icon: <FiUpload /> },
          { id: "restore", label: "Restaurar respaldo", icon: <FiDownload /> }
        ]
      }
    ],

    user: [
      { id: "dashboard", label: "Mi Dashboard", icon: <FiActivity /> },
      { id: "pos", label: "Punto de Venta", icon: <FiShoppingCart /> },
      { type: "divider" },
      {
        id: "training",
        label: "Entrenamiento",
        icon: <GiMuscleUp />,
        children: [
          { id: "routine", label: "Mi Rutina", icon: <FiFileText /> },
          { id: "progress", label: "Progreso Físico", icon: <FiTrendingUp /> },
          { id: "prediction", label: "Mi Predicción", icon: <FiCpu /> },
        ]
      },
      {
        id: "nutrition",
        label: "Nutrición",
        icon: <GiMeal />,
        children: [
          { id: "meal-plan", label: "Plan de Comidas", icon: <GiFruitBowl /> },
          { id: "recipes", label: "Recetas Saludables", icon: <FiFileText /> },
        ]
      },
      { type: "divider" },
      {
        id: "membership",
        label: "Mi Membresía",
        icon: <FiCreditCard />,
        children: [
          { id: "payments", label: "Historial de Pagos", icon: <FiClipboard /> },
          { id: "renew", label: "Renovar Membresía", icon: <FiRefreshCw /> }
        ]
      },
      { id: "profile", label: "Mi Perfil", icon: <FiUser /> }
    ],

    trainer: [
      { id: "clients", label: "Mis Clientes", icon: <FiUsers /> },
      { id: "schedule", label: "Agenda", icon: <FiCalendar /> },
      { id: "sessions", label: "Sesiones", icon: <FiClock /> },
      { id: "routines", label: "Rutinas", icon: <FiFileText /> },
      { type: "divider" },
      {
        id: "ia-coach",
        label: "IA Coach",
        icon: <FiCpu />,
        children: [
          { id: "trainer-kmeans", label: "Segmentación", icon: <FiUsers /> },
          { id: "trainer-regresion", label: "Predicciones", icon: <FiTrendingUp /> }
        ]
      },
      { id: "reports", label: "Reportes", icon: <FiBarChart2 /> },
      { id: "profile", label: "Mi Perfil", icon: <FiUser /> }
    ],

    receptionist: [
      { id: "checkins", label: "Check-ins", icon: <FiUserCheck /> },
      { id: "appointments", label: "Citas", icon: <FiCalendar /> },
      { id: "payments", label: "Pagos", icon: <FiDollarSign /> },
      { id: "members", label: "Miembros", icon: <FiUsers /> },
      { type: "divider" },
      { id: "messages", label: "Mensajes", icon: <FiMail /> },
      { id: "tasks", label: "Tareas", icon: <FiClipboard /> }
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

  const getDisplayUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const initials = u.nombre?.split(" ").map(n => n[0]).join("") || "US";
        return {
          initials,
          name: u.nombre || "Usuario",
          role: u.role || "Miembro"
        };
      }
    } catch (e) {
      console.error("Error al obtener datos del usuario:", e);
    }
    return { initials: "US", name: "Usuario", role: "Invitado" };
  };
  const sidebarRef = useRef(null);

useEffect(() => {
  function handleClickOutside(e) {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setOpenSubmenu(null);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  const displayUser = getDisplayUser();

  return (
    <motion.aside 
  ref={sidebarRef}
  className={`sidebar ${collapsed ? "collapsed" : ""}`}
  initial={{ y: -80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
>
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
            const isOpen = openSubmenu === item.id;
            const isParentActive = activeTab === item.id && !hasChildren;
            const isItemRestricted = !isLoadingAccess && isRestricted && blockedMenuIds.includes(item.id);

            return (
              <motion.li 
                key={item.id}
                className={`${isParentActive || isChildActive ? "active" : ""} ${isItemRestricted ? "restricted-item" : ""}`}
                style={isItemRestricted ? { opacity: 0.7, filter: 'grayscale(0.8)' } : {}}
                
                onClick={() => {
                  if (isItemRestricted) {
                    handleRestrictedAccess(item.label);
                    return;
                  }

                  if (hasChildren) {
                    setOpenSubmenu(openSubmenu === item.id ? null : item.id);
                  } else {
                    setOpenSubmenu(null);
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
                  
                  {isItemRestricted && !collapsed && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <FiLock size={14} style={{ marginLeft: 'auto', color: '#999' }} />
                    </motion.div>
                  )}
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

                <AnimatePresence>
                  {hasChildren && isOpen && !isItemRestricted && (
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
                                if (isRestricted && blockedMenuIds.includes(item.id)) {
                                  handleRestrictedAccess(item.label);
                                  return;
                                }
                                setOpenSubmenu(null);
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

        {/* --- ENLACE A TÉRMINOS Y CONDICIONES --- */}
        <motion.a
          href="/Terminos y Condiciones.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="logout-btn-sidebar"
          style={{ 
            textDecoration: 'none', 
            marginBottom: '5px', // Reduje un poco el margen para que quepan ambos
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }} 
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiFileText /> 
          {!collapsed && <span style={{ marginLeft: '10px' }}>Términos y Cond.</span>}
        </motion.a>

        {/* --- NUEVO: ENLACE AL MANUAL DINÁMICO --- */}
        <motion.a
          href={manualUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="logout-btn-sidebar"
          style={{ 
            textDecoration: 'none', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }} 
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiBookOpen /> 
          {!collapsed && <span style={{ marginLeft: '10px' }}>Manual de Ayuda</span>}
        </motion.a>
        {/* ----------------------------------------------- */}

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

      <motion.div 
        className="user-info-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="avatar">{displayUser.initials}</div>
        <div className="user-info">
          <span className="name">{displayUser.name}</span>
          <span className="role">{displayUser.role}</span>
        </div>
      </motion.div>
    </motion.aside>
  );
}