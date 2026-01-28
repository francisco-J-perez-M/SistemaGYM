import axios from "axios";

const API_URL = "http://localhost:5000/api/pagos";

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
