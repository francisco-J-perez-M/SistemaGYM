from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta  # <--- ESTO FALTABA
from app.models.miembro_membresia import MiembroMembresia
from app.extensions import db

miembro_membresias_bp = Blueprint('miembro_membresias', __name__)

@miembro_membresias_bp.route('/miembro-membresias/expiran', methods=['GET'])
# @jwt_required()  <-- Descomenta esto si quieres seguridad
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
            MiembroMembresia.estado == 'Activa' # O 'Activo', verifica tu ENUM en la DB
        ).all()

        data = []
        for mm in resultados:
            # 1. Obtener nombre con seguridad (relación: Miembro -> Usuario -> Nombre)
            nombre_miembro = "Desconocido"
            if mm.miembro and mm.miembro.usuario:
                nombre_miembro = mm.miembro.usuario.nombre
            
            # 2. Calcular estado de urgencia para el frontend
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