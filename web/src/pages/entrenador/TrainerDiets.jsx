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
  FiImage, FiClock, FiRefreshCw, FiBookOpen, FiCheckSquare, FiSquare, FiAlertTriangle,
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
function RecetaCard({recipe,onEdit,onDelete,onView,deleting,selectMode,selected,onSelect}){
  return(
    <div className="stat-card" style={{padding:0,overflow:"hidden",outline:selected?"2px solid var(--accent)":"none",outlineOffset:1,cursor:selectMode?"pointer":"default"}} onClick={selectMode?()=>onSelect(recipe.id):undefined}>
      {recipe.imagen
        ?<img src={recipe.imagen} alt={recipe.nombre} style={{width:"100%",height:130,objectFit:"cover",cursor:selectMode?"pointer":"pointer"}} onClick={selectMode?undefined:()=>onView(recipe)}/>
        :<div style={{height:130,background:"var(--bg-input)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}} onClick={selectMode?undefined:()=>onView(recipe)}><GiCookingPot size={36} style={{color:"var(--text-secondary)",opacity:.3}}/></div>
      }
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <span style={{fontSize:14,fontWeight:700,lineHeight:1.3}}>{recipe.nombre}</span>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {selectMode?(
              <button onClick={e=>{e.stopPropagation();onSelect(recipe.id);}} style={{background:"none",border:"none",cursor:"pointer",color:selected?"var(--accent)":"var(--text-secondary)",padding:4}}>
                {selected?<FiCheckSquare size={18}/>:<FiSquare size={18}/>}
              </button>
            ):(
              <>
                <button className="icon-btn" style={{padding:4}} title="Ver detalle" onClick={()=>onView(recipe)}><FiChevronRight size={13}/></button>
                <button className="icon-btn" style={{padding:4}} onClick={()=>onEdit(recipe)}><FiEdit size={12}/></button>
                <button className="icon-btn danger" style={{padding:4}} disabled={deleting} onClick={()=>onDelete(recipe.id)}><FiTrash2 size={12}/></button>
              </>
            )}
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

// ─── RecetaDetailModal ──────────────────────────────────────────────────────
function RecetaDetailModal({recipe,onClose}){
  if(!recipe) return null;
  const macros=[
    {l:"Proteína",v:recipe.proteinas_g!=null?`${recipe.proteinas_g}g`:null,c:"var(--accent)",bg:"rgba(99,102,241,.1)"},
    {l:"Carbs",v:recipe.carbohidratos_g!=null?`${recipe.carbohidratos_g}g`:null,c:"#f59e0b",bg:"rgba(245,158,11,.1)"},
    {l:"Grasas",v:recipe.grasas_g!=null?`${recipe.grasas_g}g`:null,c:"#10b981",bg:"rgba(16,185,129,.1)"},
  ].filter(x=>x.v);
  return(
    <motion.div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,overflowY:"auto"}}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div style={{background:"var(--bg-card)",borderRadius:18,width:"100%",maxWidth:500,border:"1px solid var(--border)",maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}}
        initial={{scale:.93,y:16}} animate={{scale:1,y:0}} exit={{scale:.93}} onClick={e=>e.stopPropagation()}>

        {/* ── Hero image / header ── */}
        <div style={{position:"relative",flexShrink:0}}>
          {recipe.imagen
            ?<img src={recipe.imagen} alt={recipe.nombre} style={{width:"100%",height:220,objectFit:"cover",display:"block"}}/>
            :<div style={{height:140,background:"linear-gradient(135deg,var(--bg-input) 0%,rgba(99,102,241,.08) 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <GiCookingPot size={60} style={{color:"var(--text-secondary)",opacity:.18}}/>
            </div>
          }
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,width:34,height:34,borderRadius:10,border:"none",background:"rgba(0,0,0,.55)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}>
            <FiX size={16}/>
          </button>
          {recipe.calorias!=null&&recipe.calorias!==""&&(
            <div style={{position:"absolute",bottom:12,left:14,padding:"5px 14px",borderRadius:20,background:"rgba(0,0,0,.62)",color:"#fff",fontSize:14,fontWeight:800,backdropFilter:"blur(6px)",letterSpacing:".01em"}}>
              {recipe.calorias} kcal
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px 24px"}}>
          {/* Title + time */}
          <div style={{marginBottom:14}}>
            <h2 style={{fontSize:20,fontWeight:800,margin:"0 0 5px",lineHeight:1.2}}>{recipe.nombre}</h2>
            {recipe.tiempo_preparacion_min&&(
              <span style={{fontSize:12,color:"var(--text-secondary)",display:"inline-flex",alignItems:"center",gap:4}}>
                <FiClock size={11}/>{recipe.tiempo_preparacion_min} min de preparación
              </span>
            )}
          </div>

          {/* Macro cards */}
          {macros.length>0&&(
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {macros.map(m=>(
                <div key={m.l} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 6px",borderRadius:10,background:m.bg,border:`1px solid ${m.c}30`}}>
                  <span style={{fontSize:18,fontWeight:800,color:m.c,lineHeight:1}}>{m.v}</span>
                  <span style={{fontSize:9,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginTop:3}}>{m.l}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {recipe.descripcion&&(
            <p style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16,lineHeight:1.7,padding:"10px 14px",background:"var(--bg-input)",borderRadius:8,borderLeft:"3px solid var(--accent)",margin:"0 0 16px"}}>{recipe.descripcion}</p>
          )}

          {/* Ingredients */}
          {recipe.ingredientes?.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--text-secondary)",marginBottom:10}}>Ingredientes</div>
              <div style={{borderRadius:10,border:"1px solid var(--border)",overflow:"hidden"}}>
                {recipe.ingredientes.map((ing,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",fontSize:13,background:i%2===0?"transparent":"rgba(255,255,255,.02)",borderBottom:i<recipe.ingredientes.length-1?"1px solid var(--border)":"none"}}>
                    <span style={{fontWeight:500}}>{ing.nombre||ing.nombre_alimento}</span>
                    <span style={{color:"var(--text-secondary)",fontSize:12,flexShrink:0,marginLeft:12}}>
                      {[ing.cantidad!=null&&ing.cantidad!==""?ing.cantidad:null, ing.unidad||null].filter(Boolean).join(" ")||"al gusto"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instrucciones&&(
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"var(--text-secondary)",marginBottom:10}}>Preparación</div>
              <p style={{fontSize:13,lineHeight:1.8,color:"var(--text-secondary)",whiteSpace:"pre-wrap",margin:0}}>{recipe.instrucciones}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ImportarIATab ─────────────────────────────────────────────────────────
function ImportarIATab({clients,onPlanExtracted}){
  const [file,setFile]       = useState(null);
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState(null);
  const [plan,setPlan]       = useState(null);
  const [recetas,setRecetas] = useState([]);
  const [selectedClientOid,setSelectedClientOid] = useState("");
  const [saving,setSaving]   = useState(false);
  const [saved,setSaved]     = useState(false);
  const [drag,setDrag]       = useState(false);
  const [via,setVia]         = useState(null);
  const [showRecetas,setShowRecetas] = useState(false);
  const [aiStatus,setAiStatus] = useState(null);
  const fileRef = useRef();

  useEffect(()=>{
    trainerService.getAIStatus()
      .then(s=>setAiStatus(s))
      .catch(()=>setAiStatus({disponible:false,modelo_activo:false,modelo:"phi3:mini"}));
  },[]);

  const handleFile=(f)=>{
    if(!f) return;
    const ext=f.name.split(".").pop().toLowerCase();
    if(!["pdf","xlsx","xls"].includes(ext)){setError("Solo se aceptan PDF o Excel (.xlsx, .xls)");return;}
    setFile(f);setPlan(null);setRecetas([]);setError(null);setSaved(false);setVia(null);
  };
  const handleDrop=(e)=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);};
  const resolvedPgId=()=>{
    if(!selectedClientOid) return null;
    const c=clients.find(c=>c.id===selectedClientOid);
    return c?.pg_id??null;
  };
  const handleProcess=async()=>{
    if(!file) return;
    setLoading(true);setError(null);setPlan(null);setRecetas([]);
    try{
      const data=await trainerService.importDietAI(file);
      setPlan(data.plan);setRecetas(data.recetas||[]);setVia(data.via||"llm");
    }catch(err){setError(err.message);}
    finally{setLoading(false);}
  };
  const handleSave=async()=>{
    if(!plan) return;
    setSaving(true);setError(null);
    try{
      await trainerService.confirmDietImport(plan,recetas,{id_miembro_pg:resolvedPgId(),archivo:file?.name});
      setSaved(true);onPlanExtracted?.();
    }catch(err){setError(err.message);}
    finally{setSaving(false);}
  };
  const reset=()=>{setFile(null);setPlan(null);setRecetas([]);setError(null);setSaved(false);setSelectedClientOid("");setVia(null);setShowRecetas(false);};

  if(saved) return(
    <div style={{textAlign:"center",padding:"60px 20px"}}>
      <FiCheckCircle size={48} style={{color:"var(--success)",marginBottom:16}}/>
      <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>Plan guardado exitosamente</h3>
      <p style={{color:"var(--text-secondary)",fontSize:13,marginBottom:20}}>
        El plan fue importado y está disponible en la pestaña Planes.
        {recetas.length>0&&<><br/><strong>{recetas.length} receta(s)</strong> añadidas a tu biblioteca.</>}
      </p>
      <button className="btn-compact-primary" onClick={reset}><FiRefreshCw size={13}/> Importar otro</button>
    </div>
  );

  return(
    <div style={{maxWidth:700}}>
      {via&&(
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:via==="parser"?"rgba(16,185,129,.12)":"rgba(99,102,241,.12)",border:`1px solid ${via==="parser"?"rgba(16,185,129,.3)":"rgba(99,102,241,.3)"}`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,color:via==="parser"?"var(--success)":"var(--accent)",marginBottom:12}}>
          {via==="parser"?<FiCheckCircle size={11}/>:<MdOutlineSmartToy size={11}/>}
          {via==="parser"?"Extraído con parser determinístico":"Extraído con IA (Ollama)"}
        </div>
      )}
      {aiStatus&&(
        <div style={{background:aiStatus.disponible&&aiStatus.modelo_activo?"rgba(16,185,129,.08)":"rgba(239,68,68,.08)",border:`1px solid ${aiStatus.disponible&&aiStatus.modelo_activo?"rgba(16,185,129,.25)":"rgba(239,68,68,.25)"}`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:aiStatus.disponible&&aiStatus.modelo_activo?"var(--success)":"var(--danger)",flexShrink:0}}/>
          {aiStatus.disponible&&aiStatus.modelo_activo?(
            <span><strong style={{color:"var(--success)"}}>Ollama listo</strong> — modelo <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>{aiStatus.modelo}</code> activo</span>
          ):aiStatus.disponible&&!aiStatus.modelo_activo?(
            <span><strong style={{color:"var(--danger)"}}>Modelo no descargado</strong> — ejecuta: <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>docker compose exec ollama ollama pull {aiStatus.modelo}</code></span>
          ):(
            <span><strong style={{color:"var(--danger)"}}>Servicio Ollama no disponible</strong> — verifica: <code style={{background:"rgba(0,0,0,.1)",padding:"1px 5px",borderRadius:4}}>docker compose up -d ollama</code></span>
          )}
        </div>
      )}
      <div style={{background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",gap:10,alignItems:"flex-start"}}>
        <MdOutlineSmartToy size={18} style={{color:"var(--accent)",flexShrink:0,marginTop:1}}/>
        <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6}}>
          <strong style={{color:"var(--text-primary)"}}>Importación inteligente desde PDF</strong><br/>
          Sube el plan alimenticio. El sistema detecta recetas, calcula macros por ingrediente y crea automáticamente el plan y la biblioteca de recetas, sin enviar datos a servidores externos.
        </div>
      </div>
      {!plan&&(
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
      {!plan&&(
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <Label>Asignar a cliente (opcional)</Label>
            <select className="input-compact" value={selectedClientOid} onChange={e=>setSelectedClientOid(e.target.value)}>
              <option value="">Sin asignar</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <button className="btn-compact-primary" onClick={handleProcess} disabled={!file||loading} style={{height:36}}>
              {loading?<><FiRefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/> Procesando...</>:<><MdOutlineSmartToy size={14}/> Procesar</>}
            </button>
          </div>
        </div>
      )}
      {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"12px 16px",marginBottom:14,color:"var(--danger)",fontSize:13,display:"flex",gap:10,alignItems:"flex-start"}}><FiAlertCircle size={15} style={{flexShrink:0,marginTop:1}}/><div>{error}</div></div>}
      {plan&&(
        <>
          <div style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <FiCheckCircle size={16} style={{color:"var(--success)",flexShrink:0}}/>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>Plan extraído: {plan.nombre}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>
                {plan.duracion_semanas} semana(s) · {OBJETIVOS.find(o=>o.value===plan.objetivo)?.label||plan.objetivo}
                {plan.calorias_meta?` · ${plan.calorias_meta} kcal/día`:""}
              </div>
            </div>
          </div>
          {recetas.length>0&&(
            <div style={{border:"1px solid var(--border)",borderRadius:10,marginBottom:14,overflow:"hidden"}}>
              <button style={{width:"100%",background:"var(--bg-input)",border:"none",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",color:"var(--text-primary)"}}
                onClick={()=>setShowRecetas(v=>!v)}>
                <span style={{fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                  <FiBookOpen size={13}/> {recetas.length} receta(s) detectadas — se añadirán a tu biblioteca
                </span>
                <FiChevronDown size={14} style={{transform:showRecetas?"rotate(180deg)":"none",transition:"transform .2s"}}/>
              </button>
              {showRecetas&&(
                <div style={{padding:"8px 14px 12px"}}>
                  {recetas.map((r,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<recetas.length-1?"1px solid var(--border-subtle)":"none"}}>
                      <span style={{fontSize:12,fontWeight:600}}>{r.nombre}</span>
                      <span style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:10}}>
                        {r.calorias!=null&&<span>{r.calorias} kcal</span>}
                        {r.proteinas_g!=null&&<span style={{color:"var(--accent)"}}>{r.proteinas_g}g prot</span>}
                        {r.carbohidratos_g!=null&&<span>{r.carbohidratos_g}g carb</span>}
                        {r.grasas_g!=null&&<span>{r.grasas_g}g gras</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {(plan.semanas||[]).map((sem,si)=>(
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
                            {item.nombre_alimento}{item.cantidad&&` ${item.cantidad} ${item.unidad}`}{item.calorias?` — ${item.calorias} kcal`:""}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          {plan.notas&&<p style={{fontSize:12,color:"var(--text-secondary)",marginTop:8}}><strong>Notas:</strong> {plan.notas}</p>}
          <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
            <button className="btn-outline-small" onClick={reset}><FiRefreshCw size={12}/> Descartar</button>
            <select className="input-compact" style={{flex:1,minWidth:160}} value={selectedClientOid} onChange={e=>setSelectedClientOid(e.target.value)}>
              <option value="">Sin asignar a cliente</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-compact-primary" onClick={handleSave} disabled={saving}>
              <FiSave size={13}/>{saving?"Guardando...":"Confirmar y guardar todo"}
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

// ─── ConfirmDeleteModal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({count=1,onConfirm,onCancel,deleting=false}){
  const isBulk=count>1;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)"}} onClick={!deleting?onCancel:undefined}/>
      <motion.div initial={{opacity:0,scale:.93,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.93}}
        transition={{duration:.18}} style={{position:"relative",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:18,padding:"32px 28px",width:360,maxWidth:"90vw",boxShadow:"0 24px 64px rgba(0,0,0,.45)"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:16}}>
          <div style={{width:56,height:56,borderRadius:16,background:"rgba(239,68,68,.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <FiAlertTriangle size={28} style={{color:"var(--danger)"}}/>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,marginBottom:8}}>
              {isBulk?`Eliminar ${count} elementos`:"¿Eliminar este elemento?"}
            </div>
            <div style={{fontSize:13,color:"var(--text-secondary)",lineHeight:1.7}}>
              {isBulk
                ?`Se eliminarán permanentemente ${count} elementos. Esta acción no se puede deshacer.`
                :"Este elemento se eliminará de forma permanente. Esta acción no se puede deshacer."
              }
            </div>
          </div>
          <div style={{display:"flex",gap:10,width:"100%",marginTop:4}}>
            <button onClick={onCancel} disabled={deleting}
              style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg-input)",color:"var(--text-primary)",fontSize:14,fontWeight:600,cursor:"pointer"}}>
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={deleting}
              style={{flex:1,padding:"11px 0",borderRadius:10,border:"none",background:"var(--danger)",color:"#fff",fontSize:14,fontWeight:700,cursor:deleting?"not-allowed":"pointer",opacity:deleting?.65:1,transition:"opacity .15s"}}>
              {deleting?"Eliminando...":"Sí, eliminar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PlanCard ──────────────────────────────────────────────────────────────
function PlanCard({diet,clients,onEdit,onDelete,onAssign,onView,deleting,selectMode,selected,onSelect}){
  const [assignOpen,setAssignOpen]=useState(false);
  const assignedClient=clients.find(c=>c.pg_id!=null&&Number(c.pg_id)===Number(diet.id_miembro_pg));
  const [assignOid,setAssignOid]=useState(assignedClient?.id||"");
  const [assigning,setAssigning]=useState(false);
  const clientName=assignedClient?.name;
  const objetivo=OBJETIVOS.find(o=>o.value===diet.objetivo)?.label||diet.objetivo;
  const semanas=diet.semanas?.length||(diet.duracion_semanas||0);
  const handleAssign=async()=>{
    setAssigning(true);
    const c=clients.find(cl=>cl.id===assignOid);
    await onAssign(diet.id,c?.pg_id??null);
    setAssigning(false);setAssignOpen(false);
  };
  return(
    <motion.div className="stat-card" style={{padding:18,outline:selected?"2px solid var(--accent)":"none",outlineOffset:1,cursor:selectMode?"pointer":"default"}} onClick={selectMode?()=>onSelect(diet.id):undefined} whileHover={{translateY:-2}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flex:1,minWidth:0}}>
          <div style={{width:40,height:40,borderRadius:10,background:"var(--bg-input)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--accent)",fontSize:20,flexShrink:0}}><GiMeal/></div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{diet.nombre}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)"}}>{objetivo}{diet.calorias_meta&&` · ${diet.calorias_meta} kcal/día`}{semanas>0&&` · ${semanas} sem.`}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          {selectMode?(
            <button onClick={e=>{e.stopPropagation();onSelect(diet.id);}} style={{background:"none",border:"none",cursor:"pointer",color:selected?"var(--accent)":"var(--text-secondary)",padding:4}}>
              {selected?<FiCheckSquare size={18}/>:<FiSquare size={18}/>}
            </button>
          ):(
            <>
              <button className="icon-btn" style={{padding:5}} title="Ver detalle" onClick={()=>onView(diet)}><FiChevronRight size={13}/></button>
              <button className="icon-btn" style={{padding:5}} onClick={()=>onEdit(diet)}><FiEdit size={12}/></button>
              <button className="icon-btn danger" style={{padding:5}} disabled={deleting} onClick={()=>onDelete(diet.id)}><FiTrash2 size={12}/></button>
            </>
          )}
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
          <select className="input-compact" style={{flex:1}} value={assignOid} onChange={e=>setAssignOid(e.target.value)}>
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

// ─── PlanDetailModal ────────────────────────────────────────────────────────
function PlanDetailModal({diet,clients,recipes=[],onViewRecipe,onClose}){
  const [semIdx,setSemIdx]=useState(0);
  const [diaIdx,setDiaIdx]=useState(0);
  if(!diet) return null;
  const objetivo=OBJETIVOS.find(o=>o.value===diet.objetivo)?.label||diet.objetivo;
  const assignedClient=clients.find(c=>c.pg_id!=null&&Number(c.pg_id)===Number(diet.id_miembro_pg));
  const semanas=diet.semanas||[];
  const semActual=semanas[semIdx];
  const diasConComidas=(semActual?.dias||[]).filter(d=>(d.comidas||[]).length>0);
  const diaActual=diasConComidas[diaIdx]||null;
  const kcalDia=(diaActual?.comidas||[]).reduce((s,c)=>s+(c.items||[]).reduce((ss,i)=>ss+(Number(i.calorias)||0),0),0);
  const macros=[
    {l:"Kcal meta",v:diet.calorias_meta,c:"var(--text-primary)",bg:"rgba(255,255,255,.06)"},
    {l:"Proteínas",v:diet.proteinas_meta_g?`${diet.proteinas_meta_g}g`:null,c:"var(--accent)",bg:"rgba(99,102,241,.1)"},
    {l:"Carbs",v:diet.carbohidratos_meta_g?`${diet.carbohidratos_meta_g}g`:null,c:"#f59e0b",bg:"rgba(245,158,11,.1)"},
    {l:"Grasas",v:diet.grasas_meta_g?`${diet.grasas_meta_g}g`:null,c:"#10b981",bg:"rgba(16,185,129,.1)"},
  ].filter(x=>x.v);
  return(
    <motion.div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,overflowY:"auto"}}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div style={{background:"var(--bg-card)",borderRadius:18,width:"100%",maxWidth:720,border:"1px solid var(--border)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}
        initial={{scale:.93,y:16}} animate={{scale:1,y:0}} exit={{scale:.93}} onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{padding:"20px 24px 0",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div style={{minWidth:0,flex:1}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                {diet.fuente==="ia_import"&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(99,102,241,.12)",color:"var(--accent)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><MdOutlineSmartToy size={10}/> Importado con IA</span>}
                {assignedClient&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(16,185,129,.12)",color:"var(--success)",fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><FiUser size={10}/> {assignedClient.name}</span>}
              </div>
              <h2 style={{fontSize:20,fontWeight:800,margin:0,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{diet.nombre}</h2>
              <p style={{fontSize:12,color:"var(--text-secondary)",margin:"4px 0 0"}}>
                {objetivo}{diet.duracion_semanas>0&&` · ${diet.duracion_semanas} semana${diet.duracion_semanas>1?"s":""}`}
              </p>
            </div>
            <button className="icon-btn" style={{marginLeft:12,flexShrink:0}} onClick={onClose}><FiX size={18}/></button>
          </div>

          {/* Macro cards */}
          {macros.length>0&&(
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {macros.map(m=>(
                <div key={m.l} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 16px",borderRadius:10,background:m.bg,border:`1px solid ${m.c}30`,minWidth:72}}>
                  <span style={{fontSize:16,fontWeight:800,color:m.c,lineHeight:1}}>{m.v}</span>
                  <span style={{fontSize:9,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:".06em",marginTop:3}}>{m.l}</span>
                </div>
              ))}
            </div>
          )}

          {/* Week tabs (only if >1 week) */}
          {semanas.length>1&&(
            <div style={{display:"flex",gap:4,marginTop:4}}>
              {semanas.map((s,i)=>(
                <button key={i} onClick={()=>{setSemIdx(i);setDiaIdx(0);}}
                  style={{padding:"5px 16px",borderRadius:"6px 6px 0 0",fontSize:12,fontWeight:i===semIdx?700:500,
                    background:i===semIdx?"var(--accent)":"var(--bg-input)",
                    color:i===semIdx?"#fff":"var(--text-secondary)",
                    border:"1px solid var(--border)",borderBottom:"none",cursor:"pointer",transition:"all .12s"}}>
                  Semana {s.numero}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px 24px"}}>
          {diet.notas&&(
            <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:14,padding:"10px 14px",background:"var(--bg-input)",borderRadius:8,lineHeight:1.6,borderLeft:"3px solid var(--accent)"}}>
              {diet.notas}
            </div>
          )}

          {diasConComidas.length===0&&(
            <p style={{fontSize:13,color:"var(--text-secondary)",textAlign:"center",padding:"32px 0"}}>Sin contenido en este plan.</p>
          )}

          {diasConComidas.length>0&&(
            <>
              {/* Day tabs */}
              <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
                {diasConComidas.map((d,i)=>(
                  <button key={i} onClick={()=>setDiaIdx(i)}
                    style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:i===diaIdx?700:500,whiteSpace:"nowrap",
                      background:i===diaIdx?"var(--accent)":"var(--bg-input)",
                      color:i===diaIdx?"#fff":"var(--text-secondary)",
                      border:i===diaIdx?"1px solid var(--accent)":"1px solid var(--border)",
                      cursor:"pointer",flexShrink:0,transition:"all .12s"}}>
                    {DIA_LABEL[d.dia]||d.dia}
                  </button>
                ))}
              </div>

              {/* Day kcal summary */}
              {kcalDia>0&&(
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginBottom:12}}>
                  <span style={{fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,background:"var(--bg-input)",border:"1px solid var(--border)",color:"var(--text-primary)"}}>
                    Total día: {kcalDia} kcal
                  </span>
                </div>
              )}

              {/* Meal cards */}
              {diaActual&&(diaActual.comidas||[]).map((c,ci)=>{
                const kcalComida=(c.items||[]).reduce((s,i)=>s+(Number(i.calorias)||0),0);
                const protComida=(c.items||[]).reduce((s,i)=>s+(Number(i.proteinas_g)||0),0);
                return(
                  <div key={ci} style={{marginBottom:10,border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"10px 16px",background:"var(--bg-input)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:700}}>{c.nombre}</span>
                        {c.hora&&(
                          <span style={{fontSize:11,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:3}}>
                            <FiClock size={10}/>{c.hora}
                          </span>
                        )}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {kcalComida>0&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:"rgba(99,102,241,.1)",color:"var(--accent)"}}>{kcalComida} kcal</span>}
                        {protComida>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"rgba(16,185,129,.08)",color:"#10b981"}}>{Math.round(protComida)}g P</span>}
                      </div>
                    </div>
                    <div style={{padding:"10px 16px",display:"flex",flexDirection:"column",gap:8}}>
                      {(c.items||[]).map((item,ii)=>{
                        // Lookup por id_receta primero; fallback por nombre exacto
                        const linkedRecipe=item.id_receta
                          ?recipes.find(r=>r.id===item.id_receta)
                          :recipes.find(r=>r.nombre?.toLowerCase().trim()===item.nombre_alimento?.toLowerCase().trim());
                        const itemImagen=item.imagen||linkedRecipe?.imagen||null;
                        const canView=!!(linkedRecipe||itemImagen);
                        return(
                        <div key={ii} style={{display:"flex",alignItems:"center",gap:10}}>
                          {/* Thumbnail — clickable if there's a recipe to view */}
                          <div style={{position:"relative",flexShrink:0,cursor:canView&&onViewRecipe?"pointer":"default"}}
                            onClick={canView&&onViewRecipe?()=>onViewRecipe(linkedRecipe||{nombre:item.nombre_alimento,imagen:itemImagen,calorias:item.calorias,proteinas_g:item.proteinas_g,carbohidratos_g:item.carbohidratos_g,grasas_g:item.grasas_g,ingredientes:[]}):undefined}>
                            {itemImagen
                              ?<img src={itemImagen} alt="" style={{width:44,height:44,borderRadius:8,objectFit:"cover",border:"1px solid var(--border)"}}/>
                              :<div style={{width:44,height:44,borderRadius:8,background:"var(--bg-input)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)"}}>
                                <GiCookingPot size={18} style={{color:"var(--text-secondary)",opacity:.35}}/>
                              </div>
                            }
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.nombre_alimento||"—"}</div>
                            {item.cantidad&&<div style={{fontSize:11,color:"var(--text-secondary)"}}>{item.cantidad} {item.unidad}</div>}
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
                            {item.calorias!=null&&item.calorias!==""&&(
                              <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:"var(--bg-input)",border:"1px solid var(--border)"}}>{item.calorias} kcal</span>
                            )}
                            {item.proteinas_g!=null&&item.proteinas_g!==""&&(
                              <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:6,background:"rgba(99,102,241,.08)",color:"var(--accent)",border:"1px solid rgba(99,102,241,.2)"}}>{item.proteinas_g}g P</span>
                            )}
                            {onViewRecipe&&canView&&(
                              <button onClick={()=>onViewRecipe(linkedRecipe||{nombre:item.nombre_alimento,imagen:itemImagen,calorias:item.calorias,proteinas_g:item.proteinas_g,carbohidratos_g:item.carbohidratos_g,grasas_g:item.grasas_g,ingredientes:[]})}
                                style={{width:26,height:26,borderRadius:6,border:"1px solid var(--border)",background:"var(--bg-input)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)",flexShrink:0}}
                                title="Ver receta">
                                <FiBookOpen size={11}/>
                              </button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                      {(!c.items||c.items.length===0)&&(
                        <p style={{fontSize:11,color:"var(--text-secondary)",margin:0,fontStyle:"italic"}}>Sin alimentos registrados.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Fallback: plan sin estructura semanas (formato legado) */}
          {semanas.length===0&&(diet.comidas||[]).length>0&&(
            <div style={{fontSize:12,color:"var(--text-secondary)"}}>
              {diet.comidas.map((c,i)=><div key={i} style={{marginBottom:4}}>• {c.nombre||c.nombre_alimento}</div>)}
            </div>
          )}
        </div>
      </motion.div>
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
  const [viewPlan,setViewPlan]=useState(null); const [viewRecipe,setViewRecipe]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [selectMode,setSelectMode]=useState(false); const [selectedIds,setSelectedIds]=useState(new Set());

  const loadAll=useCallback(async()=>{
    try{
      setLoading(true);setError(null);
      const [dietsData,recipesData,clientsData]=await Promise.all([trainerService.getDiets(),trainerService.getRecipes(),trainerService.getClients()]);
      setDiets(dietsData);setRecipes(recipesData);
      setClients((clientsData.clients||clientsData||[]).map(c=>({id:c.id,pg_id:c.pg_id??null,name:c.name||c.nombre})));
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
  const handleDeletePlan=(id)=>setConfirmDel({ids:[id],type:"plan",deleting:false});
  const handleDeleteRecipe=(id)=>setConfirmDel({ids:[id],type:"recipe",deleting:false});
  const execDelete=async()=>{
    if(!confirmDel) return;
    const {ids,type}=confirmDel;
    setConfirmDel(c=>({...c,deleting:true}));
    try{
      if(ids.length===1){
        // Single delete — usa endpoint individual
        type==="plan"
          ?await trainerService.deleteDiet(ids[0])
          :await trainerService.deleteRecipe(ids[0]);
      } else {
        // Bulk delete — una sola llamada, evita rate-limit
        type==="plan"
          ?await trainerService.bulkDeleteDiets(ids)
          :await trainerService.bulkDeleteRecipes(ids);
      }
      if(type==="plan") setDiets(p=>p.filter(d=>!ids.includes(d.id)));
      else setRecipes(p=>p.filter(r=>!ids.includes(r.id)));
      setSelectedIds(new Set()); setSelectMode(false);
    }catch(err){alert("Error: "+err.message);}
    finally{setConfirmDel(null);}
  };
  const handleAssignPlan=async(id,id_miembro_pg)=>{await trainerService.assignDiet(id,id_miembro_pg);await loadAll();};

  const handleSaveRecipe=async(form)=>{
    if(!form.nombre?.trim()){alert("El nombre es obligatorio");return;}
    setSaving(true);
    try{editRecipe?await trainerService.updateRecipe(editRecipe.id,form):await trainerService.createRecipe(form);setShowRecipe(false);setEditRecipe(null);await loadAll();}
    catch(err){alert("Error: "+err.message);}finally{setSaving(false);}
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
              {clients.filter(c=>c.pg_id!=null).map(c=><option key={c.id} value={String(c.pg_id)}>{c.name}</option>)}
            </select>
            <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds(new Set());}}
              style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--border)",background:selectMode?"var(--accent)":"var(--bg-input)",color:selectMode?"#fff":"var(--text-secondary)",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,flexShrink:0,transition:"all .15s"}}>
              {selectMode?<FiCheckSquare size={13}/>:<FiSquare size={13}/>} Seleccionar
            </button>
            {selectMode&&filteredDiets.length>0&&(
              <button onClick={()=>setSelectedIds(selectedIds.size===filteredDiets.length?new Set():new Set(filteredDiets.map(d=>d.id)))}
                style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--accent)",background:"rgba(99,102,241,.1)",color:"var(--accent)",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
                {selectedIds.size===filteredDiets.length?"Deseleccionar todo":"Seleccionar todo"}
              </button>
            )}
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
                  onEdit={plan=>{setEditPlan(plan);setShowPlan(true);}} onDelete={handleDeletePlan} onAssign={handleAssignPlan} onView={setViewPlan}
                  selectMode={selectMode} selected={selectedIds.has(d.id)}
                  onSelect={id=>setSelectedIds(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;})}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* RECETAS */}
      {tab==="recetas"&&(
        <>
          <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{position:"relative",flex:"1 1 200px"}}>
              <FiSearch size={12} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-secondary)"}}/>
              <input className="input-compact" placeholder="Buscar receta..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:28}}/>
            </div>
            <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds(new Set());}}
              style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--border)",background:selectMode?"var(--accent)":"var(--bg-input)",color:selectMode?"#fff":"var(--text-secondary)",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,flexShrink:0,transition:"all .15s"}}>
              {selectMode?<FiCheckSquare size={13}/>:<FiSquare size={13}/>} Seleccionar
            </button>
            {selectMode&&filteredRecipes.length>0&&(
              <button onClick={()=>setSelectedIds(selectedIds.size===filteredRecipes.length?new Set():new Set(filteredRecipes.map(r=>r.id)))}
                style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--accent)",background:"rgba(99,102,241,.1)",color:"var(--accent)",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,transition:"all .15s"}}>
                {selectedIds.size===filteredRecipes.length?"Deseleccionar todo":"Seleccionar todo"}
              </button>
            )}
          </div>
          {filteredRecipes.length===0?(
            <div style={{textAlign:"center",padding:"60px 20px",background:"var(--bg-card)",borderRadius:16,border:"1px solid var(--border)"}}>
              <GiCookingPot size={44} style={{color:"var(--text-secondary)",marginBottom:12,opacity:.3}}/>
              <p style={{fontSize:14,color:"var(--text-secondary)"}}>{recipes.length===0?"Sin recetas. Crea la primera.":"Sin resultados."}</p>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {filteredRecipes.map(r=>(
                <RecetaCard key={r.id} recipe={r} deleting={deletingId===r.id}
                  onEdit={rec=>{setEditRecipe(rec);setShowRecipe(true);}} onDelete={handleDeleteRecipe} onView={setViewRecipe}
                  selectMode={selectMode} selected={selectedIds.has(r.id)}
                  onSelect={id=>setSelectedIds(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;})}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* IMPORTAR IA */}
      {tab==="ia"&&<ImportarIATab clients={clients} onPlanExtracted={()=>loadAll()}/>}

      <AnimatePresence>
        {showPlan&&<PlanBuilderModal plan={editPlan} clients={clients} recipes={recipes} onSave={handleSavePlan} onClose={()=>{setShowPlan(false);setEditPlan(null);}} saving={saving}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showRecipe&&<RecetaFormModal recipe={editRecipe} onSave={handleSaveRecipe} onClose={()=>{setShowRecipe(false);setEditRecipe(null);}} saving={saving}/>}
      </AnimatePresence>
      {viewPlan&&<PlanDetailModal diet={viewPlan} clients={clients} recipes={recipes} onViewRecipe={setViewRecipe} onClose={()=>setViewPlan(null)}/>}
      {viewRecipe&&<RecetaDetailModal recipe={viewRecipe} onClose={()=>setViewRecipe(null)}/>}
      <AnimatePresence>
        {confirmDel&&(
          <ConfirmDeleteModal count={confirmDel.ids.length} deleting={confirmDel.deleting}
            onConfirm={execDelete} onCancel={()=>setConfirmDel(null)}/>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectMode&&selectedIds.size>0&&(
          <motion.div initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
            style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:8000,
              background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,
              padding:"12px 20px",display:"flex",alignItems:"center",gap:16,
              boxShadow:"0 8px 40px rgba(0,0,0,.4)",backdropFilter:"blur(10px)",whiteSpace:"nowrap"}}>
            <span style={{fontSize:14,fontWeight:700}}>{selectedIds.size} seleccionado{selectedIds.size!==1?"s":""}</span>
            <button onClick={()=>setSelectedIds(new Set())}
              style={{background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:12,padding:0}}>
              Limpiar
            </button>
            <button onClick={()=>setConfirmDel({ids:[...selectedIds],type:tab==="planes"?"plan":"recipe",deleting:false})}
              style={{padding:"8px 18px",borderRadius:8,border:"none",background:"var(--danger)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <FiTrash2 size={13}/> Eliminar {selectedIds.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
