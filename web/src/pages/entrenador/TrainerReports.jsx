/**
 * TrainerReports.jsx — Reportes y estadísticas del entrenador.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Header + filtro de período + botones Exportar CSV / PDF │
 *   ├────────────┬────────────┬────────────┬───────────────────┤
 *   │ Sesiones   │ Asistencia │ Clientes   │ Calificación      │  ← KPIs
 *   ├────────────────────────────┬─────────────────────────────┤
 *   │ Gráfica de sesiones / mes  │ Top clientes                │
 *   ├────────────────────────────┴─────────────────────────────┤
 *   │ Tipos de sesión (barras)   │ Métricas detalladas         │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Dependencias: recharts (ya instalado), jspdf (ya instalado)
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, Cell, CartesianGrid, Legend,
} from "recharts";
import {
  FiBarChart2, FiTrendingUp, FiUsers, FiCalendar,
  FiAward, FiDownload, FiRefreshCw, FiAlertCircle, FiX,
  FiCheckCircle, FiXCircle, FiTarget, FiStar, FiFileText,
  FiLoader, FiClock,
} from "react-icons/fi";
import axios from "axios";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Cabecera con el JWT para las llamadas directas por axios. */
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

/** Estilos del panel de configuración del reporte a la medida. */
const CFG = {
  label: {
    display: "block", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase",
    letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 8,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 18 },
  chip: (activo) => ({
    padding: "7px 14px", borderRadius: 18, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
    border: `1px solid ${activo ? "var(--accent)" : "var(--border)"}`,
    background: activo ? "var(--accent)" : "transparent",
    color: activo ? "#fff" : "var(--text-secondary)",
    transition: "all .15s",
  }),
};

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORS = {
  primary:   "var(--accent)",
  success:   "var(--success)",
  warning:   "var(--warning)",
  danger:    "var(--danger)",
  muted:     "var(--text-tertiary)",
  personal:  "var(--accent)",
  grupal:    "var(--success)",
  consulta:  "var(--warning)",
};

const TYPE_COLORS = {
  Personal: COLORS.personal,
  Grupal:   COLORS.grupal,
  Consulta: COLORS.warning,
};

const RANGE_LABELS = {
  week:    "esta semana",
  month:   "este mes",
  quarter: "este trimestre",
  year:    "este año",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// ─── PDF generator (jsPDF) ───────────────────────────────────────────────────
async function generatePDF(data, trainerName, range) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const W      = doc.internal.pageSize.getWidth();
  const margin = 48;
  let   y      = 48;

  const line = (text, size = 11, bold = false, color = [220,220,220]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, margin, y);
    y += size * 1.5;
  };

  const divider = (marginY = 8) => {
    y += marginY;
    doc.setDrawColor(50, 50, 80);
    doc.line(margin, y, W - margin, y);
    y += marginY;
  };

  const kpiRow = (items) => {
    const colW = (W - margin * 2) / items.length;
    items.forEach((item, i) => {
      const x = margin + i * colW;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(140, 140, 170);
      doc.text(item.label.toUpperCase(), x, y);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 180, 255);
      doc.text(String(item.value), x, y + 20);
    });
    y += 38;
  };

  // ── Fondo oscuro
  doc.setFillColor(10, 10, 28);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), "F");

  // ── Header
  doc.setFillColor(30, 30, 60);
  doc.roundedRect(margin - 12, 24, W - (margin - 12) * 2, 56, 8, 8, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 200, 255);
  doc.text("Reporte de Entrenador", margin, 54);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 180);
  doc.text(`${trainerName}  ·  Período: ${RANGE_LABELS[range] || range}  ·  Generado: ${new Date().toLocaleDateString("es-MX")}`, margin, 70);
  y = 108;

  // ── KPIs
  line("RESUMEN GENERAL", 10, true, [100, 100, 160]);
  divider(4);
  kpiRow([
    { label: "Sesiones completadas", value: data.stats?.sessions ?? 0 },
    { label: "Clientes activos",     value: data.stats?.clients  ?? 0 },
    { label: "Asistencia",           value: `${data.metrics?.attendanceRate ?? 0}%` },
    { label: "Calificación",         value: data.stats?.avgRating > 0 ? `${data.stats.avgRating}/5` : "N/A" },
  ]);
  divider(6);

  // ── Sesiones por tipo
  if (data.sessionTypes?.length) {
    line("TIPOS DE SESIÓN", 10, true, [100, 100, 160]);
    y += 4;
    data.sessionTypes.forEach(t => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 220);
      doc.text(`• ${t.tipo}`, margin + 8, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(160, 180, 255);
      doc.text(String(t.count), margin + 160, y);
      y += 16;
    });
    divider(6);
  }

  // ── Top clientes
  if (data.clientProgress?.length) {
    line("MIS MEJORES CLIENTES", 10, true, [100, 100, 160]);
    y += 4;
    data.clientProgress.forEach((c, i) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 220);
      doc.text(`${i + 1}. ${c.name}`, margin + 8, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(160, 200, 160);
      doc.text(`${c.sessions} sesiones`, margin + 260, y);
      y += 16;
    });
    divider(6);
  }

  // ── Evolución mensual
  if (data.monthlyData?.length) {
    line("EVOLUCIÓN MENSUAL (últimos 6 meses)", 10, true, [100, 100, 160]);
    y += 4;

    // Cabecera tabla
    ["Mes", "Completadas", "Canceladas", "Total"].forEach((h, i) => {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 160);
      doc.text(h, margin + 8 + i * 120, y);
    });
    y += 14;

    data.monthlyData.forEach(m => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(190, 190, 220);
      [m.month, m.sessions, m.cancelled, m.total].forEach((v, i) => {
        doc.text(String(v), margin + 8 + i * 120, y);
      });
      y += 15;
      if (y > 750) { doc.addPage(); doc.setFillColor(10,10,28); doc.rect(0,0,W,800,"F"); y = 48; }
    });
    divider(6);
  }

  // ── Métricas adicionales
  line("MÉTRICAS ADICIONALES", 10, true, [100, 100, 160]);
  y += 4;
  const met = data.metrics || {};
  [
    [`Tasa de asistencia:`,     `${met.attendanceRate ?? 0}%`],
    [`Cancelaciones:`,          `${met.cancellationRate ?? 0}%`],
    [`Sesiones por cliente:`,   `${met.sessionsPerClient ?? 0}`],
    [`Sesiones programadas:`,   `${met.totalScheduled ?? 0}`],
  ].forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 170, 210);
    doc.text(label, margin + 8, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(150, 200, 255);
    doc.text(value, margin + 200, y);
    y += 15;
  });

  // ── Pie de página
  y = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 110);
  doc.text("Generado por GYM PRO  ·  Este reporte es de uso interno del entrenador", margin, y);

  doc.save(`reporte_${range}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/** KPI card principal */
function KpiCard({ icon: Icon, label, value, sub, color, growth }) {
  const isPos = growth === undefined || growth >= 0;
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderTop: `3px solid ${color}`, padding: "16px 18px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        {growth !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: isPos ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
            color: isPos ? COLORS.success : COLORS.danger,
          }}>
            {isPos ? "+" : ""}{growth}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-secondary)", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{sub}</div>
    </motion.div>
  );
}

/** Tooltip personalizado para recharts */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/** Avatar circular con iniciales */
function Avatar({ name, size = 36, color = COLORS.primary }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}25`,
      border: `2px solid ${color}60`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, color,
      flexShrink: 0,
    }}>
      {initials(name) || "?"}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TrainerReports() {
  const [timeRange, setTimeRange] = useState("month");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [exporting, setExporting] = useState(false);
  const [trainerName, setTrainerName] = useState("Entrenador");

  // Cargar nombre del trainer para el PDF
  useEffect(() => {
    trainerService.getProfile().then(p => { if (p?.name) setTrainerName(p.name); }).catch(() => {});
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await trainerService.getReports(timeRange);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // ── Exportar CSV ─────────────────────────────────────────────────────────
  const handleCSV = () => {
    if (!data) return;
    const rows = [
      ["Mes", "Sesiones Completadas", "Canceladas", "Total"],
      ...(data.monthlyData || []).map(d => [d.month, d.sessions, d.cancelled, d.total]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: `reporte_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  };

  // ── Exportar PDF rápido ───────────────────────────────────────────────────
  // Toma lo que ya está en pantalla y lo maqueta en el navegador. Es inmediato
  // porque no vuelve a consultar nada.
  const handlePDF = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await generatePDF(data, trainerName, timeRange);
    } catch (e) {
      alert("Error al generar el PDF: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Reporte a la medida ───────────────────────────────────────────────────
  // Lo arma el backend con el periodo y las secciones que se elijan. Es el
  // mismo documento que descarga la app móvil: al generarlo en el servidor, un
  // reporte del navegador y otro del teléfono salen idénticos, cosa que no
  // ocurriría maquetándolo dos veces en cada cliente.
  const hoy = new Date();
  const [cfgAbierta, setCfgAbierta] = useState(false);
  const [opciones,   setOpciones]   = useState(null);
  const [anio,       setAnio]       = useState(hoy.getFullYear());
  const [mes,        setMes]        = useState(hoy.getMonth() + 1);  // 0 = año completo
  const [secciones,  setSecciones]  = useState(["resumen", "sesiones", "clientes", "tipos"]);
  const [generando,  setGenerando]  = useState(false);

  useEffect(() => {
    if (!cfgAbierta || opciones) return;
    axios
      .get("/api/trainer/reportes/opciones", { headers: authHeaders() })
      .then((r) => {
        setOpciones(r.data);
        // Si el año en curso no tiene sesiones, se abre en el más reciente.
        const anios = r.data?.anios;
        if (Array.isArray(anios) && anios.length && !anios.includes(hoy.getFullYear())) {
          setAnio(anios[0]);
        }
      })
      .catch(() => setOpciones({ anios: [hoy.getFullYear()], secciones: [] }));
  }, [cfgAbierta, opciones]); // eslint-disable-line

  const alternarSeccion = (id) =>
    setSecciones((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const descargarPersonalizado = async () => {
    if (secciones.length === 0) {
      alert("Elige al menos una sección: el reporte no puede ir vacío.");
      return;
    }
    setGenerando(true);
    try {
      // Va por axios y no por un enlace directo porque el endpoint exige el JWT,
      // que el navegador no adjuntaría al seguir un href.
      const { data: blob } = await axios.get("/api/trainer/reportes/pdf", {
        params: { anio, mes, secciones: secciones.join(",") },
        headers: authHeaders(),
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_entrenador_${anio}-${String(mes).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setCfgAbierta(false);
    } catch (e) {
      alert("No se pudo generar el reporte. Intenta de nuevo en un momento.");
    } finally {
      setGenerando(false);
    }
  };

  // ── Datos derivados ──────────────────────────────────────────────────────
  const stats          = data?.stats          || {};
  const growth         = stats.growth         || {};
  const monthlyData    = data?.monthlyData    || [];
  const sessionTypes   = data?.sessionTypes   || [];
  const clientProgress = data?.clientProgress || [];
  const metrics        = data?.metrics        || {};
  const totalSchd      = metrics.totalScheduled || 0;
  const attendanceRate = metrics.attendanceRate  || 0;
  const cancelRate     = metrics.cancellationRate|| 0;

  const rangeLabel = RANGE_LABELS[timeRange] || timeRange;

  const typeColors = sessionTypes.map((t, i) =>
    TYPE_COLORS[t.tipo] || [COLORS.primary, COLORS.success, COLORS.warning, COLORS.muted][i % 4]
  );

  return (
    <div className="dashboard-content">

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:14 }}>
        <div>
          <h2 className="page-title" style={{ marginBottom:4 }}>Mis Reportes</h2>
          <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0 }}>
            Aquí puedes ver cómo va tu trabajo como entrenador
          </p>
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {/* Filtro de período */}
          <div style={{ display:"flex", gap:4, background:"var(--bg-input)", padding:3, borderRadius:10, border:"1px solid var(--border)" }}>
            {[{v:"week",l:"Semana"},{v:"month",l:"Mes"},{v:"quarter",l:"Trimestre"},{v:"year",l:"Año"}].map(o => (
              <button
                key={o.v}
                onClick={() => setTimeRange(o.v)}
                style={{
                  padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:600,
                  background: timeRange === o.v ? "var(--accent)" : "transparent",
                  color: timeRange === o.v ? "#fff" : "var(--text-secondary)",
                  transition:"all .15s",
                }}
              >
                {o.l}
              </button>
            ))}
          </div>

          <button className="icon-btn" onClick={loadReports} title="Actualizar">
            <FiRefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite":"none" }} />
          </button>

          <button
            className="btn-outline-small"
            onClick={handleCSV}
            disabled={loading || !data}
            style={{ display:"flex", alignItems:"center", gap:6 }}
          >
            <FiDownload size={14} /> CSV
          </button>

          <button
            className="btn-outline-small"
            onClick={handlePDF}
            disabled={loading || !data || exporting}
            style={{ display:"flex", alignItems:"center", gap:6 }}
            title="PDF de lo que ves en pantalla"
          >
            <FiFileText size={14} />
            {exporting ? "Generando…" : "PDF rápido"}
          </button>

          <button
            className="btn-compact-primary"
            onClick={() => setCfgAbierta(true)}
            style={{ display:"flex", alignItems:"center", gap:6 }}
            title="Elegir periodo y secciones"
          >
            <FiDownload size={14} /> Reporte a la medida
          </button>
        </div>
      </div>

      {/* ── Configuración del reporte a la medida ── */}
      {cfgAbierta && (
        <>
          <div
            onClick={() => setCfgAbierta(false)}
            style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.6)" }}
          />
          <div style={{
            position:"fixed", zIndex:9991, top:"50%", left:"50%", transform:"translate(-50%,-50%)",
            width:"min(520px, calc(100vw - 40px))", maxHeight:"85vh", overflowY:"auto",
            background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14,
            padding:"22px 24px",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800 }}>Reporte a la medida</h3>
              <button
                onClick={() => setCfgAbierta(false)}
                style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer", fontSize:20 }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <p style={{ fontSize:12.5, color:"var(--text-secondary)", margin:"0 0 18px" }}>
              Elige el periodo y qué incluir. El documento lo genera el servidor.
            </p>

            <label style={CFG.label}>Año</label>
            <div style={CFG.chips}>
              {(opciones?.anios?.length ? opciones.anios : [hoy.getFullYear()]).map((a) => (
                <button key={a} onClick={() => setAnio(a)} style={CFG.chip(anio === a)}>{a}</button>
              ))}
            </div>

            <label style={CFG.label}>Mes</label>
            <div style={CFG.chips}>
              <button onClick={() => setMes(0)} style={CFG.chip(mes === 0)}>Año completo</button>
              {MESES_CORTOS.map((m, i) => (
                <button key={m} onClick={() => setMes(i + 1)} style={CFG.chip(mes === i + 1)}>{m}</button>
              ))}
            </div>

            <label style={CFG.label}>Qué incluir</label>
            <div style={{ display:"grid", gap:8, marginBottom:20 }}>
              {(opciones?.secciones ?? []).map((s) => {
                const activa = secciones.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => alternarSeccion(s.id)}
                    style={{
                      display:"flex", alignItems:"center", gap:11, cursor:"pointer",
                      padding:"11px 13px", borderRadius:10,
                      background:"var(--bg-input)",
                      border:`1px solid ${activa ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <span style={{ color: activa ? "var(--accent)" : "var(--text-secondary)", fontSize:15 }}>
                      {activa ? "☑" : "☐"}
                    </span>
                    <div>
                      <div style={{ fontSize:13.5, fontWeight:700 }}>{s.label}</div>
                      <div style={{ fontSize:11.5, color:"var(--text-secondary)" }}>{s.descripcion}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="btn-compact-primary"
              onClick={descargarPersonalizado}
              disabled={generando}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: generando ? .6 : 1 }}
            >
              <FiDownload size={15} />
              {generando ? "Generando…" : "Descargar PDF"}
            </button>
          </div>
        </>
      )}

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ background:"var(--danger-bg)", border:"1px solid var(--danger)", borderRadius:10,
              padding:"12px 16px", marginBottom:18, color:"var(--danger)", fontSize:13,
              display:"flex", gap:10, alignItems:"center" }}
          >
            <FiAlertCircle size={15}/> <span style={{ flex:1 }}>{error}</span>
            <button onClick={loadReports} style={{ background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:12,display:"flex",gap:4,alignItems:"center" }}>
              <FiRefreshCw size={12}/> Reintentar
            </button>
            <button onClick={() => setError(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"inherit" }}><FiX/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
          <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }} style={{ display:"inline-block" }}>
            <FiLoader size={34}/>
          </motion.div>
          <p style={{ marginTop:14 }}>Cargando estadísticas…</p>
        </div>
      )}

      {/* ── Contenido principal ── */}
      {!loading && data && (
        <>
          {/* ═══ KPIs ═══ */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            <KpiCard
              icon={FiCalendar}
              label={`Sesiones ${rangeLabel}`}
              value={stats.sessions ?? 0}
              sub={totalSchd > 0 ? `de ${totalSchd} programadas` : "completadas"}
              color={COLORS.primary}
              growth={growth.sessions}
            />
            <KpiCard
              icon={FiCheckCircle}
              label="Asistencia"
              value={`${attendanceRate}%`}
              sub="De las sesiones agendadas"
              color={attendanceRate >= 70 ? COLORS.success : COLORS.warning}
            />
            <KpiCard
              icon={FiUsers}
              label="Mis clientes"
              value={stats.clients ?? 0}
              sub="Activos en el gym"
              color="#a855f7"
            />
            <KpiCard
              icon={FiStar}
              label="Calificación"
              value={stats.avgRating > 0 ? `${stats.avgRating}/5` : "N/A"}
              sub="Promedio de evaluaciones"
              color={COLORS.warning}
            />
          </div>

          {/* ═══ Fila principal: Gráfica + Top clientes ═══ */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:16 }}>

            {/* Sesiones por mes */}
            <motion.div
              className="stat-card"
              initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
              style={{ padding:20 }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                <h3 style={{ fontSize:14, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
                  <FiTrendingUp size={15} style={{ color:COLORS.primary }}/> Sesiones por mes
                </h3>
                <div style={{ display:"flex", gap:14 }}>
                  {[{color:COLORS.primary,label:"Completadas"},{color:COLORS.danger,label:"Canceladas"}].map(l => (
                    <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-secondary)" }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:l.color }}/>{l.label}
                    </div>
                  ))}
                </div>
              </div>

              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} barGap={4} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fontSize:11, fill:"var(--text-secondary)" }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:"var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <RechartTooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="sessions" name="Completadas" fill={COLORS.primary} radius={[4,4,0,0]}/>
                    <Bar dataKey="cancelled" name="Canceladas" fill={COLORS.danger} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text-secondary)" }}>
                  <FiBarChart2 size={30} style={{ opacity:.25, display:"block", margin:"0 auto 10px" }}/>
                  Sin sesiones registradas en los últimos 6 meses
                </div>
              )}

              {/* Mini stats bajo gráfica */}
              {monthlyData.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                  {[
                    { label:"Total completadas", value: monthlyData.reduce((a,d)=>a+d.sessions,0), color:COLORS.primary },
                    { label:"Total canceladas",  value: monthlyData.reduce((a,d)=>a+d.cancelled,0), color:COLORS.danger },
                    { label:"Por cliente",       value: metrics.sessionsPerClient || 0,              color:"#a855f7" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"var(--bg-input)", borderRadius:8, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top clientes */}
            <motion.div
              className="stat-card"
              initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
              style={{ padding:20 }}
            >
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
                <FiAward size={15} style={{ color:COLORS.warning }}/> Clientes más activos
              </h3>

              {clientProgress.length > 0 ? (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {clientProgress.map((c, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={c.name} size={36} color={i === 0 ? COLORS.warning : COLORS.primary}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {c.name}
                        </div>
                        <div style={{ height:4, background:"var(--border)", borderRadius:2, marginTop:4, overflow:"hidden" }}>
                          <motion.div
                            style={{ height:"100%", background: i===0 ? COLORS.warning : COLORS.primary, borderRadius:2 }}
                            initial={{ width:0 }}
                            animate={{ width:`${c.improvement}%` }}
                            transition={{ delay:0.4 + i*0.07, duration:0.7, ease:"easeOut" }}
                          />
                        </div>
                      </div>
                      <div style={{ fontSize:12, fontWeight:800, color:"var(--text-secondary)", flexShrink:0 }}>
                        {c.sessions} ses.
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"30px 0", color:"var(--text-secondary)", fontSize:13 }}>
                  <FiUsers size={28} style={{ opacity:.25, display:"block", margin:"0 auto 10px" }}/>
                  Sin sesiones registradas {rangeLabel}
                </div>
              )}
            </motion.div>
          </div>

          {/* ═══ Fila secundaria: Tipos de sesión + Métricas ═══ */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

            {/* Tipos de sesión */}
            <motion.div
              className="stat-card"
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              style={{ padding:20 }}
            >
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
                <FiTarget size={15} style={{ color:"#a855f7" }}/> Tipo de sesiones {rangeLabel}
              </h3>

              {sessionTypes.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={sessionTypes} layout="vertical" barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                      <XAxis type="number" tick={{ fontSize:10, fill:"var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                      <YAxis type="category" dataKey="tipo" tick={{ fontSize:11, fill:"var(--text-secondary)" }} axisLine={false} tickLine={false} width={70}/>
                      <RechartTooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="count" name="Sesiones" radius={[0,4,4,0]}>
                        {sessionTypes.map((_, i) => (
                          <Cell key={i} fill={typeColors[i]}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10, paddingTop:12, borderTop:"1px solid var(--border)" }}>
                    {sessionTypes.map((t, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:typeColors[i] }}/>
                        <span style={{ color:"var(--text-secondary)" }}>{t.tipo}:</span>
                        <span style={{ color:"var(--text-primary)", fontWeight:700 }}>{t.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"center", padding:"30px 0", color:"var(--text-secondary)", fontSize:13 }}>
                  <FiTarget size={28} style={{ opacity:.25, display:"block", margin:"0 auto 10px" }}/>
                  Sin sesiones completadas {rangeLabel}
                </div>
              )}
            </motion.div>

            {/* Métricas detalladas en lenguaje llano */}
            <motion.div
              className="stat-card"
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              style={{ padding:20 }}
            >
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
                <FiBarChart2 size={15} style={{ color:COLORS.primary }}/> Cómo va tu trabajo
              </h3>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  {
                    icon: FiCheckCircle,
                    label: "Tus clientes asisten bien",
                    value: `${attendanceRate}%`,
                    sub: `${stats.sessions ?? 0} de ${totalSchd} sesiones realizadas`,
                    color: attendanceRate >= 70 ? COLORS.success : COLORS.warning,
                    good: attendanceRate >= 70,
                  },
                  {
                    icon: FiXCircle,
                    label: "Sesiones canceladas",
                    value: `${cancelRate}%`,
                    sub: `${metrics.totalCancelled ?? 0} cancelaciones en el período`,
                    color: cancelRate <= 10 ? COLORS.success : COLORS.danger,
                    good: cancelRate <= 10,
                  },
                  {
                    icon: FiClock,
                    label: "Sesiones por cliente",
                    value: `${metrics.sessionsPerClient ?? 0}`,
                    sub: "Promedio de sesiones completadas",
                    color: COLORS.primary,
                    good: true,
                  },
                  {
                    icon: FiStar,
                    label: "Calificación recibida",
                    value: stats.avgRating > 0 ? `${stats.avgRating}/5` : "Sin calificaciones",
                    sub: stats.avgRating > 0 ? (stats.avgRating >= 4 ? "¡Excelente desempeño!" : "Hay oportunidad de mejorar") : "Aún no tienes evaluaciones",
                    color: stats.avgRating >= 4 ? COLORS.success : stats.avgRating > 0 ? COLORS.warning : COLORS.muted,
                    good: stats.avgRating >= 4,
                  },
                ].map(({ icon: Icon, label, value, sub, color, good }) => (
                  <div key={label} style={{
                    display:"flex", gap:12, alignItems:"center",
                    padding:"11px 14px", background:"var(--bg-input)",
                    borderRadius:10, border:`1px solid ${good ? "rgba(34,197,94,.15)" : "var(--border)"}`,
                  }}>
                    <div style={{
                      width:38, height:38, borderRadius:9,
                      background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                    }}>
                      <Icon size={17} style={{ color }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{label}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:1 }}>{sub}</div>
                    </div>
                    <div style={{ fontSize:18, fontWeight:800, color, flexShrink:0 }}>{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ═══ Tabla resumen mensual ═══ */}
          {monthlyData.length > 0 && (
            <motion.div
              className="stat-card"
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
              style={{ padding:20 }}
            >
              <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                Historial mes a mes (últimos 6 meses)
              </h3>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr>
                      {["Mes","Completadas","Canceladas","Total programadas"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"8px 14px", borderBottom:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 + i*0.04 }}
                        style={{ borderBottom: i < monthlyData.length-1 ? "1px solid var(--border)":"none" }}
                      >
                        <td style={{ padding:"11px 14px", fontWeight:700 }}>{row.month}</td>
                        <td style={{ padding:"11px 14px", color:COLORS.primary, fontWeight:700 }}>{row.sessions}</td>
                        <td style={{ padding:"11px 14px", color:row.cancelled > 0 ? COLORS.danger : "var(--text-secondary)" }}>{row.cancelled}</td>
                        <td style={{ padding:"11px 14px", color:"var(--text-secondary)" }}>{row.total}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
          <FiBarChart2 size={44} style={{ opacity:.2, marginBottom:14, display:"block", margin:"0 auto 14px" }}/>
          <h3 style={{ marginBottom:8 }}>Sin datos por el momento</h3>
          <p style={{ fontSize:13 }}>Cuando empieces a registrar sesiones, aquí verás tus estadísticas.</p>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
