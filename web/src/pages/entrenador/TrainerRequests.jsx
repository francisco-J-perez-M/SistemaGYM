/**
 * TrainerRequests.jsx — Panel del entrenador: solicitudes PT, chat y asignación de rutinas.
 *
 * Tabs:
 *   1. Solicitudes  — KPIs + lista filtrable; acciones inline; modal aceptar/rechazar
 *   2. Chat         — lista de miembros activos con badges; chat en tiempo real
 *   3. Asignar      — grid de rutinas + selector de miembro
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiMessageSquare, FiFileText, FiCheck, FiX, FiSend,
  FiRefreshCw, FiAlertCircle, FiClock, FiCheckCircle, FiXCircle,
  FiSearch, FiBook, FiChevronDown, FiChevronUp, FiZap, FiCalendar,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/CSSUnificado.css";

/* ── API helper ─────────────────────────────────────────────── */
const TRAINER = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/trainer${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || "Error");
  return data;
};

/* ── Helpers ─────────────────────────────────────────────────── */
/* Normaliza ISO → siempre con Z para que Date() interprete UTC correctamente */
const parseISO = (iso) => {
  if (!iso) return new Date();
  // Python devuelve "+00:00" o sin zona; normalizamos a "Z"
  return new Date(iso.replace("+00:00", "Z").replace(/(\.\d+)Z$/, "Z"));
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  return parseISO(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (iso) => {
  if (!iso) return "";
  return parseISO(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
};
const fmtRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const ESTADO_META = {
  pendiente: { label: "Pendiente", color: "var(--warning)", bg: "rgba(245,158,11,.12)", icon: <FiClock /> },
  aceptada:  { label: "Aceptada",  color: "var(--success)", bg: "rgba(16,185,129,.12)", icon: <FiCheckCircle /> },
  rechazada: { label: "Rechazada", color: "var(--danger)", bg: "rgba(239,68,68,.12)",  icon: <FiXCircle /> },
};

const TIPO_SESION_LABEL = {
  individual: "Individual",
  grupal:     "Grupal",
  online:     "Online",
};

/* ── Variantes animación ─────────────────────────────────────── */
const tabVariants = {
  enter:  { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0,   transition: { duration: 0.2  } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.14 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.22 } }),
};

/* ═══════════════════════════════════════════════════════════════
   STAT CARD MINI
══════════════════════════════════════════════════════════════════ */
function MiniStat({ label, value, color, icon, onClick, active }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      onClick={onClick}
      style={{
        flex: "1 1 160px",
        maxWidth: 220,
        minWidth: 120,
        background: active ? `${color}18` : "var(--bg-card)",
        border: `1.5px solid ${active ? color : "var(--border)"}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.18s",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: "1.2rem",
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {label}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — SOLICITUDES
══════════════════════════════════════════════════════════════════ */
function TabSolicitudes({ onChatWith }) {
  const [todas,    setTodas]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [filtro,   setFiltro]   = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [modal,    setModal]    = useState(null);
  const [notas,    setNotas]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Cargar TODOS los estados para calcular KPIs
  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pend, acep, rech] = await Promise.all([
        TRAINER("GET", "/pt-requests?estado=pendiente"),
        TRAINER("GET", "/pt-requests?estado=aceptada"),
        TRAINER("GET", "/pt-requests?estado=rechazada"),
      ]);
      setTodas([
        ...(pend.solicitudes || []),
        ...(acep.solicitudes || []),
        ...(rech.solicitudes || []),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const counts = {
    pendiente: todas.filter(s => s.estado === "pendiente").length,
    aceptada:  todas.filter(s => s.estado === "aceptada").length,
    rechazada: todas.filter(s => s.estado === "rechazada").length,
  };

  const filtradas = todas
    .filter(s => s.estado === filtro)
    .filter(s => s.nombre_miembro?.toLowerCase().includes(busqueda.toLowerCase()));

  const confirmar = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      await TRAINER("PATCH", `/pt-requests/${modal.sol.id}`, {
        accion: modal.accion,
        notas_entrenador: notas.trim(),
      });
      setModal(null);
      cargar();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* KPI stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", maxWidth: 680 }}>
        <MiniStat
          label="Pendientes"  value={counts.pendiente}
          color="var(--warning)"     icon={<FiClock />}
          active={filtro === "pendiente"}
          onClick={() => setFiltro("pendiente")}
        />
        <MiniStat
          label="Aceptadas"   value={counts.aceptada}
          color="var(--success)"     icon={<FiCheckCircle />}
          active={filtro === "aceptada"}
          onClick={() => setFiltro("aceptada")}
        />
        <MiniStat
          label="Rechazadas"  value={counts.rechazada}
          color="var(--danger)"     icon={<FiXCircle />}
          active={filtro === "rechazada"}
          onClick={() => setFiltro("rechazada")}
        />
      </div>

      {/* Buscador + refresh */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <FiSearch style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--text-secondary)",
          }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, margin: 0 }}
            placeholder={`Buscar en ${ESTADO_META[filtro]?.label?.toLowerCase()}s…`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <motion.button
          className="btn-secondary"
          style={{ padding: "9px 14px", flexShrink: 0 }}
          onClick={cargar}
          whileTap={{ rotate: 180 }}
          transition={{ duration: 0.4 }}
        >
          <FiRefreshCw />
        </motion.button>
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div style={{ textAlign: "center", padding: 56, color: "var(--text-secondary)" }}>
          <FiRefreshCw className="spin" size={28} />
          <p style={{ marginTop: 12, fontSize: "0.88rem" }}>Cargando solicitudes…</p>
        </div>
      )}
      {error && !loading && (
        <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Lista */}
      {!loading && !error && (
        <>
          {filtradas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "56px 24px" }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `${ESTADO_META[filtro]?.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <span style={{ fontSize: "2rem", color: ESTADO_META[filtro]?.color }}>
                  {ESTADO_META[filtro]?.icon}
                </span>
              </div>
              <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "1rem", color: "var(--text-primary)" }}>
                Sin solicitudes {ESTADO_META[filtro]?.label?.toLowerCase()}s
              </p>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                {filtro === "pendiente" && "Los miembros que te soliciten aparecerán aquí."}
                {filtro === "aceptada"  && "Acepta solicitudes pendientes para ver los miembros activos."}
                {filtro === "rechazada" && "No has rechazado ninguna solicitud."}
              </p>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <AnimatePresence mode="popLayout">
                {filtradas.map((sol, i) => {
                  const meta   = ESTADO_META[sol.estado] || ESTADO_META.pendiente;
                  const isOpen = expanded === sol.id;

                  return (
                    <motion.div
                      key={sol.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        overflow: "hidden",
                        transition: "border-color 0.2s",
                      }}
                      whileHover={{ borderColor: meta.color + "66" }}
                    >
                      {/* Franja de color lateral */}
                      <div style={{
                        display: "flex",
                        borderLeft: `3px solid ${meta.color}`,
                      }}>
                        {/* Contenido principal */}
                        <div style={{ flex: 1, padding: "16px 18px" }}>
                          {/* Row principal */}
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            {/* Avatar */}
                            <div style={{
                              width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                              background: `linear-gradient(135deg, ${meta.color}cc, ${meta.color}66)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#fff", fontWeight: 700, fontSize: "1.1rem",
                              boxShadow: `0 2px 10px ${meta.color}44`,
                            }}>
                              {sol.nombre_miembro?.[0]?.toUpperCase() || "?"}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.97rem", color: "var(--text-primary)" }}>
                                  {sol.nombre_miembro}
                                </p>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "2px 9px", borderRadius: 20, fontSize: "0.72rem",
                                  background: meta.bg, color: meta.color, fontWeight: 600,
                                }}>
                                  {meta.icon}&nbsp;{meta.label}
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                  <FiCalendar /> {fmtDate(sol.fecha_solicitud)}
                                </span>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                  • {TIPO_SESION_LABEL[sol.tipo_sesion] || sol.tipo_sesion || "Individual"}
                                </span>
                              </div>
                            </div>

                            {/* Acciones rápidas */}
                            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                              {sol.estado === "pendiente" && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 6,
                                      padding: "7px 14px", borderRadius: 8, fontSize: "0.82rem",
                                      fontWeight: 600, border: "none", cursor: "pointer",
                                      background: "rgba(16,185,129,.15)", color: "var(--success)",
                                      transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,.25)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,.15)"}
                                    onClick={() => { setModal({ sol, accion: "aceptar" }); setNotas(""); }}
                                  >
                                    <FiCheck size={14} /> Aceptar
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.94 }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 6,
                                      padding: "7px 14px", borderRadius: 8, fontSize: "0.82rem",
                                      fontWeight: 600, border: "none", cursor: "pointer",
                                      background: "rgba(239,68,68,.12)", color: "var(--danger)",
                                      transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.22)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,.12)"}
                                    onClick={() => { setModal({ sol, accion: "rechazar" }); setNotas(""); }}
                                  >
                                    <FiX size={14} /> Rechazar
                                  </motion.button>
                                </>
                              )}
                              {sol.estado === "aceptada" && (
                                <motion.button
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "7px 14px", borderRadius: 8, fontSize: "0.82rem",
                                    fontWeight: 600, border: "none", cursor: "pointer",
                                    background: "var(--accent-dim)", color: "var(--accent, var(--accent))",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,.25)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "var(--accent-dim)"}
                                  onClick={() => onChatWith({ id: sol.id_miembro_pg, nombre: sol.nombre_miembro })}
                                >
                                  <FiMessageSquare size={14} /> Chat
                                </motion.button>
                              )}
                              {/* Toggle notas */}
                              {(sol.notas_miembro || sol.notas_entrenador) && (
                                <button
                                  style={{
                                    background: "none", border: "none", cursor: "pointer",
                                    color: "var(--text-secondary)", padding: 6, display: "flex",
                                  }}
                                  onClick={() => setExpanded(isOpen ? null : sol.id)}
                                >
                                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notas expandibles */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div style={{
                                  marginTop: 14, display: "flex", flexDirection: "column", gap: 10,
                                  paddingTop: 14, borderTop: "1px solid var(--border)",
                                }}>
                                  {sol.notas_miembro && (
                                    <div style={{
                                      background: "var(--bg-secondary, var(--bg-input))",
                                      borderRadius: 8, padding: "10px 14px",
                                    }}>
                                      <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                        Nota del miembro
                                      </p>
                                      <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                                        {sol.notas_miembro}
                                      </p>
                                    </div>
                                  )}
                                  {sol.notas_entrenador && (
                                    <div style={{
                                      background: `${meta.color}0d`,
                                      border: `1px solid ${meta.color}30`,
                                      borderRadius: 8, padding: "10px 14px",
                                    }}>
                                      <p style={{ margin: 0, fontSize: "0.74rem", color: meta.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>
                                        Tu respuesta
                                      </p>
                                      <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--text-primary)" }}>
                                        {sol.notas_entrenador}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ── Modal aceptar / rechazar ─────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 20,
            }}
            onClick={() => !saving && setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 24 }}
              style={{
                width: "100%", maxWidth: 440,
                background: "var(--bg-card)",
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,.5)",
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header modal */}
              <div style={{
                padding: "20px 24px",
                background: modal.accion === "aceptar"
                  ? "linear-gradient(135deg, rgba(16,185,129,.15), rgba(16,185,129,.05))"
                  : "linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.05))",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: modal.accion === "aceptar" ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: modal.accion === "aceptar" ? "var(--success)" : "var(--danger)",
                  fontSize: "1.2rem",
                }}>
                  {modal.accion === "aceptar" ? <FiCheckCircle /> : <FiXCircle />}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                    {modal.accion === "aceptar" ? "Aceptar solicitud" : "Rechazar solicitud"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {modal.sol.nombre_miembro}
                  </p>
                </div>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}
                  onClick={() => !saving && setModal(null)}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Body modal */}
              <div style={{ padding: 24 }}>
                <label className="form-label">Mensaje para el miembro <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(opcional)</span></label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 90, resize: "vertical", margin: "0 0 20px" }}
                  placeholder={modal.accion === "aceptar"
                    ? "Ej: Te espero los martes y jueves a las 7am, comenzamos la próxima semana."
                    : "Ej: En este momento no tengo disponibilidad en ese horario."}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: "9px 18px" }}
                    onClick={() => setModal(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 22px", borderRadius: 10, fontSize: "0.9rem",
                      fontWeight: 600, border: "none", cursor: saving ? "not-allowed" : "pointer",
                      background: modal.accion === "aceptar"
                        ? "linear-gradient(135deg, var(--success), #059669)"
                        : "linear-gradient(135deg, var(--danger), var(--danger))",
                      color: "#fff", opacity: saving ? 0.7 : 1,
                      boxShadow: modal.accion === "aceptar"
                        ? "0 4px 14px rgba(16,185,129,.4)"
                        : "0 4px 14px rgba(239,68,68,.4)",
                    }}
                    onClick={confirmar}
                    disabled={saving}
                  >
                    {saving
                      ? <><FiRefreshCw className="spin" /> Guardando…</>
                      : modal.accion === "aceptar"
                        ? <><FiCheck /> Confirmar aceptación</>
                        : <><FiX /> Confirmar rechazo</>
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAT VIEW
══════════════════════════════════════════════════════════════════ */
function ChatView({ miembro, onBack }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto,    setTexto]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const data = await TRAINER("GET", `/chat/${miembro.id}`);
      setMensajes(data.mensajes || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [miembro.id]);

  useEffect(() => {
    cargar();
    pollRef.current = setInterval(cargar, 5000);
    return () => clearInterval(pollRef.current);
  }, [cargar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true);
    setTexto("");
    try {
      await TRAINER("POST", `/chat/${miembro.id}`, { texto: t });
      cargar();
    } catch (e) {
      setTexto(t);
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 260px)", minHeight: 400 }}>
      {/* Header chat */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 0 16px",
        borderBottom: "1px solid var(--border)",
      }}>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{
            background: "var(--bg-secondary, var(--bg-input))", border: "none",
            cursor: "pointer", color: "var(--text-secondary)",
            width: 34, height: 34, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={onBack}
        >
          <FiX />
        </motion.button>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: "1.1rem",
          boxShadow: "0 2px 10px rgba(99,102,241,.35)",
        }}>
          {miembro.nombre?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.97rem" }}>{miembro.nombre}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--success)" }}>Activo</p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 4px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text-secondary)" }}>
            <FiRefreshCw className="spin" />
          </div>
        )}
        {!loading && mensajes.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-secondary)" }}>
            <FiMessageSquare size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
            <p style={{ margin: 0 }}>Inicia la conversación</p>
          </div>
        )}

        {mensajes.map((m, idx) => {
          const esEntrenador = m.remitente === "entrenador";
          const prevMismo    = idx > 0 && mensajes[idx - 1].remitente === m.remitente;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                justifyContent: esEntrenador ? "flex-end" : "flex-start",
                marginTop: prevMismo ? 2 : 10,
              }}
            >
              {!esEntrenador && !prevMismo && (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "var(--accent-dim)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "var(--accent, var(--accent))",
                  alignSelf: "flex-end", marginRight: 8,
                }}>
                  {m.remitente === "miembro" ? miembro.nombre?.[0]?.toUpperCase() : "?"}
                </div>
              )}
              {!esEntrenador && prevMismo && <div style={{ width: 36 }} />}

              <div style={{
                maxWidth: "70%",
                padding: "9px 14px",
                borderRadius: esEntrenador ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: esEntrenador
                  ? "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))"
                  : "var(--bg-secondary, var(--bg-input))",
                color: esEntrenador ? "#fff" : "var(--text-primary)",
                boxShadow: esEntrenador ? "0 2px 12px var(--border-hover)" : "none",
              }}>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.45 }}>{m.texto}</p>
                <p style={{
                  margin: "4px 0 0", fontSize: "0.7rem",
                  opacity: esEntrenador ? 0.75 : 0.55,
                  textAlign: "right",
                }}>
                  {fmtTime(m.fecha)}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 10, paddingTop: 12,
        borderTop: "1px solid var(--border)",
        alignItems: "flex-end",
      }}>
        <textarea
          className="form-input"
          style={{ flex: 1, minHeight: 44, maxHeight: 120, resize: "none", margin: 0, padding: "10px 14px" }}
          placeholder="Escribe un mensaje… (Enter para enviar)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
          maxLength={1000}
        />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: !texto.trim() || sending
              ? "var(--bg-secondary, var(--bg-input))"
              : "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))",
            color: !texto.trim() || sending ? "var(--text-secondary)" : "#fff",
            border: "none", cursor: !texto.trim() || sending ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: !texto.trim() || sending ? "none" : "0 2px 12px rgba(99,102,241,.35)",
            transition: "all 0.15s",
          }}
          onClick={enviar}
          disabled={!texto.trim() || sending}
        >
          {sending ? <FiRefreshCw className="spin" /> : <FiSend size={17} />}
        </motion.button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — CHAT
══════════════════════════════════════════════════════════════════ */
/**
 * Bandeja de conversaciones con los miembros.
 *
 * Se exporta para que la pantalla de Mensajes la reutilice: mensajes y
 * solicitudes son cosas distintas —una es hablar con clientes actuales, la otra
 * atender peticiones de quienes aún no lo son— y tenerlas en pestañas de la
 * misma pantalla obligaba a pasar por Solicitudes para leer un mensaje.
 */
export function TabChat({ chatTarget, onClearTarget }) {
  const [miembros,   setMiembros]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [activeMiem, setActiveMiem] = useState(chatTarget || null);

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [summary, solData] = await Promise.all([
        TRAINER("GET", "/chat/unread-summary"),
        TRAINER("GET", "/pt-requests?estado=aceptada"),
      ]);
      const unreadMap = {};
      (summary.por_miembro || []).forEach(r => { unreadMap[r.id_miembro_pg] = r.unread; });
      const lista = (solData.solicitudes || []).reduce((acc, s) => {
        if (!acc.find(m => m.id === s.id_miembro_pg)) {
          acc.push({ id: s.id_miembro_pg, nombre: s.nombre_miembro, unread: unreadMap[s.id_miembro_pg] || 0 });
        }
        return acc;
      }, []);
      lista.sort((a, b) => b.unread - a.unread);
      setMiembros(lista);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (chatTarget) { setActiveMiem(chatTarget); onClearTarget(); }
  }, [chatTarget, onClearTarget]);

  if (activeMiem) {
    return (
      <ChatView
        miembro={activeMiem}
        onBack={() => { setActiveMiem(null); cargar(); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.88rem" }}>
          {miembros.length} miembro{miembros.length !== 1 ? "s" : ""} con entrenamiento activo
        </p>
        <button className="btn-secondary" style={{ padding: "7px 12px" }} onClick={cargar}>
          <FiRefreshCw />
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-secondary)" }}>
          <FiRefreshCw className="spin" size={24} />
        </div>
      )}
      {error && !loading && <div className="alert-error"><FiAlertCircle /> {error}</div>}


      {!loading && !error && miembros.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "56px 24px" }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <FiMessageSquare size={32} style={{ color: "var(--accent, var(--accent))", opacity: 0.5 }} />
          </div>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--text-primary)" }}>Sin chats activos</p>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)" }}>
            Acepta solicitudes PT para habilitar el chat con los miembros.
          </p>
        </motion.div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {miembros.map((m, i) => (
          <motion.div
            key={m.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="show"
            whileHover={{ scale: 1.015, x: 4 }}
            onClick={() => setActiveMiem(m)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px",
              background: "var(--bg-card)",
              border: m.unread > 0 ? "1px solid var(--border-hover)" : "1px solid var(--border)",
              borderRadius: 14, cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "1.1rem",
                boxShadow: "0 2px 10px var(--border-hover)",
              }}>
                {m.nombre?.[0]?.toUpperCase() || "?"}
              </div>
              {m.unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: "absolute", top: -4, right: -4,
                    background: "linear-gradient(135deg, var(--danger), var(--danger))",
                    color: "#fff", borderRadius: "50%",
                    minWidth: 20, height: 20, padding: "0 4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.68rem", fontWeight: 700,
                    boxShadow: "0 2px 6px rgba(239,68,68,.5)",
                  }}
                >
                  {m.unread > 9 ? "9+" : m.unread}
                </motion.span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: m.unread > 0 ? 700 : 600, fontSize: "0.95rem" }}>{m.nombre}</p>
              {m.unread > 0
                ? <p style={{ margin: 0, fontSize: "0.79rem", color: "var(--accent, var(--accent))", fontWeight: 600 }}>
                    {m.unread} mensaje{m.unread !== 1 ? "s" : ""} sin leer
                  </p>
                : <p style={{ margin: 0, fontSize: "0.79rem", color: "var(--text-secondary)" }}>
                    Sin mensajes nuevos
                  </p>
              }
            </div>
            <FiMessageSquare style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — ASIGNAR RUTINA
══════════════════════════════════════════════════════════════════ */
function TabAsignar() {
  const [miembros,   setMiembros]   = useState([]);
  const [rutinas,    setRutinas]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [selMiembro, setSelMiembro] = useState("");
  const [selRutina,  setSelRutina]  = useState("");
  const [notas,      setNotas]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [ok,         setOk]         = useState("");
  const [busqRutina, setBusqRutina] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [mData, rData] = await Promise.all([
        TRAINER("GET", "/pt-requests?estado=aceptada"),
        TRAINER("GET", "/routines"),
      ]);
      const mapa = {};
      (mData.solicitudes || []).forEach(s => {
        if (!mapa[s.id_miembro_pg]) mapa[s.id_miembro_pg] = { id: s.id_miembro_pg, nombre: s.nombre_miembro };
      });
      setMiembros(Object.values(mapa));
      setRutinas(rData.routines || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const asignar = async () => {
    if (!selMiembro || !selRutina) return;
    setSaving(true); setOk(""); setError("");
    try {
      await TRAINER("POST", "/assign-routine", {
        id_rutina: selRutina,
        id_miembro_pg: parseInt(selMiembro, 10),
        notas_entrenador: notas.trim(),
      });
      setOk("Rutina asignada — el miembro ya puede verla en su sección de Entrenamiento.");
      setSelRutina(""); setNotas("");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const rutinasFiltradas = rutinas.filter(r =>
    r.name?.toLowerCase().includes(busqRutina.toLowerCase()) ||
    r.category?.toLowerCase().includes(busqRutina.toLowerCase())
  );
  const rutinaSeleccionada = rutinas.find(r => r.id === selRutina);
  const DIFF_COLOR = { Principiante: "var(--success)", Intermedio: "var(--warning)", Avanzado: "var(--danger)" };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 56, color: "var(--text-secondary)" }}>
        <FiRefreshCw className="spin" size={24} />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert-error" style={{ marginBottom: 16 }}><FiAlertCircle /> {error}</div>}
      <AnimatePresence>
        {ok && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 16px", borderRadius: 10, marginBottom: 16,
              background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.3)",
              color: "var(--success)", fontSize: "0.88rem", fontWeight: 600,
            }}
          >
            <FiCheckCircle size={18} style={{ flexShrink: 0 }} /> {ok}
          </motion.div>
        )}
      </AnimatePresence>

      {miembros.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "56px 24px" }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--accent-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <FiBook size={32} style={{ color: "var(--accent, var(--accent))", opacity: 0.5 }} />
          </div>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Sin miembros activos</p>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)" }}>
            Acepta solicitudes PT para poder asignar rutinas.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="form-label">Miembro</label>
            <select
              className="form-input"
              style={{ margin: 0 }}
              value={selMiembro}
              onChange={e => setSelMiembro(e.target.value)}
            >
              <option value="">— Selecciona un miembro —</option>
              {miembros.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Rutina a asignar</label>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 36, margin: 0 }}
                placeholder="Buscar por nombre o categoría…"
                value={busqRutina}
                onChange={e => setBusqRutina(e.target.value)}
              />
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
              gap: 10, maxHeight: 300, overflowY: "auto", paddingRight: 4,
            }}>
              {rutinasFiltradas.map((r, i) => {
                const selected  = r.id === selRutina;
                const diffColor = DIFF_COLOR[r.difficulty] || "var(--text-secondary)";
                return (
                  <motion.div
                    key={r.id}
                    custom={i} variants={cardVariants} initial="hidden" animate="show"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSelRutina(r.id === selRutina ? "" : r.id)}
                    style={{
                      padding: "13px 14px", borderRadius: 11, cursor: "pointer",
                      border: `2px solid ${selected ? "var(--accent, var(--accent))" : "var(--border)"}`,
                      background: selected ? "var(--accent-dim)" : "var(--bg-card)",
                      transition: "all 0.15s", position: "relative",
                    }}
                  >
                    {selected && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        width: 20, height: 20, borderRadius: "50%",
                        background: "var(--accent, var(--accent))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "0.65rem",
                      }}>
                        <FiCheck />
                      </div>
                    )}
                    <p style={{ margin: "0 0 5px", fontWeight: 700, fontSize: "0.86rem", paddingRight: selected ? 20 : 0 }}>
                      {r.name}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem",
                        background: "var(--bg-secondary, var(--bg-input))", color: "var(--text-secondary)",
                      }}>{r.category}</span>
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem",
                        background: `${diffColor}18`, color: diffColor, fontWeight: 600,
                      }}>{r.difficulty}</span>
                    </div>
                  </motion.div>
                );
              })}
              {rutinasFiltradas.length === 0 && (
                <p style={{ color: "var(--text-secondary)", gridColumn: "1/-1", fontSize: "0.85rem", padding: "8px 0" }}>
                  Sin resultados.
                </p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {rutinaSeleccionada && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  display: "flex", gap: 14, padding: "14px 18px",
                  background: "rgba(99,102,241,.08)", borderRadius: 12,
                  border: "1px solid var(--accent-dim)",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                    background: "var(--accent-dim)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--accent, var(--accent))",
                  }}>
                    <GiMuscleUp size={22} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 700 }}>{rutinaSeleccionada.name}</p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {rutinaSeleccionada.category} · {rutinaSeleccionada.difficulty} · {rutinaSeleccionada.duration_minutes || 60} min
                    </p>
                    {rutinaSeleccionada.description && (
                      <p style={{ margin: "6px 0 0", fontSize: "0.84rem" }}>{rutinaSeleccionada.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="form-label">
              Instrucciones adicionales <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              className="form-input"
              style={{ minHeight: 76, resize: "vertical", margin: 0 }}
              placeholder="Progresión semanal, cargas recomendadas, observaciones…"
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              width: "100%", padding: "13px 0", borderRadius: 12,
              fontSize: "0.95rem", fontWeight: 700, border: "none",
              cursor: (!selMiembro || !selRutina || saving) ? "not-allowed" : "pointer",
              background: (!selMiembro || !selRutina)
                ? "var(--bg-secondary, var(--bg-input))"
                : "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))",
              color: (!selMiembro || !selRutina) ? "var(--text-secondary)" : "#fff",
              boxShadow: (selMiembro && selRutina) ? "0 4px 18px var(--border-hover)" : "none",
              transition: "all 0.18s", opacity: saving ? 0.75 : 1,
            }}
            onClick={asignar}
            disabled={!selMiembro || !selRutina || saving}
          >
            {saving
              ? <><FiRefreshCw className="spin" /> Asignando…</>
              : <><FiZap size={17} /> Asignar rutina</>
            }
          </motion.button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════ */
// El chat se movió a su propia pantalla (TrainerMessages). Aquí quedan las dos
// tareas que sí forman parte del mismo flujo: aceptar a alguien y asignarle
// una rutina al aceptarlo.
const TABS = [
  { id: "solicitudes", label: "Solicitudes", icon: <FiUser size={16} />     },
  { id: "asignar",     label: "Asignar",     icon: <FiFileText size={16} /> },
];

export default function TrainerRequests() {
  const [tab, setTab] = useState("solicitudes");
  const navigate = useNavigate();

  // Al pulsar "Chat" en una solicitud se va a la pantalla de Mensajes con ese
  // miembro ya abierto, en lugar de cambiar de pestaña dentro de esta.
  const handleChatWith = (miembro) => {
    navigate("/trainer/messages", { state: { miembro } });
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px var(--border-hover)",
          }}>
            <GiMuscleUp size={26} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Solicitudes de Entrenamiento</h1>
            <p style={{ margin: "3px 0 0", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
              Acepta o rechaza peticiones y asigna la rutina inicial
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: "inline-flex", gap: 4,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12, padding: 4,
        marginBottom: 24,
      }}>
        {TABS.map(t => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id)}
            whileTap={{ scale: 0.96 }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px", borderRadius: 9,
              border: "none", cursor: "pointer",
              fontSize: "0.87rem", fontWeight: 600,
              background: tab === t.id
                ? "linear-gradient(135deg, var(--accent, var(--accent)), var(--accent-soft))"
                : "transparent",
              color: tab === t.id ? "#fff" : "var(--text-secondary)",
              boxShadow: tab === t.id ? "0 2px 10px rgba(99,102,241,.35)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.icon} {t.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {tab === "solicitudes" && <TabSolicitudes onChatWith={handleChatWith} />}
          {tab === "asignar"     && <TabAsignar />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
