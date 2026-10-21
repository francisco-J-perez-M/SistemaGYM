import axios from "axios";

const API_URL = "/api/pagos";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getPagos = async (page = 1) => {
  const res = await axios.get(`${API_URL}?page=${page}`, {
    headers: authHeader(),
  });
  return res.data;
};

export const registrarPago = async (data) => {
  const res = await axios.post(API_URL, data, {
    headers: {
      ...authHeader(),
      "Content-Type": "application/json",
    },
  });
  return res.data;
};

/**
 * Historial unificado de pagos y ventas POS.
 *
 * `anio`/`mes` acotan el periodo (mes sin año se ignora en el backend, así que
 * sólo se envía acompañado). `desde`/`hasta` (rango libre "YYYY-MM-DD") tiene
 * prioridad sobre anio/mes -- así se filtra por día o semana sin necesitar un
 * parámetro distinto por cada granularidad. La respuesta trae `monto_total`,
 * que suma TODO el filtro y no sólo la página pedida, y `anios` para poblar
 * el selector.
 */
export const getTodosMovimientos = async ({
  page = 1, tipo = "todos", categoria = "", anio = 0, mes = 0,
  desde = "", hasta = "", per_page = 0,
} = {}) => {
  const params = new URLSearchParams({ page, tipo });
  if (categoria) params.set("categoria", categoria);
  if (desde && hasta) {
    params.set("desde", desde);
    params.set("hasta", hasta);
  } else if (anio) {
    params.set("anio", anio);
    if (mes) params.set("mes", mes);
  }
  if (per_page)  params.set("per_page", per_page);
  const res = await axios.get(`${API_URL}/todos?${params}`, {
    headers: authHeader(),
  });
  return res.data;
};

export const getCategoriasVentas = async () => {
  const res = await axios.get(`${API_URL}/categorias`, {
    headers: authHeader(),
  });
  return res.data;
};
