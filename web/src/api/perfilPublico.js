/**
 * api/perfilPublico.js — Fotos y testimonios que el gimnasio publica en la
 * pagina comercial (ver web/src/pages/owner_gym/OwnerPerfilPublico.jsx y
 * api/app/routes/owner_gym/perfil_publico.py).
 *
 * Cliente autenticado (Propietario/Administrador) -- no confundir con
 * api/landing.js, que es el cliente PUBLICO (sin token) que usa la propia
 * landing para mostrar lo que aqui se sube.
 */
import axios from "axios";

const API = axios.create({ baseURL: "/api/owner_gym" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// -- Imagenes ------------------------------------------------------------

export const getImagenesPropias = () => API.get("/perfil-publico/imagenes");

export const subirImagen = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/perfil-publico/imagenes", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const eliminarImagen = (idImagen) =>
  API.delete(`/perfil-publico/imagenes/${idImagen}`);

// -- Testimonios -----------------------------------------------------------

export const getTestimoniosPropios = () => API.get("/perfil-publico/testimonios");

export const crearTestimonio = (data) => API.post("/perfil-publico/testimonios", data);

export const eliminarTestimonio = (idTestimonio) =>
  API.delete(`/perfil-publico/testimonios/${idTestimonio}`);
