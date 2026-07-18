// UserHealth y UserBodyProgress eran componentes duplicados (renderizaban lo mismo).
// Se consolidaron en UserBodyProgress (superconjunto: incluye el bloque "Perfil Médico").
// Esta ruta (/user/health) reutiliza ese único componente para evitar duplicación.
export { default } from "./UserBodyProgress";
