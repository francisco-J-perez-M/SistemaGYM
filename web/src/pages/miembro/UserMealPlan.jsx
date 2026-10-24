import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiTrash2, FiEdit2, FiCheckCircle, FiSearch,
  FiClock, FiUsers, FiChevronDown, FiChevronUp, FiSave,
  FiAlertCircle, FiX, FiBookOpen
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

/* ─── helpers ─────────────────────────────────────────────────── */
const token    = () => localStorage.getItem("token");
const authHdrs = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });
const fmt      = (n) => n > 0 ? `${n}` : "—";

const CATEGORIAS = [
  "General", "Alto en Proteína", "Bajo en Calorías", "Pre-Entrenamiento",
  "Post-Entrenamiento", "Vegetariana", "Keto", "Desayuno", "Cena", "Snack",
];
const COMIDAS = ["Desayuno", "Snack Mañana", "Almuerzo", "Merienda", "Cena"];

/* ─── Tab pill ────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding:"9px 20px", borderRadius:9, border:"none", cursor:"pointer",
        background: active ? "var(--accent)" : "var(--bg-input)",
        color: active ? "#fff" : "var(--text-secondary)",
        fontWeight: active ? 700 : 400, fontSize:14, transition:"all .2s",
      }}
    >
      {children}
    </button>
  );
}

/* ─── RecetaCard ──────────────────────────────────────────────── */
function RecetaCard({ rec, ownUserId, onEdit, onDelete, onConsume }) {
  const [open, setOpen] = useState(false);
  const isOwn = rec.id_creador_pg === ownUserId;

  return (
    <motion.div
      layout
      style={{
        background:"var(--bg-card)", border:"1px solid var(--border)",
        borderRadius:12, overflow:"hidden",
        borderTop:`3px solid ${rec.consumida_hoy ? "#22c55e" : "var(--accent)"}`,
      }}
    >
      {/* Header row */}
      <div
        style={{ padding:"16px 18px", cursor:"pointer", display:"flex", gap:12, alignItems:"flex-start" }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:15, color:"var(--text-primary)" }}>{rec.titulo}</span>
            {rec.consumida_hoy && (
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20, background:"rgba(34,197,94,.15)", color:"#4ade80" }}>
                ✓ Consumida hoy
              </span>
            )}
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"var(--bg-input)", color:"var(--text-secondary)" }}>
              {rec.categoria}
            </span>
          </div>
          {rec.descripcion && <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0 }}>{rec.descripcion}</p>}

          <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
            {rec.tiempo_prep > 0 && (
              <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:4 }}>
                <FiClock size={11} /> {rec.tiempo_prep} min
              </span>
            )}
            {rec.porciones > 0 && (
              <span style={{ fontSize:12, color:"var(--text-secondary)", display:"flex", alignItems:"center", gap:4 }}>
                <FiUsers size={11} /> {rec.porciones} porciones
              </span>
            )}
            {rec.calorias > 0 && (
              <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>
                {rec.calorias} kcal
              </span>
            )}
            {(rec.proteina > 0 || rec.carbos > 0 || rec.grasa > 0) && (
              <span style={{ fontSize:12, color:"var(--text-secondary)" }}>
                P:{fmt(rec.proteina)}g C:{fmt(rec.carbos)}g G:{fmt(rec.grasa)}g
              </span>
            )}
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {isOwn && (
            <>
              <button onClick={e=>{e.stopPropagation();onEdit(rec);}} style={{ background:"none",border:"none",color:"var(--accent)",cursor:"pointer",padding:4 }}>
                <FiEdit2 size={14} />
              </button>
              <button onClick={e=>{e.stopPropagation();onDelete(rec._id);}} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:4 }}>
                <FiTrash2 size={14} />
              </button>
            </>
          )}
          {open ? <FiChevronUp size={16} color="var(--text-secondary)" /> : <FiChevronDown size={16} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Expanded */}
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
                    <h5 style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:8 }}>Ingredientes</h5>
                    {rec.ingredientes.map((ing, i) => (
                      <div key={i} style={{ fontSize:13, color:"var(--text-primary)", padding:"3px 0", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ color:"var(--accent)", fontSize:10 }}>●</span> {ing}
                      </div>
                    ))}
                  </div>
                )}
                {rec.pasos?.length > 0 && (
                  <div>
                    <h5 style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:"var(--text-secondary)", marginBottom:8 }}>Preparación</h5>
                    {rec.pasos.map((paso, i) => (
                      <div key={i} style={{ fontSize:13, color:"var(--text-primary)", padding:"5px 0", borderBottom:"1px solid var(--border)", display:"flex", gap:8 }}>
                        <span style={{ color:"var(--accent)", fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                        <span>{paso}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mark consumed */}
              <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
                {!rec.consumida_hoy && COMIDAS.map(c => (
                  <button key={c} onClick={() => onConsume(rec._id, c)} style={{ padding:"6px 12px", background:"rgba(34,197,94,.12)", border:"1px solid rgba(34,197,94,.3)", borderRadius:8, cursor:"pointer", color:"#4ade80", fontSize:12, fontWeight:600 }}>
                    ✓ Consumí en {c}
                  </button>
                ))}
                {rec.consumida_hoy && (
                  <span style={{ fontSize:13, color:"#4ade80", display:"flex", alignItems:"center", gap:6 }}>
                    <FiCheckCircle /> Registrada como consumida hoy
                  </span>
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
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setList = (k, i, v) => setForm(f => {
    const arr = [...f[k]];
    arr[i] = v;
    return { ...f, [k]: arr };
  });
  const addItem = (k) => setForm(f => ({ ...f, [k]: [...f[k], ""] }));
  const removeItem = (k, i) => setForm(f => { const arr = [...f[k]]; arr.splice(i,1); return {...f,[k]:arr}; });

  const valid = form.titulo.trim().length > 0;

  const Inp = ({ label, fk, type="text", ...rest }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)", marginBottom:4 }}>{label}</label>
      <input type={type} value={form[fk]} onChange={e=>set(fk,e.target.value)}
        style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:13 }}
        {...rest}
      />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
    >
      <motion.div
        initial={{ scale:.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:.9, opacity:0 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:24, maxWidth:600, width:"100%", maxHeight:"88vh", overflowY:"auto" }}
      >
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontWeight:700 }}>{initial ? "Editar Receta" : "Nueva Receta"}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text-secondary)", cursor:"pointer" }}><FiX size={18} /></button>
        </div>

        <Inp label="Título *" fk="titulo" placeholder="Ej. Pollo con Quinoa" />

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)", marginBottom:4 }}>Categoría</label>
          <select value={form.categoria} onChange={e=>set("categoria",e.target.value)}
            style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:13 }}>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)", marginBottom:4 }}>Descripción</label>
          <textarea value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} rows={2}
            style={{ width:"100%", padding:"9px 12px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:13, resize:"vertical" }} />
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
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)" }}>Ingredientes</label>
            <button onClick={() => addItem("ingredientes")} style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:4 }}><FiPlus size={12} /> Añadir</button>
          </div>
          {form.ingredientes.map((ing, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
              <input value={ing} onChange={e=>setList("ingredientes",i,e.target.value)} placeholder={`Ingrediente ${i+1}`}
                style={{ flex:1, padding:"7px 10px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-primary)", fontSize:13 }} />
              {form.ingredientes.length > 1 && <button onClick={()=>removeItem("ingredientes",i)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px" }}><FiX size={13} /></button>}
            </div>
          ))}
        </div>

        {/* Pasos */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--text-secondary)" }}>Pasos de preparación</label>
            <button onClick={() => addItem("pasos")} style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:4 }}><FiPlus size={12} /> Añadir</button>
          </div>
          {form.pasos.map((paso, i) => (
            <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
              <span style={{ color:"var(--accent)", fontWeight:700, fontSize:12, minWidth:18, paddingTop:8 }}>{i+1}.</span>
              <textarea value={paso} onChange={e=>setList("pasos",i,e.target.value)} rows={2} placeholder={`Paso ${i+1}`}
                style={{ flex:1, padding:"7px 10px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-primary)", fontSize:13, resize:"vertical" }} />
              {form.pasos.length > 1 && <button onClick={()=>removeItem("pasos",i)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px" }}><FiX size={13} /></button>}
            </div>
          ))}
        </div>

        <button onClick={() => valid && onSave(form)} disabled={!valid}
          style={{ width:"100%", padding:"12px", background: valid ? "var(--accent)" : "var(--bg-input)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor: valid ? "pointer" : "not-allowed", opacity: valid ? 1 : .6, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <FiSave /> {initial ? "Guardar cambios" : "Crear receta"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── DietaCard ───────────────────────────────────────────────── */
function DietaCard({ dieta, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const isPropia = dieta.creado_por === "miembro";
  const totalCal = (dieta.comidas || []).reduce((s,c) => s + (parseInt(c.calorias)||0), 0);

  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", borderTop:`3px solid ${isPropia ? "var(--accent)" : "#22c55e"}` }}>
      <div style={{ padding:"16px 18px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", cursor:"pointer" }} onClick={() => setOpen(o=>!o)}>
        <div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:15 }}>{dieta.nombre}</span>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: isPropia ? "rgba(99,102,241,.15)" : "rgba(34,197,94,.15)", color: isPropia ? "var(--accent)" : "#4ade80", fontWeight:600 }}>
              {isPropia ? "Propia" : "Asignada"}
            </span>
          </div>
          {dieta.descripcion && <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0 }}>{dieta.descripcion}</p>}
          {totalCal > 0 && <span style={{ fontSize:12, color:"var(--accent)", fontWeight:600, marginTop:4, display:"block" }}>{totalCal} kcal / día</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {isPropia && (
            <>
              <button onClick={e=>{e.stopPropagation();onEdit(dieta);}} style={{ background:"none",border:"none",color:"var(--accent)",cursor:"pointer",padding:4 }}><FiEdit2 size={13}/></button>
              <button onClick={e=>{e.stopPropagation();onDelete(dieta._id);}} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:4 }}><FiTrash2 size={13}/></button>
            </>
          )}
          {open ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
        </div>
      </div>
      <AnimatePresence>
        {open && dieta.comidas?.length > 0 && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
            <div style={{ padding:"0 18px 16px", borderTop:"1px solid var(--border)" }}>
              {dieta.comidas.map((c,i) => (
                <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 }}>
                  <div>
                    <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{c.nombre}</span>
                    {c.hora && <span style={{ color:"var(--text-secondary)", marginLeft:8, fontSize:11 }}>{c.hora}</span>}
                    {c.alimentos?.length > 0 && <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{c.alimentos.join(", ")}</div>}
                  </div>
                  {c.calorias > 0 && <span style={{ color:"var(--accent)", fontWeight:700 }}>{c.calorias} kcal</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── DietaForm (modal) ───────────────────────────────────────── */
function DietaForm({ initial, onSave, onClose }) {
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [desc, setDesc]     = useState(initial?.descripcion || "");
  const [comidas, setComidas] = useState(initial?.comidas || [{ nombre:"Desayuno", hora:"08:00", calorias:"", alimentos:[""] }]);

  const addComida = () => setComidas(c => [...c, { nombre:"", hora:"", calorias:"", alimentos:[""] }]);
  const setC = (i, k, v) => setComidas(c => { const a=[...c]; a[i]={...a[i],[k]:v}; return a; });
  const removeC = (i) => setComidas(c => c.filter((_,idx)=>idx!==i));
  const addAl = (ci) => setComidas(c => { const a=[...c]; a[ci].alimentos=[...a[ci].alimentos,""]; return a; });
  const setAl = (ci,ai,v) => setComidas(c => { const a=[...c]; const als=[...a[ci].alimentos]; als[ai]=v; a[ci]={...a[ci],alimentos:als}; return a; });
  const removeAl = (ci,ai) => setComidas(c => { const a=[...c]; a[ci].alimentos=a[ci].alimentos.filter((_,i)=>i!==ai); return a; });

  return (
    <motion.div
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={onClose}
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
    >
      <motion.div
        initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.9,opacity:0}}
        onClick={e=>e.stopPropagation()}
        style={{ background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:16,padding:24,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto" }}
      >
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0 }}>{initial?"Editar":"Nueva"} Dieta</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)" }}><FiX /></button>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",color:"var(--text-secondary)",display:"block",marginBottom:4 }}>Nombre</label>
          <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Mi plan semanal"
            style={{ width:"100%",padding:"9px 12px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13 }} />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11,fontWeight:700,textTransform:"uppercase",color:"var(--text-secondary)",display:"block",marginBottom:4 }}>Descripción</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
            style={{ width:"100%",padding:"9px 12px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,resize:"vertical" }} />
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <span style={{ fontWeight:700 }}>Comidas del día</span>
            <button onClick={addComida} style={{ display:"flex",alignItems:"center",gap:4,padding:"5px 10px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",color:"var(--accent)",fontSize:12 }}>
              <FiPlus size={12}/> Comida
            </button>
          </div>
          {comidas.map((c,ci) => (
            <div key={ci} style={{ background:"var(--bg-input)",borderRadius:10,padding:12,marginBottom:10 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 80px 80px auto",gap:8,marginBottom:8 }}>
                <input value={c.nombre} onChange={e=>setC(ci,"nombre",e.target.value)} placeholder="Ej. Desayuno"
                  style={{ padding:"7px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:13 }} />
                <input value={c.hora} onChange={e=>setC(ci,"hora",e.target.value)} placeholder="08:00" type="time"
                  style={{ padding:"7px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:13 }} />
                <input value={c.calorias} onChange={e=>setC(ci,"calorias",e.target.value)} placeholder="kcal" type="number"
                  style={{ padding:"7px 10px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:13 }} />
                <button onClick={()=>removeC(ci)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer",padding:"0 4px" }}><FiTrash2 size={13}/></button>
              </div>
              {(c.alimentos||[]).map((al,ai) => (
                <div key={ai} style={{ display:"flex",gap:6,marginBottom:4 }}>
                  <input value={al} onChange={e=>setAl(ci,ai,e.target.value)} placeholder={`Alimento ${ai+1}`}
                    style={{ flex:1,padding:"6px 8px",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,color:"var(--text-primary)",fontSize:12 }} />
                  {c.alimentos.length > 1 && <button onClick={()=>removeAl(ci,ai)} style={{ background:"none",border:"none",color:"#f87171",cursor:"pointer" }}><FiX size={11}/></button>}
                </div>
              ))}
              <button onClick={()=>addAl(ci)} style={{ fontSize:11,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:"2px 0" }}>+ alimento</button>
            </div>
          ))}
        </div>

        <button onClick={() => nombre.trim() && onSave({ nombre, descripcion:desc, comidas })} disabled={!nombre.trim()}
          style={{ width:"100%",padding:"11px",background:nombre.trim()?"var(--accent)":"var(--bg-input)",border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:nombre.trim()?"pointer":"not-allowed",opacity:nombre.trim()?1:.6,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          <FiSave /> {initial?"Guardar":"Crear dieta"}
        </button>
      </motion.div>
    </motion.div>
  );
}


/* ─── Main ────────────────────────────────────────────────────── */
export default function UserMealPlan() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState("asignadas");
  const [dietas,  setDietas]  = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);
  const [search,  setSearch]  = useState("");
  const [catFilter, setCat]   = useState("Todas");

  // modals
  const [recetaModal, setRecetaModal] = useState(null); // null | { editing: rec | false }
  const [dietaModal,  setDietaModal]  = useState(null);

  const ownUserId = parseInt(JSON.parse(localStorage.getItem("user") || "{}").id_pg || "0");

  useEffect(() => {
    if (!token()) { navigate("/", { replace:true }); return; }
    loadAll();
  }, []);

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
    } catch(e) { setErr("No se pudieron cargar los datos."); }
    finally { setLoading(false); }
  };

  /* ── dietas CRUD ───── */
  const saveDieta = async (form) => {
    const isEdit = dietaModal?.editing;
    const url    = isEdit ? `/api/user/nutrition/dietas/${isEdit._id}` : "/api/user/nutrition/dietas";
    const method = isEdit ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(form) });
    if (res.ok) { setDietaModal(null); loadAll(); }
  };

  const deleteDieta = async (id) => {
    if (!confirm("¿Eliminar esta dieta?")) return;
    await fetch(`/api/user/nutrition/dietas/${id}`, { method:"DELETE", headers: authHdrs() });
    loadAll();
  };

  /* ── recetas CRUD ──── */
  const saveReceta = async (form) => {
    const isEdit = recetaModal?.editing;
    const url    = isEdit ? `/api/user/nutrition/recetas/${isEdit._id}` : "/api/user/nutrition/recetas";
    const method = isEdit ? "PUT" : "POST";
    const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(form) });
    if (res.ok) { setRecetaModal(null); loadAll(); }
  };

  const deleteReceta = async (id) => {
    if (!confirm("¿Eliminar esta receta?")) return;
    await fetch(`/api/user/nutrition/recetas/${id}`, { method:"DELETE", headers: authHdrs() });
    loadAll();
  };

  const consumirReceta = async (id, comida) => {
    await fetch(`/api/user/nutrition/recetas/${id}/consumir`, {
      method:"POST", headers: authHdrs(), body: JSON.stringify({ comida }),
    });
    loadAll();
  };

  /* ── filter helpers ── */
  const dietasAsignadas = dietas.filter(d => d.creado_por === "entrenador");
  const dietasPropias   = dietas.filter(d => d.creado_por === "miembro");

  const categorias   = ["Todas", ...new Set(recetas.map(r => r.categoria))];
  const recetasFilt  = recetas.filter(r =>
    (catFilter === "Todas" || r.categoria === catFilter) &&
    (r.titulo.toLowerCase().includes(search.toLowerCase()) || (r.descripcion||"").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Alimentación</h2>
          {tab === "misdietas" && (
            <button onClick={() => setDietaModal({ editing:false })}
              style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>
              <FiPlus size={13}/> Nueva Dieta
            </button>
          )}
          {tab === "recetas" && (
            <button onClick={() => setRecetaModal({ editing:false })}
              style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13 }}>
              <FiPlus size={13}/> Nueva Receta
            </button>
          )}
        </header>

        <main className="dashboard-content">
          {err && (
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:9,marginBottom:16,color:"#f87171",fontSize:13 }}>
              <FiAlertCircle/> {err}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:22, flexWrap:"wrap" }}>
            <TabBtn active={tab==="asignadas"}  onClick={() => setTab("asignadas")}>
              🥗 Plan Asignado {dietasAsignadas.length > 0 && `(${dietasAsignadas.length})`}
            </TabBtn>
            <TabBtn active={tab==="misdietas"}  onClick={() => setTab("misdietas")}>
              📋 Mis Dietas {dietasPropias.length > 0 && `(${dietasPropias.length})`}
            </TabBtn>
            <TabBtn active={tab==="recetas"}    onClick={() => setTab("recetas")}>
              <span style={{ display:"flex",alignItems:"center",gap:6 }}>
                <FiBookOpen size={14}/> Recetas {recetas.length > 0 && `(${recetas.length})`}
              </span>
            </TabBtn>
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
              <div className="dashboard-spinner" style={{ margin:"0 auto 16px" }}/>
              <p>Cargando…</p>
            </div>
          ) : (
            <>
              {/* ── Asignadas ── */}
              {tab === "asignadas" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {dietasAsignadas.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>🥗</div>
                      <p>Tu entrenador aún no te ha asignado un plan alimenticio.</p>
                    </div>
                  ) : (
                    dietasAsignadas.map(d => <DietaCard key={d._id} dieta={d} onEdit={()=>{}} onDelete={()=>{}} />)
                  )}
                </div>
              )}

              {/* ── Mis Dietas ── */}
              {tab === "misdietas" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {dietasPropias.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-secondary)" }}>
                      <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
                      <p style={{ marginBottom:12 }}>Todavía no has creado ningún plan.</p>
                      <button onClick={() => setDietaModal({ editing:false })}
                        style={{ padding:"9px 20px",background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6 }}>
                        <FiPlus size={13}/> Crear primera dieta
                      </button>
                    </div>
                  ) : (
                    dietasPropias.map(d => (
                      <DietaCard key={d._id} dieta={d}
                        onEdit={(d) => setDietaModal({ editing:d })}
                        onDelete={deleteDieta}
                      />
                    ))
                  )}
                </div>
              )}

              {/* ── Recetas ── */}
              {tab === "recetas" && (
                <>
                  {/* Search + filter */}
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200, position:"relative" }}>
                      <FiSearch style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-secondary)" }} />
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar recetas…"
                        style={{ width:"100%",padding:"9px 10px 9px 32px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:9,color:"var(--text-primary)",fontSize:13 }}
                      />
                    </div>
                    <select value={catFilter} onChange={e=>setCat(e.target.value)}
                      style={{ padding:"9px 14px",background:"var(--bg-input)",border:"1px solid var(--border)",borderRadius:9,color:"var(--text-primary)",fontSize:13 }}>
                      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {recetasFilt.length === 0 ? (
                    <div style={{ textAlign:"center",padding:"60px 0",color:"var(--text-secondary)" }}>
                      <div style={{ fontSize:36,marginBottom:12 }}>🍽️</div>
                      <p style={{ marginBottom:12 }}>{recetas.length===0 ? "Aún no hay recetas." : "Sin resultados para tu búsqueda."}</p>
                      <button onClick={() => setRecetaModal({ editing:false })}
                        style={{ padding:"9px 20px",background:"var(--accent)",border:"none",borderRadius:9,color:"#fff",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6 }}>
                        <FiPlus size={13}/> Crear primera receta
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                      {recetasFilt.map(r => (
                        <RecetaCard key={r._id} rec={r} ownUserId={ownUserId}
                          onEdit={(r) => setRecetaModal({ editing:r })}
                          onDelete={deleteReceta}
                          onConsume={consumirReceta}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {recetaModal && (
          <RecetaForm
            initial={recetaModal.editing || null}
            onSave={saveReceta}
            onClose={() => setRecetaModal(null)}
          />
        )}
        {dietaModal && (
          <DietaForm
            initial={dietaModal.editing || null}
            onSave={saveDieta}
            onClose={() => setDietaModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
