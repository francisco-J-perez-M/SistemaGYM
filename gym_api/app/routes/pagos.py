from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.pago import Pago
from app.utils.luhn import validar_luhn
from flask_jwt_extended import jwt_required

pagos_bp = Blueprint("pagos", __name__)

# ================= REGISTRAR PAGO =================
@pagos_bp.route("/api/pagos", methods=["POST"])
@jwt_required()
def registrar_pago():
    data = request.json

    required_fields = ["id_miembro", "monto", "metodo_pago", "concepto"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Falta el campo {field}"}), 400

    # 💳 Validar tarjeta solo si es tarjeta
    if data["metodo_pago"] == "Tarjeta":
        if not validar_luhn(data.get("numero_tarjeta", "")):
            return jsonify({"error": "Tarjeta inválida (Regla de Luhn)"}), 400

    pago = Pago(
        id_miembro=data["id_miembro"],
        monto=data["monto"],
        metodo_pago=data["metodo_pago"],
        concepto=data["concepto"]
    )

    db.session.add(pago)
    db.session.commit()

    return jsonify(pago.to_dict()), 201


# ================= LISTAR TODOS LOS PAGOS =================
@pagos_bp.route("/api/pagos", methods=["GET"])
@jwt_required()
def listar_pagos():
    pagos = Pago.query.order_by(Pago.fecha_pago.desc()).all()
    return jsonify([p.to_dict() for p in pagos]), 200


# ================= PAGOS POR MIEMBRO =================
@pagos_bp.route("/api/pagos/miembro/<int:id_miembro>", methods=["GET"])
@jwt_required()
def pagos_por_miembro(id_miembro):
    pagos = Pago.query.filter_by(id_miembro=id_miembro).all()
    return jsonify([p.to_dict() for p in pagos]), 200
