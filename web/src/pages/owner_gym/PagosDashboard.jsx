import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getTodosMovimientos, getCategoriasVentas, editarPago, eliminarPago } from "../../api/pagos";
import { useToast } from "../../hooks/useToast";
import SelectorFecha from "../../components/compartido/SelectorFecha";
import "../../css/CSSUnificado.css";

/* ── Iconos SVG inline ── */
const MoneyIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>);
const CalendarIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
const TagIcon      = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>);
const CardIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>);
const CashIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>);
const CartIcon     = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.66a2 2 0 001.99-1.61L23 6H6"/></svg>);
const AwardIcon    = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>);
const GridIcon     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>);
const ListIcon     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>);
const ShopIcon     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>);
const ChevronLeft  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>);
const ChevronRight = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>);
const ReceiptIcon  = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>);
const FilterIcon   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const EditIcon     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon    = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

/* ── Helpers ── */
const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const formatMoney = (v) =>
  Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const formatFecha = (f) => {
  try { return new Date(f).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }); }
  catch { return f || "—"; }
};

/* Lunes a domingo de la semana que contiene `fechaStr` ("YYYY-MM-DD"). No es
   semana ISO -- solo "la semana de 7 días que incluye ese día", que es lo
   que el filtro necesita. */
const rangoSemana = (fechaStr) => {
  const [y, m, d] = fechaStr.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const dow = (base.getDay() + 6) % 7; // lunes = 0 ... domingo = 6
  const lunes = new Date(base); lunes.setDate(base.getDate() - dow);
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
  const fmt = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { desde: fmt(lunes), hasta: fmt(domingo) };
};

const hoyISO = () => new Date().toISOString().slice(0, 10);
const diasAtrasISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const METODO_ICONS = {
  Efectivo:          <CashIcon />,
  Tarjeta:           <CardIcon />,
  "Tarjeta debito":  <CardIcon />,
  "Tarjeta credito": <CardIcon />,
  Transferencia:     <MoneyIcon />,
  QR:                <MoneyIcon />,
};
const METODO_COLORS = {
  Efectivo:          { bg: "var(--success-bg)",    color: "var(--success)"      },
  Tarjeta:           { bg: "var(--info-bg)",        color: "var(--info)"         },
  "Tarjeta debito":  { bg: "var(--info-bg)",        color: "var(--info)"         },
  "Tarjeta credito": { bg: "var(--info-bg)",        color: "var(--info)"         },
  Transferencia:     { bg: "var(--accent-dim)",     color: "var(--accent-soft)"  },
  QR:                { bg: "rgba(168,85,247,.15)",  color: "#c084fc"             },
};
const metodoStyle = (m) => METODO_COLORS[m] || { bg: "rgba(255,255,255,.07)", color: "var(--text-secondary)" };
const metodoIcon  = (m) => METODO_ICONS[m]  || <MoneyIcon />;

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="stat-card" style={{ gap: 0, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
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

/* ── Tarjeta de movimiento ── */
function MovimientoCard({ m, onEdit, onDelete }) {
  const mc      = metodoStyle(m.metodo_pago);
  const icon    = metodoIcon(m.metodo_pago);
  const isVenta = m.tipo === "venta";

  const initials = (m.titulo || "?")
    .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="stat-card member-card-hover" style={{ gap: 0, padding: "18px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: isVenta ? "rgba(245,158,11,.15)" : "var(--accent-dim)",
            color:      isVenta ? "var(--warning)"              : "var(--accent-soft)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}>
            {isVenta ? <CartIcon /> : initials}
          </div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {m.titulo}
          </h4>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
          background: mc.bg, color: mc.color, flexShrink: 0,
        }}>
          {icon} {m.metodo_pago}
        </span>
      </div>

      {/* Monto */}
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent-soft)", letterSpacing: "-0.02em", marginBottom: 12 }}>
        {formatMoney(m.monto)}
      </div>

      {/* Detalle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div className="detail-row" style={{ fontSize: 12 }}>
          {isVenta ? <CartIcon /> : <AwardIcon />}
          <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.concepto || "—"}
          </span>
          {/* Badges: tipo + categoría */}
          <span style={{
            padding: "1px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
            background: isVenta ? "rgba(245,158,11,.15)" : "var(--accent-dim)",
            color: isVenta ? "var(--warning)" : "var(--accent-soft)",
            flexShrink: 0,
          }}>
            {isVenta ? "POS" : "Membresía"}
          </span>
        </div>
        {/* Categoría de producto (solo ventas) */}
        {isVenta && m.categoria && (
          <div className="detail-row" style={{ fontSize: 12 }}>
            <TagIcon />
            <span style={{ color: "var(--text-secondary)" }}>{m.categoria}</span>
          </div>
        )}
        {/* Referencia de transferencia -- para localizar el movimiento en el
            estado de cuenta del banco si hace falta conciliarlo. */}
        {m.metodo_pago === "Transferencia" && m.referencia && (
          <div className="detail-row" style={{ fontSize: 12 }}>
            <MoneyIcon />
            <span style={{ color: "var(--text-secondary)" }}>Ref: {m.referencia}</span>
          </div>
        )}
        <div className="detail-row" style={{ fontSize: 12 }}>
          <CalendarIcon />
          <span style={{ color: "var(--text-secondary)" }}>{formatFecha(m.fecha)}</span>
        </div>
      </div>

      {/* Corregir o eliminar -- solo pagos de membresía (ventas POS no se
          tocan aquí: implican stock y otro flujo de reversión). */}
      {!isVenta && (onEdit || onDelete) && (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", paddingTop: 12, marginTop: 10, borderTop: "1px solid var(--border)" }}>
          {onEdit && (
            <button onClick={() => onEdit(m)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              <EditIcon /> Corregir
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(m)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "none", background: "rgba(239,68,68,.12)", color: "var(--danger)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              <TrashIcon /> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Modal: corregir un pago ── */
function EditarPagoModal({ pago, onClose, onSaved, toast }) {
  const [metodo,     setMetodo]     = useState("Efectivo");
  const [monto,      setMonto]      = useState("");
  const [referencia, setReferencia] = useState("");
  const [fecha,      setFecha]      = useState("");
  const [hora,       setHora]       = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!pago) return;
    setMetodo(pago.metodo_pago || "Efectivo");
    setMonto(String(pago.monto ?? ""));
    setReferencia(pago.referencia || "");
    const f = pago.fecha ? new Date(pago.fecha) : null;
    if (f && !isNaN(f)) {
      setFecha(f.toISOString().slice(0, 10));
      setHora(f.toISOString().slice(11, 16));
    } else {
      setFecha(""); setHora("");
    }
  }, [pago]);

  if (!pago) return null;
  const esTransferencia = metodo === "Transferencia";
  const puedeGuardar = monto !== "" && Number(monto) > 0 && (!esTransferencia || referencia.trim() !== "");

  const inputSt = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px",
    background: "var(--bg-input)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none",
  };
  const labelSt = {
    display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
    textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 5,
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!puedeGuardar) return;
    setSaving(true);
    try {
      const payload = { monto: Number(monto), metodo_pago: metodo };
      payload.referencia = esTransferencia ? referencia.trim() : "";
      if (fecha) payload.fecha_pago = hora ? `${fecha}T${hora}` : fecha;
      await editarPago(pago.id, payload);
      toast.success("Pago corregido", "Se guardaron los cambios.");
      onSaved();
    } catch (err) {
      toast.error("No se pudo corregir", err.response?.data?.error || "Error interno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Corregir pago</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--text-secondary)" }}>{pago.titulo}</p>
        </div>
        <form onSubmit={submit} style={{ padding: "18px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelSt}>Monto</label>
            <input style={inputSt} type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} required />
          </div>
          <div>
            <label style={labelSt}>Método de pago</label>
            <select style={inputSt} value={metodo} onChange={e => setMetodo(e.target.value)}>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
          {esTransferencia && (
            <div>
              <label style={labelSt}>Referencia de la transferencia</label>
              <input style={inputSt} value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Folio o clave de rastreo" />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelSt}>Fecha del pago</label>
              <input style={inputSt} type="date" value={fecha} max={new Date().toISOString().slice(0, 10)} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label style={labelSt}>Hora</label>
              <input style={inputSt} type="time" value={hora} onChange={e => setHora(e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary,var(--text-secondary))", margin: 0, lineHeight: 1.4 }}>
            Si corriges la fecha y nadie ha renovado después de este pago, la membresía que activó se recorre junto con ella.
          </p>
          <button type="submit" disabled={!puedeGuardar || saving}
            style={{ width: "100%", padding: 11, borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, marginTop: 4, cursor: (!puedeGuardar || saving) ? "not-allowed" : "pointer", background: (!puedeGuardar || saving) ? "var(--bg-input)" : "var(--accent)", color: (!puedeGuardar || saving) ? "var(--text-secondary)" : "#fff" }}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" onClick={onClose}
            style={{ width: "100%", padding: 9, borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Confirmación simple (eliminar pago) ── */
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "28px 32px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "rgba(239,68,68,.15)", color: "var(--danger)", fontWeight: 700, cursor: "pointer" }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Pill de filtro ── */
function FilterPill({ active, onClick, children, color = "var(--accent)" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
        cursor: "pointer", transition: "all .15s",
        border: active ? `1.5px solid ${color}` : "1.5px solid var(--border)",
        background: active ? `${color}22` : "transparent",
        color: active ? color : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════ */
export default function PagosDashboard() {
  const navigate = useNavigate();
  const { toast, ToastPortal } = useToast();

  const [movimientos, setMovimientos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  // Importe de TODO el filtro, no solo de la página visible, y años con datos
  // para el selector de periodo. Ambos los calcula el backend.
  const [montoTotal,  setMontoTotal]  = useState(0);
  const [anios,       setAnios]       = useState([]);

  // Corregir / eliminar un pago de membresía mal registrado.
  const [editando,       setEditando]       = useState(null); // movimiento o null
  const [confirmEliminar, setConfirmEliminar] = useState(null); // movimiento o null
  const [eliminando,     setEliminando]     = useState(false);

  // Filtros
  const [tipoFiltro,  setTipoFiltro]  = useState("todos");   // todos | membresia | venta
  const [catFiltro,   setCatFiltro]   = useState("");         // "" | nombre categoría
  const [anio,        setAnio]        = useState(0);          // 0 = histórico completo
  const [mes,         setMes]         = useState(0);          // 0 = año completo
  // Granularidad del periodo: "anio" es el flujo clásico (Todo/Año/Mes);
  // "dia" y "semana" usan un rango libre (desde/hasta) que el backend ya
  // soporta en /api/pagos/todos.
  const [modoPeriodo, setModoPeriodo] = useState("anio");      // anio | dia | semana
  const [fechaDia,    setFechaDia]    = useState(hoyISO);
  const [fechaSemana, setFechaSemana] = useState(hoyISO);

  // Cargar categorías cuando se activa el filtro POS
  useEffect(() => {
    if (tipoFiltro === "venta" && categorias.length === 0) {
      getCategoriasVentas()
        .then(r => setCategorias(r.categorias || []))
        .catch(() => {});
    }
  }, [tipoFiltro]); // eslint-disable-line

  // Traduce el modo de periodo activo a lo que entiende la API: desde/hasta
  // para día y semana, anio/mes para el flujo clásico.
  const calcularPeriodo = (
    modo = modoPeriodo, a = anio, m = mes, fd = fechaDia, fs = fechaSemana,
  ) => {
    if (modo === "dia")    return { desde: fd, hasta: fd };
    if (modo === "semana") return rangoSemana(fs);
    return { anio: a, mes: m };
  };

  const loadData = useCallback(async (
    page = 1, tipo = tipoFiltro, cat = catFiltro, periodo = calcularPeriodo(),
  ) => {
    setLoading(true);
    try {
      const params = { page, tipo, categoria: cat, per_page: 10 };
      if (periodo.desde && periodo.hasta) {
        params.desde = periodo.desde;
        params.hasta = periodo.hasta;
      } else if (periodo.anio) {
        params.anio = periodo.anio;
        if (periodo.mes) params.mes = periodo.mes;
      }

      const res = await getTodosMovimientos(params);

      setMovimientos(res.movimientos || []);
      setPagination({ page: res.page, pages: res.pages, total: res.total });
      setMontoTotal(res.monto_total ?? 0);
      if (Array.isArray(res.anios) && res.anios.length) setAnios(res.anios);
    } catch (err) {
      const status = err.response?.status;
      // 401/403 es esperado en gym nuevo (sin pagos aún)
      if (status !== 401 && status !== 403) {
        console.error(err);
        toast.error("Error de conexión", "No se pudieron cargar los movimientos.");
      }
      setMovimientos([]);
      setMontoTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro, catFiltro, anio, mes, modoPeriodo, fechaDia, fechaSemana]); // eslint-disable-line

  // Carga inicial
  useEffect(() => { loadData(1, "todos", "", { anio: 0, mes: 0 }); }, []); // eslint-disable-line

  // Cualquier cambio de filtro vuelve a la primera página: quedarse en la 5
  // de un filtro que ahora tiene 2 páginas mostraría una lista vacía.
  const handleTipo = (nuevoTipo) => {
    setTipoFiltro(nuevoTipo);
    setCatFiltro("");
    loadData(1, nuevoTipo, "", calcularPeriodo());
  };

  const handleCategoria = (cat) => {
    const nueva = cat === catFiltro ? "" : cat; // toggle
    setCatFiltro(nueva);
    loadData(1, "venta", nueva, calcularPeriodo());
  };

  const handlePeriodo = (nuevoAnio, nuevoMes) => {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    loadData(1, tipoFiltro, catFiltro, { anio: nuevoAnio, mes: nuevoMes });
  };

  // Cambiar de granularidad (Año/Mes ↔ Día ↔ Semana) vuelve a pedir con la
  // fecha que ya estuviera elegida en ese modo -- no hace falta "Aplicar".
  const handleModo = (nuevoModo) => {
    setModoPeriodo(nuevoModo);
    loadData(1, tipoFiltro, catFiltro, calcularPeriodo(nuevoModo));
  };

  const handleFechaDia = (valor) => {
    setFechaDia(valor);
    loadData(1, tipoFiltro, catFiltro, { desde: valor, hasta: valor });
  };

  const handleFechaSemana = (valor) => {
    setFechaSemana(valor);
    loadData(1, tipoFiltro, catFiltro, rangoSemana(valor));
  };

  const handlePage = (p) => loadData(p, tipoFiltro, catFiltro, calcularPeriodo());

  const handleEliminar = (m) => {
    setConfirmEliminar(m);
  };

  const confirmarEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      await eliminarPago(confirmEliminar.id);
      toast.success("Pago eliminado", "El historial y la membresía quedaron revertidos.");
      setConfirmEliminar(null);
      loadData(pagination.page, tipoFiltro, catFiltro, calcularPeriodo());
    } catch (err) {
      toast.error("No se pudo eliminar", err.response?.data?.error || "Error interno.");
    } finally {
      setEliminando(false);
    }
  };

  const rangoSemanaActual = modoPeriodo === "semana" ? rangoSemana(fechaSemana) : null;

  const etiquetaPeriodo = modoPeriodo === "dia"
    ? `día ${formatFecha(fechaDia)}`
    : modoPeriodo === "semana"
    ? `semana del ${formatFecha(rangoSemanaActual.desde)} al ${formatFecha(rangoSemanaActual.hasta)}`
    : !anio
    ? "histórico completo"
    : !mes ? `año ${anio}` : `${MESES_CORTOS[mes - 1]} ${anio}`;

  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <h2 className="page-title">Gestión de Pagos</h2>
          {pagination.total > 0 && (
            <span className="total-count">{pagination.total} registros</span>
          )}
        </div>
        <button className="btn-primary" onClick={() => navigate("/owner/cobrar")}>
          Cobrar Membresía
        </button>
      </div>

      {/* ── Barra de filtros ── */}
      <div data-guide="ow-pay-filtros" style={{
        display: "flex", flexDirection: "column", gap: 10,
        marginBottom: 20,
        padding: "14px 16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}>
        {/* Fila 1: tipo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
            <FilterIcon /> Filtrar:
          </span>
          <FilterPill active={tipoFiltro === "todos"}     onClick={() => handleTipo("todos")}     color="var(--accent)">
            <GridIcon /> Todos
          </FilterPill>
          <FilterPill active={tipoFiltro === "membresia"} onClick={() => handleTipo("membresia")} color="var(--accent-soft)">
            <ListIcon /> Membresías
          </FilterPill>
          <FilterPill active={tipoFiltro === "venta"}     onClick={() => handleTipo("venta")}     color="var(--warning)">
            <ShopIcon /> Productos POS
          </FilterPill>
        </div>

        {/* Granularidad del periodo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
            Ver por:
          </span>
          <FilterPill active={modoPeriodo === "anio"}   onClick={() => handleModo("anio")}>Mes / Año</FilterPill>
          <FilterPill active={modoPeriodo === "semana"} onClick={() => handleModo("semana")}>Semana</FilterPill>
          <FilterPill active={modoPeriodo === "dia"}    onClick={() => handleModo("dia")}>Día</FilterPill>
        </div>

        {/* Periodo: año y, si hay uno elegido, mes */}
        {modoPeriodo === "anio" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
                Periodo:
              </span>
              <FilterPill active={anio === 0} onClick={() => handlePeriodo(0, 0)}>
                Todo
              </FilterPill>
              {(anios.length ? anios : [new Date().getFullYear()]).map((a) => (
                <FilterPill key={a} active={anio === a} onClick={() => handlePeriodo(a, mes)}>
                  {a}
                </FilterPill>
              ))}
            </div>

            {anio !== 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
                  Mes:
                </span>
                <FilterPill active={mes === 0} onClick={() => handlePeriodo(anio, 0)}>
                  Año
                </FilterPill>
                {MESES_CORTOS.map((m, i) => (
                  <FilterPill key={m} active={mes === i + 1} onClick={() => handlePeriodo(anio, i + 1)}>
                    {m}
                  </FilterPill>
                ))}
              </div>
            )}
          </>
        )}

        {/* Día: fecha exacta, con atajos para hoy/ayer */}
        {modoPeriodo === "dia" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
              Día:
            </span>
            <FilterPill active={fechaDia === hoyISO()} onClick={() => handleFechaDia(hoyISO())}>Hoy</FilterPill>
            <FilterPill active={fechaDia === diasAtrasISO(1)} onClick={() => handleFechaDia(diasAtrasISO(1))}>Ayer</FilterPill>
            <SelectorFecha
              modo="dia"
              value={fechaDia}
              max={hoyISO()}
              onChange={handleFechaDia}
              label={formatFecha(fechaDia)}
            />
          </div>
        )}

        {/* Semana: cualquier día dentro de ella -- se muestra el lunes a domingo resultante */}
        {modoPeriodo === "semana" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginRight: 4 }}>
              Semana:
            </span>
            <FilterPill active={fechaSemana === hoyISO()} onClick={() => handleFechaSemana(hoyISO())}>Esta semana</FilterPill>
            <FilterPill active={fechaSemana === diasAtrasISO(7)} onClick={() => handleFechaSemana(diasAtrasISO(7))}>Semana pasada</FilterPill>
            <SelectorFecha
              modo="semana"
              value={fechaSemana}
              max={hoyISO()}
              onChange={handleFechaSemana}
              label={rangoSemanaActual
                ? `${formatFecha(rangoSemanaActual.desde)} – ${formatFecha(rangoSemanaActual.hasta)}`
                : "Elegir semana"}
            />
          </div>
        )}

        {/* Fila 2: categorías (sólo cuando tipo = venta y hay categorías) */}
        {tipoFiltro === "venta" && categorias.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            paddingTop: 10, borderTop: "1px solid var(--border,rgba(255,255,255,.06))",
          }}>
            <span style={{ fontSize: 11, color: "var(--text-tertiary,var(--text-tertiary))", fontWeight: 600, marginRight: 2 }}>
              Categoría:
            </span>
            <FilterPill active={catFiltro === ""} onClick={() => handleCategoria("")} color="var(--text-secondary)">
              Todas
            </FilterPill>
            {categorias.map(cat => (
              <FilterPill
                key={cat}
                active={catFiltro === cat}
                onClick={() => handleCategoria(cat)}
                color="var(--warning)"
              >
                <TagIcon /> {cat}
              </FilterPill>
            ))}
          </div>
        )}
      </div>

      {/* ── Total del filtro ──
          Suma TODOS los movimientos que cumplen el filtro, no solo los de la
          página en pantalla: el backend lo calcula sobre la consulta completa. */}
      {movimientos.length > 0 && (
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
          padding: "16px 20px", marginBottom: 18,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              Total del filtro
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--text-tertiary, var(--text-secondary))" }}>
              {pagination.total} movimiento{pagination.total === 1 ? "" : "s"} · {etiquetaPeriodo}
              {tipoFiltro !== "todos" && ` · ${tipoFiltro === "venta" ? "POS" : "membresías"}`}
              {catFiltro && ` · ${catFiltro}`}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>
            {formatMoney(montoTotal)}
          </p>
        </div>
      )}

      {/* ── Lista ── */}
      {loading && movimientos.length === 0 ? (
        <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : movimientos.length === 0 ? (
        <div className="empty-state" style={{ padding: "64px 24px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--text-tertiary)" }}>
            <ReceiptIcon />
          </div>
          <h3 style={{ marginBottom: 8 }}>Sin resultados</h3>
          <p style={{ marginBottom: 24 }}>
            {tipoFiltro === "venta" && catFiltro
              ? `No hay ventas en la categoría "${catFiltro}".`
              : "No hay movimientos para este filtro."}
          </p>
        </div>
      ) : (
        <>
          <div data-guide="ow-pay-historial" className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {movimientos.map(m => (
              <MovimientoCard key={m.id} m={m}
                onEdit={m.tipo === "membresia" ? setEditando : null}
                onDelete={m.tipo === "membresia" ? handleEliminar : null}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn-outline-small"
                onClick={() => handlePage(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <ChevronLeft /> Anterior
              </button>
              <span className="page-info">Página {pagination.page} de {pagination.pages}</span>
              <button
                className="btn-outline-small"
                onClick={() => handlePage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages || loading}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                Siguiente <ChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      <EditarPagoModal
        pago={editando}
        onClose={() => setEditando(null)}
        onSaved={() => { setEditando(null); loadData(pagination.page, tipoFiltro, catFiltro, calcularPeriodo()); }}
        toast={toast}
      />

      <ConfirmDialog
        open={Boolean(confirmEliminar)}
        title={`¿Eliminar este pago?`}
        message={`Se eliminará el pago de "${confirmEliminar?.titulo || ""}" y, si activó una membresía, esta volverá a su estado anterior. Esta acción no se puede deshacer.`}
        onConfirm={confirmarEliminar}
        onCancel={() => !eliminando && setConfirmEliminar(null)}
      />
    </div>
  );
}
