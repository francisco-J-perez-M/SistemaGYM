import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiSave, FiCheckCircle, FiFileText, FiCalendar, FiPhone, 
  FiCheckSquare, FiSquare, FiAlertCircle, FiArrowRight, FiTarget, FiEdit2
} from "react-icons/fi";
import { GiWeightScale, GiChest, GiLeg, GiMuscleUp, GiFootTrip } from "react-icons/gi";
import Swal from "sweetalert2";
import "../css/CSSUnificado.css";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Estado unificado con TODOS los campos
  const [formData, setFormData] = useState({
    // Datos de Perfil
    fechaNacimiento: "",
    contactoEmergenciaNombre: "",
    contactoEmergenciaTelefono: "",
    
    // Datos de Salud
    peso: "",
    pecho: "",
    cintura: "",
    cadera: "",
    brazoDerecho: "",
    brazoIzquierdo: "",
    musloDerecho: "",
    musloIzquierdo: "",
    pantorrilla: "",
    notas: "",

    // Legal
    aceptaTerminos: false
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones Perfil
    if (!formData.fechaNacimiento) newErrors.fechaNacimiento = "La fecha de nacimiento es requerida";
    if (!formData.contactoEmergenciaNombre) newErrors.contactoEmergenciaNombre = "Nombre de contacto requerido";
    if (!formData.contactoEmergenciaTelefono) newErrors.contactoEmergenciaTelefono = "Teléfono requerido";

    // Validaciones Salud
    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      newErrors.peso = "El peso es requerido";
    }

    // Validar que las medidas sean números lógicos si se escribieron
    const medidas = ['pecho', 'cintura', 'cadera', 'brazoDerecho', 'brazoIzquierdo', 'musloDerecho', 'musloIzquierdo', 'pantorrilla'];
    medidas.forEach(m => {
      if (formData[m] && (parseFloat(formData[m]) <= 0 || parseFloat(formData[m]) > 500)) {
        newErrors[m] = "Valor inválido";
      }
    });

    // Validaciones Legal
    if (!formData.aceptaTerminos) newErrors.aceptaTerminos = "Debes aceptar los términos";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Faltan Datos",
        text: "Por favor revisa los campos en rojo y acepta los términos.",
        background: "var(--bg-card-dark)",
        color: "var(--text-primary)"
      });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      // Preparar Payload unificado (Convertimos medidas a snake_case para backend si es necesario)
      const dataToSend = {
        // Datos Perfil
        fecha_nacimiento: formData.fechaNacimiento,
        contacto_emergencia_nombre: formData.contactoEmergenciaNombre,
        contacto_emergencia_telefono: formData.contactoEmergenciaTelefono,
        acepta_terminos: true,
        
        // Datos Salud
        peso: parseFloat(formData.peso),
        notas: formData.notas
      };

      // Agregar medidas opcionales dinámicamente
      const mapMedidas = {
        pecho: 'pecho', cintura: 'cintura', cadera: 'cadera',
        brazoDerecho: 'brazo_derecho', brazoIzquierdo: 'brazo_izquierdo',
        musloDerecho: 'muslo_derecho', musloIzquierdo: 'muslo_izquierdo',
        pantorrilla: 'pantorrilla'
      };

      Object.keys(mapMedidas).forEach(key => {
        if (formData[key]) {
          dataToSend[mapMedidas[key]] = parseFloat(formData[key]);
        }
      });

      // AQUÍ LA LLAMADA AL BACKEND
      // Nota: Asegúrate de que tu endpoint soporte recibir todos estos datos juntos
      // O haz dos llamadas (una a perfil, una a salud)
      
      /* Ejemplo de llamada única:
      const response = await fetch("http://localhost:5000/api/user/complete-profile-full", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
         body: JSON.stringify(dataToSend)
      });
      */

      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1500));

      await Swal.fire({
        icon: "success",
        title: "¡Perfil Completado!",
        text: "Tu información ha sido registrada exitosamente.",
        background: "var(--bg-card-dark)",
        color: "var(--text-primary)",
        confirmButtonColor: "var(--accent-color)"
      });

      navigate("/user/dashboard"); 

    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron guardar los datos.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper" style={{ margin: '0 auto', maxWidth: '1000px', width: '100%' }}>
        <header className="top-header">
          <h2 className="page-title">Finalizar Inscripción</h2>
        </header>

        <main className="dashboard-content">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* Banner Bienvenida */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.05) 100%)',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              display: 'flex', alignItems: 'center', gap: '20px'
            }}>
              <div style={{ background: 'var(--accent-color)', padding: '10px', borderRadius: '50%', color: '#000' }}>
                <FiCheckCircle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>¡Bienvenido al Equipo!</h4>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Para diseñar tu plan ideal, necesitamos conocer tus datos básicos y medidas actuales.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* --- SECCIÓN 1: DATOS PERSONALES --- */}
              <motion.div className="chart-card" style={{ marginBottom: '20px' }}>
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiCalendar /> Datos Personales
                  </h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <div className="compact-form-grid">
                    <div className="form-group compact">
                      <label className="form-label-compact">Fecha de Nacimiento</label>
                      <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} className="input-compact" style={{ borderColor: errors.fechaNacimiento && 'var(--error-color)' }} />
                      {errors.fechaNacimiento && <span style={{fontSize:'12px', color:'var(--error-color)'}}>{errors.fechaNacimiento}</span>}
                    </div>
                    <div className="form-group compact">
                      <label className="form-label-compact">Contacto Emergencia (Nombre)</label>
                      <input type="text" name="contactoEmergenciaNombre" placeholder="Ej: Madre" value={formData.contactoEmergenciaNombre} onChange={handleInputChange} className="input-compact" style={{ borderColor: errors.contactoEmergenciaNombre && 'var(--error-color)' }} />
                    </div>
                    <div className="form-group compact">
                      <label className="form-label-compact"><FiPhone style={{marginRight:5}}/> Teléfono Emergencia</label>
                      <input type="tel" name="contactoEmergenciaTelefono" placeholder="55..." value={formData.contactoEmergenciaTelefono} onChange={handleInputChange} className="input-compact" style={{ borderColor: errors.contactoEmergenciaTelefono && 'var(--error-color)' }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* --- SECCIÓN 2: PESO (Requerido) --- */}
              <motion.div className="chart-card" style={{ marginBottom: '20px' }}>
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GiWeightScale /> Peso Inicial
                  </h3>
                  <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(255,77,77,0.15)', color: 'var(--error-color)', borderRadius: '10px' }}>* Requerido</span>
                </div>
                <div style={{ padding: '20px' }}>
                  <div className="input-dark-container">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Peso Actual (kg)</label>
                    <input type="number" name="peso" step="0.1" placeholder="Ej: 75.5" value={formData.peso} onChange={handleInputChange} 
                      style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} 
                    />
                  </div>
                  {errors.peso && <div style={{ color: 'var(--error-color)', fontSize: '13px', marginTop: '5px' }}><FiAlertCircle size={12}/> {errors.peso}</div>}
                </div>
              </motion.div>

              {/* --- SECCIÓN 3: MEDIDAS (Torso) --- */}
              <motion.div className="chart-card" style={{ marginBottom: '20px' }}>
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiTarget /> Medidas Torso (cm)</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <div className="compact-form-grid">
                    <div className="form-group compact">
                      <label className="form-label-compact"><GiChest style={{marginRight:5}}/> Pecho</label>
                      <input type="number" name="pecho" step="0.1" placeholder="0.0" value={formData.pecho} onChange={handleInputChange} className="input-compact" />
                    </div>
                    <div className="form-group compact">
                      <label className="form-label-compact"><FiTarget style={{marginRight:5}}/> Cintura</label>
                      <input type="number" name="cintura" step="0.1" placeholder="0.0" value={formData.cintura} onChange={handleInputChange} className="input-compact" />
                    </div>
                    <div className="form-group compact">
                      <label className="form-label-compact"><GiLeg style={{marginRight:5}}/> Cadera</label>
                      <input type="number" name="cadera" step="0.1" placeholder="0.0" value={formData.cadera} onChange={handleInputChange} className="input-compact" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* --- SECCIÓN 4: MEDIDAS (Extremidades) --- */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* Brazos */}
                <motion.div className="chart-card">
                  <div className="chart-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GiMuscleUp /> Brazos (cm)</h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div className="compact-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group compact">
                        <label className="form-label-compact">Derecho</label>
                        <input type="number" name="brazoDerecho" step="0.1" placeholder="0.0" value={formData.brazoDerecho} onChange={handleInputChange} className="input-compact" />
                      </div>
                      <div className="form-group compact">
                        <label className="form-label-compact">Izquierdo</label>
                        <input type="number" name="brazoIzquierdo" step="0.1" placeholder="0.0" value={formData.brazoIzquierdo} onChange={handleInputChange} className="input-compact" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Piernas */}
                <motion.div className="chart-card">
                  <div className="chart-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><GiLeg /> Piernas (cm)</h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div className="compact-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group compact">
                        <label className="form-label-compact">Muslo Der.</label>
                        <input type="number" name="musloDerecho" step="0.1" placeholder="0.0" value={formData.musloDerecho} onChange={handleInputChange} className="input-compact" />
                      </div>
                      <div className="form-group compact">
                        <label className="form-label-compact">Muslo Izq.</label>
                        <input type="number" name="musloIzquierdo" step="0.1" placeholder="0.0" value={formData.musloIzquierdo} onChange={handleInputChange} className="input-compact" />
                      </div>
                    </div>
                    <div className="form-group compact" style={{ marginTop: '15px' }}>
                       <label className="form-label-compact"><GiFootTrip style={{marginRight:5}}/> Pantorrilla</label>
                       <input type="number" name="pantorrilla" step="0.1" placeholder="0.0" value={formData.pantorrilla} onChange={handleInputChange} className="input-compact" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* --- SECCIÓN 5: NOTAS --- */}
              <motion.div className="chart-card" style={{ marginBottom: '25px' }}>
                <div className="chart-header">
                   <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiEdit2 /> Notas Adicionales</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <textarea name="notas" rows="3" placeholder="¿Alguna lesión o condición médica que debamos saber?" value={formData.notas} onChange={handleInputChange}
                    style={{ width: '100%', padding: '15px', background: 'var(--input-bg-dark)', border: '1px solid var(--border-dark)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </motion.div>

              {/* --- SECCIÓN 6: TÉRMINOS --- */}
              <motion.div className="chart-card" style={{ marginBottom: '25px', border: errors.aceptaTerminos ? '1px solid var(--error-color)' : 'none' }}>
                <div className="chart-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FiFileText /> Términos Legales</h3>
                </div>
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <a href="/Terminos y Condiciones.pdf" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 25px', background: 'var(--bg-main)', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', border: '1px solid var(--border-dark)', width: '100%', maxWidth: '350px', justifyContent: 'center' }}
                  >
                    <FiFileText size={20} color="var(--accent-color)" />
                    <span>Leer Documento PDF</span>
                    <FiArrowRight />
                  </a>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ position: 'relative', width: '24px', height: '24px' }}>
                      <input type="checkbox" name="aceptaTerminos" checked={formData.aceptaTerminos} onChange={handleInputChange} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
                      {formData.aceptaTerminos ? <FiCheckSquare size={24} color="var(--accent-color)" /> : <FiSquare size={24} color="var(--text-secondary)" />}
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>He leído y acepto los Términos y Condiciones.</span>
                  </label>
                  {errors.aceptaTerminos && <div style={{ color: 'var(--error-color)', fontSize: '14px' }}><FiAlertCircle /> {errors.aceptaTerminos}</div>}
                </div>
              </motion.div>

              {/* Botón Final */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn-primary" style={{ minWidth: '220px', padding: '15px 30px', fontSize: '16px' }}>
                  {saving ? "Procesando..." : <><FiSave style={{marginRight:8}}/> Guardar y Finalizar</>}
                </button>
              </div>

            </form>
          </motion.div>
        </main>
      </div>
    </div>
  );
}