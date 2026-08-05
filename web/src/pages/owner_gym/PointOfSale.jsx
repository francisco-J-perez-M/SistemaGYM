/**
 * PointOfSale.jsx — POS del owner_gym.
 *
 * Tabs:
 *   "venta"     — carrito + checkout modal + ticket
 *   "productos" — CRUD del catalogo con imagenes
 *
 * Modales extraidos a archivos propios:
 *   POSProductoModal, POSCheckoutModal, POSTicketModal
 */
import { useState, useEffect, useCallback } from "react";
import {
  FiShoppingCart, FiPlus, FiMinus, FiTrash2,
  FiPackage, FiEdit2, FiDollarSign, FiTag, FiInfo,
  FiAlertTriangle, FiXCircle, FiChevronDown, FiChevronUp,
  FiClock, FiChevronLeft, FiChevronRight, FiCreditCard, FiUser,
  FiFileText,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { getProductos, toggleProducto, eliminarProducto, getMiembros, getVentas } from "../../api/owner_gym";
import { reconciliarSilencioso } from "../../api/pagosOnline";
import ProductoModal       from "./POSProductoModal";
import ProductoDetailModal from "./POSProductoDetailModal";
import CheckoutModal       from "./POSCheckoutModal";
import TicketModal         from "./POSTicketModal";

/* ── Helpers ─────────────────────────────── */
const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
const LOW_STOCK = 5; // umbral de "stock bajo"

/* Helper: detectar si el usuario logueado es miembro */
function getIsMiembro() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.role === "Miembro" || u.role === "user";
  } catch { return false; }
}

const CAT_COLORS = {
  Suplementos: "var(--accent)", Accesorios: "var(--success)", Snacks: "var(--warning)",
  Bebidas: "#38bdf8",     Ropa: "#f472b6",        General: "var(--text-secondary)",
};
const catColor = (cat) => CAT_COLORS[cat] || "var(--text-secondary)";

/* ── Estilos compartidos ─────────────────── */
const cardSt = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12, ...extra,
});
const inputSt = {
  boxSizing: "border-box", padding: "8px 12px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none",
};
const filterBtnSt = (active) => ({
  padding: "5px 12px", borderRadius: 99, border: active ? "none" : "1px solid var(--border)",
  cursor: "pointer", fontSize: 12, fontWeight: 600,
  background: active ? "var(--accent)" : "var(--bg-card)",
  color: active ? "#fff" : "var(--text-secondary)",
});

/* ── StockAlertBar ───────────────────────── */
function StockAlertBar({ productos }) {
  const [open, setOpen] = useState(true);

  const sinStock  = productos.filter(p => p.activo && p.stock === 0);
  const stockBajo = productos.filter(p => p.activo && p.stock > 0 && p.stock <= LOW_STOCK);

  if (sinStock.length === 0 && stockBajo.length === 0) return null;

  return (
    <div style={{
      borderRadius: 10, overflow: "hidden", flexShrink: 0,
      border: `1px solid ${sinStock.length ? "rgba(239,68,68,.35)" : "rgba(234,179,8,.35)"}`,
      background: sinStock.length ? "rgba(239,68,68,.07)" : "rgba(234,179,8,.07)",
    }}>
      {/* Cabecera */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
          color: sinStock.length ? "var(--danger)" : "var(--warning)", textAlign: "left",
        }}
      >
        {sinStock.length
          ? <FiXCircle size={15} />
          : <FiAlertTriangle size={15} />
        }
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
          {sinStock.length > 0 && `${sinStock.length} producto${sinStock.length > 1 ? "s" : ""} sin stock`}
          {sinStock.length > 0 && stockBajo.length > 0 && " · "}
          {stockBajo.length > 0 && `${stockBajo.length} con stock bajo`}
          {" — "}
          <span style={{ fontWeight: 400, fontSize: 12 }}>se recomienda reabastecer</span>
        </span>
        {open ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
      </button>

      {/* Detalle expandible */}
      {open && (
        <div style={{ padding: "0 14px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {sinStock.map(p => (
            <span key={p.id} style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
              background: "rgba(239,68,68,.15)", color: "var(--danger)",
              border: "1px solid rgba(239,68,68,.25)",
            }}>
              {p.nombre} — Sin stock
            </span>
          ))}
          {stockBajo.map(p => (
            <span key={p.id} style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
              background: "rgba(234,179,8,.15)", color: "var(--warning)",
              border: "1px solid rgba(234,179,8,.25)",
            }}>
              {p.nombre} — {p.stock} ud.
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: GESTION DE PRODUCTOS
══════════════════════════════════════════ */
function TabProductos() {
  const [productos,  setProductos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalProd,  setModalProd]  = useState(null);
  const [detailProd, setDetailProd] = useState(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("Todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProductos();
      setProductos(res.data?.productos || []);
    } catch { /* silente */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id) => {
    try {
      await toggleProducto(id);
      setProductos(ps => ps.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
    } catch { /* silente */ }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`Eliminar "${nombre}"? Esta accion no se puede deshacer.`)) return;
    try {
      await eliminarProducto(id);
      setProductos(ps => ps.filter(p => p.id !== id));
    } catch { /* silente */ }
  };

  const cats = ["Todos", ...Array.from(new Set(productos.map(p => p.categoria)))];
  const filtrados = productos.filter(p =>
    (catFilter === "Todos" || p.categoria === catFilter) &&
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
      {/* Barra superior */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...inputSt, width: 200 }} placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => <button key={c} style={filterBtnSt(catFilter === c)} onClick={() => setCatFilter(c)}>{c}</button>)}
        </div>
        <button onClick={() => setModalProd({})}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          <FiPlus size={14} /> Nuevo producto
        </button>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <FiPackage size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Sin productos. Crea el primero con el boton de arriba.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {filtrados.map(p => (
            <div key={p.id} style={{ ...cardSt({ padding: 0, overflow: "hidden", borderTop: `3px solid ${catColor(p.categoria)}`, opacity: p.activo ? 1 : 0.5 }) }}>
              {/* Zona clickeable → abre detalle */}
              <div onClick={() => setDetailProd(p)} style={{ cursor: "pointer" }}>
                {p.imagenes?.length > 0
                  ? <img src={p.imagenes[0]} alt={p.nombre} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: 100, background: `${catColor(p.categoria)}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FiPackage size={28} color={catColor(p.categoria)} style={{ opacity: 0.6 }} />
                    </div>
                }
                <div style={{ padding: "12px 14px 8px" }}>
                  <span style={{ fontSize: 10, color: catColor(p.categoria), fontWeight: 700, textTransform: "uppercase" }}>{p.categoria}</span>
                  <p style={{ margin: "4px 0 6px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {p.nombre}
                    {p.es_combo && (
                      <span style={{
                        marginLeft: 6, fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em",
                        background: "var(--accent)", color: "#fff",
                        padding: "2px 6px", borderRadius: 5, verticalAlign: "middle",
                      }}>
                        COMBO
                      </span>
                    )}
                  </p>
                  {/* Contenido del combo, para que el cajero sepa qué entrega */}
                  {p.es_combo && Array.isArray(p.items_combo) && p.items_combo.length > 0 && (
                    <p style={{ margin: "0 0 6px", fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {p.items_combo.map(it => `${it.cantidad}× ${it.nombre}`).join(" · ")}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: p.stock === 0 || p.stock <= LOW_STOCK ? 6 : 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--success)" }}>{fmt(p.precio)}</span>
                    <span style={{ fontSize: 11, color: p.stock === 0 ? "var(--danger)" : p.stock <= LOW_STOCK ? "var(--warning)" : "var(--text-secondary)", fontWeight: p.stock <= LOW_STOCK ? 700 : 400 }}>
                      Stock: {p.stock}
                    </span>
                  </div>
                  {p.stock === 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700,
                      color: "var(--danger)", background: "rgba(239,68,68,.12)", borderRadius: 99, padding: "2px 8px" }}>
                      <FiXCircle size={9} /> Sin stock — reabastecer
                    </span>
                  )}
                  {p.stock > 0 && p.stock <= LOW_STOCK && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700,
                      color: "var(--warning)", background: "rgba(234,179,8,.12)", borderRadius: 99, padding: "2px 8px" }}>
                      <FiAlertTriangle size={9} /> Stock bajo
                    </span>
                  )}
                </div>
              </div>
              {/* Botonera — sin propagar al detalle */}
              <div style={{ padding: "0 14px 12px", display: "flex", gap: 6 }}>
                <button onClick={() => setModalProd(p)}
                  style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <FiEdit2 size={11} /> Editar
                </button>
                <button onClick={() => handleToggle(p.id)}
                  style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", background: p.activo ? "rgba(239,68,68,.12)" : "rgba(16,185,129,.12)", color: p.activo ? "var(--danger)" : "var(--success)", cursor: "pointer", fontSize: 12 }}>
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(p.id, p.nombre)}
                  style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,.1)", color: "var(--danger)", cursor: "pointer" }}>
                  <FiTrash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalProd !== null && (
        <ProductoModal
          producto={modalProd?.id ? modalProd : null}
          onClose={() => setModalProd(null)}
          onSaved={() => { setModalProd(null); load(); }}
        />
      )}
      {detailProd && (
        <ProductoDetailModal
          producto={detailProd}
          onClose={() => setDetailProd(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TAB: NUEVA VENTA
══════════════════════════════════════════ */
function TabVenta() {
  const [productos,   setProductos]   = useState([]);
  const [miembros,    setMiembros]    = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [cart,        setCart]        = useState([]);
  const [catFilter,   setCatFilter]   = useState("Todos");
  const [search,      setSearch]      = useState("");
  const [checkout,    setCheckout]    = useState(false);
  const [ventaData,   setVentaData]   = useState(null);
  const [detailProd,  setDetailProd]  = useState(null);

  const isMiembroRole = getIsMiembro();

  const load = useCallback(async () => {
    setLoadingInit(true);
    try {
      // Confirma primero los pagos en línea que hayan quedado pendientes, para
      // que la venta y el stock ya estén actualizados al pintar el catálogo.
      const confirmadas = await reconciliarSilencioso();
      if (confirmadas.length > 0) {
        Swal.fire({
          icon: "success",
          title: confirmadas.length === 1 ? "Pago confirmado" : "Pagos confirmados",
          text: confirmadas.length === 1
            ? "Se registró una venta pagada en línea."
            : `Se registraron ${confirmadas.length} ventas pagadas en línea.`,
          timer: 2600, showConfirmButton: false,
          background: "var(--bg-card)", color: "var(--text-primary)",
        });
      }

      const tasks = [getProductos({ activos: true })];
      if (!isMiembroRole) tasks.push(getMiembros());

      const [pr, mr] = await Promise.allSettled(tasks);
      if (pr.status === "fulfilled") setProductos(pr.value.data?.productos || []);
      if (mr && mr.status === "fulfilled") setMiembros(mr.value.data?.miembros || []);
    } finally { setLoadingInit(false); }
  }, [isMiembroRole]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (p) =>
    setCart(prev => {
      if (p.stock <= 0) return prev;                          // sin stock
      const f = prev.find(i => i.id === p.id);
      if (f) {
        if (f.qty >= p.stock) return prev;                    // tope de stock
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...p, qty: 1 }];
    });

  const setQty = (id, delta) =>
    setCart(prev =>
      prev.map(i => {
        if (i.id !== id) return i;
        const next = Math.max(0, i.qty + delta);
        return { ...i, qty: delta > 0 ? Math.min(next, i.stock ?? next) : next };
      }).filter(i => i.qty > 0)
    );

  const cats = ["Todos", ...Array.from(new Set(productos.map(p => p.categoria)))];
  const visible = productos.filter(p =>
    (catFilter === "Todos" || p.categoria === catFilter) &&
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <div style={{ display: "flex", flex: 1, gap: 18, padding: "16px 28px 20px", overflow: "hidden", height: "calc(100% - 10px)" }}>

        {/* Columna izquierda: catalogo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden" }}>
          {/* Alertas de stock */}
          {!loadingInit && !isMiembroRole && <StockAlertBar productos={productos} />}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0, alignItems: "center" }}>
            <input data-guide="pos-search" style={{ ...inputSt, width: 170 }} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            {cats.map(c => <button key={c} style={filterBtnSt(catFilter === c)} onClick={() => setCatFilter(c)}>{c}</button>)}
          </div>

          <div data-guide="pos-catalog" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, overflowY: "auto", flex: 1, alignContent: "start" }}>
            {loadingInit
              ? [0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 12 }} />)
              : visible.map(p => {
                  const inCart    = cart.find(i => i.id === p.id);
                  const noStock   = p.stock === 0;
                  const lowStock  = p.stock > 0 && p.stock <= LOW_STOCK;
                  const maxInCart = inCart && inCart.qty >= p.stock;

                  return (
                    <div key={p.id}
                      onClick={() => !noStock && addToCart(p)}
                      style={{ ...cardSt({
                        padding: "14px", position: "relative",
                        borderTop: `3px solid ${noStock ? "var(--danger)" : catColor(p.categoria)}`,
                        transition: "transform .15s",
                        cursor: noStock ? "not-allowed" : "pointer",
                        opacity: noStock ? 0.55 : 1,
                        outline: inCart ? `2px solid ${catColor(p.categoria)}` : "none",
                      }) }}
                      onMouseEnter={e => { if (!noStock) e.currentTarget.style.transform = "translateY(-2px)"; }}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>

                      {/* Overlay sin stock */}
                      {noStock && (
                        <div style={{
                          position: "absolute", inset: 0, zIndex: 3, borderRadius: 11,
                          background: "rgba(0,0,0,.55)", display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 4,
                          pointerEvents: "none",
                        }}>
                          <FiXCircle size={22} color="var(--danger)" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>Sin stock</span>
                        </div>
                      )}

                      {/* Botón de información */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailProd(p); }}
                        title="Ver detalle"
                        style={{
                          position: "absolute", top: 8, right: 8, zIndex: 4,
                          background: "rgba(0,0,0,.45)", border: "none", borderRadius: 6,
                          color: "#fff", cursor: "pointer", padding: "4px 5px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: 0.7, transition: "opacity .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
                      >
                        <FiInfo size={12} />
                      </button>

                      {p.imagenes?.length > 0
                        ? <img src={p.imagenes[0]} alt="" style={{ width: "100%", height: 68, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                        : <div style={{ width: "100%", height: 68, borderRadius: 6, marginBottom: 8, background: `${catColor(p.categoria)}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiPackage size={22} color={catColor(p.categoria)} style={{ opacity: 0.7 }} />
                          </div>
                      }

                      <span style={{ fontSize: 10, color: catColor(p.categoria), fontWeight: 700, textTransform: "uppercase" }}>{p.categoria}</span>
                      <p style={{ margin: "4px 0 4px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{p.nombre}</p>

                      {/* Badge stock bajo — solo admin/recep */}
                      {lowStock && !isMiembroRole && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700,
                          color: "var(--warning)", background: "rgba(234,179,8,.15)", borderRadius: 99,
                          padding: "1px 7px", marginBottom: 4 }}>
                          <FiAlertTriangle size={9} /> Stock bajo: {p.stock}
                        </span>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--success)" }}>{fmt(p.precio)}</span>
                        {inCart && !maxInCart && <span style={{ fontSize: 11, background: catColor(p.categoria), color: "#fff", borderRadius: 99, padding: "1px 7px", fontWeight: 700 }}>x{inCart.qty}</span>}
                        {maxInCart && <span style={{ fontSize: 10, color: "var(--warning)", fontWeight: 700 }}>Máx.</span>}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Carrito */}
        <div data-guide="pos-cart" style={{ ...cardSt({ padding: "16px", width: 270, flexShrink: 0, display: "flex", flexDirection: "column" }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiShoppingCart size={15} color="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Carrito</span>
              {itemCount > 0 && <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{itemCount}</span>}
            </div>
            {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 11 }}>Limpiar</button>}
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", gap: 10, paddingTop: 40 }}>
                <FiShoppingCart size={34} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 12 }}>Carrito vacio</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ background: "var(--bg-input, rgba(255,255,255,.04))", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, lineHeight: 1.3 }}>{item.nombre}</span>
                  <button onClick={() => setQty(item.id, -item.qty)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", marginLeft: 4 }}>
                    <FiTrash2 size={11} />
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setQty(item.id, -1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FiMinus size={10} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, 1)}
                      disabled={item.qty >= (item.stock ?? Infinity)}
                      title={item.qty >= (item.stock ?? Infinity) ? `Stock máximo: ${item.stock}` : undefined}
                      style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "none",
                        color: item.qty >= (item.stock ?? Infinity) ? "var(--text-secondary)" : "var(--text-primary)",
                        cursor: item.qty >= (item.stock ?? Infinity) ? "not-allowed" : "pointer",
                        opacity: item.qty >= (item.stock ?? Infinity) ? 0.4 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FiPlus size={10} />
                    </button>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{fmt(item.precio * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{fmt(total)}</span>
            </div>
            <button data-guide="pos-cobrar" disabled={!cart.length} onClick={() => setCheckout(true)}
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
                background: cart.length ? "var(--accent)" : "var(--bg-input, rgba(255,255,255,.05))",
                color: cart.length ? "#fff" : "var(--text-secondary)",
                fontSize: 14, fontWeight: 700, cursor: cart.length ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FiDollarSign size={15} /> Cobrar {cart.length ? fmt(total) : ""}
            </button>
          </div>
        </div>
      </div>

      {detailProd && (
        <ProductoDetailModal
          producto={detailProd}
          onClose={() => setDetailProd(null)}
          onAddToCart={(p) => { addToCart(p); setDetailProd(null); }}
        />
      )}
      {checkout && (
        <CheckoutModal
          cart={cart} miembros={miembros}
          onClose={() => setCheckout(false)}
          onComplete={(v) => { setCheckout(false); setCart([]); setVentaData(v); }}
        />
      )}
      {ventaData && (
        <TicketModal
          venta={ventaData}
          onClose={() => { setVentaData(null); load(); }}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   TAB: HISTORIAL DE VENTAS
══════════════════════════════════════════ */
const METODO_COLOR = {
  Efectivo:      "var(--success)",
  Tarjeta:       "var(--accent)",
  Transferencia: "#38bdf8",
  QR:            "var(--warning)",
};

const MESES_POS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Chip de periodo del historial. */
function ChipPeriodo({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 13px", borderRadius: 18, cursor: "pointer",
        border: `1px solid ${activo ? "var(--accent)" : "var(--border, rgba(255,255,255,.12))"}`,
        background: activo ? "var(--accent)" : "transparent",
        color: activo ? "#fff" : "var(--text-secondary)",
        fontSize: 12.5, fontWeight: 600, transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

function TabHistorial() {
  const [ventas,      setVentas]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [total,       setTotal]       = useState(0);
  const [detail,      setDetail]      = useState(null); // venta expandida
  const [ticketVenta, setTicketVenta] = useState(null); // venta para el ticket modal

  // Periodo: 0 = sin acotar. `montoTotal` viene del backend y cubre el filtro
  // entero, no sólo la página visible.
  const [anio,       setAnio]       = useState(0);
  const [mes,        setMes]        = useState(0);
  const [anios,      setAnios]      = useState([]);
  const [montoTotal, setMontoTotal] = useState(0);

  const load = useCallback(async (p = 1, a = anio, m = mes) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: 10 };
      if (a) params.anio = a;
      if (a && m) params.mes = m;

      const res = await getVentas(params);
      setVentas(res.data?.ventas || []);
      setPages(res.data?.pages  || 1);
      setTotal(res.data?.total  || 0);
      setMontoTotal(res.data?.monto_total ?? 0);
      if (Array.isArray(res.data?.anios) && res.data.anios.length) {
        setAnios(res.data.anios);
      }
      setPage(p);
    } catch { /* silente */ }
    finally { setLoading(false); }
  }, [anio, mes]);

  useEffect(() => { load(1, 0, 0); }, []); // eslint-disable-line

  // Cambiar de periodo reinicia la paginación: la página 4 del filtro anterior
  // puede no existir en el nuevo.
  const cambiarPeriodo = (a, m) => {
    setAnio(a);
    setMes(m);
    load(1, a, m);
  };

  const etiquetaPeriodo = !anio
    ? "todo el historial"
    : !mes ? `año ${anio}` : `${MESES_POS[mes - 1]} ${anio}`;

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }); }
    catch { return iso.slice(0, 16); }
  };
  const fmtMoney = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
      {/* Filtro de periodo + total del filtro */}
      <div style={{
        ...cardSt({ padding: "14px 18px", marginBottom: 16 }),
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginRight: 3 }}>
            Periodo:
          </span>
          <ChipPeriodo activo={anio === 0} onClick={() => cambiarPeriodo(0, 0)}>Todo</ChipPeriodo>
          {(anios.length ? anios : [new Date().getFullYear()]).map((a) => (
            <ChipPeriodo key={a} activo={anio === a} onClick={() => cambiarPeriodo(a, mes)}>
              {a}
            </ChipPeriodo>
          ))}
        </div>

        {anio !== 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginRight: 3 }}>
              Mes:
            </span>
            <ChipPeriodo activo={mes === 0} onClick={() => cambiarPeriodo(anio, 0)}>Año</ChipPeriodo>
            {MESES_POS.map((m, i) => (
              <ChipPeriodo key={m} activo={mes === i + 1} onClick={() => cambiarPeriodo(anio, i + 1)}>
                {m}
              </ChipPeriodo>
            ))}
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
          paddingTop: 10, borderTop: "1px solid var(--border, rgba(255,255,255,.07))",
        }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {total} venta{total === 1 ? "" : "s"} · {etiquetaPeriodo}
          </span>
          <span style={{ fontSize: 21, fontWeight: 800, color: "var(--accent)" }}>
            {fmtMoney(montoTotal)}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[0,1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 10 }} />)}
        </div>
      ) : ventas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
          <FiClock size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
          <p>Sin ventas registradas</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ventas.map((v) => {
            const isOpen = detail === v.id;
            const color  = METODO_COLOR[v.metodo_pago] || "var(--text-secondary)";
            return (
              <div key={v.id}
                onClick={() => setDetail(isOpen ? null : v.id)}
                style={{ ...cardSt({ padding: "14px 18px", cursor: "pointer",
                  borderLeft: `3px solid ${color}`,
                  background: isOpen ? "var(--bg-input, rgba(255,255,255,.05))" : undefined,
                }) }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FiCreditCard size={14} color={color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        {v.nombre_miembro
                          ? <><FiUser size={11} style={{ opacity: 0.5 }} />{v.nombre_miembro}</>
                          : <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Venta directa</span>
                        }
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{fmtDate(v.fecha)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {/* Ver ticket */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setTicketVenta(v); }}
                      title="Ver ticket"
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 7,
                        border: "1px solid var(--border)",
                        background: "transparent", color: "var(--text-secondary)",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                        transition: "all .15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-soft)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      <FiFileText size={13} /> Ticket
                    </button>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--success)" }}>{fmtMoney(v.total)}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                        background: `${color}18`, color }}>
                        {v.metodo_pago}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 6, letterSpacing: ".06em" }}>
                      # {v.id?.slice(-8).toUpperCase()}
                    </div>
                    {(v.items || []).map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--text-primary)" }}>{it.nombre} <span style={{ color: "var(--text-tertiary)" }}>x{it.qty}</span></span>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>{fmtMoney(it.precio * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 20 }}>
          <button onClick={() => load(page - 1)} disabled={page === 1 || loading}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: page === 1 ? "var(--border)" : "var(--text-secondary)",
              cursor: page === 1 ? "not-allowed" : "pointer", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <FiChevronLeft size={13} /> Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Página {page} de {pages}</span>
          <button onClick={() => load(page + 1)} disabled={page === pages || loading}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: page === pages ? "var(--border)" : "var(--text-secondary)",
              cursor: page === pages ? "not-allowed" : "pointer", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            Siguiente <FiChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Ticket modal */}
      {ticketVenta && (
        <TicketModal
          venta={{
            id:             ticketVenta.id,
            fecha:          fmtDate(ticketVenta.fecha),
            nombre_miembro: ticketVenta.nombre_miembro,
            items:          ticketVenta.items || [],
            total:          ticketVenta.total,
            metodo_pago:    ticketVenta.metodo_pago,
            numero_tarjeta: ticketVenta.numero_tarjeta || "",
            referencia:     ticketVenta.referencia     || "",
          }}
          onClose={() => setTicketVenta(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function PointOfSale() {
  const [tab, setTab] = useState("venta");
  const isMiembro = getIsMiembro();

  const tabBtn = (active) => ({
    padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600,
    background: active ? "var(--accent)" : "transparent",
    color: active ? "#fff" : "var(--text-secondary)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-input)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiShoppingCart size={20} color="var(--accent)" />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Punto de Venta</h1>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "1px 0 0" }}>
              {tab === "venta" ? "Registra ventas y genera recibos" : tab === "productos" ? "Gestiona el catálogo de productos" : "Historial de transacciones"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card)", borderRadius: 10, padding: 4 }}>
          <button style={tabBtn(tab === "venta")}    onClick={() => setTab("venta")}>
            <FiShoppingCart size={13} style={{ marginRight: 6 }} />Nueva Venta
          </button>
          {!isMiembro && (
            <button style={tabBtn(tab === "productos")} onClick={() => setTab("productos")}>
              <FiTag size={13} style={{ marginRight: 6 }} />Productos
            </button>
          )}
          <button style={tabBtn(tab === "historial")} onClick={() => setTab("historial")}>
            <FiClock size={13} style={{ marginRight: 6 }} />Historial
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "venta"     && <TabVenta />}
        {tab === "productos" && <TabProductos />}
        {tab === "historial" && <TabHistorial />}
      </div>
    </div>
  );
}
