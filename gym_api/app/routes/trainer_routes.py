from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.miembro import Miembro
from app.models.user import User
from app.models.sesion_model import Sesion
from app.models.progreso_fisico import ProgresoFisico
from app.models.asistencia import Asistencia
from app.models.pago import Pago
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