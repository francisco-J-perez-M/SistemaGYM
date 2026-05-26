/**
 * ReceptionistCheckin.jsx
 * Check-in manual (búsqueda + botón) y QR (generar código por miembro,
 * escanear con cámara usando BarcodeDetector API).
 * Máx 3 check-ins por día por miembro (validado en backend).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiUserCheck, FiSearch, FiCamera, FiX, FiRefreshCw,
  FiCheckCircle, FiAlertCircle, FiUser, FiClock,
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
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=1a1a2e&margin=10`;

export default function ReceptionistCheckin() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [members,    setMembers]    = useState([]);
  const [search,     setSearch]     = useState("");
  const [filtered,   setFiltered]   = useState([]);
  const [checkins,   setCheckins]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);   // id_usuario_pg en proceso
  const [toast,      setToast]      = useState(null);   // { msg, type }
  const [qrMember,   setQrMember]   = useState(null);   // miembro cuyo QR se muestra
  const [scanning,   setScanning]   = useState(false);  // cámara activa
  const [camError,   setCamError]   = useState(null);

  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const canvasRef  = useRef(document.createElement("canvas"));

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

  // ── Filtro de búsqueda ────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(q
      ? members.filter(m =>
          (m.nombre || "").toLowerCase().includes(q) ||
          (m.email  || "").toLowerCase().includes(q)
        )
      : members
    );
  }, [search, members]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Registrar check-in ────────────────────────────────────────────────────
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

  // ── QR Scanner (BarcodeDetector + fallback canvas loop) ───────────────────
  const startScanner = async () => {
    setCamError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Intentar BarcodeDetector (Chrome/Edge)
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (!videoRef.current || !scanning) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              handleQrResult(codes[0].rawValue);
              return;
            }
          } catch {}
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } else {
        // Fallback: usar canvas + jsQR desde CDN
        if (!window.jsQR) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const scan = () => {
          if (!videoRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width  = video.videoWidth  || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(imageData.data, canvas.width, canvas.height);
          if (code) { handleQrResult(code.data); return; }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      }
    } catch (e) {
      setCamError("No se pudo acceder a la cámara. Verifica los permisos.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setCamError(null);
  };

  useEffect(() => () => stopScanner(), []);

  const handleQrResult = (raw) => {
    stopScanner();
    // El QR contiene el id_usuario_pg del miembro
    const id = parseInt(raw, 10);
    if (!isNaN(id)) {
      const m = members.find(x => x.id_usuario_pg === id);
      if (m) {
        doCheckin(m.id_usuario_pg, m.nombre);
      } else {
        showToast("Miembro no reconocido en este gimnasio", "error");
      }
    } else {
      showToast("QR inválido", "error");
    }
  };

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

      {/* Modal QR */}
      <AnimatePresence>
        {qrMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9000,
              background: "rgba(0,0,0,0.7)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
            onClick={() => setQrMember(null)}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--bg-card-dark)", borderRadius: 16,
                padding: 32, textAlign: "center",
                border: "1px solid var(--border-dark)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}>
              <button
                onClick={() => setQrMember(null)}
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
                fontWeight: 700, fontSize: 18, margin: "0 auto 12px",
              }}>
                {qrMember.nombre?.[0] || "?"}
              </div>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 17 }}>
                {qrMember.nombre}
              </p>
              <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: 13 }}>
                ID: {qrMember.id_usuario_pg}
              </p>
              <div style={{
                background: "#fff", padding: 12, borderRadius: 12,
                display: "inline-block", marginBottom: 16,
              }}>
                <img
                  src={qrUrl(String(qrMember.id_usuario_pg))}
                  alt={`QR ${qrMember.nombre}`}
                  width={180} height={180}
                  style={{ display: "block" }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
                El miembro muestra este código en recepción
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
            onClick={scanning ? stopScanner : startScanner}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              color: scanning ? "var(--error-color)" : "var(--accent-soft)",
              borderColor: scanning ? "var(--error-color)" : "var(--accent)",
            }}>
            {scanning ? <><FiX size={14} /> Cerrar cámara</> : <><FiCamera size={14} /> Escanear QR</>}
          </button>
          <button className="btn-outline-small" onClick={fetchAll}>
            <FiRefreshCw size={13} />
          </button>
        </div>
      </motion.div>

      {/* Visor de cámara QR */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 20 }}>
            <div style={{
              background: "var(--bg-card-dark)", border: "1px solid var(--accent)",
              borderRadius: 12, padding: 16, textAlign: "center",
            }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)" }}>
                Apunta la cámara al código QR del miembro
              </p>
              {camError ? (
                <div style={{ color: "var(--error-color)", padding: 20 }}>
                  <FiAlertCircle size={24} style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0 }}>{camError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  style={{
                    width: "100%", maxWidth: 400, borderRadius: 10,
                    border: "2px solid var(--accent)",
                  }}
                  muted playsInline
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              placeholder="Buscar miembro por nombre o correo..."
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
                          onClick={() => setQrMember(m)}
                          style={{
                            padding: "7px 10px", borderRadius: 8,
                            background: "var(--bg-input-dark)",
                            border: "1px solid var(--border-dark)",
                            cursor: "pointer", color: "var(--text-secondary)",
                          }}
                          whileHover={{ scale: 1.05, color: "var(--accent-soft)" }}
                          title="Ver QR del miembro">
                          <MdQrCode2 size={18} />
                        </motion.button>
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
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.nombre}</div>
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
