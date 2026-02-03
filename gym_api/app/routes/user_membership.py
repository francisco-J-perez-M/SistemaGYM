from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app.extensions import db
from app.models.miembro import Miembro
from app.models.membresia import Membresia
from app.models.miembro_membresia import MiembroMembresia
from app.models.pago import Pago

user_membership_bp = Blueprint('user_membership', __name__)


@user_membership_bp.route('/api/user/membership', methods=['GET'])
@jwt_required()
def get_user_membership():
    """
    Obtiene información de la membresía actual del usuario
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Buscar membresía activa
        membresia_activa = MiembroMembresia.query.filter_by(
            id_miembro=miembro.id_miembro,
            estado='Activa'
        ).first()
        
        if not membresia_activa:
            return jsonify({
                "tieneMembresia": False,
                "mensaje": "No tienes una membresía activa"
            }), 200
        
        # Obtener datos de la membresía
        membresia = membresia_activa.membresia
        
        # Calcular días restantes
        dias_restantes = (membresia_activa.fecha_fin - datetime.now().date()).days
        
        return jsonify({
            "tieneMembresia": True,
            "membresia": {
                "id": membresia_activa.id_mm,
                "nombre": membresia.nombre if membresia else "N/A",
                "fechaInicio": membresia_activa.fecha_inicio.strftime('%Y-%m-%d'),
                "fechaFin": membresia_activa.fecha_fin.strftime('%Y-%m-%d'),
                "diasRestantes": dias_restantes,
                "estado": "activa" if dias_restantes > 0 else "por_vencer",
                "precio": float(membresia.precio) if membresia else 0
            }
        }), 200
        
    except Exception as e:
        print(f"Error en get_user_membership: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_membership_bp.route('/api/user/membership/plans', methods=['GET'])
@jwt_required()
def get_available_plans():
    """
    Obtiene los planes de membresía disponibles para renovación
    """
    try:
        # Obtener todas las membresías
        membresias = Membresia.query.all()
        
        planes = []
        for mem in membresias:
            # Calcular ahorro basado en el plan mensual
            precio_mensual = next((m.precio for m in membresias if m.duracion_meses == 1), 950)
            ahorro = (precio_mensual * mem.duracion_meses) - mem.precio if mem.duracion_meses > 1 else 0
            
            # Mapear a formato del frontend
            plan_id = "monthly" if mem.duracion_meses == 1 else "quarterly" if mem.duracion_meses == 3 else "annual"
            
            planes.append({
                "id": plan_id,
                "id_membresia": mem.id_membresia,
                "nombre": mem.nombre,
                "duracion_meses": mem.duracion_meses,
                "precio": float(mem.precio),
                "ahorro": float(ahorro)
            })
        
        return jsonify({"planes": planes}), 200
        
    except Exception as e:
        print(f"Error en get_available_plans: {e}")
        return jsonify({"error": str(e)}), 500


@user_membership_bp.route('/api/user/membership/renew', methods=['POST'])
@jwt_required()
def renew_membership():
    """
    Procesa la renovación de membresía
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        id_membresia = data.get('id_membresia')
        metodo_pago = data.get('metodo_pago', 'Tarjeta')  # Obtener del request
        
        if not id_membresia:
            return jsonify({"error": "ID de membresía requerido"}), 400
        
        # Validar método de pago
        metodos_validos = ['Efectivo', 'Tarjeta', 'Transferencia']
        if metodo_pago not in metodos_validos:
            return jsonify({"error": f"Método de pago inválido. Usar: {', '.join(metodos_validos)}"}), 400
        
        membresia = Membresia.query.get(id_membresia)
        
        if not membresia:
            return jsonify({"error": "Membresía no encontrada"}), 404
        
        # Verificar si tiene membresía activa
        membresia_activa = MiembroMembresia.query.filter_by(
            id_miembro=miembro.id_miembro,
            estado='Activa'
        ).first()
        
        # Calcular fechas
        fecha_inicio = datetime.now().date()
        
        if membresia_activa:
            # Si tiene membresía activa, la nueva inicia cuando expire la actual
            if membresia_activa.fecha_fin > fecha_inicio:
                fecha_inicio = membresia_activa.fecha_fin + timedelta(days=1)
            
            # Cambiar estado de la membresía anterior
            membresia_activa.estado = 'Vencida'
        
        fecha_fin = fecha_inicio + timedelta(days=membresia.duracion_meses * 30)
        
        # Crear nueva membresía
        nueva_membresia = MiembroMembresia(
            id_miembro=miembro.id_miembro,
            id_membresia=id_membresia,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado='Activa'
        )
        
        db.session.add(nueva_membresia)
        
        # Registrar pago con el método seleccionado
        nuevo_pago = Pago(
            id_miembro=miembro.id_miembro,
            monto=membresia.precio,
            metodo_pago=metodo_pago,
            concepto=f"Renovación {membresia.nombre}",
            fecha_pago=datetime.now()
        )
        
        db.session.add(nuevo_pago)
        db.session.commit()
        
        return jsonify({
            "message": "Membresía renovada exitosamente",
            "membresia": {
                "nombre": membresia.nombre,
                "fechaInicio": fecha_inicio.strftime('%Y-%m-%d'),
                "fechaFin": fecha_fin.strftime('%Y-%m-%d'),
                "monto": float(membresia.precio)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en renew_membership: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_membership_bp.route('/api/user/membership/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    """
    Obtiene los métodos de pago guardados del usuario
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Obtener los últimos métodos de pago utilizados
        pagos_recientes = Pago.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(Pago.fecha_pago.desc()).limit(5).all()
        
        # Extraer métodos únicos
        metodos_vistos = set()
        metodos = []
        
        for idx, pago in enumerate(pagos_recientes):
            if pago.metodo_pago not in metodos_vistos:
                metodos_vistos.add(pago.metodo_pago)
                
                # Formatear según el tipo
                if pago.metodo_pago == 'Tarjeta':
                    numero_display = "**** **** **** 4242"  # En producción, guardar últimos 4 dígitos
                elif pago.metodo_pago == 'Transferencia':
                    numero_display = "Cuenta bancaria"
                else:
                    numero_display = pago.metodo_pago
                
                metodos.append({
                    "id": idx + 1,
                    "tipo": pago.metodo_pago,
                    "numero": numero_display,
                    "principal": idx == 0
                })
        
        # Si no tiene métodos, retornar lista vacía
        if not metodos:
            return jsonify({"metodos": []}), 200
        
        return jsonify({"metodos": metodos}), 200
        
    except Exception as e:
        print(f"Error en get_payment_methods: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500