"""
Rutas para el Dashboard del Entrenador
"""
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
from datetime import datetime, timedelta
import traceback

trainer_bp = Blueprint('trainer', __name__, url_prefix='/api/trainer')

# Importaciones condicionales para modelos que pueden no existir
try:
    from app.models.perfil_entrenador import PerfilEntrenador
    HAS_PERFIL_ENTRENADOR = True
except ImportError:
    HAS_PERFIL_ENTRENADOR = False
    print("⚠️  Modelo PerfilEntrenador no encontrado")

try:
    from app.models.certificacion_entrenador import CertificacionEntrenador
    HAS_CERTIFICACION = True
except ImportError:
    HAS_CERTIFICACION = False
    print("⚠️  Modelo CertificacionEntrenador no encontrado")

try:
    from app.models.logro_entrenador import LogroEntrenador
    HAS_LOGRO = True
except ImportError:
    HAS_LOGRO = False
    print("⚠️  Modelo LogroEntrenador no encontrado")

try:
    from app.models.evaluacion_entrenador import EvaluacionEntrenador
    HAS_EVALUACION = True
except ImportError:
    HAS_EVALUACION = False
    print("⚠️  Modelo EvaluacionEntrenador no encontrado")

@trainer_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_trainer_clients():
    """
    Obtiene todos los clientes asignados al entrenador con sus estadísticas
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"📊 Obteniendo clientes para entrenador ID: {current_user_id}")
        
        # Obtener todos los miembros del entrenador
        miembros = Miembro.query.filter_by(id_entrenador=current_user_id).all()
        print(f"✅ Encontrados {len(miembros)} miembros")
        
        clients_data = []
        
        for miembro in miembros:
            try:
                # Obtener usuario asociado
                usuario = User.query.get(miembro.id_usuario)
                
                # Calcular total de sesiones
                total_sesiones = Sesion.query.filter_by(
                    id_miembro=miembro.id_miembro,
                    estado='completed'
                ).count()
                
                # Calcular asistencias este mes
                inicio_mes = datetime.now().replace(day=1)
                asistencias_mes = Asistencia.query.filter(
                    Asistencia.id_miembro == miembro.id_miembro,
                    Asistencia.fecha >= inicio_mes
                ).count()
                
                # Obtener última sesión
                ultima_sesion = Sesion.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(desc(Sesion.fecha)).first()
                
                # Calcular racha de días
                racha = calcular_racha_dias(miembro.id_miembro)
                
                # Obtener progreso físico (inicial y actual)
                progreso_inicial = ProgresoFisico.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(ProgresoFisico.fecha_registro).first()
                
                progreso_actual = ProgresoFisico.query.filter_by(
                    id_miembro=miembro.id_miembro
                ).order_by(desc(ProgresoFisico.fecha_registro)).first()
                
                # Calcular porcentaje de progreso hacia el objetivo
                progreso_porcentaje = calcular_progreso_porcentaje(
                    miembro, 
                    progreso_inicial, 
                    progreso_actual
                )
                
                # Calcular tasa de asistencia (últimos 30 días)
                tasa_asistencia = calcular_tasa_asistencia(miembro.id_miembro)
                
                # Determinar tendencia
                tendencia = determinar_tendencia(progreso_inicial, progreso_actual)
                
                # Determinar estado del cliente
                estado = determinar_estado_cliente(ultima_sesion, tasa_asistencia)
                
                # Formatear última sesión
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
                print(f"⚠️  Error procesando miembro {miembro.id_miembro}: {str(e)}")
                continue
        
        print(f"✅ Clientes procesados correctamente: {len(clients_data)}")
        return jsonify({
            'success': True,
            'clients': clients_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error en get_trainer_clients: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error al obtener clientes: {str(e)}'
        }), 500

@trainer_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_trainer_profile():
    """
    Obtiene el perfil completo del entrenador
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"👤 Obteniendo perfil para usuario ID: {current_user_id}")
        
        # Obtener usuario
        usuario = User.query.get(current_user_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        # Obtener perfil del entrenador (si existe el modelo)
        perfil = None
        if HAS_PERFIL_ENTRENADOR:
            try:
                perfil = PerfilEntrenador.query.filter_by(id_entrenador=current_user_id).first()
            except Exception as e:
                print(f"⚠️  Error obteniendo perfil: {str(e)}")
        
        # Obtener certificaciones (si existe el modelo)
        certificaciones = []
        if HAS_CERTIFICACION:
            try:
                certificaciones = CertificacionEntrenador.query.filter_by(
                    id_entrenador=current_user_id
                ).all()
            except Exception as e:
                print(f"⚠️  Error obteniendo certificaciones: {str(e)}")
        
        # Obtener logros (si existe el modelo)
        logros = []
        if HAS_LOGRO:
            try:
                logros = LogroEntrenador.query.filter_by(
                    id_entrenador=current_user_id
                ).order_by(desc(LogroEntrenador.fecha)).limit(4).all()
            except Exception as e:
                print(f"⚠️  Error obteniendo logros: {str(e)}")
        
        # Calcular estadísticas
        total_clientes = Miembro.query.filter_by(id_entrenador=current_user_id).count()
        
        total_sesiones = Sesion.query.filter_by(
            id_entrenador=current_user_id,
            estado='completed'
        ).count()
        
        # Calcular ingresos totales
        total_ingresos = 0
        try:
            total_ingresos_query = db.session.query(func.sum(Pago.monto)).filter(
                Pago.id_entrenador == current_user_id
            ).scalar()
            total_ingresos = float(total_ingresos_query) if total_ingresos_query else 0
        except Exception as e:
            print(f"⚠️  Error calculando ingresos: {str(e)}")
        
        # Calcular calificación promedio
        calificacion_promedio = 0
        if HAS_EVALUACION:
            try:
                calificacion_query = db.session.query(func.avg(EvaluacionEntrenador.calificacion)).filter(
                    EvaluacionEntrenador.id_entrenador == current_user_id
                ).scalar()
                calificacion_promedio = float(calificacion_query) if calificacion_query else 0
            except Exception as e:
                print(f"⚠️  Error calculando calificación: {str(e)}")
        
        # Calcular años activos
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
        
        print(f"✅ Perfil obtenido correctamente")
        return jsonify({
            'success': True,
            'profile': profile_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error en get_trainer_profile: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error al obtener perfil: {str(e)}'
        }), 500

@trainer_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_trainer_profile():
    """
    Actualiza el perfil del entrenador
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"📝 Actualizando perfil para usuario ID: {current_user_id}")
        print(f"Datos recibidos: {data}")
        
        # Actualizar usuario
        usuario = User.query.get(current_user_id)
        if not usuario:
            return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
        
        if 'name' in data:
            usuario.nombre = data['name']
        if 'email' in data:
            usuario.email = data['email']
        
        # Actualizar o crear perfil del entrenador (si existe el modelo)
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
                print(f"⚠️  Error actualizando perfil: {str(e)}")
        
        db.session.commit()
        
        print(f"✅ Perfil actualizado correctamente")
        return jsonify({
            'success': True,
            'message': 'Perfil actualizado correctamente'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en update_trainer_profile: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }), 500

# Funciones auxiliares

def calcular_racha_dias(id_miembro):
    """Calcula la racha consecutiva de días de asistencia"""
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
        print(f"⚠️  Error calculando racha: {str(e)}")
        return 0

def calcular_progreso_porcentaje(miembro, progreso_inicial, progreso_actual):
    """Calcula el porcentaje de progreso hacia el objetivo"""
    try:
        if not progreso_inicial or not progreso_actual or not miembro.peso_objetivo:
            return 0
        
        peso_inicial = float(progreso_inicial.peso) if progreso_inicial.peso else 0
        peso_actual = float(progreso_actual.peso) if progreso_actual.peso else 0
        peso_objetivo = float(miembro.peso_objetivo)
        
        if peso_inicial == peso_objetivo:
            return 100
        
        progreso = abs(peso_inicial - peso_actual)
        objetivo_total = abs(peso_inicial - peso_objetivo)
        
        if objetivo_total == 0:
            return 100
        
        porcentaje = (progreso / objetivo_total) * 100
        return min(round(porcentaje), 100)
    except Exception as e:
        print(f"⚠️  Error calculando progreso: {str(e)}")
        return 0

def calcular_tasa_asistencia(id_miembro):
    """Calcula la tasa de asistencia de los últimos 30 días"""
    try:
        fecha_inicio = datetime.now().date() - timedelta(days=30)
        
        # Total de sesiones programadas
        sesiones_programadas = Sesion.query.filter(
            Sesion.id_miembro == id_miembro,
            Sesion.fecha >= fecha_inicio,
            Sesion.estado.in_(['completed', 'cancelled'])
        ).count()
        
        if sesiones_programadas == 0:
            return 0
        
        # Sesiones completadas
        sesiones_completadas = Sesion.query.filter(
            Sesion.id_miembro == id_miembro,
            Sesion.fecha >= fecha_inicio,
            Sesion.estado == 'completed'
        ).count()
        
        return round((sesiones_completadas / sesiones_programadas) * 100)
    except Exception as e:
        print(f"⚠️  Error calculando asistencia: {str(e)}")
        return 0

def determinar_tendencia(progreso_inicial, progreso_actual):
    """Determina la tendencia del progreso (up, down, stable)"""
    try:
        if not progreso_inicial or not progreso_actual:
            return 'stable'
        
        # Comparar pesos
        peso_inicial = float(progreso_inicial.peso) if progreso_inicial.peso else 0
        peso_actual = float(progreso_actual.peso) if progreso_actual.peso else 0
        
        diferencia = peso_inicial - peso_actual
        
        if abs(diferencia) < 1:  # Menos de 1kg de diferencia
            return 'stable'
        elif diferencia > 0:
            return 'down'  # Perdió peso
        else:
            return 'up'  # Ganó peso
    except Exception as e:
        print(f"⚠️  Error determinando tendencia: {str(e)}")
        return 'stable'

def determinar_estado_cliente(ultima_sesion, tasa_asistencia):
    """Determina el estado del cliente (active, warning)"""
    try:
        if not ultima_sesion:
            return 'warning'
        
        dias_desde_ultima = (datetime.now().date() - ultima_sesion.fecha).days
        
        if dias_desde_ultima > 7 or tasa_asistencia < 70:
            return 'warning'
        
        return 'active'
    except Exception as e:
        print(f"⚠️  Error determinando estado: {str(e)}")
        return 'active'

def calcular_edad(fecha_nacimiento):
    """Calcula la edad a partir de la fecha de nacimiento"""
    try:
        if not fecha_nacimiento:
            return 0
        
        hoy = datetime.now().date()
        edad = hoy.year - fecha_nacimiento.year
        
        if hoy.month < fecha_nacimiento.month or (hoy.month == fecha_nacimiento.month and hoy.day < fecha_nacimiento.day):
            edad -= 1
        
        return edad
    except Exception as e:
        print(f"⚠️  Error calculando edad: {str(e)}")
        return 0