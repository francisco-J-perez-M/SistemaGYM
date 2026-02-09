from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import desc
from app.extensions import db
from app.models.miembro import Miembro
from app.models.progreso_fisico import ProgresoFisico

user_body_progress_bp = Blueprint('user_body_progress', __name__)


@user_body_progress_bp.route('/api/user/body-progress', methods=['GET'])
@jwt_required()
def get_body_progress():
    """
    Obtiene el progreso corporal del usuario con datos reales
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        # Obtener progreso histórico ordenado por fecha
        progresos = ProgresoFisico.query.filter_by(
            id_miembro=miembro.id_miembro
        ).order_by(ProgresoFisico.fecha_registro.desc()).all()
        
        # Determinar valores actuales e iniciales
        if progresos:
            progreso_actual = progresos[0]
            progreso_inicial = progresos[-1]
            
            peso_actual = float(progreso_actual.peso) if progreso_actual.peso else float(miembro.peso_inicial or 0)
            peso_inicial = float(progreso_inicial.peso) if progreso_inicial.peso else float(miembro.peso_inicial or 0)
        else:
            # Si no hay registros de progreso, usar datos del miembro
            peso_actual = float(miembro.peso_inicial or 0)
            peso_inicial = peso_actual
            progreso_actual = None
        
        # Validar estatura
        estatura = float(miembro.estatura or 1.7)
        if estatura == 0:
            estatura = 1.7
        
        # Calcular IMC
        imc = _calcular_imc(peso_actual, estatura)
        
        # Calcular grasa corporal y músculo usando fórmulas estándar
        sexo = miembro.sexo
        grasa_corporal_actual = _calcular_grasa_corporal(peso_actual, imc, sexo)
        grasa_corporal_inicial = _calcular_grasa_corporal(peso_inicial, _calcular_imc(peso_inicial, estatura), sexo)
        
        # Músculo es aproximadamente 100 - grasa - huesos (asumiendo ~15% huesos)
        musculo_actual = round(100 - grasa_corporal_actual - 15, 1)
        musculo_inicial = round(100 - grasa_corporal_inicial - 15, 1)
        
        # Establecer metas realistas
        peso_meta = _calcular_peso_meta(peso_inicial, imc, sexo)
        grasa_meta = _calcular_grasa_meta(sexo)
        musculo_meta = round(100 - grasa_meta - 15, 1)
        
        # 🆕 EXTRAER MEDIDAS CORPORALES DEL ÚLTIMO PROGRESO
        def _get_medida(progreso, campo):
            """Extrae una medida del progreso, retorna 0 si no existe"""
            if not progreso:
                return 0
            valor = getattr(progreso, campo, None)
            return float(valor) if valor else 0
        
        body_metrics = {
            "peso": {
                "actual": round(peso_actual, 1),
                "inicial": round(peso_inicial, 1),
                "meta": round(peso_meta, 1)
            },
            "grasaCorporal": {
                "actual": round(grasa_corporal_actual, 1),
                "inicial": round(grasa_corporal_inicial, 1),
                "meta": round(grasa_meta, 1)
            },
            "musculo": {
                "actual": round(musculo_actual, 1),
                "inicial": round(musculo_inicial, 1),
                "meta": round(musculo_meta, 1)
            },
            "imc": round(imc, 1),
            "estatura": round(estatura, 2),
            
            # 🆕 AGREGAR TODAS LAS MEDIDAS CORPORALES
            "pecho": round(_get_medida(progreso_actual, 'pecho'), 1),
            "cintura": round(_get_medida(progreso_actual, 'cintura'), 1),
            "cadera": round(_get_medida(progreso_actual, 'cadera'), 1),
            "brazoDerecho": round(_get_medida(progreso_actual, 'brazo_derecho'), 1),
            "brazoIzquierdo": round(_get_medida(progreso_actual, 'brazo_izquierdo'), 1),
            "musloDerecho": round(_get_medida(progreso_actual, 'muslo_derecho'), 1),
            "musloIzquierdo": round(_get_medida(progreso_actual, 'muslo_izquierdo'), 1),
            "pantorrilla": round(_get_medida(progreso_actual, 'pantorrilla'), 1)
        }
        
        # Obtener progreso mensual real
        progreso_mensual = _obtener_progreso_mensual_real(miembro.id_miembro, peso_inicial, peso_meta)
        
        # Determinar género automáticamente
        gender = "male" if sexo == "M" else "female"
        
        return jsonify({
            "bodyMetrics": body_metrics,
            "progressHistory": progreso_mensual,
            "gender": gender,
            "hasDatos": len(progresos) > 0
        }), 200
        
    except Exception as e:
        print(f"Error en get_body_progress: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@user_body_progress_bp.route('/api/user/body-progress', methods=['POST'])
@jwt_required()
def add_body_progress():
    """
    Agrega un nuevo registro de progreso corporal
    """
    try:
        user_id = int(get_jwt_identity())
        miembro = Miembro.query.filter_by(id_usuario=user_id).first()
        
        if not miembro:
            return jsonify({"error": "Miembro no encontrado"}), 404
        
        data = request.json
        
        # Validar datos requeridos
        if not data.get('peso'):
            return jsonify({"error": "El peso es requerido"}), 400
        
        # Crear nuevo registro
        nuevo_progreso = ProgresoFisico(
            id_miembro=miembro.id_miembro,
            peso=data.get('peso'),
            cintura=data.get('cintura'),
            cadera=data.get('cadera'),
            fecha_registro=datetime.now().date()
        )
        
        # 🆕 AGREGAR CAMPOS ADICIONALES
        campos_opcionales = [
            'pecho', 'brazo_derecho', 'brazo_izquierdo',
            'muslo_derecho', 'muslo_izquierdo', 'pantorrilla'
        ]
        
        for campo in campos_opcionales:
            if campo in data and data[campo]:
                setattr(nuevo_progreso, campo, data[campo])
        
        # Calcular BMI automáticamente
        if miembro.estatura and nuevo_progreso.peso:
            estatura_metros = float(miembro.estatura)
            if estatura_metros > 0:
                nuevo_progreso.bmi = round(_calcular_imc(float(nuevo_progreso.peso), estatura_metros), 2)
        
        db.session.add(nuevo_progreso)
        db.session.commit()
        
        return jsonify({
            "message": "Progreso registrado correctamente",
            "progreso": {
                "peso": float(nuevo_progreso.peso) if nuevo_progreso.peso else None,
                "bmi": float(nuevo_progreso.bmi) if nuevo_progreso.bmi else None,
                "cintura": float(nuevo_progreso.cintura) if nuevo_progreso.cintura else None,
                "cadera": float(nuevo_progreso.cadera) if nuevo_progreso.cadera else None,
                "fecha": nuevo_progreso.fecha_registro.strftime('%Y-%m-%d')
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en add_body_progress: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================
# FUNCIONES AUXILIARES
# ============================================

def _calcular_imc(peso, estatura):
    """Calcula el IMC (peso / estatura²)"""
    try:
        if estatura > 0 and peso > 0:
            return peso / (estatura ** 2)
        return 0
    except:
        return 0


def _calcular_grasa_corporal(peso, imc, sexo):
    """
    Calcula el porcentaje de grasa corporal usando la fórmula de Deurenberg
    %Grasa = (1.20 × IMC) + (0.23 × edad) - (10.8 × sexo) - 5.4
    donde sexo = 1 para hombres, 0 para mujeres
    """
    try:
        # Asumimos edad promedio de 30 años si no está disponible
        edad = 30
        sexo_valor = 1 if sexo == "M" else 0
        
        grasa = (1.20 * imc) + (0.23 * edad) - (10.8 * sexo_valor) - 5.4
        
        # Limitar entre rangos realistas
        if sexo == "M":
            return max(5, min(35, round(grasa, 1)))
        else:
            return max(10, min(45, round(grasa, 1)))
    except:
        return 22 if sexo == "F" else 18


def _calcular_peso_meta(peso_inicial, imc_actual, sexo):
    """
    Calcula un peso meta saludable basado en IMC ideal (21-24)
    """
    if imc_actual >= 18.5 and imc_actual <= 24.9:
        # Ya está en rango saludable
        return peso_inicial
    elif imc_actual > 24.9:
        # Sobrepeso, meta es reducir al límite superior saludable
        return peso_inicial * 0.90  # Reducir 10%
    else:
        # Bajo peso, meta es aumentar
        return peso_inicial * 1.10  # Aumentar 10%


def _calcular_grasa_meta(sexo):
    """
    Retorna el porcentaje de grasa corporal meta según género
    Hombres: 10-20%, Mujeres: 18-28%
    """
    if sexo == "M":
        return 15  # Meta para hombres
    else:
        return 23  # Meta para mujeres


def _obtener_progreso_mensual_real(id_miembro, peso_inicial, peso_meta):
    """
    Obtiene el progreso mensual real basado en los registros de la BD
    """
    try:
        now = datetime.now()
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Obtener registros de los últimos 6 meses
        hace_6_meses = now - timedelta(days=180)
        
        progresos = ProgresoFisico.query.filter(
            ProgresoFisico.id_miembro == id_miembro,
            ProgresoFisico.fecha_registro >= hace_6_meses.date()
        ).order_by(ProgresoFisico.fecha_registro.asc()).all()
        
        if not progresos:
            # No hay datos, retornar array vacío
            return []
        
        # Agrupar por mes y calcular progreso
        progreso_por_mes = {}
        diferencia_total = abs(peso_inicial - peso_meta) if peso_inicial != peso_meta else 1
        
        for progreso in progresos:
            mes_num = progreso.fecha_registro.month - 1
            mes_nombre = meses[mes_num]
            
            peso_actual = float(progreso.peso) if progreso.peso else peso_inicial
            diferencia_actual = abs(peso_inicial - peso_actual)
            porcentaje = min(100, (diferencia_actual / diferencia_total * 100))
            
            # Solo guardar el último registro de cada mes
            progreso_por_mes[mes_nombre] = {
                "mes": mes_nombre,
                "porcentaje": max(0, round(porcentaje))
            }
        
        # Convertir a lista ordenada
        resultado = []
        for i in range(6):
            mes_idx = (now.month - 6 + i) % 12
            mes_nombre = meses[mes_idx]
            
            if mes_nombre in progreso_por_mes:
                resultado.append(progreso_por_mes[mes_nombre])
        
        return resultado
        
    except Exception as e:
        print(f"Error en _obtener_progreso_mensual_real: {e}")
        return []