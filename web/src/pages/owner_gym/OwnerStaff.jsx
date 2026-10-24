import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FiUsers, FiUserPlus, FiToggleLeft, FiToggleRight, FiSearch,
} from "react-icons/fi";
import { getStaff, crearStaff, toggleStaff } from "../../api/owner_gym";

const S = {
  page:  { padding: "28px 32px", background: "var(--bg-dark,#0f1117)", minHeight: "100vh", color: "var(--text-primary,#f1f5f9)", fontFamily: "Inter,system-ui,sans-serif" },
  header:{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, margin: 0 },
  sub:   { fontSize: 13, color: "var(--text-secondary,#94a3b8)", marginTop: 4 },
  card:  { background: "var(--bg-card,#1e2233)", border: "1px solid var(--border,rgba(255,255,255,.08))", borderRadius: 12, padding: "20px 24px" },
  toolbar:{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" },
  input: { flex: 1, minWidth: 200, padding: "9px 14px 9px 38px", background: "var(--bg-dark,#0f1117)", border: "1px solid var(--border,rgba(255,255,255,.1))", borderRadius: 8, color: "var(--text-primary,#f1f5f9)", fontSize: 13, outline: "none" },
  select:{ padding: "9px 14px", background: "var(--bg-dark,#0f1117)", border: "1px solid var(--border,rgba(255,255,255,.1))", borderRadius: 8, color: "var(--text-primary,#f1f5f9)", fontSize: 13, outline: "none" },
  btn:   (color="#6366f1") => ({ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 8, color, cursor: "pointer", fontSize: 13, fontWeight: 600 }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:    { padding: "10px 14px", textAlign: "left", color: "var(--text-secondary,#94a3b8)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--border,rgba(255,255,255,.08))" },
  td:    { padding: "12px 14px", borderBottom: "1px solid var(--border,rgba(255,255,255,.05))", verticalAlign: "middle" },
  badge: (c) => ({ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${c}22`, color: c }),
  avatar:{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-dim,rgba(99,102,241,.2))", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontSize: 15, fontWeight: 700, flexShrink: 0 },
};

const ROLE_COLOR = { Entrenador: "#6366f1", Recepcionista: "#14b8a6" };

export default function OwnerStaff() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [rolFil,  setRolFil]  = useState("");
  const [activos, setActivos] = useState("true");

  const load = async () => {
    setLoading(true);
    try {
      const params = { activos };
      if (rolFil) params.rol = rolFil;
      if (search) params.q  = search;
      const { data } = await getStaff(params);
      setStaff(data);
    } catch { Swal.fire("Error", "No se pudo cargar el staff", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activos, rolFil]);

  const handleSearch = (e) => {
    if (e.key === "Enter") load();
    setSearch(e.target.value);
  };

  const handleToggle = async (u) => {
    const accion = u.activo ? "desactivar" : "activar";
    const { isConfirmed } = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${u.nombre}?`,
      icon: "question", showCancelButton: true, confirmButtonText: "Sí",
      background: "#1e2233", color: "#f1f5f9",
      confirmButtonColor: u.activo ? "#ef4444" : "#22c55e",
    });
    if (!isConfirmed) return;
    try {
      await toggleStaff(u.id);
      load();
    } catch { Swal.fire("Error", "No se pudo cambiar el estado", "error"); }
  };

  const handleCrear = async () => {
    const { value: form } = await Swal.fire({
      title: "Agregar Staff",
      html: `
        <input id="s-nombre"   class="swal2-input"   placeholder="Nombre completo">
        <input id="s-email"    class="swal2-input"   placeholder="Email" type="email">
        <input id="s-password" class="swal2-input"   placeholder="Contraseña" type="password">
        <select id="s-rol" class="swal2-select" style="width:87%;margin:.5em auto 0;padding:10px;background:#0f1117;color:#f1f5f9;border:1px solid rgba(255,255,255,.2);border-radius:6px">
          <option value="">Seleccionar rol…</option>
          <option value="Entrenador">Entrenador</option>
          <option value="Recepcionista">Recepcionista</option>
        </select>
      `,
      background: "#1e2233", color: "#f1f5f9",
      showCancelButton: true, confirmButtonText: "Crear",
      confirmButtonColor: "#6366f1",
      preConfirm: () => ({
        nombre:   document.getElementById("s-nombre").value.trim(),
        email:    document.getElementById("s-email").value.trim(),
        password: document.getElementById("s-password").value.trim(),
        rol:      document.getElementById("s-rol").value,
      }),
    });
    if (!form) return;
    if (!form.nombre || !form.email || !form.password || !form.rol) {
      Swal.fire("Campos incompletos", "Todos los campos son requeridos", "warning");
      return;
    }
    try {
      await crearStaff(form);
      Swal.fire({ icon: "success", title: "Usuario creado", timer: 1500, showConfirmButton: false, background: "#1e2233", color: "#f1f5f9" });
      load();
    } catch (e) {
      Swal.fire("Error", e.response?.data?.msg || "No se pudo crear el usuario", "error");
    }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Staff del Gimnasio</h1>
          <p style={S.sub}>Entrenadores y recepcionistas</p>
        </div>
        <button style={S.btn()} onClick={handleCrear}>
          <FiUserPlus /> Agregar Staff
        </button>
      </div>

      <div style={S.card}>
        <div style={S.toolbar}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              style={S.input}
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <select style={S.select} value={rolFil} onChange={e => setRolFil(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="Entrenador">Entrenadores</option>
            <option value="Recepcionista">Recepcionistas</option>
          </select>
          <select style={S.select} value={activos} onChange={e => setActivos(e.target.value)}>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 32 }}>Cargando…</p>
        ) : staff.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: 32 }}>No hay staff registrado</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {["Usuario", "Email", "Rol", "Desde", "Estado", "Acción"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map(u => (
                <tr key={u.id} style={{ transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={S.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={S.avatar}>{(u.nombre || "?")[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ ...S.td, color: "var(--text-secondary,#94a3b8)" }}>{u.email}</td>
                  <td style={S.td}>
                    <span style={S.badge(ROLE_COLOR[u.rol] || "#6366f1")}>{u.rol}</span>
                  </td>
                  <td style={{ ...S.td, color: "var(--text-secondary,#94a3b8)" }}>
                    {u.created_at ? u.created_at.slice(0, 10) : "—"}
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(u.activo ? "#22c55e" : "#ef4444")}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button
                      onClick={() => handleToggle(u)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: u.activo ? "#ef4444" : "#22c55e", fontSize: 20 }}
                      title={u.activo ? "Desactivar" : "Activar"}
                    >
                      {u.activo ? <FiToggleRight /> : <FiToggleLeft />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
