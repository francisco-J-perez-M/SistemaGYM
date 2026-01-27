import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/ThemeContext"; 
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";         
import BackupsDashboard from "./pages/BackupsDashboard"; 

// --- IMPORTACIONES CORREGIDAS SEGÚN TU IMAGEN ---
import UserDashboard from "./pages/UsersDashboard"; // Panel del Cliente (Singular)

// Usamos los nombres en español que ya tienes creados:
import MiembrosDashboard from "./pages/MiembrosDashboard"; 
import PagosDashboard from "./pages/PagosDashboard";       

// ⚠️ ATENCIÓN: Estos dos archivos NO aparecen en tu imagen.
// Si no los tienes, tendrás que crearlos para que el error desaparezca.
// Si ya los tienes con otro nombre, cambia el nombre aquí en el import.
import UsersDashboard from "./pages/UsersDashboard";   // Panel de Admin (Plural)
import RestoreDashboard from "./pages/RestoreDashboard"; 

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* Rutas de Administrador */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Aquí conectamos tus archivos en español */}
            <Route path="/dashboard/members" element={<MiembrosDashboard />} />
            <Route path="/dashboard/payments" element={<PagosDashboard />} />
            
            {/* Rutas que faltan (crear archivos si no existen) */}
            <Route path="/dashboard/users" element={<UsersDashboard />} />
            <Route path="/dashboard/backups" element={<BackupsDashboard />} />
            <Route path="/dashboard/restore" element={<RestoreDashboard />} />
          </Route>

          {/* Ruta de Usuario Normal */}
          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;