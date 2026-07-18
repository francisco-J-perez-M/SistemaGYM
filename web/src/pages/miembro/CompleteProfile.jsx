import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser, FiHeart, FiTarget, FiActivity, FiCheckCircle,
  FiArrowRight, FiArrowLeft, FiAlertTriangle, FiTrendingDown, FiZap, FiLock,
} from "react-icons/fi";
import { GiMuscleUp, GiRunningShoe } from "react-icons/gi";
import "../../css/CSSUnificado.css";

// ── Constantes ────────────────────────────────────────────────────────────────

const CONDICIONES = [
  "Diabetes", "Hipertensión", "Asma", "Problemas cardíacos",
  "Artritis", "Osteoporosis", "Escoliosis / problemas de columna",
  "Ninguna",
];

const OBJETIVOS = [
  { id: "perdida_peso",      label: "Pérdida de peso",   icon: <FiTrendingDown /> },
  { id: "ganancia_muscular", label: "Ganar músculo",     icon: <GiMuscleUp /> },
  { id: "tonificacion",      label: "Tonificación",      icon: <FiZap /> },
  { id: "resistencia",       label: "Resistencia",       icon: <GiRunningShoe /> },
  { id: "bienestar",         label: "Bienestar general", icon: <FiHeart /> },
  { id: "rehabilitacion",    label: "Rehabilitación",    icon: <FiActivity /> },
];

const EXPERIENCIA = [
  { id: "principiante", label: "Principiante", desc: "Menos de 6 meses" },
  { id: "intermedio",   label: "Intermedio",   desc: "6 meses – 2 años" },
  { id: "avanzado",     label: "Avanzado",     desc: "Más de 2 años" },
];

const ACTIVIDAD = [
  { id: "sedentario",  label: "Sedentario",  desc: "Trabajo de escritorio, poco movimiento" },
  { id: "poco_activo", label: "Poco activo", desc: "Caminata leve, movimiento casual" },
  { id: "moderado",    label: "Moderado",    desc: "Actividad física 3–4 veces/sem" },
  { id: "muy_activo",  label: "Muy activo",  desc: "Ejercicio intenso casi todos los días" },
];

const DIAS    = ["1-2", "3-4", "5-7"];
const SUENO   = ["< 6 horas", "6–7 horas", "7–8 horas", "> 8 horas"];
const ALCOHOL = ["Nunca", "Ocasionalmente", "Con frecuencia"];

const STEPS = [
  { id: 1, label: "Datos",     icon: <FiUser /> },
  { id: 2, label: "Salud",     icon: <FiHeart /> },
  { id: 3, label: "Objetivos", icon: <FiTarget /> },
  { id: 4, label: "Medidas",   icon: <FiActivity /> },
];

const INITIAL = {
  sexo: "", fechaNacimiento: "", telefono: "", estatura: "",
  contactoEmergenciaNombre: "", contactoEmergenciaTelefono: "",
  condicionesMedicas: [], medicamentos: "", alergias: "",
  lesiones: "", embarazada: false, notas: "",
  objetivo: "", nivelExperiencia: "", diasSemana: "",
  horasSueno: "", nivelActividad: "", fuma: false, alcohol: "",
  peso: "", pecho: "", cintura: "", cadera: "",
  brazoDerecho: "", brazoIzquierdo: "",
  musloDerecho: "", musloIzquierdo: "", pantorrilla: "",
  aceptaTerminos: false,
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-main)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px 60px",
    fontFamily: "Inter,system-ui,sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 680,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "36px 40px",
    boxShadow: "0 8px 40px rgba(0,0,0,.15)",
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: ".04em",
  },
  inp: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "11px 14px",
    color: "var(--text-primary)",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  optBtn: (on) => ({
    padding: "12px 16px", borderRadius: 12,
    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
    background: on ? "var(--accent-dim)" : "var(--bg-input)",
    color: on ? "var(--accent)" : "var(--text-primary)",
    cursor: "pointer", transition: "all .15s",
    fontWeight: on ? 700 : 400, fontSize: 14, textAlign: "center",
  }),
  pill: (on) => ({
    padding: "8px 14px", borderRadius: 99,
    border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
    background: on ? "var(--accent-dim)" : "var(--bg-input)",
    color: on ? "var(--accent)" : "var(--text-secondary)",
    cursor: "pointer", transition: "all .15s",
    fontSize: 13, fontWeight: on ? 700 : 400, whiteSpace: "nowrap",
  }),
};

// ── Component Field ───────────────────────────────────────────────────────────
function Field({ label, error, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={S.label}>{label}</label>}
      {children}
      {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text", ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...S.inp, borderColor: focused ? "var(--accent)" : "var(--border)" }}
      {...rest}
    />
  );
}

// ── Pasos ─────────────────────────────────────────────────────────────────────
function Step1({ form, set, errors }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Datos personales</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Esta información nos ayuda a personalizar tu entrenamiento.
      </p>

      <Field label="Sexo biológico *" error={errors.sexo}>
        <div style={{ display: "flex", gap: 10 }}>
          {["Masculino", "Femenino", "Otro"].map(s => (
            <button key={s} onClick={() => set("sexo", s)} style={{ ...S.optBtn(form.sexo === s), flex: 1 }}>{s}</button>
          ))}
        </div>
      </Field>

      <div style={S.row2}>
        <Field label="Fecha de nacimiento *" error={errors.fechaNacimiento}>
          <Inp type="date" value={form.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} />
        </Field>
        <Field label="Estatura (cm) *" error={errors.estatura}>
          <Inp type="number" placeholder="ej. 170" value={form.estatura} onChange={e => set("estatura", e.target.value)} />
        </Field>
      </div>

      <Field label="Teléfono (opcional)">
        <Inp type="tel" placeholder="+52 55 0000 0000" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
      </Field>

      <div style={{ padding: 16, background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, marginBottom: 4 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <FiAlertTriangle /> Contacto de emergencia *
        </p>
        <div style={S.row2}>
          <Field label="Nombre" error={errors.contactoEmergenciaNombre}>
            <Inp placeholder="Nombre completo" value={form.contactoEmergenciaNombre} onChange={e => set("contactoEmergenciaNombre", e.target.value)} />
          </Field>
          <Field label="Teléfono" error={errors.contactoEmergenciaTelefono}>
            <Inp type="tel" placeholder="+52 55 0000 0000" value={form.contactoEmergenciaTelefono} onChange={e => set("contactoEmergenciaTelefono", e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, set, errors }) {
  const toggle = (c) => {
    if (c === "Ninguna") { set("condicionesMedicas", form.condicionesMedicas.includes("Ninguna") ? [] : ["Ninguna"]); return; }
    const prev = form.condicionesMedicas.filter(x => x !== "Ninguna");
    set("condicionesMedicas", prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Información de salud</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Confidencial — solo la ve el staff de tu gimnasio para cuidarte mejor.
      </p>

      <Field label="Condiciones médicas">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CONDICIONES.map(c => (
            <button key={c} onClick={() => toggle(c)} style={S.pill(form.condicionesMedicas.includes(c))}>{c}</button>
          ))}
        </div>
      </Field>

      <Field label="Medicamentos regulares">
        <textarea placeholder="Ej. Metformina, Losartán… (vacío si ninguno)"
          value={form.medicamentos} onChange={e => set("medicamentos", e.target.value)}
          rows={2} style={{ ...S.inp, resize: "vertical", minHeight: 60 }} />
      </Field>

      <div style={S.row2}>
        <Field label="Alergias conocidas">
          <Inp placeholder="Ej. Polen, látex…" value={form.alergias} onChange={e => set("alergias", e.target.value)} />
        </Field>
        <Field label="Lesiones o cirugías previas">
          <Inp placeholder="Ej. Rodilla derecha, lumbar…" value={form.lesiones} onChange={e => set("lesiones", e.target.value)} />
        </Field>
      </div>

      {form.sexo === "Femenino" && (
        <Field label="">
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
            <input type="checkbox" checked={form.embarazada} onChange={e => set("embarazada", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }} />
            Actualmente estoy embarazada
          </label>
        </Field>
      )}

      <Field label="Notas adicionales">
        <textarea placeholder="Cualquier otra información para el staff…"
          value={form.notas} onChange={e => set("notas", e.target.value)}
          rows={2} style={{ ...S.inp, resize: "vertical", minHeight: 60 }} />
      </Field>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.25)", borderRadius: 10, fontSize: 13, color: "var(--text-secondary)" }}>
        <FiLock /> Estos datos nunca se comparten fuera de tu gimnasio.
      </div>
    </div>
  );
}

function Step3({ form, set, errors }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Objetivos y hábitos</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Define tus metas para que diseñemos el plan perfecto.
      </p>

      <Field label="Objetivo principal *" error={errors.objetivo}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {OBJETIVOS.map(o => (
            <button key={o.id} onClick={() => set("objetivo", o.id)}
              style={{ ...S.optBtn(form.objetivo === o.id), display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px" }}>
              <span style={{ fontSize: 22 }}>{o.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Nivel de experiencia *" error={errors.nivelExperiencia}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {EXPERIENCIA.map(e => (
            <button key={e.id} onClick={() => set("nivelExperiencia", e.id)}
              style={{ ...S.optBtn(form.nivelExperiencia === e.id), display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: 14 }}>
              <span style={{ fontWeight: 700 }}>{e.label}</span>
              <span style={{ fontSize: 11, opacity: .7 }}>{e.desc}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Actividad fuera del gym *" error={errors.nivelActividad}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ACTIVIDAD.map(a => (
            <button key={a.id} onClick={() => set("nivelActividad", a.id)}
              style={{ ...S.optBtn(form.nivelActividad === a.id), display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 14px" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</span>
              <span style={{ fontSize: 11, opacity: .7 }}>{a.desc}</span>
            </button>
          ))}
        </div>
      </Field>

      <div style={S.row2}>
        <Field label="Días disponibles / semana">
          <div style={{ display: "flex", gap: 8 }}>
            {DIAS.map(d => (
              <button key={d} onClick={() => set("diasSemana", d)} style={{ ...S.pill(form.diasSemana === d), flex: 1 }}>{d} días</button>
            ))}
          </div>
        </Field>
        <Field label="Horas de sueño por noche">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUENO.map(h => (
              <button key={h} onClick={() => set("horasSueno", h)} style={S.pill(form.horasSueno === h)}>{h}</button>
            ))}
          </div>
        </Field>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
          <input type="checkbox" checked={form.fuma} onChange={e => set("fuma", e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }} />
          Fumo actualmente
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Alcohol:</span>
          {ALCOHOL.map(a => (
            <button key={a} onClick={() => set("alcohol", a)} style={S.pill(form.alcohol === a)}>{a}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ form, set, errors }) {
  const medidas = [
    ["pecho",         "Pecho"],
    ["cintura",       "Cintura"],
    ["cadera",        "Cadera"],
    ["brazoDerecho",  "Brazo der."],
    ["brazoIzquierdo","Brazo izq."],
    ["musloDerecho",  "Muslo der."],
    ["musloIzquierdo","Muslo izq."],
    ["pantorrilla",   "Pantorrilla"],
  ];
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>Medidas corporales</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Registra tu punto de partida. Las medidas opcionales están en centímetros.
      </p>

      <div style={S.row2}>
        <Field label="Peso actual (kg) *" error={errors.peso}>
          <Inp type="number" placeholder="ej. 75.5" value={form.peso} onChange={e => set("peso", e.target.value)} />
        </Field>
        <div />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {medidas.map(([field, label]) => (
          <div key={field}>
            <label style={{ ...S.label, fontSize: 11 }}>{label}</label>
            <input type="number" placeholder="cm" value={form[field]}
              onChange={e => set(field, e.target.value)}
              style={{ ...S.inp, padding: "9px 10px", fontSize: 13 }} />
          </div>
        ))}
      </div>

      <div style={{ padding: 16, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 12 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={form.aceptaTerminos} onChange={e => set("aceptaTerminos", e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Acepto los <strong style={{ color: "var(--accent)" }}>Términos y Condiciones</strong> del gimnasio
            y autorizo el uso de mis datos de salud con fines de entrenamiento y seguimiento interno.
          </span>
        </label>
        {errors.aceptaTerminos && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{errors.aceptaTerminos}</p>}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CompleteProfile() {
  const navigate  = useNavigate();
  const [step,    setStep]   = useState(1);
  const [form,    setForm]   = useState(INITIAL);
  const [errors,  setErrors] = useState({});
  const [saving,  setSaving] = useState(false);
  const [done,    setDone]   = useState(false);

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.sexo)                        e.sexo = "Requerido";
      if (!form.fechaNacimiento)             e.fechaNacimiento = "Requerida";
      if (!form.estatura)                    e.estatura = "Requerida";
      if (!form.contactoEmergenciaNombre)    e.contactoEmergenciaNombre = "Requerido";
      if (!form.contactoEmergenciaTelefono)  e.contactoEmergenciaTelefono = "Requerido";
    }
    if (step === 3) {
      if (!form.objetivo)         e.objetivo = "Selecciona tu objetivo";
      if (!form.nivelExperiencia) e.nivelExperiencia = "Selecciona tu nivel";
      if (!form.nivelActividad)   e.nivelActividad = "Selecciona tu actividad";
    }
    if (step === 4) {
      if (!form.peso)           e.peso = "Requerido";
      if (!form.aceptaTerminos) e.aceptaTerminos = "Debes aceptar los términos";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...user,
        perfil_completo: true,
        peso_inicial: parseFloat(form.peso),
      }));

      setDone(true);
      setTimeout(() => navigate("/user/dashboard"), 2200);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div style={{ ...S.page, justifyContent: "center", gap: 24 }}>
        <motion.div initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ textAlign: "center" }}>
          <div style={{ fontSize: 72, marginBottom: 16, color: "var(--accent)", display: "flex", justifyContent: "center" }}><FiCheckCircle /></div>
          <h2 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            ¡Perfil completado!
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Redirigiendo a tu dashboard…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 680, marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
          Bienvenido a <span style={{ color: "var(--accent)" }}>GYM PRO</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Completa tu perfil para personalizar tu experiencia
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", width: "100%", maxWidth: 680, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: step > s.id ? "var(--success)" : step === s.id ? "var(--accent)" : "var(--bg-input)",
                border: `2px solid ${step > s.id ? "var(--success)" : step === s.id ? "var(--accent)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: step >= s.id ? "#fff" : "var(--text-secondary)",
                fontSize: 16, transition: "all .3s",
              }}>
                {step > s.id ? <FiCheckCircle size={18} /> : s.icon}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: step === s.id ? "var(--accent)" : "var(--text-secondary)" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: step > s.id ? "var(--success)" : "var(--border)",
                margin: "0 8px", marginBottom: 20, transition: "background .3s",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <motion.div style={S.card} key={step}
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: .25 }}>

        {step === 1 && <Step1 form={form} set={set} errors={errors} />}
        {step === 2 && <Step2 form={form} set={set} errors={errors} />}
        {step === 3 && <Step3 form={form} set={set} errors={errors} />}
        {step === 4 && <Step4 form={form} set={set} errors={errors} />}

        {errors._global && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, color: "#f87171", fontSize: 13, display: "flex", gap: 8 }}>
            <FiAlertTriangle /> {errors._global}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          {step > 1 ? (
            <button onClick={back} style={{ ...S.optBtn(false), padding: "12px 24px", display: "flex", alignItems: "center", gap: 8 }}>
              <FiArrowLeft /> Anterior
            </button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={next} style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "#fff",
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Siguiente <FiArrowRight />
            </button>
          ) : (
            <button onClick={submit} disabled={saving} style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: saving ? "var(--bg-input)" : "var(--accent)",
              color: saving ? "var(--text-secondary)" : "#fff",
              fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {saving ? "Guardando…" : <><FiCheckCircle /> Completar perfil</>}
            </button>
          )}
        </div>
      </motion.div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        Paso {step} de 4 — Puedes actualizar esta información en tu perfil en cualquier momento
      </p>
    </div>
  );
}
