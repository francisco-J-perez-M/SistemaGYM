/**
 * TrabajoPorGrupo.jsx — Trabajo acumulado por grupo muscular.
 *
 * Se alimenta SOLO de los entrenamientos que el miembro registra en su
 * bitácora, así que se actualiza sin que nadie capture nada a mano.
 *
 * Qué muestra y qué no:
 *   - Sí: sesiones, series y kilos de volumen por grupo. Son datos derivados
 *     de lo que el miembro registró, es decir, medidos.
 *   - No: circunferencias (brazo, muslo, cintura). Entrenar pierna no dice
 *     cuánto mide el muslo, y estimarlas contaminaría el historial y el modelo
 *     de predicción, que usa cintura, grasa e IMC como variables. Esas se
 *     siguen midiendo con cinta métrica.
 */
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { FiActivity, FiRefreshCw, FiInfo } from "react-icons/fi";
import { getMuscleGroupWork } from "../../api/workouts";
import InfoGrafico, {
  SERIES_GRAFICO, COLOR_REJILLA, ejeX, ejeY,
} from "../compartido/InfoGrafico";

const VENTANAS = [
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
  { dias: 0, label: "Todo" },
];

const kg = (v) => `${Math.round(Number(v) || 0).toLocaleString("es-MX")} kg`;

export default function TrabajoPorGrupo() {
  const [dias, setDias] = useState(90);
  const [grupos, setGrupos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback((ventana) => {
    setCargando(true);
    getMuscleGroupWork({ dias: ventana })
      .then(r => { setGrupos(r.data?.grupos || []); setResumen(r.data?.resumen || null); })
      .catch(() => { setGrupos([]); setResumen(null); })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { cargar(dias); }, [dias, cargar]);

  const cambiarVentana = (v) => setDias(v);

  return (
    <div className="chart-card" style={{ flex: 1 }}>
      <div className="chart-header" style={S.head}>
        <h3 style={S.titulo}>
          <FiActivity /> Trabajo por grupo muscular
        </h3>
        <div style={S.acciones}>
          {VENTANAS.map(v => (
            <button
              key={v.dias}
              onClick={() => cambiarVentana(v.dias)}
              style={{ ...S.chip, ...(dias === v.dias ? S.chipOn : null) }}
            >
              {v.label}
            </button>
          ))}
          <button style={S.iconBtn} onClick={() => cargar(dias)} title="Actualizar">
            <FiRefreshCw size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {cargando ? (
          <p style={S.vacio}>Cargando tu trabajo por grupo…</p>
        ) : grupos.length === 0 ? (
          <div style={S.vacioCaja}>
            <FiActivity size={30} style={{ opacity: .3 }} />
            <p style={S.vacio}>
              Aún no hay entrenamientos registrados en este periodo. Esta sección se
              llena sola conforme registras entrenamientos: no hay que capturar nada.
            </p>
          </div>
        ) : (
          <>
            <InfoGrafico
              titulo="Volumen levantado por grupo"
              periodo={resumen?.desde ? `Desde ${resumen.desde}` : "Todo el histórico"}
              subtitulo="Kilos totales movidos en cada grupo muscular, según lo que registraste."
              series={grupos.slice(0, 8).map((g, i) => ({
                color: SERIES_GRAFICO[i % SERIES_GRAFICO.length],
                nombre: g.grupo,
                descripcion:
                  `${g.sesiones} sesion${g.sesiones === 1 ? "" : "es"}, ${g.series} series, ` +
                  `${kg(g.volumen)} · ${g.porcentaje} % del total` +
                  (g.ultima_fecha ? ` · última el ${g.ultima_fecha}` : ""),
              }))}
              notas={[
                "El volumen es la suma de repeticiones × peso de cada serie registrada.",
                "Refleja lo que anotaste en la bitácora, no una medición corporal.",
              ]}
            />

            <ResponsiveContainer width="100%" height={Math.max(180, grupos.length * 38)}>
              <BarChart
                data={grupos}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 0, bottom: 22 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLOR_REJILLA} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={ejeX("Volumen levantado (kg)")}
                />
                <YAxis
                  type="category" dataKey="grupo" width={86}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  label={ejeY("Grupo muscular")}
                />
                <Tooltip
                  formatter={(v) => [kg(v), "Volumen"]}
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 12,
                  }}
                />
                <Bar dataKey="volumen" name="Volumen" radius={[0, 4, 4, 0]}>
                  {grupos.map((_, i) => (
                    <Cell key={i} fill={SERIES_GRAFICO[i % SERIES_GRAFICO.length]} />
                  ))}
                  {/* El eje va en miles; la cifra exacta se escribe al final de
                      cada barra, que es donde se busca. */}
                  <LabelList
                    dataKey="volumen"
                    position="right"
                    formatter={kg}
                    style={{ fill: "var(--text-primary)", fontSize: 10, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {resumen && (
              <div style={S.pie}>
                <span>
                  {resumen.sesiones} sesiones · {resumen.series} series · {kg(resumen.volumen_total)} en total
                </span>
                {resumen.grupo_menos_trabajado && (
                  <span style={S.desbalance}>
                    <FiInfo size={12} /> Más trabajado: {resumen.grupo_mas_trabajado} ·
                    Menos: {resumen.grupo_menos_trabajado}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  titulo: { display: "flex", alignItems: "center", gap: 8, margin: 0 },
  acciones: { display: "flex", alignItems: "center", gap: 6 },
  chip: {
    background: "transparent", border: "1px solid var(--border)", borderRadius: 20,
    padding: "4px 11px", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, cursor: "pointer",
  },
  chipOn: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--text-on-accent, #fff)" },
  iconBtn: {
    background: "transparent", border: "1px solid var(--border)", borderRadius: 8,
    padding: "5px 8px", color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex",
  },
  vacio: { color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55, margin: "10px 0 0", textAlign: "center" },
  vacioCaja: { display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 10px", color: "var(--text-secondary)" },
  pie: {
    display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
    marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)",
    fontSize: 12, color: "var(--text-secondary)",
  },
  desbalance: { display: "inline-flex", alignItems: "center", gap: 5 },
};
