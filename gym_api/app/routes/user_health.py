from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import desc
from app.extensions import db
from app.models.miembro import Miembro
from app.models.progreso_fisico import ProgresoFisico

user_health_bp = Blueprint('user_health', __name__)

# =========================
# UTILIDADES
# =========================

def _normalizar_estatura(estatura):
    estatura = float(estatura)
    if estatura > 3:  # viene en cm
        return estatura / 100
    return estatura  # ya está en metros

def _calcular_bmi(peso, estatura):
    try:
        peso = float(peso)
        estatura = _normalizar_estatura(estatura)
        if peso <= 0 or estatura <= 0:
            return 0
        return round(peso / (estatura ** 2), 2)
    except Exception:
        return 0

def _calcular_imc(peso, estatura):
    try:
        if estatura > 0 and peso > 0:
            return peso / (estatura ** 2)
        return 0
    except:
        return 0


# =========================
# GET HEALTH
# =========================

@user_health_bp.route('/api/user/health', methods=['GET'])
@jwt_required()
def get_user_health():
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()

        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404

        ultimo_progreso = ProgresoFisico.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(ProgresoFisico.fecha_registro.desc()).first()

        # PESO
        if ultimo_progreso and ultimo_progreso.peso:
            peso_actual = float(ultimo_progreso.peso)
        else:
            peso_actual = float(miembro.peso_inicial or 0)

        # ESTATURA (IGUAL QUE body-progress)
        estatura = float(miembro.estatura or 1.7)
        if estatura <= 0:
            estatura = 1.7

        # IMC (MISMA FUNCIÓN QUE YA FUNCIONA)
        imc = _calcular_imc(peso_actual, estatura)

        condiciones = []

        # ESTATURA
        condiciones.append({
            "nombre": "Estatura",
            "valor": f"{estatura:.2f} m",
            "estado": "normal",
            "icon": "FiMaximize2"
        })

        # IMC
        if imc < 18.5:
            estado = "bajo"
            icon = "FiAlertCircle"
        elif imc < 25:
            estado = "normal"
            icon = "FiCheckCircle"
        elif imc < 30:
            estado = "alto"
            icon = "FiAlertCircle"
        else:
            estado = "muy_alto"
            icon = "FiAlertCircle"

        condiciones.append({
            "nombre": "IMC (Índice de Masa Corporal)",
            "valor": f"{round(imc, 1)}",
            "estado": estado,
            "icon": icon
        })

        # PESO
        if peso_actual > 0:
            condiciones.append({
                "nombre": "Peso Actual",
                "valor": f"{peso_actual:.1f} kg",
                "estado": "normal",
                "icon": "FiActivity"
            })

        # MEDIDAS
        if ultimo_progreso:
            medidas = {
                "cintura": "Circunferencia de Cintura",
                "cadera": "Circunferencia de Cadera",
                "pecho": "Circunferencia de Pecho",
                "brazo_derecho": "Brazo Derecho",
                "brazo_izquierdo": "Brazo Izquierdo",
                "muslo_derecho": "Muslo Derecho",
                "muslo_izquierdo": "Muslo Izquierdo",
                "pantorrilla": "Pantorrilla"
            }

            for campo, nombre in medidas.items():
                valor = getattr(ultimo_progreso, campo, None)
                if valor:
                    condiciones.append({
                        "nombre": nombre,
                        "valor": f"{float(valor):.1f} cm",
                        "estado": "normal",
                        "icon": "FiActivity"
                    })

        return jsonify({
            "condiciones": condiciones,
            "alergias": [],
            "medicamentos": [],
            "lesiones": [],
            "notas": ultimo_progreso.notas if ultimo_progreso else None,
            "ultimaActualizacion": ultimo_progreso.fecha_registro.strftime('%Y-%m-%d') if ultimo_progreso else None
        }), 200

    except Exception as e:
        print(f"Error en get_user_health: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# =========================
# POST HEALTH
# =========================

@user_health_bp.route('/api/user/health', methods=['POST'])
@jwt_required()
def update_user_health():
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404

        data = request.json

        nuevo_progreso = ProgresoFisico(
            id_miembro=miembro.id_miembro,
            peso=data.get('peso'),
            cintura=data.get('cintura'),
            cadera=data.get('cadera'),
            fecha_registro=datetime.now().date()
        )

        # 🔴 IMC SIEMPRE CALCULADO CORRECTAMENTE
        if nuevo_progreso.peso and miembro.estatura:
            nuevo_progreso.bmi = _calcular_bmi(
                nuevo_progreso.peso,
                miembro.estatura
            )

        campos_extra = [
            'pecho', 'brazo_derecho', 'brazo_izquierdo',
            'muslo_derecho', 'muslo_izquierdo', 'pantorrilla', 'notas'
        ]

        for campo in campos_extra:
            if campo in data:
                setattr(nuevo_progreso, campo, data.get(campo))

        db.session.add(nuevo_progreso)
        db.session.commit()

        return jsonify({
            "message": "Datos de salud actualizados correctamente"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
