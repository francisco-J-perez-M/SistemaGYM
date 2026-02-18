from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.miembro import Miembro
from app.models.user import User
from app.models.sesion_model import Sesion
from app.models.progreso_fisico import ProgresoFisico
from app.models.asistencia import Asistencia
from app.models.pago import Pago
from app.models.rutina_models import Rutina, RutinaDia, RutinaEjercicio, MiembroRutina
from app.extensions import db
from sqlalchemy import func, desc
from datetime import datetime, date, timedelta
import traceback

trainer_bp = Blueprint('trainer', __name__, url_prefix='/api/trainer')

# Importaciones condicionales para modelos que pueden no existir
try:
    from app.models.perfil_entrenador import PerfilEntrenador
    HAS_PERFIL_ENTRENADOR = True
except ImportError:
    HAS_PERFIL_ENTRENADOR = False
    print("  Modelo PerfilEntrenador no encontrado")

try:
    from app.models.certificacion_entrenador import CertificacionEntrenador
    HAS_CERTIFICACION = True
except ImportError:
    HAS_CERTIFICACION = False
    print("  Modelo CertificacionEntrenador no encontrado")

try:
    from app.models.logro_entrenador import LogroEntrenador
    HAS_LOGRO = True
except ImportError:
    HAS_LOGRO = False
    print("  Modelo LogroEntrenador no encontrado")

try:
    from app.models.evaluacion_entrenador import EvaluacionEntrenador
    HAS_EVALUACION = True
except ImportError:
    HAS_EVALUACION = False
    print("  Modelo EvaluacionEntrenador no encontrado")


# ═══════════════════════════════════════════════════════════════
#  RUTAS EXISTENTES (sin cambios)
# ═══════════════════════════════════════════════════════════════

@trainer_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_trainer_clients():
    try:
        current_user_id = get_jwt_identity()
        print(f" Obteniendo clientes para entrenador ID: {current_user_id}")
        miembros = Miembro.query.filter_by(id_entrenador=current_user_id).all()
        print(f" Encontrados {len(miembros)} miembros")
        clients_data = []
        for miembro in miembros:
            try:
                usuario = User.query.get(miembro.id_usuario)
                total_sesiones = Sesion.query.filter_by(
                    id_miembro=miembro.id_miembro, estado='completed'
                ).count()
                inicio_mes = datetime.now().replace(day=1)
                asistencias_mes = Asistencia.query.filter(
                    Asistencia.id_miembro == miembro.id_miembro,
                    Asistencia.fecha >= inicio_mes
                ).count()
                ultima_sesion = Sesion.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(desc(Sesion.fecha)).first()
                racha = calcular_racha_dias(miembro.id_miembro)
                progreso_inicial = ProgresoFisico.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(ProgresoFisico.fecha_registro).first()
                progreso_actual = ProgresoFisico.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(desc(ProgresoFisico.fecha_registro)).first()
                progreso_porcentaje = calcular_progreso_porcentaje(miembro, progreso_inicial, progreso_actual)
                tasa_asistencia = calcular_tasa_asistencia(miembro.id_miembro)
                tendencia = determinar_tendencia(progreso_inicial, progreso_actual)
                estado = determinar_estado_cliente(ultima_sesion, tasa_asistencia)
                if ultima_sesion:
                    dias_diferencia = (datetime.now().date() - ultima_sesion.fecha).days
                    if dias_diferencia == 0:
                        ultima_sesion_texto = "Hoy"
                    elif dias_diferencia == 1:
                        ultima_sesion_texto = "Ayer"
                    else:
                        ultima_sesion_texto = f"Hace {dias_diferencia} días"
                else:
                    ultima_sesion_texto = "Nunca"
                client_data = {
                    'id': miembro.id_miembro,
                    'name': usuario.nombre if usuario else "Sin nombre",
                    'age': calcular_edad(miembro.fecha_nacimiento) if miembro.fecha_nacimiento else 0,
                    'goal': miembro.objetivo or "Sin objetivo definido",
                    'progress': progreso_porcentaje,
                    'lastSession': ultima_sesion_texto,
                    'streak': racha,
                    'sessionsTotal': total_sesiones,
                    'attendance': tasa_asistencia,
                    'status': estado,
                    'trend': tendencia,
                    'stats': {
                        'weight': {
                            'initial': float(progreso_inicial.peso) if progreso_inicial and progreso_inicial.peso else 0,
                            'current': float(progreso_actual.peso) if progreso_actual and progreso_actual.peso else 0,
                            'goal': float(miembro.peso_objetivo) if miembro.peso_objetivo else 0
                        },
                        'muscle': {
                            'initial': float(progreso_inicial.masa_muscular) if progreso_inicial and progreso_inicial.masa_muscular else 0,
                            'current': float(progreso_actual.masa_muscular) if progreso_actual and progreso_actual.masa_muscular else 0,
                            'goal': float(miembro.masa_muscular_objetivo) if miembro.masa_muscular_objetivo else 0
                        },
                        'fat': {
                            'initial': float(progreso_inicial.grasa_corporal) if progreso_inicial and progreso_inicial.grasa_corporal else 0,
                            'current': float(progreso_actual.grasa_corporal) if progreso_actual and progreso_actual.grasa_corporal else 0,
                            'goal': float(miembro.grasa_objetivo) if miembro.grasa_objetivo else 0
                        }
                    }
                }
                clients_data.append(client_data)
            except Exception as e:
                print(f"  Error procesando miembro {miembro.id_miembro}: {str(e)}")
                continue
        return jsonify({'success': True, 'clients': clients_data}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@trainer_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_trainer_profile():
    try:
        current_user_id = get_jwt_identity()
        usuario = User.query.get(current_user_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        perfil = None
        if HAS_PERFIL_ENTRENADOR:
            try:
                perfil = PerfilEntrenador.query.filter_by(id_entrenador=current_user_id).first()
            except Exception as e:
                print(f"  Error obteniendo perfil: {str(e)}")
        certificaciones = []
        if HAS_CERTIFICACION:
            try:
                certificaciones = CertificacionEntrenador.query.filter_by(id_entrenador=current_user_id).all()
            except Exception as e:
                print(f"  Error obteniendo certificaciones: {str(e)}")
        logros = []
        if HAS_LOGRO:
            try:
                logros = LogroEntrenador.query.filter_by(
                    id_entrenador=current_user_id
                ).order_by(desc(LogroEntrenador.fecha)).limit(4).all()
            except Exception as e:
                print(f"  Error obteniendo logros: {str(e)}")
        total_clientes = Miembro.query.filter_by(id_entrenador=current_user_id).count()
        total_sesiones = Sesion.query.filter_by(
            id_entrenador=current_user_id, estado='completed'
        ).count()
        total_ingresos = 0
        try:
            total_ingresos_query = db.session.query(func.sum(Pago.monto)).filter(
                Pago.id_entrenador == current_user_id
            ).scalar()
            total_ingresos = float(total_ingresos_query) if total_ingresos_query else 0
        except Exception as e:
            print(f"  Error calculando ingresos: {str(e)}")
        calificacion_promedio = 0
        if HAS_EVALUACION:
            try:
                calificacion_query = db.session.query(func.avg(EvaluacionEntrenador.calificacion)).filter(
                    EvaluacionEntrenador.id_entrenador == current_user_id
                ).scalar()
                calificacion_promedio = float(calificacion_query) if calificacion_query else 0
            except Exception as e:
                print(f"  Error calculando calificación: {str(e)}")
        fecha_creacion = perfil.fecha_creacion if perfil and hasattr(perfil, 'fecha_creacion') else usuario.fecha_creacion
        anos_activos = (datetime.now() - fecha_creacion).days // 365
        profile_data = {
            'name': usuario.nombre or '',
            'email': usuario.email or '',
            'phone': perfil.telefono if perfil and hasattr(perfil, 'telefono') else '',
            'address': perfil.direccion if perfil and hasattr(perfil, 'direccion') else '',
            'specialization': perfil.especializacion if perfil and hasattr(perfil, 'especializacion') else '',
            'experience': f"{anos_activos} años",
            'certifications': ', '.join([c.nombre for c in certificaciones]) if certificaciones else '',
            'bio': perfil.biografia if perfil and hasattr(perfil, 'biografia') else '',
            'stats': {
                'totalClients': total_clientes,
                'totalSessions': total_sesiones,
                'totalEarnings': total_ingresos,
                'avgRating': round(calificacion_promedio, 1),
                'yearsActive': anos_activos,
                'certifications': len(certificaciones)
            },
            'achievements': [
                {
                    'title': logro.titulo,
                    'date': logro.fecha.strftime('%B %Y') if logro.fecha else '',
                    'description': logro.descripcion or ''
                }
                for logro in logros
            ] if logros else []
        }
        return jsonify({'success': True, 'profile': profile_data}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@trainer_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_trainer_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        usuario = User.query.get(current_user_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        if 'name' in data:
            usuario.nombre = data['name']
        if 'email' in data:
            usuario.email = data['email']
        if HAS_PERFIL_ENTRENADOR:
            try:
                perfil = PerfilEntrenador.query.filter_by(id_entrenador=current_user_id).first()
                if not perfil:
                    perfil = PerfilEntrenador(id_entrenador=current_user_id)
                    db.session.add(perfil)
                if 'phone' in data:
                    perfil.telefono = data['phone']
                if 'address' in data:
                    perfil.direccion = data['address']
                if 'specialization' in data:
                    perfil.especializacion = data['specialization']
                if 'bio' in data:
                    perfil.biografia = data['bio']
            except Exception as e:
                print(f"  Error actualizando perfil: {str(e)}")
        db.session.commit()
        return jsonify({'success': True, 'message': 'Perfil actualizado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ═══════════════════════════════════════════════════════════════
#  NUEVAS RUTAS — AGENDA (SCHEDULE)
# ═══════════════════════════════════════════════════════════════

@trainer_bp.route('/schedule', methods=['GET'])
@jwt_required()
def get_schedule():
    """
    Devuelve las sesiones agrupadas por día para una semana dada.
    Query param:  week_offset  (0 = semana actual, -1 = anterior, 1 = siguiente)
    """
    try:
        trainer_id = get_jwt_identity()
        week_offset = int(request.args.get('week_offset', 0))

        today = date.today()
        # Lunes de la semana objetivo
        start_of_week = today - timedelta(days=today.weekday()) + timedelta(weeks=week_offset)
        end_of_week   = start_of_week + timedelta(days=6)

        sessions = Sesion.query.filter(
            Sesion.id_entrenador == trainer_id,
            Sesion.fecha >= start_of_week,
            Sesion.fecha <= end_of_week
        ).order_by(Sesion.fecha, Sesion.hora_inicio).all()

        # Construir estructura día a día (0 = lunes … 6 = domingo)
        schedule = {}
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            schedule[str(i)] = {
                "date":       day.isoformat(),
                "day_name":   _nombre_dia(day),
                "day_number": day.day,
                "is_today":   day == today,
                "sessions":   []
            }

        for s in sessions:
            day_index = (s.fecha - start_of_week).days
            if 0 <= day_index <= 6:
                schedule[str(day_index)]["sessions"].append(_sesion_to_dict(s))

        return jsonify({
            "week_start":     start_of_week.isoformat(),
            "week_end":       end_of_week.isoformat(),
            "schedule":       schedule,
            "total_sessions": len(sessions)
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
#  NUEVAS RUTAS — HISTORIAL DE SESIONES
# ═══════════════════════════════════════════════════════════════

@trainer_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """
    Lista sesiones con filtros opcionales.
    Query params:
        status   : all | completed | in-progress | scheduled | cancelled
        range    : today | week | month
        page     : int  (default 1)
        per_page : int  (default 20)
    """
    try:
        trainer_id  = get_jwt_identity()
        status_f    = request.args.get('status', 'all')
        date_range  = request.args.get('range', 'week')
        page        = int(request.args.get('page', 1))
        per_page    = int(request.args.get('per_page', 20))

        today = date.today()
        query = Sesion.query.filter(Sesion.id_entrenador == trainer_id)

        # ── Filtro de rango de fechas ──────────────────────────
        if date_range == 'today':
            query = query.filter(Sesion.fecha == today)
        elif date_range == 'week':
            start = today - timedelta(days=today.weekday())
            end   = start + timedelta(days=6)
            query = query.filter(Sesion.fecha >= start, Sesion.fecha <= end)
        elif date_range == 'month':
            start = today.replace(day=1)
            query = query.filter(Sesion.fecha >= start)

        # ── Filtro de estado ───────────────────────────────────
        if status_f != 'all':
            query = query.filter(Sesion.estado == status_f)

        query = query.order_by(desc(Sesion.fecha), desc(Sesion.hora_inicio))

        total    = query.count()
        sessions = query.offset((page - 1) * per_page).limit(per_page).all()

        # ── Stats globales del entrenador (sin filtros de rango) ─
        all_sessions = Sesion.query.filter(Sesion.id_entrenador == trainer_id).all()
        stats = _compute_stats(all_sessions)

        return jsonify({
            "sessions": [_sesion_to_dict(s) for s in sessions],
            "total":    total,
            "page":     page,
            "per_page": per_page,
            "stats":    stats
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session_detail(session_id):
    try:
        trainer_id = get_jwt_identity()
        s = Sesion.query.filter_by(id_sesion=session_id, id_entrenador=trainer_id).first()
        if not s:
            return jsonify({"error": "Sesión no encontrada"}), 404
        return jsonify(_sesion_to_dict(s)), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    try:
        trainer_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify({"error": "No se recibieron datos"}), 400

        for field in ['fecha', 'hora_inicio']:
            if field not in data:
                return jsonify({"error": f"Campo requerido: {field}"}), 400

        nueva = Sesion(
            id_entrenador    = trainer_id,
            id_miembro       = data.get('id_miembro'),
            fecha            = datetime.strptime(data['fecha'], '%Y-%m-%d').date(),
            hora_inicio      = datetime.strptime(data['hora_inicio'], '%H:%M').time(),
            duracion_minutos = int(data.get('duracion_minutos', 60)),
            tipo             = data.get('tipo', 'Personal'),
            ubicacion        = data.get('ubicacion', ''),
            estado           = 'scheduled',
            nombre_sesion    = data.get('nombre_sesion', ''),
            notas            = data.get('notas', ''),
            num_ejercicios   = int(data.get('num_ejercicios', 0)),
            asistencia       = False,
        )
        db.session.add(nueva)
        db.session.commit()

        return jsonify({"message": "Sesión creada", "id_sesion": nueva.id_sesion}), 201

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/sessions/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    try:
        trainer_id = get_jwt_identity()
        s = Sesion.query.filter_by(id_sesion=session_id, id_entrenador=trainer_id).first()
        if not s:
            return jsonify({"error": "Sesión no encontrada"}), 404

        data = request.get_json() or {}
        if 'fecha'            in data: s.fecha            = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
        if 'hora_inicio'      in data: s.hora_inicio      = datetime.strptime(data['hora_inicio'], '%H:%M').time()
        if 'duracion_minutos' in data: s.duracion_minutos = int(data['duracion_minutos'])
        if 'tipo'             in data: s.tipo             = data['tipo']
        if 'ubicacion'        in data: s.ubicacion        = data['ubicacion']
        if 'estado'           in data: s.estado           = data['estado']
        if 'nombre_sesion'    in data: s.nombre_sesion    = data['nombre_sesion']
        if 'notas'            in data: s.notas            = data['notas']
        if 'asistencia'       in data: s.asistencia       = bool(data['asistencia'])
        if 'num_ejercicios'   in data: s.num_ejercicios   = int(data['num_ejercicios'])

        db.session.commit()
        return jsonify({"message": "Sesión actualizada"}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/sessions/<int:session_id>/status', methods=['PATCH'])
@jwt_required()
def update_session_status(session_id):
    try:
        trainer_id = get_jwt_identity()
        s = Sesion.query.filter_by(id_sesion=session_id, id_entrenador=trainer_id).first()
        if not s:
            return jsonify({"error": "Sesión no encontrada"}), 404

        data       = request.get_json() or {}
        new_status = data.get('status')
        valid      = ['scheduled', 'in-progress', 'completed', 'cancelled']

        if new_status not in valid:
            return jsonify({"error": f"Estado inválido. Opciones: {valid}"}), 400

        s.estado = new_status
        if new_status == 'completed':
            s.asistencia = True

        db.session.commit()
        return jsonify({"message": f"Estado actualizado a {new_status}"}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    try:
        trainer_id = get_jwt_identity()
        s = Sesion.query.filter_by(id_sesion=session_id, id_entrenador=trainer_id).first()
        if not s:
            return jsonify({"error": "Sesión no encontrada"}), 404

        db.session.delete(s)
        db.session.commit()
        return jsonify({"message": "Sesión eliminada"}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@trainer_bp.route('/members', methods=['GET'])
@jwt_required()
def get_trainer_members():
    """Lista de miembros activos asignados al entrenador (para selector en formularios)"""
    try:
        trainer_id = get_jwt_identity()
        miembros   = Miembro.query.filter_by(id_entrenador=trainer_id, estado='Activo').all()
        members    = []
        for m in miembros:
            user = User.query.get(m.id_usuario) if m.id_usuario else None
            members.append({
                "id_miembro": m.id_miembro,
                "nombre":     user.nombre if user else f"Miembro {m.id_miembro}",
                "email":      user.email  if user else "",
            })
        return jsonify({"members": members}), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
#  HELPERS PRIVADOS
# ═══════════════════════════════════════════════════════════════

_DIAS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

def _nombre_dia(d: date) -> str:
    return _DIAS_ES[d.weekday()]


def _get_client_name(s: Sesion) -> str:
    """Resuelve el nombre para mostrar de una sesión"""
    if s.nombre_sesion:
        return s.nombre_sesion
    if s.id_miembro:
        m = Miembro.query.get(s.id_miembro)
        if m and m.id_usuario:
            u = User.query.get(m.id_usuario)
            if u:
                return u.nombre
    return "Cliente sin asignar"


def _sesion_to_dict(s: Sesion) -> dict:
    return {
        "id_sesion":    s.id_sesion,
        "date":         s.fecha.isoformat()            if s.fecha        else None,
        "time":         s.hora_inicio.strftime('%H:%M') if s.hora_inicio  else "00:00",
        "client":       _get_client_name(s),
        "type":         s.tipo,
        "duration":     f"{s.duracion_minutos} min",
        "duracion_minutos": s.duracion_minutos,
        "location":     s.ubicacion       or "Sin ubicación",
        "status":       s.estado,
        "notes":        s.notas           or "",
        "exercises":    s.num_ejercicios  or 0,
        "attendance":   bool(s.asistencia),
        "nombre_sesion": s.nombre_sesion  or "",
        "id_miembro":   s.id_miembro,
    }


def _compute_stats(sessions: list) -> dict:
    total = len(sessions)
    if total == 0:
        return {"total": 0, "completed": 0, "scheduled": 0,
                "cancelled": 0, "in_progress": 0, "attendance_rate": 0}
    completed   = sum(1 for s in sessions if s.estado == 'completed')
    scheduled   = sum(1 for s in sessions if s.estado == 'scheduled')
    cancelled   = sum(1 for s in sessions if s.estado == 'cancelled')
    in_progress = sum(1 for s in sessions if s.estado == 'in-progress')
    attended    = sum(1 for s in sessions if s.asistencia)
    return {
        "total":           total,
        "completed":       completed,
        "scheduled":       scheduled,
        "cancelled":       cancelled,
        "in_progress":     in_progress,
        "attendance_rate": round((attended / total) * 100) if total else 0,
    }


# ═══════════════════════════════════════════════════════════════
#  HELPERS DE CÁLCULO (ya existentes, sin cambios)
# ═══════════════════════════════════════════════════════════════

def calcular_racha_dias(id_miembro):
    try:
        asistencias = Asistencia.query.filter_by(
            id_miembro=id_miembro
        ).order_by(desc(Asistencia.fecha)).all()
        if not asistencias:
            return 0
        racha = 0
        fecha_actual = datetime.now().date()
        for asistencia in asistencias:
            if asistencia.fecha == fecha_actual or asistencia.fecha == fecha_actual - timedelta(days=racha):
                racha += 1
                fecha_actual = asistencia.fecha
            else:
                break
        return racha
    except Exception as e:
        print(f"  Error calculando racha: {str(e)}")
        return 0


def calcular_progreso_porcentaje(miembro, progreso_inicial, progreso_actual):
    try:
        if not progreso_inicial or not progreso_actual or not miembro.peso_objetivo:
            return 0
        peso_inicial = float(progreso_inicial.peso) if progreso_inicial.peso else 0
        peso_actual  = float(progreso_actual.peso)  if progreso_actual.peso  else 0
        peso_objetivo = float(miembro.peso_objetivo)
        if peso_inicial == peso_objetivo:
            return 100
        progreso      = abs(peso_inicial - peso_actual)
        objetivo_total = abs(peso_inicial - peso_objetivo)
        if objetivo_total == 0:
            return 100
        return min(round((progreso / objetivo_total) * 100), 100)
    except Exception as e:
        print(f"  Error calculando progreso: {str(e)}")
        return 0


def calcular_tasa_asistencia(id_miembro):
    try:
        fecha_inicio = datetime.now().date() - timedelta(days=30)
        programadas  = Sesion.query.filter(
            Sesion.id_miembro == id_miembro,
            Sesion.fecha >= fecha_inicio,
            Sesion.estado.in_(['completed', 'cancelled'])
        ).count()
        if programadas == 0:
            return 0
        completadas = Sesion.query.filter(
            Sesion.id_miembro == id_miembro,
            Sesion.fecha >= fecha_inicio,
            Sesion.estado == 'completed'
        ).count()
        return round((completadas / programadas) * 100)
    except Exception as e:
        print(f"  Error calculando asistencia: {str(e)}")
        return 0


def determinar_tendencia(progreso_inicial, progreso_actual):
    try:
        if not progreso_inicial or not progreso_actual:
            return 'stable'
        peso_inicial = float(progreso_inicial.peso) if progreso_inicial.peso else 0
        peso_actual  = float(progreso_actual.peso)  if progreso_actual.peso  else 0
        diferencia   = peso_inicial - peso_actual
        if abs(diferencia) < 1:
            return 'stable'
        return 'down' if diferencia > 0 else 'up'
    except Exception:
        return 'stable'


def determinar_estado_cliente(ultima_sesion, tasa_asistencia):
    try:
        if not ultima_sesion:
            return 'warning'
        dias = (datetime.now().date() - ultima_sesion.fecha).days
        return 'warning' if dias > 7 or tasa_asistencia < 70 else 'active'
    except Exception:
        return 'active'


def calcular_edad(fecha_nacimiento):
    try:
        if not fecha_nacimiento:
            return 0
        hoy  = datetime.now().date()
        edad = hoy.year - fecha_nacimiento.year
        if hoy.month < fecha_nacimiento.month or (
            hoy.month == fecha_nacimiento.month and hoy.day < fecha_nacimiento.day
        ):
            edad -= 1
        return edad
    except Exception:
        return 0
    
# ───────────────────────────────────────────────────────────────
#  BIBLIOTECA DE RUTINAS
# ───────────────────────────────────────────────────────────────
@trainer_bp.route('/routines', methods=['GET'])
@jwt_required()
def get_routines():
    """
    Lista rutinas del entrenador.
    Query params:
        category : all | Fuerza | Hipertrofia | Cardio | Funcional | Movilidad
        search   : str
    """
    try:
        trainer_id = get_jwt_identity()
        category   = request.args.get('category', 'all')
        search     = request.args.get('search', '').strip()

        # ── Filtrar por entrenador ────────────────────────────
        query = Rutina.query.filter_by(id_entrenador=trainer_id)

        if category != 'all':
            query = query.filter(Rutina.categoria == category)

        if search:
            query = query.filter(Rutina.nombre.ilike(f'%{search}%'))

        routines = query.order_by(desc(Rutina.fecha_actualizacion)).all()

        result = []
        for r in routines:
            # Clientes con esta rutina asignada
            try:
                clients_count = MiembroRutina.query.filter_by(
                    id_rutina=r.id_rutina, activa=True
                ).count()
            except Exception:
                clients_count = 0

            # Ejercicios totales de todos los días
            exercise_list  = []
            total_ejercicios = 0
            for dia in r.dias:
                sorted_ejs = sorted(dia.ejercicios, key=lambda x: x.orden)
                total_ejercicios += len(sorted_ejs)
                for ej in sorted_ejs:
                    exercise_list.append({
                        'name': ej.nombre_ejercicio,
                        'sets': f"{ej.series}x{ej.repeticiones}",
                        'rest': ej.notas or '60s',
                        'day':  dia.dia_semana or '',
                        'peso': ej.peso or ''
                    })

            result.append({
                'id':           r.id_rutina,
                'name':         r.nombre,
                'category':     r.categoria   or 'General',
                'duration':     f"{r.duracion_minutos or 60} min",
                'exercises':    total_ejercicios,
                'difficulty':   r.dificultad  or 'Intermedio',
                'clients':      clients_count,
                'description':  r.descripcion or '',
                'active':       bool(r.activa),
                'lastUsed':     _format_fecha(r.fecha_actualizacion),
                'exerciseList': exercise_list
            })

        # Conteos por categoría (sin filtro de búsqueda para los badges)
        base_q = Rutina.query.filter_by(id_entrenador=trainer_id)
        category_counts = {
            cat: base_q.filter(Rutina.categoria == cat).count()
            for cat in ['Fuerza', 'Hipertrofia', 'Cardio', 'Funcional', 'Movilidad']
        }

        return jsonify({
            'success':        True,
            'routines':       result,
            'total':          len(result),
            'categoryCounts': category_counts
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines/<int:routine_id>', methods=['GET'])
@jwt_required()
def get_routine_detail(routine_id):
    try:
        trainer_id = get_jwt_identity()
        r = Rutina.query.filter_by(id_rutina=routine_id, id_entrenador=trainer_id).first()
        if not r:
            return jsonify({'success': False, 'message': 'Rutina no encontrada'}), 404

        days_data = []
        for dia in sorted(r.dias, key=lambda d: d.orden):
            ejercicios = sorted(dia.ejercicios, key=lambda e: e.orden)
            days_data.append({
                'id':          dia.id_rutina_dia,
                'day':         dia.dia_semana,
                'muscleGroup': dia.grupo_muscular or '',
                'exercises': [{
                    'id':    ej.id_rutina_ejercicio,
                    'name':  ej.nombre_ejercicio,
                    'sets':  ej.series,
                    'reps':  ej.repeticiones,
                    'peso':  ej.peso  or '',
                    'notes': ej.notas or '',
                    'order': ej.orden
                } for ej in ejercicios]
            })

        return jsonify({
            'success': True,
            'routine': {
                'id':          r.id_rutina,
                'name':        r.nombre,
                'category':    r.categoria        or 'General',
                'difficulty':  r.dificultad       or 'Intermedio',
                'duration':    r.duracion_minutos or 60,
                'description': r.descripcion      or '',
                'active':      bool(r.activa),
                'days':        days_data
            }
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines', methods=['POST'])
@jwt_required()
def create_routine():
    """
    Crea una rutina de biblioteca del entrenador.
    id_miembro es opcional: si no se envía, la rutina queda sin miembro asignado
    (útil para plantillas). Para asignarla a un miembro después se usa /routines/<id>/assign.

    Body JSON:
    {
      "name": "str",
      "category": "Fuerza|Hipertrofia|Cardio|Funcional|Movilidad",
      "difficulty": "Principiante|Intermedio|Avanzado",
      "duration_minutes": 60,
      "description": "str",
      "id_miembro": null,          ← opcional
      "days": [
        {
          "day": "Lunes",
          "muscleGroup": "Pecho",
          "exercises": [
            { "name": "Press banca", "sets": "4", "reps": "10", "peso": "80kg", "notes": "" }
          ]
        }
      ]
    }
    """
    try:
        trainer_id = get_jwt_identity()
        data = request.get_json()

        if not data or not data.get('name', '').strip():
            return jsonify({'success': False, 'message': 'El campo "name" es requerido'}), 400

        nueva = Rutina(
            id_entrenador    = trainer_id,
            id_miembro       = data.get('id_miembro'),      # puede ser None
            nombre           = data['name'].strip(),
            categoria        = data.get('category',          'General'),
            dificultad       = data.get('difficulty',        'Intermedio'),
            duracion_minutos = int(data.get('duration_minutes', 60)),
            descripcion      = data.get('description',       ''),
            objetivo         = data.get('objective',         ''),
            activa           = True
        )
        db.session.add(nueva)
        db.session.flush()   # obtener id_rutina sin hacer commit

        for order_d, day_data in enumerate(data.get('days', [])):
            dia = RutinaDia(
                id_rutina      = nueva.id_rutina,
                dia_semana     = day_data.get('day'),
                grupo_muscular = day_data.get('muscleGroup', ''),
                orden          = order_d
            )
            db.session.add(dia)
            db.session.flush()

            for order_e, ej_data in enumerate(day_data.get('exercises', [])):
                ej = RutinaEjercicio(
                    id_rutina_dia    = dia.id_rutina_dia,
                    nombre_ejercicio = ej_data.get('name', '').strip(),
                    series           = str(ej_data.get('sets', '3')),
                    repeticiones     = str(ej_data.get('reps', '12')),
                    peso             = ej_data.get('peso',  ''),
                    notas            = ej_data.get('notes', ''),
                    orden            = order_e
                )
                db.session.add(ej)

        db.session.commit()
        return jsonify({
            'success':   True,
            'id_rutina': nueva.id_rutina,
            'message':   'Rutina creada correctamente'
        }), 201

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines/<int:routine_id>', methods=['PUT'])
@jwt_required()
def update_routine(routine_id):
    try:
        trainer_id = get_jwt_identity()
        r = Rutina.query.filter_by(id_rutina=routine_id, id_entrenador=trainer_id).first()
        if not r:
            return jsonify({'success': False, 'message': 'Rutina no encontrada'}), 404

        data = request.get_json() or {}
        if 'name'             in data: r.nombre           = data['name'].strip()
        if 'category'         in data: r.categoria        = data['category']
        if 'difficulty'       in data: r.dificultad       = data['difficulty']
        if 'duration_minutes' in data: r.duracion_minutos = int(data['duration_minutes'])
        if 'description'      in data: r.descripcion      = data['description']
        if 'active'           in data: r.activa           = bool(data['active'])

        db.session.commit()
        return jsonify({'success': True, 'message': 'Rutina actualizada'}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines/<int:routine_id>', methods=['DELETE'])
@jwt_required()
def delete_routine(routine_id):
    try:
        trainer_id = get_jwt_identity()
        r = Rutina.query.filter_by(id_rutina=routine_id, id_entrenador=trainer_id).first()
        if not r:
            return jsonify({'success': False, 'message': 'Rutina no encontrada'}), 404

        db.session.delete(r)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Rutina eliminada'}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines/<int:routine_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_routine(routine_id):
    try:
        trainer_id = get_jwt_identity()
        original = Rutina.query.filter_by(id_rutina=routine_id, id_entrenador=trainer_id).first()
        if not original:
            return jsonify({'success': False, 'message': 'Rutina no encontrada'}), 404

        nueva = Rutina(
            id_entrenador    = trainer_id,
            id_miembro       = original.id_miembro,
            nombre           = f"Copia de {original.nombre}",
            categoria        = original.categoria,
            dificultad       = original.dificultad,
            duracion_minutos = original.duracion_minutos,
            descripcion      = original.descripcion,
            objetivo         = original.objetivo,
            activa           = True
        )
        db.session.add(nueva)
        db.session.flush()

        for dia in sorted(original.dias, key=lambda d: d.orden):
            nuevo_dia = RutinaDia(
                id_rutina      = nueva.id_rutina,
                dia_semana     = dia.dia_semana,
                grupo_muscular = dia.grupo_muscular,
                orden          = dia.orden
            )
            db.session.add(nuevo_dia)
            db.session.flush()

            for ej in sorted(dia.ejercicios, key=lambda e: e.orden):
                db.session.add(RutinaEjercicio(
                    id_rutina_dia    = nuevo_dia.id_rutina_dia,
                    nombre_ejercicio = ej.nombre_ejercicio,
                    series           = ej.series,
                    repeticiones     = ej.repeticiones,
                    peso             = ej.peso,
                    notas            = ej.notas,
                    orden            = ej.orden
                ))

        db.session.commit()
        return jsonify({
            'success':   True,
            'id_rutina': nueva.id_rutina,
            'message':   'Rutina duplicada'
        }), 201

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


@trainer_bp.route('/routines/<int:routine_id>/assign', methods=['POST'])
@jwt_required()
def assign_routine_to_member(routine_id):
    """
    Asigna una rutina de biblioteca a un miembro.
    Body: { "id_miembro": int }
    """
    try:
        trainer_id = get_jwt_identity()
        r = Rutina.query.filter_by(id_rutina=routine_id, id_entrenador=trainer_id).first()
        if not r:
            return jsonify({'success': False, 'message': 'Rutina no encontrada'}), 404

        data       = request.get_json() or {}
        id_miembro = data.get('id_miembro')
        if not id_miembro:
            return jsonify({'success': False, 'message': 'id_miembro es requerido'}), 400

        # Verificar que el miembro pertenece a este entrenador
        from app.models.miembro import Miembro
        miembro = Miembro.query.filter_by(
            id_miembro=id_miembro, id_entrenador=trainer_id
        ).first()
        if not miembro:
            return jsonify({'success': False, 'message': 'Miembro no encontrado'}), 404

        # Evitar duplicados
        existing = MiembroRutina.query.filter_by(
            id_miembro=id_miembro, id_rutina=routine_id
        ).first()
        if existing:
            existing.activa    = True
            existing.fecha_fin = None
        else:
            from datetime import date
            db.session.add(MiembroRutina(
                id_miembro       = id_miembro,
                id_rutina        = routine_id,
                fecha_asignacion = date.today(),
                activa           = True
            ))

        db.session.commit()
        return jsonify({'success': True, 'message': 'Rutina asignada al miembro'}), 200

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


# ───────────────────────────────────────────────────────────────
#  REPORTES Y ESTADÍSTICAS
# ───────────────────────────────────────────────────────────────

@trainer_bp.route('/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """
    Estadísticas generales del entrenador para la vista de Reportes.
    Query params:
        range : week | month | quarter | year  (default: month)
    """
    try:
        trainer_id = get_jwt_identity()
        range_param = request.args.get('range', 'month')

        today = date.today()
        if range_param == 'week':
            start = today - timedelta(days=today.weekday())
        elif range_param == 'month':
            start = today.replace(day=1)
        elif range_param == 'quarter':
            month_start = ((today.month - 1) // 3) * 3 + 1
            start = today.replace(month=month_start, day=1)
        else:  # year
            start = today.replace(month=1, day=1)

        # ── Sesiones del período ──────────────────────────────
        sessions_period = Sesion.query.filter(
            Sesion.id_entrenador == trainer_id,
            Sesion.fecha >= start,
            Sesion.estado == 'completed'
        ).all()
        total_sessions = len(sessions_period)

        # ── Clientes activos ──────────────────────────────────
        total_clients = Miembro.query.filter_by(
            id_entrenador=trainer_id, estado='Activo'
        ).count()

        # ── Ingresos del período ──────────────────────────────
        ingresos_query = db.session.query(func.sum(Pago.monto)).filter(
            Pago.id_entrenador == trainer_id,
            Pago.fecha_pago >= start
        ).scalar()
        total_revenue = float(ingresos_query) if ingresos_query else 0

        # ── Calificación promedio ─────────────────────────────
        avg_rating = 0
        if HAS_EVALUACION:
            rating_q = db.session.query(func.avg(EvaluacionEntrenador.calificacion)).filter(
                EvaluacionEntrenador.id_entrenador == trainer_id
            ).scalar()
            avg_rating = round(float(rating_q), 1) if rating_q else 0

        # ── Crecimiento vs período anterior ──────────────────
        prev_start = start - (today - start) - timedelta(days=1)
        prev_sessions = Sesion.query.filter(
            Sesion.id_entrenador == trainer_id,
            Sesion.fecha >= prev_start,
            Sesion.fecha < start,
            Sesion.estado == 'completed'
        ).count()
        session_growth = _pct_growth(total_sessions, prev_sessions)

        prev_revenue_q = db.session.query(func.sum(Pago.monto)).filter(
            Pago.id_entrenador == trainer_id,
            Pago.fecha_pago >= prev_start,
            Pago.fecha_pago < start
        ).scalar()
        prev_revenue = float(prev_revenue_q) if prev_revenue_q else 0
        revenue_growth = _pct_growth(total_revenue, prev_revenue)

        # ── Datos mensuales para el gráfico (últimos 5 meses) ─
        monthly_data = []
        for i in range(4, -1, -1):
            # Primer día del mes i meses atrás
            ref = today.replace(day=1) - timedelta(days=i * 28)
            month_start = ref.replace(day=1)
            if ref.month == 12:
                month_end = ref.replace(year=ref.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = ref.replace(month=ref.month + 1, day=1) - timedelta(days=1)

            m_sessions = Sesion.query.filter(
                Sesion.id_entrenador == trainer_id,
                Sesion.fecha >= month_start,
                Sesion.fecha <= month_end,
                Sesion.estado == 'completed'
            ).count()

            m_revenue_q = db.session.query(func.sum(Pago.monto)).filter(
                Pago.id_entrenador == trainer_id,
                Pago.fecha_pago >= month_start,
                Pago.fecha_pago <= month_end
            ).scalar()
            m_revenue = float(m_revenue_q) if m_revenue_q else 0

            m_clients = Miembro.query.filter(
                Miembro.id_entrenador == trainer_id,
                Miembro.fecha_registro <= month_end
            ).count()

            MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
            monthly_data.append({
                'month':    MESES[month_start.month - 1],
                'revenue':  m_revenue,
                'sessions': m_sessions,
                'clients':  m_clients
            })

        # ── Top clientes por sesiones completadas ─────────────
        miembros = Miembro.query.filter_by(id_entrenador=trainer_id).all()
        client_progress = []
        for m in miembros:
            user = User.query.get(m.id_usuario) if m.id_usuario else None
            completed = Sesion.query.filter_by(
                id_miembro=m.id_miembro, estado='completed'
            ).count()
            total_m = Sesion.query.filter(
                Sesion.id_miembro == m.id_miembro,
                Sesion.estado.in_(['completed', 'cancelled'])
            ).count()
            pct = round((completed / total_m) * 100) if total_m else 0
            client_progress.append({
                'name':        user.nombre if user else f'Miembro {m.id_miembro}',
                'improvement': pct,
                'sessions':    completed
            })

        client_progress.sort(key=lambda x: x['improvement'], reverse=True)
        top_clients = client_progress[:5]

        # ── Métricas detalladas ────────────────────────────────
        attended = sum(1 for s in sessions_period if s.asistencia)
        attendance_rate = round((attended / total_sessions) * 100) if total_sessions else 0

        total_scheduled = Sesion.query.filter(
            Sesion.id_entrenador == trainer_id,
            Sesion.fecha >= start,
            Sesion.estado.in_(['completed', 'cancelled'])
        ).count()
        cancelled = Sesion.query.filter(
            Sesion.id_entrenador == trainer_id,
            Sesion.fecha >= start,
            Sesion.estado == 'cancelled'
        ).count()
        cancel_rate = round((cancelled / total_scheduled) * 100) if total_scheduled else 0

        sessions_per_client = round(total_sessions / total_clients, 1) if total_clients else 0

        new_clients = Miembro.query.filter(
            Miembro.id_entrenador == trainer_id,
            Miembro.fecha_registro >= start
        ).count()

        return jsonify({
            'success': True,
            'stats': {
                'revenue':  total_revenue,
                'sessions': total_sessions,
                'clients':  total_clients,
                'avgRating': avg_rating,
                'growth': {
                    'revenue':  revenue_growth,
                    'sessions': session_growth,
                    'clients':  0
                }
            },
            'monthlyData':     monthly_data,
            'clientProgress':  top_clients,
            'metrics': {
                'retentionRate':     attendance_rate,
                'satisfaction':      avg_rating,
                'attendanceRate':    attendance_rate,
                'sessionsPerClient': sessions_per_client,
                'newClients':        new_clients,
                'cancellationRate':  cancel_rate
            }
        }), 200

    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': str(e)}), 500


# ── Helper privado ─────────────────────────────────────────────

def _pct_growth(current, previous):
    try:
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100)
    except Exception:
        return 0


def _format_fecha(ts):
    """Convierte timestamp a texto relativo"""
    try:
        if not ts:
            return 'Nunca'
        diff = datetime.now() - ts
        days = diff.days
        if days == 0:
            return 'Hoy'
        elif days == 1:
            return 'Ayer'
        elif days < 7:
            return f'Hace {days} días'
        else:
            return ts.strftime('%d/%m/%Y')
    except Exception:
        return '-'
