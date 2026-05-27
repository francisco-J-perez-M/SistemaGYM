import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiTrash2, FiEdit2, FiCheckCircle, FiSearch,
  FiClock, FiUsers, FiChevronDown, FiChevronUp, FiSave,
  FiAlertCircle, FiX, FiBookOpen, FiList, FiZap,
  FiGrid, FiActivity, FiTrendingDown, FiAward, FiFeather,
  FiCrosshair, FiSun, FiMoon, FiCoffee, FiShoppingCart, FiCheck,
  FiClipboard, FiUser,
} from "react-icons/fi";
import { GiMeal, GiWeightLiftingUp, GiSalad, GiAvocado, GiMortar } from "react-icons/gi";
import "../../css/CSSUnificado.css";

/* ─── helpers ─────────────────────────────────────────────────── */
const token    = () => localStorage.getItem("token");
const authHdrs = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });
const fmt      = (n) => (n > 0 ? `${n}` : "—");

const CATEGORIAS = [
  "General", "Alto en Proteína", "Bajo en Calorías", "Pre-Entrenamiento",
  "Post-Entrenamiento", "Vegetariana", "Keto", "Desayuno", "Cena", "Snack",
];
const COMIDAS = ["Desayuno", "Snack Mañana", "Almuerzo", "Merienda", "Cena"];

/* ── categoría → icono ─── */
const CAT_ICON = {
  "General":            FiGrid,
  "Alto en Proteína":   GiWeightLiftingUp,
  "Bajo en Calorías":   FiTrendingDown,
  "Pre-Entrenamiento":  FiZap,
  "Post-Entrenamiento": FiActivity,
  "Vegetariana":        GiSalad,
  "Keto":               GiAvocado,
  "Desayuno":           FiSun,
  "Cena":               FiMoon,
  "Snack":              FiCoffee,
};
/* ── comida → icono ─── */
const MEAL_ICON = {
  "Desayuno":    FiSun,
  "Snack Mañana": FiCoffee,
  "Almuerzo":    FiSun,
  "Merienda":    FiCoffee,
  "Cena":        FiMoon,
};
/* ── categoría → color ─── */
const CAT_COLOR = {
  "General": "#6366f1", "Alto en Proteína": "#ef4444", "Bajo en Calorías": "#22c55e",
  "Pre-Entrenamiento": "#f59e0b", "Post-Entrenamiento": "#06b6d4", "Vegetariana": "#84cc16",
  "Keto": "#a855f7", "Desayuno": "#f59e0b", "Cena": "#6366f1", "Snack": "#ec4899",
};

/* ─── Pill tab ────────────────────────────────────────────────── */
function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
        background: active ? "var(--accent)" : "var(--bg-input)",
        color: active ? "#fff" : "var(--text-secondary)",
        fontWeight: active ? 700 : 500, fontSize: 13, transition: "all .2s",
        whiteSpace: "nowrap",
      }}
    >
      {icon}{children}
    </button>
  );
}

/* ─── Macro pill ──────────────────────────────────────────────── */
function MacroPill({ label, value, color }) {
  if (!value || value <= 0) return null;
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: `${color}18`, color, fontWeight: 600,
    }}>
      {label} {value}g
    </span>
  );
}

/* ─── RecetaCard (grid tile) ──────────────────────────────────── */
function RecetaCard({ rec, ownUserId, onEdit, onDelete, onConsume }) {
  const [open, setOpen] = useState(false);
  const isOwn   = rec.id_creador_pg === ownUserId;
  const color   = CAT_COLOR[rec.categoria] || "#6366f1";
  const CatIcon = CAT_ICON[rec.categoria]  || FiGrid;

  return (
    <motion.div
      layout
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14,
        overflow: "hidden", display: "flex", flexDirection: "column",
        transition: "box-shadow .2s",
      }}
      whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,.18)" }}
    >
      {/* Color top bar */}
      <div style={{ height: 4, background: rec.consumida_hoy ? "#22c55e" : color }} />

      {/* Body */}
      <div style={{ padding: "16px 18px", flex: 1, cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        {/* Category chip + actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: `${color}18`, color,
          }}>
            <CatIcon size={11}/> {rec.categoria}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
            {rec.consumida_hoy && (
              <span title="Consumida hoy" style={{ color: "#22c55e" }}><FiCheckCircle size={14} /></span>
            )}
            {isOwn && (
              <>
                <button onClick={() => onEdit(rec)} style={{ background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",padding:4 }}><FiEdit2 size={13}/></button>
                <button onClick={() => onDelete(rec._id)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:4 }}><FiTrash2 size={13}/></button>
              </>
            )}
            <span style={{ color:"var(--text-secondary)", paddingLeft:2 }}>
              {open ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 style={{ margin: "0 0 5px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {rec.titulo}
        </h4>
        {rec.descripcion && (
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow:"hidden" }}>
            {rec.descripcion}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          {rec.calorias > 0 && (
            <span style={{ fontSize:13, fontWeight:700, color, display:"flex", alignItems:"center", gap:4 }}>
              <FiZap size={11}/> {rec.calorias} kcal
            </span>
          )}
          {rec.tiempo_prep > 0 && (
            <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:3 }}>
              <FiClock size={11}/> {rec.tiempo_prep} min
            </span>
          )}
          {rec.porciones > 0 && (
            <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:3 }}>
              <FiUsers size={11}/> {rec.porciones}p
            </span>
          )}
        </div>

        {/* Macros */}
        {(rec.proteina > 0 || rec.carbos > 0 || rec.grasa > 0) && (
          <div style={{ display:"flex", gap:5, marginTop:8, flexWrap:"wrap" }}>
            <MacroPill label="P" value={rec.proteina} color="#ef4444"/>
            <MacroPill label="C" value={rec.carbos}   color="#f59e0b"/>
            <MacroPill label="G" value={rec.grasa}    color="#6366f1"/>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
            style={{ overflow:"hidden" }}
          >
            <div style={{ padding:"0 18px 18px", borderTop:"1px solid var(--border)" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:14 }}>
                {rec.ingredientes?.length > 0 && (
                  <div>
                    <h5 style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:8, margin:"0 0 8px",
                      display:"flex", alignItems:"center", gap:5 }}>
                      <FiShoppingCart size={11}/> Ingredientes
                    </h5>
                    {rec.ingredientes.map((ing, i) => (
                      <div key={i} style={{ fontSize:12, color:"var(--text-primary)", padding:"4px 0",
                        borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ color, fontSize:9 }}>●</span> {ing}
                      </div>
                    ))}
                  </div>
                )}
                {rec.pasos?.length > 0 && (
                  <div>
                    <h5 style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:".05em", color:"var(--text-secondary)", margin:"0 0 8px",
                      display:"flex", alignItems:"center", gap:5 }}>
                      <GiMortar size={12}/> Preparación
                    </h5>
                    {rec.pasos.map((paso, i) => (
                      <div key={i} style={{ fontSize:12, color:"var(--text-primary)", padding:"4px 0",
                        borderBottom:"1px solid var(--border)", display:"flex", gap:7 }}>
                        <span style={{ color, fontWeight:700, flexShrink:0, fontSize:11 }}>{i+1}.</span>
                        <span>{paso}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consume buttons */}
              <div style={{ marginTop:14 }}>
                {rec.consumida_hoy ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                    background:"rgba(34,197,94,.1)", borderRadius:9,
                    color:"#4ade80", fontSize:13, fontWeight:600 }}>
                    <FiCheckCircle size={15}/> Registrada como consumida hoy
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:6, textTransform:"uppercase",
                      fontWeight:600, letterSpacing:".04em" }}>¿Cuándo la consumiste?</p>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {COMIDAS.map(c => {
                        const MIcon = MEAL_ICON[c] || FiSun;
                        return (
                        <button key={c} onClick={() => onConsume(rec._id, c)}
                          style={{
                            display:"flex", alignItems:"center", gap:5,
                            padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", borderRadius:8,
                            background:`${color}15`, border:`1px solid ${color}35`, color,
                            transition:"all .15s",
                          }}
                        >
                          <MIcon size={11}/> {c}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── RecetaForm (modal) ──────────────────────────────────────── */
function RecetaForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || {
    titulo:"", descripcion:"", categoria:"General", tiempo_prep:"", porciones:"1",
    calorias:"", proteina:"", carbos:"", grasa:"",
    ingredientes:[""], pasos:[""],
  });
  const set     = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setList = (k, i, v) => setForm(f => { const arr = [...f[k]]; arr[i] = v; return { ...f, [k]: arr }; });
  const addItem  = (k) => setForm(f => ({ ...f, [k]: [...f[k], ""] }));
  const removeItem = (k, i) => setForm(f => { const arr = [...f[k]]; arr.splice(i,1); return {...f,[k]:arr}; });

  const valid = form.titulo.trim().length > 0;

  const Inp = ({ label, fk, type="text", ...rest }) => (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase",
        color:"var(--text-secondary)", marginBottom:4 }}>{label}</label>
      <input type={type} value={form[fk]} onChange={e=>set(fk,e.target.value)}
        style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)",
          borderRadius:8, color:"var(--text-primary)", fontSize:13 }}
        {...rest}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.65)", zIndex:200,
        display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
    >
      <motion.div
        initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.92, opacity:0 }}
        onClick={e => e.stopPropagation()}
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:18, padding:24,
          maxWidth:600, width:"100%", maxHeight:"88vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontWeight:700 }}>{initial ? "Editar receta" : "Nueva receta"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer" }}><FiX size={18}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Inp label="Nombre *" fk="titulo" placeholder="Ej. Pollo con Quinoa" />

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase",
              color:"var(--text-secondary)", marginBottom:4 }}>Categoría</label>
            <select value={form.categoria} onChange={e=>set("categoria",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)",
                borderRadius:8, color:"var(--text-primary)", fontSize:13 }}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase",
              color:"var(--text-secondary)", marginBottom:4 }}>Descripción</label>
            <textarea value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={2}
              style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)",
                borderRadius:8, color:"var(--text-primary)", fontSize:13, resize:"vertical" }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Tiempo prep (min)" fk="tiempo_prep" type="number" min="0" />
            <Inp label="Porciones" fk="porciones" type="number" min="1" />
            <Inp label="Calorías" fk="calorias" type="number" min="0" />
            <Inp label="Proteína (g)" fk="proteina" type="number" min="0" step="0.1" />
            <Inp label="Carbohidratos (g)" fk="carbos" type="number" min="0" step="0.1" />
            <Inp label="Grasas (g)" fk="grasa" type="number" min="0" step="0.1" />
          </div>

          {/* Ingredientes */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)" }}>Ingredientes</label>
              <button onClick={() => addItem("ingredientes")}
                style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:4 }}>
                <FiPlus size={12}/> Añadir
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {form.ingredientes.map((ing, i) => (
                <div key={i} style={{ display:"flex", gap:6 }}>
                  <input value={ing} onChange={e=>setList("ingredientes",i,e.target.value)} placeholder={`Ingrediente ${i+1}`}
                    style={{ flex:1, padding:"7px 10px", background:"var(--bg-input)", border:"1px solid var(--border)",
                      borderRadius:7, color:"var(--text-primary)", fontSize:13 }} />
                  {form.ingredientes.length > 1 && (
                    <button onClick={()=>removeItem("ingredientes",i)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px" }}><FiX size={13}/></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pasos */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)" }}>Pasos de preparación</label>
              <button onClick={() => addItem("pasos")}
                style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:4 }}>
                <FiPlus size={12}/> Añadir
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {form.pasos.map((paso, i) => (
                <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                  <span style={{ color:"var(--accent)", fontWeight:700, fontSize:12, minWidth:18, paddingTop:10 }}>{i+1}.</span>
                  <textarea value={paso} onChange={e=>setList("pasos",i,e.target.value)} rows={2} placeholder={`Paso ${i+1}`}
                    style={{ flex:1, padding:"7px 10px", background:"var(--bg-input)", border:"1px solid var(--border)",
                      borderRadius:7, color:"var(--text-primary)", fontSize:13, resize:"vertical" }} />
                  {form.pasos.length > 1 && (
                    <button onClick={()=>removeItem("pasos",i)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px",paddingTop:8 }}><FiX size={13}/></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => valid && onSave(form)} disabled={!valid}
          style={{ width:"100%", marginTop:20, padding:"12px", background: valid ? "var(--accent)" : "var(--bg-input)",
            border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor: valid ? "pointer" : "not-allowed",
            opacity: valid ? 1 : .6, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:14 }}>
          <FiSave /> {initial ? "Guardar cambios" : "Crear receta"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── DietaCard ───────────────────────────────────────────────── */
function DietaCard({ dieta, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const isPropia  = dieta.creado_por === "miembro";
  const totalCal  = (dieta.comidas || []).reduce((s,c) => s + (parseInt(c.calorias)||0), 0);
  const color     = isPropia ? "var(--accent)" : "#22c55e";

  return (
    <motion.div
      layout
      style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:14,
        overflow:"hidden" }}
      whileHover={{ boxShadow:"0 4px 18px rgba(0,0,0,.16)" }}
    >
      <div style={{ height:3, background: color }} />
      <div style={{ padding:"16px 18px", cursor:"pointer" }} onClick={() => setOpen(o=>!o)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>{dieta.nombre}</span>
              <span style={{
                fontSize:11, padding:"2px 9px", borderRadius:20, fontWeight:700,
                background: isPropia ? "rgba(99,102,241,.15)" : "rgba(34,197,94,.15)",
                color,
              }}>
                {isPropia
                ? <><FiEdit2 size={10}/> Propia</>
                : <><FiUser size={10}/> Asignada</>
              }
              </span>
            </div>
            {dieta.descripcion && (
              <p style={{ fontSize:12, color:"var(--text-secondary)", margin:"0 0 8px" }}>{dieta.descripcion}</p>
            )}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              {totalCal > 0 && (
                <span style={{ fontSize:13, fontWeight:700, color, display:"flex", alignItems:"center", gap:4 }}>
                  <FiZap size={11}/> {totalCal} kcal/día
                </span>
              )}
              {dieta.comidas?.length > 0 && (
                <span style={{ fontSize:12, color:"var(--text-secondary)" }}>
                  {dieta.comidas.length} comidas
                </span>
              )}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, paddingLeft:8 }}>
            {isPropia && (
              <>
                <button onClick={e=>{e.stopPropagation();onEdit(dieta);}}
                  style={{ background:"none",border:"none",color:"var(--accent)",cursor:"pointer",padding:4 }}><FiEdit2 size={13}/></button>
                <button onClick={e=>{e.stopPropagation();onDelete(dieta._id);}}
                  style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:4 }}><FiTrash2 size={13}/></button>
              </>
            )}
            <span style={{ color:"var(--text-secondary)" }}>
              {open ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && dieta.comidas?.length > 0 && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{ padding:"0 18px 16px", borderTop:"1px solid var(--border)" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:1, marginTop:12 }}>
                {dieta.comidas.map((c,i) => (
                  <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        {(() => { const MI = MEAL_ICON[c.nombre] || FiSun; return <MI size={14} color="var(--accent)"/>; })()}
                        <span style={{ fontWeight:600, fontSize:13, color:"var(--text-primary)" }}>{c.nombre}</span>
                        {c.hora && <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{c.hora}</span>}
                      </div>
                      {c.alimentos?.length > 0 && (
                        <div style={{ fontSize:12, color:"var(--text-secondary)", paddingLeft:22 }}>
                          {c.alimentos.filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                    {c.calorias > 0 && (
                      <span style={{ fontSize:13, fontWeight:700, color, flexShrink:0, paddingLeft:12 }}>
                        {c.calorias} kcal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── DietaForm (modal) ───────────────────────────────────────── */
function DietaForm({ initial, onSave, onClose }) {
  const [nombre,  setNombre]  = useState(initial?.nombre || "");
  const [desc,    setDesc]    = useState(initial?.descripcion || "");
  const [comidas, setComidas] = useState(
    initial?.comidas || [{ nombre:"Desayuno", hora:"08:00", calorias:"", alimentos:[""] }]
  );

  const addComida  = () => setComidas(c => [...c, { nombre:"", hora:"", calorias:"", alimentos:[""] }]);
  const setC       = (i, k, v) => setComidas(c => { const a=[...c]; a[i]={...a[i],[k]:v}; return a; });
  const removeC    = (i) => setComidas(c => c.filter((_,idx)=>idx!==i));
  const addAl      = (ci) => setComidas(c => { const a=[...c]; a[ci].alimentos=[...a[ci].alimentos,""]; return a; });
  const setAl      = (ci,ai,v) => setComidas(c => { const a=[...c]; const als=[...a[ci].alimentos]; als[ai]=v; a[ci]={...a[ci],alimentos:als}; return a; });
  const removeAl   = (ci,ai) => setComidas(c => { const a=[...c]; a[ci].alimentos=a[ci].alimentos.filter((_,i)=>i!==ai); return a; });

  return (
    <motion.div
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:200,
        display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
    >
      <motion.div
        initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.92,opacity:0}}
        onClick={e=>e.stopPropagation()}
        style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:18,
          padding:24,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto" }}
      >
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <h3 style={{ margin:0, fontWeight:700 }}>{initial?"Editar":"Nueva"} Dieta</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)" }}><FiX size={18}/></button>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:16 }}>
          <div>
            <label style={{ display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",
              color:"var(--text-secondary)",marginBottom:4 }}>Nombre</label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Mi plan semanal"
              style={{ width:"100%",padding:"9px 12px",background:"var(--bg-input)",border:"1px solid var(--border)",
                borderRadius:8,color:"var(--text-primary)",fontSize:13 }} />
          </div>
          <div>
            <label style={{ display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",
              color:"var(--text-secondary)",marginBottom:4 }}>Descripción</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
              style={{ width:"100%",padding:"9px 12px",background:"var(--bg-input)",border:"1px solid var(--border)",
                borderRadius:8,color:"var(--text-primary)",fontSize:13,resize:"vertical" }} />
          </div>
        </div>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <span style={{ fontWeight:700,fontSize:13 }}>Comidas del día</span>
          <button onClick={addComida}
            style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 12px",
              background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:7,
              cursor:"pointer",color:"var(--accent)",fontSize:12 }}>
            <FiPlus size={12}/> Añadir comida
          </button>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:20 }}>
          {comidas.map((c,ci) => (
            <div key={ci} style={{ background:"var(--bg-input)",borderRadius:10,padding:14 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 80px 80px auto",gap:8,marginBottom:8 }}>
                <input value={c.nombre} onChange={e=>setC(ci,"nombre",e.target.value)} placeholder="Desayuno"
                  style={{ padding:"7px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:13 }} />
                <input value={c.hora} onChange={e=>setC(ci,"hora",e.target.value)} type="time"
                  style={{ padding:"7px 8px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:12 }} />
                <input value={c.calorias} onChange={e=>setC(ci,"calorias",e.target.value)} placeholder="kcal" type="number"
                  style={{ padding:"7px 8px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:12 }} />
                <button onClick={()=>removeC(ci)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px" }}><FiTrash2 size={13}/></button>
              </div>
              {(c.alimentos||[]).map((al,ai) => (
                <div key={ai} style={{ display:"flex",gap:6,marginBottom:5 }}>
                  <input value={al} onChange={e=>setAl(ci,ai,e.target.value)} placeholder={`Alimento ${ai+1}`}
                    style={{ flex:1,padding:"6px 8px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:12 }} />
                  {c.alimentos.length > 1 && (
                    <button onClick={()=>removeAl(ci,ai)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer" }}><FiX size={11}/></button>
                  )}
                </div>
              ))}
              <button onClick={()=>addAl(ci)}
                style={{ fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"2px 0",display:"flex",alignItems:"center",gap:4 }}>
                <FiPlus size={10}/> alimento
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => nombre.trim() && onSave({ nombre, descripcion:desc, comidas })} disabled={!nombre.trim()}
          style={{ width:"100%",padding:"12px",background:nombre.trim()?"var(--accent)":"var(--bg-input)",
            border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:nombre.trim()?"pointer":"not-allowed",
            opacity:nombre.trim()?1:.6,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:14 }}>
          <FiSave /> {initial?"Guardar":"Crear dieta"}
        </button>
      </motion.div>
    </motion.div>
  );
}


/* ─── Main ────────────────────────────────────────────────────── */
export default function UserMealPlan() {
  const navigate   = useNavigate();
  const location   = useLocation();

  // Determine active tab from route
  const initTab = location.pathname.includes("/recipes") ? "recetas"
    : location.pathname.includes("/meal-plan") ? "asignadas" : "asignadas";

  const [tab,       setTab]     = useState(initTab);
  const [dietas,    setDietas]  = useState([]);
  const [recetas,   setRecetas] = useState([]);
  const [loading,   setLoading] = useState(true);
  const [err,       setErr]     = useState(null);
  const [search,    setSearch]  = useState("");
  const [catFilter, setCat]     = useState("Todas");

  // modals
  const [recetaModal, setRecetaModal] = useState(null);
  const [dietaModal,  setDietaModal]  = useState(null);

  const ownUserId = parseInt(JSON.parse(localStorage.getItem("user") || "{}").id_pg || "0");

  useEffect(() => {
    if (!token()) { navigate("/", { replace:true }); return; }
    loadAll();
  }, []);

  // Sync tab if route changes
  useEffect(() => {
    if (location.pathname.includes("/recipes")) setTab("recetas");
    else if (location.pathname.includes("/meal-plan")) setTab("asignadas");
  }, [location.pathname]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dR, rR] = await Promise.all([
        fetch("/api/user/nutrition/dietas",  { headers: authHdrs() }),
        fetch("/api/user/nutrition/recetas", { headers: authHdrs() }),
      ]);
      if (dR.ok) { const d = await dR.json(); setDietas(d.dietas || []); }
      if (rR.ok) { const r = await rR.json(); setRecetas(r.recetas || []); }
      setErr(null);
    } catch { setErr("No se pudieron cargar los datos."); }
    finally { setLoading(false); }
  };

  /* ── CRUD dietas ───── */
  const saveDieta = async (form) => {
    const isEdit = dietaModal?.editing;
    const url    = isEdit ? `/api/user/nutrition/dietas/${isEdit._id}` : "/api/user/nutrition/dietas";
    const res    = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHdrs(), body: JSON.stringify(form) });
    if (res.ok) { setDietaModal(null); loadAll(); }
  };
  const deleteDieta = async (id) => {
    if (!window.confirm("¿Eliminar esta dieta?")) return;
    await fetch(`/api/user/nutrition/dietas/${id}`, { method:"DELETE", headers: authHdrs() });
    loadAll();
  };

  /* ── CRUD recetas ──── */
  const saveReceta = async (form) => {
    const isEdit = recetaModal?.editing;
    const url    = isEdit ? `/api/user/nutrition/recetas/${isEdit._id}` : "/api/user/nutrition/recetas";
    const res    = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: authHdrs(), body: JSON.stringify(form) });
    if (res.ok) { setRecetaModal(null); loadAll(); }
  };
  const deleteReceta = async (id) => {
    if (!window.confirm("¿Eliminar esta receta?")) return;
    await fetch(`/api/user/nutrition/recetas/${id}`, { method:"DELETE", headers: authHdrs() });
    loadAll();
  };
  const consumirReceta = async (id, comida) => {
    await fetch(`/api/user/nutrition/recetas/${id}/consumir`, {
      method:"POST", headers: authHdrs(), body: JSON.stringify({ comida }),
    });
    loadAll();
  };

  /* ── Filters ─── */
  const dietasAsignadas = dietas.filter(d => d.creado_por === "entrenador");
  const dietasPropias   = dietas.filter(d => d.creado_por === "miembro");
  const categorias      = ["Todas", ...new Set(recetas.map(r => r.categoria).filter(Boolean))];
  const recetasFilt     = recetas.filter(r =>
    (catFilter === "Todas" || r.categoria === catFilter) &&
    (r.titulo.toLowerCase().includes(search.toLowerCase()) ||
     (r.descripcion||"").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Alimentación</h2>
          {tab === "misdietas" && (
            <motion.button whileTap={{ scale:.96 }}
              onClick={() => setDietaModal({ editing:false })}
              style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",
                background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>
              <FiPlus size={13}/> Nueva Dieta
            </motion.button>
          )}
          {tab === "recetas" && (
            <motion.button whileTap={{ scale:.96 }}
              onClick={() => setRecetaModal({ editing:false })}
              style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",
                background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>
              <FiPlus size={13}/> Nueva Receta
            </motion.button>
          )}
        </header>

        <main className="dashboard-content">
          {err && (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",
              background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",
              borderRadius:9,marginBottom:16,color:"#f87171",fontSize:13 }}>
              <FiAlertCircle/> {err}
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
            <TabBtn icon={<GiMeal size={14}/>} active={tab==="asignadas"} onClick={() => setTab("asignadas")}>
              Plan Asignado {dietasAsignadas.length > 0 && (
                <span style={{ background:"rgba(255,255,255,.25)", borderRadius:20, padding:"1px 7px", fontSize:11 }}>
                  {dietasAsignadas.length}
                </span>
              )}
            </TabBtn>
            <TabBtn icon={<FiList size={14}/>} active={tab==="misdietas"} onClick={() => setTab("misdietas")}>
              Mis Dietas {dietasPropias.length > 0 && (
                <span style={{ background:"rgba(255,255,255,.25)", borderRadius:20, padding:"1px 7px", fontSize:11 }}>
                  {dietasPropias.length}
                </span>
              )}
            </TabBtn>
            <TabBtn icon={<FiBookOpen size={14}/>} active={tab==="recetas"} onClick={() => setTab("recetas")}>
              Recetas {recetas.length > 0 && (
                <span style={{ background:"rgba(255,255,255,.25)", borderRadius:20, padding:"1px 7px", fontSize:11 }}>
                  {recetas.length}
                </span>
              )}
            </TabBtn>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
              <div className="dashboard-spinner" style={{ margin:"0 auto 16px" }}/>
              <p>Cargando…</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">

              {/* ── Plan Asignado ── */}
              {tab === "asignadas" && (
                <motion.div key="asignadas"
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                >
                  {dietasAsignadas.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"80px 20px" }}>
                      <div style={{ width:64, height:64, borderRadius:16, background:"rgba(99,102,241,.1)",
                        display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                        <GiMeal size={30} color="var(--accent)"/>
                      </div>
                      <h3 style={{ color:"var(--text-primary)", marginBottom:8, fontWeight:700 }}>
                        Sin plan asignado
                      </h3>
                      <p style={{ color:"var(--text-secondary)", maxWidth:320, margin:"0 auto" }}>
                        Tu entrenador todavía no te ha asignado un plan alimenticio.
                        Cuando lo haga, aparecerá aquí con tus comidas del día.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {dietasAsignadas.map(d => (
                        <DietaCard key={d._id} dieta={d} onEdit={()=>{}} onDelete={()=>{}} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Mis Dietas ── */}
              {tab === "misdietas" && (
                <motion.div key="misdietas"
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                >
                  {dietasPropias.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"80px 20px" }}>
                      <div style={{ width:64, height:64, borderRadius:16, background:"rgba(99,102,241,.1)",
                        display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                        <FiClipboard size={28} color="var(--accent)"/>
                      </div>
                      <h3 style={{ color:"var(--text-primary)", marginBottom:8, fontWeight:700 }}>
                        Crea tu primer plan
                      </h3>
                      <p style={{ color:"var(--text-secondary)", maxWidth:300, margin:"0 auto 20px" }}>
                        Organiza tus comidas del día y lleva un registro de tu alimentación.
                      </p>
                      <motion.button whileTap={{scale:.96}}
                        onClick={() => setDietaModal({ editing:false })}
                        style={{ padding:"10px 24px",background:"var(--accent)",border:"none",borderRadius:10,
                          color:"#fff",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7 }}>
                        <FiPlus size={13}/> Nueva Dieta
                      </motion.button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {dietasPropias.map(d => (
                        <DietaCard key={d._id} dieta={d}
                          onEdit={d => setDietaModal({ editing:d })}
                          onDelete={deleteDieta}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Recetas ── */}
              {tab === "recetas" && (
                <motion.div key="recetas"
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                >
                  {/* Search */}
                  <div style={{ position:"relative", marginBottom:14 }}>
                    <FiSearch style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",
                      color:"var(--text-secondary)",pointerEvents:"none" }} size={14}/>
                    <input value={search} onChange={e=>setSearch(e.target.value)}
                      placeholder="Buscar recetas por nombre o descripción…"
                      style={{ width:"100%",padding:"10px 12px 10px 36px",
                        background:"var(--bg-input)",border:"1px solid var(--border)",
                        borderRadius:10,color:"var(--text-primary)",fontSize:13 }} />
                  </div>

                  {/* Category chips */}
                  <div style={{ display:"flex", gap:7, marginBottom:18, overflowX:"auto", paddingBottom:4, flexWrap:"wrap" }}>
                    {categorias.map(c => (
                      <button key={c} onClick={() => setCat(c)}
                        style={{
                          padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer",
                          flexShrink:0, fontSize:12, fontWeight:600, transition:"all .15s",
                          background: catFilter===c ? "var(--accent)" : "var(--bg-input)",
                          color: catFilter===c ? "#fff" : "var(--text-secondary)",
                        }}>
                        {c === "Todas" ? "Todas" : c}
                      </button>
                    ))}
                  </div>

                  {/* Stats bar */}
                  {recetas.length > 0 && (
                    <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                      <div style={{ padding:"8px 14px", borderRadius:9, background:"rgba(99,102,241,.1)",
                        border:"1px solid rgba(99,102,241,.2)", fontSize:12, fontWeight:600, color:"var(--accent)",
                        display:"flex", alignItems:"center", gap:6 }}>
                        <FiBookOpen size={12}/> {recetas.length} recetas en total
                      </div>
                      {recetas.filter(r=>r.consumida_hoy).length > 0 && (
                        <div style={{ padding:"8px 14px", borderRadius:9, background:"rgba(34,197,94,.1)",
                          border:"1px solid rgba(34,197,94,.2)", fontSize:12, fontWeight:600, color:"#4ade80",
                          display:"flex", alignItems:"center", gap:6 }}>
                          <FiCheckCircle size={12}/> {recetas.filter(r=>r.consumida_hoy).length} consumidas hoy
                        </div>
                      )}
                    </div>
                  )}

                  {recetasFilt.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"70px 20px" }}>
                      <div style={{ width:64, height:64, borderRadius:16, background:"rgba(99,102,241,.1)",
                        display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                        <GiMeal size={30} color="var(--accent)"/>
                      </div>
                      <h3 style={{ fontWeight:700, marginBottom:6 }}>
                        {recetas.length===0 ? "Tu libro de recetas está vacío" : "Sin resultados"}
                      </h3>
                      <p style={{ color:"var(--text-secondary)", maxWidth:300, margin:"0 auto 20px", fontSize:14 }}>
                        {recetas.length===0
                          ? "Crea tu primera receta y empieza a construir tu recetario personal."
                          : "Prueba con otro término o cambia la categoría."}
                      </p>
                      {recetas.length === 0 && (
                        <motion.button whileTap={{scale:.96}}
                          onClick={() => setRecetaModal({ editing:false })}
                          style={{ padding:"10px 24px",background:"var(--accent)",border:"none",borderRadius:10,
                            color:"#fff",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7 }}>
                          <FiPlus size={13}/> Crear receta
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
                      {recetasFilt.map(r => (
                        <RecetaCard key={r._id} rec={r} ownUserId={ownUserId}
                          onEdit={r => setRecetaModal({ editing:r })}
                          onDelete={deleteReceta}
                          onConsume={consumirReceta}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {recetaModal && (
          <RecetaForm initial={recetaModal.editing || null} onSave={saveReceta} onClose={() => setRecetaModal(null)} />
        )}
        {dietaModal && (
          <DietaForm initial={dietaModal.editing || null} onSave={saveDieta} onClose={() => setDietaModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
