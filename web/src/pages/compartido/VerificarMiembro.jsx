/**
 * VerificarMiembro.jsx — Verificación de membresía de un miembro de OTRA
 * sucursal de la organización (HU-47 / SCRUM-218).
 *
 * Disponible para Recepcionista, Entrenador, Administrador y Propietario
 * (se monta bajo las tres rutas /receptionist, /trainer y /owner — ver
 * App.jsx). Sidebar.jsx oculta el enlace cuando la organización tiene una
 * sola sucursal (AC7); el backend igual responde 404 en ese caso como
 * segunda barrera.
 *
 * A propósito es solo búsqueda puntual (número de socio exacto o nombre
 * completo exacto) y nunca un listado: ver el docstring de
 * routes/compartido/verificacion_sucursal.py para el porqué.
 */
import { useState, useEffect } from "react";
import {
  FiSearch, FiUser, FiHash, FiCheckCircle, FiAlertTriangle, FiXCircle,
  FiMapPin, FiDollarSign, FiCreditCard, FiRepeat,
} from "react-icons/fi";
import { verificarMiembro, trasladarMiembros } from "../../api/verificacion";
import { getMembresias } from "../../api/membresias";
import { registrarPago } from "../../api/pagos";
import { useToast } from "../../hooks/useToast";
import { normalizarRol, ROL_PROPIETARIO, ROL_ADMINISTRADOR } from "../../constants/roles";

const C = {
  bg:      "var(--bg-main,#0f1117)",
  card:    "var(--bg-card,#1a1d27)",
  input:   "var(--bg-input,#12151e)",
  border:  "var(--border,rgba(255,255,255,.08))",
  accent:  "var(--accent,#6366f1)",
  success: "var(--success,#22c55e)",
  warning: "var(--warning,#eab308)",
  danger:  "var(--danger,#ef4444)",
  t1:      "var(--text-primary,#f1f5f9)",
  t2:      "var(--text-secondary,#94a3b8)",
  t3:      "var(--text-tertiary,#64748b)",
};

const ESTADO_INFO = {
  activa:        { label: "Activa",       color: C.success, icon: FiCheckCircle },
  por_vencer:    { label: "Por vencer",   color: C.warning,  icon: FiAlertTriangle },
  vencida:       { label: "Vencida",      color: C.danger,   icon: FiXCircle },
  sin_membresia: { label: "Sin membresía", color: C.danger,  icon: FiXCircle },
};

const inputSt = {
  width: "100%", boxSizing: "border-box", background: C.input,
  border: `1px solid ${C.border}`, borderRadius: 8,
  padding: "10px 12px 10px 36px", color: C.t1, fontSize: 14, outline: "none",
};

function Avatar({ src, name, size = 72 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const palette  = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981"];
  const bg       = palette[(name?.charCodeAt(0) || 0) % palette.length];
  const st = { width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: bg, fontWeight: 700, fontSize: size * 0.32, color: "#fff" };
  if (src) return <div style={st}><img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  return <div style={st}>{initials}</div>;
}

export default function VerificarMiembro() {
  const [modo, setModo]       = useState("numero_socio"); // "numero_socio" | "nombre"
  const [valor, setValor]     = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError]     = useState(null);
  const [cobroAbierto, setCobroAbierto] = useState(false);
  const [trasladando, setTrasladando] = useState(false);
  const { toast, confirm, ToastPortal } = useToast();

  // HU-48/SCRUM-219 (AC8): "cambiar de sucursal" es cosa de Propietario y
  // Administrador -- Recepcionista y Entrenador no lo pueden ejecutar (el
  // backend ya los bloquea con @require_role, esto solo evita mostrarles
  // un botón que de cualquier forma terminaría en 403).
  const rolActual = (() => {
    try { return normalizarRol(JSON.parse(localStorage.getItem("user") || "{}").role); }
    catch { return null; }
  })();
  const puedeTrasladar = rolActual === ROL_PROPIETARIO || rolActual === ROL_ADMINISTRADOR;

  const buscar = async (e) => {
    e.preventDefault();
    const q = valor.trim();
    if (!q) return;
    setBuscando(true);
    setError(null);
    setResultado(null);
    setCobroAbierto(false);
    try {
      const { data } = await verificarMiembro(
        modo === "numero_socio" ? { numeroSocio: q } : { nombre: q }
      );
      setResultado(data);
    } catch (err) {
      setError(err.response?.data?.msg || "Miembro no encontrado");
    } finally {
      setBuscando(false);
    }
  };

  const cambiarSucursal = async () => {
    const ok = await confirm({
      title: "¿Cambiar de sucursal?",
      message: `${resultado.nombre} dejará de pertenecer a ${resultado.sucursal_origen?.nombre || "su sucursal actual"} y quedará registrado permanentemente en esta sucursal. Su membresía vigente, su historial y su expediente viajan con él; sus asistencias pasadas no se mueven.`,
      type: "warning", confirmText: "Sí, cambiar", cancelText: "Cancelar",
    });
    if (!ok) return;
    setTrasladando(true);
    try {
      const { data } = await trasladarMiembros([resultado.id_miembro]);
      setResultado((r) => ({
        ...r,
        es_visita: false,
        sucursal_origen: data.sucursal_destino,
      }));
      toast.success("Sucursal actualizada", `${resultado.nombre} ahora pertenece a ${data.sucursal_destino.nombre}.`);
    } catch (err) {
      const msg = err.response?.data?.msg || "No se pudo cambiar de sucursal";
      const caben = err.response?.data?.caben;
      toast.error("No se pudo cambiar de sucursal",
        caben !== undefined ? `${msg} (caben ${caben} más en esta sucursal)` : msg);
    } finally {
      setTrasladando(false);
    }
  };

  const estadoInfo = resultado ? (ESTADO_INFO[resultado.estado_membresia] || ESTADO_INFO.sin_membresia) : null;
  const puedeCobrar = resultado && (resultado.estado_membresia === "vencida" || resultado.estado_membresia === "sin_membresia");

  return (
    <div className="dashboard-content">
      <ToastPortal />
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ margin: "0 0 4px" }}>Verificar Miembro de Otra Sucursal</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>
            Búsqueda puntual por número de socio o nombre completo exacto — no es un listado.
          </p>
        </div>
      </div>

      <form onSubmit={buscar} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24, maxWidth: 560 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ v: "numero_socio", label: "Nº de socio" }, { v: "nombre", label: "Nombre completo" }].map(({ v, label }) => (
            <button key={v} type="button" onClick={() => { setModo(v); setValor(""); }}
              style={{ padding: "9px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${modo === v ? C.accent : C.border}`,
                background: modo === v ? C.accent : "transparent",
                color: modo === v ? "#fff" : C.t2 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.t3 }}>
            {modo === "numero_socio" ? <FiHash size={15} /> : <FiUser size={15} />}
          </span>
          <input
            style={inputSt} value={valor} onChange={e => setValor(e.target.value)}
            placeholder={modo === "numero_socio" ? "Ej. 42" : "Nombre y apellidos exactos"}
            inputMode={modo === "numero_socio" ? "numeric" : "text"}
          />
        </div>

        <button type="submit" disabled={buscando || !valor.trim()}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 8, border: "none",
            background: (buscando || !valor.trim()) ? C.input : C.accent, color: (buscando || !valor.trim()) ? C.t2 : "#fff",
            fontWeight: 700, fontSize: 13, cursor: (buscando || !valor.trim()) ? "not-allowed" : "pointer" }}>
          <FiSearch size={14} /> {buscando ? "Buscando…" : "Verificar"}
        </button>
      </form>

      {error && (
        <div style={{ maxWidth: 560, padding: "14px 16px", borderRadius: 10, background: `${C.danger}15`, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {resultado && (
        <div style={{ maxWidth: 560, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
            <Avatar src={resultado.foto} name={resultado.nombre} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.t1, margin: "0 0 4px" }}>{resultado.nombre}</p>
              {resultado.sucursal_origen && (
                <p style={{ fontSize: 12.5, color: C.t2, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  <FiMapPin size={12} /> Sucursal de origen: {resultado.sucursal_origen.nombre}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: `${estadoInfo.color}15`, border: `1px solid ${estadoInfo.color}40`, marginBottom: resultado.es_visita ? 12 : 0 }}>
            <estadoInfo.icon size={18} style={{ color: estadoInfo.color, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: estadoInfo.color, fontSize: 14 }}>{estadoInfo.label}</p>
              {resultado.fecha_vencimiento && (
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: C.t2 }}>Vence el {resultado.fecha_vencimiento}</p>
              )}
            </div>
          </div>

          {resultado.es_visita && (
            <p style={{ fontSize: 11.5, color: C.t3, margin: "0 0 10px" }}>
              Visita registrada en esta sucursal.
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            {/* HU-48/SCRUM-219: traslado de UN miembro -- si decidió
                quedarse en esta sucursal para siempre, no hace falta ir
                a Miembros a buscarlo de nuevo. */}
            {resultado.es_visita && puedeTrasladar && (
              <button onClick={cambiarSucursal} disabled={trasladando}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
                  border: `1px solid ${C.accent}`, background: "transparent", color: C.accent,
                  fontWeight: 700, fontSize: 13, cursor: trasladando ? "not-allowed" : "pointer", opacity: trasladando ? 0.6 : 1 }}>
                <FiRepeat size={14} /> {trasladando ? "Cambiando…" : "Cambiar a esta sucursal"}
              </button>
            )}

            {puedeCobrar && !cobroAbierto && (
              <button onClick={() => setCobroAbierto(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <FiDollarSign size={14} /> Cobrar membresía aquí
              </button>
            )}
          </div>

          {puedeCobrar && cobroAbierto && (
            <CobroInline
              idMiembro={resultado.id_miembro}
              onCobrado={() => {
                setCobroAbierto(false);
                setResultado(r => ({ ...r, estado_membresia: "activa" }));
              }}
              onCancel={() => setCobroAbierto(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Cobro inline (reutiliza el mismo flujo que CobrarMembresia.jsx) ──────────
// AC5: "el cobro entra a la sucursal donde está parado el miembro" -- no hace
// falta nada especial aquí: registrarPago() usa el gimnasio del TOKEN
// (g.tenant_id en el backend), que es el de quien está verificando, no el de
// origen del miembro.
function CobroInline({ idMiembro, onCobrado, onCancel }) {
  const [membresias, setMembresias] = useState([]);
  const [idMembresia, setIdMembresia] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [tarjeta, setTarjeta] = useState("");
  const [referencia, setReferencia] = useState("");
  // Pago hecho en otro día (p. ej. una transferencia ya realizada que no se
  // pudo registrar antes por no existir todavía esta función): la
  // renovación y el conteo de días de la membresía arrancan desde la fecha
  // elegida en vez de hoy.
  const [fechaManual, setFechaManual] = useState(false);
  const [fechaPago, setFechaPago] = useState("");
  const [horaPago, setHoraPago] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getMembresias()
      .then(({ data }) => setMembresias((data || []).filter(m => m.activo !== false)))
      .catch(() => setErr("No se pudieron cargar los tipos de membresía de esta sucursal"))
      .finally(() => setCargando(false));
  }, []);

  const confirmar = async () => {
    if (!idMembresia) { setErr("Selecciona un tipo de membresía"); return; }
    if (metodo === "Transferencia" && !referencia.trim()) {
      setErr("Captura la referencia de la transferencia"); return;
    }
    if (fechaManual && !fechaPago) {
      setErr("Indica la fecha en la que se hizo el pago"); return;
    }
    setGuardando(true);
    setErr(null);
    try {
      await registrarPago({
        id_miembro: idMiembro, id_membresia: idMembresia,
        metodo_pago: metodo, numero_tarjeta: metodo === "Tarjeta" ? tarjeta : undefined,
        referencia: metodo === "Transferencia" ? referencia.trim() : undefined,
        fecha_pago: fechaManual && fechaPago ? (horaPago ? `${fechaPago}T${horaPago}` : fechaPago) : undefined,
      });
      onCobrado();
    } catch (e) {
      setErr(e.response?.data?.error || "No se pudo registrar el cobro");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 10, background: C.input, border: `1px solid ${C.border}` }}>
      {cargando ? (
        <p style={{ fontSize: 12.5, color: C.t2, margin: 0 }}>Cargando membresías de esta sucursal…</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            <select value={idMembresia} onChange={e => setIdMembresia(e.target.value)}
              style={{ ...inputSt, padding: "9px 12px" }}>
              <option value="">Tipo de membresía…</option>
              {membresias.map(m => (
                <option key={m.id} value={m.id}>{m.nombre} — ${m.precio}</option>
              ))}
            </select>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={{ ...inputSt, padding: "9px 12px" }}>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
            {metodo === "Tarjeta" && (
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.t3 }}><FiCreditCard size={14} /></span>
                <input style={inputSt} value={tarjeta} onChange={e => setTarjeta(e.target.value)} placeholder="Número de tarjeta" />
              </div>
            )}
            {metodo === "Transferencia" && (
              <input style={inputSt} value={referencia} onChange={e => setReferencia(e.target.value)}
                placeholder="Folio o referencia de la transferencia" />
            )}

            {/* Pago registrado en otro día (p. ej. una transferencia que ya
                se hizo pero no se pudo capturar antes). */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: C.t2 }}>
              <input type="checkbox" checked={fechaManual}
                onChange={e => { setFechaManual(e.target.checked); if (!e.target.checked) { setFechaPago(""); setHoraPago(""); } }}
                style={{ width: 14, height: 14, cursor: "pointer" }} />
              El pago se hizo en otro día
            </label>
            {fechaManual && (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" style={inputSt} value={fechaPago}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setFechaPago(e.target.value)} />
                <input type="time" style={inputSt} value={horaPago}
                  onChange={e => setHoraPago(e.target.value)} />
              </div>
            )}
          </div>
          {err && <p style={{ fontSize: 12, color: C.danger, margin: "0 0 10px" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmar} disabled={guardando || (metodo === "Transferencia" && !referencia.trim()) || (fechaManual && !fechaPago)}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: guardando ? C.border : C.success, color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer" }}>
              {guardando ? "Procesando…" : "Confirmar cobro"}
            </button>
            <button onClick={onCancel}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.t2, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
