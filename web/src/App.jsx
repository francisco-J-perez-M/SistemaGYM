import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/ThemeContext";
import Layout from "./components/compartido/Layout";

// --- PÁGINAS PÚBLICAS ---
import AuthPage    from "./components/auth/AuthPage";
import RegisterGym from "./pages/publico/RegisterGym";
import ForgotPassword from "./pages/publico/ForgotPassword";

// --- PÁGINAS DE OWNER GYM ---
import OwnerOnboarding    from "./pages/owner_gym/OwnerOnboarding";
import OwnerDashboard     from "./pages/owner_gym/OwnerDashboard";
import OwnerStaff         from "./pages/owner_gym/OwnerStaff";
import OwnerMemberships   from "./pages/owner_gym/OwnerMemberships";
import OwnerProfile       from "./pages/owner_gym/OwnerProfile";
import MiembrosDashboard  from "./pages/owner_gym/MiembrosDashboard";
import PagosDashboard     from "./pages/owner_gym/PagosDashboard";
import CobrarMembresia    from "./pages/owner_gym/CobrarMembresia";
import PointOfSale        from "./pages/owner_gym/PointOfSale";
import BackupsDashboard   from "./pages/owner_gym/BackupsDashboard";
import OwnerSubscription  from "./pages/owner_gym/OwnerSubscription";
import AdminAnalytics     from "./pages/owner_gym/AdminAnalytics";
import AnalyticsMapReduce from "./pages/owner_gym/AnalyticsMapReduce";
import AnalyticsKMeans    from "./pages/owner_gym/AnalyticsKMeans";
import TrainerKMeans      from "./pages/entrenador/TrainerKMeans";
import TrainerRegresion   from "./pages/entrenador/TrainerRegresion";
import AnalyticsRegresion from "./pages/owner_gym/AnalyticsRegresion";

// --- PÁGINAS DE MIEMBRO ---
import UserDashboard         from "./pages/miembro/UserDashboard";
import UserPayments          from "./pages/miembro/UserPayments";
import UserProfile           from "./pages/miembro/UserProfile";
import UserRoutineCreator    from "./pages/miembro/UserRoutineCreator";
import UserBodyProgress      from "./pages/miembro/UserBodyProgress";
import UserMealPlan          from "./pages/miembro/UserMealPlan";
import UserHealth            from "./pages/miembro/UserHealth";
import UserHealthUpdate      from "./pages/miembro/UserHealthUpdate";
import UserMembershipRenewal from "./pages/miembro/UserMembershipRenewal";
import UserWeightPrediction  from "./pages/miembro/UserWeightPrediction";
import UserTraining          from "./pages/miembro/UserTraining";
import UserWorkoutLog        from "./pages/miembro/UserWorkoutLog";
import CompleteProfile       from "./pages/miembro/CompleteProfile";

// --- PÁGINAS DE ENTRENADOR ---
import TrainerDashboard from "./pages/entrenador/TrainerDashboard";
import TrainerClients   from "./pages/entrenador/TrainerClients";
import TrainerSchedule  from "./pages/entrenador/TrainerSchedule";
import TrainerRoutines  from "./pages/entrenador/TrainerRoutines";
import TrainerReports   from "./pages/entrenador/TrainerReports";
import TrainerProfile   from "./pages/entrenador/TrainerProfile";
import TrainerRequests  from "./pages/entrenador/TrainerRequests";
import TrainerDiets     from "./pages/entrenador/TrainerDiets";

// --- PÁGINAS DE RECEPCIONISTA ---
import ReceptionistDashboard    from "./pages/recepcionista/ReceptionistDashboard";
import ReceptionistMembers      from "./pages/recepcionista/ReceptionistMembers";
import ReceptionistPayments     from "./pages/recepcionista/ReceptionistPayments";
import ReceptionistAppointments from "./pages/recepcionista/ReceptionistAppointments";
import ReceptionistMessages     from "./pages/recepcionista/ReceptionistMessages";
import ReceptionistTasks        from "./pages/recepcionista/ReceptionistTasks";
import ReceptionistCheckin      from "./pages/recepcionista/ReceptionistCheckin";
import ReceptionistAnalytics    from "./pages/recepcionista/ReceptionistAnalytics";

// --- PÁGINAS DE SUPERADMIN ---
import SuperadminDashboard    from "./pages/superadmin/SuperadminDashboard";
import SuperadminGimnasios    from "./pages/superadmin/SuperadminGimnasios";
import SuperadminSuscripciones from "./pages/superadmin/SuperadminSuscripciones";
import SuperadminPlanes       from "./pages/superadmin/SuperadminPlanes";
import SuperadminUsuarios     from "./pages/superadmin/SuperadminUsuarios";
import SuperadminBackups      from "./pages/superadmin/SuperadminBackups";
import SuperadminAnalytics    from "./pages/superadmin/SuperadminAnalytics";
import SuperadminModelos      from "./pages/superadmin/SuperadminModelos";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. RUTAS PÚBLICAS */}
          <Route path="/" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register-gym"     element={<RegisterGym />} />
          <Route path="/owner/bienvenida" element={<OwnerOnboarding />} />

          {/* 2. RUTAS OWNER GYM */}
          <Route element={<Layout role="owner_gym" />}>
            <Route path="/owner"               element={<OwnerDashboard />}   />
            <Route path="/owner/members"       element={<MiembrosDashboard />} />
            <Route path="/owner/payments"      element={<PagosDashboard />}   />
            <Route path="/owner/cobrar"        element={<CobrarMembresia />}  />
            <Route path="/owner/pos"           element={<PointOfSale />}      />
            <Route path="/owner/staff"         element={<OwnerStaff />}       />
            <Route path="/owner/memberships"   element={<OwnerMemberships />} />
            <Route path="/owner/profile"       element={<OwnerProfile />}     />
            <Route path="/owner/subscription"  element={<OwnerSubscription />} />
            <Route path="/owner/backups"       element={<BackupsDashboard />} />
            <Route path="/owner/mapreduce"     element={<AnalyticsMapReduce />} />
            <Route path="/owner/kmeans"        element={<AnalyticsKMeans />}  />
            <Route path="/owner/regresion"     element={<AnalyticsRegresion />} />
            <Route path="/owner/analytics"     element={<AdminAnalytics />}   />
          </Route>

          {/* 3. RUTAS USUARIO (MIEMBRO) */}
          <Route element={<Layout role="user" />}>
            <Route path="/user/dashboard"    element={<UserDashboard />} />
            <Route path="/user/routine"      element={<UserRoutineCreator />} />
            <Route path="/user/workout-log"  element={<UserWorkoutLog />} />
            <Route path="/user/progress"     element={<UserBodyProgress />} />
            <Route path="/user/prediction"   element={<UserWeightPrediction />} />
            <Route path="/user/body-metrics" element={<UserBodyProgress />} />
            <Route path="/user/meal-plan"    element={<UserMealPlan />} />
            <Route path="/user/nutrition"    element={<UserMealPlan />} />
            <Route path="/user/recipes"      element={<UserMealPlan />} />
            <Route path="/user/health"       element={<UserHealth />} />
            <Route path="/user-health-update" element={<UserHealthUpdate />} />
            <Route path="/user/payments"     element={<UserPayments />} />
            <Route path="/user/renew"        element={<UserMembershipRenewal />} />
            <Route path="/user/profile"      element={<UserProfile />} />
            <Route path="/user/pos"          element={<PointOfSale />} />
            <Route path="/user/training"     element={<UserTraining />} />
            <Route path="/complete-profile"  element={<CompleteProfile />} />
          </Route>

          {/* 4. RUTAS ENTRENADOR */}
          <Route element={<Layout role="trainer" />}>
            <Route path="/trainer-dashboard"         element={<TrainerDashboard />} />
            <Route path="/trainer/clients"           element={<TrainerClients />} />
            <Route path="/trainer/schedule"          element={<TrainerSchedule />} />
            <Route path="/trainer/routines"          element={<TrainerRoutines />} />
            <Route path="/trainer/diets"             element={<TrainerDiets />} />
            <Route path="/trainer/trainer-kmeans"    element={<TrainerKMeans />} />
            <Route path="/trainer/trainer-regresion" element={<TrainerRegresion />} />
            <Route path="/trainer/reports"           element={<TrainerReports />} />
            <Route path="/trainer/profile"           element={<TrainerProfile />} />
            <Route path="/trainer/pos"               element={<PointOfSale />} />
            <Route path="/trainer/requests"          element={<TrainerRequests />} />
          </Route>

          {/* 5. RUTAS RECEPCIONISTA */}
          <Route element={<Layout role="receptionist" />}>
            <Route path="/receptionist-dashboard"    element={<ReceptionistDashboard />} />
            <Route path="/receptionist/checkins"     element={<ReceptionistCheckin />} />
            <Route path="/receptionist/pos"          element={<PointOfSale />} />
            <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
            <Route path="/receptionist/payments"     element={<ReceptionistPayments />} />
            <Route path="/receptionist/members"      element={<ReceptionistMembers />} />
            <Route path="/receptionist/messages"     element={<ReceptionistMessages />} />
            <Route path="/receptionist/tasks"        element={<ReceptionistTasks />} />
            <Route path="/receptionist/analytics"    element={<ReceptionistAnalytics />} />
            <Route path="/receptionist/mapreduce"    element={<AnalyticsMapReduce />} />
            <Route path="/receptionist/kmeans"       element={<AnalyticsKMeans />} />
            <Route path="/receptionist/regresion"    element={<AnalyticsRegresion />} />
          </Route>

          {/* 6. RUTAS SUPERADMIN */}
          <Route element={<Layout role="superadmin" />}>
            <Route path="/superadmin"               element={<SuperadminDashboard />}     />
            <Route path="/superadmin/gimnasios"     element={<SuperadminGimnasios />}     />
            <Route path="/superadmin/suscripciones" element={<SuperadminSuscripciones />} />
            <Route path="/superadmin/planes"        element={<SuperadminPlanes />}        />
            <Route path="/superadmin/usuarios"      element={<SuperadminUsuarios />}      />
            <Route path="/superadmin/backups"       element={<SuperadminBackups />}       />
            <Route path="/superadmin/analytics"     element={<SuperadminAnalytics />}     />
            <Route path="/superadmin/modelos"       element={<SuperadminModelos />}       />
          </Route>

          {/* 7. RUTA 404 */}
          <Route path="*" element={
            <div style={{
              color: 'var(--text-primary)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              background: 'var(--bg-main)',
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
