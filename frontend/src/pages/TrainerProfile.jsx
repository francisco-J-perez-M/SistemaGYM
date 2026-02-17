import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiUser, 
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit,
  FiSave,
  FiX,
  FiAward,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle
} from "react-icons/fi";
import trainerService from "../services/trainerService";
import "../css/CSSUnificado.css";

export default function TrainerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    experience: "",
    certifications: "",
    bio: ""
  });
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSessions: 0,
    totalEarnings: 0,
    avgRating: 0,
    yearsActive: 0,
    certifications: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cargar perfil al montar el componente
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await trainerService.getProfile();
      
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        specialization: profileData.specialization || "",
        experience: profileData.experience || "",
        certifications: profileData.certifications || "",
        bio: profileData.bio || ""
      });
      
      setStats(profileData.stats || {
        totalClients: 0,
        totalSessions: 0,
        totalEarnings: 0,
        avgRating: 0,
        yearsActive: 0,
        certifications: 0
      });
      
      // Convertir achievements al formato esperado con iconos
      const achievementsWithIcons = (profileData.achievements || []).map(achievement => ({
        title: achievement.title,
        date: achievement.date,
        icon: <FiAward />
      }));
      setAchievements(achievementsWithIcons);
      
    } catch (err) {
      setError(err.message || 'Error al cargar el perfil');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await trainerService.updateProfile(formData);
      
      // Recargar el perfil para obtener los datos actualizados
      await loadProfile();
      
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el perfil');
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Recargar datos originales
    loadProfile();
    setIsEditing(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <motion.div 
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
            Cargando perfil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <motion.div 
        className="welcome-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Mi Perfil</h2>
            <p>Gestiona tu información personal y profesional</p>
          </div>
          <FiUser size={50} style={{ color: 'var(--accent-color)', opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* Mensaje de error */}
      {error && (
        <motion.div 
          className="alert-error"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--error-color)'
          }}
        >
          <FiAlertCircle size={20} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--error-color)',
              cursor: 'pointer'
            }}
          >
            <FiX size={18} />
          </button>
        </motion.div>
      )}

      {/* Estadísticas del Perfil */}
      <motion.div 
        className="kpi-grid" 
        style={{ marginTop: '25px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Total Clientes</h3>
          </div>
          <div className="stat-value highlight">{stats.totalClients}</div>
          <div className="stat-detail">Clientes activos</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Sesiones</h3>
          </div>
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-detail">Total completadas</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Ingresos</h3>
          </div>
          <div className="stat-value">${(stats.totalEarnings / 1000).toFixed(0)}k</div>
          <div className="stat-detail">Total generado</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Calificación</h3>
          </div>
          <div className="stat-value highlight">{stats.avgRating}</div>
          <div className="stat-detail">Promedio de {stats.totalClients} clientes</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Experiencia</h3>
          </div>
          <div className="stat-value">{stats.yearsActive}</div>
          <div className="stat-detail">Años en el gym</div>
        </motion.div>

        <motion.div className="stat-card" variants={itemVariants}>
          <div className="stat-header">
            <h3>Certificaciones</h3>
          </div>
          <div className="stat-value highlight">{stats.certifications}</div>
          <div className="stat-detail">Acreditaciones</div>
        </motion.div>
      </motion.div>

      <div className="charts-row" style={{ marginTop: '25px' }}>
        {/* Información Personal */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Información Personal</h3>
            {!isEditing ? (
              <motion.button
                className="btn-compact-primary"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit size={16} />
                Editar
              </motion.button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  className="btn-compact-primary"
                  onClick={handleSave}
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                >
                  <FiSave size={16} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </motion.button>
                <motion.button
                  className="btn-outline-small"
                  onClick={handleCancel}
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                >
                  <FiX size={16} />
                  Cancelar
                </motion.button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '20px' }}>
            {/* Avatar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '25px'
            }}>
              <div style={{ position: 'relative' }}>
                <div className="avatar" style={{ 
                  width: '100px', 
                  height: '100px', 
                  fontSize: '36px',
                  border: '3px solid var(--accent-color)'
                }}>
                  {formData.name.split(' ').map(n => n[0]).join('')}
                </div>
                {isEditing && (
                  <motion.button
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent-color)',
                      color: 'var(--text-on-accent)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiEdit size={14} />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="form-label-compact">
                  <FiUser size={14} style={{ marginRight: 6 }} />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-compact"
                  />
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'var(--input-bg-dark)',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    {formData.name || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label-compact">
                  <FiMail size={14} style={{ marginRight: 6 }} />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-compact"
                  />
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'var(--input-bg-dark)',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    {formData.email || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label-compact">
                  <FiPhone size={14} style={{ marginRight: 6 }} />
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-compact"
                  />
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'var(--input-bg-dark)',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    {formData.phone || '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label-compact">
                  <FiMapPin size={14} style={{ marginRight: 6 }} />
                  Dirección
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-compact"
                  />
                ) : (
                  <div style={{ 
                    padding: '12px',
                    background: 'var(--input-bg-dark)',
                    borderRadius: '8px',
                    marginTop: '6px'
                  }}>
                    {formData.address || '-'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Información Profesional */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Información Profesional</h3>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="form-label-compact">Especialización</label>
              {isEditing ? (
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="input-compact"
                />
              ) : (
                <div style={{ 
                  padding: '12px',
                  background: 'var(--input-bg-dark)',
                  borderRadius: '8px',
                  marginTop: '6px'
                }}>
                  {formData.specialization || '-'}
                </div>
              )}
            </div>

            <div>
              <label className="form-label-compact">Experiencia</label>
              <div style={{ 
                padding: '12px',
                background: 'var(--input-bg-dark)',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                {formData.experience || '-'}
              </div>
            </div>

            <div>
              <label className="form-label-compact">Certificaciones</label>
              <div style={{ 
                padding: '12px',
                background: 'var(--input-bg-dark)',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                {formData.certifications || '-'}
              </div>
            </div>

            <div>
              <label className="form-label-compact">Biografía</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="input-compact"
                  rows="4"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              ) : (
                <div style={{ 
                  padding: '12px',
                  background: 'var(--input-bg-dark)',
                  borderRadius: '8px',
                  marginTop: '6px',
                  lineHeight: '1.6'
                }}>
                  {formData.bio || '-'}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Logros y Reconocimientos */}
      {achievements.length > 0 && (
        <motion.div 
          className="chart-card"
          style={{ marginTop: '20px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="chart-header">
            <h3><FiAward style={{ marginRight: 8 }} />Logros y Reconocimientos</h3>
          </div>

          <motion.div 
            style={{ 
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {achievements.map((achievement, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                style={{
                  background: 'var(--input-bg-dark)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-dark)',
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center'
                }}
                whileHover={{ 
                  borderColor: 'var(--accent-color)',
                  transform: 'translateY(-3px)'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'var(--accent-color)',
                  color: 'var(--text-on-accent)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  {achievement.icon}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
                    {achievement.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {achievement.date}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}