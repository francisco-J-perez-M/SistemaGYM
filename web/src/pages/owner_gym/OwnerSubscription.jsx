/**
 * OwnerSubscription.jsx — "Mi Suscripción" del dueño del gimnasio.
 *
 * Muestra el plan contratado con la plataforma, días restantes, facturas, y
 * permite renovar o mejorar de plan con un flujo de PAGO DEMO (simulado, sin
 * cobrar de verdad) y activar el cargo recurrente (auto-renovación).
 * Solo iconos (react-icons), sin emojis.
 */
import { useState, useEffect, useCallback } from "react";
import {
  FiCreditCard, FiCheckCircle, FiClock, FiRefreshCw, FiArrowUpCircle,
  FiCalendar, FiFileText, FiX, FiZap, FiAlertCircle, FiRepeat, FiCheck, FiUsers,
} from "react-icons/fi";
import BotonesPago from "../../components/compartido/BotonesPago";
import "../../css/CSSUnificado.css";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const diasRestantes = (iso) => {
  if (!iso) return null;
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  return d;
};
const fechaCorta = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ESTADO_META = {
  active:    { label: "Activa",            color: "var(--success)" },
  trialing:  { label: "Período de prueba", color: "var(--info)" },
  past_due:  { label: "Pago pendiente",    color: "var(--warning)" },
  unpaid:    { label: "Sin pagar",         color: "var(--danger)" },
  cancelled: { label: "Cancelada",         color: "var(--danger)" },
  paused:    { label: "Pausada",           color: "var(--text-secondary)" },
};

const METODOS = [
  { id: "tarjeta", label: "Tarjeta" },
  { id: "paypal",  label: "PayPal" },
  { id: "mercadopago", label: "Mercado Pago" },
];

export default function OwnerSubscription() {
  const [sub, setSub]         = useState(null);
  const [planes, setPlanes]   = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null);

  // Modal de pago demo
  const [pay, setPay]         = useState(null); // { plan, modo:"renovar"|"mejorar" }
  const [metodo, setMetodo]   = useState("tarjeta");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, f] = await Promise.all([
        fetch("/api/billing/suscripcion", { headers: authHeaders() }).then(r => r.json()),
        fetch("/api/billing/planes", { headers: authHeaders() }).then(r => r.json()),
        fetch("/api/billing/facturas?limit=10", { headers: authHeaders() }).then(r => r.json()),
      ]);
      setSub(s?.suscripcion || null);
      setPlanes(Array.isArray(p) ? p : []);
      setFacturas(f?.facturas || []);
    } catch { setMsg({ type: "error", text: "No se pudo cargar tu suscripción." }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAuto = async () => {
    if (!sub) return;
    const destino = !sub.auto_renovar;
    try {
      const r = await fetch(`/api/billing/suscripcion/${sub.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ auto_renovar: destino }),
      });
      // fetch no lanza en 4xx/5xx: sin esta comprobación el interruptor se
      // movía en pantalla aunque el servidor hubiera rechazado el cambio, y el
      // dueño creía tener el cargo recurrente activo sin tenerlo.
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.msg || "El servidor rechazó el cambio.");
      }
      setSub((s) => ({ ...s, auto_renovar: destino }));
      setMsg({
        type: "ok",
        text: destino
          ? "Cargo recurrente activado: tu plan se renovará solo al vencer."
          : "Cargo recurrente desactivado: tendrás que renovar manualmente.",
      });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "No se pudo actualizar la auto-renovación." });
    }
  };

  const confirmarPago = async () => {
    setProcessing(true); setMsg(null);
    try {
      const body = {};
      if (pay?.modo === "mejorar" && pay?.plan) body.id_plan = pay.plan.id;
      const r = await fetch("/api/billing/suscripcion/renovar", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.msg || "Error");
      setPay(null);
      setMsg({ type: "ok", text: "Pago simulado exitoso. Tu suscripción quedó activa." });
      await load();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    finally { setProcessing(false); }
  };

  if (loading) return <div style={S.page}><p style={{ color: "var(--text-secondary)" }}>Cargando tu suscripción…</p></div>;

  const est = ESTADO_META[sub?.estado] || ESTADO_META.cancelled;
  const dias = diasRestantes(sub?.fecha_proximo_cobro);
  const planActual = sub?.plan;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={S.title}>Mi Suscripción</h1>
        <p style={S.sub}>Tu plan con la plataforma: estado, vencimiento, renovación y facturas.</p>
      </div>

      {msg && (
        <div style={{ ...S.banner, ...(msg.type === "ok" ? S.bannerOk : S.bannerErr) }}>
          {msg.type === "ok" ? <FiCheckCircle /> : <FiAlertCircle />} {msg.text}
        </div>
      )}

      {/* Tarjeta del plan actual — acento superior para darle jerarquía */}
      <div style={{ ...S.card, borderTop: "3px solid var(--accent)" }}>
        {!sub ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <FiCreditCard size={34} style={{ color: "var(--text-secondary)", opacity: .5 }} />
            <p style={{ color: "var(--text-secondary)", margin: "10px 0 16px" }}>Aún no tienes una suscripción activa.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", margin: 0, textTransform: "capitalize" }}>
                    {planActual?.nombre || "Plan"}
                  </h2>
                  <span style={{ ...S.badge, background: `${est.color}22`, color: est.color }}>{est.label}</span>
                </div>
                <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: 18, margin: "6px 0 0" }}>{planActual?.precio_display}</p>
                {planActual?.max_miembros != null && (
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "4px 0 0" }}>Hasta {planActual.max_miembros} miembros</p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}><FiClock size={12} /> Días restantes</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: dias != null && dias <= 5 ? "var(--danger)" : "var(--text-primary)" }}>
                  {dias != null ? Math.max(0, dias) : "—"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <FiCalendar size={12} /> Próximo cobro: {fechaCorta(sub.fecha_proximo_cobro)}
                </div>
              </div>
            </div>

            {/* Auto-renovación */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              marginTop: 18, padding: "12px 14px", background: "var(--bg-input)", borderRadius: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FiRepeat style={{ color: "var(--accent)" }} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>Cargo recurrente</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {sub.auto_renovar
                      ? `Se renovará solo el ${fechaCorta(sub.fecha_proximo_cobro)} por otros 30 días.`
                      : `Sin cargo automático: el ${fechaCorta(sub.fecha_proximo_cobro)} tendrás que renovar a mano.`}
                  </div>
                </div>
              </div>
              <button onClick={toggleAuto}
                style={{ width: 52, height: 28, borderRadius: 99, border: "none", cursor: "pointer", position: "relative",
                  background: sub.auto_renovar ? "var(--success)" : "var(--border)", transition: "background .2s" }}>
                <span style={{ position: "absolute", top: 3, left: sub.auto_renovar ? 27 : 3, width: 22, height: 22,
                  borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button style={S.primaryBtn} onClick={() => { setMetodo("tarjeta"); setPay({ modo: "renovar", plan: planActual }); }}>
                <FiRefreshCw size={15} /> Renovar 30 días
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cambiar / mejorar de plan */}
      <h3 style={S.section}>Planes disponibles</h3>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "-6px 0 16px" }}>
        Cambia de plan cuando quieras. Al mejorar, el nuevo plan se activa al confirmarse el pago.
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 18, alignItems: "stretch",
      }}>
        {planes.map(p => {
          const actual = planActual?.id === p.id;
          return (
            <div key={p.id} style={{
              ...S.planCard,
              borderColor: actual ? "var(--accent)" : (p.destacado ? "var(--accent)" : "var(--border)"),
              borderWidth: p.destacado || actual ? 2 : 1,
              boxShadow: p.destacado ? "0 8px 28px rgba(51,119,255,.18)" : "none",
              paddingTop: p.destacado ? 30 : 20,
            }}>
              {/* Cinta del plan recomendado */}
              {p.destacado && !actual && (
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  background: "var(--accent)", color: "#fff", fontSize: 10.5, fontWeight: 800,
                  letterSpacing: ".06em", padding: "4px 14px", borderRadius: "0 0 8px 8px",
                  textTransform: "uppercase",
                }}>
                  Más elegido
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 17, textTransform: "capitalize" }}>
                  {p.nombre}
                </span>
                {actual && <span style={{ ...S.badge, background: "var(--accent-dim, rgba(51,119,255,.15))", color: "var(--accent)" }}>Actual</span>}
              </div>

              {p.titulo_comercial && (
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, minHeight: 32, lineHeight: 1.4 }}>
                  {p.titulo_comercial}
                </p>
              )}

              {/* Precio */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, margin: "10px 0 4px" }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 30, letterSpacing: "-0.5px" }}>
                  {p.precio_mensual_mxn === 0 ? "Gratis" : `$${(p.precio_mensual_mxn / 100).toLocaleString("es-MX")}`}
                </span>
                {p.precio_mensual_mxn > 0 && (
                  <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>MXN /mes</span>
                )}
              </div>

              {/* Capacidad */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                background: "var(--bg-input)", borderRadius: 8, padding: "5px 10px",
                fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600, margin: "6px 0 12px",
              }}>
                <FiUsers size={12} />
                {p.max_miembros == null ? "Miembros ilimitados" : `Hasta ${p.max_miembros} miembros`}
              </div>

              {/* Beneficios incluidos */}
              {Array.isArray(p.caracteristicas) && p.caracteristicas.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                  {p.caracteristicas.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.45 }}>
                      <FiCheck style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} size={13} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button disabled={actual}
                onClick={() => { setMetodo("tarjeta"); setPay({ modo: "mejorar", plan: p }); }}
                style={{
                  ...S.planBtn,
                  background: actual ? "var(--bg-input)" : (p.destacado ? "var(--accent)" : "var(--bg-input)"),
                  color: actual ? "var(--text-secondary)" : (p.destacado ? "#fff" : "var(--text-primary)"),
                  borderColor: p.destacado && !actual ? "var(--accent)" : "var(--border)",
                  opacity: actual ? 0.65 : 1,
                  cursor: actual ? "default" : "pointer",
                }}>
                {actual ? "Plan actual" : <><FiArrowUpCircle size={14} /> Cambiar a este</>}
              </button>

              {/* Pago en línea del plan (lo cobra la plataforma) */}
              {!actual && p.precio_mensual_mxn > 0 && (
                <div style={{ marginTop: 10 }}>
                  <BotonesPago
                    contexto="suscripcion"
                    monto={Number((p.precio_mensual_mxn / 100).toFixed(2))}
                    descripcion={`Suscripción GymPro — plan ${p.nombre}`}
                    referenciaLocal={sub?.id ?? null}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Facturas */}
      <h3 style={S.section}>Historial de facturas</h3>
      {facturas.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Aún no hay facturas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {facturas.map(f => {
            const pagada = f.estado === "pagada";
            return (
              <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                background: "var(--bg-input)", borderRadius: 9 }}>
                <FiFileText style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{f.monto_display || "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Emitida {fechaCorta(f.fecha_emision)}{f.fecha_pago ? ` · Pagada ${fechaCorta(f.fecha_pago)}` : ""}</div>
                </div>
                <span style={{ ...S.badge, background: pagada ? "rgba(0,230,118,.15)" : "rgba(255,179,0,.15)",
                  color: pagada ? "var(--success)" : "var(--warning)" }}>
                  {pagada ? "Pagada" : (f.estado || "pendiente")}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de pago demo */}
      {pay && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && !processing && setPay(null)}>
          <div style={S.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {pay.modo === "mejorar" ? "Cambiar de plan" : "Renovar suscripción"}
              </h3>
              <button onClick={() => !processing && setPay(null)} style={S.iconBtn}><FiX /></button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px" }}>
              {pay.plan?.nombre} — <strong style={{ color: "var(--accent)" }}>{pay.plan?.precio_display}</strong>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)",
              background: "var(--bg-input)", borderRadius: 8, padding: "7px 10px", marginBottom: 14 }}>
              <FiZap size={12} style={{ color: "var(--warning)" }} /> Modo demostración: no se realiza ningún cobro real.
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>Método de pago</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {METODOS.map(m => (
                <button key={m.id} onClick={() => setMetodo(m.id)}
                  style={{ flex: 1, minWidth: 90, padding: "10px 8px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: metodo === m.id ? "var(--accent-dim, rgba(51,119,255,.15))" : "var(--bg-input)",
                    border: `1px solid ${metodo === m.id ? "var(--accent)" : "var(--border)"}`,
                    color: metodo === m.id ? "var(--accent)" : "var(--text-secondary)" }}>
                  {m.label}
                </button>
              ))}
            </div>

            <button style={{ ...S.primaryBtn, width: "100%", justifyContent: "center" }} onClick={confirmarPago} disabled={processing}>
              {processing ? "Procesando…" : <><FiCheckCircle size={15} /> Pagar (demo)</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  // width:100% + boxSizing evitan que el contenedor colapse a una columna angosta
  page: { padding: "28px 32px", minHeight: "100vh", background: "var(--bg-main)", width: "100%", maxWidth: 1240, margin: "0 auto", boxSizing: "border-box" },
  title: { fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.3px" },
  sub: { fontSize: 14, color: "var(--text-secondary)", margin: "4px 0 0" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: "26px 0 12px" },
  planCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16,
    padding: 20, display: "flex", flexDirection: "column", gap: 4,
    position: "relative", transition: "transform .15s, box-shadow .15s", boxSizing: "border-box",
  },
  planBtn: { marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, width: "100%" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  badge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  banner: { display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13 },
  bannerOk: { background: "rgba(0,230,118,.12)", color: "var(--success)" },
  bannerErr: { background: "rgba(255,23,68,.12)", color: "var(--danger)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 420 },
  iconBtn: { background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex" },
};
