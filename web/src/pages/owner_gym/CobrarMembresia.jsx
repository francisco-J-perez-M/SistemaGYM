/**
 * CobrarMembresia.jsx — Registro de pago de membresía para owner_gym.
 *
 * Vista dedicada al cobro de membresías, separada de la consulta de movimientos.
 * Estilo consistente con PointOfSale.jsx.
 */
import { useState, useEffect } from "react";
import { getMiembros } from "../../api/miembros";
import { getMembresias } from "../../api/membresias";
import { registrarPago } from "../../api/pagos";
import { useToast } from "../../hooks/useToast";
import BotonesPago from "../../components/compartido/BotonesPago";
import "../../css/CSSUnificado.css";

/* ── Iconos ── */
const UserIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const CardIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>);
const MoneyIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/></svg>);
const CheckIcon   = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>);
const SearchIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);

/* ── Helpers ── */
const fmt = (n) =>
  Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const inputSt = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8, color: "var(--text-primary)",
  fontSize: 14, outline: "none",
};
const labelSt = {
  display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: ".05em", color: "var(--text-secondary)", marginBottom: 6,
};

/* ── Componente de miembro seleccionado ── */
function MemberCard({ miembro, onClear }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: 10,
      background: "var(--accent-dim)", border: "1px solid var(--border-hover)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", background: "var(--accent-dim)",
          color: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 14,
        }}>
          {(miembro.nombre || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{miembro.nombre}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{miembro.email}</div>
        </div>
      </div>
      <button onClick={onClear} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

/* ── Componente principal ── */
export default function CobrarMembresia() {
  const { toast, ToastPortal } = useToast();

  const [miembros,    setMiembros]    = useState([]);
  const [membresias,  setMembresias]  = useState([]);
  const [search,      setSearch]      = useState("");
  const [miembro,     setMiembro]     = useState(null);
  const [membresia,   setMembresia]   = useState(null);
  const [metodo,      setMetodo]      = useState("Efectivo");
  const [tarjeta,     setTarjeta]     = useState("");
  const [referencia,  setReferencia]  = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(null); // pago registrado
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getMiembros(1, false, "").then(r => setMiembros(r.data?.miembros || [])),
      getMembresias().then(r => setMembresias(Array.isArray(r.data) ? r.data : [])),
    ]).finally(() => setLoadingData(false));
  }, []);

  const miembrosFiltrados = miembros.filter(m => {
    const q = search.toLowerCase();
    return !q || (m.nombre || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q);
  });

  const membresiasFiltradas = membresias.filter(m => m.activo !== false);

  const canSubmit = miembro && membresia && metodo &&
    (metodo !== "Tarjeta" || tarjeta.trim()) &&
    (metodo !== "Transferencia" || referencia.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await registrarPago({
        id_miembro:     miembro.id,
        id_membresia:   Number(membresia.id_membresia || membresia.id),
        metodo_pago:    metodo,
        numero_tarjeta: metodo === "Tarjeta"       ? tarjeta    : undefined,
        referencia:     metodo === "Transferencia" ? referencia : undefined,
      });
      setSuccess({
        miembro:   miembro.nombre,
        plan:      membresia.nombre,
        monto:     membresia.precio,
        metodo,
        duracion:  membresia.duracion_meses,
      });
      // Reset form
      setMiembro(null);
      setMembresia(null);
      setMetodo("Efectivo");
      setTarjeta("");
      setReferencia("");
      setSearch("");
    } catch (err) {
      toast.error("Error al registrar", err.response?.data?.error || "Error interno del servidor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-content">
      <ToastPortal />

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 28 }}>
        <div>
          <h2 className="page-title">Cobrar Membresía</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
            Registra el pago de una membresía para un miembro
          </p>
        </div>
      </div>

      {loadingData ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary)" }}>Cargando…</div>
      ) : (

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

          {/* ── Columna izquierda: formulario ── */}
          <form onSubmit={handleSubmit} data-guide="ow-cobrar-form" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Selección de miembro */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <UserIcon />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Miembro</h3>
              </div>

              {miembro ? (
                <MemberCard miembro={miembro} onClear={() => { setMiembro(null); setSearch(""); }} />
              ) : (
                <>
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", pointerEvents: "none" }}><SearchIcon /></span>
                    <input
                      style={{ ...inputSt, paddingLeft: 36 }}
                      placeholder="Buscar por nombre o email…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {miembrosFiltrados.length === 0 ? (
                      <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: "16px 0" }}>Sin resultados</p>
                    ) : miembrosFiltrados.map(m => (
                      <button
                        key={m.id} type="button"
                        onClick={() => setMiembro(m)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          background: "none", border: "1px solid transparent", borderRadius: 8,
                          cursor: "pointer", textAlign: "left", width: "100%",
                          transition: "all .15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover, rgba(255,255,255,.04))"; e.currentTarget.style.borderColor = "var(--border)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-dim)", color: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                          {(m.nombre || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{m.nombre}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{m.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Selección de membresía */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <CardIcon />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Plan de Membresía</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {membresiasFiltradas.map(m => {
                  const selected = membresia?.id_membresia === m.id_membresia || membresia?.id === m.id;
                  return (
                    <button
                      key={m.id_membresia || m.id} type="button"
                      onClick={() => setMembresia(selected ? null : m)}
                      style={{
                        padding: "14px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                        border: selected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: selected ? "var(--accent-dim)" : "var(--bg-input)",
                        transition: "all .15s",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{m.nombre}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", marginBottom: 4 }}>{fmt(m.precio)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {m.duracion_meses === 1 ? "1 mes" : `${m.duracion_meses} meses`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Método de pago */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <MoneyIcon />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Método de Pago</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: metodo !== "Efectivo" ? 14 : 0 }}>
                {["Efectivo", "Tarjeta", "Transferencia"].map(m => (
                  <button
                    key={m} type="button"
                    onClick={() => setMetodo(m)}
                    style={{
                      padding: "10px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                      border: metodo === m ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: metodo === m ? "var(--accent-dim)" : "var(--bg-input)",
                      color: metodo === m ? "var(--accent-soft)" : "var(--text-secondary)",
                      transition: "all .15s",
                    }}
                  >{m}</button>
                ))}
              </div>
              {metodo === "Tarjeta" && (
                <div>
                  <label style={labelSt}>Número de tarjeta</label>
                  <input style={inputSt} placeholder="**** **** **** ****" value={tarjeta} onChange={e => setTarjeta(e.target.value)} maxLength={19} />
                </div>
              )}
              {metodo === "Transferencia" && (
                <div>
                  <label style={labelSt}>Referencia / CLABE</label>
                  <input style={inputSt} placeholder="Referencia de transferencia" value={referencia} onChange={e => setReferencia(e.target.value)} />
                </div>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              style={{
                padding: "14px 0", borderRadius: 10, border: "none",
                background: canSubmit ? "var(--accent)" : "var(--border-hover)",
                color: canSubmit ? "#fff" : "var(--text-secondary)",
                fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all .2s",
              }}
            >
              {submitting ? "Registrando…" : "Registrar Pago"}
            </button>

            {/* ── Cobro en línea: el miembro paga con PayPal o Mercado Pago ──
                El dinero llega directo a la cuenta configurada por el gimnasio. */}
            {miembro && membresia && (
              <div style={{
                borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4,
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    O cobra en línea
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                    Se abrirá la pasarela para cobrar {fmt(membresia.precio)} a {miembro.nombre}.
                    El pago se registra automáticamente al confirmarse.
                  </p>
                </div>
                <BotonesPago
                  contexto="membresia"
                  monto={Number(membresia.precio)}
                  descripcion={`Membresía ${membresia.nombre || ""} — ${miembro.nombre}`}
                  referenciaLocal={miembro._id || miembro.id}
                  emailPagador={miembro.email}
                />
              </div>
            )}
          </form>

          {/* ── Columna derecha: resumen / confirmación ── */}
          <div style={{ position: "sticky", top: 24 }}>
            {success ? (
              /* Confirmación */
              <div style={{ background: "var(--bg-card)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
                <div style={{ color: "var(--success)", marginBottom: 16, display: "flex", justifyContent: "center" }}><CheckIcon /></div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Pago Registrado</h3>
                <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: 13 }}>El cobro se registró exitosamente</p>
                <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "16px", textAlign: "left", marginBottom: 20 }}>
                  {[
                    ["Miembro",   success.miembro],
                    ["Plan",      success.plan],
                    ["Monto",     fmt(success.monto)],
                    ["Duración",  success.duracion === 1 ? "1 mes" : `${success.duracion} meses`],
                    ["Método",    success.metodo],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent-soft)", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                >
                  Cobrar otro
                </button>
              </div>
            ) : (
              /* Resumen del cobro */
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Resumen del cobro</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Miembro",  miembro  ? miembro.nombre   : "—"],
                    ["Plan",     membresia ? membresia.nombre : "—"],
                    ["Monto",    membresia ? fmt(membresia.precio) : "—"],
                    ["Duración", membresia ? (membresia.duracion_meses === 1 ? "1 mes" : `${membresia.duracion_meses} meses`) : "—"],
                    ["Método",   metodo],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{k}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {membresia && (
                  <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--accent-dim)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{fmt(membresia.precio)}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Total a cobrar</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
