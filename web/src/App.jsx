import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/ThemeContext";
import Layout from "./components/compartido/Layout";

// --- PÁGINAS PÚBLICAS ---
import AuthPage    from "./components/auth/AuthPage";
import RegisterGym from "./pages/publico/RegisterGym";

// --- PÁGINAS DE ADMIN ---
import Dashboard          from "./pages/admin/Dashboard";
import MiembrosDashboard  from "./pages/admin/MiembrosDashboard";
import PagosDashboard     from "./pages/admin/PagosDashboard";
import PointOfSale        from "./pages/admin/PointOfSale";
import BackupsDashboard   from "./pages/admin/BackupsDashboard";
import RestoreDashboard   from "./pages/admin/RestoreDashboard";
import AdminAnalytics     from "./pages/admin/AdminAnalytics";
import AnalyticsMapReduce from "./pages/admin/AnalyticsMapReduce";
import AnalyticsKMeans    from "./pages/admin/AnalyticsKMeans";
import AnalyticsRegresion from "./pages/admin/AnalyticsRegresion";

// --- PÁGINAS DE MIEMBRO ---
import UserDashboard         from "./pages/miembro/UserDashboard";
import UserPayments          from "./pages/miembro/UserPayments";
import UserProfile           from "./pages/miembro/UserProfile";
import UserRoutineCreator    from "./pages/miembro/UserRoutineCreator";
import UserBodyProgress      from "./pages/miembro/UserBodyProgress";
import UserMealPlan          from "./pages/miembro/UserMealPlan";
import UserRecipes           from "./pages/miembro/UserRecipes";
import UserHealth            from "./pages/miembro/UserHealth";
import UserHealthUpdate      from "./pages/miembro/UserHealthUpdate";
import UserMembershipRenewal from "./pages/miembro/UserMembershipRenewal";
import UserWeightPrediction  from "./pages/miembro/UserWeightPrediction";
import CompleteProfile       from "./pages/miembro/CompleteProfile";

// --- PÁGINAS DE ENTRENADOR ---
import TrainerDashboard from "./pages/entrenador/TrainerDashboard";
import TrainerClients   from "./pages/entrenador/TrainerClients";
import TrainerSchedule  from "./pages/entrenador/TrainerSchedule";
import TrainerSessions  from "./pages/entrenador/TrainerSessions";
import TrainerRoutines  from "./pages/entrenador/TrainerRoutines";
import TrainerReports   from "./pages/entrenador/TrainerReports";
import TrainerProfile   from "./pages/entrenador/TrainerProfile";

// --- PÁGINAS DE RECEPCIONISTA ---
import ReceptionistDashboard    from "./pages/recepcionista/ReceptionistDashboard";
import ReceptionistMembers      from "./pages/recepcionista/ReceptionistMembers";
import ReceptionistPayments     from "./pages/recepcionista/ReceptionistPayments";
import ReceptionistAppointments from "./pages/recepcionista/ReceptionistAppointments";
import ReceptionistMessages     from "./pages/recepcionista/ReceptionistMessages";
import ReceptionistTasks        from "./pages/recepcionista/ReceptionistTasks";

// --- PÁGINAS DE SUPERADMIN ---
import SuperadminDashboard    from "./pages/superadmin/SuperadminDashboard";
import SuperadminGimnasios    from "./pages/superadmin/SuperadminGimnasios";
import SuperadminSuscripciones from "./pages/superadmin/SuperadminSuscripciones";
import SuperadminPlanes       from "./pages/superadmin/SuperadminPlanes";
import SuperadminUsuarios     from "./pages/superadmin/SuperadminUsuarios";
import SuperadminBackups      from "./pages/superadmin/SuperadminBackups";
import SuperadminAnalytics    from "./pages/superadmin/SuperadminAnalytics";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. RUTAS PÚBLICAS */}
          {/* Ambas rutas apuntan al nuevo componente que maneja la vista internamente */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/register-gym" element={<RegisterGym />} />

          {/* 2. RUTAS ADMIN */}
          <Route element={<Layout role="admin" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/members" element={<MiembrosDashboard />} />
            <Route path="/dashboard/payments" element={<PagosDashboard />} />
            <Route path="/dashboard/pos" element={<PointOfSale />} />
            <Route path="/dashboard/backups" element={<BackupsDashboard />} />
            <Route path="/dashboard/restore" element={<RestoreDashboard />} />
            <Route path="/dashboard/mapreduce" element={<AnalyticsMapReduce />} />
            <Route path="/dashboard/kmeans" element={<AnalyticsKMeans />} />
            <Route path="/dashboard/regresion" element={<AnalyticsRegresion />} />
            <Route path="/dashboard/analytics" element={<AdminAnalytics />} />
          </Route>

          {/* 3. RUTAS USUARIO (MIEMBRO) */}
          <Route element={<Layout role="user" />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/routine" element={<UserRoutineCreator />} />
            <Route path="/user/progress" element={<UserBodyProgress />} />
            <Route path="/user/prediction" element={<UserWeightPrediction />} />
            <Route path="/user/body-metrics" element={<UserBodyProgress />} />
            <Route path="/user/meal-plan" element={<UserMealPlan />} />
            <Route path="/user/recipes" element={<UserRecipes />} />
            <Route path="/user/health" element={<UserHealth />} />
            <Route path="/user-health-update" element={<UserHealthUpdate />} />
            <Route path="/user/payments" element={<UserPayments />} />
            <Route path="/user/renew" element={<UserMembershipRenewal />} />
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/pos" element={<PointOfSale />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
          </Route>

          {/* 4. RUTAS ENTRENADOR */}
          <Route element={<Layout role="trainer" />}>
            <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/clients" element={<TrainerClients />} />
            <Route path="/trainer/schedule" element={<TrainerSchedule />} />
            <Route path="/trainer/sessions" element={<TrainerSessions />} />
            <Route path="/trainer/routines" element={<TrainerRoutines />} />
            <Route path="/trainer/trainer-kmeans" element={<AnalyticsKMeans />} />
            <Route path="/trainer/trainer-regresion" element={<AnalyticsRegresion />} />
            <Route path="/trainer/reports" element={<TrainerReports />} />
            <Route path="/trainer/profile" element={<TrainerProfile />} />
            <Route path="/trainer/pos" element={<PointOfSale />} />
          </Route>

          {/* 5. RUTAS RECEPCIONISTA */}
          <Route element={<Layout role="receptionist" />}>
            <Route path="/receptionist-dashboard"    element={<ReceptionistDashboard />} />
            <Route path="/receptionist/pos"          element={<PointOfSale />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
            <Route path="/receptionist/payments"     element={<ReceptionistPayments />} />
            <Route path="/receptionist/members"      element={<ReceptionistMembers />} />
            <Route path="/receptionist/messages"     element={<ReceptionistMessages />} />
            <Route path="/receptionist/tasks"        element={<ReceptionistTasks />} />
          </Route>

          {/* 6. RUTAS SUPERADMIN */}
          <Route element={<Layout role="superadmin" />}>
            <Route path="/superadmin"                  element={<SuperadminDashboard />}     />
            <Route path="/superadmin/gimnasios"        element={<SuperadminGimnasios />}     />
            <Route path="/superadmin/suscripciones"    element={<SuperadminSuscripciones />} />
            <Route path="/superadmin/planes"           element={<SuperadminPlanes />}        />
            <Route path="/superadmin/usuarios"         element={<SuperadminUsuarios />}      />
            <Route path="/superadmin/backups"          element={<SuperadminBackups />}       />
            <Route path="/superadmin/analytics"        element={<SuperadminAnalytics />}     />
          </Route>

          {/* 7. RUTA 404 */}
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
              <a href="/" style={{ marginTop: '20px', color: 'var(--accent)' }}>
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