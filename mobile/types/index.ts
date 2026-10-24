// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'Miembro'
  | 'user'
  | 'Entrenador'
  | 'Recepcionista'
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
  foto_perfil?:     string | null;   // base64 data URI
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

/** Ingrediente de una receta. El backend lo guarda como objeto. */
export interface IngredienteReceta {
  nombre?:   string;
  cantidad?: number | string;
  unidad?:   string;
}

/**
 * Receta — GET /api/user/nutrition/recetas.
 *
 * Los macros llegan con sufijo `_g` desde la biblioteca del entrenador
 * (`proteinas_g`) pero las recetas antiguas del miembro los guardaron sin él
 * (`proteinas`). Se declaran ambos y la pantalla toma el primero que exista;
 * confiar solo en uno dejaba los macros en blanco según quién creó la receta.
 */
export interface Receta {
  _id:         string;
  nombre:      string;
  calorias?:   number;
  categoria?:  string;
  descripcion?: string;
  /** base64 (data URL) o URL. */
  imagen?:     string | null;
  tiempo_preparacion_min?: number;

  proteinas?:      number;
  carbohidratos?:  number;
  grasas?:         number;
  proteinas_g?:     number;
  carbohidratos_g?: number;
  grasas_g?:        number;

  /** Texto libre en recetas viejas, lista de objetos en las nuevas. */
  ingredientes?:  string | IngredienteReceta[];
  instrucciones?: string;
  consumida_hoy?: boolean;
}

/** Una comida dentro de un día del plan. */
export interface ComidaDieta {
  nombre?:   string;
  hora?:     string;
  /** Nombres o ids de receta, según cómo se armara el plan. */
  recetas?:  string[];
  alimentos?: string[];
  calorias?: number;
  notas?:    string;
}

export interface DiaDieta {
  dia?:     string;
  comidas?: ComidaDieta[];
}

export interface SemanaDieta {
  semana?: number;
  dias?:   DiaDieta[];
}

/**
 * Plan alimenticio — GET /api/user/nutrition/dietas.
 *
 * Convive con dos formatos. Los planes que arma el entrenador anidan
 * `semanas → dias → comidas`; los antiguos, y los que crea el propio miembro,
 * traen `comidas` planas. La pantalla aplana el primero para tratar ambos
 * igual: leer solo `comidas` era la razón de que el plan se viera incompleto.
 */
export interface Dieta {
  _id:          string;
  nombre:       string;
  descripcion?: string;
  objetivo?:    string;
  notas?:       string;
  duracion_semanas?: number;

  calorias_objetivo?: number;
  calorias_meta?:     number;
  proteinas_meta_g?:  number;
  carbohidratos_meta_g?: number;
  grasas_meta_g?:     number;

  semanas?: SemanaDieta[];
  comidas?: ComidaDieta[];
}

// ── Membership ────────────────────────────────────────────────────────────────

/** Plan disponible — contrato real de GET /api/user/membership/plans → { planes: [...] } */
export interface ItemCombo {
  nombre:       string;
  cantidad:     number;
  id_producto?: string | number;
}

export interface MembershipPlan {
  id:             string;   // 'monthly' | 'quarterly' | 'annual'
  id_membresia:   number;   // entero PG — requerido por /renew
  nombre:         string;
  precio:         number;
  duracion_meses: number;
  ahorro?:        number;
  // Información comercial que define el dueño del gimnasio
  tipo?:            'estandar' | 'promocion';
  descripcion?:     string | null;
  beneficios?:      string[];
  es_combo?:        boolean;
  items_combo?:     ItemCombo[];
  fecha_fin_promo?: string | null;
  dias_restantes_promo?: number | null;
}

/** Membresía activa — contrato real de GET /api/user/membership → { tieneMembresia, membresia } */
export interface ActiveMembership {
  id:            string;
  nombre:        string;
  fechaInicio:   string;
  fechaFin:      string;
  diasRestantes: number;
  estado:        'activa' | 'por_vencer' | 'vencida';
  precio:        number;
}

export interface MembershipResponse {
  tieneMembresia: boolean;
  membresia?:     ActiveMembership;
  mensaje?:       string;
}

export interface PlansResponse { planes: MembershipPlan[] }

// Métodos aceptados: efectivo en caja o pago en línea por pasarela.
export type MetodoPago = 'Efectivo' | 'paypal' | 'mercadopago';

// ── Payments (GET /api/user/payments) ──────────────────────────────────────────

export interface PaymentItem {
  id:      string;
  date:    string;
  concept: string;
  amount:  number;
  method:  string;
  status:  string;
  /** Origen del cargo: el plan del gimnasio o una compra en el punto de venta. */
  type?:   'membresia' | 'producto';
  /** Número de artículos. Solo en las compras. */
  items?:  number;
  rawDate: string;
}

export interface PaymentsResponse {
  stats: {
    totalPaid:   number;
    /** Desglose del total: cuánto por el plan y cuánto en el punto de venta. */
    totalMembresias?: number;
    totalCompras?:    number;
    lastPayment: string;
    nextPayment: string;
    status:      string;
  };
  payments: PaymentItem[];
}

// ── Health (GET /api/user/health) ──────────────────────────────────────────────

export interface HealthCondition {
  nombre: string;
  valor:  string;
  estado: 'bajo' | 'normal' | 'alto' | 'muy_alto' | string;
  icon:   string;
}

export interface HealthResponse {
  condiciones:        HealthCondition[];
  condicionesMedicas: string[];
  alergias:           string[];
  medicamentos:       string[];
  lesiones:           string[];
  nivelActividad:     string;
  objetivo:           string;
  nivelExperiencia:   string;
  diasDisponibles:    string | number;
  horasSueno:         string | number;
  fuma:               boolean;
  alcohol:            string;
  notas:              string | null;
  ultimaActualizacion: string | null;
}

// ── Notificaciones (GET /api/notificaciones) ───────────────────────────────────

export interface Notificacion {
  _id:        string;
  tipo:       string;
  titulo:     string;
  mensaje:    string;
  leida:      boolean;
  creado_en:  string;
  referencia_tipo?: string | null;
  referencia_id?:   string | null;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  no_leidas:      number;
}

// ── Dietas (entrenador) — GET /api/trainer/diets → { diets: [...] } ─────────────

export interface DietPlan {
  id:                   string;
  nombre:               string;
  objetivo?:            string;
  calorias_meta?:       number | null;
  proteinas_meta_g?:    number | null;
  carbohidratos_meta_g?: number | null;
  grasas_meta_g?:       number | null;
  duracion_semanas?:    number;
  notas?:               string;
  id_miembro_pg?:       number | null;
  fuente?:              string;
  fecha_creacion?:      string;
  semanas?:             any[];
}

export interface DietsResponse { diets: DietPlan[] }

/** Receta de la biblioteca del entrenador — GET /api/trainer/recipes → { recipes } */
export interface Recipe {
  id:               string;
  nombre:           string;
  descripcion?:     string;
  calorias?:        number | null;
  proteinas_g?:     number | null;
  carbohidratos_g?: number | null;
  grasas_g?:        number | null;
  ingredientes?:    any[];
  imagen?:          string | null;
}

export interface RecipesResponse { recipes: Recipe[] }

/** Una comida dentro de un plan, compuesta por recetas seleccionadas. */
export interface ComidaPlan {
  nombre: string;            // "Desayuno", "Comida", "Cena"…
  recetas: Recipe[];         // recetas elegidas de la biblioteca
}

export interface TrainerMember {
  id_miembro:    string;
  id_miembro_pg: number | null;
  nombre:        string;
  email:         string;
  is_my_client:  boolean;
}

export interface TrainerMembersResponse { members: TrainerMember[] }

// ── Reportes (dueño) ────────────────────────────────────────────────────────

export interface IngresoMes {
  label:  string;
  pagos:  number;
  ventas: number;
  total:  number;
}

export interface ActividadItem {
  tipo:   'pago' | 'registro' | 'venta' | string;
  titulo: string;
  sub?:   string;
  monto?: number;
  fecha:  string;
}

// ── IA / Analítica (Spark) ──────────────────────────────────────────────────

export interface ClusterResumen {
  cluster_id:      number;
  etiqueta:        string;
  num_miembros?:   number;
  imc_promedio?:   number;
  peso_promedio?:  number;
  grasa_promedio?: number;
}

export interface KMeansResponse {
  algoritmo:        string;
  silhouette:       number;
  resumen_clusters: ClusterResumen[];
  asignaciones?:    any[];
  desde_cache?:     boolean;
  error?:           string;
}

export interface PrediccionCancelacion {
  id_miembro:       string;
  nombre:           string;
  dias_sin_asistir: number;
  membresia_activa: boolean;
  probabilidad:     number;   // 0..1
  riesgo:           'alto' | 'medio' | 'bajo' | string;
}

export interface CancelacionesResponse {
  predicciones: PrediccionCancelacion[];
  resumen?: {
    total:        number;
    riesgo_alto:  number;
    riesgo_medio: number;
    activos:      number;
  };
  metricas?:    { accuracy?: number; auc_roc?: number };
  desde_cache?: boolean;
  error?:       string;
}

// ── Recepcionista ────────────────────────────────────────────────────────────

export interface ReceptionistDashboard {
  today_checkins:   number;
  active_members:   number;
  pending_payments: number;
  expiring_soon:    number;
  today_citas:      number;
}

export interface Checkin {
  id:                string;
  nombre:            string;
  hora_entrada:      string;
  hora_salida?:      string | null;
  membership_status: string;
}

export interface ReceptionistMember {
  id:             string;
  id_usuario_pg:  number | null;
  nombre:         string;
  email:          string;
  telefono?:      string;
  mem_status:     'activa' | 'por_vencer' | 'vencida' | 'sin_membresia' | string;
  tipo_membresia?: string | null;
  fecha_fin?:     string | null;
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
    /** Total del mes: membresías + punto de venta. No sumarle ventas_pos otra vez. */
    mes_actual:      number;
    membresias?:     number;
    punto_de_venta?: number;
    mes_anterior:    number;
    variacion_pct:   number;
    /** True si el mes anterior no tuvo ingresos: no hay porcentaje que mostrar. */
    sin_comparativa?: boolean;
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

/* El feed de actividad ya está declarado arriba como `ActividadItem`. */

/** Alerta operativa — GET /owner_gym/alertas. */
export interface AlertaOperativa {
  nivel:   'error' | 'warning' | 'info';
  tipo:    string;
  titulo:  string;
  detalle: string;
  icono?:  string;
}

export interface AlertasResponse {
  alertas: AlertaOperativa[];
  total:   number;
}

/** Membresía activa anidada en el miembro (Miembro.to_dict) */
export interface MiembroMembresia {
  nombre:        string;
  fecha_inicio?: string;
  fecha_fin?:    string;
  estado?:       string;
}

export interface MiembroAdmin {
  id?:            string;
  _id?:           string;
  nombre:         string;
  email:          string;
  foto_perfil?:   string | null;   // base64 data URI o null
  activo?:        boolean;
  estado?:        string;
  membresia?:     MiembroMembresia | null;
  fecha_ingreso?: string;
  registrationDate?: string;
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

/** Movimiento del feed unificado GET /api/pagos/todos */
export interface Movimiento {
  id:          string;
  tipo:        'membresia' | 'venta' | string;
  titulo:      string;
  monto:       number;
  metodo_pago?: string;
  concepto?:   string;
  fecha:       string;
  categoria?:  string | null;
}

export interface MovimientosResponse {
  movimientos: Movimiento[];
  total:       number;
  pages:       number;
  page:        number;
  per_page?:   number;
  /** Importe de todo el filtro, no solo de la página devuelta. */
  monto_total?: number;
  /** Años con movimientos; alimenta el selector de periodo. */
  anios?:      number[];
  filtro?:     { tipo: string; anio: number | null; mes: number | null };
}
