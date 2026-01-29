import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
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
