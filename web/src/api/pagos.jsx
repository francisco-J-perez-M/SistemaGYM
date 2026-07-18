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

export const getTodosMovimientos = async ({ page = 1, tipo = "todos", categoria = "" } = {}) => {
  const params = new URLSearchParams({ page, tipo });
  if (categoria) params.set("categoria", categoria);
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
