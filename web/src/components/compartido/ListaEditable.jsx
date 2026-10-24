/**
 * ListaEditable.jsx — Editor de listas de texto (beneficios de un plan).
 *
 * Permite al dueño del gimnasio escribir los beneficios que incluye una
 * membresía: se agregan con Enter o con el botón, y se eliminan con la X.
 *
 * Uso:
 *   <ListaEditable items={beneficios} onChange={setBeneficios}
 *                  placeholder="Ej. Acceso 24/7" max={12} />
 */
import { useState } from "react";
import { FiPlus, FiX, FiCheck } from "react-icons/fi";

export default function ListaEditable({
  items = [],
  onChange,
  placeholder = "Escribe y presiona Enter",
  max = 12,
}) {
  const [texto, setTexto] = useState("");

  const agregar = () => {
    const valor = texto.trim();
    if (!valor) return;
    if (items.length >= max) return;
    // Evita duplicados sin distinguir mayúsculas
    if (items.some((i) => String(i).trim().toLowerCase() === valor.toLowerCase())) {
      setTexto("");
      return;
    }
    onChange([...items, valor]);
    setTexto("");
  };

  const quitar = (idx) => onChange(items.filter((_, i) => i !== idx));

  const alTeclear = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();   // no envía el formulario
      agregar();
    }
  };

  const lleno = items.length >= max;

  return (
    <div>
      {/* Lista actual */}
      {items.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-input)", borderRadius: 8, padding: "8px 10px",
            }}>
              <FiCheck size={13} style={{ color: "var(--success)", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.4 }}>{it}</span>
              <button type="button" onClick={() => quitar(i)} title="Quitar"
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", padding: 2 }}>
                <FiX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Alta */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={alTeclear}
          placeholder={lleno ? `Máximo ${max} elementos` : placeholder}
          disabled={lleno}
          style={{
            flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13,
            opacity: lleno ? 0.6 : 1,
          }}
        />
        <button type="button" onClick={agregar} disabled={lleno || !texto.trim()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, border: "none",
            borderRadius: 8, padding: "0 14px", fontSize: 13, fontWeight: 600,
            background: "var(--bg-input)", color: "var(--text-primary)",
            cursor: lleno || !texto.trim() ? "not-allowed" : "pointer",
            opacity: lleno || !texto.trim() ? 0.5 : 1,
          }}>
          <FiPlus size={14} /> Agregar
        </button>
      </div>
    </div>
  );
}
