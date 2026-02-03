from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import extract, desc, func
from app.extensions import db
from app.models.pago import Pago
from app.models.miembro import Miembro

user_payments_bp = Blueprint('user_payments', __name__)

@user_payments_bp.route('/api/user/payments', methods=['GET'])
@jwt_required()
def get_user_payments():
    """
    Obtiene el historial completo de pagos del usuario autenticado
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Buscar el miembro asociado al usuario
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404

        # Obtener todos los pagos del miembro ordenados por fecha descendente
        pagos = Pago.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(desc(Pago.fecha_pago)).all()
        
        # Calcular estadísticas
        total_pagado = db.session.query(
            func.sum(Pago.monto)
        ).filter_by(id_miembro=miembro.id_miembro).scalar() or 0
        
        # Obtener último y próximo pago
        ultimo_pago = pagos[0] if pagos else None
        
        # Formatear datos para el frontend
        pagos_formateados = []
        for idx, pago in enumerate(pagos):
            pagos_formateados.append({
                "id": f"PAY-{str(pago.id_pago).zfill(3)}",
                "date": pago.fecha_pago.strftime('%d %b %Y'),
                "concept": pago.concepto or f"Pago de membresía",
                "amount": float(pago.monto),
                "method": _format_payment_method(pago.metodo_pago),
                "status": "Completado",
                "rawDate": pago.fecha_pago.isoformat()
            })
        
        # Calcular próximo pago estimado (si tiene membresía activa)
        from app.models.miembro_membresia import MiembroMembresia
        membresia_activa = MiembroMembresia.query.filter_by(
            id_miembro=miembro.id_miembro,
            estado='Activa'
        ).first()
        
        proximo_pago = None
        if membresia_activa and membresia_activa.fecha_fin:
            # Estimar próximo pago 3 días antes del vencimiento
            from datetime import timedelta
            fecha_estimada = membresia_activa.fecha_fin - timedelta(days=3)
            proximo_pago = fecha_estimada.strftime('%d %b %Y')
        
        return jsonify({
            "stats": {
                "totalPaid": float(total_pagado),
                "lastPayment": ultimo_pago.fecha_pago.strftime('%d %b %Y') if ultimo_pago else "N/A",
                "nextPayment": proximo_pago or "No programado",
                "status": "Al día" if membresia_activa else "Sin membresía"
            },
            "payments": pagos_formateados
        }), 200
        
    except Exception as e:
        print(f"Error en get_user_payments: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def _format_payment_method(metodo):
    """Formatea el método de pago para mostrar en el frontend"""
    metodos = {
        "Efectivo": "Efectivo",
        "Tarjeta": "Tarjeta **** 4242",
        "Transferencia": "Transferencia bancaria",
        "Simulado": "Pago simulado"
    }
    return metodos.get(metodo, metodo)


@user_payments_bp.route('/api/user/payments/stats', methods=['GET'])
@jwt_required()
def get_payment_stats():
    """
    Obtiene estadísticas detalladas de pagos por mes/año
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Obtener pagos agrupados por mes
        current_year = datetime.now().year
        
        monthly_stats = db.session.query(
            extract('month', Pago.fecha_pago).label('mes'),
            func.sum(Pago.monto).label('total'),
            func.count(Pago.id_pago).label('cantidad')
        ).filter(
            Pago.id_miembro == miembro.id_miembro,
            extract('year', Pago.fecha_pago) == current_year
        ).group_by('mes').all()
        
        # Formatear datos mensuales
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        stats_por_mes = []
        
        for i in range(1, 13):
            stat = next((s for s in monthly_stats if s.mes == i), None)
            stats_por_mes.append({
                "mes": meses[i-1],
                "total": float(stat.total) if stat else 0,
                "cantidad": int(stat.cantidad) if stat else 0
            })
        
        return jsonify({
            "year": current_year,
            "monthly": stats_por_mes
        }), 200
        
    except Exception as e:
        print(f"Error en get_payment_stats: {e}")
        return jsonify({"error": str(e)}), 500
