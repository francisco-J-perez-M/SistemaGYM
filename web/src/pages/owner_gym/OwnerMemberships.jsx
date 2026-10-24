import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiTrash2 } from "react-icons/fi";
import { getMembresias, crearMembresia, editarMembresia, toggleMembresia, eliminarMembresia } from "../../api/owner_gym";

const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n ?? 0);

const S = {
  page:   { padding: "28px 32px", background: "var(--bg-dark,#0f1117)", minHeight: "100vh", color: "var(--text-primary,#f1f5f9)", fontFamily: "Inter,system-ui,sans-serif" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title:  { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:    { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginTop: 4 },
  btn:    (c = "#6366f1") => ({ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: `${c}22`, border: `1px solid ${c}44`, borderRadius: 8, color: c, cursor: "pointer", fontSize: 13, fontWeight: 600 }),
  grid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 },
  card:   { background: "var(--bg-card,#1e2233)", border: "1px solid var(--border,rgba(255,255,255,.08))", borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 },
  price:  { fontSize: 32, fontWeight: 700, color: "#6366f1" },
  name:   { fontSize: 17, fontWeight: 600 },
  desc:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", minHeight: 18 },
  pill:   (c) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c }),
  actions:{ display: "flex", gap: 8, marginTop: 4 },
  iconBtn:(c) => ({ background: "none", border: "none", color: c, cursor: "pointer", fontSize: 18, padding: 4, display: "flex", alignItems: "center" }),
};

const SWAL_OPTS = { background: "#1e2233", color: "#f1f5f9" };

async function formDialog(initial = {}) {
  const { value } = await Swal.fire({
    title: initial.id ? "Editar Membresía" : "Nueva Membresía",
    ...SWAL_OPTS,
    html: `
      <input id="m-nombre"   class="swal2-input" placeholder="Nombre del plan" value="${initial.nombre || ""}">
      <input id="m-precio"   class="swal2-input" placeholder="Precio (MXN)" type="number" min="0" step="0.01" value="${initial.precio || ""}">
      <input id="m-duracion" class="swal2-input" placeholder="Duración en meses" type="number" min="1" value="${initial.duracion_meses || 1}">
      <textarea id="m-desc"  class="swal2-textarea" placeholder="Descripción (opcional)" style="height:80px">${initial.descripcion || ""}</textarea>
    `,
    showCancelButton: true, confirmButtonText: initial.id ? "Guardar" : "Crear",
    confirmButtonColor: "#6366f1",
    preConfirm: () => ({
      nombre:         document.getElementById("m-nombre").value.trim(),
      precio:         parseFloat(document.getElementById("m-precio").value),
      duracion_meses: parseInt(document.getElementById("m-duracion").value),
      descripcion:    document.getElementById("m-desc").value.trim(),
    }),
  });
  return value;
}

export default function OwnerMemberships() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMembresias({ activos: showAll ? "false" : "false" });
      setItems(data);
    } catch { Swal.fire("Error", "No se pudieron cargar las membresías", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [showAll]);

  const handleCreate = async () => {
    const form = await formDialog();
    if (!form) return;
    if (!form.nombre || isNaN(form.precio) || isNaN(form.duracion_meses)) {
      Swal.fire("Incompleto", "Nombre, precio y duración son requeridos", "warning"); return;
    }
    try {
      await crearMembresia(form);
      Swal.fire({ icon: "success", title: "Membresía creada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS });
      load();
    } catch (e) { Swal.fire("Error", e.response?.data?.msg || "Error al crear", "error"); }
  };

  const handleEdit = async (m) => {
    const form = await formDialog(m);
    if (!form) return;
    try {
      await editarMembresia(m.id, form);
      Swal.fire({ icon: "success", title: "Actualizada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS });
      load();
    } catch (e) { Swal.fire("Error", e.response?.data?.msg || "Error al editar", "error"); }
  };

  const handleToggle = async (m) => {
    try {
      await toggleMembresia(m.id);
      load();
    } catch { Swal.fire("Error", "No se pudo cambiar el estado", "error"); }
  };

  const handleDelete = async (m) => {
    const { isConfirmed } = await Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`,
      text: "Solo se puede eliminar si no tiene miembros asociados.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#ef4444", confirmButtonText: "Eliminar",
      ...SWAL_OPTS,
    });
    if (!isConfirmed) return;
    try {
      await eliminarMembresia(m.id);
      Swal.fire({ icon: "success", title: "Eliminada", timer: 1400, showConfirmButton: false, ...SWAL_OPTS });
      load();
    } catch (e) { Swal.fire("No se puede eliminar", e.response?.data?.msg || "Error", "error"); }
  };

  const displayed = showAll ? items : items.filter(m => m.activo);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Tipos de Membresía</h1>
          <p style={S.sub}>Planes y precios del gimnasio</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btn("#64748b")} onClick={() => setShowAll(v => !v)}>
            {showAll ? "Solo activas" : "Ver todas"}
          </button>
          <button style={S.btn()} onClick={handleCreate}>
            <FiPlus /> Nueva Membresía
          </button>
        </div>
      </div>

      {loading
        ? <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Cargando…</p>
        : displayed.length === 0
          ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              <p>No hay membresías {showAll ? "" : "activas"}.</p>
              <button style={{ ...S.btn(), margin: "0 auto" }} onClick={handleCreate}>
                <FiPlus /> Crear la primera
              </button>
            </div>
          )
          : (
            <div style={S.grid}>
              {displayed.map(m => (
                <div key={m.id} style={{ ...S.card, borderTop: `3px solid ${m.activo ? "#6366f1" : "#374151"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={S.name}>{m.nombre}</div>
                    <span style={S.pill(m.activo ? "#22c55e" : "#ef4444")}>{m.activo ? "Activa" : "Inactiva"}</span>
                  </div>
                  <div style={S.price}>{fmt(m.precio)}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary,#94a3b8)" }}>
                    {m.duracion_meses === 1 ? "1 mes" : `${m.duracion_meses} meses`}
                  </div>
                  <div style={S.desc}>{m.descripcion || <span style={{ opacity: 0.4 }}>Sin descripción</span>}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary,#64748b)" }}>
                    ~{fmt(m.precio / m.duracion_meses)}/mes
                  </div>
                  <div style={S.actions}>
                    <button style={S.iconBtn("#6366f1")} onClick={() => handleEdit(m)} title="Editar"><FiEdit2 /></button>
                    <button style={S.iconBtn(m.activo ? "#ef4444" : "#22c55e")} onClick={() => handleToggle(m)} title={m.activo ? "Desactivar" : "Activar"}>
                      {m.activo ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                    <button style={{ ...S.iconBtn("#ef4444"), marginLeft: "auto" }} onClick={() => handleDelete(m)} title="Eliminar"><FiTrash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
}
