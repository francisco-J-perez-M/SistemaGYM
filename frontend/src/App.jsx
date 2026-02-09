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
import PointOfSale from "./pages/PointOfSale";
import BackupsDashboard from "./pages/BackupsDashboard"; 
import RestoreDashboard from "./pages/RestoreDashboard"; 

// --- PÁGINAS DE USUARIO (MIEMBRO) ---
import UserDashboard from "./pages/UserDashboard";
import UserPayments from "./pages/UserPayments";
import UserProfile from "./pages/UserProfile";
import UserRoutineCreator from "./pages/UserRoutineCreator";
import UserBodyProgress from "./pages/UserBodyProgress";
import UserMealPlan from "./pages/UserMealPlan";
import UserRecipes from "./pages/UserRecipes";
import UserHealth from "./pages/UserHealth";
import UserHealthUpdate from "./pages/UserHealthUpdate";
import UserMembershipRenewal from "./pages/UserMembershipRenewal";

// --- PÁGINAS DE ENTRENADOR ---
import TrainerDashboard from "./pages/TrainerDashboard";
import TrainerClients from "./pages/TrainerClients";
import TrainerSchedule from "./pages/TrainerSchedule";
import TrainerSessions from "./pages/TrainerSessions";
import TrainerRoutines from "./pages/TrainerRoutines";
import TrainerReports from "./pages/TrainerReports";
import TrainerProfile from "./pages/TrainerProfile";

// --- PÁGINAS DE RECEPCIONISTA ---
import ReceptionistDashboard from "./pages/ReceptionistDashboard";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. RUTAS PÚBLICAS */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 2. RUTAS ADMIN */}
          <Route element={<Layout role="admin" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/members" element={<MiembrosDashboard />} />
            <Route path="/dashboard/payments" element={<PagosDashboard />} />
            <Route path="/dashboard/pos" element={<PointOfSale />} />
            <Route path="/dashboard/backups" element={<BackupsDashboard />} />
            <Route path="/dashboard/restore" element={<RestoreDashboard />} />
          </Route>

          {/* 3. RUTAS USUARIO (MIEMBRO) */}
          <Route element={<Layout role="user" />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/routine" element={<UserRoutineCreator />} />
            <Route path="/user/progress" element={<UserBodyProgress />} />
            <Route path="/user/body-metrics" element={<UserBodyProgress />} />
            <Route path="/user/meal-plan" element={<UserMealPlan />} />
            <Route path="/user/recipes" element={<UserRecipes />} />
            <Route path="/user/health" element={<UserHealth />} />
            <Route path="/user-health-update" element={<UserHealthUpdate />} />
            <Route path="/user/payments" element={<UserPayments />} />
            <Route path="/user/renew" element={<UserMembershipRenewal />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/pos" element={<PointOfSale />} />
          </Route>

          {/* 4. RUTAS ENTRENADOR */}
          <Route element={<Layout role="trainer" />}>
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/clients" element={<TrainerClients />} />
            <Route path="/trainer/schedule" element={<TrainerSchedule />} />
            <Route path="/trainer/sessions" element={<TrainerSessions />} />
            <Route path="/trainer/routines" element={<TrainerRoutines />} />
            <Route path="/trainer/reports" element={<TrainerReports />} />
            <Route path="/trainer/profile" element={<TrainerProfile />} />
            <Route path="/trainer/pos" element={<PointOfSale />} />
          </Route>

          {/* 5. RUTAS RECEPCIONISTA */}
          <Route element={<Layout role="receptionist" />}>
            <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/pos" element={<PointOfSale />} />
          </Route>

          {/* 6. RUTA 404 */}
          <Route path="*" element={
            <div style={{
              color: 'white', 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              background: 'var(--bg-dark)',
              textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '72px', marginBottom: '20px' }}>404</h1>
              <p style={{ fontSize: '20px' }}>Página no encontrada</p>
              <a href="/" style={{ marginTop: '20px', color: 'var(--accent-color)' }}>
                Volver al inicio
              </a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;