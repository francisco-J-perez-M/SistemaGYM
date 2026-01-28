from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import date
from dateutil.relativedelta import relativedelta # <--- Recomendado para manejar meses

from app.extensions import db
from app.models.pago import Pago
from app.models.membresia import Membresia
from app.models.miembro_membresia import MiembroMembresia
from app.models.miembro import Miembro # <--- IMPORTANTE: Importar el modelo Miembro
from app.utils.luhn import validar_luhn

pagos_bp = Blueprint("pagos", __name__)

@pagos_bp.route("/api/pagos", methods=["POST"])
@jwt_required()
def registrar_pago():
    try:
        data = request.json

        # 1. Validaciones básicas
        required = ["id_miembro", "id_membresia", "metodo_pago"]
        for field in required:
            if field not in data:
                return jsonify({"error": f"Falta el campo {field}"}), 400

        # 2. Validar que la Membresía existe
        membresia = Membresia.query.get(data["id_membresia"])
        if not membresia:
            return jsonify({"error": "Membresía no válida"}), 404

        # 3. Validar que el Miembro existe (¡Faltaba esto!)
        miembro = Miembro.query.get(data["id_miembro"])
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404

        # 4. Validar tarjeta (solo si aplica)
        if data["metodo_pago"] == "Tarjeta":
            tarjeta = data.get("numero_tarjeta", "")
            if not validar_luhn(tarjeta):
                return jsonify({"error": "Número de tarjeta inválido"}), 400

        # 5. Crear el objeto Pago
        pago = Pago(
            id_miembro=data["id_miembro"],
            monto=membresia.precio,
            metodo_pago=data["metodo_pago"],
            concepto=f"Pago membresía {membresia.nombre}"
        )
        db.session.add(pago)

        # 6. Calcular fechas de forma segura
        # Usamos relativedelta para evitar errores tipo "30 de febrero"
        inicio = date.today()
        fin = inicio + relativedelta(months=membresia.duracion_meses)

        # 7. Crear/Actualizar la relación Miembro-Membresía
        mm = MiembroMembresia(
            id_miembro=data["id_miembro"],
            id_membresia=membresia.id_membresia,
            fecha_inicio=inicio,
            fecha_fin=fin,
            estado="Activa"
        )
        db.session.add(mm)
        
        db.session.commit()

        return jsonify(pago.to_dict()), 201

    except Exception as e:
        db.session.rollback() # Deshacer cambios si algo falla
        print(f"Error en registrar_pago: {str(e)}") # Ver error en consola
        return jsonify({"error": "Error interno del servidor", "detalle": str(e)}), 500

@pagos_bp.route("/api/pagos", methods=["GET"])
@jwt_required()
def listar_pagos():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = 6

        pagination = Pago.query.order_by(
            Pago.fecha_pago.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            "pagos": [p.to_dict() for p in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": pagination.page
        }), 200
    except Exception as e:
        print(f"Error listando pagos: {e}")
        return jsonify({"pagos": [], "total": 0}), 500