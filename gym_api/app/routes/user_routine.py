from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models.miembro import Miembro
from app.models.rutina_models import Rutina, RutinaDia, RutinaEjercicio

user_routines_bp = Blueprint('user_routines', __name__)


@user_routines_bp.route('/routines', methods=['GET'])
@jwt_required()
def get_user_routines():
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        rutinas = Rutina.query.filter_by(id_miembro=miembro.id_miembro).all()
        
        return jsonify({
            "rutinas": [rutina.to_dict() for rutina in rutinas]
        }), 200
        
    except Exception as e:
        print(f"Error en get_user_routines: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_routines_bp.route('/routines/<int:id>', methods=['GET'])
@jwt_required()
def get_routine(id):
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        rutina = Rutina.query.filter_by(
            id_rutina=id,
            id_miembro=miembro.id_miembro
        ).first()
        
        if not rutina:
            return jsonify({"error": "Rutina no encontrada"}), 404
        
        return jsonify(rutina.to_dict()), 200
        
    except Exception as e:
        print(f"Error en get_routine: {e}")
        return jsonify({"error": str(e)}), 500


@user_routines_bp.route('/routines', methods=['POST'])
@jwt_required()
def create_routine():
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        
        if not data.get('nombre'):
            return jsonify({"error": "El nombre es requerido"}), 400
        
        if not data.get('dias') or len(data['dias']) == 0:
            return jsonify({"error": "Debes agregar al menos un día"}), 400
        
        # Crear rutina
        nueva_rutina = Rutina(
            id_miembro=miembro.id_miembro,
            nombre=data['nombre'],
            activa=True
        )
        db.session.add(nueva_rutina)
        db.session.flush()
        
        # Crear días y ejercicios
        for idx, dia_data in enumerate(data['dias']):
            nuevo_dia = RutinaDia(
                id_rutina=nueva_rutina.id_rutina,
                dia_semana=dia_data['dia'],
                grupo_muscular=dia_data.get('grupo', ''),
                orden=idx
            )
            db.session.add(nuevo_dia)
            db.session.flush()
            
            for ej_idx, ejercicio_data in enumerate(dia_data.get('ejercicios', [])):
                if ejercicio_data['nombre'].strip():
                    nuevo_ejercicio = RutinaEjercicio(
                        id_rutina_dia=nuevo_dia.id_rutina_dia,
                        nombre_ejercicio=ejercicio_data['nombre'],
                        series=ejercicio_data.get('series', '3'),
                        repeticiones=ejercicio_data.get('reps', '12'),
                        orden=ej_idx
                    )
                    db.session.add(nuevo_ejercicio)
        
        db.session.commit()
        
        return jsonify({
            "message": "Rutina creada exitosamente",
            "rutina": nueva_rutina.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en create_routine: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_routines_bp.route('/routines/<int:id>', methods=['PUT'])
@jwt_required()
def update_routine(id):
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        rutina = Rutina.query.filter_by(
            id_rutina=id,
            id_miembro=miembro.id_miembro
        ).first()
        
        if not rutina:
            return jsonify({"error": "Rutina no encontrada"}), 404
        
        data = request.json
        
        # Actualizar nombre
        if data.get('nombre'):
            rutina.nombre = data['nombre']
        
        # Eliminar días existentes
        RutinaDia.query.filter_by(id_rutina=rutina.id_rutina).delete()
        
        # Crear nuevos días y ejercicios
        for idx, dia_data in enumerate(data.get('dias', [])):
            nuevo_dia = RutinaDia(
                id_rutina=rutina.id_rutina,
                dia_semana=dia_data['dia'],
                grupo_muscular=dia_data.get('grupo', ''),
                orden=idx
            )
            db.session.add(nuevo_dia)
            db.session.flush()
            
            for ej_idx, ejercicio_data in enumerate(dia_data.get('ejercicios', [])):
                if ejercicio_data['nombre'].strip():
                    nuevo_ejercicio = RutinaEjercicio(
                        id_rutina_dia=nuevo_dia.id_rutina_dia,
                        nombre_ejercicio=ejercicio_data['nombre'],
                        series=ejercicio_data.get('series', '3'),
                        repeticiones=ejercicio_data.get('reps', '12'),
                        orden=ej_idx
                    )
                    db.session.add(nuevo_ejercicio)
        
        rutina.fecha_actualizacion = datetime.now()
        db.session.commit()
        
        return jsonify({
            "message": "Rutina actualizada exitosamente",
            "rutina": rutina.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en update_routine: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_routines_bp.route('/routines/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_routine(id):
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        rutina = Rutina.query.filter_by(
            id_rutina=id,
            id_miembro=miembro.id_miembro
        ).first()
        
        if not rutina:
            return jsonify({"error": "Rutina no encontrada"}), 404
        
        db.session.delete(rutina)
        db.session.commit()
        
        return jsonify({"message": "Rutina eliminada exitosamente"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en delete_routine: {e}")
        return jsonify({"error": str(e)}), 500


@user_routines_bp.route('/routines/<int:id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_routine(id):
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        rutina_original = Rutina.query.filter_by(
            id_rutina=id,
            id_miembro=miembro.id_miembro
        ).first()
        
        if not rutina_original:
            return jsonify({"error": "Rutina no encontrada"}), 404
        
        # Crear copia de la rutina
        nueva_rutina = Rutina(
            id_miembro=miembro.id_miembro,
            nombre=f"Copia de {rutina_original.nombre}",
            activa=False
        )
        db.session.add(nueva_rutina)
        db.session.flush()
        
        # Copiar días y ejercicios
        for dia in rutina_original.dias:
            nuevo_dia = RutinaDia(
                id_rutina=nueva_rutina.id_rutina,
                dia_semana=dia.dia_semana,
                grupo_muscular=dia.grupo_muscular,
                orden=dia.orden
            )
            db.session.add(nuevo_dia)
            db.session.flush()
            
            for ejercicio in dia.ejercicios:
                nuevo_ejercicio = RutinaEjercicio(
                    id_rutina_dia=nuevo_dia.id_rutina_dia,
                    nombre_ejercicio=ejercicio.nombre_ejercicio,
                    series=ejercicio.series,
                    repeticiones=ejercicio.repeticiones,
                    peso=ejercicio.peso,
                    notas=ejercicio.notas,
                    orden=ejercicio.orden
                )
                db.session.add(nuevo_ejercicio)
        
        db.session.commit()
        
        return jsonify({
            "message": "Rutina duplicada exitosamente",
            "rutina": nueva_rutina.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en duplicate_routine: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500