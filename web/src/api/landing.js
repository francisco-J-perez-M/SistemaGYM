/**
 * api/landing.js — Cliente PUBLICO (sin sesion) de la pagina comercial.
 *
 * A diferencia del resto de los clientes de web/src/api/ (que mandan el
 * token de localStorage en cada peticion), aqui no hace falta ni tiene
 * sentido: Landing.jsx la ve cualquier visitante, antes de iniciar
 * sesion. Los endpoints que consume (ver api/app/routes/publico/landing.py)
 * tampoco exigen JWT.
 */
import axios from "axios";

const API = axios.create({ baseURL: "/api/publico" });

/** Gimnasios reales con al menos una foto publica subida por su propietario. */
export const getGimnasiosDestacados = () => API.get("/gimnasios");

/** Testimonios publicados por los propios gimnasios. */
export const getTestimoniosDestacados = () => API.get("/testimonios");
