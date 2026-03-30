// MiembrosDashboard.jsx — versión mejorada
// Cambios principales:
//   • Reemplaza window.confirm/alert → confirm dialog + toasts
//   • Cards rediseñadas con mejor jerarquía visual
//   • Skeleton loader en lugar de spinner simple
//   • Empty state mejorado con ilustración

import { useEffect, useState } from "react";
import {
  getMiembros,
  createMiembro,
  updateMiembro,
  deleteMiembro,
  reactivateMiembro,
  BASE_URL,
} from "../api/miembros";
import { useToast } from "../hooks/useToast";
import MiembroForm from "../components/miembros/MiembroForm";
import MiembroModal from "../components/miembros/MiembroModal";
import "../css/CSSUnificado.css";

/* ── Iconos ── */
const RefreshIcon  = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>);
const MailIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const PhoneIcon    = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);
const EditIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon    = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>);
const PlusIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SearchIcon   = () => (<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const UserIcon     = () => (<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const WeightIcon   = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/></svg>);
const HeightIcon   = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="M14.5 4v16"/></svg>);
const GenderIcon   = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>);
const ChevronLeft  = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>);
const ChevronRight = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>);

/* ── Helpers ── */
function calcularIMC(peso, altura) {
  if (!peso || !altura || Number(altura) === 0) return null;
  return (Number(peso) / (Number(altura) ** 2)).toFixed(1);
}

function imcLabel(imc) {
  if (!imc) return { label: "N/A", color: "var(--text-tertiary)" };
  const v = parseFloat(imc);
  if (v < 18.5) return { label: "Bajo", color: "var(--info)" };
  if (v < 25)   return { label: "Normal", color: "var(--success)" };
  if (v < 30)   return { label: "Sobrepeso", color: "var(--warning)" };
  return         { label: "Obesidad", color: "var(--danger)" };
}

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="stat-card" style={{ gap: 0 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div className="skeleton" style={{ width: 90, height: 90, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, paddingTop: 4 }}>
          <div className="skeleton" style={{ height: 11, width: "75%", borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 10 }} />
        </div>
        <div className="skeleton" style={{ height: 22, width: 60, borderRadius: 20 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
        {[0,1,2].map(i => (
          <div key={i} className="skeleton" style={{ height: 52, borderRadius: "var(--r-md)" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Avatar inteligente con foto o iniciales ── */
function MemberAvatar({ src, name, size = 90 }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      overflow: "hidden", background: "var(--accent-dim)",
      border: "2.5px solid var(--border)",
      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--accent-soft)", fontWeight: 700,
      fontSize: size * 0.28, transition: "border-color 0.2s ease",
    }}>
      {src && !imgError ? (
        <img src={src} alt={name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/* ── Tarjeta de miembro ── */
function MemberCard({ m, verInactivos, onEdit, onDelete, onReactivate }) {
  const imc = calcularIMC(m.peso_inicial, m.estatura);
  const imcInfo = imcLabel(imc);
  const fotoSrc = m.foto_perfil ? `${BASE_URL}${m.foto_perfil}` : null;

  return (
    <div
      className="stat-card member-card-hover"
      style={{ padding: "20px", gap: 0, opacity: verInactivos ? 0.88 : 1 }}
    >
      {/* Cabecera: foto + datos + acciones */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <MemberAvatar src={fotoSrc} name={m.nombre} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="member-details" style={{ gap: 6 }}>
            <div className="detail-row" style={{ fontSize: 12 }}>
              <MailIcon />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.email || "Sin email"}
              </span>
            </div>
            <div className="detail-row" style={{ fontSize: 12 }}>
              <PhoneIcon />
              <span>{m.telefono || "Sin teléfono"}</span>
            </div>
            <div className="detail-row" style={{ fontSize: 12 }}>
              <GenderIcon />
              <span>
                {m.sexo === "M" ? "Masculino" : m.sexo === "F" ? "Femenino" : m.sexo || "No especificado"}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {!verInactivos ? (
            <>
              <button className="icon-btn" onClick={() => onEdit(m)} title="Editar miembro"
                style={{ width: 32, height: 32, padding: 0 }}>
                <EditIcon />
              </button>
              <button className="icon-btn danger" onClick={() => onDelete(m)} title="Desactivar"
                style={{ width: 32, height: 32, padding: 0 }}>
                <TrashIcon />
              </button>
            </>
          ) : (
            <button className="icon-btn" onClick={() => onReactivate(m)} title="Reactivar"
              style={{ width: 32, height: 32, padding: 0, color: "var(--success)" }}>
              <RefreshIcon />
            </button>
          )}
        </div>
      </div>

      {/* Separador + Nombre + Membresía + Estado */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        marginTop: 14, paddingTop: 14,
        borderTop: "1px solid var(--border)",
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
            {m.nombre || "Usuario Anónimo"}
          </h4>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: m.membresia ? "var(--success-bg)" : "var(--bg-input)",
              color: m.membresia ? "var(--success)" : "var(--text-tertiary)",
              border: `1px solid ${m.membresia ? "var(--success)" : "var(--border)"}`,
              whiteSpace: "nowrap",
            }}>
              {m.membresia ? m.membresia.nombre : "Sin membresía"}
            </span>
            {m.membresia?.fecha_fin && (
              <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
                vence {m.membresia.fecha_fin}
              </span>
            )}
          </div>
        </div>
        <span className={`status-badge ${verInactivos ? "urgent" : "normal"}`}>
          {verInactivos ? "Inactivo" : "Activo"}
        </span>
      </div>

      {/* Métricas */}
      <div className="metrics-grid" style={{ marginTop: 12 }}>
        <div className="metric">
          <div className="metric-icon"><WeightIcon /></div>
          <div>
            <div className="metric-label">Peso</div>
            <div className="metric-value">{m.peso_inicial ? `${m.peso_inicial} kg` : "—"}</div>
          </div>
        </div>
        <div className="metric">
          <div className="metric-icon"><HeightIcon /></div>
          <div>
            <div className="metric-label">Estatura</div>
            <div className="metric-value">{m.estatura ? `${m.estatura} m` : "—"}</div>
          </div>
        </div>
        <div className="metric" style={{ borderLeft: imc ? `2px solid ${imcInfo.color}` : undefined }}>
          <div className="metric-icon" style={{ fontSize: 9, fontWeight: 800, color: imcInfo.color }}>IMC</div>
          <div>
            <div className="metric-label">Índice</div>
            <div className="metric-value" style={{ color: imcInfo.color }}>
              {imc ?? "—"}
              {imc && <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 400, color: imcInfo.color }}>{imcInfo.label}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
export default function MiembrosDashboard() {
  const { toast, confirm, ToastPortal } = useToast();

  const [miembros, setMiembros]       = useState([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [editingId, setEditingId]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [verInactivos, setVerInactivos] = useState(false);
  const [showModal, setShowModal]     = useState(false);

  const [form, setForm] = useState({
    nombre: "", email: "", password: "",
    telefono: "", sexo: "", peso_inicial: "", estatura: "",
  });
  const [fotoFile, setFotoFile]       = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  /* ── API ── */
  const loadMiembros = async () => {
    setLoading(true);
    try {
      const { data } = await getMiembros(page, verInactivos, searchTerm);
      setMiembros(data.miembros);
      setTotalPages(data.pages);
      if (data.miembros.length === 0 && page > 1) setPage(page - 1);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Sesión expirada", "Por favor, inicia sesión nuevamente.");
      } else {
        toast.error("Error de conexión", "No se pudieron cargar los miembros.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadMiembros, 500);
    return () => clearTimeout(t);
  }, [page, verInactivos, searchTerm]);

  /* ── Handlers ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFotoFile(file); setFotoPreview(URL.createObjectURL(file)); }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({ nombre: "", email: "", password: "", telefono: "", sexo: "", peso_inicial: "", estatura: "" });
    setFotoFile(null); setFotoPreview(null); setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.telefono.trim() || !form.sexo) {
      toast.warning("Campos incompletos", "Completa el teléfono y el sexo.");
      return;
    }
    if (!editingId && (!form.nombre.trim() || !form.email.trim())) {
      toast.warning("Campos requeridos", "Nombre y email son obligatorios.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (fotoFile) formData.append("foto", fotoFile);

    try {
      if (editingId) {
        await updateMiembro(editingId, formData);
        toast.success("Miembro actualizado", `Los datos de ${form.nombre} fueron guardados.`);
      } else {
        await createMiembro(formData);
        toast.success("Miembro creado", `${form.nombre} fue registrado exitosamente.`);
      }
      resetForm();
      setShowModal(false);
      loadMiembros();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al guardar el miembro";
      toast.error("Error al guardar", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setForm({
      nombre: m.nombre || "", email: m.email || "", password: "",
      telefono: m.telefono || "", sexo: m.sexo || "",
      peso_inicial: m.peso_inicial || "", estatura: m.estatura || "",
    });
    setFotoPreview(m.foto_perfil ? `${BASE_URL}${m.foto_perfil}` : null);
    setFotoFile(null);
    setEditingId(m.id);
    setShowModal(true);
  };

  const handleDelete = async (m) => {
    const ok = await confirm({
      title: `¿Desactivar a ${m.nombre}?`,
      message: "El miembro pasará a la papelera. Podrás reactivarlo en cualquier momento.",
      type: "danger",
      confirmText: "Sí, desactivar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    setLoading(true);
    try {
      await deleteMiembro(m.id);
      toast.success("Miembro desactivado", `${m.nombre} fue movido a la papelera.`);
      loadMiembros();
    } catch {
      toast.error("Error", "No se pudo desactivar el miembro.");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (m) => {
    const ok = await confirm({
      title: `¿Reactivar a ${m.nombre}?`,
      message: "El miembro volverá a estar activo en el sistema.",
      type: "success",
      confirmText: "Sí, reactivar",
      cancelText: "Cancelar",
    });
    if (!ok) return;

    setLoading(true);
    try {
      await reactivateMiembro(m.id);
      toast.success("Miembro reactivado", `${m.nombre} está activo nuevamente.`);
      loadMiembros();
    } catch {
      toast.error("Error", "No se pudo reactivar el miembro.");
    } finally {
      setLoading(false);
    }
  };

  const imcActual = calcularIMC(parseFloat(form.peso_inicial), parseFloat(form.estatura));

  /* ── Render ── */
  return (
    <div className="dashboard-content">
      {/* Portal de toasts y confirmaciones */}
      <ToastPortal />

      {/* Encabezado */}
      <div className="section-header">
        <h2 className="page-title">Gestión de Miembros</h2>
        <div className="header-actions" style={{ gap: 10 }}>
          <button
            className="btn-compact-primary"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <PlusIcon /> Nuevo Miembro
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn-outline-small"
              onClick={() => { setVerInactivos(false); setPage(1); resetForm(); }}
              style={{
                background: !verInactivos ? "var(--accent)" : "transparent",
                color: !verInactivos ? "#fff" : "var(--text-secondary)",
                borderColor: !verInactivos ? "var(--accent)" : "var(--border)",
              }}
            >
              Activos
            </button>
            <button
              className="btn-outline-small"
              onClick={() => { setVerInactivos(true); setPage(1); resetForm(); }}
              style={{
                background: verInactivos ? "var(--danger)" : "transparent",
                color: verInactivos ? "#fff" : "var(--text-secondary)",
                borderColor: verInactivos ? "var(--danger)" : "var(--border)",
              }}
            >
              Papelera
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <MiembroModal
        open={showModal}
        title={editingId ? "Editar Miembro" : "Registrar Nuevo Miembro"}
        onClose={() => { resetForm(); setShowModal(false); }}
      >
        <MiembroForm
          form={form} setForm={setForm} loading={loading}
          editingId={editingId} fotoPreview={fotoPreview}
          onFileChange={handleFileChange} onSubmit={handleSubmit}
          onCancel={() => { resetForm(); setShowModal(false); }}
          imcActual={imcActual}
        />
      </MiembroModal>

      {/* Buscador */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="input-dark-container with-icon">
            <SearchIcon />
            <input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => { setSearchTerm(""); setPage(1); }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      {loading && miembros.length === 0 ? (
        /* Skeleton */
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {miembros.map((m) => (
              <MemberCard
                key={m.id}
                m={m}
                verInactivos={verInactivos}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReactivate={handleReactivate}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn-outline-small"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1 || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ChevronLeft /> Anterior
              </button>
              <span className="page-info">Página {page} de {totalPages}</span>
              <button
                className="btn-outline-small"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                Siguiente <ChevronRight />
              </button>
            </div>
          )}

          {/* Empty state */}
          {miembros.length === 0 && (
            <div className="empty-state" style={{ padding: "64px 24px" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--bg-input)", display: "flex",
                alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", color: "var(--text-tertiary)",
              }}>
                <UserIcon />
              </div>
              <h3 style={{ marginBottom: 8 }}>
                {searchTerm
                  ? "Sin resultados"
                  : verInactivos ? "Papelera vacía" : "Sin miembros activos"}
              </h3>
              <p style={{ marginBottom: 24 }}>
                {searchTerm
                  ? `No se encontraron miembros para "${searchTerm}".`
                  : verInactivos
                    ? "No hay miembros desactivados actualmente."
                    : "Registra el primer miembro para comenzar."}
              </p>
              {!searchTerm && !verInactivos && (
                <button
                  className="btn-compact-primary"
                  onClick={() => { resetForm(); setShowModal(true); }}
                >
                  <PlusIcon /> Nuevo Miembro
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}