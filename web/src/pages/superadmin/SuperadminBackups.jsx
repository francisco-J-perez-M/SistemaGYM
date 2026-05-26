import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import {
  getBackupStatus,
  triggerBackup,
  getBackupHistorial,
  deleteBackupEntry,
  getSchedule,
  updateSchedule,
} from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:   { bg: "rgba(16,185,129,.15)",  color: "var(--success)" },
    neg:   { bg: "rgba(239,68,68,.15)",   color: "var(--danger)" },
    info:  { bg: "var(--accent-dim)",  color: "var(--accent-soft)" },
    warn:  { bg: "rgba(234,179,8,.15)",   color: "var(--warning)" },
    muted: { bg: "rgba(100,116,139,.15)", color: "var(--text-tertiary)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary", extra = {}) => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
    success: { background: "rgba(16,185,129,.1)",    color: "var(--success)" },
    warn:    { background: "rgba(234,179,8,.1)",     color: "var(--warning)" },
  };
  return { border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary), ...extra };
};

const INPUT = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 12px",
  color: "var(--text-primary)",
  fontSize: 13,
};

const STATUS_BADGE = {
  completado: "pos", iniciado: "info", running: "info", error: "neg",
  fallido: "neg", restore: "warn",
};

// Descarga un archivo de backup con autenticación JWT
async function downloadBackupFile(filename) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/superadmin/backups/download/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`No se pudo descargar: ${filename}`);
  }
}

const FILE_LABELS = {
  db_dump: { label: "MONGO", color: "var(--success)" },
  pg_dump: { label: "PG",    color: "var(--accent-soft)" },
  json:    { label: "JSON",  color: "var(--warning)" },
  excel:   { label: "XLS",   color: "var(--success)" },
  pdf:     { label: "PDF",   color: "var(--danger)" },
};

const TYPE_BADGE = {
  full: "pos", incremental: "info", differential: "warn", restore: "purple",
};

export default function SuperadminBackups() {
  const [status,   setStatus]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [schedEditing, setSchedEditing] = useState(false);
  const [schedForm, setSchedForm] = useState(null);
  const pollRef = useRef(null);

  const loadAll = () => {
    Promise.allSettled([
      getBackupStatus(),
      getBackupHistorial({ limit: 30 }),
      getSchedule(),
    ]).then(([s, h, sc]) => {
      if (s.status  === "fulfilled") setStatus(s.value.data);
      if (h.status  === "fulfilled") { setHistory(h.value.data.historial || []); setTotal(h.value.data.total || 0); }
      if (sc.status === "fulfilled") { setSchedule(sc.value.data); setSchedForm(sc.value.data); }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    return () => clearInterval(pollRef.current);
  }, []);

  // Poll every 3s while backup is running
  useEffect(() => {
    clearInterval(pollRef.current);
    if (status?.is_running) {
      pollRef.current = setInterval(() => {
        getBackupStatus().then(r => setStatus(r.data)).catch(() => {});
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [status?.is_running]);

  const handleTrigger = async () => {
    const { value: tipo } = await Swal.fire({
      title: "Iniciar Backup",
      html: `
        <select id="swal-tipo" style="width:100%;padding:9px;border-radius:7px;background:#1e2233;color:var(--text-primary);border:1px solid rgba(255,255,255,.1);font-size:14px">
          <option value="full">Full — volcado completo PG + MongoDB</option>
          <option value="incremental" selected>Incremental — cambios desde último backup</option>
          <option value="differential">Differential — cambios desde último full</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: "Iniciar",
      confirmButtonColor: "var(--accent)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
      preConfirm: () => document.getElementById("swal-tipo").value,
    });
    if (!tipo) return;

    try {
      await triggerBackup(tipo);
      Swal.fire({ icon: "success", title: `Backup ${tipo} iniciado`, text: "El proceso corre en segundo plano.", timer: 2000, showConfirmButton: false, background: "var(--bg-card)", color: "var(--text-primary)" });
      setTimeout(loadAll, 800);
    } catch (e) {
      const msg = e?.response?.data?.msg || "No se pudo iniciar";
      Swal.fire({ icon: "error", title: "Error", text: msg, background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await updateSchedule(schedForm);
      setSchedule(schedForm);
      setSchedEditing(false);
      Swal.fire({ icon: "success", title: "Programación guardada", timer: 1500, showConfirmButton: false, background: "var(--bg-card)", color: "var(--text-primary)" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo guardar", background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString("es-MX") : "—";

  const handleDelete = async (job_id, label) => {
    const { isConfirmed } = await Swal.fire({
      title: `Eliminar ${label}`,
      text: "Se borrará la entrada del historial y sus archivos en disco.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "var(--danger)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    try {
      await deleteBackupEntry(job_id);
      loadAll();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo eliminar", background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Backups</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Respaldos centralizados de la plataforma</p>
        </div>
        <button
          style={btnStyle("primary", { opacity: status?.is_running ? .5 : 1 })}
          onClick={handleTrigger}
          disabled={status?.is_running}
        >
          {status?.is_running ? "⏳ Ejecutando…" : "▶ Nuevo Backup"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary)" }}>Cargando…</div>
      ) : (
        <>
          {/* Estado actual */}
          {status && (
            <div style={{ ...card(), marginBottom: 20, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Estado del proceso</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: status.is_running ? 10 : 0 }}>
                  <span style={badge(status.is_running ? "info" : "pos")}>
                    {status.is_running ? "En ejecución" : "Inactivo"}
                  </span>
                  {status.current_step && (
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{status.current_step}</span>
                  )}
                </div>
                {status.is_running && (
                  <div style={{ height: 6, background: "rgba(255,255,255,.08)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${status.progress_percentage || 0}%`, height: "100%", background: "var(--accent, var(--accent))", borderRadius: 99, transition: "width .5s ease" }} />
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Último backup</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{fmtDate(status.last_backup)}</p>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Historial */}
            <div style={card({ padding: 0, overflow: "hidden" })}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Historial ({total})</h3>
                <div style={{ display: "flex", gap: 6 }}>
                  {history.some(h => h.status === "error" || !h.status) && (
                    <button
                      style={btnStyle("danger", { padding: "5px 10px", fontSize: 12 })}
                      onClick={() => handleDelete("__errors__", "todos los errores")}
                    >
                      🗑 Limpiar errores
                    </button>
                  )}
                  <button style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })} onClick={loadAll}>↺ Actualizar</button>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,.03)" }}>
                    {["Fecha", "Tipo", "Estado", "Tamaño", "Descargar", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "var(--text-secondary)" }}>Sin historial</td></tr>
                  ) : history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{fmtDate(h.date)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={badge(TYPE_BADGE[h.type] || "muted")}>{h.type}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {h.status
                          ? <span style={badge(STATUS_BADGE[h.status] || "muted")}>{h.status}</span>
                          : <span style={{ color: "var(--text-secondary)" }}>—</span>
                        }
                        {h.error && (
                          <p style={{ fontSize: 10, color: "var(--danger)", marginTop: 3, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={h.error}>
                            {h.error}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>
                        {h.size && h.size !== "ERROR" ? h.size : "—"}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {h.files && Object.keys(h.files).length > 0 ? (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {Object.entries(FILE_LABELS).map(([key, meta]) =>
                              h.files[key] ? (
                                <button
                                  key={key}
                                  onClick={() => downloadBackupFile(h.files[key])}
                                  style={{ border: "none", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700, cursor: "pointer", background: `${meta.color}22`, color: meta.color }}
                                >
                                  {meta.label}
                                </button>
                              ) : null
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-secondary)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {h.job_id && (
                          <button
                            onClick={() => handleDelete(h.job_id, `backup ${h.type} del ${fmtDate(h.date)}`)}
                            title="Eliminar entrada y archivos"
                            style={{ border: "none", background: "rgba(239,68,68,.1)", color: "var(--danger)", borderRadius: 6, padding: "4px 8px", fontSize: 13, cursor: "pointer" }}
                          >
                            🗑
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Programación */}
            <div style={card()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Programación</h3>
                <button
                  style={btnStyle("ghost", { padding: "5px 10px", fontSize: 12 })}
                  onClick={() => { setSchedEditing(v => !v); setSchedForm(schedule); }}
                >
                  {schedEditing ? "Cancelar" : "Editar"}
                </button>
              </div>

              {schedForm && !schedEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Row label="Habilitado" value={<span style={badge(schedule?.enabled ? "pos" : "neg")}>{schedule?.enabled ? "Sí" : "No"}</span>} />
                  <Row label="Cron" value={<code style={{ background: "rgba(255,255,255,.06)", padding: "2px 8px", borderRadius: 5, fontSize: 12, color: "var(--accent-soft)" }}>{schedule?.cron || "—"}</code>} />
                  <Row label="Tipo default" value={<span style={badge(TYPE_BADGE[schedule?.tipo_default] || "info")}>{schedule?.tipo_default || "—"}</span>} />
                  <Row label="Full día" value={schedule?.full_dia || "—"} />
                  <Row label="Retener" value={`${schedule?.retener_dias || "—"} días`} />
                </div>
              )}

              {schedEditing && schedForm && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    <input type="checkbox" checked={schedForm.enabled} onChange={e => setSchedForm(f => ({ ...f, enabled: e.target.checked }))} style={{ marginRight: 8 }} />
                    Habilitado
                  </label>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>Expresión Cron</p>
                    <input style={{ ...INPUT, width: "100%", boxSizing: "border-box" }} value={schedForm.cron || ""} onChange={e => setSchedForm(f => ({ ...f, cron: e.target.value }))} placeholder="0 3 * * *" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>Tipo default</p>
                    <select style={{ ...INPUT, width: "100%" }} value={schedForm.tipo_default || "incremental"} onChange={e => setSchedForm(f => ({ ...f, tipo_default: e.target.value }))}>
                      <option value="full">Full</option>
                      <option value="incremental">Incremental</option>
                      <option value="differential">Differential</option>
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>Día del full</p>
                    <select style={{ ...INPUT, width: "100%" }} value={schedForm.full_dia || "sunday"} onChange={e => setSchedForm(f => ({ ...f, full_dia: e.target.value }))}>
                      {["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 5 }}>Retener (días)</p>
                    <input style={{ ...INPUT, width: "100%", boxSizing: "border-box" }} type="number" min={1} value={schedForm.retener_dias || 30} onChange={e => setSchedForm(f => ({ ...f, retener_dias: parseInt(e.target.value) || 30 }))} />
                  </div>
                  <button style={btnStyle("primary", { marginTop: 4 })} onClick={handleSaveSchedule}>Guardar</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border, rgba(255,255,255,.05))" }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
