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
  FiPackage, FiEdit2, FiDollarSign, FiTag,
} from "react-icons/fi";
import { getProductos, toggleProducto, eliminarProducto, getMiembros } from "../../api/owner_gym";
import ProductoModal from "./POSProductoModal";
import CheckoutModal from "./POSCheckoutModal";
import TicketModal   from "./POSTicketModal";

/* ── Helpers ─────────────────────────────── */
const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const CAT_COLORS = {
  Suplementos: "#6366f1", Accesorios: "#10b981", Snacks: "#eab308",
  Bebidas: "#38bdf8",     Ropa: "#f472b6",        General: "#94a3b8",
};
const catColor = (cat) => CAT_COLORS[cat] || "#94a3b8";

/* ── Estilos compartidos ─────────────────── */
const cardSt = (extra = {}) => ({
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 12, ...extra,
});
const inputSt = {
  boxSizing: "border-box", padding: "8px 12px",
  background: "var(--bg-dark, #0f1117)",
  border: "1px solid var(--border, rgba(255,255,255,.12))",
  borderRadius: 8, color: "var(--text-primary, #f1f5f9)", fontSize: 13, outline: "none",
};
const filterBtnSt = (active) => ({
  padding: "5px 12px", borderRadius: 99, border: active ? "none" : "1px solid var(--border, rgba(255,255,255,.08))",
  cursor: "pointer", fontSize: 12, fontWeight: 600,
  background: active ? "#6366f1" : "var(--bg-card, #1a1d2e)",
  color: active ? "#fff" : "var(--text-secondary, #94a3b8)",
});

/* ══════════════════════════════════════════
   TAB: GESTION DE PRODUCTOS
══════════════════════════════════════════ */
function TabProductos() {
  const [productos,  setProductos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalProd,  setModalProd]  = useState(null);
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
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
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
              {p.imagenes?.length > 0
                ? <img src={p.imagenes[0]} alt={p.nombre} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                : <div style={{ width: "100%", height: 100, background: `${catColor(p.categoria)}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiPackage size={28} color={catColor(p.categoria)} style={{ opacity: 0.6 }} />
                  </div>
              }
              <div style={{ padding: "12px 14px" }}>
                <span style={{ fontSize: 10, color: catColor(p.categoria), fontWeight: 700, textTransform: "uppercase" }}>{p.categoria}</span>
                <p style={{ margin: "4px 0 8px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{p.nombre}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{fmt(p.precio)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Stock: {p.stock}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setModalProd(p)}
                    style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <FiEdit2 size={11} /> Editar
                  </button>
                  <button onClick={() => handleToggle(p.id)}
                    style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: "none", background: p.activo ? "rgba(239,68,68,.12)" : "rgba(16,185,129,.12)", color: p.activo ? "#ef4444" : "#10b981", cursor: "pointer", fontSize: 12 }}>
                    {p.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => handleDelete(p.id, p.nombre)}
                    style={{ padding: "5px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,.1)", color: "#ef4444", cursor: "pointer" }}>
                    <FiTrash2 size={12} />
                  </button>
                </div>
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

  const load = useCallback(async () => {
    setLoadingInit(true);
    try {
      const [pr, mr] = await Promise.allSettled([
        getProductos({ activos: true }),
        getMiembros(),
      ]);
      if (pr.status === "fulfilled") setProductos(pr.value.data?.productos || []);
      if (mr.status === "fulfilled") setMiembros(mr.value.data?.miembros   || []);
    } finally { setLoadingInit(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addToCart = (p) =>
    setCart(prev => {
      const f = prev.find(i => i.id === p.id);
      return f ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
               : [...prev, { ...p, qty: 1 }];
    });

  const setQty = (id, delta) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));

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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0, alignItems: "center" }}>
            <input style={{ ...inputSt, width: 170 }} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            {cats.map(c => <button key={c} style={filterBtnSt(catFilter === c)} onClick={() => setCatFilter(c)}>{c}</button>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, overflowY: "auto", flex: 1, alignContent: "start" }}>
            {loadingInit
              ? [0,1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 12 }} />)
              : visible.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  return (
                    <div key={p.id} onClick={() => addToCart(p)}
                      style={{ ...cardSt({ padding: "14px", cursor: "pointer", borderTop: `3px solid ${catColor(p.categoria)}`, transition: "transform .15s",
                        outline: inCart ? `2px solid ${catColor(p.categoria)}` : "none" }) }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                      {p.imagenes?.length > 0
                        ? <img src={p.imagenes[0]} alt="" style={{ width: "100%", height: 68, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                        : <div style={{ width: "100%", height: 68, borderRadius: 6, marginBottom: 8, background: `${catColor(p.categoria)}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiPackage size={22} color={catColor(p.categoria)} style={{ opacity: 0.7 }} />
                          </div>
                      }
                      <span style={{ fontSize: 10, color: catColor(p.categoria), fontWeight: 700, textTransform: "uppercase" }}>{p.categoria}</span>
                      <p style={{ margin: "4px 0 6px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{p.nombre}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#10b981" }}>{fmt(p.precio)}</span>
                        {inCart && <span style={{ fontSize: 11, background: catColor(p.categoria), color: "#fff", borderRadius: 99, padding: "1px 7px", fontWeight: 700 }}>x{inCart.qty}</span>}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Carrito */}
        <div style={{ ...cardSt({ padding: "16px", width: 270, flexShrink: 0, display: "flex", flexDirection: "column" }) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiShoppingCart size={15} color="#6366f1" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Carrito</span>
              {itemCount > 0 && <span style={{ background: "#6366f1", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{itemCount}</span>}
            </div>
            {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>Limpiar</button>}
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
                  <button onClick={() => setQty(item.id, -item.qty)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: 4 }}>
                    <FiTrash2 size={11} />
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setQty(item.id, -1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FiMinus size={10} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => setQty(item.id, 1)} style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><FiPlus size={10} /></button>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{fmt(item.precio * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{fmt(total)}</span>
            </div>
            <button disabled={!cart.length} onClick={() => setCheckout(true)}
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
                background: cart.length ? "#6366f1" : "var(--bg-input, rgba(255,255,255,.05))",
                color: cart.length ? "#fff" : "var(--text-secondary)",
                fontSize: 14, fontWeight: 700, cursor: cart.length ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <FiDollarSign size={15} /> Cobrar {cart.length ? fmt(total) : ""}
            </button>
          </div>
        </div>
      </div>

      {checkout && (
        <CheckoutModal
          cart={cart} miembros={miembros}
          onClose={() => setCheckout(false)}
          onComplete={(v) => { setCheckout(false); setCart([]); setVentaData(v); }}
        />
      )}
      {ventaData && <TicketModal venta={ventaData} onClose={() => setVentaData(null)} />}
    </>
  );
}

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
export default function PointOfSale() {
  const [tab, setTab] = useState("venta");

  const tabBtn = (active) => ({
    padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600,
    background: active ? "#6366f1" : "transparent",
    color: active ? "#fff" : "var(--text-secondary, #94a3b8)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg-dark, #0f1117)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiShoppingCart size={20} color="#6366f1" />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Punto de Venta</h1>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "1px 0 0" }}>
              {tab === "venta" ? "Registra ventas y genera recibos" : "Gestiona el catalogo de productos"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-card, #1a1d2e)", borderRadius: 10, padding: 4 }}>
          <button style={tabBtn(tab === "venta")}    onClick={() => setTab("venta")}>
            <FiShoppingCart size={13} style={{ marginRight: 6 }} />Nueva Venta
          </button>
          <button style={tabBtn(tab === "productos")} onClick={() => setTab("productos")}>
            <FiTag size={13} style={{ marginRight: 6 }} />Productos
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "venta"     && <TabVenta />}
        {tab === "productos" && <TabProductos />}
      </div>
    </div>
  );
}
