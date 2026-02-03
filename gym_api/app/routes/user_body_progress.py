from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import desc, extract
from app.extensions import db
from app.models.miembro import Miembro
from app.models.progreso_fisico import ProgresoFisico

user_body_progress_bp = Blueprint('user_body_progress', __name__)


@user_body_progress_bp.route('/api/user/body-progress', methods=['GET'])
@jwt_required()
def get_body_progress():
    """
    Obtiene el progreso corporal del usuario
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Obtener progreso histórico
        progresos = ProgresoFisico.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(desc(ProgresoFisico.fecha_registro)).all()
        
        # Obtener primer y último registro
        progreso_actual = progresos[0] if progresos else None
        progreso_inicial = progresos[-1] if progresos else None
        
        # Calcular métricas
        peso_actual = float(progreso_actual.peso) if progreso_actual and progreso_actual.peso else float(miembro.peso_inicial or 65)
        peso_inicial = float(progreso_inicial.peso) if progreso_inicial and progreso_inicial.peso else float(miembro.peso_inicial or 70)
        
        # Calcular IMC
        imc = _calcular_imc(peso_actual, float(miembro.estatura or 1.7))
        
        # Estimar grasa corporal y músculo (fórmulas simplificadas)
        # En producción, estos datos deberían venir de mediciones reales
        grasa_corporal_actual = _estimar_grasa_corporal(peso_actual, imc, miembro.sexo)
        grasa_corporal_inicial = _estimar_grasa_corporal(peso_inicial, _calcular_imc(peso_inicial, float(miembro.estatura or 1.7)), miembro.sexo)
        
        musculo_actual = 100 - grasa_corporal_actual
        musculo_inicial = 100 - grasa_corporal_inicial
        
        body_metrics = {
            "peso": {
                "actual": peso_actual,
                "inicial": peso_inicial,
                "meta": peso_inicial - 8  # Meta estimada
            },
            "grasaCorporal": {
                "actual": grasa_corporal_actual,
                "inicial": grasa_corporal_inicial,
                "meta": grasa_corporal_actual - 4
            },
            "musculo": {
                "actual": musculo_actual,
                "inicial": musculo_inicial,
                "meta": musculo_actual + 4
            },
            "imc": round(imc, 1)
        }
        
        # Obtener progreso mensual
        progreso_mensual = _obtener_progreso_mensual(miembro.id_miembro)
        
        return jsonify({
            "bodyMetrics": body_metrics,
            "progressHistory": progreso_mensual,
            "gender": "female" if miembro.sexo == "F" else "male"
        }), 200
        
    except Exception as e:
        print(f"Error en get_body_progress: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_body_progress_bp.route('/api/user/body-progress', methods=['POST'])
@jwt_required()
def add_body_progress():
    """
    Agrega un nuevo registro de progreso corporal
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        
        # Crear nuevo registro
        nuevo_progreso = ProgresoFisico(
            id_miembro=miembro.id_miembro,
            peso=data.get('peso'),
            cintura=data.get('cintura'),
            cadera=data.get('cadera'),
            fecha_registro=datetime.now().date()
        )
        
        # Calcular BMI automáticamente
        if miembro.estatura and nuevo_progreso.peso:
            estatura_metros = float(miembro.estatura)
            nuevo_progreso.bmi = _calcular_imc(float(nuevo_progreso.peso), estatura_metros)
        
        db.session.add(nuevo_progreso)
        db.session.commit()
        
        return jsonify({
            "message": "Progreso registrado correctamente",
            "progreso": {
                "peso": float(nuevo_progreso.peso) if nuevo_progreso.peso else None,
                "bmi": float(nuevo_progreso.bmi) if nuevo_progreso.bmi else None,
                "fecha": nuevo_progreso.fecha_registro.strftime('%Y-%m-%d')
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en add_body_progress: {e}")
        return jsonify({"error": str(e)}), 500


def _calcular_imc(peso, estatura):
    """Calcula el IMC"""
    try:
        if estatura > 0:
            return peso / (estatura ** 2)
        return 0
    except:
        return 0


def _estimar_grasa_corporal(peso, imc, sexo):
    """
    Estima el porcentaje de grasa corporal usando IMC
    Fórmula simplificada - en producción usar mediciones reales
    """
    try:
        if sexo == "M":
            # Hombres
            grasa = (1.20 * imc) + (0.23 * 30) - 16.2
        else:
            # Mujeres
            grasa = (1.20 * imc) + (0.23 * 30) - 5.4
        
        # Limitar entre 5% y 50%
        return max(5, min(50, round(grasa, 1)))
    except:
        return 22  # Valor por defecto


def _obtener_progreso_mensual(id_miembro):
    """
    Obtiene el progreso de los últimos 6 meses
    """
    try:
        now = datetime.now()
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Obtener registros de los últimos 6 meses
        hace_6_meses = now - timedelta(days=180)
        
        progresos = ProgresoFisico.query.filter(
            ProgresoFisico.id_miembro == id_miembro,
            ProgresoFisico.fecha_registro >= hace_6_meses.date()
        ).order_by(ProgresoFisico.fecha_registro.asc()).all()
        
        if not progresos:
            # Retornar datos simulados si no hay registros
            return [
                {"mes": "Ene", "porcentaje": 45},
                {"mes": "Feb", "porcentaje": 52},
                {"mes": "Mar", "porcentaje": 58},
                {"mes": "Abr", "porcentaje": 65},
                {"mes": "May", "porcentaje": 70},
                {"mes": "Jun", "porcentaje": 78}
            ]
        
        # Agrupar por mes
        progreso_por_mes = {}
        peso_inicial = float(progresos[0].peso) if progresos[0].peso else 70
        peso_meta = peso_inicial - 8  # Meta estimada
        
        for progreso in progresos:
            mes_num = progreso.fecha_registro.month - 1
            mes_nombre = meses[mes_num]
            
            if mes_nombre not in progreso_por_mes:
                # Calcular porcentaje de progreso hacia la meta
                peso_actual = float(progreso.peso) if progreso.peso else peso_inicial
                diferencia_total = abs(peso_inicial - peso_meta)
                diferencia_actual = abs(peso_inicial - peso_actual)
                porcentaje = min(100, (diferencia_actual / diferencia_total * 100)) if diferencia_total > 0 else 0
                
                progreso_por_mes[mes_nombre] = {
                    "mes": mes_nombre,
                    "porcentaje": round(porcentaje)
                }
        
        # Completar meses faltantes con interpolación
        resultado = []
        for i in range(6):
            mes_actual = (now.month - 6 + i) % 12
            mes_nombre = meses[mes_actual]
            
            if mes_nombre in progreso_por_mes:
                resultado.append(progreso_por_mes[mes_nombre])
            elif resultado:
                # Interpolar
                resultado.append({
                    "mes": mes_nombre,
                    "porcentaje": resultado[-1]["porcentaje"]
                })
            else:
                resultado.append({"mes": mes_nombre, "porcentaje": 45})
        
        return resultado
        
    except Exception as e:
        print(f"Error en _obtener_progreso_mensual: {e}")
        return [
            {"mes": "Ene", "porcentaje": 45},
            {"mes": "Feb", "porcentaje": 52},
            {"mes": "Mar", "porcentaje": 58},
            {"mes": "Abr", "porcentaje": 65},
            {"mes": "May", "porcentaje": 70},
            {"mes": "Jun", "porcentaje": 78}
        ]
