import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const getDashboardSummary = () =>
  API.get("/backups/dashboard-summary");

export const triggerBackup = (type) =>
  API.post("/backups/trigger", { type });

export const getBackupStatus = () =>
  API.get("/backups/status");

export const downloadFile = (url) => {

  const cleanUrl = url.replace('/api/', '/'); 
  
  return API.get(cleanUrl, {
    responseType: "blob",
  });
};