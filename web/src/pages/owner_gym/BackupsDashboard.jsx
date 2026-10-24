/**
 * BackupsDashboard.jsx — Respaldos y Restauración unificados para owner_gym.
 *
 * Tab 1: Generar respaldo  (full / differential / incremental, descarga JSON)
 * Tab 2: Restaurar         (listado del historial, acción de restaurar)
 *
 * Llama exclusivamente a /api/owner_gym/backups/* → datos filtrados por gimnasio.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  getTenantSummary,
  triggerTenantBackup,
  getTenantStatus,
  downloadTenantFile,
  restoreTenantBackup,
} from "../../api/backups";
import "../../css/CSSUnificado.css";

/* ── Iconos inline ─────────────────────────────────────────────────────────── */
const IcoUpload    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IcoDownload  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoRestore   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;
const IcoCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoWarning   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : "—";
const typeBadge = (t) => {
  const m = { full: ["COMPLETO", "#6366f1"], differential: ["DIFERENCIAL", "#f59e0b"], incremental: ["INCREMENTAL", "#10b981"] };
  const [label, color] = m[t] || [t?.toUpperCase(), "#94a3b8"];
  return <span style={{ background: color + "22", color, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{label}</span>;
};

const triggerDownload = async (filename) => {
  try {
    const res = await downloadTenantFile(filename);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); window.URL.revokeObjectURL(url);
  } catch { alert("Error al descargar el archivo."); }
};

/* ── Tab: Generar respaldo ─────────────────────────────────────────────────── */
function TabGenerar({ summary, onRefresh }) {
  const [btype, setBtype]         = useState("full");
  const [running, setRunning]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [step, setStep]           = useState("");
  const [lastFile, setLastFile]   = useState(null);
  const [error, setError]         = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    if (summary?.is_running) {
      setRunning(true); setProgress(summary.progress || 0); setStep(summary.step || "");
      startPolling();
    }
    return stopPolling;
    // eslint-disable-next-line
  }, []);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getTenantStatus();
        setProgress(data.progress || 0);
        setStep(data.step || "");
        if (!data.is_running) {
          stopPolling();
          setRunning(false);
          if (data.error) { setError(data.error); }
          else {
            const f = data.last_file ? data.last_file.split(/[\\/]/).pop() : null;
            setLastFile(f);
          }
          onRefresh();
        }
      } catch { stopPolling(); setRunning(false); }
    }, 2500);
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const handleTrigger = async () => {
    setError(""); setLastFile(null);
    try {
      await triggerTenantBackup(btype);
      setRunning(true); setProgress(5); setStep("Iniciando…");
      startPolling();
    } catch (e) {
      setError(e.response?.data?.error || "Error al iniciar el respaldo");
    }
  };

  const TYPES = [
    { id: "full",          label: "Completo",     desc: "Todos los datos del gimnasio" },
    { id: "differential",  label: "Diferencial",  desc: "Cambios desde el último Full",      disabled: !summary?.can_differential },
    { id: "incremental",   label: "Incremental",  desc: "Cambios desde el último respaldo",  disabled: !summary?.can_incremental  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          { label: "Último respaldo completo", value: fmtDate(summary?.last_full) },
          { label: "Último respaldo (cualquier)", value: fmtDate(summary?.last_backup) },
          { label: "Respaldos guardados", value: summary?.history?.filter(h => h.status === "completado").length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card" style={{ padding: "16px 20px" }}>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</p>
            <p style={{ margin: "6px 0 0", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Selector + Acción */}
      <div className="charts-row" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="stat-card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>Tipo de respaldo</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)" }}>
            Los datos se guardan como JSON filtrado por tu gimnasio. Solo se conservan los últimos 3 respaldos.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {TYPES.map(t => (
              <button key={t.id} disabled={running || t.disabled}
                onClick={() => setBtype(t.id)}
                style={{
                  flex: 1, minWidth: 130, padding: "12px 10px", borderRadius: 10, cursor: t.disabled ? "not-allowed" : "pointer",
                  border: btype === t.id ? "2px solid #6366f1" : "1px solid var(--border)",
                  background: btype === t.id ? "rgba(99,102,241,.12)" : "transparent",
                  color: t.disabled ? "var(--text-secondary)" : "var(--text-primary)",
                  opacity: t.disabled ? 0.45 : 1, transition: "all .2s",
                }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <button className={`btn-primary btn-block${running ? " btn-loading" : ""}`}
            onClick={handleTrigger} disabled={running}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {running
              ? <><div className="spinner-small" /><span>Ejecutando…</span></>
              : <><IcoUpload /><span>Iniciar respaldo {TYPES.find(t=>t.id===btype)?.label}</span></>}
          </button>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#f87171", fontSize: 13, display: "flex", gap: 8 }}>
              <IcoWarning /> {error}
            </div>
          )}
        </div>

        {/* Progreso */}
        <div className="stat-card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Monitor</h3>
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            background: `conic-gradient(#6366f1 ${progress * 3.6}deg, var(--bg-dark) ${progress * 3.6}deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>
              {progress}%
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", textAlign: "center", minHeight: 20 }}>
            {running ? step : lastFile ? "Respaldo completado" : "En espera"}
          </p>
          {!running && lastFile && (
            <button onClick={() => triggerDownload(lastFile)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8, background: "#10b981", border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              <IcoDownload /> Descargar JSON
            </button>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Historial (últimos 3)</h3>
        </div>
        {(summary?.history || []).filter(h => h.status === "completado").length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            Sin respaldos registrados todavía.
          </p>
        ) : (
          <div className="custom-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {["Fecha", "Tipo", "Tamaño", "Docs", "Descargar"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(summary?.history || []).filter(h => h.status === "completado").map((bk, i) => (
                  <tr key={i}>
                    <td>{fmtDate(bk.date)}</td>
                    <td>{typeBadge(bk.type)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{bk.size || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{bk.docs ?? "—"}</td>
                    <td>
                      {bk.filename ? (
                        <button className="btn-outline-small" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          onClick={() => triggerDownload(bk.filename)}>
                          <IcoDownload /> Descargar
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Tab: Restaurar ────────────────────────────────────────────────────────── */
function TabRestaurar({ summary, onRefresh }) {
  const [restoring, setRestoring] = useState(null);
  const [msg, setMsg]             = useState(null);
  const [error, setError]         = useState("");

  const completed = (summary?.history || []).filter(h => h.status === "completado");

  const handleRestore = async (bk) => {
    if (!window.confirm(
      `¿Restaurar el respaldo del ${fmtDate(bk.date)}?\n\nEsta acción sobrescribirá los datos actuales con los del respaldo.`
    )) return;
    setRestoring(bk.filename); setMsg(null); setError("");
    try {
      const { data } = await restoreTenantBackup(bk.filename);
      setMsg(data.msg);
      onRefresh();
    } catch (e) {
      setError(e.response?.data?.error || "Error al restaurar");
    } finally { setRestoring(null); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="stat-card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IcoWarning />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Zona de restauración</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>
              Solo se restauran datos de tu gimnasio. El proceso hace upsert (no borra registros nuevos). Crea un respaldo completo antes de restaurar.
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", color: "#34d399", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <IcoCheck /> {msg}
        </div>
      )}
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <IcoWarning /> {error}
        </div>
      )}

      {completed.length === 0 ? (
        <div className="chart-card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No hay respaldos disponibles para restaurar.</p>
          <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Genera primero un respaldo Completo desde la pestaña anterior.</p>
        </div>
      ) : (
        <div className="chart-card">
          <div className="chart-header"><h3>Respaldos disponibles</h3></div>
          <div className="custom-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  {["Fecha", "Tipo", "Tamaño", "Docs", "Acción"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {completed.map((bk, i) => (
                  <tr key={i}>
                    <td>{fmtDate(bk.date)}</td>
                    <td>{typeBadge(bk.type)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{bk.size || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{bk.docs ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-outline-small" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          onClick={() => triggerDownload(bk.filename)}>
                          <IcoDownload /> Descargar
                        </button>
                        <button
                          disabled={restoring === bk.filename}
                          onClick={() => handleRestore(bk)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,.4)", background: "rgba(245,158,11,.1)", color: "#f59e0b", cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: restoring === bk.filename ? 0.6 : 1 }}>
                          <IcoRestore /> {restoring === bk.filename ? "Restaurando…" : "Restaurar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function BackupsDashboard() {
  const [tab, setTab]         = useState("generar");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await getTenantSummary();
      setSummary(data);
    } catch (e) {
      console.error("Error cargando resumen de backups:", e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const TABS = [
    { id: "generar",    label: "Generar respaldo",   icon: <IcoUpload /> },
    { id: "restaurar",  label: "Restaurar",           icon: <IcoRestore /> },
  ];

  return (
    <>
      <header className="top-header">
        <h2 className="page-title">Copias de Seguridad del Gimnasio</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
          Los respaldos contienen únicamente los datos de tu gimnasio. Se conservan los últimos 3.
        </p>
      </header>

      <main className="dashboard-content">
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                color: tab === t.id ? "#818cf8" : "var(--text-secondary)",
                fontWeight: tab === t.id ? 700 : 500, fontSize: 14, transition: "all .2s",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary)" }}>Cargando…</div>
        ) : tab === "generar" ? (
          <TabGenerar summary={summary} onRefresh={loadSummary} />
        ) : (
          <TabRestaurar summary={summary} onRefresh={loadSummary} />
        )}
      </main>
    </>
  );
}
