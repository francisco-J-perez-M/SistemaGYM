import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiEdit2, FiSave, FiCamera, FiAlertCircle } from "react-icons/fi";
import "../css/CSSUnificado.css";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    fechaNacimiento: "",
    direccion: "",
    genero: "",
    peso: "",
    altura: "",
    objetivo: "",
    nivelExperiencia: "",
    fotoPerfil: null,
    mesesActivo: 0,
    totalEntrenamientos: 0
  });
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Error al cargar perfil");

      const data = await response.json();
      setProfileData(data);
      setEditedData(data);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      const data = await response.json();
      setProfileData(editedData);
      setIsEditing(false);
      setSuccessMessage("Perfil actualizado correctamente");
      
      // Actualizar usuario en localStorage
      const storedUser = JSON.parse(localStorage.getItem("user"));
      storedUser.nombre = editedData.nombre;
      storedUser.email = editedData.email;
      localStorage.setItem("user", JSON.stringify(storedUser));
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("foto", file);

      const response = await fetch("http://localhost:5000/api/user/profile/photo", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Error al subir foto");

      const data = await response.json();
      setProfileData({ ...profileData, fotoPerfil: data.fotoPerfil });
      setSuccessMessage("Foto actualizada correctamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo subir la foto");
    }
  };

  const getInitials = () => {
    if (!profileData.nombre) return "U";
    return profileData.nombre.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Mi Perfil</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando perfil...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Mi Perfil</h2>
        </header>
        
        <main className="dashboard-content">
          {/* Mensajes */}
          {error && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255, 59, 48, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--error-color)'
            }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(76, 217, 100, 0.1)', 
              borderRadius: '8px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--success-color)'
            }}>
              <FiSave />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="charts-row">
            {/* Card de perfil */}
            <motion.div 
              className="chart-card" 
              style={{ maxWidth: '400px' }} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
            >
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  {profileData.fotoPerfil ? (
                    <img 
                      src={`http://localhost:5000/static/uploads/${profileData.fotoPerfil}`}
                      alt="Perfil"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid var(--accent-color)'
                      }}
                    />
                  ) : (
                    <div className="avatar" style={{ width: '120px', height: '120px', fontSize: '36px' }}>
                      {getInitials()}
                    </div>
                  )}
                  
                  <label htmlFor="photo-upload">
                    <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      style={{
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
                      }}
                    >
                      <FiCamera color="var(--bg-dark)" />
                    </motion.div>
                  </label>
                  <input 
                    id="photo-upload"
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                
                <h2 style={{ marginBottom: '8px' }}>{profileData.nombre}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Miembro Premium</p>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ flex: 1, padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>
                      {profileData.mesesActivo}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Meses activo</div>
                  </div>
                  <div style={{ flex: 1, padding: '15px', background: 'var(--bg-input-dark)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success-color)' }}>
                      {profileData.totalEntrenamientos}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Entrenamientos</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card de información */}
            <motion.div 
              className="chart-card" 
              style={{ flex: 1 }} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="chart-header">
                <h3>Información Personal</h3>
                <motion.button 
                  className="btn-outline-small" 
                  onClick={() => {
                    if (isEditing) {
                      handleSave();
                    } else {
                      setIsEditing(true);
                      setEditedData(profileData);
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  disabled={saving}
                >
                  {saving ? (
                    <>Guardando...</>
                  ) : isEditing ? (
                    <><FiSave style={{ marginRight: 6 }} />Guardar</>
                  ) : (
                    <><FiEdit2 style={{ marginRight: 6 }} />Editar</>
                  )}
                </motion.button>
              </div>
              
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {[
                  { icon: <FiMail />, label: "Email", field: "email", type: "email" },
                  { icon: <FiPhone />, label: "Teléfono", field: "telefono", type: "tel" },
                  { icon: <FiCalendar />, label: "Fecha de Nacimiento", field: "fechaNacimiento", type: "text" },
                  { icon: <FiMapPin />, label: "Dirección", field: "direccion", type: "text" },
                  { icon: <FiUser />, label: "Género", field: "genero", type: "text" },
                  { icon: <FiUser />, label: "Nivel", field: "nivelExperiencia", type: "text" }
                ].map((field, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-input-dark)', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {field.icon}
                      <span>{field.label}</span>
                    </div>
                    {isEditing ? (
                      <input 
                        type={field.type}
                        value={editedData[field.field] || ""}
                        onChange={(e) => setEditedData({ ...editedData, [field.field]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'var(--bg-dark)',
                          border: '1px solid var(--border-dark)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)'
                        }}
                      />
                    ) : (
                      <div style={{ fontWeight: '500' }}>{profileData[field.field] || "No especificado"}</div>
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