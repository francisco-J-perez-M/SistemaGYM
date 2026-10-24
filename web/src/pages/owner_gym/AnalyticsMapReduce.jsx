import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import "../../css/CSSUnificado.css";
import InfoGrafico, {
  COLORES_GRAFICO, SERIES_GRAFICO, COLOR_REJILLA, COLOR_ATENUADO,
  ejeX, ejeY, rangoPeriodo, describirTendencia,
} from "../../components/compartido/InfoGrafico";

const API_BASE = "";
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// Se usa la secuencia compartida: la anterior arrancaba con un amarillo pálido
// que sobre fondo claro apenas se distinguía del blanco de la tarjeta.
const COLORS_PIE = SERIES_GRAFICO;

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 500 }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString("es-MX") : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsMapReduce() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [trainLoading, setTrainLoading] = useState(false);
  const [error, setError]           = useState(null);
  const [trainMsg, setTrainMsg]     = useState(null);

  // ── GET: carga desde caché ─────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setTrainMsg(null);
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${API_BASE}/api/analytics/mapreduce`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── POST /train: re-ejecuta MapReduce y guarda en caché ───────────────────
  const handleTrain = async () => {
    setTrainLoading(true);
    setTrainMsg(null);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const r = await fetch(`${API_BASE}/api/analytics/mapreduce/train`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      const json = await r.json();
      setData(json);
      setTrainMsg(json.mensaje || "Datos actualizados correctamente.");
    } catch (e) {
      setError(e.message);
    } finally {
      setTrainLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="loading-spinner" style={{ height: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div className="dashboard-spinner" />
      <h3 style={{ marginTop: 24, marginBottom: 8, color: "var(--text-primary)" }}>Cargando análisis financiero...</h3>
      <p style={{ color: "var(--text-secondary)", maxWidth: 450, fontSize: 14, lineHeight: 1.5 }}>
        Calculando ingresos y asistencia de tu gimnasio. Un momento por favor.
      </p>
    </div>
  );

  if (error) {
    const isNoData = error.includes("400") || error.includes("401") || error.includes("403") || error.includes("404");
    return (
      <div className="empty-state">
        {isNoData ? (
          <>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", marginBottom: 12 }}>
              <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-5"/><circle cx="18" cy="9" r="0" fill="currentColor" strokeWidth="2"/>
            </svg>
            <h3 style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>Sin datos aún</h3>
            <p style={{ color: "var(--text-tertiary)", margin: 0, fontSize: 13 }}>
              Registra pagos y visitas para comenzar a ver análisis financieros.
            </p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>Actualizar</button>
          </>
        ) : (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--danger)", marginBottom: 12 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3 style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>Error al cargar datos</h3>
            <p style={{ color: "var(--text-tertiary)", margin: 0, fontSize: 13 }}>{error}</p>
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={fetchData}>Reintentar</button>
          </>
        )}
      </div>
    );
  }

  const resumenIngresos     = data?.resumen_ingresos          || [];
  const ingresosPorPeriodo  = data?.ingresos_por_periodo      || [];
  const asistenciaMes       = data?.asistencia_por_mes        || [];
  const asistenciaDia       = data?.asistencia_por_dia_semana || [];
  const desdeCache          = data?.desde_cache ?? false;
  const ejecutadoEn         = data?.ejecutado_en;

  const mesActual      = resumenIngresos[resumenIngresos.length - 1];
  const mesAnterior    = resumenIngresos[resumenIngresos.length - 2];
  const totalMesActual = mesActual?.total_periodo || mesActual?.total || 0;
  const totalAnterior  = mesAnterior?.total_periodo || mesAnterior?.total || 0;
  const variacion      = totalAnterior
    ? (((totalMesActual - totalAnterior) / totalAnterior) * 100).toFixed(1)
    : null;

  const diaTopObj  = [...asistenciaDia].sort((a, b) => (b.total_visitas || b.total || 0) - (a.total_visitas || a.total || 0))[0];
  const diaTop     = diaTopObj?.dia_semana || diaTopObj?.dia || "—";
  const diaTopTotal = diaTopObj?.total_visitas || diaTopObj?.total || 0;

  const metodosMap = {};
  ingresosPorPeriodo.forEach((item) => {
    const metodo = item.metodo_pago || "Otro";
    metodosMap[metodo] = (metodosMap[metodo] || 0) + (item.total_ingresos || item.total || 0);
  });
  const metodosData = Object.entries(metodosMap).map(([name, value]) => ({ name, value }));

  const asistenciaDiaOrdenada = DIAS_SEMANA.map((dia) => {
    const found = asistenciaDia.find(
      (d) => (d.dia_semana || d.dia || "").toLowerCase().includes(dia.toLowerCase().slice(0, 3))
    );
    return { dia, total: found?.total_visitas || found?.total || 0 };
  });

  const lineData = resumenIngresos.map((item) => ({
    mes:   item.periodo || item.mes || "",
    total: item.total_periodo || item.total || 0,
  }));

  const asistenciaMesNorm = asistenciaMes.map((item) => ({
    mes:   item.periodo || item.mes || "",
    total: item.total_visitas || item.total || 0,
  }));

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Finanzas y Flujo</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Resumen de ingresos, pagos y asistencia de tu gimnasio
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Badge caché */}
          {ejecutadoEn && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: desdeCache ? "var(--success-color)" : "var(--warning-color)",
                display: "inline-block",
              }} />
              {desdeCache ? "Desde caché" : "Recién calculado"} · {new Date(ejecutadoEn).toLocaleString("es-MX")}
            </span>
          )}

          {/* Botón Reentrenar */}
          <button
            className="btn-compact-primary"
            onClick={handleTrain}
            disabled={trainLoading}
            title="Re-ejecuta MapReduce con los datos actuales y actualiza la caché"
          >
            {trainLoading ? <span className="spinner" /> : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            )}
            {trainLoading ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>
      </div>

      {/* Notificación exitosa */}
      {trainMsg && (
        <div style={{
          marginBottom: 16, padding: "12px 16px", borderRadius: 8,
          background: "rgba(76,217,100,0.1)", border: "1px solid var(--success-color)",
          color: "var(--success-color)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {trainMsg}
        </div>
      )}

      {/* Loading overlay */}
      {trainLoading && (
        <div style={{
          marginBottom: 16, padding: "20px 24px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border-dark)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div className="dashboard-spinner" style={{ width: 28, height: 28 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Ejecutando nodos MapReduce...</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Procesando pagos y asistencias en paralelo. Esto puede tardar unos segundos.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card highlight-border">
          <div className="stat-header">
            <div>
              <h3>Ingresos del mes actual</h3>
              <div className="stat-value highlight">${totalMesActual.toLocaleString("es-MX")}</div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>
          {variacion !== null && (
            <span className={`trend ${parseFloat(variacion) >= 0 ? "positive" : "warning"}`}>
              {parseFloat(variacion) >= 0 ? "▲" : "▼"} {Math.abs(variacion)}% vs mes anterior
            </span>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Mejor día de asistencia</h3>
              <div className="stat-value">{diaTop}</div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <span className="stat-detail">{diaTopTotal} asistencias promedio</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Total acumulado</h3>
              <div className="stat-value">
                ${resumenIngresos.reduce((s, i) => s + (i.total_periodo || i.total || 0), 0).toLocaleString("es-MX")}
              </div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
          </div>
          <span className="stat-detail">{resumenIngresos.length} meses registrados</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <h3>Método principal</h3>
              <div className="stat-value" style={{ fontSize: 18 }}>{metodosData[0]?.name || "—"}</div>
            </div>
            <div className="card-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
          </div>
          <span className="stat-detail">
            {metodosData[0] ? `$${metodosData[0].value.toLocaleString("es-MX")} en pagos` : "Sin datos"}
          </span>
        </div>
      </div>

      {/* Gráficos línea + pie */}
      <div className="charts-row" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <InfoGrafico
            titulo="Ingreso mensual cobrado"
            periodo={rangoPeriodo(lineData, "mes")}
            subtitulo="Cuánto entró cada mes, sumando membresías y punto de venta."
            comportamiento={describirTendencia(
              lineData.map((d) => d.total || 0), { esDinero: true },
            )}
            series={[
              {
                color: COLORES_GRAFICO.ingresos,
                nombre: "Ingresos del mes",
                descripcion: "Total cobrado en ese mes. Cada punto es un mes cerrado.",
              },
            ]}
            notas={[
              "Una línea que sube indica más dinero cobrado, no necesariamente más miembros: una sola venta grande también la levanta.",
              "El eje vertical está en miles de pesos (k = mil).",
            ]}
          />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: 6, bottom: 22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA}/>
              <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                label={ejeX("Mes")}/>
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                label={ejeY("Ingresos (miles de MXN)")}/>
              <Tooltip content={<CustomTooltip prefix="$"/>}/>
              <Line type="monotone" dataKey="total" name="Ingresos" stroke={COLORES_GRAFICO.ingresos} strokeWidth={2.5} dot={{ r: 4, fill: COLORES_GRAFICO.ingresos, strokeWidth: 0 }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <InfoGrafico
            titulo="Reparto del cobro por método de pago"
            periodo="Todo el histórico registrado"
            subtitulo="Con qué paga la gente, en porcentaje del total cobrado."
            series={metodosData.map((m, i) => ({
              color: COLORS_PIE[i % COLORS_PIE.length],
              nombre: m.name,
              descripcion: `${m.value != null ? `$${Number(m.value).toLocaleString("es-MX")} cobrados` : "Sin importe"} con este método.`,
            }))}
            notas={[
              "El tamaño de cada porción es proporción del dinero, no número de transacciones: un pago grande pesa más que varios pequeños.",
            ]}
          />
          {metodosData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={metodosData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {metodosData.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v.toLocaleString("es-MX")}`, ""]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-dark)", borderRadius: 8 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {metodosData.map((m, i) => {
                  const pct = ((m.value / metodosData.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS_PIE[i % COLORS_PIE.length], flexShrink: 0 }}/>
                      <span style={{ color: "var(--text-secondary)", flex: 1 }}>{m.name}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", paddingTop: 40 }}>Sin datos de métodos de pago</p>
          )}
        </div>
      </div>

      {/* Asistencia por día y por mes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="chart-card">
          <InfoGrafico
            titulo="Afluencia promedio por día de la semana"
            periodo="Promedio de todo el histórico"
            subtitulo="Qué días se llena el gimnasio. No es una semana concreta: es la media de todas las registradas."
            series={[
              {
                color: COLORES_GRAFICO.asistencia,
                nombre: "Día con más visitas",
                descripcion: "La barra resaltada marca el día de mayor afluencia del periodo.",
              },
              {
                color: "var(--border)",
                nombre: "Resto de días",
                descripcion: "Los demás días, a la misma escala, para comparar de un vistazo.",
              },
            ]}
            notas={[
              "Son promedios de todo el periodo registrado, no de una semana concreta.",
              "Sirve para decidir en qué días conviene reforzar personal o programar clases.",
            ]}
          />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={asistenciaDiaOrdenada} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} horizontal={false}/>
              {/* allowDecimals: las visitas son cosas contables. Aunque el dato
                  sea un promedio, el eje en 0.75 / 1.5 / 2.25 no ayuda a leerlo;
                  Recharts los generaba al partir el máximo (3) en cinco marcas. */}
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                allowDecimals={false}
                label={ejeX("Visitas promedio")}/>
              <YAxis type="category" dataKey="dia" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={80}
                label={ejeY("Día de la semana")}/>
              <Tooltip content={<CustomTooltip suffix=" visitas"/>}/>
              <Bar dataKey="total" name="Asistencias" radius={[0, 4, 4, 0]}>
                {asistenciaDiaOrdenada.map((entry, i) => (
                  <Cell key={i} fill={entry.dia === diaTop ? COLORES_GRAFICO.asistencia : COLOR_ATENUADO}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <InfoGrafico
            titulo="Visitas registradas por mes"
            periodo={rangoPeriodo(asistenciaMesNorm, "mes")}
            subtitulo="Cuántas entradas se registraron cada mes. El mes en curso va incompleto."
            comportamiento={describirTendencia(
              asistenciaMesNorm.map((d) => d.total || 0), { unidad: " visitas" },
            )}
            series={[
              {
                color: COLORES_GRAFICO.asistencia,
                nombre: "Visitas registradas",
                descripcion: "Total de asistencias del mes. Cuenta entradas, no personas distintas: un miembro que va diez veces suma diez.",
              },
            ]}
            notas={[
              "El mes en curso aparece incompleto hasta que termine, así que suele verse más bajo.",
            ]}
          />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={asistenciaMesNorm} margin={{ top: 5, right: 10, left: 6, bottom: 22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA}/>
              <XAxis dataKey="mes" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                label={ejeX("Mes")}/>
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false}
                allowDecimals={false}
                label={ejeY("Visitas registradas")}/>
              <Tooltip content={<CustomTooltip suffix=" visitas"/>}/>
              <Bar dataKey="total" name="Asistencias" radius={[4, 4, 0, 0]}>
                {asistenciaMesNorm.map((_, i) => (
                  <Cell key={i} fill={i === asistenciaMesNorm.length - 1 ? COLORES_GRAFICO.asistencia : COLOR_ATENUADO}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}