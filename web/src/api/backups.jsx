import axios from "axios";

const API = axios.create({ baseURL: "/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getDashboardSummary = () =>
  API.get("/backups/dashboard-summary");

export const getBackupHistory = () => 
  API.get("/backups/history");

export const triggerBackup = (type) =>
  API.post("/backups/trigger", { type });

export const getBackupStatus = () =>
  API.get("/backups/status");

export const downloadFile = (filename) => {
  return API.get(`/backups/download/${filename}`, {
    responseType: "blob",
  });
};


export const testEmail = () =>
  API.get("/backups/test-email");

export const restoreBackup = (filename) =>
  API.post("/backups/restore", { filename });

// ── Tenant backups (owner_gym scoped) ─────────────────────────────────────
export const getTenantSummary  = ()       => API.get("/owner_gym/backups/summary");
export const triggerTenantBackup = (type) => API.post("/owner_gym/backups/trigger", { type });
export const getTenantStatus   = ()       => API.get("/owner_gym/backups/status");
export const downloadTenantFile = (filename) =>
  API.get(`/owner_gym/backups/download/${filename}`, { responseType: "blob" });
export const restoreTenantBackup = (filename) =>
  API.post("/owner_gym/backups/restore", { filename });
