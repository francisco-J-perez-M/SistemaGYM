/**
 * TrainerDiets.jsx — Módulo completo de Nutrición del entrenador.
 *
 * Tabs:
 *   1. Planes      — planes multi-semana / multi-día por cliente
 *   2. Recetas     — biblioteca privada con imagen, macros e ingredientes
 *   3. Importar IA — ETL: sube PDF/Excel → Claude extrae → confirma y guarda
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiUser,
  FiAlertCircle, FiSearch, FiCheckCircle, FiTarget,
  FiUpload, FiFile, FiChevronDown, FiChevronRight,
  FiImage, FiClock, FiRefreshCw,
} from "react-icons/fi";
import { GiMeal, GiCookingPot } from "react-icons/gi";
import { MdOutlineSmartToy } from "react-icons/md";
import { trainerService } from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

const DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];
const DIA_LABEL = { lunes:"Lun",martes:"Mar",miercoles:"Mié",jueves:"Jue",viernes:"Vie",sabado:"Sáb",domingo:"Dom" };
const OBJETIVOS = [
  {value:"perder_peso",label:"Pérdida de peso"},
  {value:"ganar_masa",label:"Ganancia muscular"},
  {value:"mantenimiento",label:"Mantenimiento"},
  {value:"definicion",label:"Definición"},
  {value:"rendimiento",label:"Rendimiento"},
];
const UNIDADES = ["g","ml","tazas","unidades","porciones","cucharadas"];

const EMPTY_ITEM   = { id_receta:null, nombre_alimento:"", cantidad:"", unidad:"g", calorias:"", proteinas_g:"", carbohidratos_g:"", grasas_g:"", imagen:null };
const EMPTY_COMIDA = { nombre:"Desayuno", hora:"08:00", tiempo_desde_anterior_min:null, items:[] };
const EMPTY_DIA    = (dia) => ({ dia, comidas:[] });
const EMPTY_SEMANA = (n)   => ({ numero:n, notas:"", dias:DIAS.map(EMPTY_DIA) });
const EMPTY_PLAN   = { nombre:"", objetivo:"mantenimiento", calorias_meta:"", proteinas_meta_g:"", carbohidratos_meta_g:"", grasas_meta_g:"", duracion_semanas:1, notas:"", id_miembro_pg:"", semanas:[EMPTY_SEMANA(1)] };
const EMPTY_RECIPE = { nombre:"", descripcion:"", imagen:null, calorias:"", proteinas_g:"", carbohidratos_g:"", grasas_g:"", tiempo_preparacion_min:"", instrucciones:"", ingredientes:[] };

// ─── helpers ───────────────────────────────────────────────────────────────
function Label({children}){
  return <label style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:5}}>{children}</label>;
}
function MacroRow({label,name,value,onChange}){
  return <div><Label>{label}</Label><input className="input-compact" type="number" placeholder="0" value={value??""} onChange={e=>onChange(name,e.target.value===""?"":Number(e.target.value))}/></div>;
}
function MacroChip({label,value,color}){
  if(!value && value!==0) return null;
  return <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:`${color}22`,color}}>{value}g {label}</span>;
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────
function Modal({onClose,children,maxWidth=760}){
  return(
    <motion.div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,overflowY:"auto"}}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div style={{background:"var(--bg-card)",borderRadius:16,width:"100%",maxWidth,border:"1px solid var(--border)",maxHeight:"92vh",overflowY:"auto"}}
        initial={{scale:.93,y:16}} animate={{scale:1,y:0}} exit={{scale:.93}} onClick={e=>e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}
function ModalHeader({title,onClose}){
  return(
    <div style={{padding:"18px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"var(--bg-card)",zIndex:2}}>
      <h3 style={{fontSize:16,fontWeight:700,margin:0}}>{title}</h3>
      <button className="icon-btn" onClick={onClose}><FiX size={18}/></button>
    </div>
  );
}
function ModalFooter({onCancel,onSave,saving,saveLabel="Guardar"}){
  return(
    <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"var(--bg-card)",zIndex:2}}>
      <button className="btn-outline-small" onClick={onCancel} disabled={saving}>Cancelar</button>
      <button className="btn-compact-primary" onClick={onSave} disabled={saving}>
        <FiSave size={13}/>{saving?"Guardando...":saveLabel}
      </button>
    </div>
  );
}

// ─── ItemRow ───────────────────────────────────────────────────────────────
function ItemRow({item,recipes,onUpdate,onRemove}){
  const handleRecipeSelect=(id)=>{
    if(!id){onUpdate({...item,id_receta:null});return;}
    const r=recipes.find(rc=>rc.id===id);
    if(r) onUpdate({...item,id_receta:r.id,nombre_alimento:r.nombre,calorias:r.calorias??"",proteinas_g:r.proteinas_g??"",carbohidratos_g:r.carbohidratos_g??"",grasas_g:r.grasas_g??"",imagen:r.imagen??null});
  };
  return(
    <div style={{background:"var(--bg-input)",borderRadius:8,border:"1px solid var(--border)",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
        {item.imagen&&<img src={item.imagen} alt="" style={{width:40,height:40,borderRadius:6,objectFit:"cover",flexShrink:0}}/>}
        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <div>
            <Label>Receta / Alimento</Label>
            <select className="input-compact" value={item.id_receta||""} onChange={e=>handleRecipeSelect(e.target.value)}>
              <option value="">Alimento libre</option>
              {recipes.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          {!item.id_receta&&(
            <div>
              <Label>Nombre</Label>
              <input className="input-compact" placeholder="ej. Avena" value={item.nombre_alimento} onChange={e=>onUpdate({...item,nombre_alimento:e.target.value})}/>
            </div>
          )}
        </div>
        <button className="icon-btn danger" style={{marginTop:16}} onClick={onRemove}><FiX size={13}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"80px 90px 1fr 1fr 1fr 1fr",gap:6}}>
        <div><Label>Cantidad</Label><input className="input-compact" type="number" placeholder="100" value={item.cantidad} onChange={e=>onUpdate({...item,cantidad:e.target.value})}/></div>
        <div><Label>Unidad</Label>
          <select className="input-compact" value={item.unidad} onChange={e=>onUpdate({...item,unidad:e.target.value})}>
            {UNIDADES.map(u=><option key={u}>{u}</option>)}
          </select>
        </div>
        <div><Label>Kcal</Label><input className="input-compact" type="number" placeholder="0" value={item.calorias} onChange={e=>onUpdate({...item,calorias:e.target.value})}/></div>
        <div><Label>Prot g</Label><input className="input-compact" type="number" placeholder="0" value={item.proteinas_g} onChange={e=>onUpdate({...item,proteinas_g:e.target.value})}/></div>
        <div><Label>Carbs g</Label><input className="input-compact" type="number" placeholder="0" value={item.carbohidratos_g} onChange={e=>onUpdate({...item,carbohidratos_g:e.target.value})}/></div>
        <div><Label>Grasa g</Label><input className="input-compact" type="number" placeholder="0" value={item.grasas_g} onChange={e=>onUpdate({...item,grasas_g:e.target.value})}/></div>
      </div>
    </div>
  );
}

// ─── ComidaSection ─────────────────────────────────────────────────────────
function ComidaSection({comida,recipes,onUpdate,onRemove}){
  const [open,setOpen]=useState(true);
  const totalKcal=comida.items.reduce((s,i)=>s+(Number(i.calorias)||0),0);
  const addItem=()=>onUpdate({...comida,items:[...comida.items,{...EMPTY_ITEM}]});
  const updateItem=(idx,upd)=>{const items=[...comida.items];items[idx]=upd;onUpdate({...comida,items});};
  const removeItem=(idx)=>onUpdate({...comida,items:comida.items.filter((_,i)=>i!==idx)});
  return(
    <div style={{border:"1px solid var(--border)",borderRadius:10,overflow:"hidden",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--bg-input)",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        {open?<FiChevronDown size={14}/>:<FiChevronRight size={14}/>}
        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 80px 90px",gap:8,alignItems:"center"}}>
          <input className="input-compact" style={{fontWeight:600,fontSize:13}} placeholder="Nombre comida" value={comida.nombre} onClick={e=>e.stopPropagation()} onChange={e=>onUpdate({...comida,nombre:e.target.value})}/>
          <input className="input-compact" type="time" value={comida.hora||""} onClick={e=>e.stopPropagation()} onChange={e=>onUpdate({...comida,hora:e.target.value})}/>
          <div style={{fontSize:11,color:"var(--accent)",textAlign:"center",fontWeight:700}}>{totalKcal>0?`${totalKcal} kcal`:""}</div>
        </div>
        <button className="icon-btn danger" style={{padding:4}} onClick={e=>{e.stopPropagation();onRemove();}}><FiX size={12}/></button>
      </div>
      {open&&(
        <div style={{padding:"12px 14px"}}>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
            {comida.items.map((item,idx)=>(
              <ItemRow key={idx} item={item} recipes={recipes} onUpdate={upd=>updateItem(idx,upd)} onRemove={()=>removeItem(idx)}/>
            ))}
          </div>
          <button className="btn-outline-small" style={{fontSize:11}} onClick={addItem}><FiPlus size={11}/> Agregar alimento</button>
        </div>
      )}
    </div>
  );
}

// ─── DiaTab ────────────────────────────────────────────────────────────────
function DiaTab({dia,recipes,onUpdate}){
  const addComida=()=>onUpdate({...dia,comidas:[...dia.comidas,{...EMPTY_COMIDA}]});
  const updateComida=(idx,upd)=>{const comidas=[...dia.comidas];comidas[idx]=upd;onUpdate({...dia,comidas});};
  const removeComida=(idx)=>onUpdate({...dia,comidas:dia.comidas.filter((_,i)=>i!==idx)});
  return(
    <div style={{paddingTop:12}}>
      {dia.comidas.length===0&&<p style={{fontSize:12,color:"var(--text-secondary)",marginBottom:10}}>Sin comidas para este día.</p>}
      {dia.comidas.map((c,i)=>(
        <ComidaSection key={i} comida={c} recipes={recipes} onUpdate={upd=>updateComida(i,upd)} onRemove={()=>removeComida(i)}/>
      ))}
      <button className="btn-outline-small" style={{fontSize:11}} onClick={addComida}><FiPlus size={11}/> Agregar comida</button>
    </div>
  );
}

// ─── PlanBuilderModal ──────────────────────────────────────────────────────
function PlanBuilderModal({plan,clients,recipes,onSave,onClose,saving}){
  const [form,setForm]=useState(()=>plan?{...plan}:{...EMPTY_PLAN});
  const [semanaIdx,setSemanaIdx]=useState(0);
  const [diaIdx,setDiaIdx]=useState(0);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const addSemana=()=>{
    const n=(form.semanas?.length??0)+1;
    setForm(f=>({...f,semanas:[...(f.semanas||[]),EMPTY_SEMANA(n)],duracion_semanas:n}));
    setSemanaIdx(n-1);
  };
  const removeSemana=(idx)=>{
    if(form.semanas.length<=1) return;
    const semanas=form.semanas.filter((_,i)=>i!==idx).map((s,i)=>({...s,numero:i+1}));
    setForm(f=>({...f,semanas,duracion_semanas:semanas.length}));
    setSemanaIdx(Math.min(semanaIdx,semanas.length-1));
  };
  const updateDia=(sIdx,dIdx,updated)=>{
    const semanas=[...form.semanas];
    const dias=[...semanas[sIdx].dias];
    dias[dIdx]=updated;
    semanas[sIdx]={...semanas[sIdx],dias};
    setForm(f=>({...f,semanas}));
  };

  const semana=form.semanas?.[semanaIdx];
  const dia=semana?.dias?.[diaIdx];

  const handleSave=()=>{
    const payload={
      ...form,
      calorias_meta:form.calorias_meta?Number(form.calorias_meta):null,
      proteinas_meta_g:form.proteinas_meta_g?Number(form.proteinas_meta_g):null,
      carbohidratos_meta_g:form.carbohidratos_meta_g?Number(form.carbohidratos_meta_g):null,
      grasas_meta_g:form.grasas_meta_g?Number(form.grasas_meta_g):null,
      duracion_semanas:form.semanas?.length||1,
    };
    onSave(payload);
  };

  return(
    <Modal onClose={onClose} maxWidth={900}>
      <ModalHeader title={plan?`Editar: ${plan.nombre}`:"Nuevo plan alimenticio"} onClose={onClose}/>
      <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:18}}>

        {/* Metadatos */}
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:12}}>
          <div><Label>Nombre del plan *</Label><input className="input-compact" placeholder="ej. Plan definición 8 semanas" value={form.nombre} onChange={e=>set("nombre",e.target.value)}/></div>
          <div><Label>Objetivo</Label>
            <select className="input-compact" value={form.objetivo} onChange={e=>set("objetivo",e.target.value)}>
              {OBJETIVOS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          <MacroRow label="Kcal/día" name="calorias_meta" value={form.calorias_meta} onChange={(k,v)=>set(k,v)}/>
          <MacroRow label="Proteínas g" name="proteinas_meta_g" value={form.proteinas_meta_g} onChange={(k,v)=>set(k,v)}/>
          <MacroRow label="Carbs g" name="carbohidratos_meta_g" value={form.carbohidratos_meta_g} onChange={(k,v)=>set(k,v)}/>
          <MacroRow label="Grasas g" name="grasas_meta_g" value={form.grasas_meta_g} onChange={(k,v)=>set(k,v)}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><Label>Asignar a cliente</Label>
            <select className="input-compact" value={form.id_miembro_pg||""} onChange={e=>set("id_miembro_pg",e.target.value)}>
              <option value="">Sin asignar</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><Label>Notas generales</Label><input className="input-compact" placeholder="Observaciones..." value={form.notas||""} onChange={e=>set("notas",e.target.value)}/></div>
        </div>

        <hr style={{border:"none",borderTop:"1px solid var(--border)",margin:0}}/>

        {/* Semanas */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)"}}>SEMANAS</span>
            {(form.semanas||[]).map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:2}}>
                <button onClick={()=>setSemanaIdx(i)} style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,background:semanaIdx===i?"var(--accent)":"var(--bg-input)",color:semanaIdx===i?"#fff":"var(--text-primary)",border:"1px solid "+(semanaIdx===i?"var(--accent)":"var(--border)"),cursor:"pointer"}}>
                  Semana {s.numero}
                </button>
                {form.semanas.length>1&&<button className="icon-btn danger" style={{padding:2}} onClick={()=>removeSemana(i)}><FiX size={10}/></button>}
              </div>
            ))}
            <button className="btn-outline-small" style={{fontSize:11}} onClick={addSemana}><FiPlus size={11}/> Semana</button>
          </div>

          {semana&&(
            <>
              <div style={{marginBottom:12}}>
                <Label>Notas semana {semana.numero}</Label>
                <input className="input-compact" placeholder="Opcional..." value={semana.notas||""} onChange={e=>{
                  const semanas=[...form.semanas];semanas[semanaIdx]={...semanas[semanaIdx],notas:e.target.value};setForm(f=>({...f,semanas}));
                }}/>
              </div>

              {/* Días */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
                {DIAS.map((d,i)=>{
                  const dayData=semana.dias?.find(x=>x.dia===d);
                  const hasContent=dayData?.comidas?.some(c=>c.items?.length>0);
                  return(
                    <button key={d} onClick={()=>setDiaIdx(i)} style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:diaIdx===i?"var(--accent)":"var(--bg-input)",color:diaIdx===i?"#fff":hasContent?"var(--accent)":"var(--text-secondary)",border:"1px solid "+(diaIdx===i?"var(--accent)":hasContent?"var(--accent)":"var(--border)"),cursor:"pointer",position:"relative"}}>
                      {DIA_LABEL[d]}
                      {hasContent&&diaIdx!==i&&<span style={{position:"absolute",top:-3,right:-3,width:7,height:7,borderRadius:"50%",background:"var(--success)"}}/>}
                    </button>
                  );
                })}
              </div>

              {dia&&<DiaTab dia={dia} recipes={recipes} onUpdate={upd=>updateDia(semanaIdx,diaIdx,upd)}/>}
            </>
          )}
        </div>
      </div>
      <ModalFooter onCancel={onClose} onSave={handleSave} saving={saving}/>
    </Modal>
  );
}

// ─── RecetaFormModal ───────────────────────────────────────────────────────
function RecetaFormModal({recipe,onSave,onClose,saving}){
  const [form,setForm]=useState(recipe?{...recipe}:{...EMPTY_RECIPE});
  const [ingName,setIngName]=useState(""); const [ingCant,setIngCant]=useState(""); const [ingUnit,setIngUnit]=useState("g");
  const fileRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const addIng=()=>{
    if(!ingName.trim()) return;
    setForm(f=>({...f,ingredientes:[...(f.ingredientes||[]),{nombre:ingName.trim(),cantidad:ingCant,unidad:ingUnit}]}));
    setIngName(""); setIngCant(""); setIngUnit("g");
  };
  const removeIng=(i)=>setForm(f=>({...f,ingredientes:f.ingredientes.filter((_,idx)=>idx!==i)}));
  const handleImage=(e)=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader(); reader.onload=ev=>set("imagen",ev.target.result); reader.readAsDataURL(file);
  };
  const handleSave=()=>{
    const payload={...form,calorias:form.calorias?Number(form.calorias):null,proteinas_g:form.proteinas_g?Number(form.proteinas_g):null,carbohidratos_g:form.carbohidratos_g?Number(form.carbohidratos_g):null,grasas_g:form.grasas_g?Number(form.grasas_g):null,tiempo_preparacion_min:form.tiempo_preparacion_min?Number(form.tiempo_preparacion_min):null};
    onSave(payload);
  };
  return(
    <Modal onClose={onClose} maxWidth={680}>
      <ModalHeader title={recipe?"Editar receta":"Nueva receta"} onClose={onClose}/>
      <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 140px",gap:10}}>
          <div><Label>Nombre *</Label><input className="input-compact" placeholder="ej. Pollo a la plancha con arroz" value={form.nombre} onChange={e=>set("nombre",e.target.value)}/></div>
          <div><Label>Prep. (min)</Label><input className="input-compact" type="number" placeholder="30" value={form.tiempo_preparacion_min??""} onChange={e=>set("tiempo_preparacion_min",e.target.value)}/></div>
        </div>
        <div><Label>Descripción</Label><textarea className="input-compact" rows={2} placeholder="Breve descripción..." style={{resize:"vertical",fontFamily:"inherit"}} value={form.descripcion||""} onChange={e=>set("descripcion",e.target.value)}/></div>

        {/* Imagen */}
        <div>
          <Label>Imagen del platillo</Label>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {form.imagen
              ?<img src={form.imagen} alt="" style={{width:80,height:80,objectFit:"cover",borderRadius:10,border:"1px solid var(--border)"}}/>
              :<div style={{width:80,height:80,borderRadius:10,background:"var(--bg-input)",border:"1px dashed var(--border)",display:"flex",alignItems:"center",justifyContent:"center"}}><FiImage size={24} style={{color:"var(--text-secondary)",opacity:.4}}/></div>
            }
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button className="btn-outline-small" onClick={()=>fileRef.current?.click()}><FiUpload size={12}/> {form.imagen?"Cambiar":"Subir foto"}</button>
              {form.imagen&&<button className="btn-outline-small" style={{color:"var(--danger)"}} onClick={()=>set("imagen",null)}><FiX size={12}/> Quitar</button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImage}/>
          </div>
        </div>

        {/* Macros */}
        <div><Label>Nutrición por porción</Label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            <MacroRow label="Kcal" name="calorias" value={form.calorias} onChange={(k,v)=>set(k,v)}/>
            <MacroRow label="Proteínas g" name="proteinas_g" value={form.proteinas_g} onChange={(k,v)=>set(k,v)}/>
            <MacroRow label="Carbs g" name="carbohidratos_g" value={form.carbohidratos_g} onChange={(k,v)=>set(k,v)}/>
            <MacroRow label="Grasas g" name="grasas_g" value={form.grasas_g} onChange={(k,v)=>set(k,v)}/>
          </div>
        </div>

        {/* Ingredientes */}
        <div>
          <Label>Ingredientes</Label>
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            <input className="input-compact" style={{flex:2}} placeholder="Ingrediente" value={ingName} onChange={e=>setIngName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIng()}/>
            <input className="input-compact" style={{flex:1}} placeholder="Cantidad" value={ingCant} onChange={e=>setIngCant(e.target.value)}/>
            <select className="input-compact" style={{flex:1}} value={ingUnit} onChange={e=>setIngUnit(e.target.value)}>{UNIDADES.map(u=><option key={u}>{u}</option>)}</select>
            <button className="btn-compact-primary" style={{padding:"0 12px"}} onClick={addIng}><FiPlus size={13}/></button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {(form.ingredientes||[]).map((ing,i)=>(
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",background:"var(--bg-input)",borderRadius:20,fontSize:12,border:"1px solid var(--border)"}}>
                {ing.nombre}{ing.cantidad&&` · ${ing.cantidad} ${ing.unidad}`}
                <button style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:1,color:"var(--danger)"}} onClick={()=>removeIng(i)}><FiX size={10}/></button>
              </span>
            ))}
          </div>
        </div>

        <div><Label>Instrucciones de preparación</Label><textarea className="input-compact" rows={4} placeholder="Paso a paso..." style={{resize:"vertical",fontFamily:"inherit"}} value={form.instrucciones||""} onChange={e=>set("instrucciones",e.target.value)}/></div>
      </div>
      <ModalFooter onCancel={onClose} onSave={handleSave} saving={saving}/>
    </Modal>
  );
}

// ─── RecetaCard ────────────────────────────────────────────────────────────
function RecetaCard({recipe,onEdit,onDelete,deleting}){
  return(
    <div className="stat-card" style={{padding:0,overflow:"hidden"}}>
      {recipe.imagen
        ?<img src={recipe.imagen} alt={recipe.nombre} style={{width:"100%",height:130,objectFit:"cover"}}/>
        :<div style={{height:130,background:"var(--bg-input)",display:"flex",alignItems:"center",justifyContent:"center"}}><GiCookingPot size={36} style={{color:"var(--text-secondary)",opacity:.3}}/></div>
      }
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <span style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{recipe.nombre}</span>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button className="icon-btn" style={{padding:4}} onClick={()=>onEdit(recipe)}><FiEdit size={12}/></button>
            <button className="icon-btn danger" style={{padding:4}} disabled={deleting} onClick={()=>onDelete(recipe.id)}><FiTrash2 size={12}/></button>
          </div>
        </div>
        {recipe.descripcion&&<p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:8,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{recipe.descripcion}</p>}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
          {recipe.tiempo_preparacion_min&&<span style={{fontSize:10,color:"var(--text-secondary)",display:"flex",gap:3,alignItems:"center"}}><FiClock size={9}/>{recipe.tiempo_preparacion_min} min</span>}
          <MacroChip label="P" value={recipe.proteinas_g} color="var(--accent)"/>
          <MacroChip label="C" value={recipe.carbohidratos_g} color="var(--warning)"/>
          <MacroChip label="G" value={recipe.grasas_g} color="#f59e0b"/>
          {recipe.calorias&&<span style={{fontSize:10,fontWeight:700,marginLeft:"auto",color:"var(--text-secondary)"}}>{recipe.calorias} kcal</span>}
        </div>
      </div>
    </div>
  );
}

// ─── ImportarIATab ─────────────────────────────────────────────────────────
function ImportarIATab({clients,onPlanExtracted}){
  const [file,setFile]=useState(null); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null); const [preview,setPreview]=useState(null);
  const [clientId,setClientId]=useState(""); const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false); const [drag,setDrag]=useState(false);
  const [aiStatus,setAiStatus]=useState(null); // {disponible,modelo_activo,modelo}
  const fileRef=useRef();

  useEffect(()=>{
    trainerService.getAIStatus()
      .then(s=>setAiStatus(s))
      .catch(()=>setAiStatus({disponible:false,modelo_activo:false,modelo:"phi3:mini"}));
  },[]);

  const handleFile=(f)=>{
    if(!f) return;
    const ext=f.name.split(".").pop().toLowerCase();
    if(!["pdf","xlsx","xls"].includes(ext)){setError("Solo se aceptan PDF o Excel (.xlsx, .xls)");return;}
    setFile(f);setPreview(null);setError(null);setSaved(false);
  };
  const handleDrop=(e)=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);};
  const handleProcess=async()=>{
    if(!file) return;
    setLoading(true);setError(null);setPreview(null);
    try{const data=await trainerService.importDietAI(file);setPreview(data.plan);}
    catch(err){setError(err.message);}
    finally{setLoading(false);}
  };
  const handleSave=async()=>{
    if(!preview) return;
    setSaving(true);setError(null);
    try{
      await trainerService.createDiet({...preview,id_miembro_pg:clientId||null,fuente:"ia_import",archivo_fuente:file?.name});
      setSaved(true);onPlanExtracted?.();
    }catch(err){setError(err.message);}
    finally{setSaving(false);}
  };
  const reset=()=>{setFile(null);setPreview(null);setError(null);setSaved(false);setClientId("");};

  if(saved) return(
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      <FiCheckCircle size={48} style={{color:"var(--success)",marginBottom:16}}/>
      <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>Plan guardado exitosamente</h3>
      <p style={{color:"var(--text-secondary)",fontSize:13,marginBottom:20}}>El plan fue importado y está disponible en la pestaña Planes.</p>
      <button className="btn-compact-primary" onClick={reset}><FiRefreshCw size={13}/> Importar otro</button>
    </div>
  );

  return(
    <div style={{maxWidth:700}}>
      {/* Estado del servicio Ollama */}
      {aiStatus&&(
        <div style={{background:aiStatus.disponible&&aiStatus.modelo_activo?"rgba(16,185,129,.08)":"rgba(239,68,68,.08)",border:`1px solid ${aiStatus.disponible&&aiStatus.modelo_activo?"rgba(16,185,129,.25)":"rgba(239,68,68,.25)"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:aiStatus.disponible&&aiStatus.modelo_activo?"var(--success)":"var(--danger)",flexShrink:0}}/>
          {aiStatus.disponible&&aiStatus.modelo_activo?(
            <span><strong style={{color:"var(--success)"}}>Ollama listo</strong> — modelo <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>{aiStatus.modelo}</code> activo</span>
          ):aiStatus.disponible&&!aiStatus.modelo_activo?(
            <span><strong style={{color:"var(--danger)"}}>Modelo no descargado</strong> — ejecuta: <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>docker compose exec ollama ollama pull {aiStatus.modelo}</code></span>
          ):(
            <span><strong style={{color:"var(--danger)"}}>Servicio Ollama no disponible</strong> — verifica que el contenedor esté corriendo: <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>docker compose up -d ollama</code></span>
          )}
        </div>
      )}

      {/* Info */}
      <div style={{background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
        <MdOutlineSmartToy size={18} style={{color:"var(--accent)",flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6}}>
          <strong style={{color:"var(--text-primary)"}}>ETL con IA local (Ollama)</strong><br/>
          Sube el plan alimenticio en PDF o Excel. El modelo de lenguaje local leerá y extraerá la estructura de comidas, macros y horarios automáticamente — sin enviar datos a servidores externos.
        </div>
      </div>

      {/* Dropzone */}
      {!preview&&(
        <div style={{border:`2px dashed ${drag?"var(--accent)":"var(--border)"}`,borderRadius:12,padding:"36px 24px",textAlign:"center",background:drag?"rgba(99,102,241,.05)":"var(--bg-card)",cursor:"pointer",transition:"all .2s",marginBottom:16}}
          onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop} onClick={()=>fileRef.current?.click()}>
          <FiUpload size={32} style={{color:"var(--text-secondary)",marginBottom:12,opacity:.5}}/>
          {file?(
            <div>
              <div style={{fontWeight:700,marginBottom:4}}><FiFile size={14} style={{verticalAlign:"middle",marginRight:5}}/>{file.name}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>{(file.size/1024).toFixed(0)} KB — clic para cambiar</div>
            </div>
          ):(
            <><div style={{fontWeight:600,marginBottom:6}}>Arrastra tu archivo aquí</div><div style={{fontSize:12,color:"var(--text-secondary)"}}>PDF o Excel (.xlsx / .xls)</div></>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        </div>
      )}

      {!preview&&(
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <Label>Asignar a cliente (opcional)</Label>
            <select className="input-compact" value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">Sin asignar</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <button className="btn-compact-primary" onClick={handleProcess}
              disabled={!file||loading||(aiStatus&&(!aiStatus.disponible||!aiStatus.modelo_activo))}
              style={{height:36}}
              title={aiStatus&&(!aiStatus.disponible||!aiStatus.modelo_activo)?"Ollama no disponible":""}>
              {loading?<><FiRefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>:<><MdOutlineSmartToy size={14}/> Procesar con IA</>}
            </button>
          </div>
        </div>
      )}

      {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"12px 16px",marginBottom:14,color:"var(--danger)",fontSize:13,display:"flex",gap:10,alignItems:"flex-start"}}><FiAlertCircle size={15} style={{flexShrink:0,marginTop:1}}/><div>{error}</div></div>}

      {/* Preview del plan extraído */}
      {preview&&(
        <>
          <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <FiCheckCircle size={16} style={{color:"var(--success)",flexShrink:0}}/>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>Plan extraído: {preview.nombre}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>
                {preview.duracion_semanas} semana(s) · {OBJETIVOS.find(o=>o.value===preview.objetivo)?.label||preview.objetivo}
                {preview.calorias_meta?` · ${preview.calorias_meta} kcal/día`:""}
              </div>
            </div>
          </div>
          {(preview.semanas||[]).map((sem,si)=>(
            <div key={si} style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>
                Semana {sem.numero}{sem.notas&&` — ${sem.notas}`}
              </div>
              {(sem.dias||[]).filter(d=>d.comidas?.length>0).map((dia,di)=>(
                <div key={di} style={{marginBottom:6,border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
                  <div style={{background:"var(--bg-input)",padding:"7px 12px",fontWeight:700,fontSize:12,textTransform:"capitalize"}}>{dia.dia}</div>
                  <div style={{padding:"8px 12px"}}>
                    {(dia.comidas||[]).map((c,ci)=>(
                      <div key={ci} style={{marginBottom:8}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--accent)",marginBottom:4}}>{c.nombre}{c.hora&&` · ${c.hora}`}</div>
                        {(c.items||[]).map((item,ii)=>(
                          <div key={ii} style={{fontSize:11,color:"var(--text-secondary)",paddingLeft:12,marginBottom:2}}>
                            • {item.nombre_alimento}{item.cantidad&&` ${item.cantidad} ${item.unidad}`}{item.calorias?` — ${item.calorias} kcal`:""}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {preview.notas&&<p style={{fontSize:12,color:"var(--text-secondary)",marginTop:8}}><strong>Notas:</strong> {preview.notas}</p>}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button className="btn-outline-small" onClick={reset}><FiRefreshCw size={12}/> Descartar</button>
            <select className="input-compact" style={{flex:1}} value={clientId} onChange={e=>setClientId(e.target.value)}>
              <option value="">Sin asignar a cliente</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-compact-primary" onClick={handleSave} disabled={saving}><FiSave size={13}/>{saving?"Guardando...":"Confirmar y guardar"}</button>
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ─── PlanCard ──────────────────────────────────────────────────────────────
function PlanCard({diet,clients,onEdit,onDelete,onAssign,deleting}){
  const [assignOpen,setAssignOpen]=useState(false);
  const [assignVal,setAssignVal]=useState(diet.id_miembro_pg?String(diet.id_miembro_pg):"");
  const [assigning,setAssigning]=useState(false);
  const clientName=clients.find(c=>String(c.id)===String(diet.id_miembro_pg))?.name;
  const objetivo=OBJETIVOS.find(o=>o.value===diet.objetivo)?.label||diet.objetivo;
  const semanas=diet.semanas?.length||(diet.duracion_semanas?diet.duracion_semanas:0);
  const handleAssign=async()=>{setAssigning(true);await onAssign(diet.id,assignVal||null);setAssigning(false);setAssignOpen(false);};
  return(
    <motion.div className="stat-card" style={{padding:18}} whileHover={{translateY:-2}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:40,height:40,borderRadius:10,background:"var(--bg-input)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent)",fontSize:20,flexShrink:0}}><GiMeal/></div>
          <div>
            <div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{diet.nombre}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)"}}>{objetivo&&objetivo}{diet.calorias_meta&&` · ${diet.calorias_meta} kcal/día`}{semanas>0&&` · ${semanas} sem.`}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button className="icon-btn" style={{padding:5}} onClick={()=>onEdit(diet)}><FiEdit size={12}/></button>
          <button className="icon-btn danger" style={{padding:5}} disabled={deleting} onClick={()=>onDelete(diet.id)}><FiTrash2 size={12}/></button>
        </div>
      </div>
      {diet.notas&&<p style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10,lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{diet.notas}</p>}
      {diet.fuente==="ia_import"&&<div style={{marginBottom:8}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(99,102,241,.12)",color:"var(--accent)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><MdOutlineSmartToy size={10}/> Importado con IA</span></div>}
      {!assignOpen?(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <FiUser size={11} style={{color:clientName?"var(--success)":"var(--text-secondary)"}}/>
            <span style={{fontSize:11,color:clientName?"var(--success)":"var(--text-secondary)"}}>{clientName||"Sin asignar"}</span>
          </div>
          <button className="btn-outline-small" style={{fontSize:10,padding:"2px 8px"}} onClick={()=>setAssignOpen(true)}><FiUser size={9}/> Asignar</button>
        </div>
      ):(
        <div style={{display:"flex",gap:6,marginTop:4}}>
          <select className="input-compact" style={{flex:1}} value={assignVal} onChange={e=>setAssignVal(e.target.value)}>
            <option value="">Sin asignar</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-compact-primary" style={{padding:"0 10px",fontSize:11}} onClick={handleAssign} disabled={assigning}>{assigning?"...":<FiCheckCircle size={13}/>}</button>
          <button className="icon-btn" style={{padding:4}} onClick={()=>setAssignOpen(false)}><FiX size={12}/></button>
        </div>
      )}
    </motion.div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
export default function TrainerDiets(){
  const [tab,setTab]=useState("planes");
  const [diets,setDiets]=useState([]); const [recipes,setRecipes]=useState([]); const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const [search,setSearch]=useState(""); const [filterObj,setFilterObj]=useState(""); const [filterCli,setFilterCli]=useState("");
  const [showPlan,setShowPlan]=useState(false); const [editPlan,setEditPlan]=useState(null);
  const [showRecipe,setShowRecipe]=useState(false); const [editRecipe,setEditRecipe]=useState(null);
  const [saving,setSaving]=useState(false); const [deletingId,setDeletingId]=useState(null);

  const loadAll=useCallback(async()=>{
    try{
      setLoading(true);setError(null);
      const [dietsData,recipesData,clientsData]=await Promise.all([trainerService.getDiets(),trainerService.getRecipes(),trainerService.getClients()]);
      setDiets(dietsData);setRecipes(recipesData);
      setClients((clientsData.clients||clientsData||[]).map(c=>({id:c.id||c.id_usuario_pg,name:c.name||c.nombre})));
    }catch(err){setError(err.message||"Error al cargar datos");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  const handleSavePlan=async(form)=>{
    if(!form.nombre?.trim()){alert("El nombre es obligatorio");return;}
    setSaving(true);
    try{editPlan?await trainerService.updateDiet(editPlan.id,form):await trainerService.createDiet(form);setShowPlan(false);setEditPlan(null);await loadAll();}
    catch(err){alert("Error: "+err.message);}finally{setSaving(false);}
  };
  const handleDeletePlan=async(id)=>{
    if(!window.confirm("¿Eliminar este plan?")) return;
    setDeletingId(id);
    try{await trainerService.deleteDiet(id);setDiets(p=>p.filter(d=>d.id!==id));}
    catch(err){alert("Error: "+err.message);}finally{setDeletingId(null);}
  };
  const handleAssignPlan=async(id,id_miembro_pg)=>{await trainerService.assignDiet(id,id_miembro_pg);await loadAll();};

  const handleSaveRecipe=async(form)=>{
    if(!form.nombre?.trim()){alert("El nombre es obligatorio");return;}
    setSaving(true);
    try{editRecipe?await trainerService.updateRecipe(editRecipe.id,form):await trainerService.createRecipe(form);setShowRecipe(false);setEditRecipe(null);await loadAll();}
    catch(err){alert("Error: "+err.message);}finally{setSaving(false);}
  };
  const handleDeleteRecipe=async(id)=>{
    if(!window.confirm("¿Eliminar esta receta?")) return;
    setDeletingId(id);
    try{await trainerService.deleteRecipe(id);setRecipes(p=>p.filter(r=>r.id!==id));}
    catch(err){alert("Error: "+err.message);}finally{setDeletingId(null);}
  };

  const filteredDiets=diets.filter(d=>{
    const matchSearch=!search||d.nombre.toLowerCase().includes(search.toLowerCase());
    const matchObj=!filterObj||d.objetivo===filterObj;
    const matchCli=!filterCli||String(d.id_miembro_pg||"")===filterCli;
    return matchSearch&&matchObj&&matchCli;
  });
  const filteredRecipes=recipes.filter(r=>!search||r.nombre.toLowerCase().includes(search.toLowerCase()));

  const TABS=[
    {key:"planes",label:"Planes",icon:<GiMeal size={14}/>},
    {key:"recetas",label:"Recetas",icon:<GiCookingPot size={14}/>},
    {key:"ia",label:"Importar IA",icon:<MdOutlineSmartToy size={14}/>},
  ];

  if(loading) return(
    <div className="dashboard-content">
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:90,borderRadius:12,marginBottom:12}}/>)}
    </div>
  );

  return(
    <div className="dashboard-content">
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 className="page-title" style={{marginBottom:4}}>Nutrición</h2>
          <p style={{fontSize:13,color:"var(--text-secondary)",margin:0}}>Planes alimenticios, recetas e importación con IA</p>
        </div>
        {tab==="planes"&&<button className="btn-compact-primary" onClick={()=>{setEditPlan(null);setShowPlan(true);}}><FiPlus size={14}/> Nuevo plan</button>}
        {tab==="recetas"&&<button className="btn-compact-primary" onClick={()=>{setEditRecipe(null);setShowRecipe(true);}}><FiPlus size={14}/> Nueva receta</button>}
      </div>

      <AnimatePresence>
        {error&&(
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"12px 16px",marginBottom:16,color:"var(--danger)",fontSize:13,display:"flex",gap:10,alignItems:"center"}}>
            <FiAlertCircle size={14}/>{error}
            <button onClick={()=>setError(null)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"var(--danger)"}}><FiX size={15}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid var(--border)"}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key);setSearch("");}}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",fontSize:13,fontWeight:tab===t.key?700:500,borderBottom:tab===t.key?"2px solid var(--accent)":"2px solid transparent",color:tab===t.key?"var(--accent)":"var(--text-secondary)",background:"none",border:"none",cursor:"pointer",borderRadius:"6px 6px 0 0",marginBottom:-1}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* PLANES */}
      {tab==="planes"&&(
        <>
          <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
            {[{label:"Total",value:diets.length,color:"var(--accent)"},{label:"Asignados",value:diets.filter(d=>d.id_miembro_pg).length,color:"var(--success)"},{label:"Con IA",value:diets.filter(d=>d.fuente==="ia_import").length,color:"rgba(99,102,241,.8)"}].map(k=>(
              <div key={k.label} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border)",flex:"1 1 120px"}}>
                <FiTarget size={15} style={{color:k.color}}/>
                <div><div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div><div style={{fontSize:10,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".05em"}}>{k.label}</div></div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 200px"}}>
              <FiSearch size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-secondary)"}}/>
              <input className="input-compact" placeholder="Buscar plan..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:28}}/>
            </div>
            <select className="input-compact" style={{flex:"0 0 160px"}} value={filterObj} onChange={e=>setFilterObj(e.target.value)}>
              <option value="">Todos los objetivos</option>
              {OBJETIVOS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="input-compact" style={{flex:"0 0 170px"}} value={filterCli} onChange={e=>setFilterCli(e.target.value)}>
              <option value="">Todos los clientes</option>
              {clients.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </div>
          {filteredDiets.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",background:"var(--bg-card)",borderRadius:16,border:"1px solid var(--border)"}}>
              <GiMeal size={44} style={{color:"var(--text-secondary)",marginBottom:12,opacity:.3}}/>
              <p style={{fontSize:14,color:"var(--text-secondary)"}}>{diets.length===0?"Sin planes. Crea el primero o importa uno con IA.":"Sin resultados."}</p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {filteredDiets.map(d=>(
                <PlanCard key={d.id} diet={d} clients={clients} deleting={deletingId===d.id}
                  onEdit={plan=>{setEditPlan(plan);setShowPlan(true);}} onDelete={handleDeletePlan} onAssign={handleAssignPlan}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* RECETAS */}
      {t