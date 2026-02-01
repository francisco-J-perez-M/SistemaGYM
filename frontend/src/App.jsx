import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/ThemeContext"; 
import Layout from "./components/Layout";

// --- PÁGINAS PÚBLICAS ---
import Login from "./pages/Login";
import Register from "./pages/Register"; 

// --- PÁGINAS DE DASHBOARD (ADMIN) ---
import Dashboard from "./pages/Dashboard";         
import MiembrosDashboard from "./pages/MiembrosDashboard"; 
import PagosDashboard from "./pages/PagosDashboard";       
import UsersDashboard from "./pages/UsersDashboard";
import BackupsDashboard from "./pages/BackupsDashboard"; 
import RestoreDashboard from "./pages/RestoreDashboard"; 

// --- PÁGINAS DE USUARIO (CLIENTE) ---
import UserDashboard from "./pages/UsersDashboard"; // Asegúrate que este archivo maneje la vista de cliente

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. RUTAS PÚBLICAS: Sin Sidebar ni Layout */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 2. RUTAS PROTEGIDAS (ADMIN): Con Sidebar mediante Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/members" element={<MiembrosDashboard />} />
            <Route path="/dashboard/payments" element={<PagosDashboard />} />
            <Route path="/dashboard/users" element={<UsersDashboard />} />
            <Route path="/dashboard/backups" element={<BackupsDashboard />} />
            <Route path="/dashboard/restore" element={<RestoreDashboard />} />
          </Route>

          {/* 3. RUTA DE USUARIO FINAL: Si quieres que tenga otro Layout o sea limpia */}
          <Route path="/user-dashboard" element={<UserDashboard />} />

          {/* 4. RUTA 404: Opcional, por si escriben cualquier cosa */}
          <Route path="*" element={<div style={{color: 'white', padding: '20px'}}>Página no encontrada</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;