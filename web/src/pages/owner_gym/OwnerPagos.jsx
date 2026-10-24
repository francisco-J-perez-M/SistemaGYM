/**
 * OwnerPagos.jsx — Configuración de cobros en línea del gimnasio.
 *
 * El dueño registra aquí SUS credenciales de PayPal y/o Mercado Pago. Con ello,
 * el dinero de membresías y productos se deposita directamente en su cuenta:
 * la plataforma no retiene ni administra esos fondos.
 *
 * Las credenciales se envían una sola vez y el servidor las guarda cifradas;
 * al volver a esta pantalla solo se muestra una pista de los últimos caracteres.
 */
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  FiCreditCard, FiCheckCircle, FiAlertTriangle, FiSave, FiTrash2, FiRefreshCw, FiLock,
} from "react-icons/fi";
import {
  getPasarelas, guardarPasarela, probarPasarela, togglePasarela, eliminarPasarela,
} from "../../api/pagos";

const card = (extra = {}) => ({
  background: "var(--bg-card)", border: "1px solid var(--border)",
  borderRadius: 14, padding: "20px 22px", ...extra,
});
const inputStyle = {
  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "9px 12px", color: "var(--text-primary)", fontSize: 13,
};
const btn = (variant = "primary") => {
  const v = {
    primary: { background: "var(--accent)", color: "#111" },
    ghost:   { background: "rgba(255,255,255,.06)", color: "var(--text-secondary)" },
    danger:  { background: "rgba(239,68,68,.12)", color: "var(--danger)" },
    success: { background: "rgba(16,185,129,.12)", color: "var(--success)" },
  };
  return {
    border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13,
    fontWeight: 600, cursor: "pointer", display: "inline-flex",
    alignItems: "center", gap: 6, ...(v[variant] || v.primary),
  };
};
const alerta = (icon, title, text) =>
  Swal.fire({ icon, title, text, background: "var(--bg-card)", color: "var(--text-primary)" });

function TarjetaPasarela({ pasarela, onRecargar }) {
  const [form, setForm]   = useState({});
  const [modo, setModo]   = useState(pasarela.modo || "sandbox");
  const [moneda, setMoneda] = useState(pasarela.moneda || "MXN");
  const [titular, setTitular] = useState(pasarela.titular_cuenta || "");
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando]   = useState(false);

  useEffect(() => {
    setModo(pasarela.modo || "sandbox");
    setMoneda(pasarela.moneda || "MXN");
    setTitular(pasarela.titular_cuenta || "");
    setForm({});
  }, [pasarela]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarPasarela(pasarela.proveedor, {
        credenciales: form, modo, moneda, titular_cuenta: titular,
      });
      setForm({});
      await onRecargar();
      alerta("success", "Configuración guardada",
        "Ahora prueba la conexión para confirmar que las credenciales funcionan.");
    } catch (e) {
      alerta("error", "No se pudo guardar", e?.response?.data?.msg || "Error inesperado");
    } finally { setGuardando(false); }
  };

  const probar = async () => {
    setProbando(true);
    try {
      const { data } = await probarPasarela(pasarela.proveedor);
      await onRecargar();
      alerta("success", "Conexión correcta", data.msg);
    } catch (e) {
      alerta("error", "Falló la conexión", e?.response?.data?.msg || "Revisa las credenciales");
      await onRecargar();
    } finally { setProbando(false); }
  };

  const alternar = async () => {
    try {
      const { data } = await togglePasarela(pasarela.proveedor);
      await onRecargar();
      alerta("success", data.msg, data.activo
        ? "Tus clientes ya pueden pagar con este método."
        : "Este método dejó de ofrecerse en los cobros.");
    } catch (e) {
      alerta("error", "No se pudo cambiar", e?.response?.data?.msg || "Error inesperado");
    }
  };

  const borrar = async () => {
    const { isConfirmed } = await Swal.fire({
      title: `Eliminar credenciales de ${pasarela.nombre}`,
      text: "Se borrarán las credenciales guardadas y dejarás de cobrar con este método.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar", confirmButtonColor: "var(--danger)",
      background: "var(--bg-card)", color: "var(--text-primary)",
    });
    if (!isConfirmed) return;
    try {
      await eliminarPasarela(pasarela.proveedor);
      await onRecargar();
      alerta("success", "Credenciales eliminadas", "");
    } catch (e) {
      alerta("error", "No se pudo eliminar", e?.response?.data?.msg || "Error inesperado");
    }
  };

  const listo = pasarela.configurado;
  const verificado = !!pasarela.verificado_en;

  return (
    <div style={card({ marginBottom: 18 })}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiCreditCard style={{ fontSize: 22, color: "var(--accent)" }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              {pasarela.nombre}
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
              {pasarela.ayuda}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {listo && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
              background: pasarela.activo ? "rgba(16,185,129,.15)" : "rgba(148,163,184,.15)",
              color: pasarela.activo ? "var(--success)" : "var(--text-secondary)",
            }}>
              {pasarela.activo ? "Activo" : "Inactivo"}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
            background: "var(--bg-input)", color: "var(--text-secondary)",
          }}>
            {modo === "live" ? "Producción" : "Pruebas"}
          </span>
        </div>
      </div>

      {/* Estado de verificación */}
      {listo && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
          padding: "10px 12px", borderRadius: 8, fontSize: 12.5,
          background: verificado ? "rgba(16,185,129,.10)" : "rgba(234,179,8,.10)",
          color: verificado ? "var(--success)" : "var(--warning)",
        }}>
          {verificado ? <FiCheckCircle /> : <FiAlertTriangle />}
          <span>
            {verificado
              ? `Credenciales verificadas correctamente (${pasarela.credencial_pista || "guardadas"}).`
              : pasarela.ultimo_error || "Credenciales guardadas pero sin verificar. Pulsa 'Probar conexión'."}
          </span>
        </div>
      )}

      {/* Campos de credenciales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {pasarela.campos.map((campo) => (
          <div key={campo.clave}>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
              {campo.etiqueta} {campo.secreto && <FiLock style={{ verticalAlign: "-1px" }} />}
            </label>
            <input
              type={campo.secreto ? "password" : "text"}
              value={form[campo.clave] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [campo.clave]: e.target.value }))}
              placeholder={listo ? "Guardado — escribe para reemplazar" : campo.etiqueta}
              autoComplete="off"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Ajustes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Modo</label>
          <select value={modo} onChange={(e) => setModo(e.target.value)} style={inputStyle}>
            <option value="sandbox">Pruebas (sandbox)</option>
            <option value="live">Producción (dinero real)</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>Moneda</label>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={inputStyle}>
            <option value="MXN">MXN — Peso mexicano</option>
            <option value="USD">USD — Dólar</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
            Titular de la cuenta (informativo)
          </label>
          <input value={titular} onChange={(e) => setTitular(e.target.value)}
                 placeholder="Nombre o correo de la cuenta receptora" style={inputStyle} />
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn("primary")} onClick={guardar} disabled={guardando}>
          <FiSave /> {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button style={btn("ghost")} onClick={probar} disabled={!listo || probando}>
          <FiRefreshCw /> {probando ? "Probando…" : "Probar conexión"}
        </button>
        {listo && (
          <button style={btn(pasarela.activo ? "ghost" : "success")} onClick={alternar}>
            {pasarela.activo ? "Desactivar" : "Activar cobros"}
          </button>
        )}
        {listo && (
          <button style={btn("danger")} onClick={borrar}>
            <FiTrash2 /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

export default function OwnerPagos() {
  const [pasarelas, setPasarelas] = useState([]);
  const [cifrado, setCifrado]     = useState(true);
  const [loading, setLoading]     = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getPasarelas();
      setPasarelas(data.pasarelas || []);
      setCifrado(data.cifrado_disponible !== false);
    } catch (e) {
      setPasarelas([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "var(--bg-input)" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
          Cobros en línea
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Conecta tus cuentas de PayPal y Mercado Pago para cobrar membresías y productos.
          El dinero se deposita directamente en tu cuenta.
        </p>
      </div>

      {!cifrado && (
        <div style={card({ marginBottom: 18, borderLeft: "3px solid var(--danger)" })}>
          <p style={{ fontSize: 13, color: "var(--danger)", margin: 0 }}>
            El servidor no tiene configurada la clave de cifrado de credenciales.
            Contacta al administrador de la plataforma antes de capturar tus datos.
          </p>
        </div>
      )}

      <div style={card({ marginBottom: 18, borderLeft: "3px solid var(--accent)" })}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          <b style={{ color: "var(--text-primary)" }}>¿Cómo funciona?</b> Cada gimnasio usa sus
          propias credenciales, así que los pagos de tus clientes llegan a tu cuenta sin
          intermediarios. Empieza en modo <b>Pruebas</b> para validar el flujo sin mover dinero
          real y, cuando todo funcione, cambia a <b>Producción</b>.
        </p>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Cargando configuración…</p>
      ) : (
        pasarelas.map((p) => (
          <TarjetaPasarela key={p.proveedor} pasarela={p} onRecargar={cargar} />
        ))
      )}
    </div>
  );
}
