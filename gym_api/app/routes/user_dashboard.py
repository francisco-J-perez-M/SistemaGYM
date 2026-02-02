from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, extract, desc
from app.extensions import db
from app.models.miembro import Miembro
from app.models.user import User
from app.models.asistencia import Asistencia
from app.models.miembro_membresia import MiembroMembresia
from app.models.progreso_fisico import ProgresoFisico

user_dashboard_bp = Blueprint('user_dashboard', __name__)

@user_dashboard_bp.route('/api/user/dashboard', methods=['GET'])
@jwt_required()
def get_user_dashboard():
    """
    Endpoint principal para obtener todos los datos del dashboard del usuario
    """
    try:
        # Obtener el ID del usuario autenticado
        user_id = int(get_jwt_identity())
        
        # Buscar el miembro asociado al usuario
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404

        # Obtener datos del usuario
        usuario = User.query.get(user_id)
        
        # 1. DATOS BÁSICOS DEL USUARIO
        user_data = {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "email": usuario.email,
            "role": "Miembro",
            "foto_perfil": miembro.foto_perfil
        }

        # 2. ESTADÍSTICAS DE WORKOUT
        workout_stats = _get_workout_stats(miembro.id_miembro, miembro.estatura)
        
        # 3. RUTINA DE HOY (simulada - puedes conectarla a una tabla real)
        today_workout = _get_today_workout()
        
        # 4. PROGRESO SEMANAL
        weekly_progress = _get_weekly_progress(miembro.id_miembro)
        
        # 5. LOGROS RECIENTES
        recent_achievements = _get_recent_achievements(miembro.id_miembro)
        
        # 6. INFORMACIÓN DE MEMBRESÍA ACTIVA
        membership_info = _get_active_membership(miembro.id_miembro)

        return jsonify({
            "user": user_data,
            "workoutStats": workout_stats,
            "todayWorkout": today_workout,
            "weeklyProgress": weekly_progress,
            "achievements": recent_achievements,
            "membership": membership_info
        }), 200

    except Exception as e:
        print(f"Error en get_user_dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def _get_workout_stats(id_miembro, estatura):
    """Calcula estadísticas de entrenamientos del usuario"""
    try:
        now = datetime.now()
        
        # Asistencias este mes
        asistencias_mes = Asistencia.query.filter(
            Asistencia.id_miembro == id_miembro,
            extract('year', Asistencia.fecha) == now.year,
            extract('month', Asistencia.fecha) == now.month
        ).count()
        
        # Calcular racha (días consecutivos)
        racha = _calcular_racha(id_miembro)
        
        # Calorías quemadas (estimación: 300 calorías por sesión)
        calorias_estimadas = asistencias_mes * 300
        
        # ✅ CORRECCIÓN: Obtener el peso más reciente
        progreso_reciente = ProgresoFisico.query.filter_by(
            id_miembro=id_miembro
        ).order_by(desc(ProgresoFisico.fecha_registro)).first()
        
        # Si no hay progreso registrado, usar peso inicial del miembro
        if progreso_reciente and progreso_reciente.peso:
            peso_actual = float(progreso_reciente.peso)
        else:
            # Buscar peso inicial del miembro
            miembro = Miembro.query.get(id_miembro)
            peso_actual = float(miembro.peso_inicial) if miembro and miembro.peso_inicial else 0
        
        # Calcular semana actual (basado en fecha de primera asistencia)
        primera_asistencia = Asistencia.query.filter_by(
            id_miembro=id_miembro
        ).order_by(Asistencia.fecha.asc()).first()
        
        if primera_asistencia:
            dias_desde_inicio = (now.date() - primera_asistencia.fecha).days
            semana_actual = (dias_desde_inicio // 7) + 1
        else:
            semana_actual = 1
        
        return {
            "currentWeek": semana_actual,
            "totalWorkouts": asistencias_mes,
            "caloriesBurned": calorias_estimadas,
            "streakDays": racha,
            "currentWeight": peso_actual
        }
    except Exception as e:
        print(f"Error en _get_workout_stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "currentWeek": 0,
            "totalWorkouts": 0,
            "caloriesBurned": 0,
            "streakDays": 0,
            "currentWeight": 0
        }


def _calcular_racha(id_miembro):
    """Calcula la racha de días consecutivos entrenando"""
    try:
        # Obtener asistencias ordenadas por fecha descendente
        asistencias = Asistencia.query.filter_by(
            id_miembro=id_miembro
        ).order_by(Asistencia.fecha.desc()).all()
        
        if not asistencias:
            return 0
        
        # Crear set de fechas únicas y ordenarlas
        fechas_asistencia = sorted(set([a.fecha for a in asistencias]), reverse=True)
        
        # Verificar si entrenó hoy o ayer (para contar racha actual)
        fecha_actual = datetime.now().date()
        fecha_mas_reciente = fechas_asistencia[0]
        
        # Si la última asistencia fue hace más de 1 día, no hay racha activa
        dias_desde_ultima = (fecha_actual - fecha_mas_reciente).days
        if dias_desde_ultima > 1:
            return 0
        
        racha = 0
        fecha_esperada = fecha_actual if dias_desde_ultima == 0 else fecha_actual - timedelta(days=1)
        
        for fecha in fechas_asistencia:
            if fecha == fecha_esperada:
                racha += 1
                fecha_esperada -= timedelta(days=1)
            elif fecha < fecha_esperada:
                # Hubo un salto, la racha se rompió
                break
        
        return racha
    except Exception as e:
        print(f"Error calculando racha: {e}")
        return 0


def _get_today_workout():
    """Retorna la rutina del día (simulada - conecta con tu sistema de rutinas)"""
    dias = ["Descanso", "Pecho y Tríceps", "Espalda y Bíceps", "Pierna", "Hombro", "Cardio", "Descanso"]
    dia_semana = datetime.now().weekday()
    
    rutinas = {
        "Pecho y Tríceps": [
            {"name": "Press Banca", "sets": "4x10", "completed": False},
            {"name": "Press Inclinado", "sets": "3x12", "completed": False},
            {"name": "Aperturas", "sets": "3x12", "completed": False},
            {"name": "Fondos", "sets": "3x15", "completed": False},
            {"name": "Extensiones Tríceps", "sets": "4x12", "completed": False}
        ],
        "Espalda y Bíceps": [
            {"name": "Dominadas", "sets": "4x8", "completed": False},
            {"name": "Remo con Barra", "sets": "4x10", "completed": False},
            {"name": "Jalones", "sets": "3x12", "completed": False},
            {"name": "Curl con Barra", "sets": "4x12", "completed": False},
            {"name": "Curl Martillo", "sets": "3x12", "completed": False}
        ],
        "Pierna": [
            {"name": "Sentadillas", "sets": "4x12", "completed": False},
            {"name": "Prensa", "sets": "3x15", "completed": False},
            {"name": "Extensiones", "sets": "3x12", "completed": False},
            {"name": "Curl Femoral", "sets": "4x10", "completed": False},
            {"name": "Elevación de Talones", "sets": "5x20", "completed": False}
        ],
        "Hombro": [
            {"name": "Press Militar", "sets": "4x10", "completed": False},
            {"name": "Elevaciones Laterales", "sets": "4x12", "completed": False},
            {"name": "Elevaciones Frontales", "sets": "3x12", "completed": False},
            {"name": "Pájaros", "sets": "3x15", "completed": False},
            {"name": "Encogimientos", "sets": "4x12", "completed": False}
        ],
        "Cardio": [
            {"name": "Caminadora", "sets": "30 min", "completed": False},
            {"name": "Bicicleta", "sets": "20 min", "completed": False},
            {"name": "Elíptica", "sets": "15 min", "completed": False}
        ]
    }
    
    tipo_rutina = dias[dia_semana]
    ejercicios = rutinas.get(tipo_rutina, [])
    
    return {
        "type": tipo_rutina,
        "exercises": ejercicios
    }


def _get_weekly_progress(id_miembro):
    """Obtiene el progreso de asistencias de la semana"""
    try:
        now = datetime.now()
        # Comenzar desde el lunes de esta semana
        inicio_semana = now - timedelta(days=now.weekday())
        
        progreso_diario = []
        
        for i in range(7):
            dia = inicio_semana + timedelta(days=i)
            asistencias = Asistencia.query.filter(
                Asistencia.id_miembro == id_miembro,
                Asistencia.fecha == dia.date()
            ).count()
            
            # Porcentaje: 100% si asistió, 0% si no
            porcentaje = 100 if asistencias > 0 else 0
            progreso_diario.append(porcentaje)
        
        return progreso_diario
    except Exception as e:
        print(f"Error en _get_weekly_progress: {e}")
        return [0, 0, 0, 0, 0, 0, 0]


def _get_recent_achievements(id_miembro):
    """Retorna logros recientes del usuario con iconos de react-icons"""
    achievements = []
    
    try:
        # Logro de racha
        racha = _calcular_racha(id_miembro)
        if racha >= 7:
            achievements.append({
                "icon": "FaFire",  # Se interpreta en el frontend
                "title": f"Racha de {racha} días",
                "description": "Completado hoy",
                "color": "var(--accent-color)"
            })
        elif racha >= 3:
            achievements.append({
                "icon": "FaFire",
                "title": f"Racha de {racha} días",
                "description": "¡Sigue así!",
                "color": "var(--warning-color)"
            })
        
        # Logro de peso (si tiene progreso)
        progresos = ProgresoFisico.query.filter_by(
            id_miembro=id_miembro
        ).order_by(desc(ProgresoFisico.fecha_registro)).limit(2).all()
        
        if len(progresos) >= 2:
            diferencia = float(progresos[0].peso) - float(progresos[1].peso)
            if abs(diferencia) >= 1:
                signo = "+" if diferencia > 0 else ""
                achievements.append({
                    "icon": "FaDumbbell",
                    "title": f"{signo}{diferencia:.1f}kg de progreso",
                    "description": "Última medición",
                    "color": "var(--success-color)"
                })
        
        # Logro de asistencias del mes
        asistencias_mes = Asistencia.query.filter(
            Asistencia.id_miembro == id_miembro,
            extract('month', Asistencia.fecha) == datetime.now().month,
            extract('year', Asistencia.fecha) == datetime.now().year
        ).count()
        
        if asistencias_mes >= 20:
            achievements.append({
                "icon": "FaTrophy",
                "title": f"{asistencias_mes} entrenamientos",
                "description": "¡Campeón del mes!",
                "color": "var(--accent-color)"
            })
        elif asistencias_mes >= 12:
            achievements.append({
                "icon": "FaBolt",
                "title": f"{asistencias_mes} entrenamientos",
                "description": "Este mes",
                "color": "var(--warning-color)"
            })
        
    except Exception as e:
        print(f"Error en _get_recent_achievements: {e}")
    
    return achievements


def _get_active_membership(id_miembro):
    """Obtiene información de la membresía activa del usuario"""
    try:
        membresia_activa = MiembroMembresia.query.filter_by(
            id_miembro=id_miembro,
            estado='Activa'
        ).first()
        
        if not membresia_activa:
            return None
        
        dias_restantes = (membresia_activa.fecha_fin - datetime.now().date()).days
        
        return {
            "plan": membresia_activa.membresia.nombre if membresia_activa.membresia else "N/A",
            "fecha_fin": membresia_activa.fecha_fin.strftime('%Y-%m-%d'),
            "dias_restantes": dias_restantes,
            "estado": "activa" if dias_restantes > 0 else "por_vencer"
        }
    except Exception as e:
        print(f"Error en _get_active_membership: {e}")
        return None


# ============================================
# ENDPOINT PARA MARCAR EJERCICIOS COMPLETADOS
# ============================================
@user_dashboard_bp.route('/api/user/workout/complete', methods=['POST'])
@jwt_required()
def complete_exercise():
    """
    Marca un ejercicio como completado
    (En una implementación real, guardarías esto en la DB)
    """
    try:
        from flask import request
        data = request.json
        
        # Aquí podrías guardar en una tabla workout_sessions
        # Por ahora solo retornamos éxito
        
        return jsonify({
            "message": "Ejercicio marcado como completado",
            "exercise": data.get("exercise_name")
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# ENDPOINT PARA REGISTRAR ASISTENCIA
# ============================================
@user_dashboard_bp.route('/api/user/checkin', methods=['POST'])
@jwt_required()
def register_checkin():
    """Registra la asistencia del usuario al gimnasio"""
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Verificar si ya registró asistencia hoy
        hoy = datetime.now().date()
        asistencia_hoy = Asistencia.query.filter(
            Asistencia.id_miembro == miembro.id_miembro,
            Asistencia.fecha == hoy
        ).first()
        
        if asistencia_hoy:
            return jsonify({"message": "Ya registraste tu asistencia hoy"}), 200
        
        # Crear nueva asistencia
        nueva_asistencia = Asistencia(
            id_miembro=miembro.id_miembro,
            fecha=hoy,
            hora_entrada=datetime.now().time()
        )
        
        db.session.add(nueva_asistencia)
        db.session.commit()
        
        return jsonify({
            "message": "Asistencia registrada exitosamente",
            "fecha": hoy.strftime('%Y-%m-%d')
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en register_checkin: {e}")
        return jsonify({"error": str(e)}), 500


# ============================================
# ENDPOINT PARA REGISTRAR PROGRESO FÍSICO
# ============================================
@user_dashboard_bp.route('/api/user/progress', methods=['POST'])
@jwt_required()
def register_progress():
    """Registra el progreso físico del usuario"""
    try:
        from flask import request
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        
        # Crear nuevo registro de progreso
        nuevo_progreso = ProgresoFisico(
            id_miembro=miembro.id_miembro,
            peso=data.get('peso'),
            bmi=data.get('bmi'),
            cintura=data.get('cintura'),
            cadera=data.get('cadera'),
            fecha_registro=datetime.now().date()
        )
        
        # Calcular BMI automáticamente si no viene
        if not nuevo_progreso.bmi and miembro.estatura:
            estatura_metros = float(miembro.estatura) / 100  # convertir cm a metros
            nuevo_progreso.calcular_bmi(estatura_metros)
        
        db.session.add(nuevo_progreso)
        db.session.commit()
        
        return jsonify({
            "message": "Progreso registrado exitosamente",
            "progreso": nuevo_progreso.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en register_progress: {e}")
        return jsonify({"error": str(e)}), 500