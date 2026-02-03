from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import desc
from app.extensions import db
from app.models.miembro import Miembro
from app.models.progreso_fisico import ProgresoFisico

user_health_bp = Blueprint('user_health', __name__)


@user_health_bp.route('/api/user/health', methods=['GET'])
@jwt_required()
def get_user_health():
    """
    Obtiene los datos de salud del usuario
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Obtener último progreso físico
        ultimo_progreso = ProgresoFisico.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(desc(ProgresoFisico.fecha_registro)).first()
        
        # Calcular métricas de salud
        peso_actual = float(ultimo_progreso.peso) if ultimo_progreso and ultimo_progreso.peso else float(miembro.peso_inicial or 0)
        bmi_actual = float(ultimo_progreso.bmi) if ultimo_progreso and ultimo_progreso.bmi else _calcular_bmi(peso_actual, float(miembro.estatura or 1.7))
        
        # Simular condiciones (en producción, esto vendría de una tabla médica)
        condiciones = [
            {
                "nombre": "Presión Arterial",
                "valor": "120/80",
                "estado": "normal",
                "icon": "FiHeart"
            },
            {
                "nombre": "Glucosa",
                "valor": "95 mg/dL",
                "estado": "normal",
                "icon": "FiActivity"
            },
            {
                "nombre": "Colesterol",
                "valor": "180 mg/dL",
                "estado": "normal",
                "icon": "FiCheckCircle"
            }
        ]
        
        # Si el BMI está fuera de rango, agregarlo como condición
        if bmi_actual > 25 or bmi_actual < 18.5:
            estado_bmi = "alto" if bmi_actual > 25 else "bajo"
            condiciones.append({
                "nombre": "IMC",
                "valor": f"{bmi_actual:.1f}",
                "estado": estado_bmi,
                "icon": "FiAlertCircle"
            })
        
        return jsonify({
            "condiciones": condiciones,
            "alergias": ["Ninguna"],  # Agregar tabla si es necesario
            "medicamentos": ["Ninguno"],  # Agregar tabla si es necesario
            "lesiones": [],  # Agregar tabla si es necesario
            "ultimaActualizacion": ultimo_progreso.fecha_registro.strftime('%Y-%m-%d') if ultimo_progreso else None
        }), 200
        
    except Exception as e:
        print(f"Error en get_user_health: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_health_bp.route('/api/user/health', methods=['POST'])
@jwt_required()
def update_user_health():
    """
    Actualiza datos de salud del usuario
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        
        # Crear nuevo registro de progreso físico
        nuevo_progreso = ProgresoFisico(
            id_miembro=miembro.id_miembro,
            peso=data.get('peso'),
            bmi=data.get('bmi'),
            cintura=data.get('cintura'),
            cadera=data.get('cadera'),
            fecha_registro=datetime.now().date()
        )
        
        # Calcular BMI si no viene en el request
        if not nuevo_progreso.bmi and miembro.estatura and nuevo_progreso.peso:
            estatura_metros = float(miembro.estatura)
            nuevo_progreso.bmi = _calcular_bmi(float(nuevo_progreso.peso), estatura_metros)
        
        db.session.add(nuevo_progreso)
        db.session.commit()
        
        return jsonify({
            "message": "Datos de salud actualizados correctamente",
            "progreso": {
                "peso": float(nuevo_progreso.peso) if nuevo_progreso.peso else None,
                "bmi": float(nuevo_progreso.bmi) if nuevo_progreso.bmi else None,
                "fecha": nuevo_progreso.fecha_registro.strftime('%Y-%m-%d')
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_user_health: {e}")
        return jsonify({"error": str(e)}), 500


def _calcular_bmi(peso, estatura):
    """Calcula el BMI (Body Mass Index)"""
    try:
        if estatura > 0:
            return peso / (estatura ** 2)
        return 0
    except:
        return 0
