import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FiUsers, FiSearch, FiCheckCircle, FiAlertCircle,
  FiXCircle, FiRefreshCw, FiUser, FiPhone, FiMail, FiPlus, FiX,
  FiEdit2, FiEye, FiSlash, FiRotateCcw, FiTrash2,
} from "react-icons/fi";
import {
  createMiembro, updateMiembro, deleteMiembro, reactivateMiembro,
  reenviarCredencialesMiembro,
} from "../../api/miembros";
import DetalleUsuarioModal, { fechaFicha } from "../../components/compartido/DetalleUsuarioModal";
import HistorialAsistencias from "../../components/compartido/HistorialAsistencias";
import EmailDomainInput from "../../components/compartido/EmailDomainInput";
import "../../css/CSSUnificado.css";

const API_URL = "/api/recepcionista";

const BADGE_STYLES = {
  activa:     { bg: "rgba(34,197,94,0.15)",  color: "var(--success)", icon: <FiCheckCircle size={12} /> },
  vencida:    { bg: "rgba(239,68,68,0.15)",   color: "var(--danger)", icon: <FiXCircle size={12} /> },
  por_vencer: { bg: "rgba(234,179,8,0.15)",   color: "var(--warning)", icon: <FiAlertCircle size={12} /> },
  sin_membresia: { bg: "rgba(100,116,139,0.15)", color: "var(--text-tertiary)", icon: <FiUser size={12} /> },
};

function StatusBadge({ status }) {
  const s = BADGE_STYLES[status] || BADGE_STYLES.sin_membresia;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
    }}>
      {s.icon}
      {status?.replace("_", " ") || "—"}
    </span>
  );
}

/** Traduce un miembro de /api/recepcionista/members a la ficha genérica de
 *  DetalleUsuarioModal -- mismo patrón que miembroADetalle() en
 *  MiembrosDashboard.jsx, pero sobre la forma de datos de este endpoint. */
function memberToDetalle(m) {
  return {
    nombre:    m.nombre,
    email:     m.email,
    telefono:  m.telefono,
    foto:      m.foto_perfil,
    activo:    m.activo !== false,
    subtitulo: m.tipo_membresia ?? null,
    datos: [
      { icono: "generico",   etiqueta: "ID",            valor: m.id_usuario_pg != null ? `#${m.id_usuario_pg}` : null },
      { icono: "membresia",  etiqueta: "Membresía",    valor: m.tipo_membresia },
      { icono: "vence",      etiqueta: "Vence",        valor: fechaFicha(m.fecha_fin) },
      { icono: "ingreso",    etiqueta: "Ingreso",       valor: fechaFicha(m.fecha_registro) },
      { icono: "generico",   etiqueta: "Sexo",          valor: m.sexo },
      { icono: "peso",       etiqueta: "Peso inicial",  valor: m.peso_inicial ? `${m.peso_inicial} kg` : null },
      { icono: "generico",   etiqueta: "Estatura",      valor: m.estatura ? `${m.estatura} m` : null },
      { icono: "objetivo",   etiqueta: "Objetivo",      valor: m.objetivo },
      { icono: "peso",       etiqueta: "Peso meta",     valor: m.peso_objetivo ? `${m.peso_objetivo} kg` : null },
      { icono: "correo",     etiqueta: "Correo",        valor: m.email },
      { icono: "telefono",   etiqueta: "Teléfono",      valor: m.telefono },
    ],
  };
}

// ── Confirmación de acciones (desactivar/reactivar/reenviar) ──────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: danger ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: danger ? "var(--danger)" : "var(--success)", fontWeight: 700, cursor: "pointer" }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

const fieldLabelSt = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 };
const fieldInputSt = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none",
};

// ── Modal: editar información del miembro ──────────────────────────────────
function EditMemberModal({ open, miembro, onClose, onSave }) {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", sexo: "", peso_inicial: "", estatura: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      nombre:       miembro?.nombre || "",
      email:        miembro?.email || "",
      telefono:     miembro?.telefono || "",
      sexo:         miembro?.sexo || "",
      peso_inicial: miembro?.peso_inicial ?? "",
      estatura:     miembro?.estatura ?? "",
    });
    setError(null);
  }, [open, miembro]);

  if (!open) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMiembro(miembro.id, {
        nombre:       form.nombre.trim(),
        email:        form.email.trim().toLowerCase(),
        telefono:     form.telefono.trim() || undefined,
        sexo:         form.sexo || undefined,
        peso_inicial: form.peso_inicial !== "" ? Number(form.peso_inicial) : undefined,
        estatura:     form.estatura !== "" ? Number(form.estatura) : undefined,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar la información.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Editar miembro</h2>
          <button type="button" onClick={() => !saving && onClose()} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={fieldLabelSt}>Nombre completo *</label>
            <input value={form.nombre} onChange={set("nombre")} required style={fieldInputSt} />
          </div>
          <div>
            <label style={fieldLabelSt}>Correo *</label>
            <EmailDomainInput
              value={form.email}
              onChange={(email) => setForm(f => ({ ...f, email }))}
              required
              inputStyle={fieldInputSt}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelSt}>Teléfono</label>
              <input value={form.telefono} onChange={set("telefono")} style={fieldInputSt} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelSt}>Sexo</label>
              <select value={form.sexo} onChange={set("sexo")} style={{ ...fieldInputSt, padding: "9px 12px" }}>
                <option value="">Sin especificar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelSt}>Peso inicial (kg)</label>
              <input type="number" step="0.1" value={form.peso_inicial} onChange={set("peso_inicial")} style={fieldInputSt} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabelSt}>Estatura (m)</label>
              <input type="number" step="0.01" value={form.estatura} onChange={set("estatura")} style={fieldInputSt} />
            </div>
          </div>

          {error && <p style={{ fontSize: 12.5, color: "var(--danger)", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={() => !saving && onClose()}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PER_PAGE = 10;

export default function ReceptionistMembers() {
  const navigate   = useNavigate();
  const [filtered, setFiltered] = useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [resumen,  setResumen]  = useState({ total: 0, activa: 0, por_vencer: 0, vencida: 0 });
  // Papelera: igual patrón que MiembrosDashboard.jsx (Propietario/Administrador) --
  // alterna entre el padrón activo y los miembros desactivados.
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Alta de miembros (antes exclusiva de Propietario/Administrador -- el
  // backend ahora tambien acepta el rol Recepcionista en POST /api/miembros).
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: "ok"|"error", msg }

  // Ver / editar / desactivar / reactivar / reenviar credenciales -- mismas
  // acciones que ya tiene el panel de Propietario/Administrador.
  const [detalle,  setDetalle]  = useState(null); // ficha completa (DetalleUsuarioModal)
  const [editando, setEditando] = useState(null); // miembro en edición, o null
  const [confirm,  setConfirm]  = useState(null); // { title, msg, danger, fn }

  // La búsqueda y el resumen por estado se resuelven en el servidor sobre todo
  // el padrón; el navegador solo recibe la página que va a mostrar.
  const fetchMembers = useCallback(async (p = 1, q = "", inactivos = mostrarInactivos) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: p, per_page: PER_PAGE, inactivos, ...(q ? { q } : {}) },
      });
      setFiltered(res.data.miembros || []);
      setPage(res.data.page || p);
      setPages(res.data.pages || 1);
      setResumen(res.data.resumen
        ? { total: res.data.total, ...res.data.resumen }
        : { total: res.data.total ?? 0, activa: 0, por_vencer: 0, vencida: 0 });
    } catch (err) {
      setError("No se pudo cargar la lista de miembros.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }
    fetchMembers(1, "", mostrarInactivos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambiar entre padrón activo / papelera reinicia a la página 1.
  useEffect(() => {
    fetchMembers(1, search, mostrarInactivos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  // Buscar reinicia a la página 1; se debouncea para no disparar una petición
  // por cada tecla.
  useEffect(() => {
    const t = setTimeout(() => fetchMembers(1, search, mostrarInactivos), search ? 400 : 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const stats = {
    total:      resumen.total,
    activos:    resumen.activa,
    por_vencer: resumen.por_vencer,
    vencidos:   resumen.vencida,
  };

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrirNuevo = () => {
    setForm({ nombre: "", email: "", telefono: "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setFormError("Nombre y correo son obligatorios.");
      return;
    }
    setGuardando(true);
    setFormError(null);
    try {
      await createMiembro({
        nombre:   form.nombre.trim(),
        email:    form.email.trim().toLowerCase(),
        telefono: form.telefono.trim() || undefined,
      });
      setModalOpen(false);
      setAviso({ tipo: "ok", msg: `${form.nombre.trim()} se registró y recibirá su contraseña por correo.` });
      fetchMembers(1, search, mostrarInactivos);
    } catch (err) {
      setFormError(err.response?.data?.error || "No se pudo registrar al miembro.");
    } finally {
      setGuardando(false);
    }
  };

  const handleSaveEdit = () => {
    setEditando(null);
    setAviso({ tipo: "ok", msg: "Información del miembro actualizada." });
    fetchMembers(page, search, mostrarInactivos);
  };

  const handleToggleActivo = (m) => {
    if (mostrarInactivos) {
      setConfirm({
        title:  `¿Reactivar a ${m.nombre}?`,
        message: "El miembro volverá a estar activo.",
        danger: false,
        fn: async () => {
          setConfirm(null);
          try {
            await reactivateMiembro(m.id);
            setAviso({ tipo: "ok", msg: `${m.nombre} reactivado.` });
            fetchMembers(1, search, mostrarInactivos);
          } catch {
            setAviso({ tipo: "error", msg: "No se pudo reactivar al miembro." });
          }
        },
      });
    } else {
      setConfirm({
        title:  `¿Desactivar a ${m.nombre}?`,
        message: "Podrás reactivarlo desde \"Ver inactivos\" en cualquier momento.",
        danger: true,
        fn: async () => {
          setConfirm(null);
          try {
            await deleteMiembro(m.id);
            setAviso({ tipo: "ok", msg: `${m.nombre} desactivado.` });
            fetchMembers(1, search, mostrarInactivos);
          } catch {
            setAviso({ tipo: "error", msg: "No se pudo desactivar al miembro." });
          }
        },
      });
    }
  };

  const handleResend = (m) => {
    setConfirm({
      title:  `¿Reenviar credenciales a ${m.nombre}?`,
      message: "Se generará una contraseña temporal nueva (la anterior deja de servir) y se le enviará por correo.",
      danger: false,
      fn: async () => {
        setConfirm(null);
        try {
          const { data } = await reenviarCredencialesMiembro(m.id);
          if (data?.aviso) setAviso({ tipo: "error", msg: data.msg });
          else setAviso({ tipo: "ok", msg: "Credenciales reenviadas por correo." });
        } catch {
          setAviso({ tipo: "error", msg: "No se pudieron reenviar las credenciales." });
        }
      },
    });
  };

  return (
    <div className="dashboard-content">
      {/* ── Header ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Miembros
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Consulta y gestión de membresías — recepción
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <motion.button
            onClick={() => fetchMembers(page, search, mostrarInactivos)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", background: "var(--accent-dim)",
              border: "1px solid var(--accent)", color: "var(--accent-soft)",
              borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}
          >
            <FiRefreshCw size={14} /> Actualizar
          </motion.button>
          <motion.button
            onClick={() => setMostrarInactivos(v => !v)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px",
              background: mostrarInactivos ? "rgba(239,68,68,0.12)" : "transparent",
              border: `1px solid ${mostrarInactivos ? "var(--danger)" : "var(--border)"}`,
              color: mostrarInactivos ? "var(--danger)" : "var(--text-secondary)",
              borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}
          >
            {mostrarInactivos ? "Ver activos" : "Ver inactivos"}
          </motion.button>
          {!mostrarInactivos && (
            <motion.button
              onClick={abrirNuevo}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", background: "var(--accent)",
                border: "1px solid var(--accent)", color: "#fff",
                borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px", fontWeight: 700,
              }}
            >
              <FiPlus size={14} /> Nuevo miembro
            </motion.button>
          )}
        </div>
      </motion.div>

      {aviso && (
        <div style={{
          marginBottom: "16px", padding: "10px 16px", borderRadius: "var(--r-md)",
          background: aviso.tipo === "ok" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          color: aviso.tipo === "ok" ? "var(--success)" : "var(--danger)",
          fontSize: "13px", fontWeight: 600,
        }}>
          {aviso.msg}
        </div>
      )}

      {/* ── KPIs ───────────────────────────────────── */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        {[
          { label: "Total Miembros", value: stats.total,      color: "var(--accent-soft)", icon: <FiUsers /> },
          { label: "Activos",        value: stats.activos,    color: "var(--success)",            icon: <FiCheckCircle /> },
          { label: "Por Vencer",     value: stats.por_vencer, color: "var(--warning)",            icon: <FiAlertCircle /> },
          { label: "Vencidos",       value: stats.vencidos,   color: "var(--danger)",            icon: <FiXCircle /> },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="stat-header">
              <h3>{kpi.label}</h3>
              <div className="card-icon-wrapper" style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
            <div className="stat-value" style={{ color: kpi.color }}>{kpi.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <FiSearch style={{
          position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
          color: "var(--text-secondary)", pointerEvents: "none",
        }} />
        <input
          type="text"
          placeholder="Buscar por nombre, correo o ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px 10px 40px",
            background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="chart-card">
        {loading ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
            Cargando…
          </p>
        ) : error ? (
          <p style={{ color: "var(--danger)", textAlign: "center", padding: "32px" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
            {mostrarInactivos ? "No hay miembros inactivos." : "No se encontraron miembros."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["ID", "Nombre", "Correo", "Teléfono", "Membresía", "Estado", "Acciones"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: h === "Acciones" ? "right" : "left", fontWeight: 700,
                      color: "var(--text-secondary)", fontSize: "11px",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <motion.tr
                    key={m._id || m.id || i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s",
                      opacity: mostrarInactivos ? 0.75 : 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "monospace" }}>
                      {m.id_usuario_pg != null ? `#${m.id_usuario_pg}` : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-primary)", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          background: "var(--accent-dim)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "var(--accent-soft)", fontWeight: 700, fontSize: "12px", flexShrink: 0,
                        }}>
                          {(m.nombre || "?")[0].toUpperCase()}
                        </div>
                        {m.nombre || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiMail size={12} />{m.email || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiPhone size={12} />{m.telefono || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--text-secondary)" }}>
                      {m.nombre_membresia || m.tipo_membresia || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={m.mem_status} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {!mostrarInactivos && m.debe_cambiar_password && (
                          <button
                            onClick={() => handleResend(m)}
                            title="Reenviar credenciales por correo"
                            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}
                          >
                            <FiMail size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setDetalle(m)}
                          title="Ver ficha completa"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                        >
                          <FiEye size={13} />
                        </button>
                        <button
                          onClick={() => setEditando(m)}
                          title="Editar información"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}
                        >
                          <FiEdit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(m)}
                          title={mostrarInactivos ? "Reactivar" : "Desactivar"}
                          style={{
                            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: 7, border: "none", cursor: "pointer",
                            background: mostrarInactivos ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                            color: mostrarInactivos ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {mostrarInactivos ? <FiRotateCcw size={13} /> : <FiSlash size={13} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button
            disabled={page <= 1}
            onClick={() => fetchMembers(page - 1, search, mostrarInactivos)}
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600,
              cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.5 : 1,
              background: "var(--bg-input)", color: "var(--text-secondary)" }}>
            ← Anterior
          </button>
          <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => fetchMembers(page + 1, search, mostrarInactivos)}
            style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600,
              cursor: page >= pages ? "default" : "pointer", opacity: page >= pages ? 0.5 : 1,
              background: "var(--bg-input)", color: "var(--text-secondary)" }}>
            Siguiente →
          </button>
        </div>
      )}

      {/* ── Modal: nuevo miembro ───────────────────── */}
      {modalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && !guardando && setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, width: "100%", maxWidth: 420,
            boxShadow: "0 24px 64px rgba(0,0,0,.6)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px", borderBottom: "1px solid var(--border)",
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Nuevo miembro
              </h2>
              <button
                type="button"
                onClick={() => !guardando && setModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex" }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearMiembro} style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={fieldLabelSt}>
                  Nombre completo *
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Ana López"
                  required
                  style={fieldInputSt}
                />
              </div>

              <div>
                <label style={fieldLabelSt}>
                  Correo *
                </label>
                <EmailDomainInput
                  value={form.email}
                  onChange={(email) => setForm(f => ({ ...f, email }))}
                  placeholder="ejemplo"
                  required
                  inputStyle={fieldInputSt}
                />
                <p style={{ fontSize: 11.5, color: "var(--text-tertiary)", margin: "6px 0 0" }}>
                  Se generará una contraseña y se enviará por correo a este email.
                </p>
              </div>

              <div>
                <label style={fieldLabelSt}>
                  Teléfono
                </label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="Opcional"
                  style={fieldInputSt}
                />
              </div>

              {formError && (
                <p style={{ fontSize: 12.5, color: "var(--danger)", margin: 0 }}>{formError}</p>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => !guardando && setModalOpen(false)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)",
                    background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: guardando ? "default" : "pointer", opacity: guardando ? 0.7 : 1,
                  }}
                >
                  {guardando ? "Guardando…" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: editar miembro ───────────────────── */}
      <EditMemberModal
        open={Boolean(editando)}
        miembro={editando}
        onClose={() => setEditando(null)}
        onSave={handleSaveEdit}
      />

      {/* ── Ficha completa (ver) ────────────────────── */}
      <DetalleUsuarioModal
        usuario={detalle ? memberToDetalle(detalle) : null}
        onClose={() => setDetalle(null)}
        titulo="Detalle del miembro"
        extra={detalle ? <HistorialAsistencias miembroId={detalle.id} /> : null}
      />

      {/* ── Confirmación (desactivar/reactivar/reenviar) ─ */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        danger={confirm?.danger}
        onConfirm={confirm?.fn}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
