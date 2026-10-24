/**
 * OwnerReportesAutomaticos.jsx — Automatizar el reporte ejecutivo por correo.
 *
 * El dueño configura "recetas" de reporte (qué secciones, con qué filtros y
 * cada cuándo: día/semana/mes/año) que el servidor genera y manda solo, por
 * correo al Propietario -- para tener el corte de caja sin entrar a
 * Reportes y descargar el PDF a mano cada vez.
 *
 *   GET    /api/owner_gym/reportes/automaticos                listar
 *   POST   /api/owner_gym/reportes/automaticos                crear
 *   PUT    /api/owner_gym/reportes/automaticos/:id             editar
 *   DELETE /api/owner_gym/reportes/automaticos/:id             eliminar
 *   POST   /api/owner_gym/reportes/automaticos/:id/ejecutar    probar ahora
 *
 * Reutiliza /reportes/opciones (catálogo de secciones) y /reportes/sucursales
 * -- los mismos que usa OwnerReportes.jsx para el reporte manual.
 */
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FiClock, FiPlus, FiTrash2, FiEdit2, FiSend, FiCheckSquare, FiSquare,
  FiAlertCircle, FiRefreshCw, FiMapPin, FiMail, FiPieChart, FiTrendingUp,
  FiToggleLeft, FiToggleRight,
} from "react-icons/fi";
import {
  getReporteOpciones, getReporteSucursales,
  getReportesAutomaticos, crearReporteAutomatico, actualizarReporteAutomatico,
  eliminarReporteAutomatico, ejecutarReporteAutomaticoAhora,
} from "../../api/owner_gym";
import { useFuncionesPlan } from "../../hooks/useFuncionesPlan";
import BloqueoFuncionPlan from "../../components/compartido/BloqueoFuncionPlan";

const C = {
  card:   "var(--bg-card)",
  input:  "var(--bg-input, var(--bg-main))",
  border: "var(--border)",
  t1:     "var(--text-primary, #f1f5f9)",
  t2:     "var(--text-secondary, #94a3b8)",
  accent: "var(--accent, #6366f1)",
  danger: "var(--danger, #ef4444)",
  warn:   "var(--warning, #eab308)",
};

const S = {
  page:  { background: "var(--bg-main)", minHeight: "100vh", color: C.t1, fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: C.t2, marginBottom: 26 },
  card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 26px" },
  label: { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: C.t2, marginBottom: 10 },
  chip:  (activo) => ({
    padding: "8px 16px", borderRadius: 20, cursor: "pointer",
    border: `1px solid ${activo ? C.accent : C.border}`,
    background: activo ? C.accent : "transparent",
    color: activo ? "#fff" : C.t2,
    fontSize: 13, fontWeight: 600, transition: "all .15s",
  }),
  btn: { display: "inline-flex", alignItems: "center", gap: 9, padding: "11px 22px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  btnGhost: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.t1, fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  input: { padding: "10px 14px", borderRadius: 10, fontSize: 13.5, border: `1px solid ${C.border}`, background: C.input, color: C.t1, width: "100%" },
};

const FRECUENCIAS = [
  { id: "diaria",  label: "Diaria",  detalle: "Cada día, con el corte del día anterior" },
  { id: "semanal", label: "Semanal", detalle: "Cada lunes, con el corte de la semana anterior" },
  { id: "mensual", label: "Mensual", detalle: "El día 1 de cada mes, con el corte del mes anterior" },
  { id: "anual",   label: "Anual",   detalle: "El 1 de enero, con el corte del año anterior" },
];

const SECCIONES_DEFAULT = ["resumen", "ingresos", "membresias", "pos", "asistencias", "miembros"];

const swalTema = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "#171a21",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

export default function OwnerReportesAutomaticos() {
  // Mismo candado de plan que el reporte manual (SCRUM-224): es la misma
  // función, solo que automatizada.
  const funcionesPlan = useFuncionesPlan();
  const reportesPdfPermitido = funcionesPlan.reportes_pdf !== false;

  const [opciones,   setOpciones]   = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [idGimnasio, setIdGimnasio] = useState(null);
  const [configs,    setConfigs]    = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [probandoId, setProbandoId] = useState(null);

  // Formulario de alta/edición (una sola tarjeta, se reutiliza para ambas)
  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId,  setEditandoId]  = useState(null);
  const [nombre,      setNombre]      = useState("");
  const [frecuencia,  setFrecuencia]  = useState("semanal");
  const [secciones,   setSecciones]   = useState(SECCIONES_DEFAULT);
  const [comparar,    setComparar]    = useState(true);
  const [graficas,    setGraficas]    = useState(true);

  useEffect(() => {
    getReporteSucursales()
      .then(({ data }) => setSucursales(Array.isArray(data) ? data : []))
      .catch(() => setSucursales([]));
  }, []);

  const cargarTodo = async () => {
    setCargando(true);
    setError(false);
    try {
      const [{ data: ops }, { data: lista }] = await Promise.all([
        getReporteOpciones(idGimnasio),
        getReportesAutomaticos(idGimnasio),
      ]);
      setOpciones(ops);
      setConfigs(Array.isArray(lista) ? lista : []);
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTodo(); }, [idGimnasio]); // eslint-disable-line

  const alternarSeccion = (id) =>
    setSecciones((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const limpiarForm = () => {
    setEditandoId(null);
    setNombre("");
    setFrecuencia("semanal");
    setSecciones(SECCIONES_DEFAULT);
    setComparar(true);
    setGraficas(true);
  };

  const abrirNuevo = () => { limpiarForm(); setFormAbierto(true); };

  const abrirEditar = (cfg) => {
    setEditandoId(cfg.id);
    setNombre(cfg.nombre);
    setFrecuencia(cfg.frecuencia);
    setSecciones(cfg.secciones?.length ? cfg.secciones : SECCIONES_DEFAULT);
    setComparar(cfg.comparar);
    setGraficas(cfg.graficas);
    setFormAbierto(true);
  };

  const cerrarForm = () => { setFormAbierto(false); limpiarForm(); };

  const guardar = async () => {
    if (!nombre.trim()) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "Ponle un nombre",
                  text: "Para reconocerla en la lista, p. ej. \"Corte de caja semanal\"." });
      return;
    }
    if (secciones.length === 0) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "Elige al menos una sección" });
      return;
    }
    setGuardando(true);
    try {
      const payload = { nombre: nombre.trim(), frecuencia, secciones, comparar, graficas };
      if (editandoId) {
        await actualizarReporteAutomatico(editandoId, payload);
      } else {
        await crearReporteAutomatico(payload, idGimnasio);
      }
      cerrarForm();
      await cargarTodo();
      Swal.fire({ ...swalTema(), icon: "success", title: "Guardado",
                  timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ ...swalTema(), icon: "error", title: "No se pudo guardar",
                  text: e?.response?.data?.msg || "Intenta de nuevo en un momento." });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (cfg) => {
    const r = await Swal.fire({
      ...swalTema(), icon: "warning", title: `¿Eliminar "${cfg.nombre}"?`,
      text: "Dejará de generarse y enviarse por correo.",
      showCancelButton: true, confirmButtonText: "Eliminar", cancelButtonText: "Cancelar",
      confirmButtonColor: C.danger,
    });
    if (!r.isConfirmed) return;
    try {
      await eliminarReporteAutomatico(cfg.id);
      await cargarTodo();
    } catch {
      Swal.fire({ ...swalTema(), icon: "error", title: "No se pudo eliminar" });
    }
  };

  const toggleActivo = async (cfg) => {
    try {
      await actualizarReporteAutomatico(cfg.id, { activo: !cfg.activo });
      await cargarTodo();
    } catch {
      Swal.fire({ ...swalTema(), icon: "error", title: "No se pudo actualizar" });
    }
  };

  const probarAhora = async (cfg) => {
    setProbandoId(cfg.id);
    try {
      const { data } = await ejecutarReporteAutomaticoAhora(cfg.id);
      Swal.fire({ ...swalTema(), icon: "success", title: "Enviado",
                  text: data?.msg || "Revisa el correo del propietario." });
      await cargarTodo();
    } catch (e) {
      Swal.fire({ ...swalTema(), icon: "error", title: "No se pudo enviar",
                  text: e?.response?.data?.msg || "Intenta de nuevo en un momento." });
    } finally {
      setProbandoId(null);
    }
  };

  const catalogoSecciones = opciones?.secciones ?? [];

  if (cargando) {
    return <div style={S.page}><p style={{ color: C.t2, fontSize: 14 }}>Cargando…</p></div>;
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 460, textAlign: "center" }}>
          <FiAlertCircle size={34} color={C.danger} />
          <p style={{ margin: "12px 0 18px", color: C.t2, fontSize: 14 }}>
            No se pudieron cargar las automatizaciones.
          </p>
          <button onClick={cargarTodo} style={S.btn}><FiRefreshCw /> Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <BloqueoFuncionPlan
      permitido={reportesPdfPermitido}
      nombreFuncion="Automatizar reportes"
      planSugerido="Básico"
      puedeMejorarPlan
    >
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 6, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, var(--accent-soft, #818cf8))`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiClock size={24} color="#fff" />
          </div>
          <div>
            <h1 style={S.title}>Automatizar reportes</h1>
            <p style={{ ...S.sub, marginBottom: 0 }}>
              Elige qué reporte, con qué filtros y cada cuándo -- se manda solo por correo al propietario.
            </p>
          </div>
        </div>
        {!formAbierto && (
          <button onClick={abrirNuevo} style={S.btn}><FiPlus /> Nueva automatización</button>
        )}
      </div>

      {sucursales.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, marginBottom: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.t2, fontWeight: 600, marginRight: 4 }}>
            <FiMapPin /> Sucursal:
          </span>
          {sucursales.map((s) => {
            const activa = (idGimnasio ?? sucursales.find((x) => x.es_actual)?.id) === s.id;
            return (
              <button key={s.id} onClick={() => setIdGimnasio(s.id)} style={S.chip(activa)}>
                {s.nombre}{s.es_actual && " (esta)"}
              </button>
            );
          })}
        </div>
      )}

      {formAbierto && (
        <div style={{ ...S.card, marginTop: 24 }}>
          <label style={S.label}>Nombre</label>
          <input
            type="text" value={nombre} maxLength={120}
            onChange={(e) => setNombre(e.target.value)}
            placeholder='Ej. "Corte de caja semanal"'
            style={{ ...S.input, marginBottom: 22 }}
          />

          <label style={S.label}><FiClock style={{ verticalAlign: -2 }} /> Cada cuándo</label>
          <div style={{ display: "grid", gap: 9, marginBottom: 22 }}>
            {FRECUENCIAS.map((f) => {
              const activa = frecuencia === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFrecuencia(f.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: "13px 15px", borderRadius: 11, background: C.input,
                    border: `1px solid ${activa ? C.accent : C.border}`,
                  }}
                >
                  <span style={{ color: activa ? C.accent : C.t2, display: "flex" }}>
                    {activa ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>{f.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.t2 }}>{f.detalle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <label style={S.label}>Qué incluir</label>
          <div style={{ display: "grid", gap: 9, marginBottom: 22 }}>
            {catalogoSecciones.map((s) => {
              const activa = secciones.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => alternarSeccion(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: "13px 15px", borderRadius: 11, background: C.input,
                    border: `1px solid ${activa ? C.accent : C.border}`,
                  }}
                >
                  <span style={{ color: activa ? C.accent : C.t2, display: "flex" }}>
                    {activa ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.t2 }}>{s.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            onClick={() => setGraficas((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              padding: "13px 15px", borderRadius: 11, background: C.input,
              border: `1px solid ${graficas ? C.accent : C.border}`, marginBottom: 12,
            }}
          >
            <span style={{ color: graficas ? C.accent : C.t2, display: "flex" }}>
              {graficas ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
            </span>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, flex: 1 }}>
              <FiPieChart style={{ verticalAlign: -2, marginRight: 6 }} /> Incluir gráficas
            </p>
          </div>

          <div
            onClick={() => setComparar((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              padding: "13px 15px", borderRadius: 11, background: C.input,
              border: `1px solid ${comparar ? C.accent : C.border}`, marginBottom: 24,
            }}
          >
            <span style={{ color: comparar ? C.accent : C.t2, display: "flex" }}>
              {comparar ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
            </span>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, flex: 1 }}>
              <FiTrendingUp style={{ verticalAlign: -2, marginRight: 6 }} /> Comparar con el periodo anterior
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={guardar} disabled={guardando} style={{ ...S.btn, opacity: guardando ? 0.6 : 1 }}>
              {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Crear automatización"}
            </button>
            <button onClick={cerrarForm} style={S.btnGhost}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
        {configs.length === 0 && !formAbierto && (
          <div style={{ ...S.card, textAlign: "center", padding: "48px 24px" }}>
            <FiMail size={32} color={C.t2} />
            <p style={{ margin: "14px 0 4px", fontWeight: 700 }}>Sin automatizaciones todavía</p>
            <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>
              Crea una para que el reporte te llegue solo por correo.
            </p>
          </div>
        )}

        {configs.map((cfg) => (
          <div key={cfg.id} style={{ ...S.card, opacity: cfg.activo ? 1 : 0.55 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{cfg.nombre}</h3>
                  <span style={{
                    padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: "var(--accent-dim, rgba(99,102,241,.15))", color: C.accent,
                  }}>
                    {cfg.frecuencia_label}
                  </span>
                  {!cfg.activo && (
                    <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: C.t2, border: `1px solid ${C.border}` }}>
                      Pausada
                    </span>
                  )}
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 12.5, color: C.t2 }}>
                  {cfg.secciones.length} sección{cfg.secciones.length === 1 ? "" : "es"}
                  {cfg.graficas && " · con gráficas"}
                  {cfg.comparar && " · con comparativa"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.t2 }}>
                  {cfg.ultima_ejecucion
                    ? `Último envío: ${new Date(cfg.ultima_ejecucion).toLocaleString("es-MX")}`
                    : "Todavía no se ha enviado"}
                </p>
                {cfg.ultimo_error && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: C.warn, display: "flex", alignItems: "center", gap: 5 }}>
                    <FiAlertCircle /> El último envío falló: {cfg.ultimo_error}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => toggleActivo(cfg)} style={S.btnGhost} title={cfg.activo ? "Pausar" : "Reactivar"}>
                  {cfg.activo ? <FiToggleRight color={C.accent} /> : <FiToggleLeft />}
                  {cfg.activo ? "Activa" : "Pausada"}
                </button>
                <button onClick={() => probarAhora(cfg)} disabled={probandoId === cfg.id} style={S.btnGhost} title="Enviar ahora, fuera de su horario">
                  <FiSend /> {probandoId === cfg.id ? "Enviando…" : "Probar"}
                </button>
                <button onClick={() => abrirEditar(cfg)} style={S.btnGhost}><FiEdit2 /> Editar</button>
                <button onClick={() => eliminar(cfg)} style={{ ...S.btnGhost, color: C.danger, borderColor: C.danger }}>
                  <FiTrash2 /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </BloqueoFuncionPlan>
  );
}
