import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiSave, FiArrowLeft, FiUser, FiActivity, FiAlertCircle, 
  FiCheckCircle, FiEdit2, FiTarget
} from "react-icons/fi";
import { GiBodyHeight, GiWeightScale, GiChest, GiLeg, GiMuscleUp, GiFootTrip } from "react-icons/gi";
import Swal from "sweetalert2";
import "../css/CSSUnificado.css";

export default function UserHealthUpdate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Datos básicos
    peso: "",
    
    // Medidas corporales
    pecho: "",
    cintura: "",
    cadera: "",
    brazoDerecho: "",
    brazoIzquierdo: "",
    musloDerecho: "",
    musloIzquierdo: "",
    pantorrilla: "",
    
    // Notas adicionales
    notas: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchCurrentData();
  }, []);

  const fetchCurrentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [healthResponse, progressResponse] = await Promise.all([
        fetch("http://localhost:5000/api/user/health", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/user/body-progress", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (healthResponse.ok && progressResponse.ok) {
        const healthData = await healthResponse.json();
        const progressData = await progressResponse.json();
        
        // Pre-rellenar formulario con datos existentes
        const getMedidaValor = (condiciones, nombreMedida) => {
          if (!condiciones?.length) return "";
          const medida = condiciones.find(c => c.nombre === nombreMedida);
          if (!medida?.valor) return "";
          const valor = parseFloat(medida.valor.toString().replace(/[^0-9.]/g, ''));
          return isNaN(valor) || valor === 0 ? "" : valor.toString();
        };

        setFormData({
          peso: progressData.bodyMetrics?.peso?.actual?.toString() || "",
          pecho: getMedidaValor(healthData.condiciones, "Circunferencia de Pecho") || progressData.bodyMetrics?.pecho?.toString() || "",
          cintura: getMedidaValor(healthData.condiciones, "Circunferencia de Cintura") || progressData.bodyMetrics?.cintura?.toString() || "",
          cadera: getMedidaValor(healthData.condiciones, "Circunferencia de Cadera") || progressData.bodyMetrics?.cadera?.toString() || "",
          brazoDerecho: getMedidaValor(healthData.condiciones, "Brazo Derecho") || progressData.bodyMetrics?.brazoDerecho?.toString() || "",
          brazoIzquierdo: getMedidaValor(healthData.condiciones, "Brazo Izquierdo") || progressData.bodyMetrics?.brazoIzquierdo?.toString() || "",
          musloDerecho: getMedidaValor(healthData.condiciones, "Muslo Derecho") || progressData.bodyMetrics?.musloDerecho?.toString() || "",
          musloIzquierdo: getMedidaValor(healthData.condiciones, "Muslo Izquierdo") || progressData.bodyMetrics?.musloIzquierdo?.toString() || "",
          pantorrilla: getMedidaValor(healthData.condiciones, "Pantorrilla") || progressData.bodyMetrics?.pantorrilla?.toString() || "",
          notas: healthData.notas || ""
        });
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar peso (requerido)
    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      newErrors.peso = "El peso es requerido y debe ser mayor a 0";
    }

    // Validar medidas (opcionales pero deben ser válidas si se ingresan)
    const medidasOpcionales = [
      'pecho', 'cintura', 'cadera', 'brazoDerecho', 
      'brazoIzquierdo', 'musloDerecho', 'musloIzquierdo', 'pantorrilla'
    ];

    medidasOpcionales.forEach(medida => {
      if (formData[medida] && (parseFloat(formData[medida]) <= 0 || parseFloat(formData[medida]) > 500)) {
        newErrors[medida] = "Valor inválido (debe ser entre 1 y 500 cm)";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Datos Inválidos",
        text: "Por favor corrige los errores antes de continuar",
        background: "var(--bg-card-dark)",
        color: "var(--text-primary)"
      });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Preparar datos para enviar
      const dataToSend = {
        peso: parseFloat(formData.peso)
      };

      // Agregar medidas solo si tienen valor
      const medidasOpcionales = [
        'pecho', 'cintura', 'cadera', 'brazoDerecho', 
        'brazoIzquierdo', 'musloDerecho', 'musloIzquierdo', 'pantorrilla'
      ];

      medidasOpcionales.forEach(medida => {
        if (formData[medida]) {
          // Convertir nombres de camelCase a snake_case para el backend
          const snakeCaseName = medida.replace(/([A-Z])/g, '_$1').toLowerCase();
          dataToSend[snakeCaseName] = parseFloat(formData[medida]);
        }
      });

      if (formData.notas) {
        dataToSend.notas = formData.notas;
      }

      const response = await fetch("http://localhost:5000/api/user/health", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        throw new Error("Error al guardar los datos");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Datos Actualizados!",
        text: "Tu información de salud se ha guardado correctamente",
        background: "var(--bg-card-dark)",
        color: "var(--text-primary)",
        confirmButtonColor: "var(--accent-color)"
      });

      navigate("/user/health");
    } catch (err) {
      console.error("Error al guardar:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron guardar los datos. Intenta nuevamente.",
        background: "var(--bg-card-dark)",
        color: "var(--text-primary)"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Actualizar Datos de Salud</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner dashboard-spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando información...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate("/user/health")}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-dark)',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.color = 'var(--accent-color)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-dark)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <FiArrowLeft size={20} />
            </button>
            <h2 className="page-title">Actualizar Datos de Salud</h2>
          </div>
        </header>

        <main className="dashboard-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Información importante */}
            <div style={{
              padding: '20px',
              background: 'rgba(74, 144, 226, 0.1)',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '15px'
            }}>
              <FiAlertCircle size={24} style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                  Actualiza tu Progreso
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  Registra tu peso actual y medidas corporales para llevar un seguimiento preciso de tu progreso. 
                  Todos los campos excepto el peso son opcionales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Sección: Peso Actual */}
              <motion.div
                className="chart-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                style={{ marginBottom: '20px' }}
              >
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GiWeightScale />
                    Peso Actual
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    background: 'rgba(255, 77, 77, 0.1)',
                    color: 'var(--error-color)',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    * Requerido
                  </span>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div className="input-dark-container">
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontWeight: '500',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      name="peso"
                      value={formData.peso}
                      onChange={handleInputChange}
                      step="0.1"
                      min="1"
                      max="500"
                      placeholder="Ej: 75.5"
                      style={{
                        borderColor: errors.peso ? 'var(--error-color)' : undefined
                      }}
                    />
                    {errors.peso && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '13px',
                        color: 'var(--error-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <FiAlertCircle size={14} />
                        {errors.peso}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Sección: Medidas Corporales Principales */}
              <motion.div
                className="chart-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ marginBottom: '20px' }}
              >
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiTarget />
                    Medidas Principales (Torso)
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    en centímetros
                  </span>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div className="compact-form-grid">
                    {/* Pecho */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiChest style={{ marginRight: '6px' }} />
                        Pecho
                      </label>
                      <input
                        type="number"
                        name="pecho"
                        value={formData.pecho}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 98.5"
                        style={{
                          borderColor: errors.pecho ? 'var(--error-color)' : undefined
                        }}
                      />
                      {errors.pecho && (
                        <span style={{ fontSize: '12px', color: 'var(--error-color)' }}>
                          {errors.pecho}
                        </span>
                      )}
                    </div>

                    {/* Cintura */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <FiTarget style={{ marginRight: '6px' }} />
                        Cintura
                      </label>
                      <input
                        type="number"
                        name="cintura"
                        value={formData.cintura}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 85.0"
                        style={{
                          borderColor: errors.cintura ? 'var(--error-color)' : undefined
                        }}
                      />
                      {errors.cintura && (
                        <span style={{ fontSize: '12px', color: 'var(--error-color)' }}>
                          {errors.cintura}
                        </span>
                      )}
                    </div>

                    {/* Cadera */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiLeg style={{ marginRight: '6px' }} />
                        Cadera
                      </label>
                      <input
                        type="number"
                        name="cadera"
                        value={formData.cadera}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 95.0"
                        style={{
                          borderColor: errors.cadera ? 'var(--error-color)' : undefined
                        }}
                      />
                      {errors.cadera && (
                        <span style={{ fontSize: '12px', color: 'var(--error-color)' }}>
                          {errors.cadera}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sección: Brazos */}
              <motion.div
                className="chart-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: '20px' }}
              >
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GiMuscleUp />
                    Brazos
                  </h3>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div className="compact-form-grid">
                    {/* Brazo Derecho */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiMuscleUp style={{ marginRight: '6px' }} />
                        Brazo Derecho (cm)
                      </label>
                      <input
                        type="number"
                        name="brazoDerecho"
                        value={formData.brazoDerecho}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 35.0"
                        style={{
                          borderColor: errors.brazoDerecho ? 'var(--error-color)' : undefined
                        }}
                      />
                    </div>

                    {/* Brazo Izquierdo */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiMuscleUp style={{ marginRight: '6px' }} />
                        Brazo Izquierdo (cm)
                      </label>
                      <input
                        type="number"
                        name="brazoIzquierdo"
                        value={formData.brazoIzquierdo}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 34.5"
                        style={{
                          borderColor: errors.brazoIzquierdo ? 'var(--error-color)' : undefined
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sección: Piernas */}
              <motion.div
                className="chart-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginBottom: '20px' }}
              >
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GiLeg />
                    Piernas
                  </h3>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div className="compact-form-grid">
                    {/* Muslo Derecho */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiLeg style={{ marginRight: '6px' }} />
                        Muslo Derecho (cm)
                      </label>
                      <input
                        type="number"
                        name="musloDerecho"
                        value={formData.musloDerecho}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 55.0"
                        style={{
                          borderColor: errors.musloDerecho ? 'var(--error-color)' : undefined
                        }}
                      />
                    </div>

                    {/* Muslo Izquierdo */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiLeg style={{ marginRight: '6px' }} />
                        Muslo Izquierdo (cm)
                      </label>
                      <input
                        type="number"
                        name="musloIzquierdo"
                        value={formData.musloIzquierdo}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 54.5"
                        style={{
                          borderColor: errors.musloIzquierdo ? 'var(--error-color)' : undefined
                        }}
                      />
                    </div>

                    {/* Pantorrilla */}
                    <div className="form-group compact">
                      <label className="form-label-compact">
                        <GiFootTrip style={{ marginRight: '6px' }} />
                        Pantorrilla (cm)
                      </label>
                      <input
                        type="number"
                        name="pantorrilla"
                        value={formData.pantorrilla}
                        onChange={handleInputChange}
                        className="input-compact"
                        step="0.1"
                        min="0"
                        max="500"
                        placeholder="Ej: 38.0"
                        style={{
                          borderColor: errors.pantorrilla ? 'var(--error-color)' : undefined
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Sección: Notas */}
              <motion.div
                className="chart-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ marginBottom: '25px' }}
              >
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiEdit2 />
                    Notas Adicionales
                  </h3>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <div className="input-dark-container">
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontWeight: '500',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      Observaciones (opcional)
                    </label>
                    <textarea
                      name="notas"
                      value={formData.notas}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Ej: Hoy me sentí con más energía durante el entrenamiento..."
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: 'var(--input-bg-dark)',
                        border: '1px solid var(--border-dark)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-color)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(251, 227, 121, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-dark)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Botones de acción */}
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => navigate("/user/health")}
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid var(--border-dark)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: saving ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!saving) {
                      e.currentTarget.style.borderColor = 'var(--error-color)';
                      e.currentTarget.style.color = 'var(--error-color)';
                      e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-dark)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    minWidth: '180px'
                  }}
                >
                  {saving ? (
                    <>
                      <span className="spinner spinner-small"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Información de ayuda */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: 'var(--bg-card-dark)',
              borderRadius: '12px',
              border: '1px solid var(--border-dark)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '15px'
              }}>
                <FiCheckCircle size={24} style={{ color: 'var(--success-color)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ marginBottom: '10px', fontSize: '15px', fontWeight: '600' }}>
                    Consejos para mediciones precisas
                  </h4>
                  <ul style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.8',
                    paddingLeft: '20px',
                    margin: 0
                  }}>
                    <li>Realiza las mediciones por la mañana, antes de desayunar</li>
                    <li>Usa una cinta métrica flexible y asegúrate de que esté horizontal</li>
                    <li>No aprietes demasiado la cinta contra tu piel</li>
                    <li>Registra tus mediciones al menos una vez por semana para mejor seguimiento</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}