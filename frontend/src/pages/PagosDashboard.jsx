import { useEffect, useState } from "react";
import { getPagos, registrarPago } from "../api/pagos";
import { getMiembros } from "../api/miembros";
import "../css/CSSUnificado.css";

/* ================= ICONOS SIMPLES ================= */
const PlusIcon = () => <span style={{ fontSize: "18px" }}>＋</span>;
const CloseIcon = () => <span style={{ fontSize: "18px" }}>✕</span>;

export default function PagosDashboard() {
  const [pagos, setPagos] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const [form, setForm] = useState({
    id_miembro: "",
    monto: "",
    metodo_pago: "Efectivo",
    concepto: "Pago mensual",
  });

  /* ================= CARGAR DATOS ================= */
  const loadData = async () => {
    setLoading(true);
    try {
      const pagosRes = await getPagos();
      const miembrosRes = await getMiembros();

      setPagos(pagosRes.data || []);
      setMiembros(miembrosRes.data.miembros || []);
    } catch (error) {
      console.error("Error cargando pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= REGISTRAR PAGO ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_miembro || !form.monto) {
      alert("Completa los campos obligatorios");
      return;
    }

    try {
      await registrarPago(form);
      setForm({
        id_miembro: "",
        monto: "",
        metodo_pago: "Efectivo",
        concepto: "Pago mensual",
      });
      setIsFormExpanded(false);
      loadData();
    } catch (error) {
      console.error("Error registrando pago:", error);
      alert("Error al registrar el pago");
    }
  };

  return (
    <div className="dashboard-content">
      {/* ================= HEADER ================= */}
      <div className="section-header">
        <h2 className="page-title">Gestión de Pagos</h2>
      </div>

      {/* ================= FORMULARIO COMPACTO ================= */}
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
                      <option key={m.id_miembro} value={m.id_miembro}>
                        {m.nombre} {m.apellido}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input-compact"
                    type="number"
                    placeholder="Monto"
                    value={form.monto}
                    onChange={(e) =>
                      setForm({ ...form, monto: e.target.value })
                    }
                    required
                  />
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

                  <input
                    className="input-compact"
                    placeholder="Concepto"
                    value={form.concepto}
                    onChange={(e) =>
                      setForm({ ...form, concepto: e.target.value })
                    }
                  />
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
          <p>Registra el primer pago para comenzar</p>
        </div>
      ) : (
        <div className="kpi-grid">
          {pagos.map((p) => (
            <div key={p.id_pago} className="stat-card">
              <div className="member-header">
                <div className="member-info">
                  <h4>{p.nombre_miembro}</h4>
                  <span className="status-badge normal">
                    {p.metodo_pago}
                  </span>
                </div>
              </div>

              <div className="member-details">
                <div className="detail-row">
                  💵 <strong>${p.monto}</strong>
                </div>
                <div className="detail-row">
                  🧾 {p.concepto}
                </div>
                <div className="detail-row">
                  📅 {new Date(p.fecha_pago).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
