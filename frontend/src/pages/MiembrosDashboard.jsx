import { useEffect, useState } from "react";
import {
  getMiembros,
  createMiembro,
  updateMiembro,
  deleteMiembro,
  reactivateMiembro,
  BASE_URL
} from "../api/miembros";

/* Importamos los componentes separados */
import MiembroForm from "../components/miembros/MiembroForm";
import MiembroModal from "../components/miembros/MiembroModal";
import "../css/CSSUnificado.css";

/* ================= ICONOS SVG DASHBOARD ================= */
const RefreshIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>);
const MailIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const PhoneIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const WeightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/></svg>);
const HeightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="M14.5 4v16"/></svg>);
const GenderIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>);

export default function MiembrosDashboard() {
  const [miembros, setMiembros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [verInactivos, setVerInactivos] = useState(false);
  
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    sexo: "",
    peso_inicial: "",
    estatura: "",
  });

  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  /* ================= API ================= */
  const loadMiembros = async () => {
    setLoading(true);
    try {
      // CORRECCIÓN 1: Enviamos searchTerm al backend
      const { data } = await getMiembros(page, verInactivos, searchTerm);
      setMiembros(data.miembros);
      setTotalPages(data.pages);
      
      // Ajuste automático si borramos registros y la página queda vacía
      if (data.miembros.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error("Error cargando miembros", error);
      if (error.response && error.response.status === 401) {
        alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CORRECCIÓN 2: Debounce para no saturar el servidor al escribir
    const delayDebounceFn = setTimeout(() => {
      loadMiembros();
    }, 500); // Espera 500ms después de que dejes de escribir

    return () => clearTimeout(delayDebounceFn);
    // Agregamos searchTerm a las dependencias
  }, [page, verInactivos, searchTerm]);

  /* ================= HANDLERS ================= */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // CORRECCIÓN 3: Resetear a página 1 al buscar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.telefono.trim() || !form.sexo) {
      alert("Por favor completa los campos de perfil");
      return;
    }
    if (!editingId && (!form.nombre.trim() || !form.email.trim())) {
        alert("Nombre y Email son obligatorios para nuevos miembros");
        return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", form.nombre);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("telefono", form.telefono);
    formData.append("sexo", form.sexo);
    formData.append("peso_inicial", form.peso_inicial);
    formData.append("estatura", form.estatura);
    
    if (fotoFile) {
      formData.append("foto", fotoFile);
    }

    try {
      if (editingId) {
        await updateMiembro(editingId, formData);
      } else {
        await createMiembro(formData);
      }
      resetForm();
      setShowModal(false);
      loadMiembros();
    } catch (error) {
      console.error("Error guardando miembro", error);
      const msg = error.response?.data?.error || "Error al guardar el miembro";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      nombre: "", 
      email: "", 
      password: "", 
      telefono: "", 
      sexo: "", 
      peso_inicial: "", 
      estatura: "" 
    });
    setFotoFile(null);
    setFotoPreview(null);
    setEditingId(null);
  };

  const handleEdit = (m) => {
    setForm({
      nombre: m.nombre || "",
      email: m.email || "",
      password: "", 
      telefono: m.telefono || "",
      sexo: m.sexo || "",
      peso_inicial: m.peso_inicial || "",
      estatura: m.estatura || "",
    });

    if (m.foto_perfil) {
      setFotoPreview(`${BASE_URL}${m.foto_perfil}`);
    } else {
      setFotoPreview(null);
    }
    setFotoFile(null);
    setEditingId(m.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de desactivar este miembro?")) {
      setLoading(true);
      try {
        await deleteMiembro(id);
        loadMiembros();
      } catch (error) {
        alert("Error al eliminar");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReactivate = async (id) => {
    if (window.confirm("¿Deseas reactivar este miembro?")) {
      setLoading(true);
      try {
        await reactivateMiembro(id);
        loadMiembros();
      } catch (error) {
        alert("Error al reactivar");
      } finally {
        setLoading(false);
      }
    }
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || altura === 0) return "N/A";
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  const imcActual = calcularIMC(
    parseFloat(form.peso_inicial),
    parseFloat(form.estatura)
  );

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <h2 className="page-title">Gestión de Miembros</h2>
        <div className="header-actions">
           <button
             className="btn-compact-primary"
             onClick={() => {
               resetForm();
               setShowModal(true);
             }}
             style={{ marginRight: '10px' }}
           >
             <PlusIcon style={{ marginRight: '6px' }} /> Nuevo Miembro
           </button>
           
           <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn-outline-small ${!verInactivos ? 'active-tab' : ''}`}
                onClick={() => { 
                  setVerInactivos(false); 
                  setPage(1); 
                  resetForm(); 
                }}
                style={{ 
                  backgroundColor: !verInactivos ? '#3b82f6' : 'transparent', 
                  color: !verInactivos ? 'white' : 'inherit', 
                  borderColor: !verInactivos ? '#3b82f6' : 'rgba(255,255,255,0.1)' 
                }}
              >
                Activos
              </button>
              <button 
                className={`btn-outline-small ${verInactivos ? 'active-tab' : ''}`}
                onClick={() => { 
                  setVerInactivos(true); 
                  setPage(1); 
                  resetForm(); 
                }}
                style={{ 
                  backgroundColor: verInactivos ? '#ef4444' : 'transparent', 
                  color: verInactivos ? 'white' : 'inherit', 
                  borderColor: verInactivos ? '#ef4444' : 'rgba(255,255,255,0.1)' 
                }}
              >
                Papelera / Inactivos
              </button>
           </div>
        </div>
      </div>

      <MiembroModal
        open={showModal}
        title={editingId ? "Editar Miembro" : "Registrar Nuevo Miembro"}
        onClose={() => {
          resetForm();
          setShowModal(false);
        }}
      >
        <MiembroForm
          form={form}
          setForm={setForm}
          loading={loading}
          editingId={editingId}
          fotoPreview={fotoPreview}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          onCancel={() => {
            resetForm();
            setShowModal(false);
          }}
          imcActual={imcActual}
        />
      </MiembroModal>

      {/* Buscador */}
      <div className="search-section">
        <div className="search-container">
          <div className="input-dark-container with-icon">
            <SearchIcon />
            <input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={handleSearchChange} // Usamos el handler nuevo
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => { setSearchTerm(""); setPage(1); }}>×</button>
            )}
          </div>
        </div>
      </div>

      {loading && miembros.length === 0 ? (
        <div className="loading-spinner">
          <div className="dashboard-spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : (
        <>
          {/* CORRECCIÓN 4: Diseño Responsive para evitar que se corte la 3ra columna */}
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {/* CORRECCIÓN 5: Usamos directamente 'miembros', ya viene filtrado del back */}
            {miembros.map((m) => (
              <div key={m.id} className="stat-card member-card-hover" style={{ opacity: verInactivos ? 0.85 : 1 }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    background: '#334155', 
                    border: '3px solid #475569', 
                    flexShrink: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {m.foto_perfil ? (
                      <img 
                        src={`${BASE_URL}${m.foto_perfil}`} 
                        alt={m.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.style.display = 'none'; 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', height: '100%', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' 
                      }}>
                        <UserIcon />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="member-details">
                      <div className="detail-row"><MailIcon /><span>{m.email || "No especificado"}</span></div>
                      <div className="detail-row"><PhoneIcon /><span>{m.telefono || "No especificado"}</span></div>
                      <div className="detail-row"><GenderIcon /><span>
                        {m.sexo === "M" ? "Masculino" : m.sexo === "F" ? "Femenino" : m.sexo || "No especificado"}
                      </span></div>
                    </div>
                  </div>
                  <div className="member-actions" style={{ alignSelf: 'flex-start' }}>
                    {!verInactivos ? (
                      <>
                        <button className="icon-btn" onClick={() => handleEdit(m)} title="Editar">
                          <EditIcon />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(m.id)} title="Desactivar">
                          <TrashIcon />
                        </button>
                      </>
                    ) : (
                      <button 
                        className="icon-btn normal" 
                        onClick={() => handleReactivate(m.id)} 
                        title="Reactivar" 
                        style={{ color: '#4ade80' }}
                      >
                        <RefreshIcon />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
  marginTop: '10px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' 
}}>
  <div>
    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
      {m.nombre || "Usuario Anónimo"}
    </h4>

    {/* ✅ MEMBRESÍA */}
    <div style={{ marginTop: "6px" }}>
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          backgroundColor: m.membresia ? "#22c55e" : "#475569",
          color: "white",
          display: "inline-block"
        }}
      >
        {m.membresia ? m.membresia.nombre : "Sin membresía"}
      </span>
    </div>

    {/* ✅ FECHA DE VENCIMIENTO (opcional pero útil) */}
    {m.membresia && (
      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
        Vence: {m.membresia.fecha_fin}
      </div>
    )}
  </div>

  <span className={`status-badge ${!verInactivos ? "normal" : "urgent"}`}>
    {verInactivos ? "Inactivo" : "Activo"}
  </span>
</div>
                <div className="metrics-grid" style={{ marginTop: '15px' }}>
                  <div className="metric">
                    <WeightIcon />
                    <div>
                      <div className="metric-label">Peso</div>
                      <div className="metric-value">{m.peso_inicial || "N/A"} kg</div>
                    </div>
                  </div>
                  <div className="metric">
                    <HeightIcon />
                    <div>
                      <div className="metric-label">Estatura</div>
                      <div className="metric-value">{m.estatura || "N/A"} m</div>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-icon">BMI</div>
                    <div>
                      <div className="metric-label">IMC</div>
                      <div className="metric-value">{calcularIMC(m.peso_inicial, m.estatura)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination-controls">
                <button 
                  className="btn-outline-small" 
                  onClick={() => setPage(page - 1)} 
                  disabled={page === 1 || loading}
                >
                  Anterior
                </button>
                <span className="page-info">Página {page} de {totalPages}</span>
                <button 
                  className="btn-outline-small" 
                  onClick={() => setPage(page + 1)} 
                  disabled={page === totalPages || loading}
                >
                  Siguiente
                </button>
            </div>
          )}
          {miembros.length === 0 && (
            <div className="empty-state">
              <UserIcon style={{ fontSize: "48px", marginBottom: "16px" }} />
              <h3>
                {searchTerm 
                  ? "No se encontraron resultados" 
                  : (verInactivos ? "Papelera vacía" : "No hay miembros activos")}
              </h3>
            </div>
          )}
        </>
      )}
    </div>
  );
}