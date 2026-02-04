from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models.user import User
from app.models.role import Role
from app.extensions import db
from app.models.miembro import Miembro
from app.models.miembro_membresia import MiembroMembresia

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

    # ---------------------------------------------------------
    # 🔍 LÓGICA DE NIVEL DE ACCESO (MEMBRESÍA)
    # ---------------------------------------------------------
    nombre_membresia = "Sin Plan"
    access_level = "premium"  # Por defecto, admins y empleados tienen acceso total

    # Si el usuario es un 'Miembro' (o rol ID 4, ajusta según tu DB)
    if role.nombre == "Miembro" or user.id_role == 4:
        # Buscar el perfil de miembro
        miembro = Miembro.query.filter_by(id_usuario=user.id_usuario).first()
        
        if miembro:
            # Buscar membresía activa más reciente
            membresia_activa = (
                MiembroMembresia.query
                .filter(
                    MiembroMembresia.id_miembro == miembro.id_miembro,
                    MiembroMembresia.estado == 'Activa' 
                )
                .order_by(MiembroMembresia.fecha_fin.desc())
                .first()
            )

            if membresia_activa and membresia_activa.membresia:
                nombre_membresia = membresia_activa.membresia.nombre
                
                # ✅ DETERMINAR TIPO SEGÚN TU TABLA DE MEMBRESÍAS:
                # Premium → "Premium Mensual", "Premium Anual", "VIP"
                # Básico → "Básica Mensual", "Básica Anual", "Estudiante", "Familiar"
                
                planes_premium = ["Premium", "VIP"]
                
                if any(p in nombre_membresia for p in planes_premium):
                    access_level = "premium"
                else:
                    access_level = "basico"
            else:
                # Si es miembro pero no tiene membresía activa
                access_level = "basico"
        else:
            # Si el usuario tiene rol de miembro pero no existe el perfil
            access_level = "basico"

    # ---------------------------------------------------------
    # ✅ CREACIÓN DEL TOKEN Y RESPUESTA
    # ---------------------------------------------------------
    access_token = create_access_token(
        identity=str(user.id_usuario),
        additional_claims={
            "email": user.email,
            "role": role.nombre,
            "plan": nombre_membresia,
            "access_level": access_level
        }
    )

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id_usuario,
            "nombre": user.nombre,
            "email": user.email,
            "role": role.nombre,
            "membership_plan": nombre_membresia, 
            "access_level": access_level 
        }
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data.get("email")).first():
        return jsonify({"msg": "El correo ya está registrado"}), 400

    try:
        nuevo_usuario = User(
            nombre=data.get("nombre"),
            email=data.get("email"),
            id_role=4,  # Asumiendo 4 es Miembro
            activo=True
        )
        nuevo_usuario.set_password(data.get("password"))
        db.session.add(nuevo_usuario)
        db.session.flush() 

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