import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getPagos, registrarPago } from "../../api/pagos";
import { getMiembros } from "../../api/miembros";
import { getMembresias } from "../../api/membresias";
import { useToast } from "../../hooks/useToast";
import "../../css/CSSUnificado.css";

/* ── Iconos ── */
const PlusIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>);
const CloseIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>);
const MoneyIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>);
const CalendarIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
const UserIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const TagIcon      = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>);
const CardIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>);
const CashIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a3 3 0 100-6 3 3 0 000 6z" fill="none"/></svg>);
const ChevronLeft  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>);
const ChevronRight = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>);
const ReceiptIcon  = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>);

/* ── Helpers ── */
const formatMoney = (v) =>
  Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatFecha = (f) =>
  new Date(f).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

const METODO_ICONS  = { Efectivo: <CashIcon />, Tarjeta: <CardIcon />, Transferencia: <MoneyIcon /> };
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
      </div>
    </div>
  );
}

/* ── Tarjeta de pago ── */
function PaymentCard({ p }) {
  const mc   = METODO_COLORS[p.metodo_pago] || METODO_COLORS.Efectivo;
  const icon = METODO_ICONS[p.metodo_pago]  || <MoneyIcon />;
  return (
    <div className="stat-card member-card-hover" style={{ gap: 0, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--accent-dim)", color: "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}>
            {(p.nombre_miembro || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
          </div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {p.nombre_miembro}
          </h4>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: mc.bg, color: mc.color,
        }}>
          {icon} {p.metodo_pago}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent-soft)", letterSpacing: "-0.02em", marginBottom: 12 }}>
        {formatMoney(p.monto)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
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
   MODAL DE REGISTRO DE PAGO
═══════════════════════════════════════════════ */
const EMPTY_FORM = { id_miembro: "", id_membresia: "", metodo_pago: "Efectivo", numero_tarjeta: "", referencia: "" };

function PagoModal({ miembros, membresias, onClose, onSuccess }) {
  const { toast, ToastPortal } = useToast();
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPass,   setShowPass]   = useState(false);

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_miembro || !form.id_membresia) {
      toast.warning("Campos incompletos", "Selecciona un miembro y una membresía.");
      return;
    }
    if (form.metodo_pago === "Tarjeta" && !form.numero_tarjeta.trim()) {
      toast.warning("Número de tarjeta", "Ingresa el número de tarjeta.");
      return;
    }
    if (form.metodo_pago === "Transferencia" && !form.referencia.trim()) {
      toast.warning("Referencia", "Ingresa la referencia de la transferencia.");
      return;
    }

    setSubmitting(true);
    try {
      await registrarPago({
        id_miembro:     Number(form.id_miembro),
        id_membresia:   Number(form.id_membresia),
        metodo_pago:    form.metodo_pago,
        numero_tarjeta: form.metodo_pago === "Tarjeta"        ? form.numero_tarjeta : undefined,
        referencia:     form.metodo_pago === "Transferencia"  ? form.referencia     : undefined,
      });
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al registrar el pago";
      toast.error("Error al registrar", msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Estilos del modal ── */
  const inputSt = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px",
    background: "var(--bg-dark, #0f1117)",
    border: "1px solid var(--border, rgba(255,255,255,.12))",
    borderRadius: 8,
    color: "var(--text-primary, #f1f5f9)",
    fontSize: 14, outline: "none",
  };

  const labelSt = {
    display: "block", fontSize: 12, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em",
    color: "var(--text-secondary, #94a3b8)", marginBottom: 6,
  };

  return createPortal(
    <>
      <ToastPortal />
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,.6)", backdropFilter: "blur(3px)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        pointerEvents: "none",
      }}>
        <div style={{
          pointerEvents: "auto",
          width: "100%", maxWidth: 520,
          background: "var(--bg-card, #1e2233)",
          border: "1px solid var(--border, rgba(255,255,255,.1))",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,.5)",
          overflow: "hidden",
        }}>
          {/* Header del modal */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border, rgba(255,255,255,.08))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "var(--accent-dim, rgba(99,102,241,.15))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--accent-soft, #818cf8)",
              }}>
                <MoneyIcon />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>
                  Registrar nuevo pago
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary, #94a3b8)" }}>
                  Asigna el pago a un miembro y membresía
                </p>
              </div>
            </div>
            <button
              type="button" onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "var(--bg-input, rgba(255,255,255,.06))",
                color: "var(--text-secondary, #94a3b8)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Miembro */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelSt}><UserIcon style={{ display: "inline" }} /> Miembro</label>
                <select style={inputSt} value={form.id_miembro}
                  onChange={e => setField("id_miembro", e.target.value)} required>
                  <option value="">Seleccionar miembro…</option>
                  {miembros.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                </select>
              </div>

              {/* Membresía */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelSt}><TagIcon style={{ display: "inline" }} /> Membresía</label>
                <select style={inputSt} value={form.id_membresia}
                  onChange={e => setField("id_membresia", e.target.value)} required>
                  <option value="">Seleccionar membresía…</option>
                  {membresias.map(m => (
                    <option key={m.id_membresia} value={m.id_membresia}>
                      {m.nombre} · {m.duracion_meses} meses · ${m.precio}
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de pago */}
              <div>
                <label style={labelSt}>Método de pago</label>
                <select style={inputSt} value={form.metodo_pago}
                  onChange={e => setField("metodo_pago", e.target.value)}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Tarjeta">💳 Tarjeta</option>
                  <option value="Transferencia">🔄 Transferencia</option>
                </select>
              </div>

              {/* Campo condicional según método */}
              {form.metodo_pago === "Tarjeta" && (
                <div>
                  <label style={labelSt}>Número de tarjeta</label>
                  <input
                    style={inputSt}
                    placeholder="**** **** **** ****"
                    value={form.numero_tarjeta}
                    onChange={e => setField("numero_tarjeta", e.target.value)}
                    maxLength={19}
                  />
                </div>
              )}
              {form.metodo_pago === "Transferencia" && (
                <div>
                  <label style={labelSt}>Referencia / CLABE</label>
                  <input
                    style={inputSt}
                    placeholder="Referencia de transferencia"
                    value={form.referencia}
                    onChange={e => setField("referencia", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border, rgba(255,255,255,.08))" }}>
              <button
                type="button" onClick={onClose} disabled={submitting}
                style={{
                  padding: "9px 18px", borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--border, rgba(255,255,255,.12))",
                  color: "var(--text-secondary, #94a3b8)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={submitting}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 22px", borderRadius: 8,
                  background: "var(--accent, #6366f1)",
                  border: "none",
                  color: "#fff", cursor: "pointer",
                  fontSize: 14, fontWeight: 700,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting
                  ? <><span className="spinner-small" style={{ borderColor: "rgba(255,255,255,.3)", borderTopColor: "#fff" }} /> Registrando…</>
                  : <><MoneyIcon /> Registrar pago</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
export default function PagosDashboard() {
  const { toast, ToastPortal } = useToast();

  const [pagos,      setPagos]      = useState([]);
  const [miembros,   setMiembros]   = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);

  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  /* ── Carga de datos ── */
  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const pagosRes = await getPagos(page);

      // Carga paralela de auxiliares (silenciosa si falla)
      await Promise.allSettled([
        getMiembros().then(r => setMiembros(r.data?.miembros || [])),
        getMembresias().then(r => setMembresias(r.data || [])),
      ]);

      setPagos(pagosRes.pagos || []);
      setPagination({ page: pagosRes.page, pages: pagosRes.pages, total: pagosRes.total });
    } catch {
      toast.error("Error de conexión", "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Callback tras éxito del modal ── */
  const handleSuccess = () => {
    setModalOpen(false);
    toast.success("Pago registrado", "El pago fue guardado exitosamente.");
    loadData(1);
  };

  /* ── Render ── */
  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="page-title">Gestión de Pagos</h2>
          {pagination.total > 0 && (
            <span className="total-count">{pagination.total} registros</span>
          )}
        </div>
        <button
          className="btn-compact-primary"
          onClick={() => setModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <PlusIcon /> Registrar pago
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <PagoModal
          miembros={miembros}
          membresias={membresias}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Lista de pagos */}
      {loading && pagos.length === 0 ? (
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[0, 1, 2, 3, 4, 5].map(i => <SkeletonPaymentCard key={i} />)}
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
          <p style={{ marginBottom: 24 }}>Registra el primer pago con el botón de arriba.</p>
          <button className="btn-compact-primary" onClick={() => setModalOpen(true)}>
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
