from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.miembro import Miembro
from app.models.rutina_models import Rutina, RutinaDia, RutinaEjercicio
from app.models.sesion_model import Sesion
from datetime import datetime, timedelta, date
from sqlalchemy import func, and_

trainer_bp = Blueprint("trainer", __name__, url_prefix="/api/trainer")

# ============================================
# UTILIDADES
# ============================================

def verificar_entrenador():
    """Verifica que el usuario actual sea un entrenador"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role.nombre != "Entrenador":
        return None
    
    return user

# ============================================
# DASHBOARD - ESTADÍSTICAS GENERALES
# ============================================

@trainer_bp.route("/dashboard/stats", methods=["GET"])
@jwt_required()
def get_dashboard_stats():
    """Obtiene estadísticas generales del dashboard del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    # Contar clientes activos
    active_clients = Miembro.query.filter(
        Miembro.id_entrenador == entrenador.id_usuario,
        Miembro.estado == "Activo"
    ).count()

    # Sesiones de hoy
    hoy = date.today()
    today_sessions = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha == hoy
    ).all()

    # Sesiones completadas este mes
    inicio_mes = date.today().replace(day=1)
    completed_sessions = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha >= inicio_mes,
        Sesion.estado == "completed"
    ).count()

    # Calificación promedio (simulada por ahora)
    avg_rating = 4.8

    # Sesiones en progreso hoy
    in_progress = sum(1 for s in today_sessions if s.estado == "in-progress")

    return jsonify({
        "stats": {
            "activeClients": active_clients,
            "todayClasses": len(today_sessions),
            "completedSessions": completed_sessions,
            "avgRating": avg_rating
        },
        "todayInProgress": in_progress
    }), 200


@trainer_bp.route("/dashboard/today-schedule", methods=["GET"])
@jwt_required()
def get_today_schedule():
    """Obtiene la agenda del día actual"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    hoy = date.today()
    sesiones = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha == hoy
    ).order_by(Sesion.hora_inicio).all()

    return jsonify({
        "schedule": [s.to_schedule_item() for s in sesiones]
    }), 200


@trainer_bp.route("/dashboard/recent-clients", methods=["GET"])
@jwt_required()
def get_recent_clients():
    """Obtiene progreso de clientes recientes"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    # Obtener últimos 5 clientes que tuvieron sesión
    miembros = Miembro.query.filter(
        Miembro.id_entrenador == entrenador.id_usuario,
        Miembro.estado == "Activo"
    ).limit(5).all()

    return jsonify({
        "clients": [m.to_client_card() for m in miembros]
    }), 200


# ============================================
# CLIENTES - GESTIÓN
# ============================================

@trainer_bp.route("/clients", methods=["GET"])
@jwt_required()
def get_clients():
    """Obtiene todos los clientes del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    status_filter = request.args.get("status", "all")
    search = request.args.get("search", "")

    query = Miembro.query.filter(Miembro.id_entrenador == entrenador.id_usuario)

    # Filtrar por estado
    if status_filter == "active":
        query = query.filter(Miembro.estado == "Activo")
    elif status_filter == "warning":
        # Miembros con baja asistencia (menos de 2 sesiones en el último mes)
        fecha_limite = date.today() - timedelta(days=30)
        subquery = db.session.query(
            db.func.count("*").label("count"),
            db.text("id_miembro")
        ).select_from(db.text("asistencias")).where(
            db.text(f"fecha >= '{fecha_limite}'")
        ).group_by(db.text("id_miembro")).subquery()
        
        query = query.outerjoin(subquery, Miembro.id_miembro == subquery.c.id_miembro).filter(
            db.or_(subquery.c.count < 2, subquery.c.count == None)
        )

    # Buscar por nombre
    if search:
        query = query.join(User).filter(User.nombre.ilike(f"%{search}%"))

    miembros = query.all()

    return jsonify({
        "clients": [m.to_client_card() for m in miembros]
    }), 200


@trainer_bp.route("/clients/<int:client_id>", methods=["GET"])
@jwt_required()
def get_client_detail(client_id):
    """Obtiene detalles completos de un cliente"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    miembro = Miembro.query.filter(
        Miembro.id_miembro == client_id,
        Miembro.id_entrenador == entrenador.id_usuario
    ).first()

    if not miembro:
        return jsonify({"error": "Cliente no encontrado"}), 404

    return jsonify(miembro.to_dict(include_stats=True)), 200


# ============================================
# RUTINAS - GESTIÓN
# ============================================

@trainer_bp.route("/routines", methods=["GET"])
@jwt_required()
def get_routines():
    """Obtiene todas las rutinas del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    category_filter = request.args.get("category", "all")
    search = request.args.get("search", "")

    # Obtener rutinas únicas (agrupadas por nombre)
    # Esto asume que las rutinas se reutilizan entre clientes
    query = db.session.query(
        Rutina.nombre,
        func.count(Rutina.id_rutina).label("clients"),
        func.min(Rutina.id_rutina).label("id_rutina")  # Tomar la primera rutina como referencia
    ).join(Miembro).filter(
        Miembro.id_entrenador == entrenador.id_usuario
    )

    if search:
        query = query.filter(Rutina.nombre.ilike(f"%{search}%"))

    query = query.group_by(Rutina.nombre)
    rutinas_agrupadas = query.all()

    # Construir respuesta con datos completos
    routines = []
    for nombre, num_clients, id_rutina_ref in rutinas_agrupadas:
        rutina = Rutina.query.get(id_rutina_ref)
        
        # Contar ejercicios totales
        total_ejercicios = db.session.query(func.count(RutinaEjercicio.id_rutina_ejercicio)).join(
            RutinaDia
        ).filter(RutinaDia.id_rutina == rutina.id_rutina).scalar()

        # Estimar duración (15 min por ejercicio aprox)
        duration_min = total_ejercicios * 15

        # Categorizar la rutina basada en el nombre
        category = _categorizar_rutina(nombre)

        routines.append({
            "id": rutina.id_rutina,
            "name": nombre,
            "category": category,
            "icon": _get_routine_icon(category),
            "duration": f"{duration_min} min",
            "exercises": total_ejercicios,
            "difficulty": "Intermedio",  # Se puede agregar lógica más compleja
            "clients": num_clients,
            "lastUsed": "Hoy",  # Se puede calcular desde última sesión
            "description": f"Rutina de {category.lower()} para desarrollo integral",
            "exerciseList": _get_exercise_list(rutina)
        })

    # Filtrar por categoría si se especifica
    if category_filter != "all":
        routines = [r for r in routines if r["category"] == category_filter]

    return jsonify({"routines": routines}), 200


def _categorizar_rutina(nombre):
    """Categoriza la rutina basada en su nombre"""
    nombre_lower = nombre.lower()
    if "fuerza" in nombre_lower or "strength" in nombre_lower:
        return "Fuerza"
    elif "hipertrofia" in nombre_lower or "masa" in nombre_lower:
        return "Hipertrofia"
    elif "cardio" in nombre_lower or "hiit" in nombre_lower or "running" in nombre_lower:
        return "Cardio"
    elif "funcional" in nombre_lower or "core" in nombre_lower:
        return "Funcional"
    elif "movilidad" in nombre_lower or "flexibilidad" in nombre_lower or "stretch" in nombre_lower:
        return "Movilidad"
    else:
        return "General"


def _get_routine_icon(category):
    """Retorna el icono correspondiente a la categoría"""
    icons = {
        "Fuerza": "GiWeightLiftingUp",
        "Hipertrofia": "GiMuscleUp",
        "Cardio": "GiRunningShoe",
        "Funcional": "GiMuscleUp",
        "Movilidad": "GiRunningShoe",
        "General": "GiMuscleUp"
    }
    return icons.get(category, "GiMuscleUp")


def _get_exercise_list(rutina):
    """Obtiene la lista de ejercicios de una rutina"""
    dias = RutinaDia.query.filter_by(id_rutina=rutina.id_rutina).order_by(RutinaDia.orden).all()
    
    ejercicios_list = []
    for dia in dias:
        ejercicios = RutinaEjercicio.query.filter_by(id_rutina_dia=dia.id_rutina_dia).order_by(RutinaEjercicio.orden).all()
        for ej in ejercicios:
            ejercicios_list.append({
                "name": ej.nombre_ejercicio,
                "sets": f"{ej.series}x{ej.repeticiones}",
                "rest": ej.notas or "60s"
            })
    
    return ejercicios_list


@trainer_bp.route("/routines/<int:routine_id>", methods=["GET"])
@jwt_required()
def get_routine_detail(routine_id):
    """Obtiene detalles completos de una rutina"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    rutina = Rutina.query.get(routine_id)
    if not rutina:
        return jsonify({"error": "Rutina no encontrada"}), 404

    # Verificar que la rutina pertenece a un miembro del entrenador
    if rutina.miembro.id_entrenador != entrenador.id_usuario:
        return jsonify({"error": "No autorizado"}), 403

    # Construir detalles completos
    total_ejercicios = db.session.query(func.count(RutinaEjercicio.id_rutina_ejercicio)).join(
        RutinaDia
    ).filter(RutinaDia.id_rutina == rutina.id_rutina).scalar()

    duration_min = total_ejercicios * 15
    category = _categorizar_rutina(rutina.nombre)

    return jsonify({
        "id": rutina.id_rutina,
        "name": rutina.nombre,
        "category": category,
        "icon": _get_routine_icon(category),
        "duration": f"{duration_min} min",
        "exercises": total_ejercicios,
        "difficulty": "Intermedio",
        "description": f"Rutina de {category.lower()} para desarrollo integral",
        "exerciseList": _get_exercise_list(rutina)
    }), 200


@trainer_bp.route("/routines", methods=["POST"])
@jwt_required()
def create_routine():
    """Crea una nueva rutina y la asigna a un miembro"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()
    
    # Validar datos requeridos
    if not data.get("nombre") or not data.get("id_miembro"):
        return jsonify({"error": "Nombre y miembro son requeridos"}), 400

    # Verificar que el miembro pertenece al entrenador
    miembro = Miembro.query.filter(
        Miembro.id_miembro == data["id_miembro"],
        Miembro.id_entrenador == entrenador.id_usuario
    ).first()

    if not miembro:
        return jsonify({"error": "Miembro no encontrado o no autorizado"}), 404

    # Crear rutina
    rutina = Rutina(
        id_miembro=miembro.id_miembro,
        nombre=data["nombre"],
        activa=True
    )
    db.session.add(rutina)
    db.session.flush()  # Para obtener el ID

    # Agregar días si se proporcionan
    if data.get("days"):
        for dia_data in data["days"]:
            dia = RutinaDia(
                id_rutina=rutina.id_rutina,
                dia_semana=dia_data.get("dia_semana"),
                grupo_muscular=dia_data.get("grupo_muscular"),
                orden=dia_data.get("orden", 0)
            )
            db.session.add(dia)
            db.session.flush()

            # Agregar ejercicios del día
            if dia_data.get("ejercicios"):
                for ej_data in dia_data["ejercicios"]:
                    ejercicio = RutinaEjercicio(
                        id_rutina_dia=dia.id_rutina_dia,
                        nombre_ejercicio=ej_data.get("nombre"),
                        series=ej_data.get("series", "3"),
                        repeticiones=ej_data.get("repeticiones", "12"),
                        peso=ej_data.get("peso"),
                        notas=ej_data.get("notas"),
                        orden=ej_data.get("orden", 0)
                    )
                    db.session.add(ejercicio)

    db.session.commit()

    return jsonify({
        "message": "Rutina creada exitosamente",
        "routine": {
            "id": rutina.id_rutina,
            "name": rutina.nombre
        }
    }), 201


@trainer_bp.route("/routines/<int:routine_id>/assign", methods=["POST"])
@jwt_required()
def assign_routine_to_client(routine_id):
    """Duplica una rutina existente y la asigna a otro miembro"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()
    id_miembro_destino = data.get("id_miembro")

    if not id_miembro_destino:
        return jsonify({"error": "ID de miembro es requerido"}), 400

    # Verificar que la rutina existe
    rutina_original = Rutina.query.get(routine_id)
    if not rutina_original:
        return jsonify({"error": "Rutina no encontrada"}), 404

    # Verificar que el miembro destino pertenece al entrenador
    miembro_destino = Miembro.query.filter(
        Miembro.id_miembro == id_miembro_destino,
        Miembro.id_entrenador == entrenador.id_usuario
    ).first()

    if not miembro_destino:
        return jsonify({"error": "Miembro no encontrado o no autorizado"}), 404

    # Duplicar rutina
    nueva_rutina = Rutina(
        id_miembro=miembro_destino.id_miembro,
        nombre=rutina_original.nombre,
        activa=True
    )
    db.session.add(nueva_rutina)
    db.session.flush()

    # Duplicar días y ejercicios
    dias_originales = RutinaDia.query.filter_by(id_rutina=rutina_original.id_rutina).all()
    for dia_orig in dias_originales:
        nuevo_dia = RutinaDia(
            id_rutina=nueva_rutina.id_rutina,
            dia_semana=dia_orig.dia_semana,
            grupo_muscular=dia_orig.grupo_muscular,
            orden=dia_orig.orden
        )
        db.session.add(nuevo_dia)
        db.session.flush()

        ejercicios_originales = RutinaEjercicio.query.filter_by(id_rutina_dia=dia_orig.id_rutina_dia).all()
        for ej_orig in ejercicios_originales:
            nuevo_ejercicio = RutinaEjercicio(
                id_rutina_dia=nuevo_dia.id_rutina_dia,
                nombre_ejercicio=ej_orig.nombre_ejercicio,
                series=ej_orig.series,
                repeticiones=ej_orig.repeticiones,
                peso=ej_orig.peso,
                notas=ej_orig.notas,
                orden=ej_orig.orden
            )
            db.session.add(nuevo_ejercicio)

    db.session.commit()

    return jsonify({
        "message": "Rutina asignada exitosamente",
        "routine": {
            "id": nueva_rutina.id_rutina,
            "name": nueva_rutina.nombre,
            "client": miembro_destino.usuario.nombre
        }
    }), 201


# ============================================
# AGENDA - GESTIÓN DE SESIONES
# ============================================

@trainer_bp.route("/schedule/week", methods=["GET"])
@jwt_required()
def get_week_schedule():
    """Obtiene la agenda de la semana"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    week_offset = int(request.args.get("offset", 0))
    
    # Calcular inicio de semana
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
    end_of_week = start_of_week + timedelta(days=6)

    # Obtener sesiones de la semana
    sesiones = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha >= start_of_week,
        Sesion.fecha <= end_of_week
    ).order_by(Sesion.fecha, Sesion.hora_inicio).all()

    # Agrupar por día de la semana (0=Domingo, 6=Sábado)
    sessions_by_day = {i: [] for i in range(7)}
    for sesion in sesiones:
        day_index = (sesion.fecha - start_of_week).days
        if 0 <= day_index <= 6:
            sessions_by_day[day_index].append(sesion.to_schedule_item())

    return jsonify({
        "sessions": sessions_by_day,
        "week_start": str(start_of_week),
        "week_end": str(end_of_week)
    }), 200


@trainer_bp.route("/schedule/sessions", methods=["POST"])
@jwt_required()
def create_session():
    """Crea una nueva sesión"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()

    # Validar datos requeridos
    required_fields = ["fecha", "hora_inicio", "tipo"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Campos requeridos: fecha, hora_inicio, tipo"}), 400

    # Validar fecha
    try:
        fecha = datetime.strptime(data["fecha"], "%Y-%m-%d").date()
        hora_inicio = datetime.strptime(data["hora_inicio"], "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Formato de fecha u hora inválido"}), 400

    # Si es personal, verificar miembro
    id_miembro = None
    if data["tipo"] == "Personal":
        if not data.get("id_miembro"):
            return jsonify({"error": "id_miembro es requerido para sesiones personales"}), 400
        
        miembro = Miembro.query.filter(
            Miembro.id_miembro == data["id_miembro"],
            Miembro.id_entrenador == entrenador.id_usuario
        ).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado o no autorizado"}), 404
        
        id_miembro = miembro.id_miembro

    # Crear sesión
    sesion = Sesion(
        id_entrenador=entrenador.id_usuario,
        id_miembro=id_miembro,
        fecha=fecha,
        hora_inicio=hora_inicio,
        duracion_minutos=data.get("duracion_minutos", 60),
        tipo=data["tipo"],
        ubicacion=data.get("ubicacion", ""),
        nombre_sesion=data.get("nombre_sesion", ""),
        estado="scheduled"
    )

    db.session.add(sesion)
    db.session.commit()

    return jsonify({
        "message": "Sesión creada exitosamente",
        "session": sesion.to_dict()
    }), 201


@trainer_bp.route("/schedule/sessions/<int:session_id>", methods=["PUT"])
@jwt_required()
def update_session_status(session_id):
    """Actualiza el estado de una sesión"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    sesion = Sesion.query.filter(
        Sesion.id_sesion == session_id,
        Sesion.id_entrenador == entrenador.id_usuario
    ).first()

    if not sesion:
        return jsonify({"error": "Sesión no encontrada"}), 404

    data = request.get_json()
    action = data.get("action")

    if action == "start":
        sesion.iniciar_sesion()
    elif action == "complete":
        sesion.completar_sesion(notas=data.get("notas"))
    elif action == "cancel":
        sesion.cancelar_sesion(motivo=data.get("motivo"))
    else:
        return jsonify({"error": "Acción no válida"}), 400

    return jsonify({
        "message": "Sesión actualizada",
        "session": sesion.to_dict()
    }), 200


# ============================================
# HISTORIAL DE SESIONES
# ============================================

@trainer_bp.route("/sessions/history", methods=["GET"])
@jwt_required()
def get_sessions_history():
    """Obtiene el historial de sesiones del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    status_filter = request.args.get("status", "all")
    date_range = request.args.get("range", "week")

    # Calcular rango de fechas
    today = date.today()
    if date_range == "week":
        start_date = today - timedelta(days=7)
    elif date_range == "month":
        start_date = today - timedelta(days=30)
    elif date_range == "quarter":
        start_date = today - timedelta(days=90)
    else:  # year
        start_date = today - timedelta(days=365)

    query = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha >= start_date
    )

    if status_filter != "all":
        query = query.filter(Sesion.estado == status_filter)

    sesiones = query.order_by(Sesion.fecha.desc(), Sesion.hora_inicio.desc()).all()

    return jsonify({
        "sessions": [s.to_dict() for s in sesiones]
    }), 200


# ============================================
# REPORTES Y ESTADÍSTICAS
# ============================================

@trainer_bp.route("/reports/stats", methods=["GET"])
@jwt_required()
def get_reports_stats():
    """Obtiene estadísticas para reportes"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    time_range = request.args.get("range", "month")

    # Calcular período
    today = date.today()
    if time_range == "week":
        start_date = today - timedelta(days=7)
    elif time_range == "month":
        start_date = today.replace(day=1)
    elif time_range == "quarter":
        start_date = today - timedelta(days=90)
    else:  # year
        start_date = today.replace(month=1, day=1)

    # Sesiones completadas
    sessions = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha >= start_date,
        Sesion.estado == "completed"
    ).count()

    # Clientes activos
    clients = Miembro.query.filter(
        Miembro.id_entrenador == entrenador.id_usuario,
        Miembro.estado == "Activo"
    ).count()

    # Calcular ingresos (estimado: $200 por sesión personal, $50 por grupal)
    sesiones_detalle = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.fecha >= start_date,
        Sesion.estado == "completed"
    ).all()

    revenue = sum(200 if s.tipo == "Personal" else 50 for s in sesiones_detalle)

    return jsonify({
        "stats": {
            "revenue": revenue,
            "sessions": sessions,
            "clients": clients,
            "avgRating": 4.8,
            "growth": {
                "revenue": 15,
                "sessions": 12,
                "clients": 8
            }
        }
    }), 200


@trainer_bp.route("/reports/monthly-data", methods=["GET"])
@jwt_required()
def get_monthly_data():
    """Obtiene datos mensuales para gráficos"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    # Últimos 5 meses
    monthly_data = []
    for i in range(4, -1, -1):
        mes_fecha = date.today().replace(day=1) - timedelta(days=30*i)
        mes_inicio = mes_fecha.replace(day=1)
        
        # Calcular fin de mes
        if mes_fecha.month == 12:
            mes_fin = mes_fecha.replace(year=mes_fecha.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            mes_fin = mes_fecha.replace(month=mes_fecha.month + 1, day=1) - timedelta(days=1)

        # Sesiones del mes
        sesiones = Sesion.query.filter(
            Sesion.id_entrenador == entrenador.id_usuario,
            Sesion.fecha >= mes_inicio,
            Sesion.fecha <= mes_fin,
            Sesion.estado == "completed"
        ).all()

        sessions_count = len(sesiones)
        revenue = sum(200 if s.tipo == "Personal" else 50 for s in sesiones)

        # Clientes activos al final del mes
        clients = Miembro.query.filter(
            Miembro.id_entrenador == entrenador.id_usuario,
            Miembro.estado == "Activo",
            Miembro.fecha_registro <= mes_fin
        ).count()

        monthly_data.append({
            "month": mes_fecha.strftime("%b"),
            "revenue": revenue,
            "sessions": sessions_count,
            "clients": clients
        })

    return jsonify({"monthlyData": monthly_data}), 200


@trainer_bp.route("/reports/top-clients", methods=["GET"])
@jwt_required()
def get_top_clients():
    """Obtiene los clientes con mejor progreso"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    miembros = Miembro.query.filter(
        Miembro.id_entrenador == entrenador.id_usuario,
        Miembro.estado == "Activo"
    ).all()

    # Ordenar por progreso
    miembros_con_progreso = []
    for m in miembros:
        card = m.to_client_card()
        miembros_con_progreso.append({
            "name": card["name"],
            "improvement": card["progress"],
            "sessions": card["sessionsTotal"]
        })

    # Ordenar por mejora
    miembros_con_progreso.sort(key=lambda x: x["improvement"], reverse=True)

    return jsonify({
        "topClients": miembros_con_progreso[:5]
    }), 200


# ============================================
# PERFIL DEL ENTRENADOR
# ============================================

@trainer_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_trainer_profile():
    """Obtiene el perfil del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    # Calcular estadísticas
    total_clients = Miembro.query.filter(
        Miembro.id_entrenador == entrenador.id_usuario
    ).count()

    total_sessions = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.estado == "completed"
    ).count()

    # Ingresos totales (estimado)
    sesiones_detalle = Sesion.query.filter(
        Sesion.id_entrenador == entrenador.id_usuario,
        Sesion.estado == "completed"
    ).all()
    total_earnings = sum(200 if s.tipo == "Personal" else 50 for s in sesiones_detalle)

    # Años activo
    fecha_creacion = entrenador.fecha_creacion
    years_active = (datetime.now() - fecha_creacion).days // 365 if fecha_creacion else 1

    return jsonify({
        "profile": {
            "name": entrenador.nombre,
            "email": entrenador.email,
            "phone": "+52 555 123 4567",  # Se puede agregar campo en User
            "address": "Ciudad de México, México",
            "specialization": "Fuerza y Acondicionamiento",
            "experience": f"{years_active} años",
            "certifications": "NSCA-CPT, CrossFit Level 2",
            "bio": f"Entrenador certificado con {years_active} años de experiencia."
        },
        "stats": {
            "totalClients": total_clients,
            "totalSessions": total_sessions,
            "totalEarnings": total_earnings,
            "avgRating": 4.8,
            "yearsActive": years_active,
            "certifications": 5
        }
    }), 200


@trainer_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_trainer_profile():
    """Actualiza el perfil del entrenador"""
    entrenador = verificar_entrenador()
    if not entrenador:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()

    # Actualizar campos permitidos
    if data.get("nombre"):
        entrenador.nombre = data["nombre"]
    if data.get("email"):
        entrenador.email = data["email"]

    db.session.commit()

    return jsonify({"message": "Perfil actualizado exitosamente"}), 200