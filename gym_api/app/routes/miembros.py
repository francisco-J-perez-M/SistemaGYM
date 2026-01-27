from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.miembro import Miembro
from flask_jwt_extended import jwt_required

miembros_bp = Blueprint("miembros", __name__)

# 🔹 LISTAR MIEMBROS (CON PAGINACIÓN Y FILTRO)
@miembros_bp.route("/api/miembros", methods=["GET"])
@jwt_required()
def listar_miembros():
    page = request.args.get('page', 1, type=int)
    per_page = 6  # Requerimiento: paginación cada 6
    mostrar_inactivos = request.args.get('inactivos', 'false') == 'true'
    
    # Filtrar por estado
    estado_filtro = "Inactivo" if mostrar_inactivos else "Activo"
    
    # Query con paginación
    pagination = Miembro.query.filter_by(estado=estado_filtro).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "miembros": [m.to_dict() for m in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

# 🔹 REACTIVAR MIEMBRO
@miembros_bp.route("/api/miembros/<int:id>/reactivar", methods=["PUT"])
@jwt_required()
def reactivar_miembro(id):
    miembro = Miembro.query.get_or_404(id)
    miembro.estado = "Activo"
    db.session.commit()
    return jsonify({"message": "Miembro reactivado exitosamente"}), 200

# ... (MANTENER CREAR, ACTUALIZAR Y ELIMINAR COMO ESTABAN) ...
# Solo asegúrate de que CREAR establezca estado="Activo" por defecto.
@miembros_bp.route("/api/miembros", methods=["POST"])
@jwt_required()
def crear_miembro():
    data = request.json
    miembro = Miembro(
        # ... tus otros campos ...
        id_usuario=data.get("id_usuario"),
        telefono=data.get("telefono"),
        fecha_nacimiento=data.get("fecha_nacimiento"),
        sexo=data.get("sexo"),
        peso_inicial=data.get("peso_inicial"),
        estatura=data.get("estatura"),
        fecha_registro=data.get("fecha_registro"),
        estado="Activo" # Asegurar que nazca activo
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
    # Quitamos la opción de editar estado manualmente aquí para evitar errores,
    # usamos eliminar/reactivar para eso.
    
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