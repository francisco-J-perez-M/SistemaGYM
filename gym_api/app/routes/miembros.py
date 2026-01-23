from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.miembro import Miembro
from flask_jwt_extended import jwt_required

miembros_bp = Blueprint("miembros", __name__)

# 🔹 LISTAR MIEMBROS
@miembros_bp.route("/api/miembros", methods=["GET"])
@jwt_required()
def listar_miembros():
    miembros = Miembro.query.all()
    return jsonify([m.to_dict() for m in miembros]), 200


# 🔹 CREAR MIEMBRO
@miembros_bp.route("/api/miembros", methods=["POST"])
@jwt_required()
def crear_miembro():
    data = request.json

    miembro = Miembro(
        id_usuario=data.get("id_usuario"),
        telefono=data.get("telefono"),
        fecha_nacimiento=data.get("fecha_nacimiento"),
        sexo=data.get("sexo"),
        peso_inicial=data.get("peso_inicial"),
        estatura=data.get("estatura"),
        fecha_registro=data.get("fecha_registro"),
        estado="Activo"
    )

    db.session.add(miembro)
    db.session.commit()

    return jsonify(miembro.to_dict()), 201


# 🔹 ACTUALIZAR MIEMBRO
@miembros_bp.route("/api/miembros/<int:id>", methods=["PUT"])
@jwt_required()
def actualizar_miembro(id):
    miembro = Miembro.query.get_or_404(id)
    data = request.json

    miembro.telefono = data.get("telefono", miembro.telefono)
    miembro.estado = data.get("estado", miembro.estado)

    db.session.commit()
    return jsonify(miembro.to_dict()), 200


# 🔹 ELIMINAR (LÓGICO)
@miembros_bp.route("/api/miembros/<int:id>", methods=["DELETE"])
@jwt_required()
def eliminar_miembro(id):
    miembro = Miembro.query.get_or_404(id)
    miembro.estado = "Inactivo"

    db.session.commit()
    return jsonify({"message": "Miembro desactivado"}), 200
