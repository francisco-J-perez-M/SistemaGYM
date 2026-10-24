import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getUsuarios, toggleUsuario, impersonar } from "../../api/superadmin";

const card = (extra = {}) => ({
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "20px 22px",
  ...extra,
});

const badge = (type = "pos") => {
  const map = {
    pos:  { bg: "rgba(16,185,129,.15)", color: "var(--success)" },
    neg:  { bg: "rgba(239,68,68,.15)", color: "var(--danger)" },
    info: { bg: "var(--accent-dim)", color: "var(--accent-soft)" },
    warn: { bg: "rgba(234,179,8,.15)", color: "var(--warning)" },
  };
  const c = map[type] || map.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const btnStyle = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent, var(--accent))", color: "#fff" },
    ghost:   { background: "rgba(255,255,255,.06)",  color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "var(--danger)" },
    success: { background: "rgba(16,185,129,.1)",    color: "var(--success)" },
    purple:  { background: "rgba(168,85,247,.1)",    color: "#a855f7" },
  };
  return { border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "opacity .15s", ...(v[variant] || v.primary) };
};

const ROL_BADGE = {
  superadmin:   "info",
  owner_gym:    "warn",
  administrador:"warn",
  entrenador:   "pos",
  recepcionista:"purple",
  miembro:      "ghost",
};

const ROUTE_FOR_ROLE = {
  superadmin:   "/superadmin",
  owner_gym:    "/dashboard",
  administrador:"/dashboard",
  entrenador:   "/trainer-dashboard",
  recepcionista:"/receptionist-dashboard",
  miembro:      "/user/dashboard",
};

export default function SuperadminUsuarios() {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ q: "", rol: "", activo: "" });
  const perPage = 25;

  const load = useCallback((p = 1, f = filter) => {
    setLoading(true);
    const params = { page: p, per_page: perPage };
    if (f.q)      params.q      = f.q;
    if (f.rol)    params.rol    = f.rol;
    if (f.activo !== "") params.activo = f.activo;
    getUsuarios(params)
      .then(r => { setUsers(r.data.usuarios || []); setTotal(r.data.total || 0); setPage(p); })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(1, filter); }, []);

  const handleToggle = async (user) => {
    const { isConfirmed } = await Swal.fire({
      title: `${user.activo ? "Desactivar" : "Activar"} a "${user.nombre}"`,
      text: user.activo ? "El usuario no podrá iniciar sesión." : "El usuario recuperará acceso.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: user.activo ? "Desactivar" : "Activar",
      confirmButtonColor: user.activo ? "var(--danger)" : "var(--success)",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    try {
      await toggleUsuario(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, activo: !u.activo } : u));
      Swal.fire({ icon: "success", title: user.activo ? "Usuario desactivado" : "Usuario activado", timer: 1500, showConfirmButton: false, background: "var(--bg-card)", color: "var(--text-primary)" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo cambiar", background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  const handleImpersonate = async (user) => {
    const { isConfirmed } = await Swal.fire({
      title: `Impersonar a "${user.nombre}"`,
      html: `
        <p style="margin-bottom:8px">Iniciarás sesión como este usuario por <strong>1 hora</strong>.</p>
        <p style="color:var(--warning);font-size:13px">⚠️ Esta acción queda registrada en el log de auditoría.</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      confirmButtonColor: "#a855f7",
      cancelButtonText: "Cancelar",
      background: "var(--bg-card)",
      color: "var(--text-primary)",
    });
    if (!isConfirmed) return;

    try {
      const r = await impersonar(user.id);
      const { access_token, user: targetUser } = r.data;

      // Guardar sesión actual del superadmin
      const prevToken = localStorage.getItem("token");
      const prevUser  = localStorage.getItem("user");
      sessionStorage.setItem("sa_prev_token", prevToken || "");
      sessionStorage.setItem("sa_prev_user",  prevUser  || "");

      // Establecer sesión del usuario impersonado
      localStorage.setItem("token", access_token);
      localStorage.setItem("user",  JSON.stringify({ ...targetUser, _impersonated: true }));

      const dest = ROUTE_FOR_ROLE[(targetUser.role || "").toLowerCase()] || "/dashboard";
      navigate(dest, { replace: true });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e?.response?.data?.msg || "No se pudo impersonar", background: "var(--bg-card)", color: "var(--text-primary)" });
    }
  };

  const pages = Math.ceil(total / perPage);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-MX") : "—";

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)", fontFamily: "inherit" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Usuarios</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{total} usuarios en la plataforma</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={filter.q}
          onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && load(1, { ...filter, q: e.target.value })}
          placeholder="Buscar por nombre o email…"
          style={{ flex: 1, minWidth: 220, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", color: "var(--text-primary)", fontSize: 13 }}
        />
        <select
          value={filter.rol}
          onChange={e => { const v = { ...filter, rol: e.target.value }; setFilter(v); load(1, v); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
        >
          <option value="">Todos los roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="owner_gym">Owner Gym</option>
          <option value="Administrador">Administrador</option>
          <option value="Entrenador">Entrenador</option>
          <option value="Recepcionista">Recepcionista</option>
          <option value="Miembro">Miembro</option>
        </select>
        <select
          value={filter.activo}
          onChange={e => { const v = { ...filter, activo: e.target.value }; setFilter(v); load(1, v); }}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-primary)", fontSize: 13 }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button
          style={btnStyle("ghost")}
          onClick={() => load(1, filter)}
        >
          Buscar
        </button>
      </div>

      {/* Table */}
      <div style={card({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--bg-input)" }}>
              {["Usuario", "Email", "Rol", "Gimnasio", "Estado", "Creado", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Cargando…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Sin resultados</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,.04))" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-dim, var(--accent-dim))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent, var(--accent))", flexShrink: 0 }}>
                      {(u.nombre || "U").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={badge(ROL_BADGE[u.rol?.toLowerCase()] || "info")}>{u.rol || "—"}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{u.gimnasio || "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={badge(u.activo ? "pos" : "neg")}>{u.activo ? "Activo" : "Inactivo"}</span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmtDate(u.created_at)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {u.rol?.toLowerCase() !== "superadmin" && (
                      <button style={btnStyle("purple")} onClick={() => handleImpersonate(u)} title="Iniciar sesión como este usuario">
                        👤 Impersonar
                      </button>
                    )}
                    <button
                      style={btnStyle(u.activo ? "danger" : "success")}
                      onClick={() => handleToggle(u)}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button style={btnStyle("ghost")} disabled={page === 1} onClick={() => load(page - 1)}>← Anterior</button>
          <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--text-secondary)" }}>{page} / {pages}</span>
          <button style={btnStyle("ghost")} disabled={page === pages} onClick={() => load(page + 1)}>Siguiente →</button>
        </div>
      )}

      {/* Impersonation notice */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(168,85,247,.08)", border: "1px solid rgba(168,85,247,.2)", borderRadius: 10 }}>
        <p style={{ fontSize: 12, color: "#a855f7", fontWeight: 600, marginBottom: 4 }}>ℹ️ Impersonación de usuarios</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Genera un token temporal de 1 hora. La sesión queda registrada con el campo <code style={{ background: "var(--bg-input)", padding: "1px 5px", borderRadius: 4 }}>impersonated_by</code> para auditoría. Para volver al superadmin, cierra sesión y vuelve a iniciar con tus credenciales.
        </p>
      </div>
    </div>
  );
}
