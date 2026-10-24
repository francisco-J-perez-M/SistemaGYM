/**
 * pages/publico/Landing.jsx — Página comercial de GymPro.
 *
 * Es la nueva "/" (antes el login vivía ahí, ver App.jsx y la nota en
 * AuthPage.jsx): lo primero que ve cualquier visitante, sin sesión. De
 * aquí se sale hacia /login o /register-gym -- esta página en sí no
 * llama a ningún endpoint que requiera autenticación.
 *
 * El carrusel de gimnasios y los testimonios se alimentan de datos reales
 * (api/landing.js -> api/app/routes/publico/landing.py): lo que cada
 * gimnasio subió desde su panel (OwnerPerfilPublico.jsx), nunca nombres o
 * citas inventadas. Mientras ningún gimnasio haya subido fotos o
 * testimonios todavía, ambas secciones muestran un estado vacío honesto
 * en vez de ocultarse o rellenarse con datos de relleno.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";
import {
  FiSun, FiMoon, FiStar, FiUsers, FiDollarSign, FiBarChart2, FiSmartphone,
  FiActivity, FiMapPin, FiArrowRight, FiBriefcase, FiUserCheck, FiHeadphones,
  FiCreditCard, FiTrendingUp,
} from "react-icons/fi";
import { GiPineTree } from "react-icons/gi";
import { getGimnasiosDestacados, getTestimoniosDestacados } from "../../api/landing";
import "../../css/CSSUnificado.css";

const FUNCIONALIDADES = [
  { icon: <FiUsers />,       titulo: "Gestión de socios",        texto: "Altas, bajas, membresías y control de accesos en un solo lugar." },
  { icon: <FiDollarSign />,  titulo: "Pagos y punto de venta",    texto: "Cobros en línea con PayPal y Mercado Pago, más punto de venta en recepción." },
  { icon: <FiBarChart2 />,   titulo: "Reportes e IA",             texto: "Predicción de cancelaciones, segmentación de socios y tendencias de negocio." },
  { icon: <FiSmartphone />,  titulo: "App para tus socios",       texto: "Tus socios reservan, pagan y siguen su progreso desde su propio teléfono." },
  { icon: <FiActivity />,    titulo: "Rutinas y nutrición con IA", texto: "Importa rutinas desde PDF o Excel y genera planes de nutrición asistidos por IA." },
  { icon: <FiMapPin />,      titulo: "Multi-sucursal",            texto: "Administra varias sedes bajo una sola organización, cada una con su propio equipo." },
];

const ROLES = [
  { icon: <FiBriefcase />,  nombre: "Propietario",   texto: "Ve todo el negocio: miembros, pagos, reportes, IA y la configuración de todas sus sucursales." },
  { icon: <FiUserCheck />,  nombre: "Administrador", texto: "Gestiona el día a día de una sucursal con los mismos permisos operativos que el Propietario." },
  { icon: <FiActivity />,   nombre: "Entrenador",    texto: "Da seguimiento a sus clientes: rutinas, dietas, reportes de desempeño y mensajes." },
  { icon: <FiHeadphones />, nombre: "Recepcionista", texto: "Atiende el mostrador: check-ins, punto de venta, citas y cobros del día a día." },
  { icon: <FiCreditCard />, nombre: "Miembro",       texto: "Reserva, paga su membresía y sigue su propio progreso desde la app o la web." },
];

const S = {
  page: { minHeight: "100vh", background: "var(--bg-main)", color: "var(--text-primary)", fontFamily: "Inter, system-ui, sans-serif" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 10, padding: "16px 28px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg-main)", zIndex: 20 },
  brand: { display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18, color: "var(--text-primary)", textDecoration: "none" },
  navLinks: { display: "flex", alignItems: "center", gap: 24 },
  navLink: { color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  navActions: { display: "flex", alignItems: "center", gap: 12 },
  themeBtn: { width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  linkBtn: { color: "var(--text-primary)", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "9px 14px" },
  ctaBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "var(--text-on-accent)", textDecoration: "none", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer" },

  hero: { display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 48, alignItems: "center", padding: "72px 28px", maxWidth: 1180, margin: "0 auto" },
  h1: { fontSize: 44, fontWeight: 800, lineHeight: 1.12, margin: "0 0 18px" },
  h1Accent: { color: "var(--accent)" },
  heroSub: { fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 480, margin: "0 0 28px" },
  heroCtas: { display: "flex", gap: 14, flexWrap: "wrap" },
  secondaryBtn: { display: "inline-flex", alignItems: "center", gap: 8, background: "var(--bg-card)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)" },

  previewCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 18 },
  previewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  previewKpis: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 },
  kpiBox: { background: "var(--bg-main)", borderRadius: 10, padding: "12px 14px" },
  kpiLabel: { fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 },
  kpiVal: { fontSize: 19, fontWeight: 800 },
  previewBarRow: { display: "flex", alignItems: "flex-end", gap: 6, height: 70, background: "var(--bg-main)", borderRadius: 10, padding: "10px 14px" },
  previewBar: (h, c) => ({ flex: 1, height: `${h}%`, background: c || "var(--accent)", borderRadius: 4, opacity: 0.85 }),
  previewNote: { fontSize: 11, color: "var(--text-tertiary)", marginTop: 10, textAlign: "center" },

  section: { padding: "64px 28px", maxWidth: 1180, margin: "0 auto" },
  sectionAlt: { padding: "64px 28px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" },
  sectionTitle: { fontSize: 28, fontWeight: 800, textAlign: "center", margin: "0 0 8px" },
  sectionSub: { fontSize: 14.5, color: "var(--text-secondary)", textAlign: "center", margin: "0 auto 40px", maxWidth: 560 },

  grid6: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 },
  featureCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 20px" },
  featureIcon: { width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 14 },
  featureTitulo: { fontSize: 15.5, fontWeight: 700, margin: "0 0 6px" },
  featureTexto: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 },

  grid5: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 },
  roleCard: { background: "var(--bg-main)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 18px", textAlign: "center" },
  roleIcon: { width: 44, height: 44, borderRadius: 999, background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, margin: "0 auto 12px" },
  roleNombre: { fontSize: 14.5, fontWeight: 700, margin: "0 0 6px" },
  roleTexto: { fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 },

  marqueeViewport: { overflow: "hidden", margin: "0 -28px" },
  marqueeTrack: { display: "flex", gap: 20, width: "max-content", animation: "gympro-marquee 32s linear infinite" },
  gymCard: { width: 220, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)", flexShrink: 0 },
  gymImg: { width: "100%", height: 130, objectFit: "cover", display: "block", background: "var(--bg-input)" },
  gymNombre: { padding: "10px 12px", fontSize: 13.5, fontWeight: 700 },
  gymDireccion: { padding: "0 12px 12px", fontSize: 11.5, color: "var(--text-tertiary)", marginTop: -6 },

  testiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 },
  testiCard: { background: "var(--bg-main)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 20px" },
  testiTexto: { fontSize: 13.5, color: "var(--text-primary)", lineHeight: 1.55, margin: "10px 0 14px" },
  testiAutor: { fontSize: 13, fontWeight: 700 },
  testiCargo: { fontSize: 12, color: "var(--text-secondary)" },
  testiGimnasio: { fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 },

  emptyBox: { textAlign: "center", padding: "32px 20px", color: "var(--text-tertiary)", fontSize: 13.5, fontStyle: "italic", border: "1px dashed var(--border)", borderRadius: 14 },

  ctaBand: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap", background: "var(--bg-sidebar)", color: "#fff", borderRadius: 20, padding: "32px 36px", margin: "0 28px 64px", maxWidth: 1180, marginLeft: "auto", marginRight: "auto" },
  ctaBandTitle: { fontSize: 20, fontWeight: 800, margin: "0 0 4px" },
  ctaBandSub: { fontSize: 13.5, color: "rgba(255,255,255,.7)", margin: 0 },

  footer: { borderTop: "1px solid var(--border)", padding: "28px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, maxWidth: 1180, margin: "0 auto" },
  footerLinks: { display: "flex", gap: 18 },
  footerLink: { color: "var(--text-secondary)", fontSize: 13, textDecoration: "none" },
};

function Estrellas({ valor }) {
  if (!valor) return null;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar key={n} size={13} style={{ color: n <= valor ? "var(--warning)" : "var(--border)" }} fill={n <= valor ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

// Una tarjeta por gimnasio: si el propietario subio mas de una foto, la
// imagen mostrada va rotando sola cada 5s para que todas se terminen viendo
// (antes solo se mostraba imagenes[0], las demas fotos subidas nunca se
// llegaban a ver en la pagina publica).
function GymCard({ g }) {
  const imagenes = g.imagenes && g.imagenes.length > 0 ? g.imagenes : [];
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return undefined;
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  return (
    <div style={S.gymCard}>
      <img src={imagenes[indice]} alt={g.nombre} style={S.gymImg} />
      <div style={S.gymNombre}>{g.nombre}</div>
      {g.direccion && <div style={S.gymDireccion}>{g.direccion}</div>}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const [gimnasios, setGimnasios] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // El carrusel de gimnasios arranca "congelado" en la primera tarjeta
  // (animation-play-state: paused) y solo empieza a moverse la primera vez
  // que la seccion entra en el viewport -- si no, para cuando el usuario de
  // verdad scrollea hasta aqui el carrusel ya llevaba rato corriendo solo y
  // parecia arrancar a medias (mostrando ya la segunda tarjeta en vez de la
  // primera).
  const gimnasiosSectionRef = useRef(null);
  const [marqueeEnCurso, setMarqueeEnCurso] = useState(false);
  const [marqueeEnPausaPorHover, setMarqueeEnPausaPorHover] = useState(false);

  useEffect(() => {
    // Peticiones independientes a proposito: si una falla (p. ej. el
    // carrusel de gimnasios) no debe ocultar los datos de la otra que si
    // cargaron bien (p. ej. los testimonios).
    getGimnasiosDestacados()
      .then((res) => setGimnasios(res.data || []))
      .catch(() => { /* la landing debe seguir viéndose bien aunque esto falle */ });

    getTestimoniosDestacados()
      .then((res) => setTestimonios(res.data || []))
      .catch(() => { /* la landing debe seguir viéndose bien aunque esto falle */ })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const el = gimnasiosSectionRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setMarqueeEnCurso(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const irA = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleTheme = () => changeTheme(theme === "dark" ? "light" : "dark");

  // Se repite la lista para que la animación de desplazamiento continuo
  // (CSS puro, sin librería) no deje un hueco en blanco al llegar al final.
  const gimnasiosParaMarquee = gimnasios.length > 0 ? [...gimnasios, ...gimnasios] : [];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes gympro-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (max-width: 900px) {
          .gympro-hero { grid-template-columns: 1fr !important; }
          .gympro-nav-links { display: none !important; }
        }
        @media (max-width: 480px) {
          .gympro-nav { padding: 12px 16px; }
        }
      `}</style>

      <nav className="gympro-nav" style={S.nav}>
        <Link to="/" style={S.brand}>
          <img src="/logo64.png" alt="GymPro" style={{ width: 26, height: 26, borderRadius: 6 }} />
          GymPro
        </Link>
        <div className="gympro-nav-links" style={S.navLinks}>
          <span style={S.navLink} onClick={() => irA("funcionalidades")}>Funcionalidades</span>
          <span style={S.navLink} onClick={() => irA("roles")}>Roles</span>
          <span style={S.navLink} onClick={() => irA("gimnasios")}>Gimnasios</span>
        </div>
        <div style={S.navActions}>
          <button style={S.themeBtn} onClick={toggleTheme} title="Cambiar tema" aria-label="Cambiar tema">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/login" style={S.linkBtn}>Iniciar sesión</Link>
          <button style={S.ctaBtn} onClick={() => navigate("/register-gym")}>
            Registra tu gimnasio <FiArrowRight />
          </button>
        </div>
      </nav>

      <header className="gympro-hero" style={S.hero}>
        <div>
          <h1 style={S.h1}>Gestiona tu gimnasio.<br /><span style={S.h1Accent}>Hazlo crecer.</span></h1>
          <p style={S.heroSub}>
            GymPro automatiza la administración de tu gimnasio y mejora la retención
            de tus socios con seguimiento personalizado: membresías, pagos, reportes
            con IA y una app para que tus socios sigan su progreso.
          </p>
          <div style={S.heroCtas}>
            <button style={S.ctaBtn} onClick={() => navigate("/register-gym")}>
              Registra tu gimnasio <FiArrowRight />
            </button>
            <Link to="/login" style={S.secondaryBtn}>Iniciar sesión</Link>
          </div>
        </div>

        {/* Vista previa ilustrativa del panel -- no es una captura real de
            ningún cliente, son cifras de ejemplo para mostrar la forma del
            producto (mismo recurso que usan la mayoría de las páginas de
            SaaS para explicar el dashboard sin exponer datos reales). */}
        <div style={S.previewCard}>
          <div style={S.previewTop}>
            <strong style={{ fontSize: 13 }}>Resumen del gimnasio</strong>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Vista de ejemplo</span>
          </div>
          <div style={S.previewKpis}>
            <div style={S.kpiBox}><div style={S.kpiLabel}>Socios activos</div><div style={S.kpiVal}>248</div></div>
            <div style={S.kpiBox}><div style={S.kpiLabel}>Ingresos del mes</div><div style={S.kpiVal}>$52,400</div></div>
          </div>
          <div style={S.previewBarRow}>
            {[40, 65, 50, 80, 60, 95, 70].map((h, i) => (
              <div key={i} style={S.previewBar(h)} />
            ))}
          </div>
          <p style={S.previewNote}>Así de simple se ve tu negocio en un vistazo</p>
        </div>
      </header>

      <section id="funcionalidades" style={S.section}>
        <h2 style={S.sectionTitle}>Todo lo que tu gimnasio necesita</h2>
        <p style={S.sectionSub}>Ahorra tiempo, mejora la organización y enfócate en lo más importante: tus socios.</p>
        <div style={S.grid6}>
          {FUNCIONALIDADES.map((f) => (
            <div key={f.titulo} style={S.featureCard}>
              <div style={S.featureIcon}>{f.icon}</div>
              <h3 style={S.featureTitulo}>{f.titulo}</h3>
              <p style={S.featureTexto}>{f.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" style={S.sectionAlt}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <h2 style={S.sectionTitle}>Un panel para cada persona de tu equipo</h2>
          <p style={S.sectionSub}>GymPro reparte el trabajo en 5 roles, cada uno con justo lo que necesita ver.</p>
          <div style={S.grid5}>
            {ROLES.map((r) => (
              <div key={r.nombre} style={S.roleCard}>
                <div style={S.roleIcon}>{r.icon}</div>
                <h3 style={S.roleNombre}>{r.nombre}</h3>
                <p style={S.roleTexto}>{r.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gimnasios" style={S.section} ref={gimnasiosSectionRef}>
        <h2 style={S.sectionTitle}>Gimnasios que ya confían en nosotros</h2>
        <p style={S.sectionSub}>Negocios reales que administran su día a día con GymPro.</p>

        {!cargando && gimnasios.length === 0 && (
          <div style={S.emptyBox}>
            Todavía no hay gimnasios con fotos públicas. En cuanto un gimnasio suba
            las suyas desde su panel, aparecerán aquí.
          </div>
        )}

        {gimnasios.length > 0 && (
          <div style={S.marqueeViewport}>
            <div
              className="gympro-marquee-track"
              style={{
                ...S.marqueeTrack,
                animationPlayState: marqueeEnCurso && !marqueeEnPausaPorHover ? "running" : "paused",
              }}
              onMouseEnter={() => setMarqueeEnPausaPorHover(true)}
              onMouseLeave={() => setMarqueeEnPausaPorHover(false)}
            >
              {gimnasiosParaMarquee.map((g, i) => (
                <GymCard key={`${g.id}-${i}`} g={g} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section style={S.sectionAlt}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <h2 style={S.sectionTitle}>Historias reales, resultados reales</h2>
          <p style={S.sectionSub}>Lo que dicen las personas que ya usan GymPro todos los días.</p>

          {!cargando && testimonios.length === 0 && (
            <div style={S.emptyBox}>
              Todavía no hay testimonios publicados. Los propietarios pueden agregar
              el suyo desde "Perfil público" en su panel.
            </div>
          )}

          {testimonios.length > 0 && (
            <div style={S.testiGrid}>
              {testimonios.slice(0, 6).map((t) => (
                <div key={t.id} style={S.testiCard}>
                  <Estrellas valor={t.calificacion} />
                  <p style={S.testiTexto}>"{t.texto}"</p>
                  <div style={S.testiAutor}>{t.autor_nombre}</div>
                  {t.autor_cargo && <div style={S.testiCargo}>{t.autor_cargo}</div>}
                  {t.gimnasio_nombre && <div style={S.testiGimnasio}>{t.gimnasio_nombre}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div style={S.ctaBand}>
        <div>
          <h3 style={S.ctaBandTitle}>¿Listo para llevar tu gimnasio al siguiente nivel?</h3>
          <p style={S.ctaBandSub}>Crea tu cuenta y configura tu gimnasio en minutos.</p>
        </div>
        <button style={S.ctaBtn} onClick={() => navigate("/register-gym")}>
          Registra tu gimnasio <FiArrowRight />
        </button>
      </div>

      <footer style={S.footer}>
        <Link to="/" style={{ ...S.brand, fontSize: 15 }}>
          <img src="/logo64.png" alt="GymPro" style={{ width: 20, height: 20, borderRadius: 5 }} />
          GymPro
        </Link>
        <div style={S.footerLinks}>
          <Link to="/privacidad" target="_blank" rel="noopener noreferrer" style={S.footerLink}>Privacidad</Link>
          <a href="mailto:soporteGympro@gmail.com" style={S.footerLink}>Contacto</a>
          <Link to="/login" style={S.footerLink}>Iniciar sesión</Link>
        </div>
      </footer>
    </div>
  );
}
