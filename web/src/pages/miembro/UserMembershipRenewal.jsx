import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCreditCard, FiCheck, FiAlertCircle, FiDollarSign,
  FiCalendar, FiRefreshCw, FiArrowRight, FiInfo, FiSend, FiStar
} from "react-icons/fi";
import useMetodosPago from "../../hooks/useMetodosPago";
import { pagarYRedirigir, reconciliarSilencioso } from "../../api/pagosOnline";
import "../../css/CSSUnificado.css";

const fmt = (n) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n ?? 0);

// Los métodos aceptados son Efectivo, PayPal y Mercado Pago. Los dos últimos
// se añaden dinámicamente según lo que el gimnasio tenga activo (useMetodosPago).
const ICONOS_METODO = {
  Efectivo:    FiDollarSign,
  paypal:      FiCreditCard,
  mercadopago: FiCreditCard,
};

export default function UserMembershipRenewal() {
  const navigate = useNavigate();
  const [plans,          setPlans]          = useState([]);
  const [selectedPlan,   setSelectedPlan]   = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("Tarjeta");
  const [loading,        setLoading]        = useState(true);
  const [processing,     setProcessing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [success,        setSuccess]        = useState(null);
  const [currentMem,     setCurrentMem]     = useState(null);
  // Efectivo + las pasarelas que el gimnasio tenga activas
  const { metodos } = useMetodosPago("membresia");

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/", { replace: true }); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Confirma pagos en línea pendientes antes de leer el estado de la
    // membresía, para que ya se vea renovada si el pago se completó.
    await reconciliarSilencioso();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    try {
      const [plansRes, memRes] = await Promise.all([
        fetch("/api/user/membership/plans",  { headers }),
        fetch("/api/user/membership",        { headers }),
      ]);

      const plansData = plansRes.ok ? await plansRes.json() : { planes: [] };
      const memData   = memRes.ok  ? await memRes.json()   : {};

      const lista = plansData.planes || [];
      setPlans(lista);
      if (lista.length > 0) setSelectedPlan(lista[0]);
      if (memData.tieneMembresia) setCurrentMem(memData.membresia);

      setError(null);
    } catch {
      setError("No se pudieron cargar los planes de membresía.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async () => {
    if (!selectedPlan) { setError("Selecciona un plan."); return; }

    // Si el método elegido es una pasarela, el cobro ocurre en PayPal o Mercado
    // Pago: se crea la transacción y se redirige. La membresía se renueva al
    // confirmarse el pago (páginas de retorno /pago/exito).
    const metodoSel = metodos.find((m) => m.id === selectedMethod);
    if (metodoSel?.esPasarela) {
      setProcessing(true);
      setError(null);
      try {
        await pagarYRedirigir({
          proveedor: metodoSel.proveedor,
          contexto: "membresia",
          monto: Number(selectedPlan.precio),
          descripcion: `Membresía ${selectedPlan.nombre}`,
          referencia_local: selectedPlan.id_membresia,
        });
      } catch (e) {
        setError(e?.response?.data?.msg || "No se pudo iniciar el pago en línea.");
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/membership/renew", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id_membresia: selectedPlan.id_membresia, metodo_pago: selectedMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al renovar");

      setSuccess({
        nombre:   data.membresia.nombre,
        fechaFin: data.membresia.fechaFin,
        monto:    data.membresia.monto,
      });
      setTimeout(() => navigate("/user/dashboard"), 3500);
    } catch (e) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  /* ── Layout shell ─────────────────────────────── */
  const Shell = ({ children }) => (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Renovar Membresía</h2>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );

  if (loading) return (
    <Shell>
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
        <div className="dashboard-spinner" style={{ margin: "0 auto 16px" }} />
        <p>Cargando planes…</p>
      </div>
    </Shell>
  );

  /* ── Success screen ────────────────────────────── */
  if (success) return (
    <Shell>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          maxWidth: 480, margin: "60px auto", textAlign: "center",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "48px 32px",
        }}
      >
        <FiStar size={64} style={{ color: "#4ade80", opacity: 0.85, marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8, color: "var(--text-primary)" }}>¡Membresía Renovada!</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          <strong style={{ color: "var(--accent)" }}>{success.nombre}</strong>
          {" "}activa hasta el{" "}
          <strong>{new Date(success.fechaFin + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</strong>
        </p>
        <div style={{
          padding: "12px 20px", background: "var(--bg-input)",
          borderRadius: 10, display: "inline-block", marginBottom: 24,
          fontSize: 24, fontWeight: 700, color: "var(--accent)"
        }}>
          {fmt(success.monto)}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Redirigiendo al dashboard…
        </p>
      </motion.div>
    </Shell>
  );

  return (
    <Shell>
      <AnimatePresence>
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 10, color: "#f87171", marginBottom: 20, fontSize: 14,
            }}
          >
            <FiAlertCircle />
            {error}
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Membresía actual */}
      {currentMem && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 12, marginBottom: 24, fontSize: 14,
          }}
        >
          <FiInfo style={{ color: "var(--accent)", flexShrink: 0 }} size={18} />
          <span style={{ color: "var(--text-secondary)" }}>
            Membresía actual:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{currentMem.nombre}</strong>
            {" — "}vence el{" "}
            <strong style={{ color: currentMem.diasRestantes <= 7 ? "#f59e0b" : "var(--text-primary)" }}>
              {new Date(currentMem.fechaFin + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
            </strong>
            {currentMem.diasRestantes > 0
              ? ` (${currentMem.diasRestantes} días restantes)`
              : " · Vencida"}
          </span>
          <span style={{
            marginLeft: "auto", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: currentMem.diasRestantes > 7 ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.15)",
            color:      currentMem.diasRestantes > 7 ? "#4ade80"             : "#fbbf24",
          }}>
            {currentMem.diasRestantes > 7 ? "Activa" : currentMem.diasRestantes > 0 ? "Por vencer" : "Vencida"}
          </span>
        </motion.div>
      )}

      {/* Selector de planes */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
          Elige tu plan
        </h3>

        {plans.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px", background: "var(--bg-card)",
            border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-secondary)",
          }}>
            <FiAlertCircle size={36} style={{ opacity: 0.4, marginBottom: 12, color: "var(--text-secondary)" }} />
            <p>No hay planes disponibles en este gimnasio.</p>
            <button
              onClick={fetchData}
              style={{
                marginTop: 12, padding: "8px 18px", background: "var(--bg-input)",
                border: "1px solid var(--border)", borderRadius: 8,
                color: "var(--text-primary)", cursor: "pointer", display: "inline-flex",
                alignItems: "center", gap: 6, fontSize: 13,
              }}
            >
              <FiRefreshCw size={13} /> Reintentar
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {plans.map((plan, i) => {
              // Comparación por id: no depende de la referencia del objeto
              const isSelected = selectedPlan?.id_membresia === plan.id_membresia;
              const esPromo = plan.tipo === "promocion";
              return (
                // div normal (sin animación de entrada) para que al elegir otro
                // plan solo cambie la selección, sin re-animar la lista.
                <div
                  key={plan.id_membresia}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    position: "relative", padding: "24px 22px", cursor: "pointer",
                    background: isSelected ? "linear-gradient(135deg,rgba(99,102,241,.12),rgba(99,102,241,.04))" : "var(--bg-card)",
                    border: `2px solid ${isSelected ? "var(--accent)" : esPromo ? "rgba(245,158,11,.55)" : "var(--border)"}`,
                    borderRadius: 14, transition: "border-color .2s, background .2s, box-shadow .2s",
                    borderTop: `3px solid ${isSelected ? "var(--accent)" : esPromo ? "#f59e0b" : plan.ahorro > 0 ? "#22c55e" : "var(--border)"}`,
                    // Las promociones brillan para destacarse del resto
                    boxShadow: esPromo
                      ? "0 0 0 1px rgba(245,158,11,.25), 0 0 22px rgba(245,158,11,.28)"
                      : "none",
                  }}
                >
                  {plan.ahorro > 0 && !isSelected && (
                    <div style={{
                      position: "absolute", top: -1, right: 16,
                      background: "#22c55e", color: "#fff",
                      fontSize: 10, fontWeight: 700, padding: "2px 8px",
                      borderRadius: "0 0 6px 6px", letterSpacing: ".05em",
                    }}>
                      AHORRO
                    </div>
                  )}

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{
                        position: "absolute", top: 14, right: 14,
                        background: "var(--accent)", borderRadius: "50%",
                        width: 26, height: 26, display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <FiCheck size={14} color="#fff" />
                    </motion.div>
                  )}

                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: "var(--text-primary)" }}>
                    {plan.nombre}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, color: "var(--accent)" }}>
                      {fmt(plan.precio)}
                    </span>
                  </div>

                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 6, marginBottom: 12,
                    background: "var(--bg-input)", fontSize: 12, color: "var(--text-secondary)",
                  }}>
                    <FiCalendar size={11} />
                    {plan.duracion_meses === 1 ? "1 mes" : `${plan.duracion_meses} meses`}
                    {" · "}
                    {fmt(plan.precio / plan.duracion_meses)}/mes
                  </div>

                  {plan.ahorro > 0 && (
                    <div style={{
                      padding: "5px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: "rgba(34,197,94,.12)", color: "#4ade80", marginBottom: 12,
                    }}>
                      Ahorras {fmt(plan.ahorro)} vs mensual
                    </div>
                  )}

                  {plan.descripcion ? (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                      {plan.descripcion}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                      Acceso completo al gimnasio durante {plan.duracion_meses === 1 ? "1 mes" : `${plan.duracion_meses} meses`}.
                    </p>
                  )}

                  {/* Beneficios definidos por el gimnasio */}
                  {Array.isArray(plan.beneficios) && plan.beneficios.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
                      {plan.beneficios.map((b, k) => (
                        <li key={k} style={{ display: "flex", gap: 7, fontSize: 12.5, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          <FiCheck size={12} style={{ color: "#22c55e", flexShrink: 0, marginTop: 3 }} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Qué incluye el combo */}
                  {plan.es_combo && Array.isArray(plan.items_combo) && plan.items_combo.length > 0 && (
                    <div style={{ marginTop: 12, background: "var(--bg-input)", borderRadius: 8, padding: "9px 11px" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent)", letterSpacing: ".05em", marginBottom: 4 }}>
                        COMBO INCLUYE
                      </div>
                      {plan.items_combo.map((it, k) => (
                        <div key={k} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                          {it.cantidad}× {it.nombre}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vigencia de la promoción */}
                  {plan.dias_restantes_promo != null && plan.dias_restantes_promo >= 0 && (
                    <div style={{
                      marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5,
                      background: "rgba(245,158,11,.14)", color: "#f59e0b",
                      borderRadius: 7, padding: "4px 9px", fontSize: 11.5, fontWeight: 700,
                    }}>
                      <FiCalendar size={11} />
                      {plan.dias_restantes_promo === 0
                        ? "Último día"
                        : `Solo ${plan.dias_restantes_promo} día${plan.dias_restantes_promo === 1 ? "" : "s"} más`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Método de pago */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
          Método de pago
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {metodos.map((m) => {
            const sel = selectedMethod === m.id;
            const Icon = ICONOS_METODO[m.id] || FiCreditCard;
            return (
              // botón normal: al cambiar de método solo se actualiza el estilo
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  flex: "1 1 140px", padding: "16px 12px", textAlign: "center",
                  background: sel ? "linear-gradient(135deg,rgba(99,102,241,.14),rgba(99,102,241,.05))" : "var(--bg-card)",
                  border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: 12, cursor: "pointer", position: "relative",
                  transition: "border-color .2s, background .2s",
                }}
              >
                {m.esPasarela && m.modo === "sandbox" && (
                  <span style={{
                    position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 800,
                    background: "var(--bg-input)", color: "var(--text-secondary)",
                    padding: "2px 6px", borderRadius: 5, letterSpacing: ".04em",
                  }}>
                    PRUEBAS
                  </span>
                )}
                <Icon size={26} style={{ marginBottom: 6, color: sel ? "var(--accent)" : "var(--text-secondary)" }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Resumen y confirmación */}
      {selectedPlan && (
        <motion.section
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <FiCreditCard style={{ color: "var(--accent)" }} />
              Resumen de la renovación
            </h3>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <Row label="Plan" value={selectedPlan.nombre} />
            <Row label="Duración" value={selectedPlan.duracion_meses === 1 ? "1 mes" : `${selectedPlan.duracion_meses} meses`} />
            <Row label="Método" value={metodos.find(m => m.id === selectedMethod)?.label || selectedMethod} />
            {selectedPlan.ahorro > 0 && (
              <Row label="Ahorro incluido" value={`- ${fmt(selectedPlan.ahorro)}`} valueColor="#4ade80" />
            )}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Total a pagar</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{fmt(selectedPlan.precio)}</span>
            </div>

            <motion.button
              whileHover={{ scale: processing ? 1 : 1.02 }}
              whileTap={{ scale: processing ? 1 : 0.97 }}
              onClick={handleRenew}
              disabled={processing}
              style={{
                width: "100%", marginTop: 20, padding: "15px",
                background: processing ? "var(--bg-input)" : "var(--accent)",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: processing ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: processing ? 0.7 : 1, transition: "all .2s",
              }}
            >
              {processing ? (
                <><div className="dashboard-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Procesando pago…</>
              ) : (
                <>
                  <FiCheck />
                  {metodos.find(m => m.id === selectedMethod)?.esPasarela
                    ? `Pagar ${fmt(selectedPlan.precio)} con ${metodos.find(m => m.id === selectedMethod)?.label}`
                    : `Confirmar y pagar ${fmt(selectedPlan.precio)}`}
                  <FiArrowRight />
                </>
              )}
            </motion.button>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-secondary)", marginTop: 12 }}>
              Al confirmar aceptas los términos y condiciones del gimnasio.
            </p>

          </div>
        </motion.section>
      )}
    </Shell>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 14 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: valueColor || "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
