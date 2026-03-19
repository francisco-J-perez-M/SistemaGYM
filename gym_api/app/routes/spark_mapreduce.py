from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime

spark_mapreduce_bp = Blueprint("spark_mapreduce", __name__)

_spark_instance = None
def _get_spark():
    global _spark_instance
    if _spark_instance is None:
        import sys, os
        directorio_actual = os.path.dirname(__file__)
        if directorio_actual not in sys.path:
            sys.path.insert(0, directorio_actual)

        from spark_config import crear_spark_session
        _spark_instance = crear_spark_session()

    return _spark_instance


# ──────────────────────────────────────────────────────────────────────────────
# HELPERS MapReduce
# ──────────────────────────────────────────────────────────────────────────────

def _mapreduce_ingresos(spark):
    """
    MapReduce sobre la colección 'pagos'.

    MAP  : (año-mes, método_pago) → monto
    REDUCE: suma de montos por clave
    """
    import sys, os
    directorio_actual = os.path.dirname(__file__)
    if directorio_actual not in sys.path:
        sys.path.insert(0, directorio_actual)

    from spark_config import leer_coleccion          # ← helper centralizado
    from pyspark.sql import functions as F

    df = leer_coleccion(spark, "pagos")

    # MAP: extraer clave (año-mes) y valor (monto)
    df_mapped = df.select(
        F.date_format(F.col("fecha_pago"), "yyyy-MM").alias("periodo"),
        F.col("metodo_pago"),
        F.col("monto").cast("double").alias("monto")
    ).filter(F.col("monto").isNotNull())

    # REDUCE: agrupar y sumar
    resultado = (
        df_mapped
        .groupBy("periodo", "metodo_pago")
        .agg(
            F.sum("monto").alias("total_ingresos"),
            F.count("*").alias("num_pagos"),
            F.avg("monto").alias("promedio_pago")
        )
        .orderBy("periodo", "metodo_pago")
    )

    # Resumen global por periodo
    resumen_periodo = (
        df_mapped
        .groupBy("periodo")
        .agg(
            F.sum("monto").alias("total_periodo"),
            F.count("*").alias("total_transacciones")
        )
        .orderBy("periodo")
    )

    return (
        [row.asDict() for row in resultado.collect()],
        [row.asDict() for row in resumen_periodo.collect()]
    )


def _mapreduce_asistencia(spark):
    """
    MapReduce sobre la colección 'asistencias'.

    MAP  : (año-mes, dia_semana) → 1
    REDUCE: conteo de visitas por mes y por día de la semana
    """
    import sys, os
    directorio_actual = os.path.dirname(__file__)
    if directorio_actual not in sys.path:
        sys.path.insert(0, directorio_actual)

    from spark_config import leer_coleccion          # ← helper centralizado
    from pyspark.sql import functions as F

    df = leer_coleccion(spark, "asistencias")

    df_mapped = df.select(
        F.col("fecha"),
        F.date_format(F.col("fecha"), "yyyy-MM").alias("periodo"),
        F.date_format(F.col("fecha"), "EEEE").alias("dia_semana")
    ).filter(F.col("fecha").isNotNull())

    # REDUCE: visitas por mes
    por_mes = (
        df_mapped
        .groupBy("periodo")
        .agg(F.count("*").alias("total_visitas"))
        .orderBy("periodo")
    )

    # REDUCE: visitas por día de la semana
    por_dia = (
        df_mapped
        .groupBy("dia_semana")
        .agg(F.count("*").alias("total_visitas"))
        .orderBy(F.count("*").desc())
    )

    return (
        [row.asDict() for row in por_mes.collect()],
        [row.asDict() for row in por_dia.collect()]
    )


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────

@spark_mapreduce_bp.route("/api/analytics/mapreduce", methods=["GET"])
@jwt_required()
def mapreduce_analytics():
    """
    Ejecuta MapReduce con Spark sobre pagos y asistencias.

    Respuesta:
      ingresos_por_periodo     : total y conteo por (mes, método_pago)
      resumen_ingresos         : total global por mes
      asistencia_por_mes       : visitas totales por mes
      asistencia_por_dia       : visitas por día de la semana (ranking)
      ejecutado_en             : timestamp de ejecución
    """
    try:
        spark = _get_spark()

        ingresos_detalle, resumen_ingresos = _mapreduce_ingresos(spark)
        asistencia_mes,   asistencia_dia   = _mapreduce_asistencia(spark)

        # Convertir floats de Decimal128 si vienen de Mongo
        def _clean(lst):
            cleaned = []
            for row in lst:
                clean_row = {}
                for k, v in row.items():
                    if hasattr(v, 'to_decimal'):
                        clean_row[k] = float(v.to_decimal())
                    elif isinstance(v, float):
                        clean_row[k] = round(v, 2)
                    else:
                        clean_row[k] = v
                cleaned.append(clean_row)
            return cleaned

        return jsonify({
            "algoritmo":   "MapReduce",
            "descripcion": "Agregación distribuida de ingresos y asistencia por periodo",
            "ingresos_por_periodo":      _clean(ingresos_detalle),
            "resumen_ingresos":          _clean(resumen_ingresos),
            "asistencia_por_mes":        _clean(asistencia_mes),
            "asistencia_por_dia_semana": _clean(asistencia_dia),
            "ejecutado_en":              datetime.now().isoformat()
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500