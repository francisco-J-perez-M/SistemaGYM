import { BrowserRouter, Routes, Route } from "react-router-dom";
// 1. IMPORTA EL PROVIDER (Asegúrate que la ruta sea correcta)
import { ThemeProvider } from "./hooks/ThemeContext"; 

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import BackupsDashboard from "./pages/BackupsDashboard";

function App() {
  return (
    // 2. ENVUELVE TODO DENTRO DEL THEMEPROVIDER
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/backups" element={<BackupsDashboard />} />
          </Route>

          <Route path="/user-dashboard" element={<UserDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;