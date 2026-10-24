/**
 * POSProductoDetailModal.jsx — Modal de detalle de producto POS.
 * Muestra imágenes en carrusel, info completa y botón "Agregar al carrito" (opcional).
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX, FiChevronLeft, FiChevronRight, FiShoppingCart, FiPackage } from "react-icons/fi";

const CAT_COLORS = {
  Suplementos: "#6366f1", Accesorios: "#10b981", Snacks: "#eab308",
  Bebidas: "#38bdf8",     Ropa: "#f472b6",        General: "#94a3b8",
};
const catColor = (cat) => CAT_COLORS[cat] || "#94a3b8";
const fmt = (n) => `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default function ProductoDetailModal({ producto, onClose, onAddToCart }) {
  const [imgIdx, setImgIdx] = useState(0);

  /* lock scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* cerrar con Escape */
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  if (!producto) return null;
  const imgs   = producto.imagenes || [];
  const color  = catColor(producto.categoria);
  const hasImg = imgs.length > 0;

  const prev = (e) => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length); };
  const next = (e) => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length); };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: "rgba(0,0,0,.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1d2e",
          border: `1px solid ${color}44`,
          borderRadius: 18,
          width: "100%", maxWidth: 520,
          boxShadow: `0 0 0 1px ${color}22, 0 32px 80px rgba(0,0,0,.7)`,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}
      >
        {/* ── Imagen / carrusel ── */}
        <div style={{ position: "relative", background: `${color}12`, height: 240, flexShrink: 0 }}>
          {hasImg ? (
            <>
              <img
                src={imgs[imgIdx]} alt={producto.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {imgs.length > 1 && (
                <>
                  <button onClick={prev} style={arrowSt("left")}>
                    <FiChevronLeft size={18} />
                  </button>
                  <button onClick={next} style={arrowSt("right")}>
                    <FiChevronRight size={18} />
                  </button>
                  {/* Dots */}
                  <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
                    {imgs.map((_, i) => (
                      <button key={i} onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                        style={{ width: i === imgIdx ? 18 : 8, height: 8, borderRadius: 99, border: "none", cursor: "pointer",
                          background: i === imgIdx ? "#fff" : "rgba(255,255,255,.4)", transition: "all .2s", padding: 0 }} />
                    ))}
                  </div>
                  {/* Contador */}
                  <span style={{ position: "absolute", top: 10, right: 44, background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 99, fontSize: 11, padding: "2px 10px" }}>
                    {imgIdx + 1} / {imgs.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiPackage size={56} color={color} style={{ opacity: 0.3 }} />
            </div>
          )}

          {/* Badge categoría */}
          <span style={{
            position: "absolute", top: 12, left: 14,
            background: color, color: "#fff",
            borderRadius: 99, fontSize: 10, fontWeight: 700,
            padding: "3px 10px", textTransform: "uppercase", letterSpacing: ".06em",
          }}>
            {producto.categoria}
          </span>

          {/* Cerrar */}
          <button onClick={onClose} style={{
            position: "absolute", top: 10, right: 10,
            background: "rgba(0,0,0,.5)", border: "none", borderRadius: 8,
            color: "#fff", cursor: "pointer", padding: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FiX size={16} />
          </button>

          {/* Badge stock */}
          <span style={{
            position: "absolute", bottom: 12, left: 14,
            background: producto.stock > 0 ? "rgba(16,185,129,.85)" : "rgba(239,68,68,.85)",
            color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "3px 10px",
          }}>
            {producto.stock > 0 ? `Stock: ${producto.stock}` : "Sin stock"}
          </span>
        </div>

        {/* ── Miniaturas ── */}
        {imgs.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 16px 0", overflowX: "auto" }}>
            {imgs.map((src, i) => (
              <img key={i} src={src} alt=""
                onClick={() => setImgIdx(i)}
                style={{
                  width: 52, height: 52, objectFit: "cover", borderRadius: 8, cursor: "pointer", flexShrink: 0,
                  border: i === imgIdx ? `2px solid ${color}` : "2px solid transparent",
                  opacity: i === imgIdx ? 1 : 0.55, transition: "all .15s",
                }}
              />
            ))}
          </div>
        )}

        {/* ── Info ── */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, flex: 1 }}>
              {producto.nombre}
            </h2>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#10b981", whiteSpace: "nowrap" }}>
              {fmt(producto.precio)}
            </span>
          </div>

          {producto.descripcion && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary, #94a3b8)", lineHeight: 1.6 }}>
              {producto.descripcion}
            </p>
          )}

          {/* Ficha rápida */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
            {[
              { label: "Precio",    value: fmt(producto.precio),    color: "#10b981" },
              { label: "Stock",     value: producto.stock,          color: producto.stock > 0 ? "#10b981" : "#ef4444" },
              { label: "Categoría", value: producto.categoria,      color },
              { label: "Estado",    value: producto.activo ? "Activo" : "Inactivo", color: producto.activo ? "#10b981" : "#ef4444" },
            ].map(({ label, value, color: c }) => (
              <div key={label} style={{
                flex: 1, minWidth: 100, background: "rgba(255,255,255,.04)",
                borderRadius: 10, padding: "10px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Botón agregar (solo cuando viene del tab de venta) */}
          {onAddToCart && (
            <button
              disabled={producto.stock <= 0}
              onClick={() => { onAddToCart(producto); onClose(); }}
              style={{
                marginTop: 4, width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: producto.stock > 0 ? "#6366f1" : "var(--bg-input)",
                color: producto.stock > 0 ? "#fff" : "var(--text-secondary)",
                fontSize: 14, fontWeight: 700,
                cursor: producto.stock > 0 ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <FiShoppingCart size={16} />
              {producto.stock > 0 ? `Agregar al carrito — ${fmt(producto.precio)}` : "Sin stock"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const arrowSt = (side) => ({
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  [side]: 10,
  background: "rgba(0,0,0,.55)", border: "none", borderRadius: 8,
  color: "#fff", cursor: "pointer", padding: "8px 7px",
  display: "flex", alignItems: "center", justifyContent: "center",
});
