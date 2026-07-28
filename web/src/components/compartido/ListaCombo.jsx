/**
 * ListaCombo.jsx — Editor de los conceptos que integran un combo.
 *
 * Cada renglón es un concepto con su cantidad y, opcionalmente, un producto
 * del inventario. Cuando se enlaza un producto, al cobrarse el combo se
 * descuenta su stock automáticamente (lo resuelve el backend).
 *
 * Uso:
 *   <ListaCombo items={items} onChange={setItems} />
 */
import { useState, useEffect } from "react";
import { FiPlus, FiX, FiPackage } from "react-icons/fi";
import { getProductos } from "../../api/owner_gym";

export default function ListaCombo({ items = [], onChange }) {
  const [nombre, setNombre]     = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [prodId, setProdId]     = useState("");
  const [productos, setProductos] = useState([]);

  // Catálogo para poder enlazar un concepto con un producto real
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await getProductos();
        const lista = data?.productos ?? data ?? [];
        if (vivo) setProductos(Array.isArray(lista) ? lista.filter(p => !p.es_combo) : []);
      } catch {
        if (vivo) setProductos([]);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const agregar = () => {
    const prod = productos.find(p => String(p.id) === String(prodId));
    const texto = (nombre.trim() || prod?.nombre || "").trim();
    if (!texto) return;
    const item = { nombre: texto, cantidad: Math.max(1, parseInt(cantidad) || 1) };
    if (prodId) item.id_producto = prodId;
    onChange([...(items || []), item]);
    setNombre(""); setCantidad(1); setProdId("");
  };

  const quitar = (idx) => onChange(items.filter((_, i) => i !== idx));

  const inputSt = {
    background: "var(--bg-input)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "9px 10px", color: "var(--text-primary)", fontSize: 13,
  };

  return (
    <div>
      {/* Conceptos ya agregados */}
      {items?.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-input)", borderRadius: 8, padding: "8px 10px",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "var(--accent)",
                background: "var(--bg-card)", borderRadius: 6, padding: "2px 7px", flexShrink: 0,
              }}>
                {it.cantidad}×
              </span>
              <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-primary)" }}>{it.nombre}</span>
              {it.id_producto && (
                <span title="Descuenta inventario"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--text-secondary)" }}>
                  <FiPackage size={11} /> inventario
                </span>
              )}
              <button type="button" onClick={() => quitar(i)} title="Quitar"
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", padding: 2 }}>
                <FiX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Alta de un concepto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8, marginBottom: 8 }}>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregar(); } }}
          placeholder="Concepto (ej. Mensualidad)"
          style={inputSt}
        />
        <input
          type="number" min="1" value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          title="Cantidad"
          style={inputSt}
        />
      </div>

      {productos.length > 0 && (
        <select value={prodId} onChange={(e) => setProdId(e.target.value)}
          style={{ ...inputSt, width: "100%", marginBottom: 8 }}>
          <option value="">Sin enlazar a inventario (solo informativo)</option>
          {productos.map(p => (
            <option key={p.id} value={p.id}>
              Enlazar con: {p.nombre} (stock {p.stock})
            </option>
          ))}
        </select>
      )}

      <button type="button" onClick={agregar}
        disabled={!nombre.trim() && !prodId}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, border: "none",
          borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600,
          background: "var(--bg-input)", color: "var(--text-primary)",
          cursor: (!nombre.trim() && !prodId) ? "not-allowed" : "pointer",
          opacity: (!nombre.trim() && !prodId) ? 0.5 : 1,
        }}>
        <FiPlus size={14} /> Agregar al combo
      </button>
    </div>
  );
}
