import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar, FiClock, FiUser, FiPlus, FiTrash2,
  FiCheckCircle, FiAlertCircle,
} from "react-icons/fi";
import "../../css/CSSUnificado.css";

const TIMES = ["08:00","09:00","09:30","10:00","10:30","11:00","11:30",
               "12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

const TYPES = [
  "Evaluación - Nuevo cliente",
  "Tour de instalaciones",
  "Renovación de membresía",
  "Clase grupal",
  "Sesión personal",
  "Otro",
];

const INITIAL = [
  { id: 1, time: "09:00", client: "María González",  type: "Evaluación - Nuevo cliente", trainer: "Coach López",    status: "confirmada" },
  { id: 2, time: "10:30", client: "Carlos Ruiz",     type: "Sesión personal",            trainer: "Coach Martínez", status: "pendiente"  },
  { id: 3, time: "12:00", client: "Familia Rodríguez", type: "Tour de instalaciones",   trainer: "Recepción",      status: "confirmada" },
  { id: 4, time: "16:00", client: "Ana Torres",      type: "Renovación de membresía",    trainer: "Recepción",      status: "pendiente"  },
];

const today = new Date().toISOString().split("T")[0];

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState(INITIAL);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: "09:00", client: "", type: TYPES[0], trainer: "", notes: "" });
  const [nextId, setNextId] = useState(5);

  const handleAdd = () => {
    if (!form.client.trim()) return;
    setAppointments(prev => [...prev, { ...form, id: nextId, status: "pendiente" }]);
    setNextId(n => n + 1);
    setForm({ time: "09:00", client: "", type: TYPES[0], trainer: "", notes: "" });
    setShowForm(false);
  };

  const toggleStatus = (id) =>
    setAppointments(prev =>
      prev.map(a => a.id === id
        ? { ...a, status: a.status === "confirmada" ? "pendiente" : "confirmada" }
        : a
      )
    );

  const remove = (id) => setAppointments(prev => prev.filter(a => a.id !== id));

  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="dashboard-content">
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Citas y Agenda
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            Gestión de citas del día — recepción
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: "9px 14px", background: "var(--bg-input)",
              border: "1px solid var(--border)", borderRadius: "var(--r-md)",
              color: "var(--text-primary)", fontSize: "13px",
            }}
          />
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", background: "var(--accent)",
              border: "none", color: "#fff", borderRadius: "var(--r-md)",
              cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}
          >
            <FiPlus size={14} /> Nueva cita
          </motion.button>
        </div>
      </motion.div>

      {/* Formulario nueva cita */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ overflow: "hidden", marginBottom: "20px" }}
          >
            <div className="chart-card" style={{ padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
                Nueva Cita
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                {[
                  { label: "Hora", key: "time", type: "select", options: TIMES },
                  { label: "Cliente", key: "client", type: "text", placeholder: "Nombre del cliente" },
                  { label: "Tipo", key: "type", type: "select", options: TYPES },
                  { label: "Encargado", key: "trainer", type: "text", placeholder: "Coach o área" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700,
                      color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                      {f.label}
                    </label>
                    {f.type === "select" ? (
                      <select
                        value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px",
                          background: "var(--bg-input)", border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px" }}
                      >
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text" value={form[f.key]} placeholder={f.placeholder}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px",
                          background: "var(--bg-input)", border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)", color: "var(--text-primary)", fontSize: "13px",
                          boxSizing: "border-box" }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)}
                  style={{ padding: "9px 18px", background: "transparent",
                    border: "1px solid var(--border)", color: "var(--text-secondary)",
                    borderRadius: "var(--r-md)", cursor: "pointer", fontSize: "13px" }}>
                  Cancelar
                </button>
                <button onClick={handleAdd}
                  style={{ padding: "9px 18px", background: "var(--accent)",
                    border: "none", color: "#fff", borderRadius: "var(--r-md)",
                    cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                  Guardar cita
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de citas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sorted.length === 0 ? (
          <div className="chart-card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            No hay citas para esta fecha.
          </div>
        ) : sorted.map((a, i) => (
          <motion.div
            key={a.id}
            className="chart-card member-card-hover"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}
          >
            <div style={{
              width: "60px", textAlign: "center", flexShrink: 0,
              background: "var(--bg-input)", borderRadius: "var(--r-md)",
              padding: "8px 4px",
            }}>
              <FiClock size={14} style={{ color: "var(--accent-soft)" }} />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                {a.time}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                {a.client}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {a.type}
              </div>
              {a.trainer && (
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px",
                  display: "flex", alignItems: "center", gap: "4px" }}>
                  <FiUser size={10} /> {a.trainer}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{
                padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 600,
                background: a.status === "confirmada" ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                color: a.status === "confirmada" ? "#22c55e" : "#eab308",
              }}>
                {a.status}
              </span>

              <motion.button
                onClick={() => toggleStatus(a.id)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                title={a.status === "confirmada" ? "Marcar pendiente" : "Confirmar"}
                style={{
                  background: "transparent", border: "none",
                  color: a.status === "confirmada" ? "#22c55e" : "var(--text-secondary)",
                  cursor: "pointer", padding: "4px",
                }}
              >
                <FiCheckCircle size={18} />
              </motion.button>

              <motion.button
                onClick={() => remove(a.id)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                title="Eliminar cita"
                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
              >
                <FiTrash2 size={16} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resumen del día */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{
          marginTop: "24px", padding: "16px 20px", borderRadius: "var(--r-lg)",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          display: "flex", gap: "24px", flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCalendar size={16} style={{ color: "var(--accent-soft)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Total: <strong style={{ color: "var(--text-primary)" }}>{appointments.length}</strong> citas
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={16} style={{ color: "#22c55e" }} />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Confirmadas: <strong style={{ color: "#22c55e" }}>
              {appointments.filter(a => a.status === "confirmada").length}
            </strong>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiAlertCircle size={16} style={{ color: "#eab308" }} />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Pendientes: <strong style={{ color: "#eab308" }}>
              {appointments.filter(a => a.status === "pendiente").length}
            </strong>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
