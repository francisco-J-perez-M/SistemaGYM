import { useState, useRef, useEffect } from "react";
import useTheme from "../hooks/ThemeContext";

export default function Sidebar({ role = "admin", activeTab = "overview", onTabChange = () => {}, onLogout = () => {} }) {
  const { theme, changeTheme } = useTheme();
  
  const [collapsed, setCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const menuRef = useRef(null);

  const themeOptions = [
    { 
      id: "light", 
      label: "Claro", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) 
    },
    { 
      id: "dark", 
      label: "Oscuro", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) 
    },
    { 
      id: "forest", 
      label: "Bosque", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L4 13h5l-2 9h10l-2-9h5z" />
        </svg>
      ) 
    },
    { 
      id: "nebula", 
      label: "Nebulosa", 
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ) 
    },
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
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        ) 
      },
      
      { 
        id: "miembros", 
        label: "Miembros", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        ) 
      },

      { 
        id: "pagos", 
        label: "Pagos", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        ) 
      },

      { type: "divider" },
      
      {
        id: "settings",
        label: "Configuración",
        icon: (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </>
        ),
        children: [
          {
            id: "backups",
            label: "Copias de seguridad",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            )
          },
          {
            id: "restore",
            label: "Restaurar respaldo",
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            )
          }
        ]
      }
    ],

    user: [
      { 
        id: "payments", 
        label: "Historial de Pagos", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
          />
        ) 
      },
      { 
        id: "progress", 
        label: "Mi Progreso", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        ) 
      },
      { 
        id: "renew", 
        label: "Renovar Membresía", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        ) 
      },
      { type: "divider" },
      { 
        id: "profile", 
        label: "Mi Perfil", 
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        ) 
      }
    ]
  };

  const currentMenu = menus[role] || menus.user;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Botón de colapsar */}
      <button 
        className="collapse-btn" 
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Colapsar menú"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="sidebar-header">
        <span className="brand-name">GYM PRO</span>
        <span className="admin-badge">ADMIN</span>
      </div>

      <ul className="sidebar-menu">
        {currentMenu.map((item, i) => {
          if (item.type === "divider") return <li key={i} className="divider" />;

          const hasChildren = item.children && item.children.length > 0;
          const isChildActive = hasChildren && item.children.some(child => child.id === activeTab);
          const isOpen = openSubmenu === item.id || isChildActive;
          const isParentActive = activeTab === item.id && !hasChildren;

          return (
            <li 
              key={item.id}
              className={isParentActive || isChildActive ? "active" : ""}
              onClick={() => {
                if (hasChildren) {
                  setOpenSubmenu(openSubmenu === item.id ? null : item.id);
                } else {
                  onTabChange(item.id);
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon}
              </svg>
              <span>{item.label}</span>
              
              {hasChildren && (
                <svg 
                  viewBox="0 0 24 24" 
                  width="16" 
                  height="16" 
                  style={{
                    marginLeft: 'auto', 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease'
                  }}
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}

              {/* SUBMENÚ */}
              {hasChildren && (
                <div className={`submenu-wrapper ${isOpen ? "open" : ""}`}>
                  <div className="submenu-inner">
                    <ul className="submenu">
                      {item.children.map(sub => (
                        <li
                          key={sub.id}
                          className={activeTab === sub.id ? "active" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTabChange(sub.id);
                          }}
                        >
                          <svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            style={{ width: '18px', height: '18px' }} 
                          >
                            {sub.icon}
                          </svg>
                          <span>{sub.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        {/* SELECTOR DE TEMA */}
        <div className="theme-menu-container" ref={menuRef}>
          {showThemeMenu && (
            <div className="theme-dropdown">
              {themeOptions.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${theme === t.id ? "active" : ""}`}
                  onClick={() => {
                    changeTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                >
                  <span className="theme-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            className={`theme-toggle-btn ${showThemeMenu ? "active" : ""}`}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
          >
            <div className="theme-btn-left">
              <span className="theme-toggle-icon">
                {currentTheme?.icon || "🎨"}
              </span>
              <span className="theme-btn-text">Temas</span>
            </div>

            <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* BOTÓN LOGOUT */}
        <button onClick={onLogout} className="logout-btn-sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" 
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
            />
          </svg>
          <span>Salir</span>
        </button>
      </div>

      {/* INFO DE USUARIO AL FINAL */}
      <div className="user-info-section">
        <div className="avatar">AD</div>
        <div className="user-info">
          <span className="name">Admin</span>
          <span className="role">Administrador</span>
        </div>
      </div>
    </aside>
  );
}
