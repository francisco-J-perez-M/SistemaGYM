from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import os
from app.extensions import db
from app.models.user import User
from app.models.miembro import Miembro
from app.models.asistencia import Asistencia
from sqlalchemy import func, extract

user_profile_bp = Blueprint('user_profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@user_profile_bp.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """
    Obtiene el perfil completo del usuario autenticado
    """
    try:
        user_id = int(get_jwt_identity())
        usuario = User.query.get(user_id)
        
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Calcular estadísticas de actividad
        total_entrenamientos = Asistencia.query.filter_by(
            id_miembro=miembro.id_miembro
        ).count()
        
        # Calcular meses activo
        if miembro.fecha_registro:
            meses_activo = ((datetime.now().date() - miembro.fecha_registro).days // 30)
        else:
            meses_activo = 0
        
        # Formatear datos del perfil
        profile_data = {
            "nombre": usuario.nombre,
            "email": usuario.email,
            "telefono": miembro.telefono or "",
            "fechaNacimiento": miembro.fecha_nacimiento.strftime('%d/%m/%Y') if miembro.fecha_nacimiento else "",
            "direccion": "",  # Agregar campo en DB si es necesario
            "genero": "Masculino" if miembro.sexo == "M" else "Femenino" if miembro.sexo == "F" else "Otro",
            "peso": f"{miembro.peso_inicial} kg" if miembro.peso_inicial else "No registrado",
            "altura": f"{miembro.estatura} m" if miembro.estatura else "No registrado",
            "objetivo": "Tonificación muscular",  # Agregar campo en DB si es necesario
            "nivelExperiencia": "Intermedio",  # Agregar campo en DB si es necesario
            "fotoPerfil": miembro.foto_perfil,
            "mesesActivo": meses_activo,
            "totalEntrenamientos": total_entrenamientos
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        print(f"Error en get_user_profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_profile_bp.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """
    Actualiza el perfil del usuario autenticado
    """
    try:
        user_id = int(get_jwt_identity())
        usuario = User.query.get(user_id)
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not usuario or not miembro:
            return jsonify({"error": "Usuario/Miembro no encontrado"}), 404
        
        # Manejar tanto JSON como FormData
        if request.is_json:
            data = request.json
            file = None
        else:
            data = request.form
            file = request.files.get('foto')
        
        # Actualizar datos de usuario
        if data.get('nombre'):
            usuario.nombre = data.get('nombre')
        
        if data.get('email'):
            # Verificar que el email no esté en uso por otro usuario
            existing = User.query.filter_by(email=data.get('email')).first()
            if existing and existing.id_usuario != user_id:
                return jsonify({"error": "El email ya está en uso"}), 400
            usuario.email = data.get('email')
        
        # Actualizar datos de miembro
        if data.get('telefono'):
            miembro.telefono = data.get('telefono')
        
        if data.get('fechaNacimiento'):
            # Convertir formato DD/MM/YYYY a date
            try:
                fecha_str = data.get('fechaNacimiento')
                miembro.fecha_nacimiento = datetime.strptime(fecha_str, '%d/%m/%Y').date()
            except:
                pass
        
        if data.get('genero'):
            genero_map = {"Masculino": "M", "Femenino": "F", "Otro": "Otro"}
            miembro.sexo = genero_map.get(data.get('genero'), miembro.sexo)
        
        if data.get('peso'):
            # Extraer solo el número
            try:
                peso_str = data.get('peso').replace('kg', '').strip()
                miembro.peso_inicial = float(peso_str)
            except:
                pass
        
        if data.get('altura'):
            # Extraer solo el número
            try:
                altura_str = data.get('altura').replace('m', '').strip()
                miembro.estatura = float(altura_str)
            except:
                pass
        
        # Procesar foto de perfil si se envía
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            upload_folder = os.path.join(current_app.root_path, 'static/uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file.save(os.path.join(upload_folder, unique_filename))
            miembro.foto_perfil = unique_filename
        
        db.session.commit()
        
        return jsonify({
            "message": "Perfil actualizado correctamente",
            "profile": {
                "nombre": usuario.nombre,
                "email": usuario.email,
                "fotoPerfil": miembro.foto_perfil
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_user_profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_profile_bp.route('/api/user/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    """
    Endpoint específico para subir foto de perfil
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        file = request.files.get('foto')
        
        if not file or not allowed_file(file.filename):
            return jsonify({"error": "Archivo inválido"}), 400
        
        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        upload_folder = os.path.join(current_app.root_path, 'static/uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file.save(os.path.join(upload_folder, unique_filename))
        
        miembro.foto_perfil = unique_filename
        db.session.commit()
        
        return jsonify({
            "message": "Foto actualizada correctamente",
            "fotoPerfil": unique_filename
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en upload_profile_photo: {e}")
        return jsonify({"error": str(e)}), 500
