from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"msg": "Datos incompletos"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"msg": "Credenciales inválidas"}), 401

    if not user.activo:
        return jsonify({"msg": "Usuario inactivo"}), 403

    token = create_access_token(
        identity={
            "id": user.id_usuario,
            "email": user.email,
            "role": user.id_role
        }
    )

    return jsonify({
        "access_token": token
    }), 200
