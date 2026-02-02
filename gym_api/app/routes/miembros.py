import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.models.user import User
from app.extensions import db
from app.models.miembro import Miembro
from flask_jwt_extended import jwt_required
from datetime import datetime

miembros_bp = Blueprint("miembros", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==============================================================================
# 1. LISTAR MIEMBROS (CON BUSCADOR + PAGINACIÓN)
# ==============================================================================
@miembros_bp.route("/api/miembros", methods=["GET"])
@jwt_required()
def listar_miembros():
    page = request.args.get('page', 1, type=int)
    per_page = 6
    mostrar_inactivos = request.args.get('inactivos', 'false') == 'true'
    search = request.args.get('search', '', type=str)

    estado_filtro = "Inactivo" if mostrar_inactivos else "Activo"

    # Join con User para poder buscar por nombre/email
    query = (
        Miembro.query
        .join(User)
        .filter(Miembro.estado == estado_filtro)
    )

    # Lógica del buscador
    if search:
        query = query.filter(
            User.nombre.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%")
        )

    pagination = (
        query
        .order_by(Miembro.fecha_registro.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return jsonify({
        "miembros": [m.to_dict() for m in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200


# ==============================================================================
# 2. CREAR MIEMBRO (CON FOTO Y USUARIO)
# ==============================================================================
@miembros_bp.route("/api/miembros", methods=["POST"])
@jwt_required()
def crear_miembro():
    # Usamos request.form y request.files porque el front envía FormData
    data = request.form
    file = request.files.get('foto')

    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')

    if not nombre or not email:
        return jsonify({"error": "Nombre y Email son obligatorios"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El email ya está registrado"}), 400

    try:
        # 1. Crear Usuario (Login)
        nuevo_usuario = User(
            nombre=nombre,
            email=email,
            id_role=4, # Rol 4 = Miembro (ajusta según tu DB)
            activo=True
        )
        nuevo_usuario.set_password(password if password else "gym123")
        db.session.add(nuevo_usuario)
        db.session.flush() # Para obtener el ID del usuario antes de commit

        # 2. Procesar imagen si existe
        filename_bd = None
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            upload_folder = os.path.join(current_app.root_path, 'static/uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file.save(os.path.join(upload_folder, unique_filename))
            filename_bd = unique_filename

        # 3. Crear Miembro (Datos físicos)
        nuevo_miembro = Miembro(
            id_usuario=nuevo_usuario.id_usuario,
            telefono=data.get("telefono"),
            sexo=data.get("sexo"),
            peso_inicial=data.get("peso_inicial"),
            estatura=data.get("estatura"),
            fecha_registro=datetime.now(),
            estado="Activo",
            foto_perfil=filename_bd
        )

        db.session.add(nuevo_miembro)
        db.session.commit()

        return jsonify(nuevo_miembro.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==============================================================================
# 3. ACTUALIZAR MIEMBRO (PUT) - Restaurada y mejorada
# ==============================================================================
@miembros_bp.route("/api/miembros/<int:id>", methods=["PUT"])
@jwt_required()
def actualizar_miembro(id):
    miembro = Miembro.query.get_or_404(id)
    usuario = User.query.get(miembro.id_usuario)
    
    # Usamos form y files de nuevo para permitir actualizar la foto
    data = request.form
    file = request.files.get('foto')

    try:
        # Actualizar datos de Usuario (Nombre/Email)
        if data.get('nombre'):
            usuario.nombre = data.get('nombre')
        
        if data.get('email'):
            # Verificar que el email no lo use OTRO usuario
            existente = User.query.filter_by(email=data.get('email')).first()
            if existente and existente.id_usuario != usuario.id_usuario:
                return jsonify({"error": "El email ya está en uso por otro usuario"}), 400
            usuario.email = data.get('email')
        
        # Actualizar datos de Miembro
        if data.get('telefono'): miembro.telefono = data.get('telefono')
        if data.get('sexo'): miembro.sexo = data.get('sexo')
        if data.get('peso_inicial'): miembro.peso_inicial = data.get('peso_inicial')
        if data.get('estatura'): miembro.estatura = data.get('estatura')

        # Si suben nueva foto, la guardamos
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            upload_folder = os.path.join(current_app.root_path, 'static/uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file.save(os.path.join(upload_folder, unique_filename))
            miembro.foto_perfil = unique_filename

        db.session.commit()
        return jsonify(miembro.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==============================================================================
# 4. ELIMINAR MIEMBRO (Logico) - Restaurada
# ==============================================================================
@miembros_bp.route("/api/miembros/<int:id>", methods=["DELETE"])
@jwt_required()
def eliminar_miembro(id):
    try:
        miembro = Miembro.query.get_or_404(id)
        usuario = User.query.get(miembro.id_usuario)

        # Soft Delete
        miembro.estado = "Inactivo"
        if usuario:
            usuario.activo = False # Bloqueamos acceso al sistema

        db.session.commit()
        return jsonify({"message": "Miembro desactivado correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==============================================================================
# 5. REACTIVAR MIEMBRO - Restaurada
# ==============================================================================
@miembros_bp.route("/api/miembros/<int:id>/reactivar", methods=["PUT"])
@jwt_required()
def reactivar_miembro(id):
    try:
        miembro = Miembro.query.get_or_404(id)
        usuario = User.query.get(miembro.id_usuario)

        miembro.estado = "Activo"
        if usuario:
            usuario.activo = True # Restauramos acceso

        db.session.commit()
        return jsonify({"message": "Miembro reactivado correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500