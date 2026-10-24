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

/**
 * Respuesta real de GET /api/trainer/dashboard
 */
export interface TrainerDashboard {
  trainer_name:      string;
  stats: {
    total_clients:   number;
    sessions_today:  number;
    sessions_week:   number;
    completion_rate: number;
  };
  today_sessions:    any[];
  upcoming_sessions: any[];
}

/**
 * Un cliente tal como lo devuelve GET /api/trainer/clients
 * Campos reales: id (no _id), name (no nombre), goal (no objetivo)
 */
export interface TrainerClientAPI {
  id:            string;
  name:          string;
  goal?:         string;
  sessionsTotal: number;
  attendance:    number;
  streak:        number;
  status:        string;
}

/** Respuesta paginada de GET /api/trainer/clients */
export interface TrainerClientsResponse {
  success:    boolean;
  clients:    TrainerClientAPI[];
  pagination: {
    page:        number;
    per_page:    number;
    total:       number;
    total_pages: number;
  };
}

// ── Admin / Owner Gym ─────────────────────────────────────────────────────────

/**
 * Respuesta real de GET /api/owner_gym/dashboard
 * (estructura anidada con miembros, ingresos, staff, ventas)
 */
export interface OwnerDashboard {
  miembros: {
    activos:    number;
    inactivos:  number;
    total:      number;
    nuevos_mes: number;
    por_vencer: number;
  };
  ingresos: {
    mes_actual:    number;
    mes_anterior:  number;
    variacion_pct: number;
  };
  ventas_pos: {
    total_mes:      number;
    transacciones:  number;
  };
  staff: {
    entrenadores:   number;
    recepcionistas: number;
  };
  tipos_membresia: number;
}

export interface MiembroAdmin {
  _id:            string;
  nombre:         string;
  email:          string;
  membresia?:     string;
  estado?:        string;
  fecha_ingreso?: string;
}

/** Respuesta paginada de GET /api/miembros */
export interface MiembrosResponse {
  miembros:     MiembroAdmin[];
  total:        number;
  pages:        number;
  current_page: number;
}

/** Un pago tal como lo devuelve la API (campos reales de Pago.to_dict()) */
export interface PagoAPI {
  id_pago?:       string;
  id_miembro?:    string;
  nombre_miembro: string;   // campo real del backend
  monto:          number;
  concepto:       string;
  metodo_pago?:   string;   // campo real del backend
  fecha_pago:     string;   // campo real del backend
  id_gimnasio?:   number;
}

/** Respuesta paginada de GET /api/pagos */
export interface PagosResponse {
  pagos:  PagoAPI[];
  total:  number;
  pages:  number;
  page:   number;
}
