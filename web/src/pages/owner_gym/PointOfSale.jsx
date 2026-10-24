import { useState } from "react";
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiDollarSign, FiPackage, FiAlertCircle } from "react-icons/fi";
import { registrarVenta } from "../../api/ventas";

// Catálogo de productos (hardcoded hasta implementar endpoint /api/productos)
const PRODUCTOS = [
  { id: 1,  nombre: "Proteína Whey 1kg",  precio: 450, stock: 50, categoria: "Suplementos"  },
  { id: 2,  nombre: "Creatina 300g",       precio: 280, stock: 30, categoria: "Suplementos"  },
  { id: 3,  nombre: "BCAA 200 caps",       precio: 320, stock: 25, categoria: "Suplementos"  },
  { id: 4,  nombre: "Pre-Workout",         precio: 380, stock: 20, categoria: "Suplementos"  },
  { id: 5,  nombre: "Shaker 600ml",        precio: 80,  stock: 100, categoria: "Accesorios"  },
  { id: 6,  nombre: "Toalla deportiva",    precio: 120, stock: 60,  categoria: "Accesorios"  },
  { id: 7,  nombre: "Guantes gimnasio",    precio: 150, stock: 40,  categoria: "Accesorios"  },
  { id: 8,  nombre: "Botella agua 1L",     precio: 95,  stock: 80,  categoria: "Accesorios"  },
  { id: 9,  nombre: "Barra proteína",      precio: 35,  stock: 200, categoria: "Snacks"      },
  { id: 10, nombre: "Electrolitos",        precio: 180, stock: 45,  categoria: "Bebidas"     },
];

const CATEGORIAS = ["Todos", ...Array.from(new Set(PRODUCTOS.map(p => p.categoria)))];

const CAT_COLORS = {
  Suplementos: "#6366f1",
  Accesorios:  "#10b981",
  Snacks:      "#eab308",
  Bebidas:     "#38bdf8",
};

const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function PointOfSale() {
  const [cart,       setCart]       = useState([]);
  const [categoria,  setCategoria]  = useState("Todos");
  const [metodo,     setMetodo]     = useState("Efectivo");
  const [vendido,    setVendido]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const productos = categoria === "Todos"
    ? PRODUCTOS
    : PRODUCTOS.filter(p => p.categoria === categoria);

  const addToCart = (p) => {
    setCart(prev => {
      const found = prev.find(i => i.id === p.id);
      if (found) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const setQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    );
  };

  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
  const items = cart.reduce((s, i) => s + i.qty, 0);

  const handleVender = async () => {
    if (!cart.length || loading) return;
    setLoading(true);
    setError(null);
    try {
      const items = cart.map(({ id, nombre, precio, qty, categoria }) => ({
        id, nombre, precio, qty, categoria,
      }));
      await registrarVenta({ items, total, metodo_pago: metodo });
      setVendido(true);
      setTimeout(() => {
        setCart([]);
        setVendido(false);
      }, 2200);
    } catch (e) {
      setError("Error al registrar la venta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── estilos inline ────────────────────────────────────────
  const card = (extra = {}) => ({
    background: "var(--bg-card, #1a1d2e)",
    border: "1px solid var(--border, rgba(255,255,255,.08))",
    borderRadius: 12,
    ...extra,
  });

  return (
    <>
      {/* HEADER */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: "1px solid var(--border, rgba(255,255,255,.08))",
        background: "var(--bg-dark, #0f1117)",
        flexShrink: 0, position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiShoppingCart size={22} color="#6366f1" />
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", margin: 0 }}>
              Punto de Venta
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-secondary, #94a3b8)", margin: "2px 0 0" }}>
              Catálogo de productos del gimnasio
            </p>
          </div>
        </div>
        {items > 0 && (
          <span style={{
            background: "#6366f1", color: "#fff", borderRadius: 99,
            fontSize: 12, fontWeight: 700, padding: "4px 12px",
          }}>
            {items} item{items > 1 ? "s" : ""} · {fmt(total)}
          </span>
        )}
      </header>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, gap: 20, padding: "20px 28px", overflow: "hidden", height: "calc(100% - 73px)" }}>

        {/* ── PRODUCTOS ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, transition: "all .15s",
                  background: categoria === cat ? "#6366f1" : "var(--bg-card, #1a1d2e)",
                  color: categoria === cat ? "#fff" : "var(--text-secondary, #94a3b8)",
                  border: `1px solid ${categoria === cat ? "transparent" : "var(--border, rgba(255,255,255,.08))"}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid de productos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, overflowY: "auto", flex: 1, alignContent: "start" }}>
            {productos.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                style={{
                  ...card({ padding: "16px", cursor: "pointer", transition: "transform .15s, box-shadow .15s" }),
                  borderTop: `3px solid ${CAT_COLORS[p.categoria] || "#6366f1"}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${CAT_COLORS[p.categoria] || "#6366f1"}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <FiPackage size={18} color={CAT_COLORS[p.categoria] || "#6366f1"} />
                </div>
                <span style={{ fontSize: 11, color: CAT_COLORS[p.categoria] || "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {p.categoria}
                </span>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #f1f5f9)", margin: "6px 0 10px", lineHeight: 1.3 }}>
                  {p.nombre}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{fmt(p.precio)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)" }}>Stock: {p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CARRITO ───────────────────────────────────────── */}
        <div style={{ ...card({ padding: "20px", width: 300, flexShrink: 0, display: "flex", flexDirection: "column" }) }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>Carrito</span>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ background: "none", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", fontSize: 12 }}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary, #94a3b8)", gap: 12, paddingTop: 40 }}>
                <FiShoppingCart size={40} style={{ opacity: .25 }} />
                <p style={{ fontSize: 13 }}>Carrito vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} style={{ background: "var(--bg-input, rgba(255,255,255,.05))", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #f1f5f9)", flex: 1, lineHeight: 1.3 }}>{item.nombre}</span>
                    <button onClick={() => setQty(item.id, -item.qty)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", flexShrink: 0, marginLeft: 6 }}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => setQty(item.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border, rgba(255,255,255,.08))", background: "none", color: "var(--text-primary, #f1f5f9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiMinus size={12} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #f1f5f9)", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => setQty(item.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--border, rgba(255,255,255,.08))", background: "none", color: "var(--text-primary, #f1f5f9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FiPlus size={12} />
                      </button>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{fmt(item.precio * item.qty)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, color: "#ef4444", fontSize: 12 }}>
              <FiAlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Checkout */}
          <div style={{ borderTop: "1px solid var(--border, rgba(255,255,255,.08))", paddingTop: 14, flexShrink: 0 }}>
            {/* Método de pago */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                Método de pago
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Efectivo", "Tarjeta"].map(m => (
                  <button
                    key={m}
                    onClick={() => setMetodo(m)}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: metodo === m ? "#6366f1" : "var(--bg-input, rgba(255,255,255,.05))",
                      color: metodo === m ? "#fff" : "var(--text-secondary, #94a3b8)",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "var(--text-secondary, #94a3b8)" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>{fmt(total)}</span>
            </div>

            <button
              disabled={!cart.length || vendido || loading}
              onClick={handleVender}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                background: vendido ? "#10b981" : loading ? "#4f46e5" : cart.length ? "#6366f1" : "var(--bg-input, rgba(255,255,255,.05))",
                color: cart.length || vendido || loading ? "#fff" : "var(--text-secondary, #94a3b8)",
                fontSize: 15, fontWeight: 700, cursor: cart.length && !vendido && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .3s", opacity: loading ? 0.8 : 1,
              }}
            >
              {vendido
                ? "✓ Venta registrada"
                : loading
                  ? "Procesando…"
                  : <><FiDollarSign size={18} /> Cobrar {fmt(total)}</>
              }
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
