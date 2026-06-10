/**
 * TrainerRoutines.jsx — Biblioteca de rutinas + biblioteca de ejercicios.
 *
 * Tabs:
 *   1. Rutinas — gestión de rutinas (con soporte de imágenes por ejercicio).
 *   2. Ejercicios — catálogo propio del gimnasio (asignable a rutinas).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFileText, FiPlus, FiEdit, FiTrash2, FiCopy, FiSearch, FiX, FiFilter,
  FiAlertCircle, FiSave, FiChevronDown, FiChevronUp, FiLoader, FiImage,
  FiBookOpen, FiCheckSquare, FiCheck, FiCheckCircle, FiVideo, FiEye, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { GiMuscleUp, GiWeightLiftingUp, GiRunningShoe } from "react-icons/gi";
import { MdOutlineSmartToy } from "react-icons/md";
import trainerService from "../../services/entrenador/trainerService";
import { useToast } from "../../hooks/useToast";
import "../../css/CSSUnificado.css";

/* ── Constantes ── */
const CATEGORY_ICONS = {
  Fuerza:      <GiWeightLiftingUp />,
  Hipertrofia: <GiMuscleUp />,
  Cardio:      <GiRunningShoe />,
  Funcional:   <GiMuscleUp />,
  Movilidad:   <GiRunningShoe />,
};
const CATEGORIES      = ["Fuerza", "Hipertrofia", "Cardio", "Funcional", "Movilidad"];
const ROUTINES_PER_PAGE = 9;
const EX_PER_PAGE       = 12;
const DIFFICULTIES = ["Principiante", "Intermedio", "Avanzado"];
const DIAS_SEMANA  = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const GRUPOS_MUSCULARES = [
  "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
  "Abdomen", "Glúteos", "Cuádriceps", "Isquiotibiales",
  "Pantorrillas", "Cuerpo completo", "Cardio",
];
const TIPOS_EJERCICIO = ["Fuerza", "Cardio", "Flexibilidad", "Funcional", "Potencia"];

const getDifficultyColor = (d) => {
  if (d === "Principiante") return "var(--success)";
  if (d === "Avanzado")     return "var(--danger)";
  return "var(--warning)";
};

const emptyRoutine = () => ({
  name: "", category: "Fuerza", difficulty: "Intermedio",
  duration_minutes: 60, description: "", days: [],
});

const emptyDay = () => ({
  day: "Lunes", muscleGroup: "",
  exercises: [{ name: "", sets: "3", reps: "12", peso: "", notes: "", imagenes: [] }],
});

/* ── Caché de blob-URLs de video (vive mientras la pestaña esté abierta) ── */
const videoCache = new Map(); // cacheKey → blobURL

/**
 * Convierte un data-URL base64 de video en un blob-URL con caché.
 * La clave combina exerciseId + sufijo del b64 para evitar colisiones.
 */
function getVideoBlobUrl(b64, exerciseId) {
  if (!b64) return null;
  const cacheKey = (exerciseId ?? "new") + "_" + b64.slice(-24);
  if (videoCache.has(cacheKey)) return videoCache.get(cacheKey);
  const [header, data] = b64.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "video/webm";
  const binary = atob(data);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  videoCache.set(cacheKey, url);
  return url;
}

/**
 * Re-encoda el video a menor resolución (≤480p) y bitrate (400 kbps)
 * usando Canvas + MediaRecorder nativo. Sin dependencias externas.
 * Rechaza si la duración supera 30 segundos.
 */
async function processVideo(file) {
  return new Promise((resolve, reject) => {
    const url   = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted   = true;
    probe.src     = url;

    probe.onloadedmetadata = () => {
      const dur = probe.duration;
      if (!isFinite(dur) || dur > 30) { //15
        URL.revokeObjectURL(url);
        reject(new Error(`Duración máxima: 30 s. Tu video dura ${Math.round(dur)} s.`));
        return;
      }

      // Canvas con resolución reducida
      const canvas = document.createElement("canvas");
      const ratio  = Math.min(480 / (probe.videoWidth || 480), 1);
      canvas.width  = Math.round((probe.videoWidth  || 480) * ratio);
      canvas.height = Math.round((probe.videoHeight || 270) * ratio);
      const ctx = canvas.getContext("2d");

      // Seleccionar codec disponible
      const mimeType =
        MediaRecorder.isTypeSupported("video/webm;codecs=vp8")  ? "video/webm;codecs=vp8"  :
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9")  ? "video/webm;codecs=vp9"  :
        MediaRecorder.isTypeSupported("video/mp4")              ? "video/mp4"               :
        "video/webm";

      const recorder = new MediaRecorder(canvas.captureStream(20), {
        mimeType,
        videoBitsPerSecond: 800_000, // 800 kbps → ~3 MB para 30 s
      });

      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob   = new Blob(chunks, { type: mimeType });
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Error al leer el video comprimido"));
        reader.readAsDataURL(blob);
      };

      let raf;
      const drawFrame = () => {
        if (probe.ended || probe.paused) {
          cancelAnimationFrame(raf);
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        raf = requestAnimationFrame(drawFrame);
      };

      recorder.start(100);
      probe.currentTime = 0;
      probe.play()
        .then(() => {
          drawFrame();
          probe.onended = () => {
            cancelAnimationFrame(raf);
            if (recorder.state !== "inactive") recorder.stop();
          };
        })
        .catch(err => {
          URL.revokeObjectURL(url);
          reject(new Error("No se pudo reproducir el video para comprimirlo: " + err.message));
        });
    };

    probe.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar el video"));
    };
  });
}

/* ── Compresión de imagen vía canvas ── */
async function compressImage(file, maxW = 600, maxH = 400, quality = 0.75) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img    = new Image();
    const url    = URL.createObjectURL(file);
    img.onload = () => {
      const ratio   = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Cargador de imágenes (3 slots)
════════════════════════════════════════════ */
function ImageSlots({ images = [], onChange }) {
  const inputRefs = [useRef(), useRef(), useRef()];

  const handleFile = async (slotIdx, file) => {
    if (!file) return;
    const b64 = await compressImage(file);
    const next = [...images];
    next[slotIdx] = b64;
    onChange(next.filter(Boolean).slice(0, 3));
  };

  const removeImage = (slotIdx) => {
    const next = [...images];
    next.splice(slotIdx, 1);
    onChange(next.filter(Boolean));
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
      <span style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0 }}>
        <FiImage size={11} style={{ marginRight: 3 }} />Cómo hacerlo:
      </span>
      {[0, 1, 2].map(i => {
        const src = images[i];
        return (
          <div key={i} style={{ position: "relative" }}>
            <div
              onClick={() => !src && inputRefs[i].current?.click()}
              style={{
                width: 44, height: 44, borderRadius: 6,
                border: `1px dashed ${src ? "transparent" : "var(--border)"}`,
                background: src ? "transparent" : "var(--bg-input)",
                overflow: "hidden",
                cursor: src ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "border-color 0.15s",
              }}
            >
              {src
                ? <img src={src} alt={`img${i}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <FiPlus size={13} style={{ color: "var(--text-tertiary)" }} />
              }
            </div>
            {src && (
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute", top: -4, right: -4,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "var(--danger)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 9, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <FiX size={8} />
              </button>
            )}
            <input
              ref={inputRefs[i]}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={e => handleFile(i, e.target.files?.[0])}
            />
          </div>
        );
      })}

    </div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Slot de video (1 video, máx 30 s)
════════════════════════════════════════════ */
function VideoSlot({ video, onChange, exerciseId }) {
  const inputRef  = useRef();
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState("");
  const [err,        setErr]        = useState(null);

  const blobUrl = video ? getVideoBlobUrl(video, exerciseId) : null;

  const handleFile = async (file) => {
    if (!file) return;
    setErr(null);
    setProcessing(true);
    setProgress("Analizando duración…");
    try {
      setProgress("Comprimiendo video (puede tardar hasta 20 s)…");
      const b64 = await processVideo(file);
      onChange(b64);
      // pre-cachear el resultado
      getVideoBlobUrl(b64, exerciseId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setProcessing(false);
      setProgress("");
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
        display: "flex", alignItems: "center", gap: 5, marginBottom: 6,
      }}>
        <FiVideo size={11} /> Video demostrativo (máx. 30 s · se comprime automáticamente)
      </label>

      {blobUrl ? (
        <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
          <video
            src={blobUrl}
            controls
            muted
            playsInline
            preload="metadata"
            style={{
              width: "100%", maxWidth: 280, maxHeight: 160, borderRadius: 8,
              border: "1px solid var(--border)", background: "#000", display: "block",
            }}
          />
          <button
            onClick={() => onChange(null)}
            title="Quitar video"
            style={{
              position: "absolute", top: 4, right: 4,
              width: 20, height: 20, borderRadius: "50%",
              background: "var(--danger)", color: "#fff", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <FiX size={10} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !processing && inputRef.current?.click()}
          style={{
            padding: "12px 16px",
            border: `1px dashed ${err ? "var(--danger)" : "var(--border)"}`,
            borderRadius: 8, background: "var(--bg-input)",
            cursor: processing ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 10,
            color: "var(--text-secondary)", fontSize: 12, userSelect: "none",
          }}
        >
          {processing ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <FiLoader size={14} />
              </motion.div>
              <span>{progress}</span>
            </>
          ) : (
            <>
              <FiVideo size={14} style={{ flexShrink: 0 }} />
              {err
                ? <span style={{ color: "var(--danger)" }}>{err} — click para reintentar</span>
                : <span>Subir video (MP4 / WebM · máx. 30 s)</span>
              }
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files?.[0])}
      />

    </div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Picker de ejercicios desde biblioteca
════════════════════════════════════════════ */
function LibraryPicker({ exercises, onPick, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = exercises.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.grupo_muscular || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, maxHeight: "70vh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700 }}>Seleccionar de biblioteca</h4>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <FiX />
          </button>
        </div>

        <div className="input-dark-container with-icon" style={{ marginBottom: 12 }}>
          <FiSearch size={15} style={{ color: "var(--text-secondary)" }} />
          <input className="search-input" placeholder="Buscar ejercicio..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20, fontSize: 13 }}>
              Sin resultados
            </p>
          )}
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--bg-input)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                textAlign: "left", transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {ex.nombre}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                  {[ex.grupo_muscular, ex.tipo].filter(Boolean).join(" · ")}
                </div>
              </div>
              {ex.series && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {ex.series}×{ex.repeticiones || "—"}
                </span>
              )}
              <FiCheck size={13} style={{ color: "var(--accent)", opacity: 0.7 }} />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Formulario de ejercicio (biblioteca)
════════════════════════════════════════════ */
function ExerciseFormModal({ initial, onSave, onClose, saving, exerciseId }) {
  const [form, setForm] = useState(initial || {
    nombre: "", descripcion: "", grupo_muscular: "", tipo: "",
    series: "", repeticiones: "", imagenes: [], video: null,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const label = { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: 28, width: "100%", maxWidth: 500,
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700 }}>
            {initial ? "Editar ejercicio" : "Nuevo ejercicio"}
          </h4>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
            <FiX />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={label}>Nombre *</label>
            <input className="input-compact" value={form.nombre}
              onChange={e => set("nombre", e.target.value)} placeholder="Ej: Press de banca" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Grupo muscular</label>
              <select className="input-compact" value={form.grupo_muscular}
                onChange={e => set("grupo_muscular", e.target.value)}>
                <option value="">Seleccionar...</option>
                {GRUPOS_MUSCULARES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Tipo</label>
              <select className="input-compact" value={form.tipo}
                onChange={e => set("tipo", e.target.value)}>
                <option value="">Seleccionar...</option>
                {TIPOS_EJERCICIO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Series</label>
              <input className="input-compact" type="number" min={1}
                value={form.series} onChange={e => set("series", e.target.value)}
                placeholder="3" />
            </div>
            <div>
              <label style={label}>Repeticiones</label>
              <input className="input-compact" value={form.repeticiones}
                onChange={e => set("repeticiones", e.target.value)}
                placeholder="10-12 o al fallo" />
            </div>
          </div>

          <div>
            <label style={label}>Descripción / instrucciones</label>
            <textarea className="input-compact" rows={3} style={{ resize: "vertical" }}
              value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              placeholder="Cómo ejecutar correctamente el ejercicio..." />
          </div>

          {/* ── Media: imágenes + video ── */}
          <div style={{
            borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 4,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
              Material audiovisual
            </p>

            <label style={label}>
              Imágenes de ejecución (máx. 3)
            </label>
            <ImageSlots
              images={form.imagenes || []}
              onChange={imgs => set("imagenes", imgs)}
            />

            <VideoSlot
              video={form.video}
              onChange={v => set("video", v)}
              exerciseId={exerciseId}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: 10 }}>
            Cancelar
          </button>
          <button onClick={() => onSave(form)} className="btn-compact-primary"
            style={{ flex: 2, padding: 10, opacity: saving ? 0.7 : 1 }} disabled={saving}>
            <FiSave size={14} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Paginación
════════════════════════════════════════════ */
function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  // Ventana de páginas visibles: primera, última, actual ± 2
  const pages = [...new Set([
    1,
    ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => Math.max(1, Math.min(totalPages, page - 2 + i))),
    totalPages,
  ])].sort((a, b) => a - b);

  const btnBase = {
    width: 32, height: 32, borderRadius: 7, border: "1px solid var(--border)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, transition: "all 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 18 }}>
      <button
        onClick={() => onPage(page - 1)} disabled={page === 1}
        style={{ ...btnBase, background: page === 1 ? "var(--bg-input)" : "var(--bg-card)",
          color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)", opacity: page === 1 ? 0.4 : 1 }}>
        <FiChevronLeft size={14} />
      </button>

      {pages.map((p, idx) => {
        const gap = idx > 0 && p - pages[idx - 1] > 1;
        return (
          <span key={p} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {gap && <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>…</span>}
            <button
              onClick={() => onPage(p)}
              style={{
                ...btnBase,
                background: p === page ? "var(--accent)" : "var(--bg-input)",
                color:      p === page ? "#fff"          : "var(--text-secondary)",
                borderColor: p === page ? "var(--accent)" : "var(--border)",
                fontWeight: p === page ? 700 : 400,
              }}>
              {p}
            </button>
          </span>
        );
      })}

      <button
        onClick={() => onPage(page + 1)} disabled={page === totalPages}
        style={{ ...btnBase, background: page === totalPages ? "var(--bg-input)" : "var(--bg-card)",
          color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
          opacity: page === totalPages ? 0.4 : 1 }}>
        <FiChevronRight size={14} />
      </button>

      <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 6 }}>
        {page}/{totalPages}
      </span>

    </div>
  );
}

/* ════════════════════════════════════════════
   SUBCOMPONENTE: Vista detalle de ejercicio
════════════════════════════════════════════ */
function ExerciseDetailModal({ exercise, onClose, onEdit }) {
  const [imgIdx, setImgIdx] = useState(0);
  const blobUrl = exercise.video ? getVideoBlobUrl(exercise.video, exercise.id) : null;
  const imgs    = exercise.imagenes || [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 10100,
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 18 }}
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 18, width: "100%", maxWidth: 560,
          maxHeight: "92vh", overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{exercise.nombre}</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {exercise.grupo_muscular && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--accent)22", color: "var(--accent)" }}>
                  {exercise.grupo_muscular}
                </span>
              )}
              {exercise.tipo && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                  {exercise.tipo}
                </span>
              )}
              {exercise.series && (
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "var(--success)22", color: "var(--success)" }}>
                  {exercise.series} × {exercise.repeticiones || "—"}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--text-secondary)", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <FiX size={20} />
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Galería de imágenes */}
          {imgs.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                Cómo ejecutarlo
              </p>
              {/* Imagen principal */}
              <div style={{
                width: "100%", aspectRatio: "16/9", borderRadius: 10, overflow: "hidden",
                background: "var(--bg-input)", border: "1px solid var(--border)",
                marginBottom: 8, position: "relative",
              }}>
                <img src={imgs[imgIdx]} alt={`paso ${imgIdx + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                {imgs.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                      style={{
                        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 6,
                        color: "#fff", cursor: "pointer", padding: "6px 8px", lineHeight: 0,
                      }}><FiChevronLeft size={16} /></button>
                    <button
                      onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                      style={{
                        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.55)", border: "none", borderRadius: 6,
                        color: "#fff", cursor: "pointer", padding: "6px 8px", lineHeight: 0,
                      }}><FiChevronRight size={16} /></button>
                  </>
                )}
                {/* Indicador de posición */}
                {imgs.length > 1 && (
                  <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                    display: "flex", gap: 4 }}>
                    {imgs.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        style={{
                          width: i === imgIdx ? 18 : 6, height: 6, borderRadius: 3,
                          background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)",
                          border: "none", cursor: "pointer", padding: 0,
                          transition: "all 0.2s",
                        }} />
                    ))}
                  </div>
                )}
              </div>
              {/* Miniaturas */}
              {imgs.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {imgs.map((src, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      style={{
                        padding: 0, border: `2px solid ${i === imgIdx ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 7, overflow: "hidden", cursor: "pointer",
                        width: 64, height: 48, flexShrink: 0, transition: "border-color 0.15s",
                      }}>
                      <img src={src} alt={`min ${i+1}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {blobUrl && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>
                Video demostrativo
              </p>
              <video
                src={blobUrl} controls playsInline preload="metadata"
                style={{
                  width: "100%", borderRadius: 10,
                  border: "1px solid var(--border)", background: "#000",
                  maxHeight: 280, display: "block",
                }}
              />
            </div>
          )}

          {/* Descripción */}
          {exercise.descripcion && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
                Instrucciones
              </p>
              <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.65,
                background: "var(--bg-input)", padding: "12px 14px", borderRadius: 8,
                border: "1px solid var(--border)" }}>
                {exercise.descripcion}
              </p>
            </div>
          )}

          {/* Sin media */}
          {imgs.length === 0 && !blobUrl && !exercise.descripcion && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-secondary)" }}>
              <FiImage size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>Sin imágenes, video ni descripción añadidos.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          display: "flex", gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} className="btn-outline-small" style={{ flex: 1, padding: "9px 0" }}>
            Cerrar
          </button>
          <button onClick={onEdit} className="btn-compact-primary" style={{ flex: 2, padding: "9px 0" }}>
            <FiEdit size={14} /> Editar ejercicio
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════ */
// ═══════════════════════════════════════════════════════════════
//  ImportarIARoutinesTab — ETL con Ollama para rutinas y ejercicios
// ═══════════════════════════════════════════════════════════════
function ImportarIARoutinesTab({ clients, onImportDone, onSaveRoutine, onSaveExercise }) {
  const [mode, setMode]           = useState("trainer"); // "trainer" | "client"
  const [file, setFile]           = useState(null);
  const [clientId, setClientId]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [preview, setPreview]     = useState(null);   // { rutinas[], ejercicios[], resumen }
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(null);   // { rutinas, ejercicios }
  const [drag, setDrag]           = useState(false);
  const [aiStatus, setAiStatus]   = useState(null);
  const [selRoutines, setSelRoutines] = useState({});  // idx → bool
  const [selExercises, setSelExercises] = useState({}); // idx → bool
  const [expandedR, setExpandedR] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    trainerService.getRoutineAIStatus()
      .then(s => setAiStatus(s))
      .catch(() => setAiStatus({ disponible: false, modelo_activo: false, modelo: "phi3:mini" }));
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "xlsx", "xls"].includes(ext)) { setError("Solo se aceptan PDF o Excel (.xlsx, .xls)"); return; }
    setFile(f); setPreview(null); setError(null); setSaved(null);
    setSelRoutines({}); setSelExercises({});
  };
  const handleDrop = (e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true); setError(null); setPreview(null);
    try {
      const data = await trainerService.importRoutinesAI(file);
      setPreview(data);
      // Pre-seleccionar todo
      const sr = {}; (data.rutinas || []).forEach((_, i) => sr[i] = true);
      const se = {}; (data.ejercicios || []).forEach((_, i) => se[i] = true);
      setSelRoutines(sr); setSelExercises(se);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true); setError(null);
    let rutinasOk = 0, ejerciciosOk = 0;
    for (const [i, rutina] of (preview.rutinas || []).entries()) {
      if (!selRoutines[i]) continue;
      const payload = { ...rutina, id_miembro: mode === "client" && clientId ? clientId : undefined };
      const ok = await onSaveRoutine(payload);
      if (ok) rutinasOk++;
    }
    for (const [i, ej] of (preview.ejercicios || []).entries()) {
      if (!selExercises[i]) continue;
      const ok = await onSaveExercise(ej);
      if (ok) ejerciciosOk++;
    }
    setSaving(false);
    setSaved({ rutinas: rutinasOk, ejercicios: ejerciciosOk });
    onImportDone?.();
  };

  const reset = () => { setFile(null); setPreview(null); setError(null); setSaved(null); setClientId(""); };

  const aiOk = aiStatus?.disponible && aiStatus?.modelo_activo;

  if (saved) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ marginBottom: 16 }}>
        <FiCheckCircle size={56} style={{ color: "var(--success)" }} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Importación completada</h3>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        {saved.rutinas > 0 && <><strong>{saved.rutinas}</strong> rutina{saved.rutinas !== 1 ? "s" : ""} creada{saved.rutinas !== 1 ? "s" : ""}<br /></>}
        {saved.ejercicios > 0 && <><strong>{saved.ejercicios}</strong> ejercicio{saved.ejercicios !== 1 ? "s" : ""} agregado{saved.ejercicios !== 1 ? "s" : ""} a la biblioteca</>}
      </p>
      <button className="btn-compact-primary" onClick={reset}><FiPlus size={13} /> Importar más</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 780 }}>

      {/* ── Estado Ollama ─────────────────────────────────────────────────── */}
      {aiStatus && (
        <div style={{
          background: aiOk ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)",
          border: `1px solid ${aiOk ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.25)"}`,
          borderRadius: 10, padding: "10px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10, fontSize: 12,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: aiOk ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
          {aiOk ? (
            <span><strong style={{ color: "var(--success)" }}>Ollama listo</strong> — modelo <code style={{ background: "rgba(0,0,0,.1)", padding: "1px 5px", borderRadius: 4 }}>{aiStatus.modelo}</code> activo</span>
          ) : aiStatus.disponible ? (
            <span><strong style={{ color: "var(--danger)" }}>Modelo no descargado</strong> — ejecuta: <code style={{ background: "rgba(0,0,0,.1)", padding: "1px 5px", borderRadius: 4 }}>docker compose exec ollama ollama pull {aiStatus.modelo}</code></span>
          ) : (
            <span><strong style={{ color: "var(--danger)" }}>Ollama no disponible</strong> — <code style={{ background: "rgba(0,0,0,.1)", padding: "1px 5px", borderRadius: 4 }}>docker compose up -d ollama</code></span>
          )}
        </div>
      )}

      {/* ── Selector de modo ─────────────────────────────────────────────── */}
      {!preview && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { key: "trainer", label: "Mis rutinas",         desc: "Migra tu biblioteca desde otro sistema" },
            { key: "client",  label: "Historial de cliente", desc: "El cliente viene de otro gym con su programa" },
          ].map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              flex: 1, padding: "14px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left",
              background: mode === m.key ? "rgba(99,102,241,.1)" : "var(--bg-card)",
              border: `2px solid ${mode === m.key ? "var(--accent)" : "var(--border)"}`,
              transition: "all .15s",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3, color: mode === m.key ? "var(--accent)" : "var(--text-primary)" }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{m.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── Selector de cliente (modo cliente) ───────────────────────────── */}
      {!preview && mode === "client" && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 5 }}>
            Cliente
          </label>
          <select className="input-compact" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">Selecciona un cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* ── Info ─────────────────────────────────────────────────────────── */}
      {!preview && (
        <div style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <MdOutlineSmartToy size={18} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-primary)" }}>ETL con IA local (Ollama)</strong><br />
            Sube el {mode === "trainer" ? "archivo de rutinas" : "historial de entrenamiento del cliente"} en PDF o Excel.
            El modelo extraerá automáticamente las rutinas, días de entrenamiento, ejercicios, series y repeticiones
            — sin enviar datos a servidores externos.
          </div>
        </div>
      )}

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      {!preview && (
        <div
          style={{ border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: "36px 24px", textAlign: "center", background: drag ? "rgba(99,102,241,.05)" : "var(--bg-card)", cursor: "pointer", transition: "all .2s", marginBottom: 16 }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <FiBookOpen size={32} style={{ color: "var(--text-secondary)", marginBottom: 12, opacity: .5 }} />
          {file ? (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{(file.size / 1024).toFixed(0)} KB — clic para cambiar</div>
            </div>
          ) : (
            <><div style={{ fontWeight: 600, marginBottom: 6 }}>Arrastra tu archivo aquí</div><div style={{ fontSize: 12, color: "var(--text-secondary)" }}>PDF o Excel (.xlsx / .xls)</div></>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* ── Botón procesar ───────────────────────────────────────────────── */}
      {!preview && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button className="btn-compact-primary" onClick={handleProcess}
            disabled={!file || loading || !aiOk}
            title={!aiOk ? "Ollama no disponible" : ""}
          >
            {loading
              ? <><FiLoader size={13} style={{ animation: "spin 1s linear infinite" }} /> Procesando...</>
              : <><MdOutlineSmartToy size={14} /> Extraer con IA</>}
          </button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, color: "var(--danger)", fontSize: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><div>{error}</div>
        </div>
      )}

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      {preview && (
        <>
          {/* Resumen */}
          <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <FiCheck size={16} style={{ color: "var(--success)", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>IA extrajo el contenido correctamente</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {preview.resumen?.total_rutinas} rutina{preview.resumen?.total_rutinas !== 1 ? "s" : ""} ·{" "}
                {preview.resumen?.total_dias} día{preview.resumen?.total_dias !== 1 ? "s" : ""} de entrenamiento ·{" "}
                {preview.resumen?.total_ejercicios} ejercicio{preview.resumen?.total_ejercicios !== 1 ? "s" : ""} para biblioteca
              </div>
            </div>
          </div>

          {/* Rutinas extraídas */}
          {(preview.rutinas || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox"
                  checked={Object.values(selRoutines).every(Boolean) && preview.rutinas.length > 0}
                  onChange={e => { const s = {}; preview.rutinas.forEach((_, i) => s[i] = e.target.checked); setSelRoutines(s); }}
                  style={{ cursor: "pointer" }}
                />
                Rutinas ({preview.rutinas.length})
              </div>
              {preview.rutinas.map((r, ri) => (
                <div key={ri} style={{ border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-input)", cursor: "pointer" }}
                    onClick={() => setExpandedR(p => ({ ...p, [ri]: !p[ri] }))}>
                    <input type="checkbox" checked={!!selRoutines[ri]} onClick={e => e.stopPropagation()}
                      onChange={e => setSelRoutines(p => ({ ...p, [ri]: e.target.checked }))} style={{ cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {r.category} · {r.difficulty} · {r.days?.length || 0} día{r.days?.length !== 1 ? "s" : ""} · {r.duration_minutes} min
                      </div>
                    </div>
                    {expandedR[ri] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </div>
                  {expandedR[ri] && (
                    <div style={{ padding: "10px 14px" }}>
                      {(r.days || []).map((d, di) => (
                        <div key={di} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                            {d.day} — {d.muscleGroup}
                          </div>
                          {(d.exercises || []).map((ex, ei) => (
                            <div key={ei} style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: 12, marginBottom: 2 }}>
                              • {ex.name} · {ex.sets} × {ex.reps}{ex.peso ? ` · ${ex.peso}` : ""}{ex.notes ? ` — ${ex.notes}` : ""}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Ejercicios para biblioteca */}
          {(preview.ejercicios || []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox"
                  checked={Object.values(selExercises).every(Boolean) && preview.ejercicios.length > 0}
                  onChange={e => { const s = {}; preview.ejercicios.forEach((_, i) => s[i] = e.target.checked); setSelExercises(s); }}
                  style={{ cursor: "pointer" }}
                />
                Agregar a biblioteca de ejercicios ({preview.ejercicios.length})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {preview.ejercicios.map((ej, ei) => (
                  <div key={ei} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: "var(--bg-input)", borderRadius: 8, border: `1px solid ${selExercises[ei] ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", transition: "border-color .15s" }}
                    onClick={() => setSelExercises(p => ({ ...p, [ei]: !p[ei] }))}>
                    <input type="checkbox" checked={!!selExercises[ei]} readOnly style={{ cursor: "pointer", marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{ej.nombre}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                        {[ej.grupo_muscular, ej.tipo, ej.series && `${ej.series}×${ej.repeticiones}`].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn-outline-small" onClick={reset}><FiX size={12} /> Descartar</button>
            <button className="btn-compact-primary" onClick={handleSave} disabled={saving ||
              (Object.values(selRoutines).every(v => !v) && Object.values(selExercises).every(v => !v))}>
              <FiSave size={13} />{saving ? "Guardando..." : "Confirmar e importar"}
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

export default function TrainerRoutines() {
  const { toast, confirm, ToastPortal } = useToast();

  /* ── Tab activo ── */
  const [tab, setTab] = useState("routines"); // "routines" | "exercises" | "import"

  /* ── Estado: rutinas ── */
  const [routines, setRoutines]             = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loadingR, setLoadingR]             = useState(true);
  const [errorR, setErrorR]                 = useState(null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [formData, setFormData]             = useState(emptyRoutine());
  const [expandedDay, setExpandedDay]       = useState(0);
  const [showLibraryPicker, setShowLibraryPicker] = useState(null); // {di, ei} | null

  /* ── Clientes (para importación IA) ── */
  const [clients, setClients]               = useState([]);

  /* ── Paginación ── */
  const [routinesPage, setRoutinesPage]     = useState(1);
  const [exPage, setExPage]                 = useState(1);

  /* ── Estado: ejercicios ── */
  const [exercises, setExercises]           = useState([]);
  const [loadingE, setLoadingE]             = useState(false);
  const [errorE, setErrorE]                 = useState(null);
  const [searchEx, setSearchEx]             = useState("");
  const [showExForm, setShowExForm]         = useState(false);
  const [editingEx, setEditingEx]           = useState(null);
  const [savingEx, setSavingEx]             = useState(false);
  const [viewingEx, setViewingEx]           = useState(null); // ejercicio en detalle
  const [selectedEx, setSelectedEx]         = useState(() => new Set()); // selección para borrado masivo

  /* ── Cargar rutinas ── */
  const loadRoutines = useCallback(async () => {
    try {
      setLoadingR(true); setErrorR(null);
      setRoutinesPage(1); // resetear al buscar/filtrar
      const data = await trainerService.getRoutines({ category: filterCategory, search: searchTerm });
      setRoutines(data.routines || []);
      setCategoryCounts(data.categoryCounts || {});
    } catch (err) {
      setErrorR(err.message);
      toast.error("Error al cargar", err.message);
    } finally {
      setLoadingR(false);
    }
  }, [filterCategory, searchTerm]);

  useEffect(() => {
    const t = setTimeout(loadRoutines, 300);
    return () => clearTimeout(t);
  }, [loadRoutines]);

  /* ── Cargar ejercicios ── */
  const loadExercises = useCallback(async () => {
    try {
      setLoadingE(true); setErrorE(null);
      setExPage(1); // resetear al buscar
      const data = await trainerService.getExercises({ search: searchEx });
      setExercises(data.exercises || []);
      setSelectedEx(new Set()); // limpiar selección al recargar
    } catch (err) {
      setErrorE(err.message);
    } finally {
      setLoadingE(false);
    }
  }, [searchEx]);

  useEffect(() => {
    if (tab === "exercises") {
      const t = setTimeout(loadExercises, 300);
      return () => clearTimeout(t);
    }
  }, [loadExercises, tab]);

  // Pre-fetch exercises for library picker even on routines tab
  useEffect(() => { loadExercises(); }, []);

  // Cargar clientes para importación IA (una sola vez)
  useEffect(() => {
    trainerService.getClients()
      .then(data => {
        const list = data.clients || data || [];
        setClients(list.map(c => ({ id: c.id || c.id_usuario_pg, name: c.name || c.nombre })));
      })
      .catch(() => setClients([]));
  }, []);

  /* ── Acciones rutinas ── */
  const handleDuplicate = async (e, id, name) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await trainerService.duplicateRoutine(id);
      toast.success("Rutina duplicada", `"${name}" fue copiada.`);
      await loadRoutines();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "¿Eliminar rutina?",
      message: `"${name}" se eliminará permanentemente.`,
      type: "danger", confirmText: "Eliminar", cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      await trainerService.deleteRoutine(id);
      setSelectedRoutine(null);
      toast.success("Rutina eliminada", `"${name}" eliminada correctamente.`);
      await loadRoutines();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  const openCreate = () => {
    setFormData(emptyRoutine());
    setEditingId(null);
    setExpandedDay(0);
    setShowForm(true);
  };

  const openEdit = async (e, routine) => {
    e && e.stopPropagation();
    setEditingId(routine.id);
    setFormData({
      name: routine.name, category: routine.category,
      difficulty: routine.difficulty,
      duration_minutes: parseInt(routine.duration) || 60,
      description: routine.description, days: [],
    });
    setShowForm(true);
    try {
      const detail = await trainerService.getRoutineDetail(routine.id);
      if (detail?.days) {
        setFormData(f => ({ ...f, days: detail.days }));
      }
    } catch (err) {
      console.error("No se pudo cargar el detalle de la rutina:", err);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.warning("Campo requerido", "El nombre es obligatorio."); return;
    }
    const missingEx = formData.days.some(d => d.exercises.some(ex => !ex.name.trim()));
    if (missingEx) {
      toast.warning("Ejercicio sin nombre", "Selecciona un ejercicio de la biblioteca en cada fila."); return;
    }
    try {
      setActionLoading(true);
      if (editingId) {
        await trainerService.updateRoutine(editingId, formData);
        toast.success("Rutina actualizada", `"${formData.name}" guardada.`);
      } else {
        await trainerService.createRoutine(formData);
        toast.success("Rutina creada", `"${formData.name}" añadida.`);
      }
      setShowForm(false);
      await loadRoutines();
    } catch (err) {
      toast.error("Error al guardar", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Helpers días y ejercicios en formulario ── */
  const addDay = () => {
    setFormData(f => ({ ...f, days: [...f.days, emptyDay()] }));
    setExpandedDay(formData.days.length);
  };

  const removeDay = (di) => setFormData(f => ({ ...f, days: f.days.filter((_, i) => i !== di) }));

  const updateDay = (di, field, val) => setFormData(f => {
    const days = [...f.days];
    days[di] = { ...days[di], [field]: val };
    return { ...f, days };
  });

  const addExercise = (di) => setFormData(f => {
    const days = [...f.days];
    days[di] = {
      ...days[di],
      exercises: [...days[di].exercises,
        { name: "", sets: "3", reps: "12", peso: "", notes: "", imagenes: [] }],
    };
    return { ...f, days };
  });

  const removeExercise = (di, ei) => setFormData(f => {
    const days = [...f.days];
    days[di] = { ...days[di], exercises: days[di].exercises.filter((_, i) => i !== ei) };
    return { ...f, days };
  });

  const updateExercise = (di, ei, field, val) => setFormData(f => {
    const days = [...f.days];
    const exs  = [...days[di].exercises];
    exs[ei] = { ...exs[ei], [field]: val };
    days[di] = { ...days[di], exercises: exs };
    return { ...f, days };
  });

  /* Añadir desde biblioteca */
  const pickFromLibrary = (di, ei) => setShowLibraryPicker({ di, ei });

  const handlePickExercise = (ex) => {
    const { di, ei } = showLibraryPicker;
    const current = formData.days[di].exercises[ei];
    updateExercise(di, ei, "name",  ex.nombre);
    if (ex.series)      updateExercise(di, ei, "sets", String(ex.series));
    if (ex.repeticiones) updateExercise(di, ei, "reps", ex.repeticiones);
    setShowLibraryPicker(null);
  };

  /* ── Acciones ejercicios ── */
  const handleSaveEx = async (form) => {
    if (!form.nombre.trim()) { toast.warning("Campo requerido", "El nombre es obligatorio."); return; }
    try {
      setSavingEx(true);
      if (editingEx) {
        await trainerService.updateExercise(editingEx.id, form);
        toast.success("Ejercicio actualizado", form.nombre);
      } else {
        await trainerService.createExercise(form);
        toast.success("Ejercicio creado", form.nombre);
      }
      setShowExForm(false);
      setEditingEx(null);
      await loadExercises();
    } catch (err) { toast.error("Error", err.message); }
    finally { setSavingEx(false); }
  };

  const handleDeleteEx = async (ex) => {
    const ok = await confirm({
      title: "¿Eliminar ejercicio?",
      message: `"${ex.nombre}" se eliminará de la biblioteca.`,
      type: "danger", confirmText: "Eliminar", cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      await trainerService.deleteExercise(ex.id);
      toast.success("Ejercicio eliminado", ex.nombre);
      await loadExercises();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  /* ── Selección múltiple de ejercicios ── */
  const toggleSelectEx = (id) => {
    setSelectedEx(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allExSelected = exercises.length > 0 && selectedEx.size === exercises.length;
  const toggleSelectAllEx = () => {
    setSelectedEx(allExSelected ? new Set() : new Set(exercises.map(e => e.id)));
  };
  const handleBulkDeleteEx = async () => {
    const ids = [...selectedEx];
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `¿Eliminar ${ids.length} ejercicio${ids.length !== 1 ? "s" : ""}?`,
      message: "Esta acción eliminará permanentemente los ejercicios seleccionados de la biblioteca.",
      type: "danger", confirmText: "Eliminar", cancelText: "Cancelar",
    });
    if (!ok) return;
    try {
      setActionLoading(true);
      const { ok: done, fail } = await trainerService.bulkDeleteExercises(ids);
      if (done) toast.success("Ejercicios eliminados", `${done} eliminado${done !== 1 ? "s" : ""}`);
      if (fail) toast.error("Algunos no se eliminaron", `${fail} fallaron`);
      await loadExercises();
    } catch (err) { toast.error("Error", err.message); }
    finally { setActionLoading(false); }
  };

  /* ── Animaciones ── */
  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* Header */}
      <motion.div className="welcome-section"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Rutinas y Ejercicios</h2>
            <p>Crea rutinas, gestiona tu biblioteca de ejercicios y asígnalos a tus clientes</p>
          </div>
          <FiFileText size={50} style={{ color: "var(--accent)", opacity: 0.8 }} />
        </div>
      </motion.div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 4, marginTop: 22, marginBottom: 20,
        borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {[
          { key: "routines",  icon: <FiFileText size={14} />,          label: "Rutinas" },
          { key: "exercises", icon: <FiBookOpen size={14} />,          label: "Ejercicios" },
          { key: "import",    icon: <MdOutlineSmartToy size={14} />,   label: "Importar IA" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              background: "none",
              color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 14, transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════ TAB: RUTINAS ════════════════════════ */}
      {tab === "routines" && (
        <>
          {/* KPIs */}
          <motion.div className="kpi-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 20 }}
            variants={cv} initial="hidden" animate="visible">
            <motion.div className="stat-card highlight-border" variants={iv}>
              <div className="stat-header"><h3>Total Rutinas</h3></div>
              <div className="stat-value highlight">{routines.length}</div>
              <div className="stat-detail">En tu biblioteca</div>
            </motion.div>
            <motion.div className="stat-card" variants={iv}>
              <div className="stat-header"><h3>Más Usada</h3></div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                {[...routines].sort((a, b) => b.clients - a.clients)[0]?.name || "—"}
              </div>
              <div className="stat-detail">
                {[...routines].sort((a, b) => b.clients - a.clients)[0]?.clients || 0} clientes
              </div>
            </motion.div>
            <motion.div className="stat-card" variants={iv}>
              <div className="stat-header"><h3>Última Act.</h3></div>
              <div className="stat-value" style={{ fontSize: 16 }}>{routines[0]?.lastUsed || "—"}</div>
              <div className="stat-detail">{routines[0]?.name || ""}</div>
            </motion.div>
          </motion.div>

          {/* Búsqueda + filtros */}
          <motion.div className="chart-card" style={{ marginBottom: 16 }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ display: "flex", gap: 15, alignItems: "center", flexWrap: "wrap" }}>
              <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 220 }}>
                <FiSearch size={18} style={{ color: "var(--text-secondary)" }} />
                <input type="text" className="search-input" placeholder="Buscar rutina…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm("")}><FiX /></button>
                )}
              </div>
              <motion.button className="btn-compact-primary" onClick={openCreate}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <FiPlus size={16} /> Nueva Rutina
              </motion.button>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
              <FiFilter size={15} style={{ color: "var(--text-secondary)" }} />
              {[{ value: "all", label: "Todas", count: routines.length },
                ...CATEGORIES.map(c => ({ value: c, label: c, count: categoryCounts[c] || 0 }))
              ].map(cat => (
                <motion.button key={cat.value} className="btn-outline-small"
                  onClick={() => setFilterCategory(cat.value)}
                  style={{
                    background: filterCategory === cat.value ? "var(--accent)" : "transparent",
                    color: filterCategory === cat.value ? "#fff" : "var(--text-secondary)",
                    borderColor: filterCategory === cat.value ? "var(--accent)" : "var(--border)",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  {cat.label}
                  <span style={{
                    background: filterCategory === cat.value ? "rgba(0,0,0,.2)" : "var(--bg-input)",
                    padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                  }}>
                    {cat.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Grid de rutinas */}
          <motion.div className="chart-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {loadingR ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <FiLoader size={30} />
                </motion.div>
                <p style={{ marginTop: 14 }}>Cargando rutinas…</p>
              </div>
            ) : (() => {
              const pagedRoutines = routines.slice((routinesPage - 1) * ROUTINES_PER_PAGE, routinesPage * ROUTINES_PER_PAGE);
              return (
                <>
                  <motion.div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}
                    variants={cv} initial="hidden" animate="visible">
                    {pagedRoutines.map(routine => (
                      <motion.div key={routine.id} variants={iv} className="member-card-hover"
                        style={{
                          background: "var(--bg-input)", border: "1px solid var(--border)",
                          borderRadius: 12, padding: 20,
                        }}
                        whileHover={{ scale: 1.01 }}>
                        {/* Header */}
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                          <div style={{
                            width: 46, height: 46, background: "var(--bg-card)", borderRadius: 10,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, color: "var(--accent)",
                          }}>
                            {CATEGORY_ICONS[routine.category] || <GiMuscleUp />}
                          </div>
                          <div>
                            <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{routine.name}</h4>
                            <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                              {routine.category} · {routine.duration}
                            </p>
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                          {routine.description || "Sin descripción"}
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                          {[
                            { label: "Ejercicios", value: routine.exercises, color: "var(--accent)" },
                            { label: "Clientes",   value: routine.clients,   color: "var(--success)" },
                          ].map(s => (
                            <div key={s.label} style={{ background: "var(--bg-card)", padding: 8, borderRadius: 8, textAlign: "center" }}>
                              <div style={{ color: "var(--text-secondary)", fontSize: 10, marginBottom: 3 }}>{s.label}</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          paddingTop: 12, borderTop: "1px solid var(--border)",
                        }}>
                          <span style={{
                            padding: "3px 9px",
                            background: `${getDifficultyColor(routine.difficulty)}20`,
                            color: getDifficultyColor(routine.difficulty),
                            borderRadius: 6, fontSize: 11, fontWeight: 600,
                          }}>
                            {routine.difficulty}
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <motion.button className="icon-btn" style={{ padding: 6 }}
                              onClick={() => setSelectedRoutine(routine)} title="Ver detalle"
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiEye size={13} />
                            </motion.button>
                            <motion.button className="icon-btn" style={{ padding: 6 }}
                              onClick={e => openEdit(e, routine)} title="Editar"
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiEdit size={13} />
                            </motion.button>
                            <motion.button className="icon-btn" style={{ padding: 6 }}
                              onClick={e => handleDuplicate(e, routine.id, routine.name)} title="Duplicar"
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiCopy size={13} />
                            </motion.button>
                            <motion.button className="icon-btn danger" style={{ padding: 6 }}
                              onClick={e => handleDelete(e, routine.id, routine.name)} title="Eliminar"
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiTrash2 size={13} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                  <Pagination
                    page={routinesPage} total={routines.length}
                    perPage={ROUTINES_PER_PAGE} onPage={setRoutinesPage}
                  />
                </>
              );
            })()}

            {!loadingR && routines.length === 0 && (
              <div className="empty-state">
                <FiFileText size={44} style={{ opacity: 0.3, marginBottom: 14 }} />
                <h3>No se encontraron rutinas</h3>
                <p>Intenta ajustar los filtros o crea la primera</p>
                <motion.button className="btn-compact-primary" style={{ marginTop: 14 }} onClick={openCreate}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <FiPlus size={15} /> Crear primera rutina
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Modal detalle rutina */}
          <AnimatePresence>
            {selectedRoutine && (
              <motion.div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1000, padding: 20 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedRoutine(null)}>
                <motion.div
                  style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 700,
                    width: "100%", maxHeight: "90vh", overflow: "auto",
                    border: "1px solid var(--border)" }}
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ padding: 24, borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 56, height: 56, background: "var(--bg-input)", borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 26, color: "var(--accent)" }}>
                        {CATEGORY_ICONS[selectedRoutine.category] || <GiMuscleUp />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 19, marginBottom: 4 }}>{selectedRoutine.name}</h3>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                          {selectedRoutine.category} · {selectedRoutine.duration} · {selectedRoutine.exercises} ejercicios
                        </p>
                      </div>
                    </div>
                    <motion.button className="icon-btn" onClick={() => setSelectedRoutine(null)}>
                      <FiX size={18} />
                    </motion.button>
                  </div>
                  <div style={{ padding: 24 }}>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.6 }}>
                      {selectedRoutine.description || "Sin descripción."}
                    </p>
                    <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Lista de Ejercicios</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(selectedRoutine.exerciseList || []).map((ex, idx) => (
                        <div key={idx} style={{
                          background: "var(--bg-input)", padding: "12px 14px", borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{
                              width: 28, height: 28, background: "var(--accent)", color: "#fff",
                              borderRadius: "50%", display: "flex", alignItems: "center",
                              justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0,
                            }}>{idx + 1}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                                {ex.day} · {ex.sets} · {ex.peso ? `${ex.peso} kg` : "Peso libre"}
                              </div>
                            </div>
                            <motion.button
                              title="Ver ejercicio en biblioteca"
                              onClick={() => {
                                // Buscar en biblioteca; si no match exacto, usar datos del ejercicio en rutina
                                const found = exercises.find(e => e.nombre === ex.name)
                                  || exercises.find(e => e.nombre.trim().toLowerCase() === ex.name.trim().toLowerCase());
                                setViewingEx(found || {
                                  nombre:         ex.name,
                                  imagenes:       ex.imagenes || [],
                                  video:          ex.video    || null,
                                  descripcion:    ex.instrucciones || '',
                                  grupo_muscular: ex.day || '',
                                });
                              }}
                              style={{
                                width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
                                background: "var(--bg-card)", color: "var(--accent)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiEye size={13} />
                            </motion.button>
                          </div>
                          {/* Imágenes del ejercicio */}
                          {(ex.imagenes || []).length > 0 && (
                            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                              {ex.imagenes.map((img, ii) => (
                                <img key={ii} src={img} alt={`paso ${ii + 1}`}
                                  style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 6,
                                    border: "1px solid var(--border)" }} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!selectedRoutine.exerciseList || selectedRoutine.exerciseList.length === 0) && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Sin ejercicios registrados.</p>
                      )}
                    </div>
                    <div style={{ marginTop: 22, display: "flex", gap: 10 }}>
                      <motion.button className="btn-compact-primary" style={{ flex: 1 }}
                        onClick={e => { setSelectedRoutine(null); openEdit(e, selectedRoutine); }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <FiEdit size={15} /> Editar
                      </motion.button>
                      <motion.button className="btn-compact-primary" style={{ flex: 1 }}
                        onClick={e => { handleDuplicate(e, selectedRoutine.id, selectedRoutine.name); setSelectedRoutine(null); }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <FiCopy size={15} /> Duplicar
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal crear / editar rutina */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1100, padding: 20 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  style={{ background: "var(--bg-card)", borderRadius: 16, maxWidth: 780,
                    width: "100%", maxHeight: "92vh", overflow: "auto",
                    border: "1px solid var(--border)" }}
                  initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
                  {/* Header form */}
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 17 }}>{editingId ? "Editar Rutina" : "Nueva Rutina"}</h3>
                    <motion.button className="icon-btn" onClick={() => setShowForm(false)}>
                      <FiX size={19} />
                    </motion.button>
                  </div>

                  <div style={{ padding: 24 }}>
                    {/* Datos básicos */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label-compact">Nombre *</label>
                        <input className="input-compact" value={formData.name}
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ej. Fuerza Tren Superior" />
                      </div>
                      <div>
                        <label className="form-label-compact">Categoría</label>
                        <select className="input-compact" value={formData.category}
                          onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label-compact">Dificultad</label>
                        <select className="input-compact" value={formData.difficulty}
                          onChange={e => setFormData(f => ({ ...f, difficulty: e.target.value }))}>
                          {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label-compact">Duración (min)</label>
                        <input type="number" className="input-compact" min={10}
                          value={formData.duration_minutes}
                          onChange={e => setFormData(f => ({ ...f, duration_minutes: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label-compact">Descripción</label>
                        <textarea className="input-compact" rows={3}
                          style={{ resize: "vertical", fontFamily: "inherit" }}
                          value={formData.description}
                          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                          placeholder="Objetivo de la rutina…" />
                      </div>
                    </div>

                    {/* Días */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>Días de entrenamiento</h4>
                        <motion.button className="btn-compact-primary" onClick={addDay} style={{ fontSize: 12 }}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <FiPlus size={13} /> Agregar día
                        </motion.button>
                      </div>

                      {formData.days.length === 0 && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 12, textAlign: "center", padding: "18px 0" }}>
                          Agrega días para definir los ejercicios.
                        </p>
                      )}

                      {formData.days.map((day, di) => (
                        <div key={di} style={{
                          background: "var(--bg-input)", borderRadius: 10,
                          border: "1px solid var(--border)", marginBottom: 10, overflow: "hidden",
                        }}>
                          {/* Cabecera del día */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                            cursor: "pointer",
                            borderBottom: expandedDay === di ? "1px solid var(--border)" : "none",
                          }} onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}>
                            <select className="input-compact" style={{ width: "auto", flex: 1 }}
                              value={day.day}
                              onChange={e => { e.stopPropagation(); updateDay(di, "day", e.target.value); }}
                              onClick={e => e.stopPropagation()}>
                              {DIAS_SEMANA.map(d => <option key={d}>{d}</option>)}
                            </select>
                            <input className="input-compact" style={{ flex: 2 }}
                              placeholder="Grupo muscular" value={day.muscleGroup}
                              onChange={e => updateDay(di, "muscleGroup", e.target.value)}
                              onClick={e => e.stopPropagation()} />
                            <span style={{ color: "var(--text-secondary)", fontSize: 11, flexShrink: 0 }}>
                              {day.exercises.length} ej.
                            </span>
                            {expandedDay === di ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                            <motion.button className="icon-btn danger" style={{ padding: 4 }}
                              onClick={e => { e.stopPropagation(); removeDay(di); }}
                              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <FiTrash2 size={13} />
                            </motion.button>
                          </div>

                          {/* Ejercicios del día */}
                          {expandedDay === di && (
                            <div style={{ padding: "14px 16px" }}>
                              {day.exercises.map((ex, ei) => (
                                <div key={ei} style={{
                                  background: "var(--bg-card)", borderRadius: 8,
                                  border: "1px solid var(--border)", padding: "10px 12px",
                                  marginBottom: 8,
                                }}>
                                  {/* Fila principal */}
                                  <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "2fr 0.7fr 0.7fr 0.7fr auto auto",
                                    gap: 6, alignItems: "center",
                                  }}>
                                    {/* Nombre: solo lectura, requiere selección desde biblioteca */}
                                    <button
                                      onClick={() => pickFromLibrary(di, ei)}
                                      title="Cambiar ejercicio"
                                      style={{
                                        background: "var(--bg-input)", border: "1px solid var(--border)",
                                        borderRadius: 6, padding: "5px 8px", cursor: "pointer",
                                        textAlign: "left", fontSize: 12, color: ex.name ? "var(--text-primary)" : "var(--text-secondary)",
                                        display: "flex", alignItems: "center", gap: 6, overflow: "hidden",
                                        whiteSpace: "nowrap",
                                      }}>
                                      <FiBookOpen size={11} style={{ flexShrink: 0, color: "var(--accent)" }} />
                                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {ex.name || "Seleccionar ejercicio…"}
                                      </span>
                                    </button>
                                    <input className="input-compact" placeholder="Series"
                                      value={ex.sets} onChange={e => updateExercise(di, ei, "sets", e.target.value)} />
                                    <input className="input-compact" placeholder="Reps"
                                      value={ex.reps} onChange={e => updateExercise(di, ei, "reps", e.target.value)} />
                                    <input className="input-compact" placeholder="Peso"
                                      value={ex.peso} onChange={e => updateExercise(di, ei, "peso", e.target.value)} />
                                    {/* Icono de biblioteca desplazado — ya integrado en el nombre */}
                                    <div style={{ width: 28 }} />
                                    <motion.button className="icon-btn danger" style={{ padding: 4 }}
                                      onClick={() => removeExercise(di, ei)}
                                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <FiX size={13} />
                                    </motion.button>
                                  </div>


                                </div>
                              ))}
                              <motion.button className="btn-outline-small" style={{ marginTop: 4 }}
                                onClick={() => addExercise(di)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <FiPlus size={13} /> Ejercicio
                              </motion.button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                      <motion.button className="btn-outline-small" onClick={() => setShowForm(false)}
                        disabled={actionLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        Cancelar
                      </motion.button>
                      <motion.button className="btn-compact-primary" onClick={handleSave}
                        disabled={actionLoading}
                        whileHover={{ scale: actionLoading ? 1 : 1.05 }}
                        whileTap={{ scale: actionLoading ? 1 : 0.95 }}>
                        <FiSave size={15} />
                        {actionLoading ? "Guardando…" : editingId ? "Actualizar" : "Crear Rutina"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Library picker modal */}
          <AnimatePresence>
            {showLibraryPicker && (
              <LibraryPicker
                exercises={exercises}
                onPick={handlePickExercise}
                onClose={() => setShowLibraryPicker(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ════════════════════════ TAB: EJERCICIOS ════════════════════════ */}
      {tab === "exercises" && (
        <>
          {/* Toolbar */}
          <motion.div className="chart-card" style={{ marginBottom: 16 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div className="input-dark-container with-icon" style={{ flex: 1, minWidth: 220 }}>
                <FiSearch size={16} style={{ color: "var(--text-secondary)" }} />
                <input className="search-input" placeholder="Buscar ejercicio…"
                  value={searchEx} onChange={e => setSearchEx(e.target.value)} />
                {searchEx && (
                  <button className="clear-search" onClick={() => setSearchEx("")}><FiX /></button>
                )}
              </div>
              {exercises.length > 0 && (
                <button className="btn-compact-primary"
                  style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  onClick={toggleSelectAllEx}
                  title={allExSelected ? "Quitar selección" : "Seleccionar todos"}>
                  <FiCheckSquare size={15} /> {allExSelected ? "Quitar selección" : "Seleccionar todos"}
                </button>
              )}
              {selectedEx.size > 0 && (
                <button className="btn-compact-primary"
                  style={{ background: "var(--danger, #ef4444)" }}
                  onClick={handleBulkDeleteEx} disabled={actionLoading}>
                  <FiTrash2 size={15} /> Eliminar ({selectedEx.size})
                </button>
              )}
              <button className="btn-compact-primary"
                onClick={() => { setEditingEx(null); setShowExForm(true); }}>
                <FiPlus size={15} /> Nuevo ejercicio
              </button>
            </div>
          </motion.div>

          {/* Tabla de ejercicios */}
          <motion.div className="table-section"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="section-header" style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>
                Biblioteca de ejercicios
              </h3>
              <span className="total-count">{exercises.length} ejercicios</span>
            </div>

            {loadingE ? (
              <div style={{ textAlign: "center", padding: "50px 0", color: "var(--text-secondary)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <FiLoader size={26} />
                </motion.div>
              </div>
            ) : exercises.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <FiBookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3>Biblioteca vacía</h3>
                <p>Agrega ejercicios a tu biblioteca para asignarlos rápidamente en tus rutinas.</p>
                <button className="btn-compact-primary" style={{ marginTop: 14 }}
                  onClick={() => { setEditingEx(null); setShowExForm(true); }}>
                  <FiPlus size={14} /> Crear primer ejercicio
                </button>
              </div>
            ) : (() => {
              const startIdx = (exPage - 1) * EX_PER_PAGE;
              const pagedEx  = exercises.slice(startIdx, startIdx + EX_PER_PAGE);
              return (
                <>
                  <div className="custom-table-container" style={{ borderRadius: 0, border: "none" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: 38, textAlign: "center" }}>
                            <input type="checkbox" style={{ cursor: "pointer" }}
                              checked={allExSelected}
                              ref={el => { if (el) el.indeterminate = selectedEx.size > 0 && !allExSelected; }}
                              onChange={toggleSelectAllEx}
                              title="Seleccionar todos" />
                          </th>
                          <th>Nombre</th>
                          <th>Grupo muscular</th>
                          <th>Tipo</th>
                          <th>Series × Reps</th>
                          <th style={{ width: 110, textAlign: "center" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedEx.map(ex => (
                          <tr key={ex.id} style={selectedEx.has(ex.id) ? { background: "var(--accent-soft, rgba(99,102,241,.12))" } : undefined}>
                            <td style={{ textAlign: "center" }}>
                              <input type="checkbox" style={{ cursor: "pointer" }}
                                checked={selectedEx.has(ex.id)}
                                onChange={() => toggleSelectEx(ex.id)} />
                            </td>
                            <td className="font-bold">
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                {ex.nombre}
                                {(ex.imagenes?.length > 0) && (
                                  <span title={`${ex.imagenes.length} imagen(es)`}
                                    style={{ color: "var(--accent)", opacity: 0.75, lineHeight: 0 }}>
                                    <FiImage size={12} />
                                  </span>
                                )}
                                {ex.video && (
                                  <span title="Tiene video" style={{ color: "var(--success)", opacity: 0.8, lineHeight: 0 }}>
                                    <FiVideo size={12} />
                                  </span>
                                )}
                              </div>
                              {ex.descripcion && (
                                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400, marginTop: 2 }}>
                                  {ex.descripcion.slice(0, 80)}{ex.descripcion.length > 80 ? "…" : ""}
                                </div>
                              )}
                            </td>
                            <td>{ex.grupo_muscular || "—"}</td>
                            <td>{ex.tipo || "—"}</td>
                            <td>{ex.series ? `${ex.series} × ${ex.repeticiones || "—"}` : "—"}</td>
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                                <motion.button className="icon-btn" style={{ padding: 5 }}
                                  title="Ver detalle"
                                  onClick={() => setViewingEx(ex)}
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <FiEye size={13} />
                                </motion.button>
                                <motion.button className="icon-btn" style={{ padding: 5 }}
                                  title="Editar"
                                  onClick={() => { setEditingEx(ex); setShowExForm(true); }}
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <FiEdit size={13} />
                                </motion.button>
                                <motion.button className="icon-btn danger" style={{ padding: 5 }}
                                  title="Eliminar"
                                  onClick={() => handleDeleteEx(ex)}
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <FiTrash2 size={13} />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: "4px 16px 16px" }}>
                    <Pagination
                      page={exPage} total={exercises.length}
                      perPage={EX_PER_PAGE} onPage={setExPage}
                    />
                  </div>
                </>
              );
            })()}
          </motion.div>

          {/* Modal crear / editar ejercicio */}
          <AnimatePresence>
            {showExForm && (
              <ExerciseFormModal
                initial={editingEx ? {
                  nombre:         editingEx.nombre,
                  descripcion:    editingEx.descripcion || "",
                  grupo_muscular: editingEx.grupo_muscular || "",
                  tipo:           editingEx.tipo || "",
                  series:         editingEx.series || "",
                  repeticiones:   editingEx.repeticiones || "",
                  imagenes:       editingEx.imagenes || [],
                  video:          editingEx.video || null,
                } : null}
                exerciseId={editingEx?.id}
                onSave={handleSaveEx}
                onClose={() => { setShowExForm(false); setEditingEx(null); }}
                saving={savingEx}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* ════════════════════════ TAB: IMPORTAR IA ════════════════════════ */}
      {tab === "import" && (
        <ImportarIARoutinesTab
          clients={clients}
          onImportDone={() => { loadRoutines(); loadExercises(); }}
          onSaveRoutine={async (routineData) => {
            try { await trainerService.createRoutine(routineData); return true; }
            catch { return false; }
          }}
          onSaveExercise={async (exData) => {
            try { await trainerService.createExercise(exData); return true; }
            catch { return false; }
          }}
        />
      )}

      {/* Modal detalle ejercicio — global, visible en cualquier tab */}
      <AnimatePresence>
        {viewingEx && (
          <ExerciseDetailModal
            exercise={viewingEx}
            onClose={() => setViewingEx(null)}
            onEdit={() => {
              setEditingEx(viewingEx);
              setShowExForm(true);
              setViewingEx(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
