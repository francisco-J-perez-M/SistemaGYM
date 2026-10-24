// utils/passwordStrength.js — Medidor de fortaleza de contraseña.
//
// SCRUM-224: extraído de RegisterGym.jsx (donde vivía como función local
// "passStrength") para reutilizarlo también en CambiarPasswordInicial.jsx
// sin duplicar la misma lógica una tercera vez.
export function passwordStrength(pwd) {
  if (!pwd) return null;
  const checks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { level: 0, label: "Muy débil", color: "var(--danger)" };
  if (score === 2) return { level: 1, label: "Aceptable", color: "var(--warning)" };
  if (score === 3) return { level: 2, label: "Buena",     color: "var(--warning)" };
  return               { level: 3, label: "Excelente",  color: "var(--success)" };
}

export default passwordStrength;
