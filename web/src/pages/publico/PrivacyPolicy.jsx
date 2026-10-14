import { Link } from "react-router-dom";
import { FiArrowLeft, FiShield, FiMail } from "react-icons/fi";
import "../../css/CSSUnificado.css";

const ULTIMA_ACTUALIZACION = "14 de octubre de 2026";
const CORREO_SOPORTE = "soporteGympro@gmail.com";

const page = {
  minHeight: "100vh",
  background: "var(--bg-main, #040B07)",
  color: "var(--text-primary, #E5FDF1)",
  padding: "0 0 64px",
};

const topBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 24px",
  borderBottom: "1px solid var(--border, rgba(0,255,163,0.15))",
  marginBottom: 32,
};

const brand = {
  fontWeight: 800,
  fontSize: 20,
  letterSpacing: 1,
  color: "var(--accent, #00FFA3)",
  textDecoration: "none",
};

const backLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "var(--text-secondary, #82C2A1)",
  textDecoration: "none",
  fontSize: 14,
};

const container = {
  maxWidth: 820,
  margin: "0 auto",
  padding: "0 24px",
};

const heroBox = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 8,
};

const h1 = { fontSize: 32, fontWeight: 800, margin: 0 };

const subtitle = {
  color: "var(--text-secondary, #82C2A1)",
  fontSize: 14,
  marginTop: 6,
  marginBottom: 36,
};

const card = {
  background: "var(--bg-card, #0B1610)",
  border: "1px solid var(--border, rgba(0,255,163,0.15))",
  borderRadius: 16,
  padding: "28px 32px",
  marginBottom: 20,
};

const h2 = {
  fontSize: 19,
  fontWeight: 700,
  color: "var(--accent-soft, #4DFFBC)",
  marginTop: 0,
  marginBottom: 12,
};

const p = { lineHeight: 1.7, color: "var(--text-primary, #E5FDF1)", marginBottom: 12, fontSize: 15 };

const ul = { lineHeight: 1.7, color: "var(--text-primary, #E5FDF1)", fontSize: 15, paddingLeft: 20, marginBottom: 12 };

const strong = { color: "var(--accent-soft, #4DFFBC)" };

const contactBox = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--accent-dim, rgba(0,255,163,0.15))",
  color: "var(--accent-soft, #4DFFBC)",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: 14,
};

export default function PrivacyPolicy() {
  return (
    <div style={page}>
      <div style={topBar}>
        <Link to="/" style={brand}>GYM PRO</Link>
        <Link to="/" style={backLink}><FiArrowLeft /> Volver al inicio</Link>
      </div>

      <div style={container}>
        <div style={heroBox}>
          <FiShield size={28} color="var(--accent, #00FFA3)" />
          <h1 style={h1}>Política de Privacidad</h1>
        </div>
        <p style={subtitle}>
          GymPro — desarrollado por <strong style={{ color: "inherit" }}>PanTech</strong>. Última actualización: {ULTIMA_ACTUALIZACION}.
        </p>

        <div style={card}>
          <h2 style={h2}>1. Introducción</h2>
          <p style={p}>
            Esta Política de Privacidad explica qué información personal recopila <strong style={strong}>GymPro</strong> (la
            plataforma web y la aplicación móvil para la gestión de gimnasios, desarrollada por PanTech), cómo la usamos,
            con quién la compartimos y qué derechos tienes sobre ella. Aplica a toda persona que use GymPro: socios y
            miembros de un gimnasio, entrenadores, personal de recepción y propietarios de gimnasios que contratan la
            plataforma.
          </p>
          <p style={p}>
            Al crear una cuenta, registrarte como miembro de un gimnasio o usar cualquiera de nuestras funciones,
            aceptas las prácticas descritas en este documento.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>2. ¿Quién es el responsable de tus datos?</h2>
          <p style={p}>
            <strong style={strong}>PanTech</strong> es el equipo que desarrolla y opera GymPro, y actúa como responsable
            técnico del tratamiento de los datos dentro de la plataforma. Cada gimnasio que usa GymPro (por ejemplo, el
            gimnasio en el que estás inscrito) es responsable de la relación comercial contigo como socio y decide qué
            personal de su propio gimnasio puede ver tu información dentro del sistema — nunca el personal de otro
            gimnasio, ya que GymPro aísla completamente los datos entre gimnasios distintos.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>3. Qué datos recopilamos</h2>
          <p style={p}>Para que GymPro funcione, recopilamos las siguientes categorías de datos:</p>

          <p style={{ ...p, marginBottom: 4 }}><strong style={strong}>Datos de identificación y contacto</strong></p>
          <ul style={ul}>
            <li>Nombre completo.</li>
            <li>Correo electrónico — es el identificador con el que inicias sesión y por donde te enviamos avisos
              operativos (recuperación de contraseña, confirmaciones).</li>
            <li>Número de teléfono (cuando lo proporcionas en tu perfil o en el registro).</li>
          </ul>

          <p style={{ ...p, marginBottom: 4 }}><strong style={strong}>Datos de salud y estado físico</strong></p>
          <ul style={ul}>
            <li>Peso, estatura, Índice de Masa Corporal (IMC) y medidas corporales que registras para dar seguimiento a
              tu progreso físico.</li>
            <li>Información sanitaria que decides compartir en tu perfil (por ejemplo, lesiones, condiciones médicas o
              restricciones relevantes) para que tu entrenador pueda diseñar rutinas y planes de nutrición más seguros
              para ti.</li>
            <li>Historial de entrenamientos completados, rutinas asignadas y asistencia al gimnasio.</li>
          </ul>

          <p style={{ ...p, marginBottom: 4 }}><strong style={strong}>Fotos y videos</strong></p>
          <ul style={ul}>
            <li>Tu foto de perfil.</li>
            <li>Fotos de progreso corporal que subes voluntariamente para comparar tu avance a lo largo del tiempo.</li>
            <li>Videos e imágenes de ejercicios que el personal del gimnasio carga al catálogo de rutinas.</li>
          </ul>

          <p style={{ ...p, marginBottom: 4 }}><strong style={strong}>Datos de membresía y actividad</strong></p>
          <ul style={ul}>
            <li>Historial de pagos de tu membresía: monto, fecha y método (efectivo, tarjeta, transferencia, PayPal o
              Mercado Pago, según lo que tu gimnasio tenga habilitado).</li>
            <li>Compras realizadas en el punto de venta del gimnasio (productos, suplementos, accesorios).</li>
            <li>Plan de nutrición y dietas asignadas, si tu gimnasio ofrece ese servicio.</li>
          </ul>

          <p style={{ ...p, marginBottom: 4 }}><strong style={strong}>Datos técnicos y de diagnóstico</strong></p>
          <ul style={ul}>
            <li>Registros de fallas (<em>crash logs</em>) y diagnósticos técnicos de la aplicación móvil, que usamos
              exclusivamente para detectar errores y mejorar la estabilidad de GymPro.</li>
          </ul>

          <p style={p}>
            <strong style={strong}>Lo que GymPro no recopila:</strong> no solicitamos ni almacenamos tu raza o etnia,
            creencias políticas o religiosas, ni orientación sexual. Tampoco accedemos a tus contactos, tus mensajes,
            tus archivos de audio ni a tu historial de navegación en el dispositivo.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>4. Para qué usamos tus datos</h2>
          <ul style={ul}>
            <li>Crear y administrar tu cuenta, y mantener tu sesión iniciada de forma segura.</li>
            <li>Darte seguimiento personalizado de entrenamiento, nutrición y progreso físico.</li>
            <li>Gestionar tu membresía: cobros, renovaciones, avisos de vencimiento y compras en el gimnasio.</li>
            <li>Que tu entrenador y el personal autorizado de tu propio gimnasio puedan atenderte mejor.</li>
            <li>Enviarte comunicaciones operativas necesarias para el servicio (no enviamos publicidad de terceros).</li>
            <li>Detectar y corregir errores técnicos, y mejorar el rendimiento de la aplicación.</li>
            <li>Cumplir obligaciones legales y contables del gimnasio en el que estás inscrito.</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>5. Con quién compartimos tu información</h2>
          <p style={p}>
            <strong style={strong}>Nunca vendemos tus datos a terceros con fines publicitarios.</strong> Solo
            compartimos la información estrictamente necesaria en estos casos:
          </p>
          <ul style={ul}>
            <li><strong style={strong}>Procesadores de pago</strong> — si eliges pagar tu membresía en línea, tu pago
              lo procesa directamente PayPal o Mercado Pago (según el método que elijas); GymPro no almacena los datos
              completos de tu tarjeta.</li>
            <li><strong style={strong}>Tu propio gimnasio</strong> — el personal autorizado del gimnasio en el que estás
              inscrito (entrenadores, recepción, administración) puede ver la información necesaria para prestarte el
              servicio. El sistema aísla tus datos del resto de los gimnasios que usan GymPro.</li>
            <li><strong style={strong}>Proveedores de infraestructura</strong> — la plataforma se aloja en un servidor
              que almacena la información de forma segura para que el sistema esté disponible.</li>
            <li><strong style={strong}>Autoridades competentes</strong> — únicamente cuando exista una obligación legal
              que lo requiera.</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>6. Cómo protegemos tus datos</h2>
          <ul style={ul}>
            <li>Tu contraseña nunca se guarda como texto plano: se almacena de forma cifrada (hash).</li>
            <li>El acceso a la aplicación se controla con sesiones firmadas (JWT) con expiración y renovación
              periódica.</li>
            <li>Tus fotos y archivos subidos solo pueden consultarse por usuarios que iniciaron sesión.</li>
            <li>Cada gimnasio tiene sus datos completamente aislados de los demás gimnasios registrados en GymPro.</li>
            <li>Limitamos los intentos de inicio de sesión para proteger tu cuenta frente a accesos no autorizados.</li>
          </ul>
        </div>

        <div style={card}>
          <h2 style={h2}>7. Cuánto tiempo conservamos tus datos</h2>
          <p style={p}>
            Conservamos tu información mientras tu cuenta esté activa en el gimnasio. Si dejas de ser socio, el gimnasio
            puede conservar cierta información (como el historial de pagos) por el tiempo que exijan sus obligaciones
            contables o legales. Puedes solicitar la eliminación de tus datos personales siguiendo el procedimiento de
            la sección 8.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>8. Tus derechos sobre tus datos</h2>
          <p style={p}>Tienes derecho a:</p>
          <ul style={ul}>
            <li><strong style={strong}>Acceder</strong> a los datos personales que tenemos sobre ti.</li>
            <li><strong style={strong}>Rectificar</strong> datos incorrectos o desactualizados.</li>
            <li><strong style={strong}>Cancelar</strong> (eliminar) tu cuenta y tus datos personales.</li>
            <li><strong style={strong}>Oponerte</strong> a un uso específico de tus datos.</li>
            <li><strong style={strong}>Revocar tu consentimiento</strong> en cualquier momento.</li>
          </ul>
          <p style={p}>
            Para ejercer cualquiera de estos derechos, contacta al administrador de tu gimnasio o escríbenos
            directamente a <strong style={strong}>{CORREO_SOPORTE}</strong>.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>9. Menores de edad</h2>
          <p style={p}>
            Si un gimnasio inscribe a un menor de edad como socio, es responsabilidad del gimnasio y/o de su padre,
            madre o tutor legal gestionar el registro y dar el consentimiento correspondiente para el tratamiento de sus
            datos dentro de GymPro. PanTech no recopila intencionalmente datos de menores de edad fuera de este
            contexto supervisado por el gimnasio.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>10. Cookies y almacenamiento local</h2>
          <p style={p}>
            Usamos almacenamiento local del navegador y cookies técnicas únicamente para mantener tu sesión iniciada.
            No utilizamos cookies de rastreo publicitario de terceros.
          </p>
        </div>

        <div style={card}>
          <h2 style={h2}>11. Cambios a esta política</h2>
          <p style={p}>
            Podemos actualizar esta Política de Privacidad para reflejar cambios en la aplicación o en la normativa
            aplicable. Publicaremos cualquier cambio relevante en esta misma página, indicando la fecha de la última
            actualización en la parte superior.
          </p>
        </div>

        <div style={{ ...card, textAlign: "center" }}>
          <h2 style={h2}>12. Contacto</h2>
          <p style={p}>¿Tienes dudas sobre el manejo de tus datos? Escríbenos:</p>
          <a href={`mailto:${CORREO_SOPORTE}`} style={contactBox}>
            <FiMail /> {CORREO_SOPORTE}
          </a>
        </div>
      </div>
    </div>
  );
}
