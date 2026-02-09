import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiHeart, FiAlertCircle, FiCheckCircle, FiActivity, FiTrendingUp, 
  FiEdit2, FiTarget, FiCircle, FiTrendingDown, FiInfo, FiClock, FiDroplet, FiSun,
} from "react-icons/fi";
import { GiBodyHeight, GiMuscleUp, GiWeightScale, GiChest, GiLeg, GiFootTrip } from "react-icons/gi";
import BodyViewer from "../components/BodyViewer";
import "../css/CSSUnificado.css";

// ============ CONSTANTES Y CONFIGURACIONES ============
const ICONS = {
  FiHeart: <FiHeart />, FiActivity: <FiActivity />, FiCheckCircle: <FiCheckCircle />,
  FiAlertCircle: <FiAlertCircle />, FiCircle: <FiCircle />, FiTrendingUp: <FiTrendingUp />,
  FiTarget: <FiTarget />
};

const ESTADO_CONFIG = {
  normal: { color: 'var(--success-color)', texto: 'Normal' },
  bajo: { color: 'var(--warning-color)', texto: 'Bajo' },
  alto: { color: 'var(--warning-color)', texto: 'Alto' },
  muy_alto: { color: 'var(--error-color)', texto: 'Muy Alto' },
  sin_datos: { color: 'var(--text-secondary)', texto: 'Sin datos' }
};

const MEDIDAS_CORPORALES = [
  { label: "Circunferencia de Pecho", key: "pecho", icon: <GiChest />, color: "#45B7D1" },
  { label: "Circunferencia de Cintura", key: "cintura", icon: <FiCircle />, color: "#4ECDC4" },
  { label: "Circunferencia de Cadera", key: "cadera", icon: <GiLeg />, color: "#FF6B6B" },
  { label: "Brazo Derecho", key: "brazoDerecho", icon: <GiMuscleUp />, color: "#96CEB4", compare: "brazoIzquierdo", compareLabel: "Brazo Izquierdo" },
  { label: "Brazo Izquierdo", key: "brazoIzquierdo", icon: <GiMuscleUp />, color: "#96CEB4", compare: "brazoDerecho", compareLabel: "Brazo Derecho" },
  { label: "Muslo Derecho", key: "musloDerecho", icon: <GiLeg />, color: "#FECA57", compare: "musloIzquierdo", compareLabel: "Muslo Izquierdo" },
  { label: "Muslo Izquierdo", key: "musloIzquierdo", icon: <GiLeg />, color: "#FECA57", compare: "musloDerecho", compareLabel: "Muslo Derecho" },
  { label: "Pantorrilla", key: "pantorrilla", icon: <GiFootTrip />, color: "#FF9FF3" },
];

const MEDIDAS_EXCLUIDAS = [
  'Circunferencia de Pecho', 'Circunferencia de Cintura', 'Circunferencia de Cadera',
  'Brazo Derecho', 'Brazo Izquierdo', 'Muslo Derecho', 'Muslo Izquierdo',
  'Pantorrilla', 'Estatura', 'Peso Actual', 'IMC (Índice de Masa Corporal)'
];

// Recomendaciones generales de salud
const RECOMENDACIONES_GENERALES = [
  {
    icon: <FiDroplet />,
    color: "#45B7D1",
    titulo: "Hidratación",
    descripcion: "Bebe al menos 2 litros de agua al día para mantener tu cuerpo hidratado y optimizar tu metabolismo."
  },
  {
    icon: <FiClock />,
    color: "#9B59B6",
    titulo: "Descanso",
    descripcion: "Duerme entre 7-8 horas diarias. El sueño de calidad es esencial para la recuperación muscular y mental."
  },
  {
    icon: <FiHeart />,
    color: "#FF6B6B",
    titulo: "Cuida tu Corazón",
    descripcion: "Evita el tabaquismo y reduce el consumo de sal para mantener una presión arterial saludable."
  },
  {
    icon: <FiSun />,
    color: "#FFE66D",
    titulo: "Vitamina D",
    descripcion: "Exponte al sol de 10-15 minutos diarios para sintetizar vitamina D, esencial para tus huesos y sistema inmune."
  }
];

// ============ UTILIDADES ============
const calcularProgreso = (actual, inicial, meta) => {
  if (inicial === 0 || meta === 0) return 0;
  const diferencia = Math.abs(inicial - meta);
  if (diferencia === 0) return 100;
  const progresoActual = Math.abs(inicial - actual);
  return Math.min(100, Math.round((progresoActual / diferencia) * 100));
};

const getMedidaValor = (condiciones, nombreMedida) => {
  if (!condiciones?.length) return 0;
  const medida = condiciones.find(c => c.nombre === nombreMedida);
  if (!medida?.valor) return 0;
  const valor = parseFloat(medida.valor.toString().replace(/[^0-9.]/g, ''));
  return isNaN(valor) ? 0 : valor;
};

const getIMCColor = (imc) => {
  if (imc === 0) return 'var(--text-secondary)';
  if (imc >= 18.5 && imc <= 24.9) return 'var(--success-color)';
  if (imc < 18.5) return 'var(--warning-color)';
  return 'var(--error-color)';
};

const getIMCTexto = (imc) => {
  if (imc === 0) return 'Sin datos registrados';
  if (imc >= 18.5 && imc <= 24.9) return 'Peso saludable ✓';
  if (imc < 18.5) return 'Bajo peso';
  if (imc <= 29.9) return 'Sobrepeso';
  return 'Obesidad';
};

// Función para generar recomendaciones personalizadas según IMC
const getRecomendacionesIMC = (imc) => {
  if (imc === 0) return [];
  
  if (imc < 18.5) {
    return [
      "Aumenta tu ingesta calórica con alimentos nutritivos y densos en energía",
      "Incluye más proteínas en tu dieta para ganar masa muscular",
      "Consulta con un nutricionista para un plan personalizado"
    ];
  } else if (imc >= 18.5 && imc <= 24.9) {
    return [
      "Mantén tu peso actual con una alimentación balanceada",
      "Continúa con tu rutina de ejercicio regular",
      "Monitorea tu progreso periódicamente"
    ];
  } else if (imc <= 29.9) {
    return [
      "Reduce gradualmente tu ingesta calórica diaria",
      "Incrementa tu actividad física a 300 minutos semanales",
      "Enfócate en alimentos altos en fibra y bajos en grasa"
    ];
  } else {
    return [
      "Considera consultar con un profesional de la salud",
      "Establece metas realistas de pérdida de peso (0.5-1kg por semana)",
      "Combina ejercicio cardiovascular con entrenamiento de fuerza"
    ];
  }
};

// ============ COMPONENTES ============
const MetricCard = ({ metric, idx }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.1 }}
  >
    <div className="stat-header">
      <h3 style={{ display: "flex", gap: "8px", alignItems: "center", color: metric.color }}>
        {metric.icon}
        {metric.label}
      </h3>
    </div>
    <div className="stat-value" style={{ fontSize: '32px' }}>{metric.value}</div>
    {metric.meta && (
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
        {metric.meta}
      </div>
    )}
  </motion.div>
);

const MedidaItem = ({ medida, valor, valores, idx }) => {
  const valorCompare = medida.compare ? valores[medida.compare] : undefined;
  
  return (
    <div key={idx} style={{ 
      marginBottom: '15px',
      paddingBottom: '15px',
      borderBottom: idx < MEDIDAS_CORPORALES.length - 1 ? '1px solid var(--border-dark)' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: `${medida.color}20`,
            color: medida.color,
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            {medida.icon}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{medida.label}</span>
        </div>
        <span style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          color: valor > 0 ? medida.color : 'var(--text-secondary)'
        }}>
          {valor > 0 ? `${valor} cm` : '--'}
        </span>
      </div>
      
      {valorCompare !== undefined && valor > 0 && valorCompare > 0 && (
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)',
          marginTop: '8px',
          paddingLeft: '42px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>Diferencia con {medida.compareLabel}:</span>
          <span style={{ 
            fontWeight: '600',
            color: Math.abs(valor - valorCompare) > 2 ? 'var(--warning-color)' : 'var(--success-color)'
          }}>
            {Math.abs(valor - valorCompare).toFixed(1)} cm
          </span>
        </div>
      )}
    </div>
  );
};

const ProgresoObjetivo = ({ area, idx }) => {
  const progreso = calcularProgreso(area.actual, area.inicial, area.meta);
  const tieneDatos = area.actual > 0 && area.meta > 0;
  
  return (
    <div key={idx} style={{ marginBottom: "20px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ color: area.color }}>{area.icon}</div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{area.area}</span>
        </div>
        <span style={{ 
          fontWeight: 600, 
          color: tieneDatos ? area.color : 'var(--text-secondary)',
          fontSize: '13px'
        }}>
          {tieneDatos ? `${area.actual} → ${area.meta}` : 'Sin meta'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            height: "8px",
            background: "var(--border-dark)",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            {tieneDatos && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progreso}%` }}
                transition={{ duration: 1, delay: idx * 0.2 }}
                style={{ 
                  height: "100%", 
                  background: area.color, 
                  borderRadius: "4px" 
                }}
              />
            )}
          </div>
        </div>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '600',
          color: tieneDatos ? area.color : 'var(--text-secondary)',
          minWidth: '35px'
        }}>
          {tieneDatos ? `${progreso}%` : '--'}
        </span>
      </div>
    </div>
  );
};

const CondicionSalud = ({ cond, idx }) => (
  <motion.div 
    key={idx} 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ delay: idx * 0.1 }}
    style={{ 
      padding: '15px', 
      background: `${ESTADO_CONFIG[cond.estado]?.color || 'var(--text-secondary)'}10`, 
      borderRadius: '8px',
      borderLeft: `4px solid ${ESTADO_CONFIG[cond.estado]?.color || 'var(--text-secondary)'}`
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ 
        color: ESTADO_CONFIG[cond.estado]?.color,
        background: `${ESTADO_CONFIG[cond.estado]?.color}20`,
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        flexShrink: 0
      }}>
        {ICONS[cond.icon] || <FiActivity />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px' 
        }}>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>{cond.nombre}</span>
          <span style={{ 
            fontSize: '12px',
            color: ESTADO_CONFIG[cond.estado]?.color,
            fontWeight: '600',
            background: `${ESTADO_CONFIG[cond.estado]?.color}20`,
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {ESTADO_CONFIG[cond.estado]?.texto || cond.estado}
          </span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          {cond.valor}
        </div>
        {cond.descripcion && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
            {cond.descripcion}
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

const SeccionHistorial = ({ titulo, items, color, icon: Icon, emptyText }) => (
  <div style={{ marginBottom: '25px' }}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      marginBottom: '15px'
    }}>
      <div style={{
        background: `${color}10`,
        color: color,
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={18} />
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{titulo}</h4>
    </div>
    
    {items && items.length > 0 && items[0] !== "Ninguno" && items[0] !== "Ninguna" ? (
      <div style={{ 
        display: 'grid', 
        gap: '8px',
        gridTemplateColumns: titulo === "Lesiones o Limitaciones" ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))'
      }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ 
            padding: '12px',
            background: 'var(--bg-dark)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: `4px solid ${color}`
          }}>
            {titulo !== "Lesiones o Limitaciones" && <Icon size={16} style={{ color }} />}
            <span>{item}</span>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ 
        padding: '15px', 
        background: 'rgba(76, 217, 100, 0.1)', 
        borderRadius: '8px', 
        color: 'var(--success-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderLeft: '4px solid var(--success-color)'
      }}>
        <FiCheckCircle />
        {emptyText}
      </div>
    )}
  </div>
);

// Nuevo componente para tarjetas de recomendaciones
const RecomendacionCard = ({ recomendacion, idx }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: idx * 0.1 }}
    style={{
      padding: '20px',
      background: `${recomendacion.color}10`,
      borderRadius: '12px',
      borderLeft: `4px solid ${recomendacion.color}`,
      display: 'flex',
      gap: '15px',
      alignItems: 'flex-start'
    }}
  >
    <div style={{
      background: `${recomendacion.color}20`,
      color: recomendacion.color,
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0
    }}>
      {recomendacion.icon}
    </div>
    <div style={{ flex: 1 }}>
      <h4 style={{ marginBottom: '8px', fontSize: '15px', fontWeight: '600' }}>
        {recomendacion.titulo}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {recomendacion.descripcion}
      </p>
    </div>
  </motion.div>
);

// ============ COMPONENTE PRINCIPAL ============
export default function UserHealthProgress() {
  const [user, setUser] = useState(null);
  const [selectedGender, setSelectedGender] = useState("female");
  const [bodyMetrics, setBodyMetrics] = useState({
    peso: { actual: 0, inicial: 0, meta: 0 },
    grasaCorporal: { actual: 0, inicial: 0, meta: 0 },
    musculo: { actual: 0, inicial: 0, meta: 0 },
    imc: 0, estatura: 0, cintura: 0, cadera: 0, pecho: 0,
    brazoDerecho: 0, brazoIzquierdo: 0, musloDerecho: 0, musloIzquierdo: 0, pantorrilla: 0
  });
  const [healthData, setHealthData] = useState({
    condiciones: [], alergias: [], medicamentos: [], lesiones: [],
    ultimaActualizacion: null, notas: ""
  });
  const [progressHistory, setProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasDatos, setHasDatos] = useState(false);
  const [activeTab, setActiveTab] = useState("progress");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const [progressResponse, healthResponse] = await Promise.all([
        fetch("http://localhost:5000/api/user/body-progress", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        }),
        fetch("http://localhost:5000/api/user/health", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        })
      ]);

      if (!progressResponse.ok || !healthResponse.ok) {
        throw new Error("Error al cargar datos");
      }

      const [progressData, healthDataResponse] = await Promise.all([
        progressResponse.json(),
        healthResponse.json()
      ]);

      setBodyMetrics(progressData.bodyMetrics);
      setProgressHistory(progressData.progressHistory);
      setSelectedGender(progressData.gender);
      setHasDatos(progressData.hasDatos);
      setHealthData(healthDataResponse);
      setError(null);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="main-wrapper">
          <header className="top-header">
            <h2 className="page-title">Salud y Progreso Físico</h2>
          </header>
          <main className="dashboard-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
              <p>Cargando información...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const sinDatos = !healthData.condiciones?.length || 
                   (healthData.condiciones.length === 1 && healthData.condiciones[0].estado === 'sin_datos');

  const valores = {
    pecho: getMedidaValor(healthData.condiciones, "Circunferencia de Pecho") || bodyMetrics.pecho,
    cintura: getMedidaValor(healthData.condiciones, "Circunferencia de Cintura") || bodyMetrics.cintura,
    cadera: getMedidaValor(healthData.condiciones, "Circunferencia de Cadera") || bodyMetrics.cadera,
    brazoDerecho: getMedidaValor(healthData.condiciones, "Brazo Derecho") || bodyMetrics.brazoDerecho,
    brazoIzquierdo: getMedidaValor(healthData.condiciones, "Brazo Izquierdo") || bodyMetrics.brazoIzquierdo,
    musloDerecho: getMedidaValor(healthData.condiciones, "Muslo Derecho") || bodyMetrics.musloDerecho,
    musloIzquierdo: getMedidaValor(healthData.condiciones, "Muslo Izquierdo") || bodyMetrics.musloIzquierdo,
    pantorrilla: getMedidaValor(healthData.condiciones, "Pantorrilla") || bodyMetrics.pantorrilla,
  };

  const kpiMetrics = [
    { label: "Estatura", value: bodyMetrics.estatura > 0 ? `${bodyMetrics.estatura} m` : '--', icon: <GiBodyHeight />, color: "var(--accent-color)" },
    { label: "Peso Actual", value: bodyMetrics.peso.actual > 0 ? `${bodyMetrics.peso.actual} kg` : '--', icon: <GiWeightScale />, color: "var(--success-color)", meta: bodyMetrics.peso.meta > 0 ? `Meta: ${bodyMetrics.peso.meta}kg` : null },
    { label: "Masa Muscular", value: bodyMetrics.musculo.actual > 0 ? `${bodyMetrics.musculo.actual}%` : '--', icon: <GiMuscleUp />, color: "var(--warning-color)", meta: bodyMetrics.musculo.meta > 0 ? `Meta: ${bodyMetrics.musculo.meta}%` : null },
    { label: "Grasa Corporal", value: bodyMetrics.grasaCorporal.actual > 0 ? `${bodyMetrics.grasaCorporal.actual}%` : '--', icon: <FiActivity />, color: "var(--error-color)", meta: bodyMetrics.grasaCorporal.meta > 0 ? `Meta: ${bodyMetrics.grasaCorporal.meta}%` : null },
  ];

  const objetivos = [
    { area: "Pérdida de Peso", actual: bodyMetrics.peso.actual, inicial: bodyMetrics.peso.inicial, meta: bodyMetrics.peso.meta, color: "var(--success-color)", icon: <FiTrendingDown /> },
    { area: "Reducción de Grasa", actual: bodyMetrics.grasaCorporal.actual, inicial: bodyMetrics.grasaCorporal.inicial, meta: bodyMetrics.grasaCorporal.meta, color: "var(--error-color)", icon: <FiTrendingDown /> },
    { area: "Ganancia Muscular", actual: bodyMetrics.musculo.actual, inicial: bodyMetrics.musculo.inicial, meta: bodyMetrics.musculo.meta, color: "var(--warning-color)", icon: <FiTrendingUp /> },
  ];

  const recomendacionesPersonalizadas = getRecomendacionesIMC(bodyMetrics.imc);

  return (
    <div className="dashboard-layout">
      <div className="main-wrapper">
        <header className="top-header">
          <h2 className="page-title">Salud y Progreso Físico</h2>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/user-health-update'}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: 'var(--accent-color)', border: 'none', borderRadius: '8px',
              cursor: 'pointer', color: 'var(--bg-dark)', fontWeight: '600'
            }}
          >
            <FiEdit2 />
            Actualizar Datos
          </button>
        </header>

        <main className="dashboard-content">
          {error && (
            <div style={{ 
              padding: '15px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '8px', 
              marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
              color: 'var(--error-color)'
            }}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* TABS */}
          <div style={{ 
            display: 'flex', gap: '10px', marginBottom: '25px',
            borderBottom: '2px solid var(--border-dark)', paddingBottom: '0'
          }}>
            {[
              { key: "progress", icon: <FiTrendingUp />, label: "Progreso Físico y Medidas" },
              { key: "health", icon: <FiHeart />, label: "Salud y Bienestar" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab.key ? 'var(--accent-color)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '3px solid var(--accent-color)' : 'none',
                  cursor: 'pointer', fontWeight: '600', transition: 'all 0.3s ease',
                  borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: PROGRESO FÍSICO */}
          {activeTab === "progress" && (
            <>
              {!hasDatos && !error && (
                <div style={{ 
                  padding: '20px', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '8px', 
                  marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
                  color: 'var(--accent-color)'
                }}>
                  <FiActivity />
                  <span>No hay registros de progreso. Comienza a registrar tus mediciones para ver tu evolución.</span>
                </div>
              )}

              {/* KPIs */}
              <div className="kpi-grid" style={{ marginBottom: '25px' }}>
                {kpiMetrics.map((metric, idx) => <MetricCard key={idx} metric={metric} idx={idx} />)}
              </div>

              {/* MODELO 3D Y MEDIDAS */}
              <div className="charts-row" style={{ marginTop: "0", gap: "20px" }}>
                {/* Modelo 3D */}
                <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                  <div className="chart-header">
                    <h3>Modelo Corporal 3D</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {selectedGender === "female" ? "Femenino" : "Masculino"}
                      </span>
                      <div style={{ padding: "4px 8px", background: "var(--bg-input-dark)", borderRadius: "4px", fontSize: "12px" }}>
                        IMC: {bodyMetrics.imc > 0 ? bodyMetrics.imc.toFixed(1) : '--'}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: "450px", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", position: "relative" }}>
                    <BodyViewer gender={selectedGender} metrics={bodyMetrics} />
                  </div>

                  {/* Relación Cintura/Cadera */}
                  <div style={{ padding: "15px", borderTop: "1px solid var(--border-dark)", background: "var(--bg-input-dark)" }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiTarget size={16} />
                        <span style={{ fontWeight: '600' }}>Relación Cintura/Cadera</span>
                      </div>
                      <span style={{ 
                        fontWeight: '600',
                        color: valores.cintura > 0 && valores.cadera > 0 ? 
                          (valores.cintura / valores.cadera > 0.85 ? 'var(--error-color)' : 
                           valores.cintura / valores.cadera > 0.8 ? 'var(--warning-color)' : 'var(--success-color)') : 
                          'var(--text-secondary)'
                      }}>
                        {valores.cintura > 0 && valores.cadera > 0 ? (valores.cintura / valores.cadera).toFixed(2) : 'Sin datos'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {valores.cintura > 0 && valores.cadera > 0 ? 
                        `Cintura: ${valores.cintura}cm • Cadera: ${valores.cadera}cm` : 
                        'Registra tus medidas para calcular esta relación'}
                    </div>
                  </div>
                </motion.div>

                {/* Medidas Corporales */}
                <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                  <div className="chart-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiCircle />
                      Medidas Corporales
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>en centímetros</span>
                  </div>
                  
                  <div style={{ padding: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                    {MEDIDAS_CORPORALES.map((medida, idx) => (
                      <MedidaItem key={idx} medida={medida} valor={valores[medida.key]} valores={valores} idx={idx} />
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* IMC Y OBJETIVOS */}
              <div className="charts-row" style={{ marginTop: "20px", gap: "20px" }}>
                {/* IMC */}
                <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                  <div className="chart-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiTarget />
                      Índice de Masa Corporal (IMC)
                    </h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '42px', fontWeight: '800', textAlign: 'center', marginBottom: '10px', color: getIMCColor(bodyMetrics.imc) }}>
                      {bodyMetrics.imc > 0 ? bodyMetrics.imc.toFixed(1) : '--'}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: getIMCColor(bodyMetrics.imc) }}>
                      {getIMCTexto(bodyMetrics.imc)}
                    </div>
                    
                    {bodyMetrics.imc > 0 && (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: 'var(--text-secondary)' }}>
                          <span>Bajo</span><span>Normal</span><span>Sobrepeso</span><span>Obesidad</span>
                        </div>
                        <div style={{ height: "8px", background: "linear-gradient(to right, #FFE66D, #4ECDC4, #FF9F43, #FF6B6B)", borderRadius: "4px", position: 'relative' }}>
                          <div style={{
                            position: 'absolute', left: `${Math.min(100, (bodyMetrics.imc / 40) * 100)}%`,
                            top: '-5px', width: '3px', height: '18px', background: '#fff',
                            borderRadius: '2px', boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '5px', color: 'var(--text-secondary)' }}>
                          <span>18.5</span><span>25</span><span>30</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Objetivos */}
                <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                  <div className="chart-header">
                    <h3>Progreso hacia Objetivos</h3>
                  </div>
                  <div style={{ padding: '15px' }}>
                    {objetivos.map((area, idx) => <ProgresoObjetivo key={idx} area={area} idx={idx} />)}
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* TAB: SALUD Y BIENESTAR */}
          {activeTab === "health" && (
            <>
              {sinDatos ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '30px', background: 'var(--bg-input-dark)', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}
                >
                  <FiAlertCircle size={48} style={{ color: 'var(--text-secondary)', marginBottom: '15px' }} />
                  <h3 style={{ marginBottom: '10px' }}>No hay datos de salud registrados</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Registra tu información médica para obtener recomendaciones personalizadas
                  </p>
                  <button 
                    onClick={() => window.location.href = '/user-health-update'}
                    style={{
                      padding: '12px 24px', background: 'var(--accent-color)', color: 'var(--bg-dark)',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    Registrar información de salud
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Indicadores de Salud */}
                  <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '20px' }}>
                    <div className="chart-header">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiActivity />
                        Indicadores de Salud
                      </h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        {healthData.condiciones
                          .filter(cond => !MEDIDAS_EXCLUIDAS.includes(cond.nombre))
                          .map((cond, idx) => <CondicionSalud key={idx} cond={cond} idx={idx} />)}
                      </div>
                    </div>
                  </motion.div>

                  {/* Recomendaciones Generales y Personalizadas */}
                  <div className="charts-row" style={{ marginTop: '0', gap: '20px' }}>
                    {/* Recomendaciones Generales */}
                    <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                      <div className="chart-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FiHeart />
                          Recomendaciones de Bienestar
                        </h3>
                      </div>
                      <div style={{ padding: '20px', display: 'grid', gap: '15px' }}>
                        {RECOMENDACIONES_GENERALES.map((rec, idx) => (
                          <RecomendacionCard key={idx} recomendacion={rec} idx={idx} />
                        ))}
                      </div>
                    </motion.div>

                    {/* Recomendaciones Personalizadas según IMC */}
                    {bodyMetrics.imc > 0 && (
                      <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                        <div className="chart-header">
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiTarget />
                            Recomendaciones Personalizadas
                          </h3>
                          <span style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px', 
                            background: `${getIMCColor(bodyMetrics.imc)}20`,
                            color: getIMCColor(bodyMetrics.imc),
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            IMC: {bodyMetrics.imc.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ padding: '20px' }}>
                          <div style={{ 
                            padding: '15px', 
                            background: `${getIMCColor(bodyMetrics.imc)}10`,
                            borderRadius: '8px',
                            borderLeft: `4px solid ${getIMCColor(bodyMetrics.imc)}`,
                            marginBottom: '20px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <FiInfo size={20} style={{ color: getIMCColor(bodyMetrics.imc) }} />
                              <span style={{ fontWeight: '600' }}>Basado en tu IMC actual</span>
                            </div>
                            <ul style={{ 
                              listStyle: 'none', 
                              padding: 0, 
                              margin: 0,
                              display: 'grid',
                              gap: '12px'
                            }}>
                              {recomendacionesPersonalizadas.map((rec, idx) => (
                                <motion.li
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  style={{ 
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '12px',
                                    background: 'var(--bg-dark)',
                                    borderRadius: '8px'
                                  }}
                                >
                                  <FiCheckCircle size={18} style={{ 
                                    color: getIMCColor(bodyMetrics.imc),
                                    flexShrink: 0,
                                    marginTop: '2px'
                                  }} />
                                  <span style={{ fontSize: '14px', lineHeight: '1.6' }}>{rec}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          <div style={{
                            padding: '15px',
                            background: 'rgba(74, 144, 226, 0.1)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--accent-color)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px'
                          }}>
                            <FiAlertCircle size={18} style={{ color: 'var(--accent-color)', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                              Estas recomendaciones son generales. Para un plan personalizado, consulta con un profesional de la salud.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Historial Médico y Notas */}
                  <div className="charts-row" style={{ marginTop: '20px', gap: '20px' }}>
                    {/* Historial Médico */}
                    <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                      <div className="chart-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FiAlertCircle />
                          Historial Médico
                        </h3>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <SeccionHistorial 
                          titulo="Alergias" 
                          items={healthData.alergias} 
                          color="#FF6B6B" 
                          icon={FiAlertCircle}
                          emptyText="Sin alergias registradas"
                        />
                        <SeccionHistorial 
                          titulo="Medicamentos" 
                          items={healthData.medicamentos} 
                          color="#FF9F43" 
                          icon={FiActivity}
                          emptyText="Sin medicamentos actualmente"
                        />
                        {healthData.lesiones?.length > 0 && healthData.lesiones[0] !== "Ninguna" && (
                          <SeccionHistorial 
                            titulo="Lesiones o Limitaciones" 
                            items={healthData.lesiones} 
                            color="var(--accent-color)" 
                            icon={FiAlertCircle}
                          />
                        )}
                      </div>
                    </motion.div>

                    {/* Notas y Última Actualización */}
                    <motion.div className="chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
                      <div className="chart-header">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FiEdit2 />
                          Notas de Seguimiento
                        </h3>
                      </div>
                      <div style={{ padding: '20px' }}>
                        {healthData.notas ? (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ 
                              padding: '20px', 
                              background: 'var(--bg-input-dark)', 
                              borderRadius: '8px',
                              borderLeft: '4px solid var(--accent-color)'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                marginBottom: '12px',
                                color: 'var(--accent-color)'
                              }}>
                                <FiEdit2 size={16} />
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>Última nota registrada</span>
                              </div>
                              <p style={{ 
                                fontSize: '14px', 
                                color: 'var(--text-primary)', 
                                lineHeight: '1.6',
                                margin: 0,
                                fontStyle: 'italic'
                              }}>
                                "{healthData.notas}"
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            padding: '20px',
                            background: 'var(--bg-input-dark)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            marginBottom: '20px'
                          }}>
                            <FiEdit2 size={32} style={{ color: 'var(--text-secondary)', marginBottom: '10px' }} />
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                              Sin notas registradas aún
                            </p>
                          </div>
                        )}

                        {healthData.ultimaActualizacion && (
                          <div style={{
                            padding: '15px',
                            background: 'rgba(76, 217, 100, 0.1)',
                            borderRadius: '8px',
                            borderLeft: '4px solid var(--success-color)',
                            marginBottom: '15px'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-color)' }}>
                                <FiClock size={16} />
                                <span style={{ fontWeight: '600' }}>Última actualización</span>
                              </div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                {new Date(healthData.ultimaActualizacion).toLocaleDateString('es-MX', {
                                  year: 'numeric', month: 'long', day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        <div style={{
                          padding: '15px',
                          background: 'rgba(74, 144, 226, 0.1)',
                          borderRadius: '8px',
                          borderLeft: '4px solid var(--accent-color)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <FiHeart size={16} style={{ color: 'var(--accent-color)' }} />
                            <span style={{ fontWeight: '600', fontSize: '14px' }}>Mantén tu información actualizada</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            Actualiza regularmente tus datos de salud para recibir recomendaciones más precisas y realizar un mejor seguimiento de tu progreso.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}