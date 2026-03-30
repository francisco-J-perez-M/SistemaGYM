// PagosDashboard.jsx — versión mejorada
// Cambios principales:
//   • Reemplaza alert/confirm → useToast
//   • Cards de pago con mejor diseño y jerarquía
//   • Skeleton loader
//   • Formulario con feedback visual en cada campo

import { useState, useEffect } from "react";
import { getPagos, registrarPago } from "../api/pagos";
import { getMiembros } from "../api/miembros";
import { getMembresias } from "../api/membresias";
import { useToast } from "../hooks/useToast";
import "../css/CSSUnificado.css";

/* ── Iconos ── */
const PlusIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>);
const CloseIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const MoneyIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>);
const CalendarIcon= () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
const UserIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const TagIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>);
const CardIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>);
const CashIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a3 3 0 100-6 3 3 0 000 6z" fill="none"/></svg>);
const ChevronLeft = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>);
const ChevronRight= () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>);
const ReceiptIcon = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>);

/* ── Helpers ── */
const formatMoney = (v) =>
  Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatFecha = (f) =>
  new Date(f).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

const METODO_ICONS = { Efectivo: <CashIcon />, Tarjeta: <CardIcon />, Transferencia: <MoneyIcon /> };
const METODO_COLORS = {
  Efectivo:      { bg: "var(--success-bg)", color: "var(--success)" },
  Tarjeta:       { bg: "var(--info-bg)",    color: "var(--info)"    },
  Transferencia: { bg: "var(--accent-dim)", color: "var(--accent-soft)" },
};

/* ── Skeleton ── */
function SkeletonPaymentCard() {
  return (
    <div className="stat-card" style={{ gap: 0, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 20, width: 44, borderRadius: 10 }} />
        </div>
        <div className="skeleton" style={{ height: 30, width: 80, borderRadius: 20 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ height: 11, width: "45%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: "35%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ── Tarjeta de pago ── */
function PaymentCard({ p }) {
  const mc = METODO_COLORS[p.metodo_pago] || METODO_COLORS.Efectivo;
  const icon = METODO_ICONS[p.metodo_pago] || <MoneyIcon />;

  return (
    <div className="stat-card member-card-hover" style={{ gap: 0, padding: "18px 20px" }}>
      {/* Encabezado: Nombre + Método */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--accent-dim)", color: "var(--accent-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {(p.nombre_miembro || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()}
            </div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {p.nombre_miembro}
            </h4>
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: mc.bg, color: mc.color,
        }}>
          {icon} {p.metodo_pago}
        </span>
      </div>

      {/* Monto destacado */}
      <div style={{
        fontSize: 26, fontWeight: 800, color: "var(--accent-soft)",
        letterSpacing: "-0.02em", marginBottom: 12,
      }}>
        {formatMoney(p.monto)}
      </div>

      {/* Detalles */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 7,
        paddingTop: 12, borderTop: "1px solid var(--border)",
      }}>
        <div className="detail-row" style={{ fontSize: 12 }}>
          <TagIcon /> <span style={{ color: "var(--text-secondary)" }}>{p.concepto}</span>
        </div>
        <div className="detail-row" style={{ fontSize: 12 }}>
          <CalendarIcon />
          <span style={{ color: "var(--text-secondary)" }}>{formatFecha(p.fecha_pago)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
export default function PagosDashboard() {
  const { toast, ToastPortal } = useToast();

  const [pagos, setPagos]           = useState([]);
  const [miembros, setMiembros]     = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [formOpen, setFormOpen]     = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [form, setForm] = useState({
    id_miembro: "", id_membresia: "",
    metodo_pago: "Efectivo", numero_tarjeta: "",
  });

  /* ── Carga ── */
  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const pagosRes = await getPagos(page);
      try {
        const mr = await getMiembros();
        setMiembros(mr.data.miembros || []);
      } catch { /* silente */ }
      try {
        const mem = await getMembresias();
        setMembresias(mem.data || []);
      } catch { /* silente */ }

      setPagos(pagosRes.pagos || []);
      setPagination({ page: pagosRes.page, pages: pagosRes.pages, total: pagosRes.total });
    } catch {
      toast.error("Error de conexión", "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ── Registrar pago ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_miembro || !form.id_membresia) {
      toast.warning("Campos incompletos", "Selecciona un miembro y una membresía.");
      return;
    }
    if (form.metodo_pago === "Tarjeta" && !form.numero_tarjeta.trim()) {
      toast.warning("Número de tarjeta", "Ingresa el número de tarjeta para continuar.");
      return;
    }

    setSubmitting(true);
    try {
      await registrarPago({
        id_miembro:    Number(form.id_miembro),
        id_membresia:  Number(form.id_membresia),
        metodo_pago:   form.metodo_pago,
        numero_tarjeta: form.metodo_pago === "Tarjeta" ? form.numero_tarjeta : undefined,
      });
      toast.success("Pago registrado", "El pago fue guardado exitosamente.");
      setForm({ id_miembro: "", id_membresia: "", metodo_pago: "Efectivo", numero_tarjeta: "" });
      setFormOpen(false);
      loadData(1);
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar el pago";
      toast.error("Error al registrar", msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="dashboard-content">
      <ToastPortal />

      <div className="section-header">
        <h2 className="page-title">Gestión de Pagos</h2>
        {pagination.total > 0 && (
          <span className="total-count">{pagination.total} registros</span>
        )}
      </div>

      {/* ── Formulario colapsable ── */}
      <div className="compact-form-section">
        <div className="compact-form-card" style={{ borderLeftColor: formOpen ? "var(--accent)" : "var(--border)" }}>
          <div className="compact-form-header" onClick={() => setFormOpen(o => !o)}>
            <div className="compact-form-title">
              <MoneyIcon />
              <h3>Registrar nuevo pago</h3>
            </div>
            <button
              type="button" className="icon-btn small"
              onClick={(e) => { e.stopPropagation(); setFormOpen(o => !o); }}
            >
              {formOpen ? <CloseIcon /> : <PlusIcon />}
            </button>
          </div>

          {formOpen && (
            <form onSubmit={handleSubmit} className="compact-form">
              <div className="compact-form-grid">
                <div className="form-group compact">
                  <label className="form-label-compact">
                    <UserIcon /> Miembro
                  </label>
                  <select
                    className="input-compact"
                    value={form.id_miembro}
                    onChange={(e) => setForm({ ...form, id_miembro: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar miembro...</option>
                    {miembros.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group compact">
                  <label className="form-label-compact">
                    <TagIcon /> Membresía
                  </label>
                  <select
                    className="input-compact"
                    value={form.id_membresia}
                    onChange={(e) => setForm({ ...form, id_membresia: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar membresía...</option>
                    {membresias.map((m) => (
                      <option key={m.id_membresia} value={m.id_membresia}>
                        {m.nombre} · {m.duracion_meses} meses · ${m.precio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="compact-form-grid">
                <div className="form-group compact">
                  <label className="form-label-compact">Método de pago</label>
                  <select
                    className="input-compact"
                    value={form.metodo_pago}
                    onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}
                  >
                    <option value="Efectivo">💵 Efectivo</option>
                    <option value="Tarjeta">💳 Tarjeta</option>
                    <option value="Transferencia">🔄 Transferencia</option>
                  </select>
                </div>

                {form.metodo_pago === "Tarjeta" && (
                  <div className="form-group compact">
                    <label className="form-label-compact">Número de tarjeta</label>
                    <input
                      className="input-compact"
                      placeholder="**** **** **** ****"
                      value={form.numero_tarjeta}
                      onChange={(e) => setForm({ ...form, numero_tarjeta: e.target.value })}
                      maxLength={19}
                    />
                  </div>
                )}
              </div>

              <div className="compact-form-actions-bottom">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  className="btn-compact-primary"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><span className="spinner-small" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> Registrando...</>
                  ) : (
                    <><MoneyIcon /> Registrar Pago</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Lista ── */}
      {loading && pagos.length === 0 ? (
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[0,1,2,3,4,5].map(i => <SkeletonPaymentCard key={i} />)}
        </div>
      ) : pagos.length === 0 ? (
        <div className="empty-state" style={{ padding: "64px 24px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--bg-input)", display: "flex",
            alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", color: "var(--text-tertiary)",
          }}>
            <ReceiptIcon />
          </div>
          <h3 style={{ marginBottom: 8 }}>Sin pagos registrados</h3>
          <p style={{ marginBottom: 24 }}>Registra el primer pago usando el formulario de arriba.</p>
          <button className="btn-compact-primary" onClick={() => setFormOpen(true)}>
            <PlusIcon /> Registrar pago
          </button>
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {pagos.map((p) => <PaymentCard key={p.id_pago} p={p} />)}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn-outline-small"
                onClick={() => loadData(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ChevronLeft /> Anterior
              </button>
              <span className="page-info">Página {pagination.page} de {pagination.pages}</span>
              <button
                className="btn-outline-small"
                onClick={() => loadData(pagination.page + 1)}
                disabled={pagination.page === pagination.pages || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                Siguiente <ChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}