/**
 * useRoutineImportJob.js — Estado compartido del job de importación de
 * rutinas por IA (ver ia_jobs.py en el backend).
 *
 * Por qué un store propio y no useState local en el componente: el job corre
 * en background en el servidor y puede tardar minutos. Si el estado viviera
 * solo en ImportarIARoutinesTab, se perdería en cuanto el entrenador cambiara
 * de pestaña o navegara a otra pantalla (exactamente el problema que este
 * cambio busca resolver: "que el entrenador pueda volver al módulo y
 * terminar su tarea de asignación de ejercicios" mientras la IA procesa).
 *
 * Este módulo mantiene UN job activo a la vez (module-level, no por
 * componente) persistido en localStorage, con un único poller compartido.
 * Layout.jsx lo usa para mostrar un aviso aunque el entrenador esté en otra
 * pantalla; ImportarIARoutinesTab lo usa para pintar el resultado cuando
 * vuelve. No se agregó una librería de estado global (Zustand, Redux) para
 * esto -- es un único store chico y acotado a este flujo, consistente con
 * que el resto del proyecto no usa gestor de estado global en web.
 */
import { useEffect, useState } from "react";
import trainerService from "../services/entrenador/trainerService";

const STORAGE_KEY = "gympro_ia_job_rutinas";
const POLL_MS = 4000;

let job = null; // { job_id, estado, archivo, resultado?, error?, error_tipo?, detalle?, creado_en }
const listeners = new Set();
let pollTimer = null;

function notify() {
  listeners.forEach((fn) => fn(job));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    job = raw ? JSON.parse(raw) : null;
  } catch {
    job = null;
  }
}

function saveToStorage() {
  try {
    if (job) localStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage no disponible (privado/bloqueado): el job sigue vivo en
    // memoria para esta pestaña, solo se pierde la persistencia entre recargas.
  }
}

async function poll() {
  if (!job || job.estado !== "procesando") return;
  try {
    const data = await trainerService.getRoutineImportJobStatus(job.job_id);
    job = { ...job, ...data };
    saveToStorage();
    notify();
  } catch {
    // Red caída momentáneamente o 404 (job muy viejo ya purgado): se
    // reintenta en el próximo tick, no se descarta el job por un solo fallo.
  }
}

function ensurePolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (!job || job.estado !== "procesando") {
      clearInterval(pollTimer);
      pollTimer = null;
      return;
    }
    poll();
  }, POLL_MS);
}

loadFromStorage();
if (job?.estado === "procesando") {
  ensurePolling();
  poll(); // primer chequeo inmediato, no esperar POLL_MS tras recargar la página
}

/** Registra un job recién encolado y arranca el polling. */
export function startRoutineImportJob(jobId, archivo) {
  job = { job_id: jobId, estado: "procesando", archivo, creado_en: Date.now() };
  saveToStorage();
  notify();
  ensurePolling();
}

/** Descarta el job actual (tras guardarlo, descartarlo, o cerrar el aviso de error). */
export function dismissRoutineImportJob() {
  job = null;
  saveToStorage();
  notify();
}

/**
 * Cancela el job actual desde la UI (botón "Cancelar"). Detiene el polling y
 * limpia el estado local DE INMEDIATO, sin esperar al backend -- el caso que
 * esto resuelve es justamente un job que se quedó pegado en "procesando"
 * (ej. tras reiniciar los contenedores a mitad del proceso), donde no hay
 * garantía de que el servidor vaya a responder nunca. El aviso al backend es
 * best-effort: si llega, marca el job como "cancelado" en Mongo para que
 * _set_job() no lo revierta a "listo"/"error" si el hilo original termina
 * tarde: ver ia_jobs.py.
 */
export function cancelRoutineImportJob() {
  const jobId = job?.job_id;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  job = null;
  saveToStorage();
  notify();
  if (jobId) {
    trainerService.cancelRoutineImportJob(jobId).catch(() => {
      // Best-effort: si el backend no responde, no importa -- el estado
      // local ya se limpió y es lo que realmente desatoraba al entrenador.
    });
  }
}

/** Hook de lectura: se re-renderiza cada vez que el job cambia de estado. */
export function useRoutineImportJob() {
  const [state, setState] = useState(job);
  useEffect(() => {
    listeners.add(setState);
    setState(job); // por si cambió entre el useState inicial y este efecto
    return () => listeners.delete(setState);
  }, []);
  return state;
}
