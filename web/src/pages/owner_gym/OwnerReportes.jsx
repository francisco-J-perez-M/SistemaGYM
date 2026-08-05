/**
 * OwnerReportes.jsx — Generador de reportes del gimnasio.
 *
 * El dueño arma el documento que necesita: elige el periodo, marca qué
 * secciones incluir y decide si quiere la comparativa contra el periodo
 * anterior. El PDF lo construye el backend con la identidad del gimnasio en la
 * portada.
 *
 *   GET /api/owner_gym/reportes/opciones  → años con datos y catálogo de secciones
 *   GET /api/owner_gym/reportes/pdf       → documento, según los filtros
 *
 * La descarga va por axios y no por un enlace directo porque el endpoint exige
 * el token JWT, que el navegador no adjuntaría al seguir un href.
 */
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  FiFileText, FiDownload, FiCheckSquare, FiSquare, FiCalendar,
  FiBarChart2, FiRefreshCw, FiAlertCircle, FiTrendingUp,
} from "react-icons/fi";
import { getReporteOpciones, descargarReportePdf } from "../../api/owner_gym";

const C = {
  card:   "var(--bg-card)",
  input:  "var(--bg-input, var(--bg-main))",
  border: "var(--border)",
  t1:     "var(--text-primary, #f1f5f9)",
  t2:     "var(--text-secondary, #94a3b8)",
  accent: "var(--accent, #6366f1)",
  danger: "var(--danger, #ef4444)",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-main)", minHeight: "100vh", color: C.t1, fontFamily: "Inter,system-ui,sans-serif" },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub:   { fontSize: 13, color: C.t2, marginBottom: 26 },
  card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px" },
  label: { display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: C.t2, marginBottom: 10 },
  chip:  (activo) => ({
    padding: "8px 16px", borderRadius: 20, cursor: "pointer",
    border: `1px solid ${activo ? C.accent : C.border}`,
    background: activo ? C.accent : "transparent",
    color: activo ? "#fff" : C.t2,
    fontSize: 13, fontWeight: 600, transition: "all .15s",
  }),
  btn: { display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 26px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};

const swalTema = () => {
  const s = getComputedStyle(document.documentElement);
  return {
    background: s.getPropertyValue("--bg-card").trim() || "#171a21",
    color:      s.getPropertyValue("--text-primary").trim() || "#f1f5f9",
  };
};

export default function OwnerReportes() {
  const hoy = useMemo(() => new Date(), []);

  const [opciones, setOpciones] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(false);
  const [generando, setGenerando] = useState(false);

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes,  setMes]  = useState(hoy.getMonth() + 1);   // 0 = año completo
  const [comparar, setComparar] = useState(true);
  const [secciones, setSecciones] = useState([
    "resumen", "ingresos", "membresias", "pos", "asistencias", "miembros",
  ]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getReporteOpciones();
        setOpciones(data);
        // Si el año en curso no tiene datos, se abre en el más reciente que sí.
        if (Array.isArray(data?.anios) && data.anios.length &&
            !data.anios.includes(hoy.getFullYear())) {
          setAnio(data.anios[0]);
        }
      } catch {
        setError(true);
      } finally {
        setCargando(false);
      }
    })();
  }, [hoy]);

  const alternarSeccion = (id) =>
    setSecciones((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const etiquetaPeriodo = !mes ? `Año ${anio}` : `${MESES[mes - 1]} ${anio}`;

  const generar = async () => {
    if (secciones.length === 0) {
      Swal.fire({ ...swalTema(), icon: "warning", title: "Elige al menos una sección",
                  text: "El reporte no puede ir vacío." });
      return;
    }
    setGenerando(true);
    try {
      const { data } = await descargarReportePdf({
        anio,
        mes,
        secciones: secciones.join(","),
        ...(comparar ? { comparar: 1 } : {}),
      });

      // Se crea un enlace temporal en memoria para disparar la descarga; el
      // blob se libera después para no dejar el objeto colgando.
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_${anio}-${String(mes || 0).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      Swal.fire({
        ...swalTema(), icon: "error", title: "No se pudo generar el reporte",
        text: e?.response?.status === 404
          ? "No hay datos para el periodo elegido."
          : "Intenta de nuevo en un momento.",
      });
    } finally {
      setGenerando(false);
    }
  };

  if (cargando) {
    return <div style={S.page}><p style={{ color: C.t2, fontSize: 14 }}>Cargando opciones…</p></div>;
  }

  if (error) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: 460, textAlign: "center" }}>
          <FiAlertCircle size={34} color={C.danger} />
          <p style={{ margin: "12px 0 18px", color: C.t2, fontSize: 14 }}>
            No se pudieron cargar las opciones del reporte.
          </p>
          <button onClick={() => window.location.reload()} style={S.btn}>
            <FiRefreshCw /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const anios = opciones?.anios?.length ? opciones.anios : [hoy.getFullYear()];
  const catalogoSecciones = opciones?.secciones ?? [];

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 6 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14,
          background: `linear-gradient(135deg, ${C.accent}, var(--accent-soft, #818cf8))`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FiFileText size={24} color="#fff" />
        </div>
        <div>
          <h1 style={S.title}>Reportes</h1>
          <p style={{ ...S.sub, marginBottom: 0 }}>
            Arma el documento que necesitas y descárgalo en PDF.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 20, marginTop: 26, alignItems: "start" }}>
        {/* Configuración */}
        <div style={S.card}>
          {/* Periodo */}
          <label style={S.label}><FiCalendar style={{ verticalAlign: -2 }} /> Año</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
            {anios.map((a) => (
              <button key={a} onClick={() => setAnio(a)} style={S.chip(anio === a)}>
                {a}
              </button>
            ))}
          </div>

          <label style={S.label}>Mes</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            <button onClick={() => setMes(0)} style={S.chip(mes === 0)}>Año completo</button>
            {MESES.map((m, i) => (
              <button key={m} onClick={() => setMes(i + 1)} style={S.chip(mes === i + 1)}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Secciones */}
          <label style={S.label}><FiBarChart2 style={{ verticalAlign: -2 }} /> Qué incluir</label>
          <div style={{ display: "grid", gap: 9, marginBottom: 22 }}>
            {catalogoSecciones.map((s) => {
              const activa = secciones.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => alternarSeccion(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    padding: "13px 15px", borderRadius: 11,
                    background: C.input,
                    border: `1px solid ${activa ? C.accent : C.border}`,
                    transition: "border-color .15s",
                  }}
                >
                  <span style={{ color: activa ? C.accent : C.t2, display: "flex" }}>
                    {activa ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.t2 }}>
                      {s.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparativa */}
          <div
            onClick={() => setComparar((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              padding: "13px 15px", borderRadius: 11, background: C.input,
              border: `1px solid ${comparar ? C.accent : C.border}`,
            }}
          >
            <span style={{ color: comparar ? C.accent : C.t2, display: "flex" }}>
              {comparar ? <FiCheckSquare size={19} /> : <FiSquare size={19} />}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>
                <FiTrendingUp style={{ verticalAlign: -2, marginRight: 6 }} />
                Comparar con el periodo anterior
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11.5, color: C.t2 }}>
                Añade la variación de ingresos, asistencias y altas.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen y descarga */}
        <div style={{ ...S.card, position: "sticky", top: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: C.t2, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>
            Tu reporte
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 19, fontWeight: 800 }}>
            {etiquetaPeriodo}
          </p>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginBottom: 18 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: C.t2 }}>
              {secciones.length} de {catalogoSecciones.length} secciones
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 5 }}>
              {catalogoSecciones
                .filter((s) => secciones.includes(s.id))
                .map((s) => (
                  <li key={s.id} style={{ fontSize: 12.5, color: C.t1, display: "flex", gap: 7 }}>
                    <span style={{ color: C.accent }}>•</span> {s.label}
                  </li>
                ))}
            </ul>
            {comparar && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: C.accent, fontWeight: 600 }}>
                Con comparativa
              </p>
            )}
          </div>

          <button
            onClick={generar}
            disabled={generando}
            style={{ ...S.btn, width: "100%", justifyContent: "center", opacity: generando ? 0.6 : 1 }}
          >
            <FiDownload size={16} />
            {generando ? "Generando…" : "Descargar PDF"}
          </button>

          <p style={{ margin: "12px 0 0", fontSize: 11.5, color: C.t2, lineHeight: 1.5 }}>
            El documento lleva el nombre y los datos de contacto de tu gimnasio
            en la portada.
          </p>
        </div>
      </div>
    </div>
  );
}
