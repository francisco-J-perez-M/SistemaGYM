from flask import Blueprint, jsonify
from sqlalchemy import func, extract
from datetime import datetime, timedelta

# --- CORRECCIÓN DE IMPORTACIONES ---
# 1. Importamos 'db' desde extensions (lugar habitual en patrones factory)
from app.extensions import db 
# 2. Importamos los modelos desde sus archivos específicos
from app.models.miembro import Miembro
from app.models.pago import Pago

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/kpis', methods=['GET'])
def get_dashboard_kpis():
    try:
        now = datetime.now()
        
        # 1. MIEMBROS ACTIVOS (Conteo directo en DB)
        active_members = Miembro.query.filter_by(estado='Activo').count()
        
        # 2. INGRESOS DEL MES ACTUAL (Suma directa en DB)
        current_month_income = db.session.query(func.sum(Pago.monto))\
            .filter(extract('year', Pago.fecha_pago) == now.year)\
            .filter(extract('month', Pago.fecha_pago) == now.month)\
            .scalar() or 0  # scalar() devuelve el valor único, or 0 si es None

        # 3. INGRESOS ÚLTIMOS 6 MESES (Agrupación SQL)
        six_months_ago = now - timedelta(days=180)
        
        income_query = db.session.query(
            extract('month', Pago.fecha_pago).label('mes'),
            func.sum(Pago.monto).label('total')
        ).filter(Pago.fecha_pago >= six_months_ago)\
         .group_by(extract('month', Pago.fecha_pago))\
         .all()

        # Formatear para el gráfico
        revenue_map = {int(row.mes): float(row.total) for row in income_query}
        kpi_revenue = []
        
        # Generar los últimos 6 meses en orden
        for i in range(5, -1, -1):
            date_cursor = now - timedelta(days=i*30) 
            mes_num = date_cursor.month
            kpi_revenue.append(revenue_map.get(mes_num, 0))

        return jsonify({
            'active_members': active_members,
            'monthly_revenue': float(current_month_income),
            'revenue_6_months': kpi_revenue
        }), 200

    except Exception as e:
        print(f"Error en dashboard: {e}")
        return jsonify({'error': str(e)}), 500