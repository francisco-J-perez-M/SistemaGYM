import { useEffect, useState } from "react";
import { getPagos, registrarPago } from "../api/pagos";
import { getMiembros } from "../api/miembros";
import { getMembresias } from "../api/membresias";
import "../css/CSSUnificado.css";

/* ================= ICONOS ================= */
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const MoneyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" />
  </svg>
);
const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

/* ================= UTILIDADES ================= */
const formatMoney = (v) =>
  v.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatFecha = (f) =>
  new Date(f).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function PagosDashboard() {
  const [pagos, setPagos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const [form, setForm] = useState({
    id_miembro: "",
    id_membresia: "",
    metodo_pago: "Efectivo",
    numero_tarjeta: "",
  });

  /* ================= CARGA DE DATOS ================= */
  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const pagosRes = await getPagos(page);

      try {
        const miembrosRes = await getMiembros();
        setMiembros(miembrosRes.data.miembros || []);
      } catch {
        console.warn("No se pudieron cargar los miembros");
      }

      try {
        const membresiasRes = await getMembresias();
        setMembresias(membresiasRes.data || []);
      } catch {
        console.warn("No se pudieron cargar las membresías");
      }

      setPagos(pagosRes.pagos || []);
      setPagination({
        page: pagosRes.page,
        pages: pagosRes.pages,
        total: pagosRes.total,
      });
    } catch (err) {
      console.error("Error cargando datos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadData(newPage);
    }
  };

  /* ================= REGISTRAR PAGO ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.id_miembro || !form.id_membresia) {
      setErrorMsg("Selecciona miembro y membresía");
      return;
    }

    try {
      await registrarPago({
        id_miembro: Number(form.id_miembro),
        id_membresia: Number(form.id_membresia),
        metodo_pago: form.metodo_pago,
        numero_tarjeta:
          form.metodo_pago === "Tarjeta" ? form.numero_tarjeta : undefined,
      });

      setForm({
        id_miembro: "",
        id_membresia: "",
        metodo_pago: "Efectivo",
        numero_tarjeta: "",
      });

      setIsFormExpanded(false);
      loadData(1);
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar pago";
      setErrorMsg(msg);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <h2 className="page-title">Gestión de Pagos</h2>
      </div>

      {/* ================= FORMULARIO ================= */}
      <div className="compact-form-section">
        <div className="compact-form-card">
          <div
            className="compact-form-header"
            onClick={() => setIsFormExpanded(!isFormExpanded)}
          >
            <h3>Registrar Pago</h3>
            <button
              type="button"
              className="icon-btn small"
              onClick={(e) => {
                e.stopPropagation();
                setIsFormExpanded(!isFormExpanded);
              }}
            >
              {isFormExpanded ? <CloseIcon /> : <PlusIcon />}
            </button>
          </div>

          {isFormExpanded && (
            <div className="compact-form-content">
              {errorMsg && (
                <p className="error-message" style={{ color: "#ef4444" }}>
                  {errorMsg}
                </p>
              )}

              <form onSubmit={handleSubmit} className="compact-form">
                <div className="compact-form-grid">
                  <select
  className="input-compact"
  value={form.id_miembro}
  onChange={(e) =>
    setForm({ ...form, id_miembro: e.target.value })
  }
  required
>
  <option value="">Seleccionar miembro</option>
  {miembros.map((m) => (
    <option key={m.id} value={m.id}>
      {m.nombre} {m.apellido}
    </option>
  ))}
</select>
                  <select
                    className="input-compact"
                    value={form.id_membresia}
                    onChange={(e) =>
                      setForm({ ...form, id_membresia: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar membresía</option>
                    {membresias.map((m) => (
                      <option key={m.id_membresia} value={m.id_membresia}>
                        {m.nombre} · {m.duracion_meses} meses · ${m.precio}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="compact-form-grid">
                  <select
                    className="input-compact"
                    value={form.metodo_pago}
                    onChange={(e) =>
                      setForm({ ...form, metodo_pago: e.target.value })
                    }
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>

                  {form.metodo_pago === "Tarjeta" && (
                    <input
                      className="input-compact"
                      placeholder="Número de tarjeta"
                      value={form.numero_tarjeta}
                      onChange={(e) =>
                        setForm({ ...form, numero_tarjeta: e.target.value })
                      }
                      required
                      maxLength={19}
                    />
                  )}
                </div>

                <div className="compact-form-actions-bottom">
                  <button className="btn-compact-primary" type="submit">
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ================= LISTA DE PAGOS ================= */}
      {loading ? (
        <div className="loading-spinner">
          <div className="dashboard-spinner"></div>
          <p>Cargando pagos...</p>
        </div>
      ) : pagos.length === 0 ? (
        <div className="empty-state">
          <h3>No hay pagos registrados</h3>
          <p>Registra el primer pago</p>
        </div>
      ) : (
        <>
          <div className={`kpi-grid ${!isFormExpanded ? "grid-wide-view" : ""}`}>
            {pagos.map((p) => (
              <div key={p.id_pago} className="stat-card">
                <div className="member-info">
                  <h4>{p.nombre_miembro}</h4>
                  <span
                    className={`status-badge ${
                      p.metodo_pago === "Tarjeta" ? "success" : "normal"
                    }`}
                  >
                    {p.metodo_pago}
                  </span>
                </div>

                <div className="member-details">
                  <div className="detail-row">
                    <MoneyIcon /> <strong>{formatMoney(p.monto)}</strong>
                  </div>
                  <div className="detail-row">
                    <DocumentIcon /> {p.concepto}
                  </div>
                  <div className="detail-row">
                    <CalendarIcon /> {formatFecha(p.fecha_pago)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn-outline-small"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </button>
              <span className="page-info">
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                className="btn-outline-small"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
