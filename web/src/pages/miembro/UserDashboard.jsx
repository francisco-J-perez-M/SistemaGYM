import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiActivity, FiTrendingUp, FiTrendingDown, FiZap, FiAward,
  FiCalendar, FiCheckCircle, FiAlertTriangle,
  FiUser, FiHeart, FiBarChart2, FiBook, FiCoffee, FiDollarSign,
  FiMoon, FiShield,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const QUICK_LINKS = [
  { icon: <FiActivity />,    label: "Mi Rutina",       path: "/user/routine",    color: "#6366f1" },
  { icon: <FiTrendingUp />,  label: "Progreso",        path: "/user/progress",   color: "#22c55e" },
  { icon: <FiHeart />,       label: "Salud",           path: "/user/health",     color: "#ef4444" },
  { icon: <FiBarChart2 />,   label: "Predicción",      path: "/user/prediction", color: "#f59e0b" },
  { icon: <FiCoffee />,      label: "Alimentación",    path: "/user/nutrition",  color: "#8b5cf6" },
  { icon: <FiBook />,        label: "Recetas",         path: "/user/recipes",    color: "#06b6d4" },
  { icon: <FiDollarSign />,  label: "Pagos",           path: "/user/payments",   color: "#10b981" },
  { icon: <FiUser />,        label: "Mi Perfil",       path: "/user/profile",    color: "#64748b" },
];

const OBJETIVO_LABELS = {
  "Pérdida de peso":           { Icon: FiTrendingDown, color: "#ef4444" },
  "Ganancia muscular":         { Icon: FiActivity,     color: "#6366f1" },
  "Tonificación muscular":     { Icon: FiZap,          color: "#8b5cf6" },
  "Mejorar resistencia":       { Icon: FiHeart,        color: "#f59e0b" },
  "Rehabilitación / Salud":    { Icon: FiShield,       color: "#22c55e" },
  "Mantenimiento físico":      { Icon: FiAward,        color: "#06b6d4" },
};

const NIVEL_LABELS = { Principiante: "#22c55e", Intermedio: "#f59e0b", Avanzado: "#ef4444" };

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user,          setUser]          = useState(null);
  const [stats,         setStats]         = useState(null);
  const [todayWorkout,  setTodayWorkout]  = useState({ type: "", exercises: [] });
  const [weekProg,      setWeekProg]      = useState([0,0,0,0,0,0,0]);
  const [achievements,  setAchievements]  = useState([]);
  const [membership,    setMembership]    = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (!token()) { navigate("/", { replace: true }); return; }
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const hdrs = { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" };
    try {
      const [dashRes, profRes] = await Promise.all([
        fetch("/api/user/dashboard", { headers: hdrs }),
        fetch("/api/user/profile",   { headers: hdrs }),
      ]);
      if (dashRes.ok) {
        const d = await dashRes.json();
        setStats(d.workoutStats);
        setTodayWorkout(d.todayWorkout);
        setWeekProg(d.weeklyProgress);
        setAchievements(d.achievements);
        setMembership(d.membership);
        if (d.user) {
          setUser(d.user);
          // Merge with existing localStorage to preserve keys like 'foto' set by other modules
          const existing = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
          const merged = { ...existing, ...d.user, foto: d.user.foto_perfil || d.user.foto || existing.foto };
          localStorage.setItem("user", JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("userDataUpdated"));
        }
      }
      if (profRes.ok) {
        const p = await profRes.json();
        setProfile(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleExercise = (i) => {
    const ex = [...todayWorkout.exercises];
    ex[i] = { ...ex[i], completed: !ex[i].completed };
    setTodayWorkout({ ...todayWorkout, exercises: ex });
  };

  const progPct = todayWorkout.exercises.length
    ? Math.round(todayWorkout.exercises.filter(e => e.completed).length / todayWorkout.exercises.length * 100)
    : 0;

  const circumference = 2 * Math.PI * 32;

  if (loading) return (
    <div className="dashboard-layout" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh" }}>
      <div style={{ textAlign:"center", color:"var(--text-secondary)" }}>
        <div className="dashboard-spinner" style={{ margin:"0 auto 16px", width:40, height:40 }} />
        <p>Cargando…</p>
      </div>
    </div>
  );

  const objetivo = profile?.objetivo || "";
  const nivel    = profile?.nivelExperiencia || "";
  const objMeta  = OBJETIVO_LABELS[objetivo] || { Icon: FiAward, color: "var(--accent)" };

  return (
    <div className="dashboard-layout">

      <div className="main-wrapper">
        {/* ── Header ───────────────────────────────── */}
        <header className="top-header" data-guide="us-header">
          <div>
            <h2 className="page-title" style={{ marginBottom:2 }}>
              Hola, {user?.nombre?.split(" ")[0] ?? "Miembro"}
            </h2>
            <p style={{ fontSize:13, color:"var(--text-secondary)", margin:0 }}>
              {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}
            </p>
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {/* Avatar */}
            <div data-guide="us-avatar" style={{
              width:38, height:38, borderRadius:"50%", overflow:"hidden",
              background:"var(--bg-input)", border:"2px solid var(--border)",
              display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", flexShrink:0,
            }}
              onClick={() => navigate("/user/profile")}
            >
              {user?.foto_perfil
                ? <img
    src={user.foto_perfil.startsWith("data:") || user.foto_perfil.startsWith("http") || user.foto_perfil.startsWith("/")
      ? user.foto_perfil
      : `/api/uploads/${user.foto_perfil}`}
    alt=""
    style={{ width:"100%", height:"100%", objectFit:"cover" }}
    onError={e => { e.currentTarget.style.display = "none"; }}
  />
                : <FiUser size={18} color="var(--text-secondary)" />}
            </div>
          </div>
        </header>

        <main className="dashboard-content">

          {/* ── Alerta membresía ────────────────────── */}
          {membership && membership.dias_restantes <= 7 && (
            <motion.div
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.3)",
                borderRadius:10, marginBottom:20, fontSize:14,
              }}
            >
              <FiAlertTriangle color="#fbbf24" style={{ flexShrink:0 }} />
              <span style={{ color:"var(--text-primary)" }}>
                Tu membresía <strong>{membership.plan}</strong> vence en{" "}
                <strong style={{ color:"#fbbf24" }}>{membership.dias_restantes} días</strong>.{" "}
                <span
                  onClick={() => navigate("/user/renew")}
                  style={{ color:"#fbbf24", textDecoration:"underline", cursor:"pointer" }}
                >
                  Renovar ahora
                </span>
              </span>
            </motion.div>
          )}

          {/* ── Banner de objetivo ───────────────────── */}
          {objetivo && (
            <motion.div
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{
                background:`linear-gradient(135deg,${objMeta.color}18,${objMeta.color}06)`,
                border:`1px solid ${objMeta.color}33`,
                borderRadius:14, padding:"20px 24px", marginBottom:24,
                display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16,
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:`${objMeta.color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <objMeta.Icon size={22} color={objMeta.color}/>
                </div>
                <div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:2, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>Tu objetivo</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>{objetivo}</div>
                  {nivel && (
                    <div style={{
                      display:"inline-block", marginTop:4, padding:"2px 10px",
                      borderRadius:20, fontSize:11, fontWeight:700,
                      background:`${NIVEL_LABELS[nivel]}22`, color:NIVEL_LABELS[nivel] || "#94a3b8",
                    }}>
                      {nivel}
                    </div>
                  )}
                </div>
              </div>

              {/* Progreso hoy */}
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <svg width="72" height="72" style={{ transform:"rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="32" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <motion.circle
                    cx="36" cy="36" r="32" fill="none"
                    stroke={objMeta.color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - progPct / 100) }}
                    transition={{ duration:1.2, ease:"easeOut" }}
                  />
                </svg>
                <div style={{ position:"absolute", width:72, height:72, display:"flex", alignItems:"center", justifyContent:"center", marginLeft:-0 }}>
                </div>
                <div style={{ marginLeft:-80, width:72, height:72, position:"relative" }}>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:16, fontWeight:800, color:objMeta.color }}>{progPct}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)" }}>Rutina de hoy</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>
                    {todayWorkout.exercises.filter(e=>e.completed).length}/{todayWorkout.exercises.length} ejercicios
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── KPI cards ───────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:24 }}>
            {[
              { icon:<FiZap/>,          label:"Racha",       value:stats?.streakDays ?? 0,   unit:"días",    color:"#f59e0b" },
              { icon:<FiActivity/>,     label:"Entrenam.",   value:stats?.totalWorkouts ?? 0, unit:"este mes",color:"#6366f1" },
              { icon:<FiTrendingDown/>, label:"Calorías",    value:(stats?.caloriesBurned ?? 0).toLocaleString(), unit:"quemadas",color:"#ef4444" },
              { icon:<FiTrendingUp/>,   label:"Peso actual", value:stats?.currentWeight > 0 ? stats.currentWeight.toFixed(1) : "—", unit:"kg", color:"#22c55e" },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  background:"var(--bg-card)", border:"1px solid var(--border)",
                  borderRadius:12, padding:"18px 16px",
                  borderTop:`3px solid ${k.color}`,
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${k.color}18`, display:"flex", alignItems:"center", justifyContent:"center", color:k.color }}>
                    {k.icon}
                  </div>
                  <span style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600 }}>{k.label}</span>
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4 }}>{k.unit}</div>
              </motion.div>
            ))}
          </div>

          {/* ── Middle row: rutina + semana ─────────── */}
          <div className="charts-row" style={{ marginBottom:24 }}>
            {/* Rutina de hoy */}
            <motion.div
              className="chart-card"
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.2 }}
            >
              <div className="chart-header">
                <h3 style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FiActivity style={{ color:"var(--accent)" }} /> Rutina de hoy — {todayWorkout.type || "Descanso"}
                </h3>
              </div>

              <div style={{ padding:"0 4px" }}>
                {todayWorkout.exercises.length === 0 ? (
                  <div style={{ padding:"32px", textAlign:"center", color:"var(--text-secondary)" }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:"rgba(100,116,139,.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                      <FiMoon size={24} color="#64748b"/>
                    </div>
                    <p>Día de descanso — tu cuerpo necesita recuperarse.</p>
                  </div>
                ) : (
                  <div>
                    {/* Mini progress bar */}
                    <div style={{ padding:"8px 0 16px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-secondary)", marginBottom:6 }}>
                        <span>{todayWorkout.exercises.filter(e=>e.completed).length} de {todayWorkout.exercises.length} completados</span>
                        <span style={{ color:"var(--accent)", fontWeight:700 }}>{progPct}%</span>
                      </div>
                      <div style={{ height:4, background:"var(--border)", borderRadius:4, overflow:"hidden" }}>
                        <motion.div
                          style={{ height:"100%", background:"var(--accent)", borderRadius:4 }}
                          initial={{ width:0 }} animate={{ width:`${progPct}%` }}
                          transition={{ duration:1, delay:.3 }}
                        />
                      </div>
                    </div>

                    {todayWorkout.exercises.map((ex, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ x: 3 }}
                        onClick={() => toggleExercise(i)}
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          padding:"10px 0", borderBottom:"1px solid var(--border)",
                          cursor:"pointer", fontSize:14,
                        }}
                      >
                        <div style={{
                          width:22, height:22, borderRadius:6, flexShrink:0,
                          border:`2px solid ${ex.completed ? "#22c55e" : "var(--border)"}`,
                          background: ex.completed ? "#22c55e" : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          transition:"all .2s",
                        }}>
                          {ex.completed && <FiCheckCircle size={13} color="#fff" />}
                        </div>
                        <span style={{ flex:1, textDecoration: ex.completed ? "line-through" : "none", color: ex.completed ? "var(--text-secondary)" : "var(--text-primary)" }}>
                          {ex.name}
                        </span>
                        <span style={{ fontSize:12, color:"var(--text-secondary)", background:"var(--bg-input)", padding:"2px 8px", borderRadius:6 }}>
                          {ex.sets}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Semana */}
            <motion.div
              className="chart-card"
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:.25 }}
            >
              <div className="chart-header">
                <h3 style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FiCalendar style={{ color:"var(--accent)" }} /> Semana actual
                </h3>
              </div>

              <div style={{ padding:"8px 0 4px", display:"flex", justifyContent:"space-between", alignItems:"flex-end", height:120 }}>
                {DIAS.map((d, i) => {
                  const val   = weekProg[i === 0 ? 6 : i - 1] || 0; // lunes=0 en backend, 0=dom en JS
                  const today = i === new Date().getDay();
                  return (
                    <div key={d} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flex:1 }}>
                      <motion.div
                        initial={{ height:0 }} animate={{ height: val > 0 ? 60 : 8 }}
                        transition={{ duration:.7, delay: i * .06 }}
                        style={{
                          width: today ? 18 : 14, borderRadius:4,
                          background: val > 0 ? (today ? "var(--accent)" : "var(--accent)88") : "var(--border)",
                        }}
                      />
                      <span style={{ fontSize:10, fontWeight: today ? 700 : 400, color: today ? "var(--accent)" : "var(--text-secondary)" }}>
                        {d}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop:16, padding:"14px 16px", background:"var(--bg-input)", borderRadius:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                  <span style={{ color:"var(--text-secondary)" }}>Asistencias esta semana</span>
                  <span style={{ fontWeight:700, color:"var(--accent)" }}>
                    {weekProg.filter(v => v > 0).length} / 7 días
                  </span>
                </div>
                <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                  <motion.div
                    style={{ height:"100%", background:"var(--accent)", borderRadius:3 }}
                    initial={{ width:0 }}
                    animate={{ width:`${(weekProg.filter(v=>v>0).length / 7) * 100}%` }}
                    transition={{ duration:1, delay:.4 }}
                  />
                </div>
              </div>

              {/* Membresía status */}
              {membership && (
                <div data-guide="us-membership" style={{ marginTop:14, padding:"12px 16px", background:"var(--bg-input)", borderRadius:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:2 }}>Membresía</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{membership.plan}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:2 }}>Vence</div>
                      <div style={{
                        fontSize:13, fontWeight:700,
                        color: membership.dias_restantes <= 7 ? "#f59e0b" : "#22c55e",
                      }}>
                        {membership.dias_restantes > 0 ? `${membership.dias_restantes} días` : "Vencida"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Accesos rápidos ──────────────────────── */}
          <motion.div
            data-guide="us-quicklinks"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35 }}
            style={{ marginBottom:24 }}
          >
            <h3 style={{ fontSize:14, fontWeight:700, color:"var(--text-secondary)", marginBottom:12, textTransform:"uppercase", letterSpacing:".06em" }}>
              Accesos rápidos
            </h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:10 }}>
              {QUICK_LINKS.map((ql, i) => (
                <motion.div
                  key={ql.path}
                  initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: .35 + i*.04 }}
                  whileHover={{ scale:1.04, y:-2 }}
                  onClick={() => navigate(ql.path)}
                  style={{
                    background:"var(--bg-card)", border:"1px solid var(--border)",
                    borderRadius:10, padding:"14px 10px", textAlign:"center",
                    cursor:"pointer", transition:"box-shadow .2s",
                  }}
                >
                  <div style={{ width:36, height:36, borderRadius:9, background:`${ql.color}18`, display:"flex", alignItems:"center", justifyContent:"center", color:ql.color, fontSize:18, margin:"0 auto 8px" }}>
                    {ql.icon}
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{ql.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Logros ──────────────────────────────── */}
          {achievements.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45 }}
              style={{
                background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14,
              }}
            >
              <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
                <FiAward style={{ color:"var(--accent)" }} />
                <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>Logros recientes</h3>
              </div>
              <div style={{ padding:"12px 16px", display:"flex", gap:12, flexWrap:"wrap" }}>
                {achievements.map((a, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale:1.04 }}
                    style={{
                      display:"flex", alignItems:"center", gap:10,
                      padding:"10px 14px", background:"var(--bg-input)",
                      border:"1px solid var(--border)", borderRadius:10, fontSize:13,
                    }}
                  >
                    <div style={{ width:36, height:36, borderRadius:9, background:`${a.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:a.color }}>
                      {a.icon === "FaFire"    ? <FiZap size={16}/>
                      : a.icon === "FaDumbbell" ? <FiActivity size={16}/>
                      : a.icon === "FaTrophy"   ? <FiAward size={16}/>
                      : <FiZap size={16}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:"var(--text-primary)" }}>{a.title}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{a.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
