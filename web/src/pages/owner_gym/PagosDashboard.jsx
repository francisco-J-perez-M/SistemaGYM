import { useState, useEffect, useCallback } from "react";
import { getTodosMovimientos, getCategoriasVentas } from "../../api/pagos";
import { useToast } from "../../hooks/useToast";
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
function MovimientoCard({ m }) {
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
        <div className="detail-row" style={{ fontSize: 12 }}>
          <CalendarIcon />
          <span style={{ color: "var(--text-secondary)" }}>{formatFecha(m.fecha)}</span>
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
  const { toast, ToastPortal } = useToast();

  const [movimientos, setMovimientos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  // Importe de TODO el filtro, no solo de la página visible, y años con datos
  // para el selector de periodo. Ambos los calcula el backend.
  const [montoTotal,  setMontoTotal]  = useState(0);
  const [anios,       setAnios]       = useState([]);

  // Filtros
  const [tipoFiltro,  setTipoFiltro]  = useState("todos");   // todos | membresia | venta
  const [catFiltro,   setCatFiltro]   = useState("");         // "" | nombre categoría
  const [anio,        setAnio]        = useState(0);          // 0 = histórico completo
  const [mes,         setMes]         = useState(0);          // 0 = año completo

  // Cargar categorías cuando se activa el filtro POS
  useEffect(() => {
    if (tipoFiltro === "venta" && categorias.length === 0) {
      getCategoriasVentas()
        .then(r => setCategorias(r.categorias || []))
        .catch(() => {});
    }
  }, [tipoFiltro]); // eslint-disable-line

  const loadData = useCallback(async (
    page = 1, tipo = tipoFiltro, cat = catFiltro, a = anio, m = mes,
  ) => {
    setLoading(true);
    try {
      const params = { page, tipo, categoria: cat, per_page: 10 };
      if (a) params.anio = a;
      if (a && m) params.mes = m;

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
  }, [tipoFiltro, catFiltro, anio, mes]); // eslint-disable-line

  // Carga inicial
  useEffect(() => { loadData(1, "todos", "", 0, 0); }, []); // eslint-disable-line

  // Cualquier cambio de filtro vuelve a la primera página: quedarse en la 5
  // de un filtro que ahora tiene 2 páginas mostraría una lista vacía.
  const handleTipo = (nuevoTipo) => {
    setTipoFiltro(nuevoTipo);
    setCatFiltro("");
    loadData(1, nuevoTipo, "", anio, mes);
  };

  const handleCategoria = (cat) => {
    const nueva = cat === catFiltro ? "" : cat; // toggle
    setCatFiltro(nueva);
    loadData(1, "venta", nueva, anio, mes);
  };

  const handlePeriodo = (nuevoAnio, nuevoMes) => {
    setAnio(nuevoAnio);
    setMes(nuevoMes);
    loadData(1, tipoFiltro, catFiltro, nuevoAnio, nuevoMes);
  };

  const handlePage = (p) => loadData(p, tipoFiltro, catFiltro, anio, mes);

  const etiquetaPeriodo = !anio
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

        {/* Periodo: año y, si hay uno elegido, mes */}
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
            {movimientos.map(m => <MovimientoCard key={m.id} m={m} />)}
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
    </div>
  );
}
