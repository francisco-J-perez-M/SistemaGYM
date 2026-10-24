/**
 * ReceptionistAppointments.jsx
 * — Calendario custom dark-theme
 * — Cliente buscable desde lista de miembros del gimnasio
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiCalendar, FiClock, FiUser, FiPlus, FiTrash2,
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiX, FiEdit2,
  FiChevronLeft, FiChevronRight, FiSearch,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API = "/api/recepcionista";
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const TIMES = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00",
];
const TYPES = [
  "Evaluacion - Nuevo cliente",
  "Tour de instalaciones",
  "Renovacion de membresia",
  "Clase grupal",
  "Sesion personal",
  "Consulta general",
  "Otro",
];
const STATUS = {
  confirmada: { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: <FiCheckCircle size={11} /> },
  pendiente:  { color: "#eab308", bg: "rgba(234,179,8,0.12)",  icon: <FiAlertCircle  size={11} /> },
  cancelada:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: <FiX            size={11} /> },
};
const EMPTY = { time: "09:00", client: "", client_id: null, type: TYPES[0], trainer: "", trainer_id: null, notes: "" };
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_HDR = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

/* ──────────────────────────────────────────────────────────────────────────────
   COMPONENTE: Calendario dark custom
   ────────────────────────────────────────────────────────────────────────── */
function DatePickerCustom({ value, onChange }) {
  const [open,   setOpen]   = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = value ? new Date(value + "T12:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef(null);

  // Cierra al hacer clic afuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Días del mes
  const buildDays = (year, month) => {
    const first = new Date(year, month, 1).getDay(); // 0=Dom
    const last  = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= last; d++) cells.push(d);
    return cells;
  };

  const cells   = buildDays(cursor.year, cursor.month);
  const todayD  = new Date();
  const selDate = value ? new Date(value + "T12:00:00") : null;

  const isToday = (d) =>
    d === todayD.getDate() && cursor.month === todayD.getMonth() && cursor.year === todayD.getFullYear();
  const isSel = (d) =>
    selDate && d === selDate.getDate() && cursor.month === selDate.getMonth() && cursor.year === selDate.getFullYear();

  const handleSelect = (d) => {
    const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => setCursor(c => {
    const m = c.month === 0 ? 11 : c.month - 1;
    const y = c.month === 0 ? c.year - 1 : c.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setCursor(c => {
    const m = c.month === 11 ? 0 : c.month + 1;
    const y = c.month === 11 ? c.year + 1 : c.year;
    return { year: y, month: m };
  });

  const fmtBtn = (iso) => {
    if (!iso) return "Seleccionar fecha";
    const d = new Date(iso + "T12:00:00");
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Botón disparador */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 8,
          border: "1px solid var(--border-dark)",
          background: "var(--bg-input)",
          color: "var(--text-primary)", fontSize: 13,
          cursor: "pointer", fontFamily: "inherit",
          transition: "border-color .15s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-dark)"}
      >
        <FiCalendar size={14} style={{ color: "var(--accent)" }} />
        {fmtBtn(value)}
      </button>

      {/* Calendario desplegable */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: .97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: -6, scale: .97 }}
            transition={{ duration: .15 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 9000,
              background: "var(--bg-card)",
              border: "1px solid var(--border-dark)",
              borderRadius: 12, padding: 16,
              boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
              minWidth: 280,
            }}
          >
            {/* Navegación mes */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <button onClick={prevMonth} style={navBtnStyle}>
                <FiChevronLeft size={15} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                {MESES[cursor.month]} {cursor.year}
              </span>
              <button onClick={nextMonth} style={navBtnStyle}>
                <FiChevronRight size={15} />
              </button>
            </div>

            {/* Cabecera días */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {DIAS_HDR.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", padding: "2px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Celdas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((d, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  {d ? (
                    <button
                      onClick={() => handleSelect(d)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: isToday(d) && !isSel(d)
                          ? "1px solid var(--accent)"
                          : "1px solid transparent",
                        background: isSel(d)
                          ? "var(--accent)"
                          : "transparent",
                        color: isSel(d)
                          ? "var(--text-on-accent)"
                          : isToday(d)
                          ? "var(--accent)"
                          : "var(--text-primary)",
                        fontWeight: isSel(d) || isToday(d) ? 700 : 400,
                        fontSize: 13, cursor: "pointer",
                        transition: "background .12s",
                      }}
                      onMouseEnter={e => { if (!isSel(d)) e.currentTarget.style.background = "var(--accent-dim)"; }}
                      onMouseLeave={e => { if (!isSel(d)) e.currentTarget.style.background = "transparent"; }}
                    >
                      {d}
                    </button>
                  ) : <div style={{ height: 32 }} />}
                </div>
              ))}
            </div>

            {/* Atajo Hoy */}
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => {
                  const t = new Date();
                  setCursor({ year: t.getFullYear(), month: t.getMonth() });
                  handleSelect(t.getDate());
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--accent)", fontSize: 12, fontWeight: 600, padding: "2px 0",
                }}
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const navBtnStyle = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text-secondary)", padding: 4, borderRadius: 6,
  display: "flex", alignItems: "center",
  transition: "color .12s",
};

/* ──────────────────────────────────────────────────────────────────────────────
   COMPONENTE: Combobox buscable de miembros
   ────────────────────────────────────────────────────────────────────────── */
function MemberCombobox({ value, onChange, members }) {
  const [query, setQuery]   = useState(value || "");
  const [open,  setOpen]    = useState(false);
  const ref = useRef(null);

  // Sincroniza si el valor cambia externamente (ej: limpiar formulario)
  useEffect(() => { setQuery(value || ""); }, [value]);

  // Cierra al clic afuera
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    return (
      (m.nombre || "").toLowerCase().includes(q) ||
      (m.email  || "").toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleSelect = (m) => {
    const nombre = m.nombre || m.email || "";
    setQuery(nombre);
    onChange(nombre, m.id_usuario_pg ?? null);
    setOpen(false);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value, null);   // texto libre → sin id
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <FiSearch size={14} style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-secondary)", pointerEvents: "none",
        }} />
        <input
          type="text"
          value={query}
          placeholder="Buscar miembro por nombre o correo..."
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 12px 10px 34px", borderRadius: 8,
            border: `1px solid ${query.trim() ? "var(--border-dark)" : "rgba(239,68,68,.6)"}`,
            background: "var(--bg-input)",
            color: "var(--text-primary)", fontSize: 14,
            fontFamily: "inherit",
          }}
        />
      </div>

      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }} transition={{ duration: .12 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9500,
              background: "var(--bg-card)",
              border: "1px solid var(--border-dark)",
              borderRadius: 10, overflow: "hidden",
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            }}
          >
            {filtered.map((m) => (
              <div
                key={m.id_usuario_pg || m._id || m.email}
                onClick={() => handleSelect(m)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  borderBottom: "1px solid var(--border-dark)",
                  transition: "background .1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--accent-dim)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* Avatar inicial */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--accent-dim)", border: "1px solid var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
                }}>
                  {(m.nombre || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {m.nombre}
                  </div>
                  {m.email && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </div>
                  )}
                </div>
                {m.mem_status && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                    background: m.mem_status === "activa" ? "rgba(34,197,94,0.15)"
                      : m.mem_status === "por_vencer" ? "rgba(234,179,8,0.15)"
                      : "rgba(239,68,68,0.12)",
                    color: m.mem_status === "activa" ? "#22c55e"
                      : m.mem_status === "por_vencer" ? "#eab308"
                      : "#ef4444",
                    flexShrink: 0,
                  }}>
                    {m.mem_status === "activa" ? "Activo"
                      : m.mem_status === "por_vencer" ? "Por vencer"
                      : m.mem_status === "vencida" ? "Vencida"
                      : "Sin membresía"}
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   BADGE de estado
   ────────────────────────────────────────────────────────────────────────── */
function Badge({ status }) {
  const s = STATUS[status] || STATUS.pendiente;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: s.bg, color: s.color,
      padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600,
    }}>
      {s.icon} {status}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────────────────── */
const shiftDate = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const fmtDate = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
const timeColor = (time) => {
  const h = parseInt(time.split(":")[0], 10);
  if (h < 10) return "var(--accent)";
  if (h < 14) return "#38bdf8";
  if (h < 18) return "#a78bfa";
  return "#ff6b9d";
};

/* ══════════════════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
   ════════════════════════════════════════════════════════════════════════════ */
export default function ReceptionistAppointments() {
  const [citas,    setCitas]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [selDate,  setSelDate]  = useState(new Date().toISOString().split("T")[0]);

  // Modal
  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);

  /* ── Fetchers ──────────────────────────────────────────────────────────── */
  const fetchCitas = useCallback(async (date) => {
    setLoading(true); setError(null);
    try {
      const r = await axios.get(`${API}/citas`, { headers: hdrs(), params: { date } });
      setCitas(r.data.citas || []);
    } catch { setError("No se pudieron cargar las citas."); }
    finally { setLoading(false); }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/trainers`, { headers: hdrs() });
      setTrainers(r.data.trainers || []);
    } catch { /* silencioso */ }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/members`, { headers: hdrs() });
      setMembers(r.data.miembros || r.data.members || []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { fetchCitas(selDate); }, [selDate]);
  useEffect(() => { fetchTrainers(); fetchMembers(); }, [fetchTrainers, fetchMembers]);

  /* ── CRUD ──────────────────────────────────────────────────────────────── */
  const openNew = () => {
    setForm({ ...EMPTY, date: selDate });
    setEditing(null);
    setModal("new");
  };
  const openEdit = (cita) => {
    setForm({ time: cita.time, client: cita.client, client_id: cita.client_id_pg || null, type: cita.type, trainer: cita.trainer || "", trainer_id: cita.trainer_id_pg || null, notes: cita.notes || "" });
    setEditing(cita);
    setModal("edit");
  };
  const closeModal = () => { setModal(null); setEditing(null); setForm(EMPTY); };

  const saveForm = async () => {
    if (!form.client.trim()) return;
    setSaving(true);
    try {
      if (modal === "new") {
        const r = await axios.post(`${API}/citas`, { ...form, date: selDate }, { headers: hdrs() });
        setCitas(prev => [...prev, r.data.cita].sort((a, b) => a.time.localeCompare(b.time)));
      } else {
        await axios.patch(`${API}/citas/${editing._id}`, form, { headers: hdrs() });
        setCitas(prev =>
          prev.map(c => c._id === editing._id ? { ...c, ...form } : c)
            .sort((a, b) => a.time.localeCompare(b.time))
        );
      }
      closeModal();
    } catch { setError("Error al guardar la cita."); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (cita) => {
    const next = cita.status === "confirmada" ? "pendiente" : "confirmada";
    try {
      await axios.patch(`${API}/citas/${cita._id}`, { status: next }, { headers: hdrs() });
      setCitas(prev => prev.map(c => c._id === cita._id ? { ...c, status: next } : c));
    } catch { setError("Error al actualizar."); }
  };

  const deleteCita = async (id) => {
    try {
      await axios.delete(`${API}/citas/${id}`, { headers: hdrs() });
      setCitas(prev => prev.filter(c => c._id !== id));
    } catch { setError("Error al eliminar."); }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="dashboard-content">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>
            <FiCalendar style={{ marginRight: 10 }} />Citas
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
            {fmtDate(selDate)} &bull; {citas.length} cita{citas.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Controles de fecha */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <motion.button className="btn-outline-small"
            onClick={() => setSelDate(d => shiftDate(d, -1))}
            whileHover={{ scale: 1.05 }}>
            <FiChevronLeft size={16} />
          </motion.button>

          {/* Calendario custom */}
          <DatePickerCustom value={selDate} onChange={setSelDate} />

          <motion.button className="btn-outline-small"
            onClick={() => setSelDate(d => shiftDate(d, 1))}
            whileHover={{ scale: 1.05 }}>
            <FiChevronRight size={16} />
          </motion.button>
          <motion.button className="btn-outline-small" onClick={() => fetchCitas(selDate)}
            title="Actualizar">
            <FiRefreshCw size={13} />
          </motion.button>
          <motion.button className="btn-primary"
            onClick={openNew}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FiPlus size={15} /> Nueva Cita
          </motion.button>
        </div>
      </motion.div>

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)", borderRadius: 8, color: "#ef4444", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* ── Lista ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-secondary)" }}>
          Cargando citas...
        </div>
      ) : citas.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            padding: 56, textAlign: "center",
            background: "var(--bg-card)", borderRadius: 14,
            border: "1px dashed var(--border-dark)",
          }}>
          <FiCalendar size={40} style={{ opacity: 0.25, marginBottom: 14 }} />
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Sin citas para este día</p>
          <p style={{ margin: "0 0 18px", color: "var(--text-secondary)", fontSize: 13 }}>
            {fmtDate(selDate)}
          </p>
          <button className="btn-primary" onClick={openNew}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FiPlus size={14} /> Agendar primera cita
          </button>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence>
            {citas.map((c, idx) => (
              <motion.div key={c._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.03 }}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-dark)",
                  borderLeft: `3px solid ${timeColor(c.time)}`,
                  borderRadius: 12, padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 16,
                }}
                whileHover={{ borderColor: timeColor(c.time), scale: 1.003 }}>
                {/* Hora */}
                <div style={{ minWidth: 58, textAlign: "center", color: timeColor(c.time), fontWeight: 800, fontSize: 17 }}>
                  <FiClock size={13} style={{ display: "block", margin: "0 auto 2px" }} />
                  {c.time}
                </div>
                {/* Detalle */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.client}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                    <span>{c.type}</span>
                    {c.trainer && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <FiUser size={11} />{c.trainer}
                      </span>
                    )}
                  </div>
                  {c.notes && <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>{c.notes}</div>}
                </div>
                {/* Acciones */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <Badge status={c.status} />
                  <motion.button className="btn-outline-small" onClick={() => openEdit(c)} title="Editar" whileHover={{ scale: 1.08 }}>
                    <FiEdit2 size={13} />
                  </motion.button>
                  <motion.button
                    className="btn-outline-small" onClick={() => toggleStatus(c)}
                    title={c.status === "confirmada" ? "Marcar pendiente" : "Confirmar"}
                    style={{ color: c.status === "confirmada" ? "#22c55e" : "#eab308" }}
                    whileHover={{ scale: 1.08 }}>
                    <FiCheckCircle size={13} />
                  </motion.button>
                  <motion.button
                    className="btn-outline-small" onClick={() => deleteCita(c._id)}
                    style={{ color: "#ef4444", borderColor: "#ef4444" }}
                    whileHover={{ scale: 1.08 }}>
                    <FiTrash2 size={13} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal nueva / editar ────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 8000,
              background: "rgba(0,0,0,0.65)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
            onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-dark)",
                borderRadius: 16, padding: 32,
                width: "100%", maxWidth: 540,
                boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              }}>
              {/* Cabecera */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {modal === "new" ? "Nueva Cita" : "Editar Cita"}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                    {fmtDate(selDate)}
                  </p>
                </div>
                <motion.button
                  onClick={closeModal}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 6 }}
                  whileHover={{ scale: 1.1 }}>
                  <FiX size={20} />
                </motion.button>
              </div>

              {/* Formulario */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Hora + Tipo */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                      <FiClock size={11} style={{ marginRight: 4 }} />Hora
                    </span>
                    <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                      style={selectStyle}>
                      {TIMES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Tipo de cita</span>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      style={selectStyle}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </div>

                {/* Cliente — combobox de miembros */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                    <FiUser size={11} style={{ marginRight: 4 }} />Cliente *
                  </span>
                  <MemberCombobox
                    value={form.client}
                    onChange={(nombre, id) => setForm(p => ({ ...p, client: nombre, client_id: id }))}
                    members={members}
                  />
                  {!form.client.trim() && (
                    <span style={{ fontSize: 11, color: "#ef4444" }}>Campo requerido</span>
                  )}
                </label>

                {/* Entrenador */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Entrenador / Encargado
                  </span>
                  {trainers.length > 0 ? (
                    <select value={form.trainer}
                      onChange={e => {
                        const t = trainers.find(x => x.nombre === e.target.value);
                        setForm(p => ({ ...p, trainer: e.target.value, trainer_id: t?.id ?? null }));
                      }}
                      style={selectStyle}>
                      <option value="">— Recepcion —</option>
                      {trainers.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.trainer} placeholder="Ej: Coach López"
                      onChange={e => setForm(p => ({ ...p, trainer: e.target.value, trainer_id: null }))}
                      style={inputStyle} />
                  )}
                </label>

                {/* Notas */}
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Notas</span>
                  <textarea value={form.notes} rows={3} placeholder="Información adicional..."
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                </label>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <motion.button className="btn-outline-small" onClick={closeModal} whileHover={{ scale: 1.03 }}>
                  Cancelar
                </motion.button>
                <motion.button
                  className="btn-primary" onClick={saveForm}
                  disabled={saving || !form.client.trim()}
                  whileHover={!saving ? { scale: 1.03 } : {}}
                  style={{ minWidth: 120 }}>
                  {saving ? "Guardando..." : modal === "new" ? "Crear Cita" : "Guardar Cambios"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Estilos compartidos ─────────────────────────────────────────────────── */
const selectStyle = {
  padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border-dark)",
  background: "var(--bg-input)",
  color: "var(--text-primary)", fontSize: 14,
  width: "100%",
};
const inputStyle = {
  padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border-dark)",
  background: "var(--bg-input)",
  color: "var(--text-primary)", fontSize: 14,
  width: "100%", boxSizing: "border-box",
};
