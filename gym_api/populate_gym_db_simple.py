import mysql.connector
from faker import Faker
import random
from datetime import datetime, timedelta

# ==========================================
# CONFIGURACIÓN
# ==========================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',      
    'password': '',      
    'database': 'gym_db'
}

# Configuración de cantidades
CANTIDAD_MIEMBROS = 5  # Todos Premium con el mismo entrenador
CANTIDAD_ENTRENADORES = 1
CANTIDAD_RECEPCIONISTAS = 1
MESES_ACTIVIDAD = 6  # 6 meses de historial

# Contraseña por defecto
DEFAULT_PASSWORD = 'scrypt:32768:8:1$U1umhxfH8LDLojFb$7c6b302a3cdc30296572691480bfcad86209846fe6896a4f69c0f22caf58e23a85d8396fdce945a45fad84d8b27682c9e9f6919a4d7481bd912aa2d001470309'

fake = Faker('es_MX')

def connect_db():
    """Conecta a la base de datos"""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f"❌ Error al conectar con la base de datos: {err}")
        exit(1)

def limpiar_base_datos(cursor, conn):
    """Limpia todos los datos existentes"""
    print("🧹 Limpiando base de datos...")
    
    tablas = [
        'plan_recetas', 'planes_alimenticios', 'recetas', 'tipos_dieta',
        'sesiones', 'rutina_ejercicios', 'rutina_dias', 'rutinas', 'correo_miembro',
        'detalle_venta', 'progreso_fisico', 'asistencias', 'pagos',
        'miembro_membresia', 'correos_enviados', 'ventas', 
        'miembros', 'usuarios', 'productos', 'membresias', 'roles'
    ]
    
    cursor.execute("SET FOREIGN_KEY_CHECKS=0")
    for tabla in tablas:
        try:
            cursor.execute(f"TRUNCATE TABLE {tabla}")
        except mysql.connector.Error as err:
            print(f"⚠️ Advertencia: No se pudo limpiar la tabla {tabla} ({err})")
            
    cursor.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    print("   ✅ Base de datos limpia")

def insertar_datos_estaticos(cursor, conn):
    """Inserta roles, membresías, productos, tipos de dieta y recetas"""
    print("📋 Insertando datos estáticos...")
    
    # Roles
    roles = [('Administrador',), ('Entrenador',), ('Recepcionista',), ('Miembro',)]
    cursor.executemany("INSERT INTO roles (nombre) VALUES (%s)", roles)
    
    # Membresías - Todas las opciones
    membresias = [
        ('Básica Mensual', 1, 80.00),
        ('Premium Mensual', 1, 90.00),
        ('Básica Anual', 12, 300.00),
        ('Premium Anual', 12, 550.00),
        ('Estudiante', 1, 25.00),
        ('Familiar', 1, 80.00),
        ('VIP', 1, 100.00)
    ]
    cursor.executemany("INSERT INTO membresias (nombre, duracion_meses, precio) VALUES (%s, %s, %s)", membresias)
    
    # Productos
    productos = [
        ('Proteína Whey 1kg', 450.00, 50), ('Creatina 300g', 280.00, 30),
        ('BCAA 200 caps', 320.00, 25), ('Pre-Workout', 380.00, 20),
        ('Shaker 600ml', 80.00, 100), ('Toalla deportiva', 120.00, 60),
        ('Guantes gimnasio', 150.00, 40), ('Botella agua 1L', 95.00, 80),
        ('Barra proteína', 35.00, 200), ('Electrolitos', 180.00, 45)
    ]
    cursor.executemany("INSERT INTO productos (nombre, precio, stock) VALUES (%s, %s, %s)", productos)
    
    # Tipos de Dieta
    tipos_dieta = [
        ('Hipercalórica', 'Dieta para aumento de masa muscular', '2800-3500 kcal'),
        ('Déficit Calórico', 'Dieta para pérdida de grasa', '1500-2000 kcal'),
        ('Vegana', 'Dieta basada en plantas sin productos animales', '2000-2500 kcal'),
        ('Mediterránea', 'Dieta balanceada estilo mediterráneo', '2000-2300 kcal'),
        ('Keto', 'Dieta baja en carbohidratos alta en grasas', '1800-2200 kcal'),
        ('Paleo', 'Dieta basada en alimentos no procesados', '2000-2400 kcal'),
        ('Flexible', 'Dieta balanceada sin restricciones específicas', '2000-2500 kcal')
    ]
    cursor.executemany("""
        INSERT INTO tipos_dieta (nombre, descripcion, calorias_objetivo) 
        VALUES (%s, %s, %s)
    """, tipos_dieta)
    
    conn.commit()
    
    # Insertar recetas por tipo de dieta
    insertar_recetas(cursor, conn)
    
    print("   ✅ Datos estáticos insertados")

def insertar_recetas(cursor, conn):
    """Inserta recetas variadas para cada tipo de dieta"""
    print("   📝 Insertando recetas...")
    
    # Obtener IDs de tipos de dieta
    cursor.execute("SELECT id_tipo_dieta, nombre FROM tipos_dieta")
    tipos_dieta = {nombre: id_tipo for id_tipo, nombre in cursor.fetchall()}
    
    recetas = []
    
    # ========== HIPERCALÓRICA ==========
    id_hiper = tipos_dieta['Hipercalórica']
    recetas.extend([
        (id_hiper, 'Desayuno Power', 'Desayuno',
         '5 claras de huevo, 2 huevos enteros, 100g avena, 1 plátano, 30g mantequilla de maní',
         '1. Cocinar huevos revueltos. 2. Cocinar avena con agua. 3. Servir con plátano y mantequilla de maní.',
         850.00, 52.00, 95.00, 28.00, 15),
        
        (id_hiper, 'Batido Ganador', 'Media Mañana',
         '2 scoops proteína, 100g avena, 1 plátano, 30g almendras, 400ml leche entera',
         '1. Licuar todos los ingredientes. 2. Servir frío.',
         720.00, 58.00, 82.00, 22.00, 5),
        
        (id_hiper, 'Pechuga con Arroz Power', 'Almuerzo',
         '250g pechuga de pollo, 200g arroz integral, 150g brócoli, 2 cdas aceite oliva, especias',
         '1. Cocinar arroz. 2. Saltear pollo con especias. 3. Cocer brócoli al vapor. 4. Servir todo junto.',
         780.00, 65.00, 88.00, 18.00, 30),
        
        (id_hiper, 'Wrap de Atún', 'Merienda',
         '2 latas atún, 2 tortillas integrales, 50g queso, vegetales, 1 cda mayonesa light',
         '1. Mezclar atún con mayonesa. 2. Rellenar tortillas con atún, queso y vegetales. 3. Calentar.',
         620.00, 54.00, 48.00, 22.00, 10),
        
        (id_hiper, 'Salmón con Quinoa', 'Cena',
         '200g salmón, 150g quinoa, 100g espárragos, 1 cda aceite oliva, limón',
         '1. Cocinar quinoa. 2. Hornear salmón con limón. 3. Saltear espárragos. 4. Servir.',
         690.00, 48.00, 55.00, 26.00, 25),
        
        (id_hiper, 'Batido Post-Entreno', 'Post-Entreno',
         '2 scoops proteína, 50g dextrosa, 1 plátano, 5g creatina',
         '1. Mezclar todos los ingredientes con agua. 2. Tomar inmediatamente después del entreno.',
         420.00, 50.00, 68.00, 2.00, 3),
    ])
    
    # ========== DÉFICIT CALÓRICO ==========
    id_deficit = tipos_dieta['Déficit Calórico']
    recetas.extend([
        (id_deficit, 'Omelette Ligero', 'Desayuno',
         '4 claras, 1 huevo entero, espinacas, champiñones, tomate',
         '1. Batir claras y huevo. 2. Saltear vegetales. 3. Cocinar omelette. 4. Servir.',
         220.00, 28.00, 8.00, 6.00, 10),
        
        (id_deficit, 'Yogurt con Frutos Rojos', 'Media Mañana',
         '200g yogurt griego 0%, 100g frutos rojos, 10g almendras',
         '1. Servir yogurt en bowl. 2. Agregar frutos rojos y almendras.',
         210.00, 22.00, 18.00, 6.00, 3),
        
        (id_deficit, 'Ensalada de Pollo', 'Almuerzo',
         '150g pechuga de pollo, lechuga, tomate, pepino, zanahoria, vinagre balsámico',
         '1. Cocinar pollo a la plancha. 2. Cortar vegetales. 3. Mezclar todo. 4. Aliñar con vinagre.',
         280.00, 38.00, 15.00, 5.00, 15),
        
        (id_deficit, 'Manzana con Almendras', 'Merienda',
         '1 manzana mediana, 15g almendras',
         '1. Cortar manzana en rodajas. 2. Servir con almendras.',
         180.00, 4.00, 28.00, 6.00, 2),
        
        (id_deficit, 'Pescado al Vapor', 'Cena',
         '180g pescado blanco, 200g vegetales mixtos, limón, especias',
         '1. Cocinar pescado al vapor con limón. 2. Cocer vegetales al vapor. 3. Servir.',
         240.00, 36.00, 12.00, 4.00, 20),
        
        (id_deficit, 'Batido de Proteína', 'Post-Entreno',
         '1 scoop proteína, 200ml agua, hielo',
         '1. Mezclar proteína con agua. 2. Agregar hielo. 3. Licuar.',
         120.00, 24.00, 3.00, 1.00, 2),
    ])
    
    # ========== VEGANA ==========
    id_vegana = tipos_dieta['Vegana']
    recetas.extend([
        (id_vegana, 'Bowl de Avena Vegano', 'Desayuno',
         '80g avena, 200ml leche de almendras, 1 plátano, 20g nueces, canela',
         '1. Cocinar avena con leche vegetal. 2. Agregar plátano y nueces. 3. Espolvorear canela.',
         420.00, 12.00, 65.00, 14.00, 8),
        
        (id_vegana, 'Hummus con Vegetales', 'Media Mañana',
         '100g hummus, zanahoria, pepino, apio',
         '1. Cortar vegetales en bastones. 2. Servir con hummus.',
         180.00, 8.00, 22.00, 6.00, 5),
        
        (id_vegana, 'Buddha Bowl', 'Almuerzo',
         '150g tofu, 100g quinoa, aguacate, garbanzos, espinaca, tahini',
         '1. Cocinar quinoa. 2. Saltear tofu. 3. Armar bowl con todos los ingredientes.',
         520.00, 26.00, 48.00, 24.00, 25),
        
        (id_vegana, 'Batido Verde', 'Merienda',
         'Espinaca, 1 plátano, 1 manzana, leche de coco, semillas chía',
         '1. Licuar todos los ingredientes. 2. Servir frío.',
         240.00, 6.00, 42.00, 8.00, 5),
        
        (id_vegana, 'Curry de Lentejas', 'Cena',
         '150g lentejas, leche de coco, curry, espinaca, tomate, cebolla',
         '1. Cocinar lentejas. 2. Saltear cebolla. 3. Agregar especias y leche de coco. 4. Mezclar todo.',
         380.00, 18.00, 52.00, 12.00, 30),
        
        (id_vegana, 'Batido de Proteína Vegana', 'Post-Entreno',
         '1 scoop proteína vegana, 1 plátano, leche de almendras, mantequilla de almendra',
         '1. Licuar todos los ingredientes.',
         320.00, 28.00, 38.00, 10.00, 3),
    ])
    
    # ========== MEDITERRÁNEA ==========
    id_med = tipos_dieta['Mediterránea']
    recetas.extend([
        (id_med, 'Tostadas Mediterráneas', 'Desayuno',
         '2 rebanadas pan integral, aguacate, tomate, huevo pochado, aceite oliva',
         '1. Tostar pan. 2. Untar aguacate. 3. Agregar tomate. 4. Colocar huevo. 5. Rociar aceite.',
         380.00, 18.00, 42.00, 18.00, 12),
        
        (id_med, 'Ensalada Griega', 'Almuerzo',
         'Lechuga, tomate, pepino, aceitunas, queso feta, aceite oliva, orégano',
         '1. Cortar vegetales. 2. Mezclar. 3. Agregar queso y aceitunas. 4. Aliñar.',
         290.00, 12.00, 18.00, 20.00, 10),
        
        (id_med, 'Pollo al Limón', 'Cena',
         '180g pechuga pollo, limón, ajo, hierbas, aceite oliva, vegetales',
         '1. Marinar pollo con limón y ajo. 2. Hornear. 3. Servir con vegetales.',
         340.00, 42.00, 12.00, 14.00, 35),
    ])
    
    # ========== KETO ==========
    id_keto = tipos_dieta['Keto']
    recetas.extend([
        (id_keto, 'Huevos con Aguacate', 'Desayuno',
         '3 huevos, 1 aguacate, tocino, queso cheddar',
         '1. Freír huevos y tocino. 2. Servir con aguacate y queso.',
         520.00, 32.00, 8.00, 42.00, 10),
        
        (id_keto, 'Salmón con Espárragos', 'Almuerzo',
         '200g salmón, espárragos, mantequilla, limón',
         '1. Hornear salmón. 2. Saltear espárragos en mantequilla. 3. Servir.',
         480.00, 38.00, 6.00, 36.00, 25),
        
        (id_keto, 'Ensalada César Keto', 'Cena',
         'Lechuga romana, 150g pollo, parmesano, aderezo césar keto',
         '1. Cocinar pollo. 2. Armar ensalada. 3. Agregar aderezo.',
         380.00, 42.00, 8.00, 22.00, 15),
    ])
    
    # ========== PALEO ==========
    id_paleo = tipos_dieta['Paleo']
    recetas.extend([
        (id_paleo, 'Batido Paleo', 'Desayuno',
         'Huevos, plátano, nueces, leche de coco, canela',
         '1. Licuar todos los ingredientes.',
         380.00, 18.00, 38.00, 20.00, 5),
        
        (id_paleo, 'Carne con Batata', 'Almuerzo',
         '200g carne res, 150g batata, brócoli, aceite coco',
         '1. Cocinar carne. 2. Hornear batata. 3. Cocer brócoli. 4. Servir.',
         520.00, 45.00, 42.00, 22.00, 40),
        
        (id_paleo, 'Pollo con Vegetales', 'Cena',
         '180g pollo, calabacín, pimientos, cebolla, aceite oliva',
         '1. Saltear pollo. 2. Agregar vegetales. 3. Cocinar todo junto.',
         340.00, 40.00, 18.00, 14.00, 25),
    ])
    
    # ========== FLEXIBLE ==========
    id_flex = tipos_dieta['Flexible']
    recetas.extend([
        (id_flex, 'Pancakes Proteicos', 'Desayuno',
         '40g avena, 2 huevos, 1 plátano, 1 scoop proteína',
         '1. Licuar todo. 2. Cocinar como pancakes. 3. Servir.',
         420.00, 38.00, 48.00, 10.00, 15),
        
        (id_flex, 'Wrap de Pollo', 'Almuerzo',
         'Tortilla integral, 150g pollo, lechuga, tomate, aguacate, queso',
         '1. Cocinar pollo. 2. Armar wrap. 3. Calentar.',
         480.00, 42.00, 38.00, 18.00, 15),
        
        (id_flex, 'Pasta con Atún', 'Cena',
         '100g pasta integral, 1 lata atún, tomate, aceite oliva, ajo',
         '1. Cocinar pasta. 2. Saltear ajo. 3. Agregar tomate y atún. 4. Mezclar con pasta.',
         450.00, 35.00, 58.00, 12.00, 20),
    ])
    
    # Insertar todas las recetas
    cursor.executemany("""
        INSERT INTO recetas (id_tipo_dieta, nombre, tipo_comida, ingredientes, preparacion,
                           calorias, proteinas, carbohidratos, grasas, tiempo_preparacion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, recetas)
    
    conn.commit()
    print(f"      ✅ {len(recetas)} recetas insertadas")

def obtener_ids_referencia(cursor):
    """Obtiene IDs necesarios"""
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Administrador'")
    id_admin = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Entrenador'")
    id_entrenador = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Recepcionista'")
    id_recepcionista = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Miembro'")
    id_miembro = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_membresia, precio, duracion_meses, nombre FROM membresias")
    membresias = cursor.fetchall()
    
    cursor.execute("SELECT id_producto, precio FROM productos")
    productos = cursor.fetchall()
    
    cursor.execute("SELECT id_tipo_dieta, nombre FROM tipos_dieta")
    tipos_dieta = cursor.fetchall()
    
    return {
        'roles': {'admin': id_admin, 'entrenador': id_entrenador, 'recepcionista': id_recepcionista, 'miembro': id_miembro},
        'membresias': membresias,
        'productos': productos,
        'tipos_dieta': tipos_dieta
    }

def crear_administrador(cursor, conn, id_role_admin):
    print("👨‍💼 Creando administrador...")
    fecha_creacion = datetime.now() - timedelta(days=365)
    cursor.execute("""
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (id_role_admin, 'Carlos Admin', 'admin@gym.com', DEFAULT_PASSWORD, 1, fecha_creacion))
    conn.commit()
    print("   ✅ Admin creado: admin@gym.com")

def crear_personal(cursor, conn, id_role_entrenador, id_role_recepcionista):
    print(f"👨‍🏫 Creando {CANTIDAD_ENTRENADORES} entrenador y {CANTIDAD_RECEPCIONISTAS} recepcionista...")
    
    fecha_creacion = datetime.now() - timedelta(days=400)
    
    # Entrenador
    cursor.execute("""
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (id_role_entrenador, 'Miguel Entrenador', 'entrenador@gym.com', DEFAULT_PASSWORD, 1, fecha_creacion))
    id_entrenador = cursor.lastrowid
    
    # Recepcionista
    cursor.execute("""
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (id_role_recepcionista, 'Ana Recepcionista', 'recepcion@gym.com', DEFAULT_PASSWORD, 1, fecha_creacion))
    
    conn.commit()
    print("   ✅ Personal creado")
    print("      - Entrenador: entrenador@gym.com")
    print("      - Recepcionista: recepcion@gym.com")
    
    return id_entrenador

def crear_miembros_premium(cursor, conn, id_role_miembro, id_entrenador, membresias, productos, tipos_dieta):
    """Crea 5 miembros Premium activos por 6 meses"""
    print(f"👥 Creando {CANTIDAD_MIEMBROS} miembros Premium con {MESES_ACTIVIDAD} meses de actividad...")
    
    # Seleccionar membresía Premium
    membresia_premium = [m for m in membresias if 'Premium' in m[3]][0]
    id_membresia, precio_membresia, duracion_meses, nombre_membresia = membresia_premium
    
    fecha_actual = datetime.now()
    fecha_registro_base = fecha_actual - timedelta(days=MESES_ACTIVIDAD * 30)
    
    # Perfiles de miembros con diferentes objetivos
    perfiles_miembros = [
        ('Juan Pérez', 'M', 75.0, 1.75, 'Hipercalórica'),
        ('María García', 'F', 62.0, 1.65, 'Déficit Calórico'),
        ('Pedro López', 'M', 82.0, 1.80, 'Vegana'),
        ('Ana Martínez', 'F', 58.0, 1.60, 'Mediterránea'),
        ('Carlos Rodríguez', 'M', 78.0, 1.77, 'Flexible')
    ]
    
    for i, (nombre, sexo, peso_inicial, estatura, tipo_dieta_nombre) in enumerate(perfiles_miembros, 1):
        print(f"\n   📝 Creando miembro {i}: {nombre}...")
        
        # 1. Crear Usuario
        email = f"miembro{i}@gym.com"
        fecha_registro = fecha_registro_base + timedelta(days=random.randint(0, 15))
        
        cursor.execute("""
            INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (id_role_miembro, nombre, email, DEFAULT_PASSWORD, 1, fecha_registro))
        id_usuario = cursor.lastrowid
        
        # 2. Crear Miembro con entrenador
        telefono = fake.phone_number()[:20]
        fecha_nacimiento = fake.date_of_birth(minimum_age=20, maximum_age=45)
        foto_perfil = 'male.jpg' if sexo == 'M' else 'female.jpg'
        
        cursor.execute("""
            INSERT INTO miembros (id_usuario, id_entrenador, telefono, fecha_nacimiento, sexo, 
                                 peso_inicial, estatura, fecha_registro, estado, foto_perfil) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (id_usuario, id_entrenador, telefono, fecha_nacimiento, sexo, 
              peso_inicial, estatura, fecha_registro.date(), 'Activo', foto_perfil))
        id_miembro = cursor.lastrowid
        
        # 3. Registrar Membresía Premium Activa
        inicio_memb = fecha_registro
        fin_memb = fecha_actual + timedelta(days=90)  # 3 meses más de vigencia
        
        cursor.execute("""
            INSERT INTO miembro_membresia (id_miembro, id_membresia, fecha_inicio, fecha_fin, estado) 
            VALUES (%s, %s, %s, %s, %s)
        """, (id_miembro, id_membresia, inicio_memb.date(), fin_memb.date(), 'Activa'))
        
        # 4. Registrar Pagos Mensuales (durante los 6 meses)
        print(f"      💳 Generando pagos mensuales...")
        generar_pagos_mensuales(cursor, conn, id_miembro, precio_membresia, nombre_membresia, 
                               fecha_registro, fecha_actual)
        
        # 5. Generar Asistencias (últimos 6 meses, 3-4 veces por semana)
        print(f"      📍 Generando asistencias...")
        generar_asistencias_miembro(cursor, conn, id_miembro, fecha_registro, fecha_actual)
        
        # 6. Generar Progreso Físico (cada mes)
        print(f"      📊 Generando progreso físico...")
        generar_progreso_fisico(cursor, conn, id_miembro, sexo, peso_inicial, estatura, fecha_registro, fecha_actual)
        
        # 7. Crear Rutina de Entrenamiento
        print(f"      🏋️ Creando rutina de entrenamiento...")
        crear_rutina_miembro(cursor, conn, id_miembro, sexo, tipo_dieta_nombre)
        
        # 8. Crear Plan Alimenticio
        print(f"      🥗 Creando plan alimenticio ({tipo_dieta_nombre})...")
        crear_plan_alimenticio(cursor, conn, id_miembro, tipo_dieta_nombre, tipos_dieta, peso_inicial, sexo)
        
        conn.commit()
        print(f"   ✅ Miembro {i} completado: {nombre} ({email})")
    
    print(f"\n   🎯 Todos los {CANTIDAD_MIEMBROS} miembros están activos con:")
    print(f"      - Membresía Premium")
    print(f"      - {MESES_ACTIVIDAD} meses de historial")
    print(f"      - Rutina personalizada")
    print(f"      - Plan alimenticio")

def generar_asistencias_miembro(cursor, conn, id_miembro, fecha_inicio, fecha_fin):
    """Genera asistencias realistas para un miembro (3-4 veces por semana)"""
    asistencias = []
    dias_totales = (fecha_fin - fecha_inicio).days
    
    # Generar asistencias 3-4 veces por semana
    for dia in range(dias_totales):
        fecha_dia = (fecha_inicio + timedelta(days=dia)).date()
        
        # Probabilidad de asistir (50% = ~3.5 veces por semana)
        if random.random() < 0.5:
            hora = random.randint(7, 19)
            hora_ent = f"{hora:02d}:{random.choice([0,30]):02d}:00"
            duracion = random.randint(60, 120)
            
            dt_ent = datetime.combine(fecha_dia, datetime.strptime(hora_ent, "%H:%M:%S").time())
            dt_sal = dt_ent + timedelta(minutes=duracion)
            
            # Si es hoy y la hora no ha pasado, no poner hora de salida
            if fecha_dia == fecha_fin.date() and dt_ent > fecha_fin:
                continue
            elif fecha_dia == fecha_fin.date() and dt_sal > fecha_fin:
                hora_sal = None
            else:
                hora_sal = dt_sal.strftime("%H:%M:%S")
            
            asistencias.append((id_miembro, fecha_dia, hora_ent, hora_sal))
    
    # Insertar en lotes
    if asistencias:
        cursor.executemany("""
            INSERT INTO asistencias (id_miembro, fecha, hora_entrada, hora_salida) 
            VALUES (%s, %s, %s, %s)
        """, asistencias)

def generar_pagos_mensuales(cursor, conn, id_miembro, precio_membresia, nombre_membresia, 
                            fecha_inicio, fecha_fin):
    """Genera pagos mensuales durante todo el periodo de actividad"""
    pagos = []
    
    # Calcular número de meses completos
    meses_totales = ((fecha_fin.year - fecha_inicio.year) * 12 + 
                     (fecha_fin.month - fecha_inicio.month))
    
    # Generar un pago por cada mes
    for mes in range(meses_totales + 1):
        # Fecha de pago: aproximadamente el mismo día cada mes
        if mes == 0:
            fecha_pago = fecha_inicio
        else:
            # Calcular fecha del pago (mismo día del mes siguiente, con variación de ±3 días)
            try:
                fecha_base = fecha_inicio + timedelta(days=mes * 30)
                variacion_dias = random.randint(-3, 3)
                fecha_pago = fecha_base + timedelta(days=variacion_dias)
                
                # No generar pagos futuros
                if fecha_pago > fecha_fin:
                    break
            except:
                continue
        
        # Método de pago aleatorio pero consistente por usuario en su mayoría
        metodos = ['Efectivo', 'Tarjeta', 'Transferencia']
        # 70% usa el mismo método, 30% varía
        if mes == 0 or random.random() < 0.3:
            metodo_pago = random.choice(metodos)
        
        concepto = f"Pago {nombre_membresia} - Mes {mes + 1}"
        
        pagos.append((id_miembro, precio_membresia, metodo_pago, concepto, fecha_pago))
    
    # Insertar todos los pagos
    if pagos:
        cursor.executemany("""
            INSERT INTO pagos (id_miembro, monto, metodo_pago, concepto, fecha_pago) 
            VALUES (%s, %s, %s, %s, %s)
        """, pagos)
    
    return len(pagos)

def generar_progreso_fisico(cursor, conn, id_miembro, sexo, peso_inicial, estatura, fecha_inicio, fecha_fin):
    """Genera mediciones mensuales de progreso físico"""
    progresos = []
    meses = (fecha_fin.year - fecha_inicio.year) * 12 + (fecha_fin.month - fecha_inicio.month)
    
    peso_actual = peso_inicial
    
    for mes in range(meses + 1):
        fecha_medicion = fecha_inicio + timedelta(days=mes * 30)
        
        # Simular progreso gradual
        if mes > 0:
            cambio_peso = random.uniform(-1.5, 1.0)
            peso_actual += cambio_peso
        
        bmi = peso_actual / (estatura ** 2)
        
        if sexo == 'M':
            grasa = round(random.uniform(12, 20), 2)
            musculo = round(random.uniform(38, 46), 2)
            cintura = round(random.uniform(75, 90), 2)
            pecho = round(random.uniform(95, 110), 2)
            brazo = round(random.uniform(32, 38), 2)
            pierna = round(random.uniform(55, 65), 2)
        else:
            grasa = round(random.uniform(18, 28), 2)
            musculo = round(random.uniform(30, 38), 2)
            cintura = round(random.uniform(65, 80), 2)
            pecho = round(random.uniform(85, 100), 2)
            brazo = round(random.uniform(26, 32), 2)
            pierna = round(random.uniform(50, 60), 2)
        
        progresos.append((
            id_miembro, round(peso_actual, 2), round(bmi, 2), grasa, musculo,
            round(100 - grasa - musculo, 2), round(random.uniform(2.5, 3.5), 2),
            cintura, round(cintura * 1.2, 2), pecho, brazo, brazo,
            pierna, pierna, round(pierna * 0.65, 2), fecha_medicion.date()
        ))
    
    cursor.executemany("""
        INSERT INTO progreso_fisico (id_miembro, peso, bmi, grasa_corporal, masa_muscular, 
        agua_corporal, masa_osea, cintura, cadera, pecho, brazo_derecho, brazo_izquierdo,
        muslo_derecho, muslo_izquierdo, pantorrilla, fecha_registro) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, progresos)

def crear_rutina_miembro(cursor, conn, id_miembro, sexo, tipo_dieta):
    """Crea una rutina de entrenamiento personalizada para el miembro"""
    
    # Determinar objetivo según el tipo de dieta
    objetivos = {
        'Hipercalórica': 'Aumento de masa muscular',
        'Déficit Calórico': 'Pérdida de grasa y tonificación',
        'Vegana': 'Mantenimiento y fuerza',
        'Mediterránea': 'Salud general y resistencia',
        'Keto': 'Definición muscular',
        'Paleo': 'Fuerza funcional',
        'Flexible': 'Mejora general fitness'
    }
    
    objetivo = objetivos.get(tipo_dieta, 'Mejora general fitness')
    nombre_rutina = f"Rutina {tipo_dieta.split()[0]}"
    
    # Crear rutina
    cursor.execute("""
        INSERT INTO rutinas (id_miembro, nombre, objetivo, activa, fecha_creacion)
        VALUES (%s, %s, %s, %s, %s)
    """, (id_miembro, nombre_rutina, objetivo, 1, datetime.now() - timedelta(days=30)))
    id_rutina = cursor.lastrowid
    
    # Rutinas según objetivo
    if 'Hipercalórica' in tipo_dieta or 'masa' in objetivo.lower():
        # Rutina de volumen - 5 días
        dias_ejercicios = [
            ('Lunes', 'Pecho y Tríceps', [
                ('Press Banca', '4', '8-10', '80kg'),
                ('Press Inclinado', '4', '10-12', '60kg'),
                ('Aperturas', '3', '12-15', '15kg'),
                ('Press Francés', '3', '10-12', '30kg'),
                ('Fondos', '3', '10-12', 'Peso corporal'),
            ]),
            ('Martes', 'Espalda y Bíceps', [
                ('Dominadas', '4', '8-10', 'Peso corporal'),
                ('Remo con Barra', '4', '8-10', '70kg'),
                ('Jalón al Pecho', '3', '10-12', '60kg'),
                ('Curl con Barra', '3', '10-12', '30kg'),
                ('Curl Martillo', '3', '12-15', '15kg'),
            ]),
            ('Miércoles', 'Pierna', [
                ('Sentadilla', '4', '8-10', '100kg'),
                ('Peso Muerto', '4', '6-8', '120kg'),
                ('Prensa', '3', '12-15', '150kg'),
                ('Curl Femoral', '3', '12-15', '40kg'),
                ('Pantorrilla', '4', '15-20', '60kg'),
            ]),
            ('Jueves', 'Hombro y Trapecio', [
                ('Press Militar', '4', '8-10', '50kg'),
                ('Elevaciones Laterales', '4', '12-15', '12kg'),
                ('Elevaciones Frontales', '3', '12-15', '12kg'),
                ('Remo al Mentón', '3', '12-15', '30kg'),
                ('Encogimientos', '4', '12-15', '40kg'),
            ]),
            ('Viernes', 'Fullbody', [
                ('Sentadilla Frontal', '3', '10-12', '60kg'),
                ('Press Banca Inclinado', '3', '10-12', '60kg'),
                ('Remo con Mancuerna', '3', '10-12', '30kg'),
                ('Fondos', '3', '10-12', 'Peso corporal'),
                ('Plancha', '3', '1 min', 'Peso corporal'),
            ]),
        ]
    elif 'Déficit' in tipo_dieta or 'pérdida' in objetivo.lower():
        # Rutina de definición - 4 días
        dias_ejercicios = [
            ('Lunes', 'Tren Superior 1', [
                ('Press Banca', '3', '12-15', '50kg'),
                ('Remo con Barra', '3', '12-15', '50kg'),
                ('Press Militar', '3', '12-15', '35kg'),
                ('Curl con Barra', '3', '15-20', '20kg'),
                ('Cardio HIIT', '1', '20 min', '-'),
            ]),
            ('Martes', 'Tren Inferior', [
                ('Sentadilla', '4', '15-20', '60kg'),
                ('Zancadas', '3', '15-20', '20kg'),
                ('Peso Muerto Rumano', '3', '12-15', '50kg'),
                ('Curl Femoral', '3', '15-20', '30kg'),
                ('Cardio Moderado', '1', '30 min', '-'),
            ]),
            ('Jueves', 'Tren Superior 2', [
                ('Dominadas Asistidas', '3', '10-12', 'Asistencia'),
                ('Press Inclinado', '3', '12-15', '40kg'),
                ('Aperturas', '3', '15-20', '10kg'),
                ('Jalón Polea', '3', '12-15', '40kg'),
                ('Cardio HIIT', '1', '20 min', '-'),
            ]),
            ('Viernes', 'Circuito Funcional', [
                ('Burpees', '3', '15', 'Peso corporal'),
                ('Kettlebell Swings', '3', '20', '16kg'),
                ('Mountain Climbers', '3', '30', 'Peso corporal'),
                ('Jump Squats', '3', '15', 'Peso corporal'),
                ('Cardio Moderado', '1', '20 min', '-'),
            ]),
        ]
    else:
        # Rutina balanceada - 4 días
        dias_ejercicios = [
            ('Lunes', 'Pecho y Tríceps', [
                ('Press Banca', '4', '10-12', '60kg'),
                ('Press Inclinado', '3', '10-12', '50kg'),
                ('Fondos', '3', '10-12', 'Peso corporal'),
                ('Press Francés', '3', '12-15', '25kg'),
            ]),
            ('Miércoles', 'Espalda y Bíceps', [
                ('Dominadas', '4', '8-10', 'Peso corporal'),
                ('Remo con Barra', '4', '10-12', '60kg'),
                ('Curl con Barra', '3', '10-12', '25kg'),
                ('Curl Martillo', '3', '12-15', '12kg'),
            ]),
            ('Viernes', 'Pierna', [
                ('Sentadilla', '4', '10-12', '80kg'),
                ('Peso Muerto', '4', '8-10', '100kg'),
                ('Prensa', '3', '12-15', '120kg'),
                ('Curl Femoral', '3', '12-15', '35kg'),
            ]),
            ('Sábado', 'Hombro y Core', [
                ('Press Militar', '4', '10-12', '40kg'),
                ('Elevaciones Laterales', '3', '12-15', '10kg'),
                ('Remo al Mentón', '3', '12-15', '25kg'),
                ('Plancha', '3', '1 min', 'Peso corporal'),
            ]),
        ]
    
    # Insertar días y ejercicios
    for orden, (dia, grupo, ejercicios) in enumerate(dias_ejercicios, 1):
        cursor.execute("""
            INSERT INTO rutina_dias (id_rutina, dia_semana, grupo_muscular, orden)
            VALUES (%s, %s, %s, %s)
        """, (id_rutina, dia, grupo, orden))
        id_rutina_dia = cursor.lastrowid
        
        # Insertar ejercicios del día
        for ej_orden, (nombre_ej, series, reps, peso) in enumerate(ejercicios, 1):
            cursor.execute("""
                INSERT INTO rutina_ejercicios (id_rutina_dia, nombre_ejercicio, series, 
                                              repeticiones, peso, orden)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (id_rutina_dia, nombre_ej, series, reps, peso, ej_orden))

def crear_plan_alimenticio(cursor, conn, id_miembro, tipo_dieta_nombre, tipos_dieta, peso, sexo):
    """Crea un plan alimenticio personalizado con recetas"""
    
    # Obtener ID del tipo de dieta
    id_tipo_dieta = next((id_tipo for id_tipo, nombre in tipos_dieta if nombre == tipo_dieta_nombre), None)
    
    if not id_tipo_dieta:
        return
    
    # Calcular macros según objetivo
    if tipo_dieta_nombre == 'Hipercalórica':
        calorias = int(peso * 45)  # ~3000-3500 kcal
        proteinas = round(peso * 2.2, 2)
        carbos = round(peso * 5.5, 2)
        grasas = round(peso * 1.0, 2)
        objetivo = 'Aumento de masa muscular con superávit calórico controlado'
    elif tipo_dieta_nombre == 'Déficit Calórico':
        calorias = int(peso * 25)  # ~1500-2000 kcal
        proteinas = round(peso * 2.0, 2)
        carbos = round(peso * 2.0, 2)
        grasas = round(peso * 0.8, 2)
        objetivo = 'Pérdida de grasa manteniendo masa muscular'
    else:
        calorias = int(peso * 32)  # ~2000-2500 kcal
        proteinas = round(peso * 1.8, 2)
        carbos = round(peso * 3.5, 2)
        grasas = round(peso * 0.9, 2)
        objetivo = 'Mantenimiento y mejora de composición corporal'
    
    # Crear plan
    cursor.execute("""
        INSERT INTO planes_alimenticios (id_miembro, id_tipo_dieta, nombre_plan, objetivo,
                                        calorias_diarias, proteinas_diarias, carbohidratos_diarios,
                                        grasas_diarias, activo, fecha_creacion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (id_miembro, id_tipo_dieta, f"Plan {tipo_dieta_nombre}", objetivo,
          calorias, proteinas, carbos, grasas, 1, datetime.now() - timedelta(days=30)))
    id_plan = cursor.lastrowid
    
    # Obtener recetas del tipo de dieta
    cursor.execute("""
        SELECT id_receta, tipo_comida 
        FROM recetas 
        WHERE id_tipo_dieta = %s
        ORDER BY tipo_comida, id_receta
    """, (id_tipo_dieta,))
    recetas = cursor.fetchall()
    
    if not recetas:
        return
    
    # Organizar recetas por tipo de comida
    recetas_por_tipo = {}
    for id_receta, tipo_comida in recetas:
        if tipo_comida not in recetas_por_tipo:
            recetas_por_tipo[tipo_comida] = []
        recetas_por_tipo[tipo_comida].append(id_receta)
    
    # Asignar recetas a cada día de la semana
    dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    plan_recetas = []
    
    for dia in dias_semana:
        orden = 1
        # Asignar una receta de cada tipo de comida disponible
        for tipo_comida in ['Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena']:
            if tipo_comida in recetas_por_tipo and recetas_por_tipo[tipo_comida]:
                id_receta = random.choice(recetas_por_tipo[tipo_comida])
                plan_recetas.append((id_plan, id_receta, dia, orden))
                orden += 1
    
    # Insertar relaciones plan-recetas
    if plan_recetas:
        cursor.executemany("""
            INSERT INTO plan_recetas (id_plan, id_receta, dia_semana, orden)
            VALUES (%s, %s, %s, %s)
        """, plan_recetas)

def generar_sesiones_entrenamiento(cursor, conn, id_entrenador):
    """Genera sesiones de entrenamiento para los últimos 6 meses"""
    print("📅 Generando sesiones de entrenamiento (últimos 6 meses)...")
    
    # Obtener todos los miembros
    cursor.execute("SELECT id_miembro FROM miembros WHERE id_entrenador = %s", (id_entrenador,))
    miembros = [row[0] for row in cursor.fetchall()]
    
    if not miembros:
        return
    
    fecha_actual = datetime.now()
    fecha_inicio = fecha_actual - timedelta(days=MESES_ACTIVIDAD * 30)
    
    sesiones_data = []
    ubicaciones = ['Sala Principal', 'Box', 'Sala Cycling', 'Exterior', 'Sala 1']
    
    # Generar sesiones pasadas (últimos 6 meses)
    dias_pasados = (fecha_actual - fecha_inicio).days
    
    for dias_atras in range(dias_pasados, 0, -1):
        fecha_sesion = (fecha_actual - timedelta(days=dias_atras)).date()
        
        # 3-4 sesiones por día
        num_sesiones = random.randint(3, 4)
        
        for _ in range(num_sesiones):
            miembro = random.choice(miembros)
            hora_inicio = f"{random.randint(8, 18):02d}:{random.choice([0, 30]):02d}:00"
            duracion = random.choice([60, 90])
            ubicacion = random.choice(ubicaciones)
            
            # Sesiones pasadas están completadas o canceladas
            estado = random.choices(['completed', 'cancelled'], weights=[0.92, 0.08])[0]
            
            if estado == 'completed':
                notas = random.choice([
                    'Excelente progreso en fuerza',
                    'Mejoró técnica significativamente',
                    'Gran esfuerzo, completó la rutina',
                    'Avance notable en resistencia',
                    'Cliente muy motivado, buen trabajo'
                ])
                num_ejercicios = random.randint(8, 12)
                asistencia = 1
            else:
                notas = random.choice([
                    'Cliente canceló por enfermedad',
                    'Emergencia personal',
                    'Reprogramado'
                ])
                num_ejercicios = 0
                asistencia = 0
            
            sesiones_data.append((
                id_entrenador, miembro, fecha_sesion, hora_inicio,
                duracion, 'Personal', ubicacion, estado, None,
                notas, num_ejercicios, asistencia
            ))
    
    # Sesiones de hoy
    fecha_hoy = fecha_actual.date()
    for i in range(4):
        miembro = random.choice(miembros)
        hora_inicio = f"{(9 + i*2):02d}:00:00"
        duracion = 60
        ubicacion = random.choice(ubicaciones)
        
        if i < 2:
            estado = 'completed'
            notas = 'Sesión completada exitosamente'
            num_ejercicios = 10
            asistencia = 1
        elif i == 2:
            estado = 'in-progress'
            notas = None
            num_ejercicios = 0
            asistencia = 1
        else:
            estado = 'scheduled'
            notas = None
            num_ejercicios = 0
            asistencia = 0
        
        sesiones_data.append((
            id_entrenador, miembro, fecha_hoy, hora_inicio,
            duracion, 'Personal', ubicacion, estado, None,
            notas, num_ejercicios, asistencia
        ))
    
    # Sesiones futuras (próximos 14 días)
    for dias_adelante in range(1, 15):
        fecha_futura = (fecha_actual + timedelta(days=dias_adelante)).date()
        
        for _ in range(random.randint(3, 5)):
            miembro = random.choice(miembros)
            hora_inicio = f"{random.randint(8, 18):02d}:{random.choice([0, 30]):02d}:00"
            duracion = random.choice([60, 90])
            ubicacion = random.choice(ubicaciones)
            
            sesiones_data.append((
                id_entrenador, miembro, fecha_futura, hora_inicio,
                duracion, 'Personal', ubicacion, 'scheduled', None,
                None, 0, 0
            ))
    
    # Insertar sesiones en lotes
    batch_size = 1000
    for i in range(0, len(sesiones_data), batch_size):
        cursor.executemany("""
            INSERT INTO sesiones (id_entrenador, id_miembro, fecha, hora_inicio, duracion_minutos,
                                tipo, ubicacion, estado, nombre_sesion, notas, num_ejercicios, asistencia)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, sesiones_data[i:i+batch_size])
        conn.commit()
    
    print(f"   ✅ {len(sesiones_data)} sesiones generadas")

def generar_ventas(cursor, conn, productos):
    print("💰 Generando ventas...")
    
    for _ in range(30):
        fecha_venta = datetime.now() - timedelta(days=random.randint(0, MESES_ACTIVIDAD * 30))
        
        cursor.execute("INSERT INTO ventas (fecha, total) VALUES (%s, %s)", 
                      (fecha_venta, 0))
        id_venta = cursor.lastrowid
        
        total = 0
        for _ in range(random.randint(1, 3)):
            prod = random.choice(productos)
            cant = random.randint(1, 2)
            sub = float(prod[1]) * cant
            total += sub
            
            cursor.execute("""
                INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) 
                VALUES (%s, %s, %s, %s)
            """, (id_venta, prod[0], cant, sub))
        
        cursor.execute("UPDATE ventas SET total = %s WHERE id_venta = %s", (total, id_venta))
    
    conn.commit()
    print("   ✅ 30 ventas generadas")

def mostrar_estadisticas(cursor):
    print("\n" + "="*70)
    print("📊 RESUMEN COMPLETO DEL GIMNASIO")
    print("="*70)
    
    print("\n👥 USUARIOS:")
    cursor.execute("SELECT COUNT(*) FROM usuarios WHERE id_role = (SELECT id_role FROM roles WHERE nombre = 'Administrador')")
    print(f"   👨‍💼 Administradores: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM usuarios WHERE id_role = (SELECT id_role FROM roles WHERE nombre = 'Entrenador')")
    print(f"   👨‍🏫 Entrenadores: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM usuarios WHERE id_role = (SELECT id_role FROM roles WHERE nombre = 'Recepcionista')")
    print(f"   👩‍💼 Recepcionistas: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM miembros")
    print(f"   🏋️ Miembros: {cursor.fetchone()[0]}")
    
    print("\n📈 ACTIVIDAD:")
    cursor.execute("SELECT COUNT(*) FROM asistencias")
    print(f"   📍 Total asistencias: {cursor.fetchone()[0]:,}")
    
    cursor.execute("SELECT COUNT(*) FROM sesiones")
    total_sesiones = cursor.fetchone()[0]
    print(f"   📅 Total sesiones: {total_sesiones:,}")
    
    cursor.execute("SELECT COUNT(*) FROM sesiones WHERE estado = 'completed'")
    print(f"   ✅ Sesiones completadas: {cursor.fetchone()[0]:,}")
    
    cursor.execute("SELECT COUNT(*) FROM sesiones WHERE fecha = CURDATE()")
    print(f"   📆 Sesiones hoy: {cursor.fetchone()[0]}")
    
    print("\n🏋️ ENTRENAMIENTO:")
    cursor.execute("SELECT COUNT(*) FROM rutinas WHERE activa = 1")
    print(f"   📋 Rutinas activas: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM rutina_ejercicios")
    print(f"   💪 Total ejercicios programados: {cursor.fetchone()[0]}")
    
    print("\n🥗 NUTRICIÓN:")
    cursor.execute("SELECT COUNT(*) FROM planes_alimenticios WHERE activo = 1")
    print(f"   📊 Planes alimenticios activos: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) FROM recetas")
    print(f"   🍳 Recetas disponibles: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(DISTINCT id_tipo_dieta) FROM planes_alimenticios")
    print(f"   🎯 Tipos de dieta utilizados: {cursor.fetchone()[0]}")
    
    print("\n💰 VENTAS:")
    cursor.execute("SELECT COUNT(*) FROM ventas")
    print(f"   🛒 Total ventas: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COALESCE(SUM(total), 0) FROM ventas")
    print(f"   💵 Ingresos por productos: ${cursor.fetchone()[0]:,.2f}")
    
    print("\n💳 PAGOS:")
    cursor.execute("SELECT COUNT(*) FROM pagos")
    total_pagos = cursor.fetchone()[0]
    print(f"   📝 Total pagos registrados: {total_pagos}")
    
    cursor.execute("SELECT COALESCE(SUM(monto), 0) FROM pagos")
    total_ingresos = cursor.fetchone()[0]
    print(f"   💰 Ingresos por membresías: ${total_ingresos:,.2f}")
    
    cursor.execute("SELECT COALESCE(AVG(monto), 0) FROM pagos")
    print(f"   📊 Promedio por pago: ${cursor.fetchone()[0]:,.2f}")
    
    cursor.execute("""
        SELECT metodo_pago, COUNT(*) as total 
        FROM pagos 
        GROUP BY metodo_pago 
        ORDER BY total DESC
    """)
    print(f"   💳 Métodos de pago:")
    for metodo, count in cursor.fetchall():
        print(f"      - {metodo}: {count} pagos")
    
    print("\n" + "="*70)
    print("📧 CREDENCIALES DE ACCESO")
    print("="*70)
    print("🔑 Contraseña para todos: 123456\n")
    print("Administrador:")
    print("  📧 admin@gym.com\n")
    print("Entrenador:")
    print("  📧 entrenador@gym.com\n")
    print("Recepcionista:")
    print("  📧 recepcion@gym.com\n")
    print("Miembros Premium:")
    print("  📧 miembro1@gym.com - Juan Pérez (Dieta Hipercalórica)")
    print("  📧 miembro2@gym.com - María García (Déficit Calórico)")
    print("  📧 miembro3@gym.com - Pedro López (Dieta Vegana)")
    print("  📧 miembro4@gym.com - Ana Martínez (Mediterránea)")
    print("  📧 miembro5@gym.com - Carlos Rodríguez (Flexible)")
    print("="*70 + "\n")

def main():
    print("\n🚀 POBLACIÓN COMPLETA - SISTEMA DE GIMNASIO")
    print("="*70)
    print(f"📋 Configuración:")
    print(f"   - 1 Administrador + 1 Entrenador + 1 Recepcionista")
    print(f"   - 5 Miembros Premium (todos con el mismo entrenador)")
    print(f"   - {MESES_ACTIVIDAD} meses de historial de actividad")
    print(f"   - Rutinas personalizadas de entrenamiento")
    print(f"   - Planes alimenticios con recetas variadas")
    print("="*70 + "\n")
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        limpiar_base_datos(cursor, conn)
        insertar_datos_estaticos(cursor, conn)
        refs = obtener_ids_referencia(cursor)
        
        crear_administrador(cursor, conn, refs['roles']['admin'])
        id_entrenador = crear_personal(cursor, conn, refs['roles']['entrenador'], refs['roles']['recepcionista'])
        
        crear_miembros_premium(cursor, conn, refs['roles']['miembro'], id_entrenador, 
                              refs['membresias'], refs['productos'], refs['tipos_dieta'])
        
        generar_sesiones_entrenamiento(cursor, conn, id_entrenador)
        generar_ventas(cursor, conn, refs['productos'])
        
        mostrar_estadisticas(cursor)
        print("✅ ¡POBLACIÓN EXITOSA! Base de datos completamente configurada.\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()