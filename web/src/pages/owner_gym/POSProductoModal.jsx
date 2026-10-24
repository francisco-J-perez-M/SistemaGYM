/**
 * POSProductoModal.jsx — Modal para crear / editar productos del POS.
 * Maneja hasta 3 imágenes en base64.
 */
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX, FiUpload, FiAlertCircle } from "react-icons/fi";
import { crearProducto, editarProducto } from "../../api/owner_gym";

const CATS = ["General", "Suplementos", "Accesorios", "Snacks", "Bebidas", "Ropa"];

const inputSt = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px",
  background: "var(--bg-dark, #0f1117)",
  border: "1px solid var(--border, rgba(255,255,255,.12))",
  borderRadius: 8, color: "var(--text-primary, #f1f5f9)", fontSize: 14, outline: "none",
};
const labelSt = {
  display: "block", fontSize: 11, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: ".06em",
  color: "var(--text-secondary, #94a3b8)", marginBottom: 5,
};
const cardSt = {
  background: "var(--bg-card, #1a1d2e)",
  border: "1px solid var(--border, rgba(255,255,255,.08))",
  borderRadius: 12,
};

export default function ProductoModal({ producto, onClose, onSaved }) {
  const [form, setForm] = useState(producto ? {
    nombre: producto.nombre, precio: String(producto.precio),
    stock: String(producto.stock), categoria: producto.categoria,
    descripcion: producto.descripcion, imagenes: [...producto.imagenes],
  } : { nombre: "", precio: "", stock: "", categoria: "General", descripcion: "", imagenes: [] });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const imgRef = useRef(null);

  const setField = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - form.imagenes.length);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setForm(p => p.imagenes.length < 3
          ? { ...p, imagenes: [...p.imagenes, ev.target.result] }
          : p);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImg = (idx) =>
    setForm(p => ({ ...p, imagenes: p.imagenes.filter((_, i) => i !== idx) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.nombre.trim()) { setErr("El nombre es obligatorio"); return; }
    if (isNaN(Number(form.precio)) || Number(form.precio) < 0) { setErr("Precio inválido"); return; }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(), precio: Number(form.precio),
        stock: Number(form.stock) || 0, categoria: form.categoria,
        descripcion: form.descripcion.trim(), imagenes: form.imagenes,
      };
      producto ? await editarProducto(producto.id, payload) : await crearProducto(payload);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || "Error al guardar");
    } finally { setSaving(false); }
  };

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 9991, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}>
        <div style={{ ...cardSt, padding: 0, maxWidth: 560, width: "100%", pointerEvents: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border, rgba(255,255,255,.08))" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {producto ? "Editar producto" : "Nuevo producto"}
            </h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}><FiX size={18} /></button>
          </div>
          <form onSubmit={handleSave} style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "72vh", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>Nombre *</label>
                <input style={inputSt} value={form.nombre} onChange={e => setField("nombre", e.target.value)} placeholder="Ej. Proteína Whey 1kg" required />
              </div>
              <div>
                <label style={labelSt}>Categoría</label>
                <select style={inputSt} value={form.categoria} onChange={e => setField("categoria", e.target.value)}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelSt}>Precio ($)</label>
                <input style={inputSt} type="number" min="0" step="0.01" value={form.precio} onChange={e => setField("precio", e.target.value)} placeholder="0.00" required />
              </div>
              <div>
                <label style={labelSt}>Stock</label>
                <input style={inputSt} type="number" min="0" value={form.stock} onChange={e => setField("stock", e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label style={labelSt}>Descripción (opcional)</label>
              <textarea style={{ ...inputSt, resize: "vertical", minHeight: 64 }} value={form.descripcion} onChange={e => setField("descripcion", e.target.value)} placeholder="Descripción breve…" />
            </div>
            <div>
              <label style={labelSt}>Imágenes (máx. 3)</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                {form.imagenes.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                    <img src={src} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
                    <button type="button" onClick={() => removeImg(i)}
                      style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                      <FiX size={10} />
                    </button>
                  </div>
                ))}
                {form.imagenes.length < 3 && (
                  <button type="button" onClick={() => imgRef.current?.click()}
                    style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed var(--border, rgba(255,255,255,.15))", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11 }}>
                    <FiUpload size={16} /><span>Subir</span>
                  </button>
                )}
                <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImages} />
              </div>
            </div>
            {err && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "8px 12px", color: "#ef4444", fontSize: 12 }}>
                <FiAlertCircle size={14} /> {err}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border, rgba(255,255,255,.08))" }}>
              <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: 14 }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Guardando…" : producto ? "Actualizar" : "Crear producto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
