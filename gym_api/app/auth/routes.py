from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.models.role import Role
from app.extensions import db
from app.models.miembro import Miembro


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

    role = Role.query.get(user.id_role)

    # ✅ JWT CORRECTO
    access_token = create_access_token(
        identity=str(user.id_usuario),   # ← SIEMPRE STRING
        additional_claims={
            "email": user.email,
            "role": role.nombre
        }
    )

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id_usuario,
            "nombre": user.nombre,
            "email": user.email,
            "role": role.nombre
        }
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    
    # 1. Validaciones básicas
    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"msg": "El correo ya está registrado"}), 400

    try:
        # 2. Crear el Usuario
        nuevo_usuario = User(
            nombre=data.get("nombre"),
            email=data.get("email"),
            id_role=4,
            activo=True
        )
        nuevo_usuario.set_password(data.get("password"))
        db.session.add(nuevo_usuario)
        db.session.flush() # Para obtener el id_usuario antes del commit

        # 3. Crear el Perfil de Miembro
        nuevo_miembro = Miembro(
            id_usuario=nuevo_usuario.id_usuario,
            telefono=data.get("telefono"),
            sexo=data.get("sexo"),
            fecha_registro=db.func.current_date(),
            estado="Activo"
        )
        db.session.add(nuevo_miembro)
        db.session.commit()

        return jsonify({"msg": "Usuario registrado exitosamente"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500