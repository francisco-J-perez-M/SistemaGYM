import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiCalendar, FiMapPin,
  FiEdit2, FiSave, FiCamera, FiAlertCircle, FiX,
  FiActivity, FiAward, FiTarget, FiTrendingUp, FiCheckCircle,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

/* ── campo editable reutilizable ────────────────────────────────── */
function InfoField({ icon, label, value, field, editing, editedData, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 16px", borderRadius: 10,
      background: "var(--bg-input)", border: "1px solid var(--border)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: "rgba(99,102,241,.12)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 4 }}>
          {label}
        </div>
        {editing ? (
          <input
            type="text"
            value={editedData[field] || ""}
            onChange={e => onChange(field, e.target.value)}
            style={{
              width: "100%", padding: "6px 10px",
              background: "var(--bg-card)", border: "1px solid var(--accent)",
              borderRadius: 7, color: "var(--text-primary)", fontSize: 14,
              outline: "none",
            }}
          />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 500, color: value ? "var(--text-primary)" : "var(--text-secondary)" }}>
            {value || "Sin especificar"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── stat pill ──────────────────────────────────────────────────── */
function StatPill({ icon, value, label, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 90, padding: "14px 12px", borderRadius: 12, textAlign: "center",
      background: `${color}15`, border: `1px solid ${color}30`,
    }}>
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ── Niveles / objetivos ─── */
const NIVELES    = ["Principiante", "Intermedio", "Avanzado"];
const GENEROS    = ["Masculino", "Femenino", "Otro", "Prefiero no decir"];
const OBJETIVOS  = ["Perder peso", "Ganar músculo", "Mantener peso", "Mejorar resistencia", "Flexibilidad"];

export default function UserProfile() {
  const navigate    = useNavigate();
  const [user,       setUser]      = useState(null);
  const [profile,    setProfile]   = useState({});
  const [edited,     setEdited]    = useState({});
  const [isEditing,  setIsEditing] = useState(false);
  const [loading,    setLoading]   = useState(true);
  const [saving,     setSaving]    = useState(false);
  const [toast,      setToast]     = useState(null); // { type: "ok"|"err", msg }

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { navigate("/", { replace: true }); return; }
    setUser(JSON.parse(stored));
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data);
      setEdited(data);
    } catch {
      showToast("err", "No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(edited),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error al guardar");
      setProfile(edited);
      setIsEditing(false);
      // Sync name/email to localStorage so Sidebar initials update immediately
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      u.nombre = edited.nombre; u.email = edited.email;
      localStorage.setItem("user", JSON.stringify(u));
      window.dispatchEvent(new CustomEvent("userDataUpdated"));
      showToast("ok", "Perfil actualizado correctamente");
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("foto", file);
    const res = await fetch("/api/user/profile/photo", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: fd,
    });
    if (res.ok) {
      const d = await res.json();
      setProfile(p => ({ ...p, fotoPerfil: d.fotoPerfil }));
      // Sync photo to localStorage so Sidebar avatar updates immediately
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        u.foto = d.fotoPerfil;
        localStorage.setItem("user", JSON.stringify(u));
        window.dispatchEvent(new CustomEvent("userDataUpdated"));
      } catch {}
      showToast("ok", "Foto actualizada");
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const change = (field, val) => setEdited(p => ({ ...p, [field]: val }));

  const initials = () => {
    const n = profile.nombre || user?.nombre || "U";
    return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const levelColor  = { Principiante: "#22c55e", Intermedio: "#f59e0b", Avanzado: "#ef4444" };
  const nivel       = profile.nivelExperiencia || "Principiante";

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header"><h2 className="page-title">Mi Perfil</h2></header>
          <main className="dashboard-content" style={{ display:"flex", justifyContent:"center", paddingTop:80 }}>
            <div style={{ textAlign:"center", color:"var(--text-secondary)" }}>
              <div className="dashboard-spinner" style={{ margin:"0 auto 16px" }} />
              <p>Cargando perfil…</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              style={{
                position: "fixed", top: 20, right: 20, zIndex: 999,
                padding: "12px 20px", borderRadius: 12,
                background: toast.type === "ok" ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
                border: `1px solid ${toast.type === "ok" ? "rgba(34,197,94,.4)" : "rgba(239,68,68,.4)"}`,
                color: toast.type === "ok" ? "#4ade80" : "#f87171",
                display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14,
                backdropFilter: "blur(10px)",
              }}
            >
              {toast.type === "ok" ? <FiCheckCircle /> : <FiAlertCircle />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <header className="top-header">
          <h2 className="page-title">Mi Perfil</h2>
          <div style={{ display:"flex", gap:8 }}>
            {isEditing ? (
              <>
                <motion.button
                  whileTap={{ scale:.96 }}
                  onClick={() => { setIsEditing(false); setEdited(profile); }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                    background:"var(--bg-input)", border:"1px solid var(--border)",
                    borderRadius:9, color:"var(--text-secondary)", fontWeight:600, cursor:"pointer", fontSize:13 }}
                >
                  <FiX size={14} /> Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale:.96 }}
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px",
                    background:"var(--accent)", border:"none",
                    borderRadius:9, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13,
                    opacity: saving ? .7 : 1 }}
                >
                  <FiSave size={14} /> {saving ? "Guardando…" : "Guardar"}
                </motion.button>
              </>
            ) : (
              <motion.button
                whileTap={{ scale:.96 }}
                onClick={() => setIsEditing(true)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px",
                  background:"var(--accent)", border:"none",
                  borderRadius:9, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}
              >
                <FiEdit2 size={14} /> Editar perfil
              </motion.button>
            )}
          </div>
        </header>

        <main className="dashboard-content">
          {/* ── Hero Banner ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
            style={{
              borderRadius: 18, overflow:"hidden", marginBottom: 20,
              background: "linear-gradient(135deg, var(--accent) 0%, #7c3aed 60%, #1e1b4b 100%)",
              position: "relative",
            }}
          >
            {/* Decorative circles */}
            <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
            <div style={{ position:"absolute", bottom:-60, left:60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />

            <div style={{ position:"relative", padding:"32px 28px", display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
              {/* Avatar */}
              <div style={{ position:"relative", flexShrink:0 }}>
                {profile.fotoPerfil ? (
                  <img
                    src={profile.fotoPerfil.startsWith("data:") || profile.fotoPerfil.startsWith("http") || profile.fotoPerfil.startsWith("/")
                      ? profile.fotoPerfil
                      : `/api/uploads/${profile.fotoPerfil}`}
                    alt="foto"
                    style={{ width:96, height:96, borderRadius:"50%", objectFit:"cover",
                      border:"3px solid rgba(255,255,255,.4)" }}
                  />
                ) : (
                  <div style={{
                    width:96, height:96, borderRadius:"50%", fontSize:30, fontWeight:800,
                    color:"#fff", background:"rgba(255,255,255,.15)",
                    border:"3px solid rgba(255,255,255,.3)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    backdropFilter:"blur(4px)",
                  }}>
                    {initials()}
                  </div>
                )}
                <label htmlFor="photo-upload" style={{ cursor:"pointer" }}>
                  <motion.div
                    whileHover={{ scale:1.1 }}
                    style={{
                      position:"absolute", bottom:2, right:2,
                      width:28, height:28, borderRadius:"50%",
                      background:"rgba(255,255,255,.9)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:"0 2px 8px rgba(0,0,0,.3)",
                    }}
                  >
                    <FiCamera size={13} color="#6366f1" />
                  </motion.div>
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:"none" }} />
              </div>

              {/* Name + info */}
              <div style={{ flex:1, minWidth:0 }}>
                {isEditing ? (
                  <input
                    value={edited.nombre || ""}
                    onChange={e => change("nombre", e.target.value)}
                    style={{
                      fontSize:24, fontWeight:800, background:"rgba(255,255,255,.1)",
                      border:"1px solid rgba(255,255,255,.3)", borderRadius:8, color:"#fff",
                      padding:"4px 10px", width:"100%", marginBottom:6, outline:"none",
                    }}
                  />
                ) : (
                  <h2 style={{ fontSize:26, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>
                    {profile.nombre || user?.nombre || "Sin nombre"}
                  </h2>
                )}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{
                    fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20,
                    background:"rgba(255,255,255,.15)", color:"rgba(255,255,255,.9)",
                  }}>
                    Miembro
                  </span>
                  <span style={{
                    fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20,
                    background:`${levelColor[nivel]}30`, color:levelColor[nivel],
                    border:`1px solid ${levelColor[nivel]}50`,
                  }}>
                    {nivel}
                  </span>
                  {profile.objetivo && (
                    <span style={{ fontSize:12, color:"rgba(255,255,255,.7)" }}>
                      🎯 {profile.objetivo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Stats row ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
            style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}
          >
            <StatPill icon={<FiAward size={16}/>}     value={profile.mesesActivo}         label="Meses activo"      color="#6366f1" />
            <StatPill icon={<FiActivity size={16}/>}  value={profile.totalEntrenamientos} label="Entrenamientos"    color="#22c55e" />
            <StatPill icon={<FiTrendingUp size={16}/>} value={profile.peso ? `${profile.peso} kg` : null} label="Peso actual" color="#f59e0b" />
            <StatPill icon={<FiTarget size={16}/>}    value={profile.altura ? `${profile.altura} cm` : null} label="Altura" color="#06b6d4" />
          </motion.div>

          {/* ── Info grid ─────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>

            {/* Información de contacto */}
            <motion.div
              className="chart-card"
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15 }}
              style={{ padding:20 }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"rgba(99,102,241,.12)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent)" }}>
                  <FiUser size={15} />
                </div>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Información personal</h3>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <InfoField icon={<FiMail size={15}/>}    label="Email"            field="email"         value={profile.email}         editing={isEditing} editedData={edited} onChange={change} />
                <InfoField icon={<FiPhone size={15}/>}   label="Teléfono"         field="telefono"      value={profile.telefono}      editing={isEditing} editedData={edited} onChange={change} />
                <InfoField icon={<FiCalendar size={15}/>} label="Fecha de nacimiento" field="fechaNacimiento" value={profile.fechaNacimiento} editing={isEditing} editedData={edited} onChange={change} />
                <InfoField icon={<FiMapPin size={15}/>}  label="Dirección"        field="direccion"     value={profile.direccion}     editing={isEditing} editedData={edited} onChange={change} />

                {/* Género — select en modo edición */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px",
                  borderRadius:10, background:"var(--bg-input)", border:"1px solid var(--border)" }}>
                  <div style={{ width:34, height:34, borderRadius:8, flexShrink:0,
                    background:"rgba(99,102,241,.12)", color:"var(--accent)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FiUser size={15}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase",
                      letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:4 }}>Género</div>
                    {isEditing ? (
                      <select value={edited.genero || ""} onChange={e=>change("genero",e.target.value)}
                        style={{ width:"100%", padding:"6px 10px", background:"var(--bg-card)",
                          border:"1px solid var(--accent)", borderRadius:7, color:"var(--text-primary)", fontSize:14 }}>
                        <option value="">Sin especificar</option>
                        {GENEROS.map(g=><option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize:14, fontWeight:500, color: profile.genero ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {profile.genero || "Sin especificar"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Datos físicos y objetivo */}
            <motion.div
              className="chart-card"
              initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2 }}
              style={{ padding:20 }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"rgba(34,197,94,.12)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"#22c55e" }}>
                  <FiActivity size={15} />
                </div>
                <h3 style={{ margin:0, fontSize:15, fontWeight:700 }}>Datos físicos</h3>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <InfoField icon={<FiActivity size={15}/>} label="Peso (kg)"  field="peso"   value={profile.peso}   editing={isEditing} editedData={edited} onChange={change} />
                <InfoField icon={<FiActivity size={15}/>} label="Altura (cm)" field="altura" value={profile.altura} editing={isEditing} editedData={edited} onChange={change} />

                {/* Objetivo — select */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px",
                  borderRadius:10, background:"var(--bg-input)", border:"1px solid var(--border)" }}>
                  <div style={{ width:34, height:34, borderRadius:8, flexShrink:0,
                    background:"rgba(245,158,11,.12)", color:"#f59e0b",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FiTarget size={15}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase",
                      letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:4 }}>Objetivo</div>
                    {isEditing ? (
                      <select value={edited.objetivo || ""} onChange={e=>change("objetivo",e.target.value)}
                        style={{ width:"100%", padding:"6px 10px", background:"var(--bg-card)",
                          border:"1px solid var(--accent)", borderRadius:7, color:"var(--text-primary)", fontSize:14 }}>
                        <option value="">Sin especificar</option>
                        {OBJETIVOS.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize:14, fontWeight:500, color: profile.objetivo ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {profile.objetivo || "Sin especificar"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Nivel */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px",
                  borderRadius:10, background:"var(--bg-input)", border:"1px solid var(--border)" }}>
                  <div style={{ width:34, height:34, borderRadius:8, flexShrink:0,
                    background:"rgba(99,102,241,.12)", color:"var(--accent)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <FiAward size={15}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase",
                      letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:4 }}>Nivel de experiencia</div>
                    {isEditing ? (
                      <select value={edited.nivelExperiencia || ""} onChange={e=>change("nivelExperiencia",e.target.value)}
                        style={{ width:"100%", padding:"6px 10px", background:"var(--bg-card)",
                          border:"1px solid var(--accent)", borderRadius:7, color:"var(--text-primary)", fontSize:14 }}>
                        <option value="">Sin especificar</option>
                        {NIVELES.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:14, fontWeight:600, color: levelColor[nivel] || "var(--text-primary)" }}>
                          {profile.nivelExperiencia || "Sin especificar"}
                        </span>
                        {profile.nivelExperiencia && (
                          <span style={{ width:8, height:8, borderRadius:"50%", background: levelColor[nivel], flexShrink:0 }}/>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
