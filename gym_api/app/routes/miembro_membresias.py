from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.models.miembro_membresia import MiembroMembresia
from app.models.miembro import Miembro  # ⚠️ ESTO FALTABA
from app.extensions import db

miembro_membresias_bp = Blueprint('miembro_membresias', __name__)

@miembro_membresias_bp.route('/miembro-membresias/expiran', methods=['GET'])
# @jwt_required()  # Descomenta si necesitas seguridad
def membresias_por_expirar():
    try:
        # Obtener parámetros (por defecto 7 días)
        dias = request.args.get('dias', default=7, type=int)
        
        # Calcular fechas
        hoy = datetime.now().date()
        fecha_limite = hoy + timedelta(days=dias)
        
        # Consultar DB: Membresías activas que vencen en el rango
        resultados = MiembroMembresia.query.filter(
            MiembroMembresia.fecha_fin <= fecha_limite,
            MiembroMembresia.fecha_fin >= hoy,
            MiembroMembresia.estado == 'Activa'
        ).all()

        data = []
        for mm in resultados:
            # Obtener nombre con seguridad
            nombre_miembro = "Desconocido"
            if mm.miembro and mm.miembro.usuario:
                nombre_miembro = mm.miembro.usuario.nombre
            
            # Calcular estado de urgencia
            dias_restantes = (mm.fecha_fin - hoy).days
            status = 'urgent' if dias_restantes <= 3 else 'warning'

            data.append({
                "id": mm.id_mm,
                "miembro": nombre_miembro,
                "plan": mm.membresia.nombre if mm.membresia else "N/A",
                "fecha_fin": mm.fecha_fin.strftime('%Y-%m-%d'),
                "status": status
            })

        return jsonify({"data": data}), 200

    except Exception as e:
        print(f"Error en membresias_por_expirar: {e}")
        return jsonify({"error": str(e)}), 500


@miembro_membresias_bp.route("/miembro/membresia-activa", methods=["GET"])
@jwt_required()
def obtener_membresia_activa():
    """
    Endpoint que verifica si el usuario tiene membresía activa y qué tipo es.
    Retorna el nivel de acceso basado en tu tabla de membresías.
    """
    try:
        user_id = get_jwt_identity()

        # 🔍 Buscar el miembro asociado al usuario
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({
                "tiene_membresia": False,
                "mensaje": "No se encontró perfil de miembro"
            }), 200

        # 🔍 Buscar membresía activa
        membresia_activa = (
            MiembroMembresia.query
            .filter(
                MiembroMembresia.id_miembro == miembro.id_miembro,
                MiembroMembresia.estado == "Activa"
            )
            .order_by(MiembroMembresia.fecha_fin.desc())
            .first()
        )

        if not membresia_activa or not membresia_activa.membresia:
            return jsonify({"tiene_membresia": False}), 200

        # ✅ DETERMINAR NIVEL DE ACCESO BASADO EN TUS PLANES
        nombre_plan = membresia_activa.membresia.nombre
        
        # Según tu DB:
        # Premium → Premium Mensual, Premium Anual, VIP
        # Básico → Básica Mensual, Básica Anual, Estudiante, Familiar
        
        planes_premium = ["Premium", "VIP"]
        
        tipo_acceso = "premium" if any(p in nombre_plan for p in planes_premium) else "basico"

        return jsonify({
            "tiene_membresia": True,
            "membresia": {
                "id": membresia_activa.membresia.id_membresia,
                "nombre": nombre_plan,
                "tipo": tipo_acceso,  # "premium" o "basico"
                "fecha_inicio": membresia_activa.fecha_inicio.strftime("%Y-%m-%d"),
                "fecha_fin": membresia_activa.fecha_fin.strftime("%Y-%m-%d"),
                "estado": membresia_activa.estado
            }
        }), 200

    except Exception as e:
        print(f"❌ Error en obtener_membresia_activa: {e}")
        return jsonify({"error": str(e)}), 500