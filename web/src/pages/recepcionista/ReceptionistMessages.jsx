/**
 * ReceptionistMessages.jsx — Bitácora de turno
 * Feed operacional en tiempo real: check-ins, citas, membresías, pagos.
 * Reemplaza el buzón de notificaciones (poco útil para quien inicia acciones).
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiUserCheck, FiCalendar, FiDollarSign, FiAlertCircle,
  FiRefreshCw, FiClock, FiUsers, FiActivity,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API   = "/api/recepcionista";
const hdrs  = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const today = () => new Date().toISOString().slice(0, 10);

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtHora(iso) {
  if (!iso) return "";
  if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
  try { return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function diasRestantes(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / 86400000);
}

/* ── Tarjeta de evento ─────────────────────────────────────────────────────── */
function EventCard({ icon, color, bg, title, sub, tag, tagColor, tagBg, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay }} className="chart-card"
      style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>}
      </div>
      {tag && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px",
          borderRadius: 99, background: tagBg, color: tagColor, flexShrink: 0 }}>
          {tag}
        </span>
      )}
    </motion.div>
  );
}

/* ── Sección colapsable ────────────────────────────────────────────────────── */
function Section({ icon, title, count, color, children, loading }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color, display: "flex" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          {title}
        </h3>
        {count !== undefined && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700,
            background: count > 0 ? color : "var(--bg-input)",
            color: count > 0 ? "#fff" : "var(--text-secondary)",
            padding: "2px 8px", borderRadius: 99 }}>
            {count}
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ padding: "12px 0", color: "var(--text-secondary)", fontSize: 12 }}>
          Cargando...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function ReceptionistMessages() {
  const [checkins,    setCheckins]    = useState([]);
  const [citas,       setCitas]       = useState([]);
  const [expirando,   setExpirando]   = useState([]);
  const [pagos,       setPagos]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const h = hdrs();
    const d = today();
    try {
      const [rCheckins, rCitas, rPagos] = await Promise.allSettled([
        axios.get(`${API}/checkins`, { headers: h, params: { fecha: d, limit: 30 } }),
        axios.get(`${API}/citas`,    { headers: h, params: { date: d, limit: 20 } }),
        axios.get(`${API}/payments`, { headers: h, params: { page: 1, limit: 10 } }),
      ]);

      if (rCheckins.status === "fulfilled")
        setCheckins(rCheckins.value.data.checkins || []);

      if (rCitas.status === "fulfilled")
        setCitas(rCitas.value.data.citas || []);

      if (rPagos.status === "fulfilled") {
        const pagosArr = rPagos.value.data.pagos || [];
        setPagos(pagosArr.slice(0, 8));
      }

      // Membresías por vencer — derivar de la lista de miembros
      try {
        const rMem = await axios.get(`${API}/members`, { headers: h });
        const miembros = rMem.data.miembros || [];
        const porVencer = miembros
          .filter(m => m.mem_status === "por_vencer" || m.mem_status === "vencida")
          .slice(0, 10);
        setExpirando(porVencer);
      } catch { /* silencioso */ }

    } catch { /* silencioso */ }
    finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh cada 3 minutos
  useEffect(() => {
    const t = setInterval(fetchAll, 3 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const citasPendientes = citas.filter(c => c.status !== "confirmada");

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Bitácora de turno
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Actividad del día en tiempo real
            {lastUpdate && (
              <span style={{ marginLeft: 8, opacity: .6, fontSize: 11 }}>
                — actualizado {lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <motion.button onClick={fetchAll} disabled={loading}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            background: "transparent", border: "1px solid var(--border-dark)",
            color: "var(--text-secondary)", borderRadius: "var(--r-md)",
            cursor: "pointer", fontSize: 13 }}>
          <FiRefreshCw size={14}/> Actualizar
        </motion.button>
      </motion.div>

      {/* KPIs rápidos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 10, marginBottom: 28 }}>
        {[
          { label: "Check-ins hoy",       value: checkins.length,      icon: <FiUserCheck size={16}/>,  color: "#22c55e" },
          { label: "Citas hoy",           value: citas.length,         icon: <FiCalendar size={16}/>,   color: "var(--accent-soft)" },
          { label: "Pendientes",          value: citasPendientes.length, icon: <FiClock size={16}/>,    color: "#fbbf24" },
          { label: "Por vencer",          value: expirando.length,     icon: <FiAlertCircle size={16}/>,color: "#ef4444" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} className="chart-card"
            style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ color: k.color, display: "flex", justifyContent: "center", marginBottom: 6 }}>
              {k.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Grid dos columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Check-ins de hoy ─────────────────────────────────────────────── */}
        <Section icon={<FiUserCheck size={16}/>} title="Check-ins de hoy"
          count={checkins.length} color="#22c55e" loading={loading}>
          <AnimatePresence>
            {checkins.length === 0 && !loading ? (
              <div style={{ padding: "20px 0", textAlign: "center",
                color: "var(--text-secondary)", fontSize: 12 }}>
                <FiUsers size={24} style={{ opacity: .3, marginBottom: 6 }}/><br/>
                Sin check-ins registrados hoy
              </div>
            ) : checkins.map((c, i) => (
              <EventCard key={c.id || i} delay={i * 0.03}
                icon={<FiUserCheck size={14}/>}
                color="#22c55e" bg="rgba(34,197,94,0.12)"
                title={c.nombre || "Miembro"}
                sub={c.hora_entrada ? `Entrada: ${fmtHora(c.hora_entrada)}${c.hora_salida ? ` · Salida: ${fmtHora(c.hora_salida)}` : " · En gimnasio"}` : ""}
                tag={c.membership_status === "Vencida" ? "Vencida" : c.hora_salida ? "Completado" : "Activo"}
                tagColor={c.membership_status === "Vencida" ? "#ef4444" : c.hora_salida ? "var(--text-secondary)" : "#22c55e"}
                tagBg={c.membership_status === "Vencida" ? "rgba(239,68,68,0.12)" : c.hora_salida ? "var(--bg-input)" : "rgba(34,197,94,0.12)"}
              />
            ))}
          </AnimatePresence>
        </Section>

        {/* ── Citas de hoy ─────────────────────────────────────────────────── */}
        <Section icon={<FiCalendar size={16}/>} title="Citas de hoy"
          count={citas.length} color="var(--accent-soft)" loading={loading}>
          <AnimatePresence>
            {citas.length === 0 && !loading ? (
              <div style={{ padding: "20px 0", textAlign: "center",
                color: "var(--text-secondary)", fontSize: 12 }}>
                <FiCalendar size={24} style={{ opacity: .3, marginBottom: 6 }}/><br/>
                Sin citas agendadas hoy
              </div>
            ) : citas.map((c, i) => (
              <EventCard key={c._id || i} delay={i * 0.03}
                icon={<FiCalendar size={14}/>}
                color="var(--accent-soft)" bg="var(--accent-dim)"
                title={c.client || c.nombre || "Cliente"}
                sub={[c.time, c.type, c.trainer_name].filter(Boolean).join(" · ")}
                tag={c.status === "confirmada" ? "Confirmada" : c.status === "cancelada" ? "Cancelada" : "Pendiente"}
                tagColor={c.status === "confirmada" ? "#22c55e" : c.status === "cancelada" ? "#ef4444" : "#fbbf24"}
                tagBg={c.status === "confirmada" ? "rgba(34,197,94,0.12)" : c.status === "cancelada" ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)"}
              />
            ))}
          </AnimatePresence>
        </Section>

        {/* ── Membresías por vencer ─────────────────────────────────────────── */}
        <Section icon={<FiAlertCircle size={16}/>} title="Membresías por vencer / vencidas"
          count={expirando.length} color="#ef4444" loading={loading}>
          <AnimatePresence>
            {expirando.length === 0 && !loading ? (
              <div style={{ padding: "20px 0", textAlign: "center",
                color: "var(--text-secondary)", fontSize: 12 }}>
                Sin membresías criticas esta semana
              </div>
            ) : expirando.map((m, i) => {
              const dias = diasRestantes(m.fecha_fin);
              const vencida = m.mem_status === "vencida";
              return (
                <EventCard key={m.id || i} delay={i * 0.03}
                  icon={<FiAlertCircle size={14}/>}
                  color={vencida ? "#ef4444" : "#fbbf24"}
                  bg={vencida ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)"}
                  title={m.nombre}
                  sub={m.email}
                  tag={vencida ? "Vencida" : `Vence en ${dias}d`}
                  tagColor={vencida ? "#ef4444" : "#fbbf24"}
                  tagBg={vencida ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)"}
                />
              );
            })}
          </AnimatePresence>
        </Section>

        {/* ── Pagos recientes ───────────────────────────────────────────────── */}
        <Section icon={<FiDollarSign size={16}/>} title="Pagos recientes"
          count={pagos.length} color="#22c55e" loading={loading}>
          <AnimatePresence>
            {pagos.length === 0 && !loading ? (
              <div style={{ padding: "20px 0", textAlign: "center",
                color: "var(--text-secondary)", fontSize: 12 }}>
                Sin pagos registrados
              </div>
            ) : pagos.map((p, i) => {
              const estado = p.estado || "";
              const color = estado === "completado" ? "#22c55e" : estado === "fallido" ? "#ef4444" : "#fbbf24";
              const colorBg = estado === "completado" ? "rgba(34,197,94,0.12)" : estado === "fallido" ? "rgba(239,68,68,0.12)" : "rgba(251,191,36,0.12)";
              return (
                <EventCard key={p._id || i} delay={i * 0.03}
                  icon={<FiDollarSign size={14}/>}
                  color={color} bg={colorBg}
                  title={p.nombre_miembro || p.concepto || "Pago"}
                  sub={[p.concepto, p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-MX") : null].filter(Boolean).join(" · ")}
                  tag={`$${(p.monto || 0).toLocaleString("es-MX")}`}
                  tagColor={color} tagBg={colorBg}
                />
              );
            })}
          </AnimatePresence>
        </Section>
      </div>
    </div>
  );
}
