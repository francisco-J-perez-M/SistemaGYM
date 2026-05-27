// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'Miembro'
  | 'user'
  | 'Entrenador'
  | 'owner_gym'
  | 'Admin'
  | 'superadmin';

export interface AuthUser {
  id:               string;
  nombre:           string;
  email:            string;
  role:             UserRole;
  id_gimnasio:      number | null;
  plan?:            string;
  access_level?:    string;
  perfil_completo?: boolean;
  peso_inicial?:    number | null;
}

export interface AuthState {
  user:       AuthUser | null;
  token:      string | null;
  isLoading:  boolean;
  isLoggedIn: boolean;
}

// ── Member ────────────────────────────────────────────────────────────────────

export interface WorkoutStat {
  currentWeek:    number;
  totalWorkouts:  number;
  caloriesBurned: number;
  streakDays:     number;
  currentWeight:  number;
}

export interface Exercise {
  name:      string;
  sets:      string;
  completed: boolean;
}

export interface TodayWorkout {
  type:      string;
  exercises: Exercise[];
}

export interface WeeklyProgress {
  days: number[];   // 0 o 100 por cada día lun-dom
}

export interface Achievement {
  icon:        string;
  title:       string;
  description: string;
  color:       string;
}

export interface Membership {
  plan:           string;
  fecha_fin:      string;
  dias_restantes: number;
  estado:         'activa' | 'por_vencer' | 'vencida';
}

export interface DashboardData {
  user:          { id: string; nombre: string; email: string; foto_perfil?: string };
  workoutStats:  WorkoutStat;
  todayWorkout:  TodayWorkout;
  weeklyProgress: number[];
  achievements:  Achievement[];
  membership:    Membership | null;
}

// ── Progress ─────────────────────────────────────────────────────────────────

export interface BodyProgress {
  _id:             string;
  peso:            number;
  cintura?:        number;
  cadera?:         number;
  bmi?:            number;
  fecha_registro:  string;
}

// ── Nutrition ─────────────────────────────────────────────────────────────────

export interface Receta {
  _id:         string;
  nombre:      string;
  calorias:    number;
  proteinas?:  number;
  carbohidratos?: number;
  grasas?:     number;
  categoria:   string;
  ingredientes?: string;
  instrucciones?: string;
}

export interface Dieta {
  _id:         string;
  nombre:      string;
  descripcion?: string;
  calorias_objetivo?: number;
  comidas:     ComidaDieta[];
}

export interface ComidaDieta {
  nombre:    string;
  hora?:     string;
  recetas:   string[];
}

// ── Membership ────────────────────────────────────────────────────────────────

export interface MembershipPlan {
  id_membresia:   number;
  nombre:         string;
  precio:         number;
  duracion_dias:  number;
  descripcion?:   string;
  beneficios?:    string;
}

// ── Trainer ───────────────────────────────────────────────────────────────────

export interface TrainerDashboard {
  trainer:       { nombre: string; especialidad?: string };
  total_clients: number;
  active_today:  number;
  sessions_week: number;
  pending_tasks: number;
}

export interface TrainerClient {
  _id:          string;
  nombre:       string;
  email:        string;
  objetivo?:    string;
  ultima_sesion?: string;
  progreso?:    number;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminKPI {
  total_miembros:     number;
  nuevos_mes:         number;
  ingresos_mes:       number;
  membresias_activas: number;
  asistencias_hoy:    number;
  por_vencer:         number;
}

export interface MiembroAdmin {
  _id:           string;
  nombre:        string;
  email:         string;
  membresia?:    string;
  estado?:       string;
  fecha_ingreso?: string;
}

export interface Pago {
  _id:           string;
  miembro_nombre: string;
  monto:         number;
  concepto:      string;
  fecha:         string;
  metodo?:       string;
}
