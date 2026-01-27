import { useEffect, useState } from "react";
import {
  getMiembros,
  createMiembro,
  updateMiembro,
  deleteMiembro,
} from "../api/miembros";
import "../css/CSSUnificado.css";

/* ================= ICONOS SVG ================= */
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" x2="10" y1="11" y2="17"/>
    <line x1="14" x2="14" y1="11" y2="17"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const WeightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"/>
    <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
  </svg>
);

const HeightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 16 4-4-4-4"/>
    <path d="m6 8-4 4 4 4"/>
    <path d="M14.5 4v16"/>
  </svg>
);

const GenderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
);

export default function MiembrosDashboard() {
  const [miembros, setMiembros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    telefono: "",
    sexo: "",
    peso_inicial: "",
    estatura: "",
  });

  /* ================= CARGAR MIEMBROS ================= */
  const loadMiembros = async () => {
    setLoading(true);
    try {
      const { data } = await getMiembros();
      setMiembros(data);
    } catch (error) {
      console.error("Error cargando miembros", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMiembros();
  }, []);

  /* ================= GUARDAR ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.telefono.trim() || !form.sexo) {
      alert("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateMiembro(editingId, form);
      } else {
        await createMiembro(form);
      }

      setForm({
        telefono: "",
        sexo: "",
        peso_inicial: "",
        estatura: "",
      });
      setEditingId(null);
      loadMiembros();
    } catch (error) {
      console.error("Error guardando miembro", error);
      alert("Error al guardar el miembro");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDITAR ================= */
  const handleEdit = (m) => {
    setForm({
      telefono: m.telefono || "",
      sexo: m.sexo || "",
      peso_inicial: m.peso_inicial || "",
      estatura: m.estatura || "",
    });
    setEditingId(m.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= ELIMINAR ================= */
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este miembro?")) {
      setLoading(true);
      try {
        await deleteMiembro(id);
        loadMiembros();
      } catch (error) {
        console.error("Error eliminando miembro", error);
        alert("Error al eliminar el miembro");
      } finally {
        setLoading(false);
      }
    }
  };

  /* ================= FILTRO ================= */
  const filteredMiembros = miembros.filter((m) => {
    const nombre = (m.nombre || "").toLowerCase();
    const email = (m.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return nombre.includes(term) || email.includes(term);
  });

  /* ================= CALCULAR IMC ================= */
  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || altura === 0) return "N/A";
    const imc = peso / (altura * altura);
    return imc.toFixed(1);
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <h2 className="page-title">Gestión de Miembros</h2>
        <div className="header-actions">
          <span className="total-count">{filteredMiembros.length} miembros</span>
        </div>
      </div>

      {/* ================= FORMULARIO MEJORADO ================= */}
      <div className="form-section">
        <div className="form-card stat-card">
          <div className="form-header">
            <h3>
              <UserIcon style={{ marginRight: "8px" }} />
              {editingId ? "Editar Miembro" : "Nuevo Miembro"}
            </h3>
            {editingId && (
              <button 
                className="btn-outline-small" 
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    telefono: "",
                    sexo: "",
                    peso_inicial: "",
                    estatura: "",
                  });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <PhoneIcon style={{ marginRight: "8px" }} />
                  Teléfono *
                </label>
                <input
                  className="input-dark-container"
                  placeholder="Ej: +34 123 456 789"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <GenderIcon style={{ marginRight: "8px" }} />
                  Sexo *
                </label>
                <select
                  className="input-dark-container"
                  value={form.sexo}
                  onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                  required
                >
                  <option value="">Seleccionar sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <WeightIcon style={{ marginRight: "8px" }} />
                  Peso inicial (kg)
                </label>
                <input
                  className="input-dark-container"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="Ej: 75.5"
                  value={form.peso_inicial}
                  onChange={(e) =>
                    setForm({ ...form, peso_inicial: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  <HeightIcon style={{ marginRight: "8px" }} />
                  Estatura (m)
                </label>
                <input
                  className="input-dark-container"
                  type="number"
                  step="0.01"
                  min="1.20"
                  max="2.30"
                  placeholder="Ej: 1.75"
                  value={form.estatura}
                  onChange={(e) =>
                    setForm({ ...form, estatura: e.target.value })
                  }
                />
              </div>
            </div>

            <button 
              className="btn-primary btn-block" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : (
                <>
                  <PlusIcon /> 
                  {editingId ? "Actualizar Miembro" : "Crear Miembro"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ================= BUSCADOR MEJORADO ================= */}
      <div className="search-section">
        <div className="search-container">
          <div className="input-dark-container with-icon">
            <SearchIcon />
            <input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= LISTA DE MIEMBROS ================= */}
      {loading && miembros.length === 0 ? (
        <div className="loading-spinner">
          <div className="dashboard-spinner"></div>
          <p>Cargando miembros...</p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            {filteredMiembros.map((m) => (
              <div key={m.id} className="stat-card member-card-hover">
                <div className="member-header">
                  <div className="member-info">
                    <h4>{m.nombre || "Usuario Anónimo"}</h4>
                    <span className={`status-badge ${m.activo ? "normal" : "urgent"}`}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="member-actions">
                    <button 
                      className="icon-btn" 
                      onClick={() => handleEdit(m)}
                      title="Editar"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      className="icon-btn danger" 
                      onClick={() => handleDelete(m.id)}
                      title="Eliminar"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="member-details">
                  <div className="detail-row">
                    <MailIcon />
                    <span>{m.email || "No especificado"}</span>
                  </div>
                  <div className="detail-row">
                    <PhoneIcon />
                    <span>{m.telefono || "No especificado"}</span>
                  </div>
                  <div className="detail-row">
                    <GenderIcon />
                    <span>{m.sexo === "M" ? "Masculino" : m.sexo === "F" ? "Femenino" : m.sexo || "No especificado"}</span>
                  </div>
                  
                  <div className="metrics-grid">
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
                        <div className="metric-value">
                          {calcularIMC(m.peso_inicial, m.estatura)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMiembros.length === 0 && (
            <div className="empty-state">
              <UserIcon style={{ fontSize: "48px", marginBottom: "16px" }} />
              <h3>No se encontraron miembros</h3>
              <p>{searchTerm ? "Prueba con otros términos de búsqueda" : "Comienza agregando un nuevo miembro"}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}