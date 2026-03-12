"""
ENDPOINT: K-Means Clustering con PySpark MLlib
Colecciones: miembros + progreso_fisico
Objetivo: Segmentar miembros en grupos según sus métricas corporales
          (peso, IMC, grasa, músculo) para personalizar planes de entrenamiento.

Clusters resultantes:
  0 → Bajo rendimiento / alto peso  (alta prioridad atención)
  1 → Perfil equilibrado            (mantenimiento)
  2 → Alto rendimiento / baja grasa (optimización)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime

spark_kmeans_bp = Blueprint("spark_kmeans", __name__)

# Etiquetas descriptivas por cluster (se asignan dinámicamente según centroide)
CLUSTER_LABELS = {
    0: "Principiante / Alta Prioridad",
    1: "Intermedio / Mantenimiento",
    2: "Avanzado / Optimización"
}


def _get_spark():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'spark'))
    from spark_config import crear_spark_session
    return crear_spark_session()


# ──────────────────────────────────────────────────────────────────────────────
# LÓGICA K-MEANS
# ──────────────────────────────────────────────────────────────────────────────

def _ejecutar_kmeans(spark, k: int = 3, max_iter: int = 20, seed: int = 42):
    """
    1. Lee miembros y su último progreso físico.
    2. Construye feature vector: [peso, imc, grasa_corporal, masa_muscular].
    3. Entrena KMeans con k clusters.
    4. Devuelve: asignaciones por miembro, centroides, silhouette score.
    """
    from pyspark.sql import functions as F
    from pyspark.ml.clustering import KMeans
    from pyspark.ml.feature import VectorAssembler, StandardScaler
    from pyspark.ml.evaluation import ClusteringEvaluator

    # ── Leer colecciones ──────────────────────────────────────────────────────
    df_miembros = (
        spark.read.format("mongodb")
        .option("collection", "miembros")
        .load()
        .select(
            F.col("_id").alias("id_miembro"),
            F.col("peso_inicial").cast("double"),
            F.col("estatura").cast("double"),
            F.col("sexo")
        )
        .filter(
            F.col("peso_inicial").isNotNull() &
            F.col("estatura").isNotNull() &
            (F.col("estatura") > 0)
        )
    )

    # Último progreso por miembro (ventana para tomar el más reciente)
    from pyspark.sql.window import Window
    w = Window.partitionBy("id_miembro_prog").orderBy(F.col("fecha_registro").desc())

    df_progreso = (
        spark.read.format("mongodb")
        .option("collection", "progreso_fisico")
        .load()
        .select(
            F.col("id_miembro").alias("id_miembro_prog"),
            F.col("peso").cast("double"),
            F.col("bmi").cast("double"),
            F.col("grasa_corporal").cast("double"),
            F.col("masa_muscular").cast("double"),
            F.col("fecha_registro")
        )
        .withColumn("rn", F.row_number().over(w))
        .filter(F.col("rn") == 1)
        .drop("rn", "fecha_registro")
    )

    # ── Join: miembros + último progreso ─────────────────────────────────────
    df = df_miembros.join(
        df_progreso,
        df_miembros["id_miembro"] == df_progreso["id_miembro_prog"],
        "left"
    )

    # Calcular IMC desde peso/estatura si no existe en progreso
    df = df.withColumn(
        "imc_calculado",
        F.when(
            F.col("bmi").isNotNull(), F.col("bmi")
        ).otherwise(
            F.col("peso_inicial") / (F.col("estatura") * F.col("estatura"))
        )
    ).withColumn(
        "peso_final",
        F.coalesce(F.col("peso"), F.col("peso_inicial"))
    ).withColumn(
        "grasa_final",
        F.coalesce(F.col("grasa_corporal"), F.lit(20.0))   # valor por defecto
    ).withColumn(
        "musculo_final",
        F.coalesce(F.col("masa_muscular"), F.lit(30.0))
    )

    df_features = df.select(
        F.col("id_miembro"),
        F.col("peso_final").alias("peso"),
        F.col("imc_calculado").alias("imc"),
        F.col("grasa_final").alias("grasa"),
        F.col("musculo_final").alias("musculo"),
        F.col("sexo")
    ).filter(
        F.col("peso").isNotNull() &
        F.col("imc").isNotNull()
    )

    if df_features.count() < k:
        raise ValueError(f"Datos insuficientes: se necesitan al menos {k} miembros con datos.")

    # ── Feature Engineering ───────────────────────────────────────────────────
    assembler = VectorAssembler(
        inputCols=["peso", "imc", "grasa", "musculo"],
        outputCol="features_raw"
    )
    df_assembled = assembler.transform(df_features)

    # Normalizar para que ninguna variable domine por escala
    scaler = StandardScaler(
        inputCol="features_raw",
        outputCol="features",
        withStd=True,
        withMean=True
    )
    scaler_model = scaler.fit(df_assembled)
    df_scaled = scaler_model.transform(df_assembled)

    # ── Entrenamiento KMeans ──────────────────────────────────────────────────
    kmeans = KMeans(
        featuresCol="features",
        predictionCol="cluster",
        k=k,
        maxIter=max_iter,
        seed=seed
    )
    model = kmeans.fit(df_scaled)
    df_result = model.transform(df_scaled)

    # ── Evaluación: Silhouette Score ──────────────────────────────────────────
    evaluator = ClusteringEvaluator(
        featuresCol="features",
        predictionCol="cluster",
        metricName="silhouette"
    )
    silhouette = evaluator.evaluate(df_result)

    # ── Centroides ────────────────────────────────────────────────────────────
    centroides_raw = model.clusterCenters()
    # Los centroides están en espacio normalizado; los reportamos tal cual
    centroides = [
        {
            "cluster": i,
            "peso_norm": round(float(c[0]), 4),
            "imc_norm": round(float(c[1]), 4),
            "grasa_norm": round(float(c[2]), 4),
            "musculo_norm": round(float(c[3]), 4),
        }
        for i, c in enumerate(centroides_raw)
    ]

    # ── Resumen por cluster ───────────────────────────────────────────────────
    resumen_clusters = (
        df_result
        .groupBy("cluster")
        .agg(
            F.count("*").alias("num_miembros"),
            F.round(F.avg("peso"), 2).alias("peso_promedio"),
            F.round(F.avg("imc"), 2).alias("imc_promedio"),
            F.round(F.avg("grasa"), 2).alias("grasa_promedio"),
            F.round(F.avg("musculo"), 2).alias("musculo_promedio")
        )
        .orderBy("cluster")
    )

    # ── Asignaciones individuales ─────────────────────────────────────────────
    asignaciones = (
        df_result
        .select(
            F.col("id_miembro").cast("string").alias("id_miembro"),
            "cluster", "sexo",
            F.round("peso", 1).alias("peso"),
            F.round("imc", 2).alias("imc"),
            F.round("grasa", 1).alias("grasa"),
            F.round("musculo", 1).alias("musculo")
        )
        .orderBy("cluster")
    )

    return (
        [row.asDict() for row in resumen_clusters.collect()],
        [row.asDict() for row in asignaciones.collect()],
        centroides,
        round(silhouette, 4)
    )


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────

@spark_kmeans_bp.route("/api/analytics/kmeans", methods=["GET"])
@jwt_required()
def kmeans_analytics():
    """
    Segmentación de miembros con K-Means.

    Query params:
      k        (int, default=3) : número de clusters
      max_iter (int, default=20): iteraciones máximas

    Respuesta:
      resumen_clusters  : métricas promedio por cluster
      asignaciones      : cluster de cada miembro
      centroides        : coordenadas de cada centroide (espacio normalizado)
      silhouette_score  : calidad de la segmentación (-1 a 1, mayor = mejor)
      recomendaciones   : descripción y acción sugerida por cluster
    """
    try:
        k = request.args.get("k", 3, type=int)
        max_iter = request.args.get("max_iter", 20, type=int)

        if not (2 <= k <= 8):
            return jsonify({"error": "k debe estar entre 2 y 8"}), 400

        spark = _get_spark()

        resumen, asignaciones, centroides, silhouette = _ejecutar_kmeans(
            spark, k=k, max_iter=max_iter
        )

        # Generar recomendaciones dinámicas por cluster
        recomendaciones = []
        for c in resumen:
            cl = c["cluster"]
            imc = c.get("imc_promedio", 0)
            grasa = c.get("grasa_promedio", 0)

            if imc > 27 or grasa > 28:
                perfil = "Alto riesgo metabólico"
                accion = "Programa de reducción de grasa + cardio moderado 4x/semana"
            elif imc < 22 and grasa < 18:
                perfil = "Atlético / Alto rendimiento"
                accion = "Entrenamiento de fuerza progresivo + dieta hipercalórica"
            else:
                perfil = "Equilibrado / Mantenimiento"
                accion = "Entrenamiento mixto + dieta flexible balanceada"

            recomendaciones.append({
                "cluster": cl,
                "perfil": perfil,
                "accion_sugerida": accion,
                "num_miembros": c["num_miembros"]
            })

        return jsonify({
            "algoritmo": "K-Means Clustering",
            "descripcion": "Segmentación de miembros por métricas corporales (peso, IMC, grasa, músculo)",
            "parametros": {"k": k, "max_iter": max_iter},
            "silhouette_score": silhouette,
            "interpretacion_silhouette": (
                "Excelente" if silhouette > 0.7 else
                "Buena" if silhouette > 0.5 else
                "Aceptable" if silhouette > 0.25 else
                "Débil"
            ),
            "resumen_clusters": resumen,
            "centroides": centroides,
            "recomendaciones": recomendaciones,
            "asignaciones": asignaciones,
            "ejecutado_en": datetime.now().isoformat()
        }), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500