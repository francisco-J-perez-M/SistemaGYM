/**
 * ReceptionistAppointments.jsx
 * Rediseño: layout de dos columnas — mini calendario mensual (izquierda)
 * + vista de citas del día con filtros (derecha).
 * Citas visibles también para entrenadores (filtrado por trainer_id en backend).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiCalendar, FiClock, FiUser, FiPlus, FiTrash2,
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiX, FiEdit2,
  FiChevronLeft, FiChevronRight, FiSearch, FiFilter,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const API  = "/api/recepcionista";
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const TIMES = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","13:00","14:00","15:00","16:00","17:00",
  "18:00","19:00","20:00","21:00",
];
const TYPES = [
  "Evaluacion - Nuevo cliente","Tour de instalaciones","Renovacion de membresia",
  "Clase grupal","Sesion personal","Consulta general","Otro",
];
const TYPE_COLORS = {
  "Evaluacion - Nuevo cliente": "#38bdf8","Tour de instalaciones": "#a78bfa",
  "Renovacion de membresia": "#22c55e","Clase grupal": "#fb923c",
  "Sesion personal": "#f472b6","Consulta general": "#fbbf24","Otro": "#94a3b8",
};
const STATUS_CFG = {
  confirmada:{ color:"#22c55e", bg:"rgba(34,197,94,0.12)" },
  pendiente: { color:"#eab308", bg:"rgba(234,179,8,0.12)"  },
  cancelada: { color:"#ef4444", bg:"rgba(239,68,68,0.12)"  },
};
const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_HDR= ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];
const EMPTY   = { time:"09:00", client:"", client_id:null, type:TYPES[0], trainer:"", trainer_id:null, notes:"" };

const isoToday  = () => new Date().toISOString().split("T")[0];
const shiftDate = (iso,n) => { const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; };
const fmtLong   = (iso) => new Date(iso+"T12:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
const typeColor = (type) => TYPE_COLORS[type] || "#94a3b8";

// ── Estilos base
const navBtn    = { background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)",padding:4,borderRadius:6,display:"flex",alignItems:"center" };
const selectSt  = { padding:"10px 12px",borderRadius:8,border:"1px solid var(--border-dark)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:14,width:"100%",fontFamily:"inherit" };
const inputSt   = { padding:"10px 12px",borderRadius:8,border:"1px solid var(--border-dark)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:14,width:"100%",boxSizing:"border-box",fontFamily:"inherit" };
const labelSt   = { fontSize:12,fontWeight:600,color:"var(--text-secondary)",display:"flex",alignItems:"center" };

/* ── Mini Calendario ───────────────────────────────────────────────────────── */
function MiniCalendar({ selDate, onSelect, citasDias={} }) {
  const initD = selDate ? new Date(selDate+"T12:00:00") : new Date();
  const [cursor,setCursor] = useState({ year:initD.getFullYear(), month:initD.getMonth() });

  useEffect(() => {
    if (!selDate) return;
    const d = new Date(selDate+"T12:00:00");
    if (d.getFullYear()!==cursor.year || d.getMonth()!==cursor.month)
      setCursor({ year:d.getFullYear(), month:d.getMonth() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selDate]);

  const buildDays = (y,m) => {
    const first=new Date(y,m,1).getDay(), last=new Date(y,m+1,0).getDate(), cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=last;d++) cells.push(d);
    return cells;
  };
  const cells = buildDays(cursor.year,cursor.month);
  const todayD = new Date();
  const selD   = selDate ? new Date(selDate+"T12:00:00") : null;
  const isToday= (d)=> d===todayD.getDate()&&cursor.month===todayD.getMonth()&&cursor.year===todayD.getFullYear();
  const isSel  = (d)=> selD&&d===selD.getDate()&&cursor.month===selD.getMonth()&&cursor.year===selD.getFullYear();
  const dayIso = (d)=> `${cursor.year}-${String(cursor.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const prev   = ()=> setCursor(c=>{ const m=c.month===0?11:c.month-1,y=c.month===0?c.year-1:c.year; return{year:y,month:m}; });
  const next   = ()=> setCursor(c=>{ const m=c.month===11?0:c.month+1,y=c.month===11?c.year+1:c.year; return{year:y,month:m}; });

  return (
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border-dark)",borderRadius:14,padding:"18px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={prev} style={navBtn}><FiChevronLeft size={14}/></button>
        <span style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>{MESES[cursor.month]} {cursor.year}</span>
        <button onClick={next} style={navBtn}><FiChevronRight size={14}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {DIAS_HDR.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:600,color:"var(--text-secondary)",padding:"2px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={i} style={{height:34}}/>;
          const iso=dayIso(d), count=citasDias[iso]||0, active=isSel(d), today=isToday(d);
          return (
            <button key={i} onClick={()=>onSelect(iso)}
              title={count?`${count} cita${count>1?"s":""}`:""}
              style={{width:"100%",height:34,borderRadius:8,
                border:today&&!active?"1px solid var(--accent)":"1px solid transparent",
                background:active?"var(--accent)":"transparent",
                color:active?"#fff":today?"var(--accent)":"var(--text-primary)",
                fontWeight:active||today?700:400,fontSize:12,cursor:"pointer",position:"relative",
                transition:"background .12s",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background="var(--accent-dim)"}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent"}}>
              {d}
              {count>0&&<span style={{width:5,height:5,borderRadius:"50%",background:active?"rgba(255,255,255,.7)":"var(--accent)",display:"block"}}/>}
            </button>
          );
        })}
      </div>
      <div style={{textAlign:"center",marginTop:10}}>
        <button onClick={()=>onSelect(isoToday())}
          style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontSize:11,fontWeight:600}}>
          Hoy
        </button>
      </div>
    </div>
  );
}

/* ── Combobox de miembros ──────────────────────────────────────────────────── */
function MemberCombobox({ value, onChange, members }) {
  const [query,setQuery]=useState(value||""), [open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{setQuery(value||"");},[value]);
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);
  const filtered=members.filter(m=>{const q=query.toLowerCase();return(m.nombre||"").toLowerCase().includes(q)||(m.email||"").toLowerCase().includes(q);}).slice(0,8);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <FiSearch size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--text-secondary)",pointerEvents:"none"}}/>
        <input type="text" value={query} placeholder="Buscar miembro..." onChange={e=>{setQuery(e.target.value);onChange(e.target.value,null);setOpen(true);}} onFocus={()=>setOpen(true)} style={{...inputSt,paddingLeft:32}}/>
      </div>
      <AnimatePresence>
        {open&&filtered.length>0&&(
          <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}} transition={{duration:.12}}
            style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:9500,background:"var(--bg-card)",border:"1px solid var(--border-dark)",borderRadius:10,overflow:"hidden",boxShadow:"0 12px 32px rgba(0,0,0,0.5)"}}>
            {filtered.map(m=>(
              <div key={m.id_usuario_pg||m._id||m.email}
                onClick={()=>{setQuery(m.nombre||"");onChange(m.nombre||"",m.id_usuario_pg??null);setOpen(false);}}
                style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid var(--border-dark)",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--accent-dim)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"var(--accent-dim)",border:"1px solid var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--accent)",flexShrink:0}}>{(m.nombre||"?")[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{m.nombre}</div>
                  {m.email&&<div style={{fontSize:11,color:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.email}</div>}
                </div>
                {m.mem_status&&<span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:99,flexShrink:0,background:m.mem_status==="activa"?"rgba(34,197,94,0.15)":m.mem_status==="por_vencer"?"rgba(234,179,8,0.15)":"rgba(239,68,68,0.12)",color:m.mem_status==="activa"?"#22c55e":m.mem_status==="por_vencer"?"#eab308":"#ef4444"}}>{m.mem_status==="activa"?"Activo":m.mem_status==="por_vencer"?"Por vencer":m.mem_status==="vencida"?"Vencida":"Sin membresia"}</span>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ status }) {
  const s=STATUS_CFG[status]||STATUS_CFG.pendiente;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:s.bg,color:s.color,padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:600}}>
    {status==="confirmada"?<FiCheckCircle size={11}/>:status==="cancelada"?<FiX size={11}/>:<FiAlertCircle size={11}/>}
    {status}
  </span>;
}

/* ══ PÁGINA PRINCIPAL ════════════════════════════════════════════════════════ */
export default function ReceptionistAppointments() {
  const [selDate,  setSelDate]  = useState(isoToday());
  const [citas,    setCitas]    = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members,  setMembers]  = useState([]);
  const [citasDias,setCitasDias]= useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);

  const [filterStatus,  setFilterStatus]  = useState("todos");
  const [filterTrainer, setFilterTrainer] = useState("todos");
  const [filterType,    setFilterType]    = useState("todos");

  const [modal,   setModal]   = useState(null);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);

  const userRole = (() => { try{return(JSON.parse(localStorage.getItem("user")||"{}").role||"").toLowerCase();}catch{return "";} })();
  const isTrainer = ["entrenador","trainer"].includes(userRole);

  const fetchCitas = useCallback(async(date)=>{
    setLoading(true); setError(null);
    try { const r=await axios.get(`${API}/citas`,{headers:hdrs(),params:{date}}); setCitas(r.data.citas||[]); }
    catch { setError("No se pudieron cargar las citas."); }
    finally { setLoading(false); }
  },[]);

  const fetchMes = useCallback(async(year,month)=>{
    try { const r=await axios.get(`${API}/citas/mes`,{headers:hdrs(),params:{year,month}}); setCitasDias(r.data.dias||{}); }
    catch { /* silencioso */ }
  },[]);

  const loadMes = useCallback(()=>{ const d=new Date(selDate+"T12:00:00"); fetchMes(d.getFullYear(),d.getMonth()+1); },[selDate,fetchMes]);

  const fetchTrainers = useCallback(async()=>{ if(isTrainer)return; try{const r=await axios.get(`${API}/trainers`,{headers:hdrs()});setTrainers(r.data.trainers||[]);}catch{} },[isTrainer]);
  const fetchMembers  = useCallback(async()=>{ if(isTrainer)return; try{const r=await axios.get(`${API}/members`,{headers:hdrs()});setMembers(r.data.miembros||[]);}catch{} },[isTrainer]);

  useEffect(()=>{fetchCitas(selDate);},[selDate,fetchCitas]);
  useEffect(()=>{loadMes();},[loadMes]);
  useEffect(()=>{fetchTrainers();fetchMembers();},[fetchTrainers,fetchMembers]);

  const openNew  = ()=>{ setForm({...EMPTY,date:selDate}); setEditing(null); setModal("new"); };
  const openEdit = (c)=>{ setForm({time:c.time,client:c.client,client_id:c.client_id_pg||null,type:c.type,trainer:c.trainer||"",trainer_id:c.trainer_id_pg||null,notes:c.notes||""}); setEditing(c); setModal("edit"); };
  const closeModal = ()=>{ setModal(null); setEditing(null); setForm(EMPTY); };

  const saveForm = async()=>{
    if(!form.client.trim()) return;
    setSaving(true);
    try {
      if(modal==="new"){
        const r=await axios.post(`${API}/citas`,{...form,date:selDate},{headers:hdrs()});
        setCitas(prev=>[...prev,r.data.cita].sort((a,b)=>a.time.localeCompare(b.time)));
      } else {
        await axios.patch(`${API}/citas/${editing._id}`,form,{headers:hdrs()});
        setCitas(prev=>prev.map(c=>c._id===editing._id?{...c,...form}:c).sort((a,b)=>a.time.localeCompare(b.time)));
      }
      loadMes(); closeModal();
    } catch { setError("Error al guardar la cita."); }
    finally { setSaving(false); }
  };

  const toggleStatus = async(c)=>{
    const next=c.status==="confirmada"?"pendiente":"confirmada";
    try { await axios.patch(`${API}/citas/${c._id}`,{status:next},{headers:hdrs()}); setCitas(prev=>prev.map(x=>x._id===c._id?{...x,status:next}:x)); }
    catch { setError("Error al actualizar el estado."); }
  };

  const deleteCita = async(id)=>{
    try { await axios.delete(`${API}/citas/${id}`,{headers:hdrs()}); setCitas(prev=>prev.filter(c=>c._id!==id)); loadMes(); }
    catch { setError("Error al eliminar la cita."); }
  };

  const visible = citas.filter(c=>{
    if(filterStatus!=="todos"&&c.status!==filterStatus) return false;
    if(filterTrainer!=="todos"&&c.trainer!==filterTrainer) return false;
    if(filterType!=="todos"&&c.type!==filterType) return false;
    return true;
  });

  const totalDia    = citas.length;
  const confirmadas = citas.filter(c=>c.status==="confirmada").length;
  const pendientes  = citas.filter(c=>c.status==="pendiente").length;
  const trainerList = [...new Set(citas.filter(c=>c.trainer).map(c=>c.trainer))];

  return (
    <div className="dashboard-content">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}}
        style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h2 className="page-title" style={{margin:0}}><FiCalendar style={{marginRight:10}}/>Citas</h2>
          <p style={{margin:"4px 0 0",color:"var(--text-secondary)",fontSize:13}}>
            {isTrainer?"Tus citas asignadas":"Agenda de recepcion"}
          </p>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <motion.button className="btn-outline-small" onClick={()=>fetchCitas(selDate)} title="Actualizar" whileHover={{scale:1.05}}><FiRefreshCw size={13}/></motion.button>
          {!isTrainer&&<motion.button className="btn-primary" onClick={openNew} whileHover={{scale:1.03}} whileTap={{scale:0.97}} style={{display:"flex",alignItems:"center",gap:6}}><FiPlus size={15}/>Nueva Cita</motion.button>}
        </div>
      </motion.div>

      {error&&<div style={{marginBottom:16,padding:"10px 14px",background:"rgba(239,68,68,0.1)",borderRadius:8,color:"#ef4444",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        {error}<button onClick={()=>setError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"inherit"}}><FiX size={12}/></button>
      </div>}

      {/* Layout 2 columnas */}
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:20,alignItems:"start"}}>
        {/* Columna izquierda */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Nav fecha */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button className="btn-outline-small" onClick={()=>setSelDate(d=>shiftDate(d,-1))} style={{padding:"6px 10px"}}><FiChevronLeft size={14}/></button>
            <button onClick={()=>setSelDate(isoToday())} style={{flex:1,padding:"6px 10px",borderRadius:8,fontSize:12,fontWeight:600,background:"var(--accent-dim)",border:"1px solid var(--accent)",color:"var(--accent-soft)",cursor:"pointer"}}>Hoy</button>
            <button className="btn-outline-small" onClick={()=>setSelDate(d=>shiftDate(d,1))} style={{padding:"6px 10px"}}><FiChevronRight size={14}/></button>
          </div>

          <MiniCalendar selDate={selDate} onSelect={setSelDate} citasDias={citasDias}/>

          {/* Stats */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-dark)",borderRadius:12,padding:16}}>
            <p style={{margin:"0 0 12px",fontSize:12,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".05em"}}>{fmtLong(selDate)}</p>
            {[{label:"Total",value:totalDia,color:"var(--accent-soft)"},{label:"Confirmadas",value:confirmadas,color:"#22c55e"},{label:"Pendientes",value:pendientes,color:"#eab308"}].map(s=>(
              <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:13,color:"var(--text-secondary)"}}>{s.label}</span>
                <span style={{fontSize:15,fontWeight:800,color:s.color}}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha */}
        <div>
          {/* Filtros */}
          {!isTrainer&&(
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <FiFilter size={13} style={{color:"var(--text-secondary)"}}/>
              <div style={{display:"flex",gap:4}}>
                {["todos","confirmada","pendiente","cancelada"].map(s=>(
                  <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",textTransform:"capitalize",background:filterStatus===s?"var(--accent-dim)":"transparent",border:filterStatus===s?"1px solid var(--accent)":"1px solid var(--border-dark)",color:filterStatus===s?"var(--accent-soft)":"var(--text-secondary)"}}>
                    {s==="todos"?"Todos":s}
                  </button>
                ))}
              </div>
              {trainerList.length>0&&(
                <select value={filterTrainer} onChange={e=>setFilterTrainer(e.target.value)} style={{...selectSt,padding:"5px 10px",fontSize:11,width:"auto"}}>
                  <option value="todos">Todos los entrenadores</option>
                  {trainerList.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              )}
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{...selectSt,padding:"5px 10px",fontSize:11,width:"auto"}}>
                <option value="todos">Todos los tipos</option>
                {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Lista */}
          {loading?(
            <div style={{padding:48,textAlign:"center",color:"var(--text-secondary)"}}>Cargando citas...</div>
          ):visible.length===0?(
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{padding:56,textAlign:"center",background:"var(--bg-card)",borderRadius:14,border:"1px dashed var(--border-dark)"}}>
              <FiCalendar size={38} style={{opacity:.25,marginBottom:14}}/>
              <p style={{margin:"0 0 4px",fontWeight:600}}>{citas.length>0?"Sin citas con estos filtros":"Sin citas para este dia"}</p>
              <p style={{margin:"0 0 18px",color:"var(--text-secondary)",fontSize:13}}>{fmtLong(selDate)}</p>
              {!isTrainer&&<button className="btn-primary" onClick={openNew} style={{display:"inline-flex",alignItems:"center",gap:6}}><FiPlus size={14}/>Agendar cita</button>}
            </motion.div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <AnimatePresence>
                {visible.map((c,idx)=>{
                  const color=typeColor(c.type);
                  return (
                    <motion.div key={c._id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-20}} transition={{delay:idx*0.03}}
                      style={{background:"var(--bg-card)",border:"1px solid var(--border-dark)",borderLeft:`4px solid ${color}`,borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:16}}
                      whileHover={{scale:1.003,borderColor:color}}>
                      {/* Hora */}
                      <div style={{minWidth:54,textAlign:"center",color,fontWeight:800,fontSize:16,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <FiClock size={12}/>{c.time}
                      </div>
                      <div style={{width:3,height:40,borderRadius:4,background:color,flexShrink:0}}/>
                      {/* Detalle */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{c.client}</div>
                        <div style={{fontSize:12,color:"var(--text-secondary)",display:"flex",flexWrap:"wrap",gap:"3px 12px"}}>
                          <span style={{color,fontWeight:600}}>{c.type}</span>
                          {c.trainer&&<span style={{display:"flex",alignItems:"center",gap:3}}><FiUser size={10}/>{c.trainer}</span>}
                        </div>
                        {c.notes&&<div style={{marginTop:4,fontSize:11,color:"var(--text-secondary)",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.notes}</div>}
                      </div>
                      {/* Acciones */}
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <Badge status={c.status}/>
                        {!isTrainer&&<>
                          <motion.button className="btn-outline-small" onClick={()=>openEdit(c)} title="Editar" whileHover={{scale:1.08}}><FiEdit2 size={13}/></motion.button>
                          <motion.button className="btn-outline-small" onClick={()=>toggleStatus(c)} title={c.status==="confirmada"?"Marcar pendiente":"Confirmar"} style={{color:c.status==="confirmada"?"#22c55e":"#eab308"}} whileHover={{scale:1.08}}><FiCheckCircle size={13}/></motion.button>
                          <motion.button className="btn-outline-small" onClick={()=>deleteCita(c._id)} style={{color:"#ef4444",borderColor:"#ef4444"}} whileHover={{scale:1.08}}><FiTrash2 size={13}/></motion.button>
                        </>}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,zIndex:8000,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={closeModal}>
            <motion.div initial={{scale:.88,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.88,opacity:0}} transition={{type:"spring",stiffness:300,damping:28}}
              onClick={e=>e.stopPropagation()}
              style={{background:"var(--bg-card)",border:"1px solid var(--border-dark)",borderRadius:16,padding:32,width:"100%",maxWidth:540,boxShadow:"0 24px 64px rgba(0,0,0,0.6)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <div>
                  <h3 style={{margin:0,fontSize:18,fontWeight:700}}>{modal==="new"?"Nueva Cita":"Editar Cita"}</h3>
                  <p style={{margin:"4px 0 0",fontSize:13,color:"var(--text-secondary)"}}>{fmtLong(selDate)}</p>
                </div>
                <motion.button onClick={closeModal} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-secondary)",padding:6}} whileHover={{scale:1.1}}><FiX size={20}/></motion.button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <label style={{display:"flex",flexDirection:"column",gap:6}}>
                    <span style={labelSt}><FiClock size={11} style={{marginRight:4}}/>Hora</span>
                    <select value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={selectSt}>{TIMES.map(t=><option key={t}>{t}</option>)}</select>
                  </label>
                  <label style={{display:"flex",flexDirection:"column",gap:6}}>
                    <span style={labelSt}>Tipo de cita</span>
                    <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={{...selectSt,borderColor:typeColor(form.type)}}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
                  </label>
                </div>
                <label style={{display:"flex",flexDirection:"column",gap:6}}>
                  <span style={labelSt}><FiUser size={11} style={{marginRight:4}}/>Cliente *</span>
                  <MemberCombobox value={form.client} onChange={(n,id)=>setForm(p=>({...p,client:n,client_id:id}))} members={members}/>
                  {!form.client.trim()&&<span style={{fontSize:11,color:"#ef4444"}}>Campo requerido</span>}
                </label>
                <label style={{display:"flex",flexDirection:"column",gap:6}}>
                  <span style={labelSt}>Entrenador / Encargado</span>
                  {trainers.length>0?(
                    <select value={form.trainer} onChange={e=>{const t=trainers.find(x=>x.nombre===e.target.value);setForm(p=>({...p,trainer:e.target.value,trainer_id:t?.id??null}));}} style={selectSt}>
                      <option value="">— Recepcion (sin asignar) —</option>
                      {trainers.map(t=><option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                    </select>
                  ):(
                    <input type="text" value={form.trainer} placeholder="Ej: Coach Lopez" onChange={e=>setForm(p=>({...p,trainer:e.target.value,trainer_id:null}))} style={inputSt}/>
                  )}
                  {form.trainer&&<span style={{fontSize:11,color:"var(--text-secondary)"}}>El entrenador recibira una notificacion al guardar.</span>}
                </label>
                <label style={{display:"flex",flexDirection:"column",gap:6}}>
                  <span style={labelSt}>Notas</span>
                  <textarea value={form.notes} rows={3} placeholder="Informacion adicional..." onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{...inputSt,resize:"vertical"}}/>
                </label>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24}}>
                <motion.button className="btn-outline-small" onClick={closeModal} whileHover={{scale:1.03}}>Cancelar</motion.button>
                <motion.button className="btn-primary" onClick={saveForm} disabled={saving||!form.client.trim()} whileHover={!saving?{scale:1.03}:{}} style={{minWidth:130}}>
                  {saving?"Guardando...":modal==="new"?"Crear Cita":"Guardar Cambios"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
