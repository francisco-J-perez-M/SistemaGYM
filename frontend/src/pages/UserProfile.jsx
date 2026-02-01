import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiEdit2, FiSave, FiCamera } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: "Ana María García",
    email: "ana.garcia@email.com",
    telefono: "+52 55 1234 5678",
    fechaNacimiento: "15/03/1995",
    direccion: "Calle Principal #123, CDMX",
    genero: "Femenino",
    peso: "65 kg",
    altura: "1.68 m",
    objetivo: "Tonificación muscular",
    nivelExperiencia: "Intermedio"
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) window.location.href = "/";
    else setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Mi Perfil</h2>
        </header>
        <main className="dashboard-content">
          <div className="charts-row">
            <motion.div className="chart-card" style={{ maxWidth: '400px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '36px' }}>
                    {profileData.nombre.split(" ").map(n => n[0]).join("")}
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    background: 'var(--accent-color)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}>
                    <FiCamera color="var(--bg-dark)" />
                  </motion.button>
                </div>
                <h2 style={{ marginBottom: '8px' }}>{profileData.nombre}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Miembro Premium</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ flex: 1, padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>7</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Meses activo</div>
                  </div>
                  <div style={{ flex: 1, padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-color)' }}>142</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Entrenamientos</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="chart-card" style={{ flex: 1 }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="chart-header">
                <h3>Información Personal</h3>
                <motion.button className="btn-outline-small" onClick={() => setIsEditing(!isEditing)} whileHover={{ scale: 1.05 }}>
                  {isEditing ? <><FiSave style={{ marginRight: 6 }} />Guardar</> : <><FiEdit2 style={{ marginRight: 6 }} />Editar</>}
                </motion.button>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {[
                  { icon: <FiMail />, label: "Email", value: profileData.email },
                  { icon: <FiPhone />, label: "Teléfono", value: profileData.telefono },
                  { icon: <FiCalendar />, label: "Fecha de Nacimiento", value: profileData.fechaNacimiento },
                  { icon: <FiMapPin />, label: "Dirección", value: profileData.direccion },
                  { icon: <FiUser />, label: "Género", value: profileData.genero },
                  { icon: <FiUser />, label: "Nivel", value: profileData.nivelExperiencia }
                ].map((field, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-input-dark)', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {field.icon}
                      <span>{field.label}</span>
                    </div>
                    {isEditing ? (
                      <input type="text" defaultValue={field.value} style={{
                        width: '100%',
                        padding: '8px',
                        background: 'var(--bg-dark)',
                        border: '1px solid var(--border-dark)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)'
                      }} />
                    ) : (
                      <div style={{ fontWeight: '500' }}>{field.value}</div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}