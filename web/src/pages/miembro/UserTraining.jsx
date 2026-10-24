/**
 * UserTraining.jsx — Hub de entrenamiento del miembro.
 *
 * Tabs:
 *   1. Rutinas       — mis rutinas propias + las asignadas por el entrenador
 *   2. Entrenador    — solicitar entrenamiento personal + chat directo
 *   3. Alertas       — recordatorios y notificaciones de entrenamiento
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiFileText, FiUser, FiBell, FiPlus, FiTrash2, FiSend,
  FiCheck, FiX, FiClock, FiAlertCircle, FiCheckCircle,
  FiMessageSquare, FiEdit2, FiZap, FiToggleLeft, FiToggleRight,
  FiChevronDown, FiChevronUp, FiRefreshCw, FiStar,
} from "react-icons/fi";
import { GiMuscleUp } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/CSSUnificado.css";

/* ── API helper ─────────────────────────────────────────────── */
const API = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/user/training${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || "Error");
  return data;
};

const ROUTINES_API = async (method, path, body) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/user${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.msg || "Error");
  return data;
};

/* ── Palette & helpers ──────────────────────────────────────── */
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DIAS_LABEL = { lunes: "L", martes: "M", miercoles: "X", jueves: "J", viernes: "V", sabado: "S", domingo: "D" };

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  ...extra,
});

const btn = (color = "var(--accent)", outline = false) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 16px", borderRadius: 8, cursor: "pointer",
  fontSize: 13, fontWeight: 600,
  border: outline ? `1px solid ${color}` : "none",
  background: outline ? "transparent" : color,
  color: outline ? color : "#fff",
});

const fmtFecha = (iso) => {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso.slice(0, 10); }
};

/* ══════════════════════════════════════════════════════════════
   TAB 1 — RUTINAS
══════════════════════════════════════════════════════════════ */
function TabRutinas() {
  const [propias,    setPropias]    = useState([]);
  const [asignadas,  setAsignadas]  = useState([]);
  const [loadP,      setLoadP]      = useState(true);
  const [loadA,      setLoadA]      = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [vista,      setVista]      = useState("propias"); // propias | asignadas

  const cargarPropias = useCallback(async () => {
    setLoadP(true);
    try {
      const d = await ROUTINES_API("GET", "/routines");
      setPropias(d.rutinas || []);
    } catch { /* silente */ }
    finally { setLoadP(false); }
  }, []);

  const cargarAsignadas = useCallback(async () => {
    setLoadA(true);
    try {
      const d = await API("GET", "/assigned-routines");
      setAsignadas(d.rutinas || []);
    } catch { /* silente */ }
    finally { setLoadA(false); }
  }, []);

  useEffect(() => { cargarPropias(); cargarAsignadas(); }, [cargarPropias, cargarAsignadas]);

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const RutinaCard = ({ rutina, asignada }) => {
    const open = expanded === rutina.id;
    return (
      <div style={{ ...card({ marginBottom: 10, overflow: "hidden" }) }}>
        <div
          onClick={() => toggle(rutina.id)}
          style={{
            padding: "14px 18px", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: asignada ? "rgba(16,185,129,.15)" : "var(--accent-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GiMuscleUp size={18} color={asignada ? "var(--success)" : "var(--accent)"} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                {rutina.nombre || rutina.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                {asignada
                  ? <>Asignada por <strong style={{ color: "var(--success)" }}>{rutina.nombre_entrenador}</strong> · {fmtFecha(rutina.fecha_asignacion)}</>
                  : <>{rutina.categoria || rutina.category} · {rutina.dificultad || rutina.difficulty}</>
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 99,
              background: asignada ? "rgba(16,185,129,.15)" : "var(--accent-dim)",
              color: asignada ? "var(--success)" : "var(--accent-soft)",
              fontWeight: 700,
            }}>
              {asignada ? "Entrenador" : "Propia"}
            </span>
            {open ? <FiChevronUp size={16} color="var(--text-secondary)" /> : <FiChevronDown size={16} color="var(--text-secondary)" />}
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border, rgba(255,255,255,.06))" }}>
                {rutina.notas_entrenador && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 8,
                    background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.2)",
                    fontSize: 13, color: "var(--success)",
                  }}>
                    💬 {rutina.notas_entrenador}
                  </div>
                )}
                {rutina.descripcion && (
                  <p style={{ margin: "12px 0 8px", fontSize: 13, color: "var(--text-secondary)" }}>
                    {rutina.descripcion}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {["duracion_minutos", "dificultad", "categoria"].map(k =>
                    rutina[k] ? (
                      <span key={k} style={{
                        fontSize: 11, padding: "3px 10px", borderRadius: 99,
                        background: "rgba(255,255,255,.06)", color: "var(--text-secondary)",
                      }}>
                        {k === "duracion_minutos" ? `${rutina[k]} min` : rutina[k]}
                      </span>
                    ) : null
                  )}
                </div>

                {(rutina.dias || []).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    {(rutina.dias).map((dia, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-soft)", marginBottom: 6 }}>
                          {dia.dia} — {dia.grupo}
                        </div>
                        {dia.ejercicios.map((ej, j) => (
                          <div key={j} style={{
                            display: "flex", gap: 10, padding: "7px 10px",
                            background: "var(--bg-input)", borderRadius: 6, marginBottom: 4,
                            fontSize: 12, color: "var(--text-primary)",
                          }}>
                            <span style={{ flex: 1 }}>{ej.nombre}</span>
                            <span style={{ color: "var(--text-secondary)" }}>{ej.series}×{ej.reps}</span>
                            {ej.peso && <span style={{ color: "var(--warning)" }}>{ej.peso}</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const loading = vista === "propias" ? loadP : loadA;
  const lista   = vista === "propias" ? propias : asignadas;

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Selector de vista */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "propias",   label: "Mis Rutinas",      count: propias.length   },
          { key: "asignadas", label: "Del Entrenador",   count: asignadas.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: vista === key ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
              background: vista === key ? "var(--accent)" : "transparent",
              color: vista === key ? "#fff" : "var(--text-secondary)",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {label}
            {count > 0 && (
              <span style={{
                background: vista === key ? "var(--accent)" : "var(--bg-input)",
                borderRadius: 99, padding: "1px 7px", fontSize: 10,
              }}>
                {count}
              </span>
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => vista === "propias" ? cargarPropias() : cargarAsignadas()}
          style={{ ...btn("#374151", true), padding: "7px 12px" }}
        >
          <FiRefreshCw size={13} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          color: "var(--text-secondary)", borderRadius: 12,
          border: "1px dashed var(--border, rgba(255,255,255,.1))",
        }}>
          <GiMuscleUp size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>
            {vista === "propias"
              ? "No tienes rutinas creadas todavía"
              : "Tu entrenador aún no te ha asignado rutinas"
            }
          </p>
        </div>
      ) : (
        lista.map(r => <RutinaCard key={r.id} rutina={r} asignada={vista === "asignadas"} />)
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — ENTRENADOR PERSONAL
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   RATING WIDGET — calificar entrenador (solicitud aceptada)
══════════════════════════════════════════════════════════════ */
function RatingWidget({ trainerId, trainerName }) {
  const [rating,     setRating]     = useState(0);       // valor guardado
  const [hover,      setHover]      = useState(0);       // estrella bajo el cursor
  const [comentario, setComentario] = useState("");
  const [guardado,   setGuardado]   = useState(false);   // ¿ya tiene calificación?
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState(null);    // {type, text}
  const [open,       setOpen]       = useState(false);   // panel expandido

  // Cargar calificación existente
  useEffect(() => {
    API("GET", "/trainer-rating")
      .then(d => {
        if (d.rating != null) {
          setRating(d.rating);
          setComentario(d.comentario || "");
          setGuardado(true);
          setOpen(false);
        } else {
          setOpen(true); // Si no ha calificado, expandir por defecto
        }
      })
      .catch(() => setOpen(true))
      .finally(() => setLoading(false));
  }, []);

  const guardar = async () => {
    if (!rating) { setMsg({ type: "err", text: "Selecciona una calificación" }); return; }
    setSaving(true); setMsg(null);
    try {
      await API("POST", "/trainer-rating", { calificacion: rating, comentario });
      setGuardado(true);
      setOpen(false);
      setMsg({ type: "ok", text: "¡Calificación guardada!" });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally { setSaving(false); }
  };

  if (loading) return null;

  const estrellaColor = (i) => {
    const active = (hover || rating) >= i;
    return active ? "var(--warning)" : "var(--border)";
  };

  return (
    <div style={{
      marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)",
    }}>
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: 0, color: "var(--text-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <FiStar size={14} style={{ color: "var(--warning)" }} />
          {guardado ? `Tu calificación: ${rating}/5` : `Calificar a ${trainerName}`}
          {guardado && (
            <span style={{ marginLeft: 4, display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <FiStar key={i} size={12} style={{ color: i <= rating ? "var(--warning)" : "var(--border)", fill: i <= rating ? "var(--warning)" : "none" }} />
              ))}
            </span>
          )}
        </div>
        {open ? <FiChevronUp size={14} color="var(--text-secondary)" />
               : <FiChevronDown size={14} color="var(--text-secondary)" />}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {msg && (
            <div style={{
              padding: "8px 12px", borderRadius: 8, marginBottom: 10,
              background: msg.type === "ok" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)",
              border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
              color: msg.type === "ok" ? "var(--success)" : "var(--danger)",
              fontSize: 12, display: "flex", gap: 6, alignItems: "center",
            }}>
              {msg.type === "ok" ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
              {msg.text}
            </div>
          )}

          {/* Estrellas */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 2, lineHeight: 1,
                }}
              >
                <FiStar
                  size={26}
                  style={{
                    color: estrellaColor(i),
                    fill: estrellaColor(i),
                    transition: "color 0.1s, fill 0.1s",
                  }}
                />
              </button>
            ))}
            {(hover || rating) > 0 && (
              <span style={{ fontSize: 12, color: "var(--text-secondary)", alignSelf: "center", marginLeft: 4 }}>
                {["", "Muy malo", "Regular", "Bueno", "Muy bueno", "Excelente"][hover || rating]}
              </span>
            )}
          </div>

          {/* Comentario */}
          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            placeholder="Comentario opcional (máx. 500 caracteres)..."
            maxLength={500}
            rows={3}
            style={{
              width: "100%", resize: "vertical", fontFamily: "inherit",
              background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "8px 12px", fontSize: 12,
              color: "var(--text-primary)", outline: "none",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            {guardado && (
              <button
                onClick={() => { setOpen(false); setMsg(null); }}
                style={{ ...btn("#6b7280", true), padding: "6px 14px", fontSize: 12 }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={guardar}
              disabled={saving || !rating}
              style={{
                ...btn(saving || !rating ? "#374151" : "var(--warning)"),
                padding: "6px 16px", fontSize: 12,
                opacity: saving || !rating ? 0.6 : 1,
                cursor: saving || !rating ? "not-allowed" : "pointer",
              }}
            >
              <FiStar size={12} />
              {saving ? "Guardando…" : guardado ? "Actualizar calificación" : "Guardar calificación"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabEntrenador() {
  const [trainers,    setTrainers]    = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [chatOpen,    setChatOpen]    = useState(null); // id_entrenador_pg del chat abierto
  const [vista,       setVista]       = useState("solicitudes"); // solicitudes | nuevo

  // Solicitud nueva
  const [selTrainer,  setSelTrainer]  = useState(null);
  const [notas,       setNotas]       = useState("");
  const [tipoSesion,  setTipoSesion]  = useState("individual");
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState(null); // {type, text}

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.allSettled([
        API("GET", "/trainers"),
        API("GET", "/pt-request"),
      ]);
      if (t.status === "fulfilled") setTrainers(t.value.trainers || []);
      if (s.status === "fulfilled") setSolicitudes(s.value.solicitudes || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const solicitudActiva = solicitudes.find(s => ["pendiente", "aceptada"].includes(s.estado));

  const enviarSolicitud = async () => {
    if (!selTrainer) { setMsg({ type: "err", text: "Selecciona un entrenador" }); return; }
    setSaving(true); setMsg(null);
    try {
      await API("POST", "/pt-request", {
        id_entrenador_pg: selTrainer.id,
        notas,
        tipo_sesion: tipoSesion,
      });
      setMsg({ type: "ok", text: "¡Solicitud enviada! El entrenador la revisará pronto." });
      setNotas(""); setSelTrainer(null);
      setVista("solicitudes");
      cargar();
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally { setSaving(false); }
  };

  const cancelar = async (id) => {
    if (!window.confirm("¿Cancelar esta solicitud?")) return;
    try {
      await API("DELETE", `/pt-request/${id}`);
      cargar();
    } catch (e) {
      alert(e.message);
    }
  };

  const ESTADO_COLOR = {
    pendiente: "var(--warning)", aceptada: "var(--success)", rechazada: "var(--danger)",
  };
  const ESTADO_LABEL = {
    pendiente: "Pendiente", aceptada: "Aceptada ✓", rechazada: "Rechazada",
  };

  if (chatOpen !== null) {
    return <ChatView trainerId={chatOpen} onBack={() => setChatOpen(null)} trainers={trainers} />;
  }

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Tabs internos */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { key: "solicitudes", label: "Mis Solicitudes" },
          { key: "nuevo",       label: "Solicitar Entrenador" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setVista(key); setMsg(null); }}
            style={{
              padding: "7px 16px", borderRadius: 8, cursor: "pointer",
              border: vista === key ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
              background: vista === key ? "var(--accent)" : "transparent",
              color: vista === key ? "#fff" : "var(--text-secondary)",
              fontSize: 13, fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── SOLICITUDES ── */}
      {vista === "solicitudes" && (
        loading ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ) : solicitudes.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "48px 0",
            border: "1px dashed var(--border, rgba(255,255,255,.1))", borderRadius: 12,
            color: "var(--text-secondary)",
          }}>
            <FiUser size={38} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>Aún no tienes solicitudes de entrenamiento personal</p>
            <button onClick={() => setVista("nuevo")} style={{ ...btn(), marginTop: 12 }}>
              <FiPlus size={14} /> Solicitar entrenador
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {solicitudes.map(s => (
              <div key={s.id} style={{ ...card({ padding: "16px 20px" }) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                      {s.nombre_entrenador}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      Solicitado el {fmtFecha(s.fecha_solicitud)} · {s.tipo_sesion}
                    </div>
                    {s.notas_miembro && (
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>
                        "{s.notas_miembro}"
                      </div>
                    )}
                    {s.notas_entrenador && (
                      <div style={{
                        marginTop: 8, padding: "7px 12px", borderRadius: 8,
                        background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)",
                        fontSize: 12, color: "var(--success)",
                      }}>
                        Respuesta: {s.notas_entrenador}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                      background: `${ESTADO_COLOR[s.estado]}18`,
                      color: ESTADO_COLOR[s.estado],
                    }}>
                      {ESTADO_LABEL[s.estado]}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {s.estado === "aceptada" && (
                        <button
                          onClick={() => setChatOpen(s.id_entrenador_pg)}
                          style={{ ...btn("var(--success)", true), padding: "5px 10px", fontSize: 11 }}
                        >
                          <FiMessageSquare size={11} /> Chat
                        </button>
                      )}
                      {s.estado === "pendiente" && (
                        <button
                          onClick={() => cancelar(s.id)}
                          style={{ ...btn("var(--danger)", true), padding: "5px 10px", fontSize: 11 }}
                        >
                          <FiX size={11} /> Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calificación — solo para solicitudes aceptadas */}
                {s.estado === "aceptada" && (
                  <RatingWidget
                    trainerId={s.id_entrenador_pg}
                    trainerName={s.nombre_entrenador}
                  />
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── NUEVA SOLICITUD ── */}
      {vista === "nuevo" && (
        <div>
          {solicitudActiva && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.3)",
              display: "flex", gap: 10, alignItems: "center",
              fontSize: 13, color: "var(--warning)",
            }}>
              <FiAlertCircle size={15} />
              Ya tienes una solicitud activa con {solicitudActiva.nombre_entrenador}. Cancélala antes de enviar una nueva.
            </div>
          )}

          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 14,
              background: msg.type === "ok" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)",
              border: `1px solid ${msg.type === "ok" ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
              color: msg.type === "ok" ? "var(--success)" : "var(--danger)",
              display: "flex", gap: 8, alignItems: "center", fontSize: 13,
            }}>
              {msg.type === "ok" ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          {/* Selección de entrenador */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
              Elige un entrenador
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {loading
                ? [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)
                : trainers.length === 0
                  ? <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No hay entrenadores disponibles</p>
                  : trainers.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelTrainer(t)}
                      style={{
                        ...card({
                          padding: "14px",
                          cursor: "pointer",
                          outline: selTrainer?.id === t.id ? "2px solid var(--accent)" : "none",
                          background: selTrainer?.id === t.id ? "var(--accent-dim)" : "var(--bg-card)",
                          transition: "all .15s",
                        }),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: "50%",
                          background: "var(--accent-dim)", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <FiUser size={16} color="var(--accent-soft)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{t.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t.especialidad}</div>
                        </div>
                      </div>
                      {selTrainer?.id === t.id && (
                        <div style={{ marginTop: 8, textAlign: "right" }}>
                          <FiCheckCircle size={14} color="var(--accent)" />
                        </div>
                      )}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Tipo de sesión */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
              Tipo de sesión
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["individual", "grupal", "virtual"].map(t => (
                <button
                  key={t}
                  onClick={() => setTipoSesion(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                    border: tipoSesion === t ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
                    background: tipoSesion === t ? "var(--accent)" : "transparent",
                    color: tipoSesion === t ? "#fff" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
              Tu objetivo / notas para el entrenador
            </div>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Quiero ganar masa muscular, tengo problemas de rodilla..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", borderRadius: 8,
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)", fontSize: 13,
                resize: "none", outline: "none",
              }}
            />
          </div>

          <button
            onClick={enviarSolicitud}
            disabled={saving || !selTrainer || !!solicitudActiva}
            style={{
              ...btn(saving || !selTrainer || !!solicitudActiva ? "#374151" : "var(--accent)"),
              width: "100%", justifyContent: "center", padding: "11px 0",
              opacity: saving || !selTrainer || !!solicitudActiva ? 0.6 : 1,
              cursor: saving || !selTrainer || !!solicitudActiva ? "not-allowed" : "pointer",
            }}
          >
            <FiZap size={14} />
            {saving ? "Enviando..." : "Enviar solicitud"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Chat View ────────────────────────────────────────────────── */
function ChatView({ trainerId, onBack, trainers }) {
  const [mensajes,  setMensajes]  = useState([]);
  const [texto,     setTexto]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  const trainer = trainers.find(t => t.id === trainerId);

  const cargar = useCallback(async () => {
    try {
      const d = await API("GET", `/chat/${trainerId}`);
      setMensajes(d.mensajes || []);
    } catch { /* silente */ }
    finally { setLoading(false); }
  }, [trainerId]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000); // polling ligero
    return () => clearInterval(interval);
  }, [cargar]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await API("POST", `/chat/${trainerId}`, { texto: t });
      setTexto("");
      cargar();
    } catch { /* silente */ }
    finally { setSending(false); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  const fmtHora = (iso) => {
    try { return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", padding: "0 24px 16px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 0",
        borderBottom: "1px solid var(--border)", marginBottom: 12,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: 4 }}>
          ← Volver
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(16,185,129,.15)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FiUser size={16} color="var(--success)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            {trainer?.nombre || "Entrenador"}
          </div>
          <div style={{ fontSize: 11, color: "var(--success)" }}>Entrenador Personal</div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: 13 }}>
            Cargando mensajes...
          </div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
            <FiMessageSquare size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
            <p style={{ fontSize: 13 }}>Inicia la conversación con tu entrenador</p>
          </div>
        ) : (
          mensajes.map(m => {
            const esMio = m.remitente === "miembro";
            return (
              <div key={m.id} style={{
                display: "flex",
                justifyContent: esMio ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "72%", padding: "9px 14px", borderRadius: esMio ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                  background: esMio ? "var(--accent)" : "var(--bg-card)",
                  border: esMio ? "none" : "1px solid var(--border)",
                  fontSize: 13, color: esMio ? "#fff" : "var(--text-primary)",
                  lineHeight: 1.5,
                }}>
                  <div>{m.texto}</div>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.65, textAlign: "right" }}>
                    {fmtHora(m.fecha)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 8, paddingTop: 10,
        borderTop: "1px solid var(--border)",
      }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={onKey}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 10,
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)", fontSize: 13,
            resize: "none", outline: "none",
          }}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || sending}
          style={{
            ...btn(texto.trim() && !sending ? "var(--accent)" : "#374151"),
            padding: "0 16px",
            opacity: texto.trim() && !sending ? 1 : 0.5,
          }}
        >
          <FiSend size={15} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 3 — ALERTAS DE ENTRENAMIENTO
══════════════════════════════════════════════════════════════ */
function TabAlertas() {
  const [alertas,   setAlertas]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editAlerta, setEditAlerta] = useState(null);

  // Form state
  const [titulo,   setTitulo]   = useState("Entrenamiento");
  const [hora,     setHora]     = useState("07:00");
  const [dias,     setDias]     = useState([]);
  const [tipo,     setTipo]     = useState("rutina");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await API("GET", "/alerts");
      setAlertas(d.alertas || []);
    } catch { /* silente */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Browser notification permission
  const [notifPerm, setNotifPerm] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const pedirPermiso = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setNotifPerm(p);
  };

  const abrirForm = (alerta = null) => {
    if (alerta) {
      setTitulo(alerta.titulo);
      setHora(alerta.hora);
      setDias(alerta.dias || []);
      setTipo(alerta.tipo || "rutina");
      setEditAlerta(alerta);
    } else {
      setTitulo("Entrenamiento"); setHora("07:00"); setDias([]); setTipo("rutina");
      setEditAlerta(null);
    }
    setErr("");
    setFormOpen(true);
  };

  const cerrarForm = () => { setFormOpen(false); setEditAlerta(null); setErr(""); };

  const guardar = async () => {
    if (!dias.length) { setErr("Selecciona al menos un día"); return; }
    setSaving(true); setErr("");
    try {
      if (editAlerta) {
        await API("PUT", `/alerts/${editAlerta.id}`, { titulo, hora, dias, tipo, activa: editAlerta.activa });
      } else {
        await API("POST", "/alerts", { titulo, hora, dias, tipo });
      }
      cerrarForm();
      cargar();
    } catch (e) {
      setErr(e.message);
    } finally { setSaving(false); }
  };

  const toggleActiva = async (alerta) => {
    try {
      await API("PUT", `/alerts/${alerta.id}`, { activa: !alerta.activa });
      cargar();
    } catch { /* silente */ }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta alerta?")) return;
    try {
      await API("DELETE", `/alerts/${id}`);
      cargar();
    } catch { /* silente */ }
  };

  const toggleDia = (d) => setDias(prev =>
    prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
  );

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* Banner de notificaciones */}
      {notifPerm !== "granted" && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: "rgba(234,179,8,.07)", border: "1px solid rgba(234,179,8,.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 13, color: "var(--warning)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiBell size={14} />
            Activa las notificaciones del navegador para recibir recordatorios
          </span>
          <button onClick={pedirPermiso} style={{ ...btn("var(--warning)"), fontSize: 11, padding: "5px 10px" }}>
            Activar
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {alertas.length} alerta{alertas.length !== 1 ? "s" : ""} configurada{alertas.length !== 1 ? "s" : ""}
        </div>
        <button onClick={() => abrirForm()} style={{ ...btn(), fontSize: 12 }}>
          <FiPlus size={13} /> Nueva alerta
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
      ) : alertas.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 0",
          border: "1px dashed var(--border, rgba(255,255,255,.1))", borderRadius: 12,
          color: "var(--text-secondary)",
        }}>
          <FiBell size={36} style={{ opacity: 0.2, marginBottom: 10 }} />
          <p style={{ fontSize: 13 }}>Sin alertas configuradas</p>
          <button onClick={() => abrirForm()} style={{ ...btn(), marginTop: 12, fontSize: 12 }}>
            <FiPlus size={12} /> Crear primera alerta
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alertas.map(a => (
            <div key={a.id} style={{
              ...card({ padding: "14px 18px" }),
              opacity: a.activa ? 1 : 0.55,
              borderLeft: `3px solid ${a.activa ? "var(--accent)" : "rgba(255,255,255,.1)"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                    {a.titulo}
                    <span style={{
                      marginLeft: 8, fontSize: 10, padding: "2px 7px", borderRadius: 99,
                      background: "var(--accent-dim)", color: "var(--accent-soft)", fontWeight: 600,
                    }}>
                      {a.tipo === "sesion_pt" ? "Sesión PT" : "Rutina"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <FiClock size={11} color="var(--text-secondary)" />
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{a.hora}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>·</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {DIAS.map(d => (
                        <span key={d} style={{
                          width: 22, height: 22, borderRadius: "50%", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700,
                          background: a.dias?.includes(d) ? "var(--accent)" : "rgba(255,255,255,.05)",
                          color: a.dias?.includes(d) ? "#fff" : "var(--text-secondary)",
                        }}>
                          {DIAS_LABEL[d]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => toggleActiva(a)} style={{ background: "none", border: "none", cursor: "pointer", color: a.activa ? "var(--accent)" : "var(--text-secondary)", padding: 4 }}>
                    {a.activa ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                  </button>
                  <button onClick={() => abrirForm(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: 4 }}>
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => eliminar(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 4 }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de form */}
      <AnimatePresence>
        {formOpen && (
          <>
            <motion.div
              onClick={cerrarForm}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                zIndex: 9991, width: "min(420px, 92vw)",
                background: "var(--bg-card)",
                border: "1px solid var(--border, rgba(255,255,255,.1))",
                borderRadius: 14, padding: "22px 24px",
                boxShadow: "0 24px 60px rgba(0,0,0,.5)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                  {editAlerta ? "Editar alerta" : "Nueva alerta"}
                </span>
                <button onClick={cerrarForm} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <FiX size={18} />
                </button>
              </div>

              {/* Título */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                  Nombre
                </label>
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: 13, outline: "none",
                  }}
                />
              </div>

              {/* Hora */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>
                  Hora
                </label>
                <input
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: 13, outline: "none",
                  }}
                />
              </div>

              {/* Días */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                  Días
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {DIAS.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDia(d)}
                      style={{
                        width: 34, height: 34, borderRadius: "50%", border: "none",
                        cursor: "pointer", fontSize: 11, fontWeight: 700,
                        background: dias.includes(d) ? "var(--accent)" : "rgba(255,255,255,.06)",
                        color: dias.includes(d) ? "#fff" : "var(--text-secondary)",
                        transition: "all .15s",
                      }}
                    >
                      {DIAS_LABEL[d]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                  Tipo
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ k: "rutina", l: "Rutina propia" }, { k: "sesion_pt", l: "Sesión PT" }].map(({ k, l }) => (
                    <button
                      key={k}
                      onClick={() => setTipo(k)}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
                        border: tipo === k ? "none" : "1px solid var(--border, rgba(255,255,255,.1))",
                        background: tipo === k ? "var(--accent)" : "transparent",
                        color: tipo === k ? "#fff" : "var(--text-secondary)",
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {err && (
                <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 12, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "var(--danger)", fontSize: 12 }}>
                  {err}
                </div>
              )}

              <button
                onClick={guardar}
                disabled={saving}
                style={{ ...btn(saving ? "#374151" : "var(--accent)"), width: "100%", justifyContent: "center", padding: "11px 0" }}
              >
                <FiCheck size={14} /> {saving ? "Guardando..." : editAlerta ? "Actualizar" : "Crear alerta"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function UserTraining() {
  const [tab, setTab] = useState("rutinas");

  const TABS = [
    { key: "rutinas",    label: "Rutinas",         icon: <GiMuscleUp size={14} /> },
    { key: "entrenador", label: "Entrenador",       icon: <FiUser size={13} />    },
    { key: "alertas",    label: "Alertas",          icon: <FiBell size={13} />    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-input)", overflow: "hidden" }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 24px", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GiMuscleUp size={20} color="var(--accent)" />
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Entrenamiento</h1>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)" }}>
              {tab === "rutinas"    && "Tus rutinas propias y las asignadas por tu entrenador"}
              {tab === "entrenador" && "Entrenamiento personal y chat con tu entrenador"}
              {tab === "alertas"   && "Recordatorios y alertas de entrenamiento"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", borderRadius: 10, padding: 4 }}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: tab === key ? "var(--accent)" : "transparent",
                color: tab === key ? "#fff" : "var(--text-secondary)",
                transition: "all .15s",
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "rutinas"    && <TabRutinas />}
            {tab === "entrenador" && <TabEntrenador />}
            {tab === "alertas"   && <TabAlertas />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
