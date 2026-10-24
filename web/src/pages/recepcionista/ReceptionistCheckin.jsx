/**
 * ReceptionistCheckin.jsx
 * Check-in de miembros:
 *   - QR GENERAL del gimnasio: el recepcionista lo muestra en pantalla (se
 *     renueva solo cada ~50s) y el MIEMBRO lo escanea con su propia app
 *     móvil para registrar su propia entrada. Reemplaza el QR por-persona
 *     anterior (uno fijo por miembro, escaneado por la cámara de
 *     recepción): ese esquema podía fotografiarse y compartirse para
 *     "entrar" sin pisar el gimnasio. Este expira en segundos, así que una
 *     foto deja de servir casi de inmediato.
 *   - Búsqueda + botón manual: se mantiene como respaldo para cuando el
 *     miembro no trae su celular o no tiene la app.
 * Máx 3 check-ins por día por miembro (validado en backend).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiUserCheck, FiSearch, FiX, FiRefreshCw,
  FiCheckCircle, FiAlertCircle, FiClock,
} from "react-icons/fi";
import { MdQrCode2 } from "react-icons/md";
import "../../css/CSSUnificado.css";

const API = "/api/recepcionista";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

const MEM_COLOR = {
  activa:        { color: "var(--success-color)", label: "Activa" },
  por_vencer:    { color: "var(--warning-color)", label: "Por vencer" },
  vencida:       { color: "var(--error-color)",   label: "Vencida" },
  sin_membresia: { color: "var(--text-secondary)", label: "Sin membresía" },
};

// ─── QR image via free API (no dep) ──────────────────────────────────────────
const qrUrl = (data) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=1a1a2e&margin=10`;

// Se pide un token nuevo un poco antes de que venza el anterior (el backend
// hoy lo emite con 60s de vigencia) para que nunca se muestre un QR vencido.
const QR_REFRESCO_MS = 50_000;

export default function ReceptionistCheckin() {
  // ── State ────────────────────────────────────────────────────────────────
  const [members,    setMembers]    = useState([]);
  const [search,     setSearch]     = useState("");
  const [filtered,   setFiltered]   = useState([]);
  const [checkins,   setCheckins]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);   // id_usuario_pg en proceso
  const [toast,      setToast]      = useState(null);   // { msg, type }

  // QR general del gimnasio
  const [qrAbierto,  setQrAbierto]  = useState(false);
  const [qrToken,    setQrToken]    = useState(null);
  const [qrError,    setQrError]    = useState(null);
  const qrIntervalRef = useRef(null);

  // ── Fetch lista miembros + checkins de hoy ────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        axios.get(`${API}/members`,  { headers: headers() }),
        axios.get(`${API}/checkins`, { headers: headers() }),
      ]);
      setMembers(mRes.data.miembros || []);
      setCheckins(cRes.data.checkins || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtro de búsqueda (nombre, correo o ID) ─────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q
      ? members.filter(m =>
          (m.nombre || "").toLowerCase().includes(q) ||
          (m.email  || "").toLowerCase().includes(q) ||
          String(m.id_usuario_pg ?? "").includes(q)
        )
      : members
    );
  }, [search, members]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Registrar check-in manual ─────────────────────────────────────────────
  const doCheckin = async (id_usuario_pg, nombre) => {
    setSaving(id_usuario_pg);
    try {
      await axios.post(`${API}/checkins`, { id_usuario_pg }, { headers: headers() });
      showToast(`Check-in registrado para ${nombre}`);
      fetchAll();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar check-in";
      showToast(msg, "error");
    } finally {
      setSaving(null);
    }
  };

  // ── QR general: pedir token y refrescarlo mientras el panel está abierto ──
  const pedirQrToken = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/checkin-qr/token`, { headers: headers() });
      setQrToken(data.token);
      setQrError(null);
    } catch (e) {
      setQrError("No se pudo generar el QR. Intenta de nuevo.");
    }
  }, []);

  const abrirQr = async () => {
    setQrAbierto(true);
    await pedirQrToken();
    qrIntervalRef.current = setInterval(pedirQrToken, QR_REFRESCO_MS);
  };

  const cerrarQr = () => {
    setQrAbierto(false);
    setQrToken(null);
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  };

  useEffect(() => () => {
    if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
  }, []);

  // Si hay nuevos check-ins mientras el QR está abierto (miembros
  // escaneando con su propia app), refresca la lista de "Entradas de hoy"
  // al mismo ritmo que el token, sin que el recepcionista tenga que hacer
  // nada.
  useEffect(() => {
    if (!qrAbierto) return;
    const id = setInterval(fetchAll, QR_REFRESCO_MS);
    return () => clearInterval(id);
  }, [qrAbierto, fetchAll]);

  // ── Cuántos check-ins tiene un miembro hoy ────────────────────────────────
  const checkinsTodayCount = (nombre) =>
    checkins.filter(c => c.nombre === nombre).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-content">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 24, right: 24, zIndex: 9999,
              padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14,
              background: toast.type === "error" ? "var(--error-color)" : "var(--success-color)",
              color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
            {toast.type === "error" ? <FiAlertCircle /> : <FiCheckCircle />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal QR general del gimnasio */}
      <AnimatePresence>
        {qrAbierto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9000,
              background: "rgba(0,0,0,0.7)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
            onClick={cerrarQr}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: "relative",
                background: "var(--bg-card-dark)", borderRadius: 16,
                padding: 32, textAlign: "center", maxWidth: 320,
                border: "1px solid var(--border-dark)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}>
              <button
                onClick={cerrarQr}
                style={{
                  position: "absolute", top: 12, right: 12,
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-secondary)",
                }}>
                <FiX size={20} />
              </button>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "var(--accent)", color: "var(--bg-input)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <MdQrCode2 size={22} />
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 17 }}>
                Código de entrada del gimnasio
              </p>
              <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: 13 }}>
                El código cambia solo cada minuto, por seguridad
              </p>
              <div style={{
                background: "#fff", padding: 12, borderRadius: 12,
                marginBottom: 16, minHeight: 220,
                minWidth: 220, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {qrError ? (
                  <div style={{ color: "var(--error-color)", padding: 12, maxWidth: 190 }}>
                    <FiAlertCircle size={22} style={{ marginBottom: 6 }} />
                    <p style={{ margin: 0, fontSize: 12 }}>{qrError}</p>
                  </div>
                ) : qrToken ? (
                  <img
                    src={qrUrl(qrToken)}
                    alt="QR de entrada del gimnasio"
                    width={220} height={220}
                    style={{ display: "block" }}
                  />
                ) : (
                  <p style={{ color: "#333", margin: 0, fontSize: 12 }}>Generando...</p>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                El miembro lo escanea desde la app con "Registrar entrada"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>
            <FiUserCheck style={{ marginRight: 10 }} />Check-ins
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
            Registra la entrada de miembros — máximo 3 por día
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-outline-small"
            onClick={abrirQr}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              color: "var(--accent-soft)", borderColor: "var(--accent)",
            }}>
            <MdQrCode2 size={15} /> Mostrar QR del gimnasio
          </button>
          <button className="btn-outline-small" onClick={fetchAll}>
            <FiRefreshCw size={13} />
          </button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Panel izquierdo: búsqueda + tabla miembros */}
        <div>
          {/* Buscador */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <FiSearch style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-secondary)", pointerEvents: "none",
            }} />
            <input
              type="text"
              placeholder="Buscar miembro por nombre, correo o ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px 10px 40px",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text-primary)", fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div className="chart-card" style={{ padding: 0 }}>
            {loading ? (
              <p style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>Cargando...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
                No se encontraron miembros.
              </p>
            ) : (
              <div style={{ maxHeight: 520, overflowY: "auto" }}>
                {filtered.map((m, i) => {
                  const count = checkinsTodayCount(m.nombre);
                  const maxed = count >= 3;
                  const mem   = MEM_COLOR[m.mem_status] || MEM_COLOR.sin_membresia;
                  return (
                    <motion.div
                      key={m.id || i}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--border-dark)",
                        display: "flex", alignItems: "center", gap: 14,
                        opacity: maxed ? 0.5 : 1,
                      }}>
                      {/* Avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "var(--accent)", color: "var(--bg-input)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 16, flexShrink: 0,
                      }}>
                        {(m.nombre || "?")[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{m.nombre}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: mem.color, background: `${mem.color}18`,
                            padding: "2px 8px", borderRadius: 99,
                          }}>
                            {mem.label}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            ID: {m.id_usuario_pg ?? "—"}
                          </span>
                          {count > 0 && (
                            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                              <FiClock size={10} style={{ marginRight: 3 }} />
                              {count}/3 hoy
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <motion.button
                          onClick={() => !maxed && doCheckin(m.id_usuario_pg, m.nombre)}
                          disabled={saving === m.id_usuario_pg || maxed}
                          style={{
                            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: maxed ? "transparent" : "var(--accent)",
                            color: maxed ? "var(--text-secondary)" : "var(--bg-input)",
                            border: maxed ? "1px solid var(--border-dark)" : "none",
                            cursor: maxed ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 5,
                          }}
                          whileHover={!maxed ? { scale: 1.04 } : {}}>
                          {saving === m.id_usuario_pg
                            ? "..."
                            : maxed
                            ? "Límite alcanzado"
                            : <><FiUserCheck size={13} /> Registrar entrada</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: check-ins de hoy */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>
              <FiClock style={{ marginRight: 6 }} />Entradas de Hoy
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {checkins.length} total
            </span>
          </div>

          {checkins.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
              <FiUserCheck size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>Sin entradas aún</p>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {checkins.map((c, i) => (
                <div key={c.id || i} style={{
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-dark)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "var(--accent-dim)", color: "var(--accent-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>
                    {(c.nombre || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      {c.nombre}
                      {c.id_usuario_pg != null && (
                        <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>
                          {" "}· ID: {c.id_usuario_pg}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                      {c.hora_entrada}
                      {c.hora_salida ? ` — ${c.hora_salida}` : ""}
                    </div>
                  </div>
                  <FiCheckCircle size={14} style={{ color: "var(--success-color)", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
