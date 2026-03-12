"""
ENDPOINT: Regresión Lineal con PySpark MLlib
Colección: progreso_fisico
Objetivo: Predecir el peso futuro de un miembro basándose en su historial
          de registros de progreso.

Features de entrada:
  - dias_desde_inicio : días transcurridos desde el primer registro
  - cintura           : medida de cintura (cm)
  - grasa_corporal    : % grasa corporal

Variable objetivo: peso (kg)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta

spark_regresion_bp = Blueprint("spark_regresion", __name__)


def _get_spark():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'spark'))
    from spark_config import crear_spark_session
    return crear_spark_session()


# ──────────────────────────────────────────────────────────────────────────────
# LÓGICA REGRESIÓN LINEAL
# ──────────────────────────────────────────────────────────────────────────────

def _regresion_global(spark):
    """
    Entrena un modelo de regresión lineal con TODOS los registros de progreso.
    Útil para entender tendencias globales del gym.

    Feature: dias_desde_primer_registro → Target: peso
    """
    from pyspark.sql import functions as F
    from pyspark.sql.window import Window
    from pyspark.ml.regression import LinearRegression
    from pyspark.ml.feature import VectorAssembler
    from pyspark.ml.evaluation import RegressionEvaluator

    df = (
        spark.read.format("mongodb")
        .option("collection", "progreso_fisico")
        .load()
        .select(
            F.col("id_miembro").cast("string").alias("id_miembro"),
            F.col("peso").cast("double"),
            F.col("bmi").cast("double"),
            F.col("cintura").cast("double"),
            F.col("grasa_corporal").cast("double"),
            F.col("fecha_registro")
        )
        .filter(
            F.col("peso").isNotNull() &
            F.col("fecha_registro").isNotNull() &
            (F.col("peso") > 0)
        )
    )

    if df.count() < 10:
        raise ValueError("Se necesitan al menos 10 registros de progreso para entrenar el modelo.")

    # Calcular días desde el primer registro de cada miembro
    w_min = Window.partitionBy("id_miembro")
    df = df.withColumn(
        "fecha_inicio",
        F.min("fecha_registro").over(w_min)
    ).withColumn(
        "dias",
        F.datediff(F.col("fecha_registro"), F.col("fecha_inicio")).cast("double")
    )

    # Reemplazar nulos en features opcionales con medias
    media_cintura = df.agg(F.avg("cintura")).collect()[0][0] or 80.0
    media_grasa = df.agg(F.avg("grasa_corporal")).collect()[0][0] or 22.0

    df = df.fillna({
        "cintura": media_cintura,
        "grasa_corporal": media_grasa,
        "bmi": 25.0
    })

    # Feature vector
    assembler = VectorAssembler(
        inputCols=["dias", "cintura", "grasa_corporal", "bmi"],
        outputCol="features"
    )
    df_ml = assembler.transform(df).select("features", F.col("peso").alias("label"), "dias", "id_miembro")

    # Train/Test split 80/20
    train, test = df_ml.randomSplit([0.8, 0.2], seed=42)

    # Modelo
    lr = LinearRegression(
        featuresCol="features",
        labelCol="label",
        maxIter=50,
        regParam=0.1,          # regularización Ridge
        elasticNetParam=0.0
    )
    model = lr.fit(train)

    # Métricas
    predicciones = model.transform(test)
    evaluator_rmse = RegressionEvaluator(labelCol="label", predictionCol="prediction", metricName="rmse")
    evaluator_r2   = RegressionEvaluator(labelCol="label", predictionCol="prediction", metricName="r2")
    evaluator_mae  = RegressionEvaluator(labelCol="label", predictionCol="prediction", metricName="mae")

    rmse = evaluator_rmse.evaluate(predicciones)
    r2   = evaluator_r2.evaluate(predicciones)
    mae  = evaluator_mae.evaluate(predicciones)

    # Coeficientes
    coeficientes = {
        "dias": round(float(model.coefficients[0]), 6),
        "cintura": round(float(model.coefficients[1]), 6),
        "grasa_corporal": round(float(model.coefficients[2]), 6),
        "bmi": round(float(model.coefficients[3]), 6),
        "intercepto": round(float(model.intercept), 4)
    }

    # Tendencia global: promedio de peso por mes
    tendencia = (
        df
        .withColumn("mes", F.date_format("fecha_registro", "yyyy-MM"))
        .groupBy("mes")
        .agg(
            F.round(F.avg("peso"), 2).alias("peso_promedio"),
            F.count("*").alias("registros")
        )
        .orderBy("mes")
    )

    return (
        model,
        {
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "mae": round(mae, 4),
        },
        coeficientes,
        [row.asDict() for row in tendencia.collect()],
        media_cintura,
        media_grasa
    )


def _predecir_miembro(spark, model, id_miembro: str, dias_futuro: int,
                      media_cintura: float, media_grasa: float):
    """
    Usa el modelo entrenado para predecir el peso de un miembro específico
    en los próximos `dias_futuro` días.
    """
    from pyspark.sql import functions as F
    from pyspark.sql.window import Window
    from pyspark.ml.feature import VectorAssembler

    # Historial del miembro
    df = (
        spark.read.format("mongodb")
        .option("collection", "progreso_fisico")
        .load()
        .filter(F.col("id_miembro").cast("string") == id_miembro)
        .select(
            F.col("peso").cast("double"),
            F.col("bmi").cast("double"),
            F.col("cintura").cast("double"),
            F.col("grasa_corporal").cast("double"),
            F.col("fecha_registro")
        )
        .filter(F.col("peso").isNotNull())
        .orderBy("fecha_registro")
    )

    if df.count() == 0:
        return None, []

    # Usar el último registro para la predicción futura
    ultimo = df.orderBy(F.col("fecha_registro").desc()).limit(1).collect()[0]
    primer_registro = df.agg(F.min("fecha_registro")).collect()[0][0]

    dias_actuales = (datetime.now() - primer_registro).days if primer_registro else 0

    # Historial formateado para respuesta
    historial = [
        {
            "fecha": row["fecha_registro"].strftime("%Y-%m-%d") if hasattr(row["fecha_registro"], "strftime") else str(row["fecha_registro"]),
            "peso": round(float(row["peso"]), 1)
        }
        for row in df.collect()
    ]

    # Generar predicciones futuras (cada 30 días)
    predicciones_futuras = []
    cintura = float(ultimo["cintura"] or media_cintura)
    grasa = float(ultimo["grasa_corporal"] or media_grasa)
    bmi = float(ultimo["bmi"] or 25.0)

    puntos_pred = [30, 60, 90, 120, 150, 180]
    for d in puntos_pred:
        if d <= dias_futuro:
            dias_total = dias_actuales + d

            # Crear DataFrame de un punto para predecir
            pred_data = spark.createDataFrame(
                [(float(dias_total), cintura, grasa, bmi)],
                ["dias", "cintura", "grasa_corporal", "bmi"]
            )
            assembler = VectorAssembler(
                inputCols=["dias", "cintura", "grasa_corporal", "bmi"],
                outputCol="features"
            )
            pred_assembled = assembler.transform(pred_data)
            pred_result = model.transform(pred_assembled)
            peso_pred = pred_result.collect()[0]["prediction"]

            fecha_pred = datetime.now() + timedelta(days=d)
            predicciones_futuras.append({
                "dias_desde_hoy": d,
                "fecha_estimada": fecha_pred.strftime("%Y-%m-%d"),
                "peso_predicho_kg": round(float(peso_pred), 2)
            })

    return historial, predicciones_futuras


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@spark_regresion_bp.route("/api/analytics/regresion", methods=["GET"])
@jwt_required()
def regresion_analytics():
    """
    Entrena regresión lineal y devuelve métricas globales + tendencia del gym.

    Respuesta:
      metricas          : RMSE, R², MAE del modelo
      coeficientes      : peso de cada feature en la predicción
      tendencia_global  : evolución del peso promedio por mes en el gym
      interpretacion    : calidad del modelo
    """
    try:
        spark = _get_spark()
        model, metricas, coeficientes, tendencia, media_cintura, media_grasa = _regresion_global(spark)

        # Guardar el modelo en contexto de la app (simple cache en memoria)
        # En producción usar MLflow o guardar en disco
        spark._jvm.System.setProperty("gym_model_cached", "true")

        r2 = metricas["r2"]
        interpretacion = (
            "Excelente — el modelo explica más del 80% de la varianza del peso"
            if r2 > 0.8 else
            "Bueno — explica más del 60% de la varianza"
            if r2 > 0.6 else
            "Moderado — hay factores no capturados (edad, dieta, etc.)"
            if r2 > 0.4 else
            "Bajo — se recomienda más historial de datos o features adicionales"
        )

        return jsonify({
            "algoritmo": "Regresión Lineal (Ridge)",
            "descripcion": "Predicción de peso corporal basada en días de entrenamiento, cintura, grasa y BMI",
            "features_usadas": ["dias_desde_inicio", "cintura_cm", "grasa_corporal_%", "bmi"],
            "variable_objetivo": "peso_kg",
            "metricas": metricas,
            "interpretacion_r2": interpretacion,
            "coeficientes": coeficientes,
            "tendencia_peso_global": tendencia,
            "ejecutado_en": datetime.now().isoformat()
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@spark_regresion_bp.route("/api/analytics/regresion/predecir/<id_miembro>", methods=["GET"])
@jwt_required()
def predecir_peso_miembro(id_miembro: str):
    """
    Predice el peso futuro de un miembro específico.

    Query params:
      dias (int, default=180): horizonte de predicción en días

    Respuesta:
      historial_peso    : registros históricos del miembro
      predicciones      : peso estimado cada 30 días hasta el horizonte
      peso_actual       : último peso registrado
      tendencia         : "bajando", "subiendo" o "estable"
    """
    try:
        dias_futuro = request.args.get("dias", 180, type=int)
        if not (30 <= dias_futuro <= 365):
            return jsonify({"error": "dias debe estar entre 30 y 365"}), 400

        spark = _get_spark()
        model, metricas, _, _, media_cintura, media_grasa = _regresion_global(spark)

        historial, predicciones = _predecir_miembro(
            spark, model, id_miembro, dias_futuro, media_cintura, media_grasa
        )

        if historial is None:
            return jsonify({"error": "El miembro no tiene registros de progreso"}), 404

        # Determinar tendencia
        tendencia = "estable"
        if len(predicciones) >= 2 and len(historial) >= 1:
            peso_actual = historial[-1]["peso"]
            peso_ultimo_pred = predicciones[-1]["peso_predicho_kg"]
            diff = peso_ultimo_pred - peso_actual
            if diff < -1.5:
                tendencia = "bajando"
            elif diff > 1.5:
                tendencia = "subiendo"

        return jsonify({
            "id_miembro": id_miembro,
            "algoritmo": "Regresión Lineal",
            "horizonte_dias": dias_futuro,
            "peso_actual_kg": historial[-1]["peso"] if historial else None,
            "tendencia": tendencia,
            "historial_peso": historial,
            "predicciones_futuras": predicciones,
            "advertencia": "Predicción basada en tendencia histórica. Factores como dieta y rutina pueden alterar el resultado.",
            "ejecutado_en": datetime.now().isoformat()
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500