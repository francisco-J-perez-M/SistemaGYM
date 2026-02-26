import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from faker import Faker
import random
from datetime import datetime, timedelta

load_dotenv()

# ──────────────────────────────────────────────
# CONEXIÓN
# ──────────────────────────────────────────────
def get_db():
    user     = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PASSWORD")
    cluster  = os.getenv("MONGO_CLUSTER")
    DB_NAME  = os.getenv("MONGO_DB")

    missing = [k for k, v in {
        "MONGO_USER": user, "MONGO_PASSWORD": password,
        "MONGO_CLUSTER": cluster, "MONGO_DB": DB_NAME
    }.items() if not v]

    if missing:
        raise EnvironmentError(
            f"❌ Variables de entorno faltantes: {', '.join(missing)}"
        )

    uri = f"mongodb+srv://{user}:{password}@{cluster}/{DB_NAME}?retryWrites=true&w=majority"
    client = MongoClient(uri)
    client.admin.command("ping")
    print(f"   🔗 Conectado → {cluster} / {DB_NAME}")
    return client[DB_NAME]

fake = Faker("es_MX")

MESES_ACTIVIDAD = 6

DEFAULT_PASSWORD = (
    "scrypt:32768:8:1$U1umhxfH8LDLojFb$"
    "7c6b302a3cdc30296572691480bfcad86209846fe"
    "6896a4f69c0f22caf58e23a85d8396fdce945a45f"
    "ad84d8b27682c9e9f6919a4d7481bd912aa2d001470309"
)

# ══════════════════════════════════════════════
# LIMPIAR DATOS DE PRUEBA (no toca catálogos)
# ══════════════════════════════════════════════
COLECCIONES_DATOS = [
    "usuarios", "miembros", "asistencias", "pagos", "progreso_fisico",
    "rutinas", "rutina_dias", "rutina_ejercicios",
    "miembro_membresia", "sesiones", "ventas", "detalle_venta",
    "correos_enviados", "correo_miembro",
    "planes_alimenticios", "plan_recetas",
    "perfil_entrenador", "certificaciones_entrenador",
    "logros_entrenador", "evaluaciones_entrenador", "miembro_rutina",
]

def limpiar_datos(db):
    print("🧹 Limpiando datos de prueba anteriores...")
    for col in COLECCIONES_DATOS:
        db[col].delete_many({})
    print("   ✅ Limpieza completada")

# ══════════════════════════════════════════════
# OBTENER IDs DE CATÁLOGOS
# ══════════════════════════════════════════════
def obtener_catalogo(db):
    roles       = {r["nombre"]: r["_id"] for r in db.roles.find()}
    membresias  = list(db.membresias.find())
    productos   = list(db.productos.find())
    tipos_dieta = {t["nombre"]: t["_id"] for t in db.tipos_dieta.find()}
    recetas     = list(db.recetas.find())

    if not roles or not membresias or not tipos_dieta or not recetas:
        raise RuntimeError(
            "❌ Catálogos vacíos. Ejecuta primero: python gym_mongo_setup.py"
        )

    return roles, membresias, productos, tipos_dieta, recetas

# ══════════════════════════════════════════════
# 1. USUARIOS (roles: admin, entrenador, recepcionista, miembro)
# ══════════════════════════════════════════════
def crear_admin(db, id_role):
    print("👨‍💼 Creando administrador...")
    doc = {
        "id_role":        id_role,
        "nombre":         "Carlos Admin",
        "email":          "admin@gym.com",
        "password":       DEFAULT_PASSWORD,
        "activo":         True,
        "fecha_creacion": datetime.now() - timedelta(days=365),
    }
    db.usuarios.insert_one(doc)
    print("   ✅ admin@gym.com")
    return doc["_id"]

def crear_entrenador(db, id_role):
    print("👨‍🏫 Creando entrenador...")
    doc = {
        "id_role":        id_role,
        "nombre":         "Miguel Entrenador",
        "email":          "entrenador@gym.com",
        "password":       DEFAULT_PASSWORD,
        "activo":         True,
        "fecha_creacion": datetime.now() - timedelta(days=400),
    }
    db.usuarios.insert_one(doc)
    id_entrenador = doc["_id"]

    db.perfil_entrenador.insert_one({
        "id_entrenador":      id_entrenador,
        "telefono":           "555-0001",
        "direccion":          None,
        "especializacion":    "Hipertrofia y pérdida de grasa",
        "biografia":          "Entrenador certificado con 8 años de experiencia.",
        "redes_sociales":     '{"instagram":"@miguel_trainer","facebook":"MiguelTrainer"}',
        "fecha_creacion":     datetime.now() - timedelta(days=400),
        "fecha_actualizacion":datetime.now(),
    })

    db.certificaciones_entrenador.insert_many([
        {"id_entrenador": id_entrenador, "nombre": "NSCA-CPT", "institucion": "NSCA",  "fecha_obtencion": datetime(2018, 3, 15), "fecha_expiracion": datetime(2026, 3, 15), "archivo_url": None, "fecha_creacion": datetime.now()},
        {"id_entrenador": id_entrenador, "nombre": "Nutrición Deportiva", "institucion": "ISSN",  "fecha_obtencion": datetime(2020, 7, 10), "fecha_expiracion": None, "archivo_url": None, "fecha_creacion": datetime.now()},
    ])

    db.logros_entrenador.insert_many([
        {"id_entrenador": id_entrenador, "titulo": "Entrenador del Año 2023", "descripcion": "Premio interno del gimnasio.", "fecha": datetime(2023, 12, 1), "tipo": "Premio", "fecha_creacion": datetime.now()},
        {"id_entrenador": id_entrenador, "titulo": "50 clientes transformados", "descripcion": "Meta alcanzada en 2024.", "fecha": datetime(2024, 6, 1), "tipo": "Logro", "fecha_creacion": datetime.now()},
    ])

    print("   ✅ entrenador@gym.com (perfil + 2 cert + 2 logros)")
    return id_entrenador

def crear_recepcionista(db, id_role):
    print("👩‍💼 Creando recepcionista...")
    doc = {
        "id_role":        id_role,
        "nombre":         "Ana Recepcionista",
        "email":          "recepcion@gym.com",
        "password":       DEFAULT_PASSWORD,
        "activo":         True,
        "fecha_creacion": datetime.now() - timedelta(days=400),
    }
    db.usuarios.insert_one(doc)
    print("   ✅ recepcion@gym.com")
    return doc["_id"]

# ══════════════════════════════════════════════
# 2. MIEMBROS MÚLTIPLES REALISTAS
# ══════════════════════════════════════════════
OBJETIVOS_RUTINA = {
    "Hipercalórica":   "Aumento de masa muscular",
    "Déficit Calórico":"Pérdida de grasa y tonificación",
    "Vegana":          "Mantenimiento y fuerza",
    "Mediterránea":    "Salud general y resistencia",
    "Keto":            "Definición muscular",
    "Paleo":           "Fuerza funcional",
    "Flexible":        "Mejora general fitness",
}

def crear_miembros(db, id_role_miembro, id_entrenador, membresias, tipos_dieta, recetas, num_usuarios=500):
    print(f"\n👥 Creando {num_usuarios} miembros con datos realistas...")
    now        = datetime.now()
    fecha_base = now - timedelta(days=MESES_ACTIVIDAD * 30)
    memb_premium = next(m for m in membresias if m["nombre"] == "Premium Mensual")

    ids_miembros = []
    
    # Lista de tipos de dieta válidos para repartir aleatoriamente
    tipos_dieta_keys = list(OBJETIVOS_RUTINA.keys())

    for i in range(1, num_usuarios + 1):
        # 1. Generar Sexo y Nombre acorde
        sexo = random.choice(["M", "F"])
        nombre = fake.name_male() if sexo == "M" else fake.name_female()
        
        # Para facilitar pruebas, los primeros 5 correos serán predecibles
        if i <= 5:
            email = f"miembro{i}@gym.com"
        else:
            email = fake.unique.email()

        # 2. Generar Estatura y Peso realistas según el sexo
        if sexo == "M":
            estatura = round(random.uniform(1.65, 1.95), 2)
            peso = round(random.uniform(65.0, 115.0), 1)
        else:
            estatura = round(random.uniform(1.50, 1.80), 2)
            peso = round(random.uniform(50.0, 90.0), 1)

        # 3. Asignar Dieta y calcular objetivos coherentes
        tipo_dieta_nombre = random.choice(tipos_dieta_keys)
        objetivo = OBJETIVOS_RUTINA.get(tipo_dieta_nombre, "Mejora general")

        if tipo_dieta_nombre == "Hipercalórica":
            peso_obj = round(peso + random.uniform(3.0, 8.0), 1)
        elif tipo_dieta_nombre == "Déficit Calórico" or tipo_dieta_nombre == "Keto":
            peso_obj = round(peso - random.uniform(4.0, 15.0), 1)
        else:
            peso_obj = peso # Mantenimiento

        grasa_obj = round(random.uniform(10.0, 18.0) if sexo == "M" else random.uniform(16.0, 24.0), 1)
        musculo_obj = round(random.uniform(40.0, 50.0) if sexo == "M" else random.uniform(30.0, 40.0), 1)

        fecha_registro = fecha_base + timedelta(days=random.randint(0, 15))

        # ── usuarios ───────────────────────────────────────────────────────
        u_doc = {
            "id_role":        id_role_miembro,
            "nombre":         nombre,
            "email":          email,
            "password":       DEFAULT_PASSWORD,
            "activo":         True,
            "fecha_creacion": fecha_registro,
        }
        db.usuarios.insert_one(u_doc)
        id_usuario = u_doc["_id"]

        # ── miembros ───────────────────────────────────────────────────────
        m_doc = {
            "id_usuario":              id_usuario,
            "id_entrenador":           id_entrenador,
            "telefono":                fake.phone_number()[:20],
            "fecha_nacimiento":        datetime(
                *[int(x) for x in str(
                    fake.date_of_birth(minimum_age=16, maximum_age=65)
                ).split("-")]
            ),
            "sexo":                    sexo,
            "peso_inicial":            peso,
            "estatura":                estatura,
            "fecha_registro":          fecha_registro,
            "estado":                  "Activo",
            "foto_perfil":             "male.jpg" if sexo == "M" else "female.jpg",
            "objetivo":                objetivo,
            "fecha_asignacion":        fecha_registro,
            "ultima_sesion":           None,
            "peso_objetivo":           peso_obj,
            "grasa_objetivo":          grasa_obj,
            "masa_muscular_objetivo":  musculo_obj,
        }
        db.miembros.insert_one(m_doc)
        id_miembro = m_doc["_id"]

        # ── miembro_membresia ──────────────────────────────────────────────
        db.miembro_membresia.insert_one({
            "id_miembro":   id_miembro,
            "id_membresia": memb_premium["_id"],
            "fecha_inicio": fecha_registro,
            "fecha_fin":    now + timedelta(days=90),
            "estado":       "Activa",
        })

        _insertar_pagos(db, id_miembro, memb_premium["precio"], memb_premium["nombre"], fecha_registro, now)
        _insertar_asistencias(db, id_miembro, fecha_registro, now)
        _insertar_progreso(db, id_miembro, sexo, peso, estatura, fecha_registro, now)
        id_rutina = _insertar_rutina(db, id_miembro, id_entrenador, tipo_dieta_nombre, fecha_registro)

        db.miembro_rutina.insert_one({
            "id_miembro":       id_miembro,
            "id_rutina":        id_rutina,
            "fecha_asignacion": fecha_registro,
            "activa":           True,
            "fecha_fin":        None,
        })

        _insertar_plan(db, id_miembro, tipo_dieta_nombre, tipos_dieta, recetas, peso, fecha_registro)

        if random.random() > 0.5: # 50% de probabilidad de dejar evaluación
            db.evaluaciones_entrenador.insert_one({
                "id_entrenador": id_entrenador,
                "id_miembro":    id_miembro,
                "calificacion":  random.randint(3, 5),
                "comentario":    random.choice([
                    "Excelente entrenador.", "Muy profesional.", "Buenas rutinas, pero a veces impuntual.",
                    "Súper recomendado!", "Me ha ayudado mucho con mi técnica."
                ]),
                "fecha":         now - timedelta(days=random.randint(5, 60)),
                "fecha_creacion":datetime.now(),
            })

        ids_miembros.append(id_miembro)
        
        # Imprimir progreso en la consola para no saturarla
        if i % 50 == 0:
            print(f"   ⏳ Creados {i}/{num_usuarios} miembros...")

    print("   ✅ Creación de miembros completada.")
    return ids_miembros

# ══════════════════════════════════════════════
# PAGOS, ASISTENCIAS Y PROGRESO FÍSICO
# ══════════════════════════════════════════════
def _insertar_pagos(db, id_miembro, precio, nombre_memb, fecha_inicio, fecha_fin):
    meses = ((fecha_fin.year - fecha_inicio.year) * 12 + (fecha_fin.month - fecha_inicio.month))
    metodos = ["Efectivo", "Tarjeta", "Transferencia"]
    metodo_fijo = random.choice(metodos)
    pagos = []

    for mes in range(meses + 1):
        fp = fecha_inicio + timedelta(days=mes * 30 + random.randint(-3, 3))
        if fp > fecha_fin: break
        metodo = metodo_fijo if random.random() > 0.3 else random.choice(metodos)
        pagos.append({
            "id_miembro":    id_miembro,
            "id_entrenador": None,
            "monto":         float(precio),
            "metodo_pago":   metodo,
            "concepto":      f"Pago {nombre_memb} - Mes {mes + 1}",
            "fecha_pago":    fp,
        })

    if pagos: db.pagos.insert_many(pagos)

def _insertar_asistencias(db, id_miembro, fecha_inicio, fecha_fin):
    asistencias = []
    dias = (fecha_fin - fecha_inicio).days

    # Probabilidad de asistencia adaptada para que no sature la DB
    probabilidad_asistencia = random.uniform(0.1, 0.6) 

    for d in range(dias):
        if random.random() < probabilidad_asistencia:
            fecha_dia = fecha_inicio + timedelta(days=d)
            hora      = random.randint(6, 21)
            minuto    = random.choice([0, 15, 30, 45])
            duracion  = random.randint(45, 120)
            entrada   = datetime(fecha_dia.year, fecha_dia.month, fecha_dia.day, hora, minuto)
            salida    = entrada + timedelta(minutes=duracion)
            asistencias.append({
                "id_miembro":   id_miembro,
                "fecha":        entrada,
                "hora_entrada": entrada.strftime("%H:%M:%S"),
                "hora_salida":  salida.strftime("%H:%M:%S"),
            })

    if asistencias:
        # Insertar en bloques si son muchas
        for i in range(0, len(asistencias), 1000):
            db.asistencias.insert_many(asistencias[i:i+1000])

def _insertar_progreso(db, id_miembro, sexo, peso_inicial, estatura, fecha_inicio, fecha_fin):
    meses = ((fecha_fin.year - fecha_inicio.year) * 12 + (fecha_fin.month - fecha_inicio.month))
    peso_actual = peso_inicial
    docs = []

    for mes in range(meses + 1):
        if mes > 0:
            peso_actual += random.uniform(-1.5, 1.0)

        bmi = round(peso_actual / (estatura ** 2), 2)
        fecha_med = fecha_inicio + timedelta(days=mes * 30)

        if sexo == "M":
            grasa   = round(random.uniform(12, 20), 2)
            musculo = round(random.uniform(38, 46), 2)
            cintura = round(random.uniform(75, 90), 2)
            pecho   = round(random.uniform(95, 110), 2)
            brazo   = round(random.uniform(32, 38), 2)
            pierna  = round(random.uniform(55, 65), 2)
        else:
            grasa   = round(random.uniform(18, 28), 2)
            musculo = round(random.uniform(30, 38), 2)
            cintura = round(random.uniform(65, 80), 2)
            pecho   = round(random.uniform(85, 100), 2)
            brazo   = round(random.uniform(26, 32), 2)
            pierna  = round(random.uniform(50, 60), 2)

        docs.append({
            "id_miembro":       id_miembro,
            "peso":             round(peso_actual, 2),
            "bmi":              bmi,
            "grasa_corporal":   grasa,
            "masa_muscular":    musculo,
            "agua_corporal":    round(100 - grasa - musculo, 2),
            "masa_osea":        round(random.uniform(2.5, 3.5), 2),
            "cintura":          cintura,
            "cadera":           round(cintura * 1.2, 2),
            "pecho":            pecho,
            "brazo_derecho":    brazo,
            "brazo_izquierdo":  brazo,
            "muslo_derecho":    pierna,
            "muslo_izquierdo":  pierna,
            "pantorrilla":      round(pierna * 0.65, 2),
            "fecha_registro":   fecha_med,
            "notas":            None,
        })

    if docs: db.progreso_fisico.insert_many(docs)

# ══════════════════════════════════════════════
# RUTINAS + DIETAS
# ══════════════════════════════════════════════
DIAS_POR_TIPO = {
    "Hipercalórica": [
        ("Lunes",    "Pecho y Tríceps",    [("Press Banca","4","8-10","80kg"),("Press Inclinado","4","10-12","60kg"),("Aperturas","3","12-15","15kg"),("Press Francés","3","10-12","30kg"),("Fondos","3","10-12","Peso corporal")]),
        ("Martes",   "Espalda y Bíceps",   [("Dominadas","4","8-10","Peso corporal"),("Remo con Barra","4","8-10","70kg"),("Jalón al Pecho","3","10-12","60kg"),("Curl con Barra","3","10-12","30kg"),("Curl Martillo","3","12-15","15kg")]),
        ("Miércoles","Pierna",             [("Sentadilla","4","8-10","100kg"),("Peso Muerto","4","6-8","120kg"),("Prensa","3","12-15","150kg"),("Curl Femoral","3","12-15","40kg"),("Pantorrilla","4","15-20","60kg")]),
        ("Jueves",   "Hombro y Trapecio",  [("Press Militar","4","8-10","50kg"),("Elevaciones Laterales","4","12-15","12kg"),("Elevaciones Frontales","3","12-15","12kg"),("Remo al Mentón","3","12-15","30kg"),("Encogimientos","4","12-15","40kg")]),
        ("Viernes",  "Fullbody",           [("Sentadilla Frontal","3","10-12","60kg"),("Press Banca Inclinado","3","10-12","60kg"),("Remo con Mancuerna","3","10-12","30kg"),("Fondos","3","10-12","Peso corporal"),("Plancha","3","1 min","Peso corporal")]),
    ],
    "Déficit Calórico": [
        ("Lunes",   "Tren Superior 1",     [("Press Banca","3","12-15","50kg"),("Remo con Barra","3","12-15","50kg"),("Press Militar","3","12-15","35kg"),("Curl con Barra","3","15-20","20kg"),("Cardio HIIT","1","20 min","-")]),
        ("Martes",  "Tren Inferior",       [("Sentadilla","4","15-20","60kg"),("Zancadas","3","15-20","20kg"),("Peso Muerto Rumano","3","12-15","50kg"),("Curl Femoral","3","15-20","30kg"),("Cardio Moderado","1","30 min","-")]),
        ("Jueves",  "Tren Superior 2",     [("Dominadas Asistidas","3","10-12","Asistencia"),("Press Inclinado","3","12-15","40kg"),("Aperturas","3","15-20","10kg"),("Jalón Polea","3","12-15","40kg"),("Cardio HIIT","1","20 min","-")]),
        ("Viernes", "Circuito Funcional",  [("Burpees","3","15","Peso corporal"),("Kettlebell Swings","3","20","16kg"),("Mountain Climbers","3","30","Peso corporal"),("Jump Squats","3","15","Peso corporal"),("Cardio Moderado","1","20 min","-")]),
    ],
    "_default": [
        ("Lunes",    "Pecho y Tríceps",    [("Press Banca","4","10-12","60kg"),("Press Inclinado","3","10-12","50kg"),("Fondos","3","10-12","Peso corporal"),("Press Francés","3","12-15","25kg")]),
        ("Miércoles","Espalda y Bíceps",   [("Dominadas","4","8-10","Peso corporal"),("Remo con Barra","4","10-12","60kg"),("Curl con Barra","3","10-12","25kg"),("Curl Martillo","3","12-15","12kg")]),
        ("Viernes",  "Pierna",             [("Sentadilla","4","10-12","80kg"),("Peso Muerto","4","8-10","100kg"),("Prensa","3","12-15","120kg"),("Curl Femoral","3","12-15","35kg")]),
        ("Sábado",   "Hombro y Core",      [("Press Militar","4","10-12","40kg"),("Elevaciones Laterales","3","12-15","10kg"),("Remo al Mentón","3","12-15","25kg"),("Plancha","3","1 min","Peso corporal")]),
    ],
}

def _insertar_rutina(db, id_miembro, id_entrenador, tipo_dieta, fecha_registro):
    now = datetime.now()
    rutina_doc = {
        "id_miembro":         id_miembro,
        "id_entrenador":      id_entrenador,
        "nombre":             f"Rutina {tipo_dieta.split()[0]}",
        "objetivo":           OBJETIVOS_RUTINA.get(tipo_dieta, "Mejora general"),
        "activa":             True,
        "fecha_creacion":     fecha_registro + timedelta(days=2),
        "fecha_actualizacion":now,
        "categoria":          None,
        "dificultad":         "Intermedio",
        "duracion_minutos":   90 if tipo_dieta == "Hipercalórica" else 60,
        "descripcion":        None,
    }
    db.rutinas.insert_one(rutina_doc)
    id_rutina = rutina_doc["_id"]

    dias = DIAS_POR_TIPO.get(tipo_dieta, DIAS_POR_TIPO["_default"])
    for orden_dia, (dia, grupo, ejercicios) in enumerate(dias, 1):
        dia_doc = {
            "id_rutina":      id_rutina,
            "dia_semana":     dia,
            "grupo_muscular": grupo,
            "orden":          orden_dia,
        }
        db.rutina_dias.insert_one(dia_doc)
        id_rutina_dia = dia_doc["_id"]

        ej_docs = [
            {
                "id_rutina_dia":    id_rutina_dia,
                "nombre_ejercicio": ej[0],
                "series":           ej[1],
                "repeticiones":     ej[2],
                "peso":             ej[3],
                "notas":            None,
                "orden":            ej_orden,
            }
            for ej_orden, ej in enumerate(ejercicios, 1)
        ]
        db.rutina_ejercicios.insert_many(ej_docs)

    return id_rutina

def _insertar_plan(db, id_miembro, tipo_dieta_nombre, tipos_dieta, recetas, peso, fecha_registro):
    id_tipo_dieta = tipos_dieta.get(tipo_dieta_nombre)
    if not id_tipo_dieta: return

    if tipo_dieta_nombre == "Hipercalórica":
        cal = int(peso * 45); prot = round(peso * 2.2, 2); carb = round(peso * 5.5, 2); gras = round(peso * 1.0, 2)
        objetivo = "Aumento de masa muscular con superávit calórico controlado"
    elif tipo_dieta_nombre == "Déficit Calórico" or tipo_dieta_nombre == "Keto":
        cal = int(peso * 25); prot = round(peso * 2.0, 2); carb = round(peso * 2.0, 2); gras = round(peso * 0.8, 2)
        objetivo = "Pérdida de grasa manteniendo masa muscular"
    else:
        cal = int(peso * 32); prot = round(peso * 1.8, 2); carb = round(peso * 3.5, 2); gras = round(peso * 0.9, 2)
        objetivo = "Mantenimiento y mejora de composición corporal"

    plan_doc = {
        "id_miembro":            id_miembro,
        "id_tipo_dieta":         id_tipo_dieta,
        "nombre_plan":           f"Plan {tipo_dieta_nombre}",
        "objetivo":              objetivo,
        "calorias_diarias":      cal,
        "proteinas_diarias":     prot,
        "carbohidratos_diarios": carb,
        "grasas_diarias":        gras,
        "notas":                 None,
        "activo":                True,
        "fecha_creacion":        fecha_registro + timedelta(days=2),
        "fecha_actualizacion":   datetime.now(),
    }
    db.planes_alimenticios.insert_one(plan_doc)
    id_plan = plan_doc["_id"]

    recetas_tipo = [r for r in recetas if r["id_tipo_dieta"] == id_tipo_dieta]
    if not recetas_tipo: return
    
    por_comida = {}
    for r in recetas_tipo:
        por_comida.setdefault(r["tipo_comida"], []).append(r["_id"])

    dias_semana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
    tipos_comida = ["Desayuno","Media Mañana","Almuerzo","Merienda","Cena"]
    pr_docs = []

    for dia in dias_semana:
        for orden, tc in enumerate(tipos_comida, 1):
            if tc in por_comida:
                pr_docs.append({
                    "id_plan":    id_plan,
                    "id_receta":  random.choice(por_comida[tc]),
                    "dia_semana": dia,
                    "orden":      orden,
                })

    if pr_docs: db.plan_recetas.insert_many(pr_docs)

# ══════════════════════════════════════════════
# SESIONES (Adaptado para escala)
# ══════════════════════════════════════════════
def generar_sesiones(db, id_entrenador, ids_miembros):
    print("\n📅 Generando sesiones de entrenamiento...")
    now    = datetime.now()
    inicio = now - timedelta(days=MESES_ACTIVIDAD * 30)
    ubi    = ["Sala Principal","Box","Sala Cycling","Exterior","Sala 1"]
    notas_ok = ["Excelente progreso","Mejoró técnica","Gran esfuerzo","Avance notable"]
    notas_no = ["Canceló por enfermedad","Emergencia personal","Reprogramado"]

    sesiones = []
    dias_pasados = (now - inicio).days

    # Con 500 miembros, generaremos entre 30 y 60 sesiones dirigidas al día para todo el gimnasio.
    for dias_atras in range(dias_pasados, 0, -1):
        fecha = now - timedelta(days=dias_atras)
        for _ in range(random.randint(30, 60)):
            estado = random.choices(["completed","cancelled"], weights=[0.85, 0.15])[0]
            sesiones.append({
                "id_entrenador":      id_entrenador,
                "id_miembro":         random.choice(ids_miembros),
                "id_rutina":          None,
                "fecha":              fecha,
                "hora_inicio":        f"{random.randint(6,20):02d}:{random.choice([0,15,30,45]):02d}:00",
                "duracion_minutos":   random.choice([45, 60, 90]),
                "tipo":               "Personal",
                "ubicacion":          random.choice(ubi),
                "estado":             estado,
                "nombre_sesion":      None,
                "notas":              random.choice(notas_ok) if estado == "completed" else random.choice(notas_no),
                "num_ejercicios":     random.randint(8, 12) if estado == "completed" else 0,
                "asistencia":         estado == "completed",
                "fecha_creacion":     fecha,
                "fecha_actualizacion":now,
            })

    # Hoy
    hoy = now
    for _ in range(25):
        estado = random.choice(["completed","in-progress","scheduled"])
        sesiones.append({
            "id_entrenador":      id_entrenador,
            "id_miembro":         random.choice(ids_miembros),
            "id_rutina":          None,
            "fecha":              hoy,
            "hora_inicio":        f"{random.randint(6, 21):02d}:00:00",
            "duracion_minutos":   60,
            "tipo":               "Personal",
            "ubicacion":          random.choice(ubi),
            "estado":             estado,
            "nombre_sesion":      None,
            "notas":              "Sesión en curso" if estado == "in-progress" else None,
            "num_ejercicios":     10 if estado == "completed" else (5 if estado == "in-progress" else 0),
            "asistencia":         estado in ("completed", "in-progress"),
            "fecha_creacion":     hoy,
            "fecha_actualizacion":hoy,
        })

    # Insertar en lotes de 2000 para no reventar la memoria de una sola vez
    for i in range(0, len(sesiones), 2000):
        db.sesiones.insert_many(sesiones[i:i+2000])

    print(f"   ✅ {len(sesiones):,} sesiones insertadas")

# ══════════════════════════════════════════════
# VENTAS (Adaptado para volumen)
# ══════════════════════════════════════════════
def generar_ventas(db, productos):
    print("\n💰 Generando ventas...")
    now = datetime.now()

    # Si hay más miembros, habrá más ventas sueltas. Vamos a generar 500 ventas.
    for _ in range(500):
        fecha = now - timedelta(days=random.randint(0, MESES_ACTIVIDAD * 30))

        venta_doc = {"fecha": fecha, "total": 0.0}
        db.ventas.insert_one(venta_doc)
        id_venta = venta_doc["_id"]

        total = 0.0
        detalles = []
        for _ in range(random.randint(1, 3)):
            prod     = random.choice(productos)
            cantidad = random.randint(1, 3)
            subtotal = float(prod["precio"]) * cantidad
            total   += subtotal
            detalles.append({
                "id_venta":    id_venta,
                "id_producto": prod["_id"],
                "cantidad":    cantidad,
                "subtotal":    round(subtotal, 2),
            })

        db.detalle_venta.insert_many(detalles)
        db.ventas.update_one({"_id": id_venta}, {"$set": {"total": round(total, 2)}})

    print("   ✅ 500 ventas + detalles insertados")

# ══════════════════════════════════════════════
# ESTADÍSTICAS FINALES
# ══════════════════════════════════════════════
def mostrar_estadisticas(db):
    print("\n" + "=" * 60)
    print("📊 RESUMEN FINAL")
    print("=" * 60)

    colecciones = [
        "roles","usuarios","miembros","membresias","productos",
        "ventas","detalle_venta","correos_enviados","asistencias",
        "pagos","progreso_fisico","rutinas","rutina_dias",
        "rutina_ejercicios","miembro_membresia","sesiones",
        "tipos_dieta","recetas","planes_alimenticios","plan_recetas",
        "perfil_entrenador","certificaciones_entrenador",
        "logros_entrenador","evaluaciones_entrenador","miembro_rutina",
    ]

    for col in colecciones:
        n = db[col].count_documents({})
        print(f"   {col:<35} {n:>6} docs")

    total_ventas = list(db.ventas.aggregate([{"$group": {"_id": None, "t": {"$sum": "$total"}}}]))
    total_pagos = list(db.pagos.aggregate([{"$group": {"_id": None, "t": {"$sum": "$monto"}}}]))

    if total_ventas: print(f"\n   💵 Ingresos por ventas:     ${total_ventas[0]['t']:>10,.2f}")
    if total_pagos: print(f"   💳 Ingresos por membresías: ${total_pagos[0]['t']:>10,.2f}")

    print("\n" + "=" * 60)
    print("🔑 CREDENCIALES (contraseña para todos: 123456)")
    print("=" * 60)
    print("   admin@gym.com")
    print("   entrenador@gym.com")
    print("   recepcion@gym.com")
    print("   miembro1@gym.com → miembro5@gym.com (los siguientes son correos Fake)")
    print("=" * 60 + "\n")

# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════
def main():
    print("\n🚀 GYM MONGO SEED — 500 USUARIOS")
    print("=" * 60)

    db = get_db()
    limpiar_datos(db)
    roles, membresias, productos, tipos_dieta, recetas = obtener_catalogo(db)

    crear_admin(db, roles["Administrador"])
    id_entrenador = crear_entrenador(db, roles["Entrenador"])
    crear_recepcionista(db, roles["Recepcionista"])

    # Aquí definimos generar 500 usuarios
    ids_miembros = crear_miembros(
        db, roles["Miembro"], id_entrenador,
        membresias, tipos_dieta, recetas, num_usuarios=500
    )

    generar_sesiones(db, id_entrenador, ids_miembros)
    generar_ventas(db, productos)

    mostrar_estadisticas(db)
    print("✅ ¡POBLACIÓN EXITOSA!\n")

if __name__ == "__main__":
    main()