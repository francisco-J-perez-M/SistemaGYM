//frontend\src\api\auth.jsx
const API_URL = "/api/auth";

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || "Error al iniciar sesión");
  }

  return data;
}
export async function register(userData) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || "Error al registrarse");
  }

  return data;
}

// ── Recuperación de contraseña (código de 6 dígitos por correo) ──────────────
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al solicitar el código");
  return data;
}

export async function resetPassword(email, code, newPassword) {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al restablecer la contraseña");
  return data;
}

export async function completeOnboarding(payload) {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/onboarding/complete-setup", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al completar configuración");
  return data;
}

export async function registerGym(gymData, adminData, idPlan = null) {
  const body = { gym: gymData, admin: adminData };
  if (idPlan) body.id_plan = idPlan;

  const response = await fetch("/api/onboarding/register-gym", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al registrar el gimnasio");
  return data;
}
