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

def to_client_card(self):
    """Convierte miembro a tarjeta de cliente para el dashboard del entrenador"""
    from app.models.sesion_model import Sesion
    from app.models.progreso_fisico import ProgresoFisico
    
    # Calcular progreso (comparar peso actual vs inicial)
    progreso_reciente = ProgresoFisico.query.filter_by(
        id_miembro=self.id_miembro
    ).order_by(ProgresoFisico.fecha_registro.desc()).first()
    
    if progreso_reciente and self.peso_inicial:
        diferencia = abs(self.peso_inicial - progreso_reciente.peso)
        progreso_porcentaje = min(int((diferencia / self.peso_inicial) * 100), 100)
    else:
        progreso_porcentaje = 0
    
    # Calcular racha (días consecutivos con asistencia)
    from app.models.asistencia import Asistencia
    fecha_actual = date.today()
    racha = 0
    
    for i in range(30):  # Revisar últimos 30 días
        fecha_check = fecha_actual - timedelta(days=i)
        asistencia = Asistencia.query.filter(
            Asistencia.id_miembro == self.id_miembro,
            Asistencia.fecha == fecha_check
        ).first()
        
        if asistencia:
            racha += 1
        elif i > 0:  # Si no hay asistencia y no es el día actual, rompe la racha
            break
    
    # Total de sesiones
    sesiones_total = Sesion.query.filter(
        Sesion.id_miembro == self.id_miembro,
        Sesion.estado == 'completed'
    ).count()
    
    # Última sesión
    ultima_sesion = Sesion.query.filter(
        Sesion.id_miembro == self.id_miembro
    ).order_by(Sesion.fecha.desc()).first()
    
    if ultima_sesion:
        if ultima_sesion.fecha == fecha_actual:
            last_session = "Hoy"
        elif ultima_sesion.fecha == fecha_actual - timedelta(days=1):
            last_session = "Ayer"
        elif ultima_sesion.estado == 'in-progress':
            last_session = "En curso"
        else:
            dias = (fecha_actual - ultima_sesion.fecha).days
            last_session = f"Hace {dias} días"
    else:
        last_session = "Nunca"
    
    # Calcular asistencia (últimos 30 días)
    sesiones_programadas = Sesion.query.filter(
        Sesion.id_miembro == self.id_miembro,
        Sesion.fecha >= fecha_actual - timedelta(days=30),
        Sesion.estado.in_(['completed', 'cancelled'])
    ).count()
    
    sesiones_asistidas = Sesion.query.filter(
        Sesion.id_miembro == self.id_miembro,
        Sesion.fecha >= fecha_actual - timedelta(days=30),
        Sesion.estado == 'completed'
    ).count()
    
    attendance = int((sesiones_asistidas / sesiones_programadas * 100)) if sesiones_programadas > 0 else 0
    
    # Determinar estado y tendencia
    status = 'active' if attendance >= 75 else 'warning'
    trend = 'up' if attendance >= 80 else ('down' if attendance < 60 else 'stable')
    
    # Calcular edad
    from datetime import date
    edad = (date.today() - self.fecha_nacimiento).days // 365 if self.fecha_nacimiento else 0
    
    # Determinar objetivo (basado en progreso físico)
    objetivo = "Pérdida de peso"  # Default
    if progreso_reciente:
        if progreso_reciente.grasa_corporal and progreso_reciente.grasa_corporal < 15:
            objetivo = "Ganancia muscular"
        elif progreso_reciente.masa_muscular and progreso_reciente.masa_muscular > 40:
            objetivo = "Definición"
        elif progreso_reciente.grasa_corporal and progreso_reciente.grasa_corporal > 30:
            objetivo = "Pérdida de peso"
        else:
            objetivo = "Acondicionamiento"
    
    # Estadísticas de progreso
    stats = {}
    if progreso_reciente and self.peso_inicial:
        # Obtener el progreso más antiguo para comparación
        progreso_inicial = ProgresoFisico.query.filter_by(
            id_miembro=self.id_miembro
        ).order_by(ProgresoFisico.fecha_registro.asc()).first()
        
        if progreso_inicial:
            stats = {
                'weight': {
                    'initial': float(progreso_inicial.peso),
                    'current': float(progreso_reciente.peso),
                    'goal': float(progreso_inicial.peso) * 0.9  # Meta: -10%
                },
                'muscle': {
                    'initial': float(progreso_inicial.masa_muscular or 30),
                    'current': float(progreso_reciente.masa_muscular or 30),
                    'goal': float(progreso_inicial.masa_muscular or 30) * 1.2  # Meta: +20%
                },
                'fat': {
                    'initial': float(progreso_inicial.grasa_corporal or 25),
                    'current': float(progreso_reciente.grasa_corporal or 25),
                    'goal': float(progreso_inicial.grasa_corporal or 25) * 0.7  # Meta: -30%
                }
            }
    
    return {
        'id': self.id_miembro,
        'name': self.usuario.nombre,
        'age': edad,
        'goal': objetivo,
        'progress': progreso_porcentaje,
        'lastSession': last_session,
        'streak': racha,
        'sessionsTotal': sesiones_total,
        'attendance': attendance,
        'status': status,
        'trend': trend,
        'stats': stats if stats else {
            'weight': {'initial': float(self.peso_inicial or 70), 'current': float(self.peso_inicial or 70), 'goal': float(self.peso_inicial or 70) * 0.9},
            'muscle': {'initial': 30, 'current': 30, 'goal': 36},
            'fat': {'initial': 25, 'current': 25, 'goal': 18}
        }
    }

def to_dict(self, include_stats=False):
    """Convierte miembro a diccionario con información completa"""
    base_dict = {
        'id': self.id_miembro,
        'name': self.usuario.nombre,
        'email': self.usuario.email,
        'phone': self.telefono,
        'birthDate': str(self.fecha_nacimiento) if self.fecha_nacimiento else None,
        'sex': self.sexo,
        'initialWeight': float(self.peso_inicial) if self.peso_inicial else None,
        'height': float(self.estatura) if self.estatura else None,
        'registrationDate': str(self.fecha_registro) if self.fecha_registro else None,
        'status': self.estado,
        'profilePhoto': self.foto_perfil
    }
    
    if include_stats:
        # Incluir tarjeta de cliente con estadísticas
        client_card = self.to_client_card()
        base_dict.update({
            'progress': client_card['progress'],
            'streak': client_card['streak'],
            'sessionsTotal': client_card['sessionsTotal'],
            'attendance': client_card['attendance'],
            'goal': client_card['goal'],
            'stats': client_card['stats']
        })
    
    return base_dict