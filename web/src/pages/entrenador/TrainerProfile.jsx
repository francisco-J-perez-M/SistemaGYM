/**
 * TrainerProfile.jsx — Perfil completo del entrenador.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Avatar · Nombre · Rol · KPIs rápidos (clientes, sesiones, rating) │
 *   └──────────────────────────────────────────────────────────┘
 *   ┌─────────────────────────┬────────────────────────────────┐
 *   │  Información Personal   │  Información Profesional       │
 *   └─────────────────────────┴────────────────────────────────┘
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Logros (si los hay)                                     │
 *   └──────────────────────────────────────────────────────────┘
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiMapPin,
  FiEdit, FiSave, FiX, FiAward,
  FiAlertCircle, FiStar, FiUsers, FiCheckCircle,
  FiClock, FiBookOpen, FiMessageSquare,
} from "react-icons/fi";
import trainerService from "../../services/entrenador/trainerService";
import "../../css/CSSUnificado.css";

// ─── Field row (view / edit) ──────────────────────────────────────────────────
function ProfileField({ icon: Icon, label, value, name, editing, onChange, type = "text", multiline = false }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
        textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6,
      }}>
        {Icon && <Icon size={12} />}
        {label}
      </label>

      {editing ? (
        multiline ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            className="input-compact"
            rows={4}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="input-compact"
          />
        )
      ) : (
        <div style={{
          padding: "11px 14px",
          background: "var(--bg-input)",
          borderRadius: 8,
          fontSize: 14,
          color: value ? "var(--text-primary)" : "var(--text-tertiary)",
          minHeight: multiline ? 90 : "auto",
          lineHeight: multiline ? 1.6 : "normal",
          whiteSpace: multiline ? "pre-wrap" : "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrainerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData]   = useState({
    name: "", email: "", phone: "", address: "",
    specialization: "", experience: "", certifications: "", bio: "",
  });
  const [stats, setStats]             = useState({
    totalClients: 0, totalSessions: 0, totalEarnings: 0,
    avgRating: 0, yearsActive: 0, certifications: 0,
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const p = await trainerService.getProfile();

      setFormData({
        name:           p.name           || "",
        email:          p.email          || "",
        phone:          p.phone          || "",
        address:        p.address        || "",
        specialization: p.specialization || "",
        experience:     p.experience     || "",
        certifications: p.certifications || "",
        bio:            p.bio            || "",
      });

      setStats({
        totalClients:  p.stats?.totalClients  ?? 0,
        totalSessions: p.stats?.totalSessions ?? 0,
        totalEarnings: p.stats?.totalEarnings ?? 0,
        avgRating:     p.stats?.avgRating     ?? 0,
        yearsActive:   p.stats?.yearsActive   ?? 0,
        certifications:p.stats?.certifications ?? 0,
      });

      setAchievements((p.achievements || []).map(a => ({ ...a })));
    } catch (err) {
      setError(err.message || "Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await trainerService.updateProfile(formData);
      await loadProfile();
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => { loadProfile(); setIsEditing(false); };

  // Initials for avatar
  const initials = formData.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");

  const ratingStars = Math.round(stats.avgRating);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-content">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
          <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="skeleton" style={{ height: 360, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 360, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">

      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: 4 }}>Mi Perfil</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Gestiona tu información personal y profesional
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {isEditing ? (
            <>
              <button className="btn-outline-small" onClick={handleCancel} disabled={saving}>
                <FiX size={14} /> Cancelar
              </button>
              <button className="btn-compact-primary" onClick={handleSave} disabled={saving}>
                <FiSave size={14} /> {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </>
          ) : (
            <button className="btn-compact-primary" onClick={() => setIsEditing(true)}>
              <FiEdit size={14} /> Editar perfil
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{
              background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 10, padding: "12px 16px", marginBottom: 18,
              color: "var(--danger)", fontSize: 13, display: "flex", gap: 10, alignItems: "center",
            }}
          >
            <FiAlertCircle size={15} /> {error}
            <button onClick={() => setError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}>
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════ TOP CARD: avatar + KPIs ══════════════════════ */}
      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: 24, marginBottom: 20 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 800, color: "#fff",
              border: "3px solid var(--border)",
              boxShadow: "0 0 0 4px rgba(99,102,241,.15)",
            }}>
              {initials || <FiUser size={32} />}
            </div>
            {isEditing && (
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 26, height: 26, borderRadius: "50%",
                background: "var(--accent)", color: "#fff", border: "2px solid var(--bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <FiEdit size={12} />
              </div>
            )}
          </div>

          {/* Name + role + stars */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {formData.name || "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, marginBottom: 8 }}>
              {formData.specialization ? `Entrenador · ${formData.specialization}` : "Entrenador Personal"}
            </div>
            {/* Rating stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {[1,2,3,4,5].map(i => (
                <FiStar key={i} size={13}
                  style={{ color: i <= ratingStars ? "#f59e0b" : "var(--border)",
                    fill: i <= ratingStars ? "#f59e0b" : "none" }} />
              ))}
              <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "Sin calificaciones"}
              </span>
            </div>
          </div>

          {/* KPI chips */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[
              { icon: FiUsers,        value: stats.totalClients,  label: "Clientes",    color: "#6366f1" },
              { icon: FiCheckCircle,  value: stats.totalSessions, label: "Sesiones",    color: "#22c55e" },
              { icon: FiClock,        value: `${stats.yearsActive} años`, label: "Experiencia", color: "#f59e0b" },
              { icon: FiAward,        value: stats.certifications,label: "Certificaciones", color: "#a855f7" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "12px 18px", background: "var(--bg-input)",
                borderRadius: 12, border: "1px solid var(--border)",
                minWidth: 90, textAlign: "center",
              }}>
                <Icon size={16} style={{ color, marginBottom: 6 }} />
                <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════ TWO-COLUMN FORMS ══════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* ── Left: Información Personal ── */}
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          style={{ padding: 22 }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <FiUser size={15} style={{ color: "var(--accent)" }} />
              Información Personal
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ProfileField icon={FiUser}   label="Nombre completo" name="name"    value={formData.name}    editing={isEditing} onChange={handleChange} />
            <ProfileField icon={FiMail}   label="Correo electrónico" name="email"  value={formData.email}   editing={isEditing} onChange={handleChange} type="email" />
            <ProfileField icon={FiPhone}  label="Teléfono"        name="phone"   value={formData.phone}   editing={isEditing} onChange={handleChange} type="tel" />
            <ProfileField icon={FiMapPin} label="Dirección"       name="address" value={formData.address} editing={isEditing} onChange={handleChange} />
          </div>
        </motion.div>

        {/* ── Right: Información Profesional ── */}
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
          style={{ padding: 22 }}
        >
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid var(--border)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <FiAward size={15} style={{ color: "var(--accent)" }} />
              Información Profesional
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <ProfileField
              icon={FiBookOpen} label="Especialización" name="specialization"
              value={formData.specialization} editing={isEditing} onChange={handleChange}
            />
            <ProfileField
              icon={FiClock} label="Experiencia" name="experience"
              value={formData.experience} editing={isEditing} onChange={handleChange}
            />
            <ProfileField
              icon={FiAward} label="Certificaciones" name="certifications"
              value={formData.certifications} editing={isEditing} onChange={handleChange}
            />
            <ProfileField
              icon={FiMessageSquare} label="Biografía / Descripción" name="bio"
              value={formData.bio} editing={isEditing} onChange={handleChange}
              multiline
            />
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════ LOGROS (si los hay) ══════════════════════ */}
      <AnimatePresence>
        {achievements.length > 0 && (
          <motion.div
            className="stat-card"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: 22 }}
          >
            <h3 style={{
              fontSize: 15, fontWeight: 700, marginBottom: 16,
              paddingBottom: 14, borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <FiAward size={15} style={{ color: "#f59e0b" }} />
              Logros y Reconocimientos
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {achievements.map((a, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  style={{
                    display: "flex", gap: 14, alignItems: "center",
                    padding: "14px 16px",
                    background: "var(--bg-input)",
                    borderRadius: 12, border: "1px solid var(--border)",
                  }}
                  whileHover={{ borderColor: "#f59e0b" }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(245,158,11,.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FiAward size={20} style={{ color: "#f59e0b" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{a.title}</div>
                    {a.description && (
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{a.description}</div>
                    )}
                    {a.date && (
                      <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 3 }}>{a.date}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
