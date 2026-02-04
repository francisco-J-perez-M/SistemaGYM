import mysql.connector
from faker import Faker
import random
from datetime import datetime, timedelta
import os

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
CANTIDAD_MIEMBROS = 500  # Para llegar a ~1000 con admin, entrenadores y recepcionista
CANTIDAD_ENTRENADORES = 10
CANTIDAD_RECEPCIONISTAS = 1

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
    
    # Orden correcto para evitar errores de FK
    tablas = [
        'rutina_ejercicios',
        'rutina_dias',
        'rutinas',
        'correo_miembro',
        'detalle_venta',
        'progreso_fisico',
        'asistencias',
        'pagos',
        'miembro_membresia',
        'correos_enviados',
        'ventas',
        'gastos',
        'miembros',
        'usuarios',
        'productos',
        'membresias',
        'roles'
    ]
    
    cursor.execute("SET FOREIGN_KEY_CHECKS=0")
    for tabla in tablas:
        cursor.execute(f"TRUNCATE TABLE {tabla}")
    cursor.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    
    print("   ✅ Base de datos limpia")

def insertar_datos_estaticos(cursor, conn):
    """Inserta roles, membresías y productos"""
    print("📋 Insertando datos estáticos...")
    
    # Roles
    roles = [
        ('Administrador',),
        ('Entrenador',),
        ('Recepcionista',),
        ('Miembro',)
    ]
    cursor.executemany("INSERT INTO roles (nombre) VALUES (%s)", roles)
    
    # Membresías
    membresias = [
        ('Básica Mensual', 1, 80.00),
        ('Premium Mensual', 1, 90.00),
        ('Básica Anual', 12, 300.00),
        ('Premium Anual', 12, 550.00),
        ('Estudiante', 1, 25.00),
        ('Familiar', 1, 80.00),
        ('VIP', 1, 100.00)
    ]
    cursor.executemany(
        "INSERT INTO membresias (nombre, duracion_meses, precio) VALUES (%s, %s, %s)", 
        membresias
    )
    
    # Productos
    productos = [
        ('Proteína Whey 1kg', 450.00, 50),
        ('Creatina 300g', 280.00, 30),
        ('BCAA 200 caps', 320.00, 25),
        ('Pre-Workout', 380.00, 20),
        ('Shaker 600ml', 80.00, 100),
        ('Toalla deportiva', 120.00, 60),
        ('Guantes gimnasio', 150.00, 40),
        ('Botella agua 1L', 95.00, 80),
        ('Barra proteína', 35.00, 200),
        ('Electrolitos', 180.00, 45)
    ]
    cursor.executemany(
        "INSERT INTO productos (nombre, precio, stock) VALUES (%s, %s, %s)", 
        productos
    )
    
    conn.commit()
    print("   ✅ Datos estáticos insertados")

def obtener_ids_referencia(cursor):
    """Obtiene IDs necesarios para las relaciones"""
    # Roles
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Administrador'")
    id_admin = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Entrenador'")
    id_entrenador = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Recepcionista'")
    id_recepcionista = cursor.fetchone()[0]
    
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Miembro'")
    id_miembro = cursor.fetchone()[0]
    
    # Membresías
    cursor.execute("SELECT id_membresia, precio, duracion_meses FROM membresias")
    membresias = cursor.fetchall()
    
    # Productos
    cursor.execute("SELECT id_producto, precio FROM productos")
    productos = cursor.fetchall()
    
    return {
        'roles': {
            'admin': id_admin,
            'entrenador': id_entrenador,
            'recepcionista': id_recepcionista,
            'miembro': id_miembro
        },
        'membresias': membresias,
        'productos': productos
    }

def crear_administrador(cursor, conn, id_role_admin):
    """Crea el usuario administrador"""
    print("👨‍💼 Creando administrador...")
    
    sql_user = """
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    fecha_creacion = datetime.now() - timedelta(days=365)
    
    cursor.execute(sql_user, (
        id_role_admin,
        'Carlos Admin',
        'admin@gym.com',
        DEFAULT_PASSWORD,
        1,
        fecha_creacion
    ))
    
    conn.commit()
    print("   ✅ Administrador creado")

def crear_personal(cursor, conn, id_role_entrenador, id_role_recepcionista):
    """Crea entrenadores y recepcionistas"""
    print(f"👨‍🏫 Creando {CANTIDAD_ENTRENADORES} entrenadores y {CANTIDAD_RECEPCIONISTAS} recepcionista(s)...")
    
    sql_user = """
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    personal_data = []
    
    # Entrenadores
    for i in range(CANTIDAD_ENTRENADORES):
        sexo = random.choice(['M', 'F'])
        nombre = fake.name_male() if sexo == 'M' else fake.name_female()
        email = f"entrenador{i+1}@gym.com"
        fecha_creacion = fake.date_time_between(start_date='-2y', end_date='-6m')
        
        personal_data.append((
            id_role_entrenador,
            nombre,
            email,
            DEFAULT_PASSWORD,
            1,
            fecha_creacion
        ))
    
    # Recepcionistas
    for i in range(CANTIDAD_RECEPCIONISTAS):
        sexo = random.choice(['M', 'F'])
        nombre = fake.name_female() if sexo == 'F' else fake.name_male()
        email = f"recepcion{i+1}@gym.com"
        fecha_creacion = fake.date_time_between(start_date='-2y', end_date='-6m')
        
        personal_data.append((
            id_role_recepcionista,
            nombre,
            email,
            DEFAULT_PASSWORD,
            1,
            fecha_creacion
        ))
    
    cursor.executemany(sql_user, personal_data)
    conn.commit()
    
    print(f"   ✅ Personal creado")

def crear_miembros_y_datos(cursor, conn, id_role_miembro, membresias, productos):
    """Crea miembros con todos sus datos relacionados"""
    print(f"👥 Creando {CANTIDAD_MIEMBROS} miembros con datos completos...")
    
    sql_user = """
        INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    sql_miembro = """
        INSERT INTO miembros (id_usuario, telefono, fecha_nacimiento, sexo, peso_inicial, 
                             estatura, fecha_registro, estado, foto_perfil) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    # Listas para datos masivos
    miembros_data = []
    membresias_data = []
    pagos_data = []
    asistencias_data = []
    progreso_data = []
    
    fecha_actual = datetime.now()
    
    for i in range(CANTIDAD_MIEMBROS):
        # Datos de usuario
        sexo = random.choice(['M', 'F'])
        nombre = fake.name_male() if sexo == 'M' else fake.name_female()
        email = f"{fake.user_name()}{random.randint(1000,9999)}@{fake.free_email_domain()}"
        
        # Fecha de registro entre 6 meses y 2 años atrás
        fecha_registro = fake.date_time_between(start_date='-2y', end_date='-1m')
        
        # Insertar usuario
        cursor.execute(sql_user, (
            id_role_miembro,
            nombre,
            email,
            DEFAULT_PASSWORD,
            1,
            fecha_registro
        ))
        id_usuario = cursor.lastrowid
        
        # Datos de miembro
        telefono = fake.phone_number()[:20]
        fecha_nacimiento = fake.date_of_birth(minimum_age=16, maximum_age=65)
        
        # Peso y estatura según sexo
        if sexo == 'M':
            peso_inicial = round(random.uniform(65.0, 110.0), 2)
            estatura = round(random.uniform(1.65, 1.95), 2)
            foto_perfil = 'male.jpg'
        else:
            peso_inicial = round(random.uniform(50.0, 85.0), 2)
            estatura = round(random.uniform(1.50, 1.75), 2)
            foto_perfil = 'female.jpg'
        
        # Insertar miembro
        cursor.execute(sql_miembro, (
            id_usuario,
            telefono,
            fecha_nacimiento,
            sexo,
            peso_inicial,
            estatura,
            fecha_registro.date(),
            'Activo',
            foto_perfil
        ))
        id_miembro = cursor.lastrowid
        
        # === MEMBRESÍA ===
        membresia = random.choice(membresias)
        id_membresia, precio_membresia, duracion_meses = membresia
        
        # Calcular fechas de membresía
        dias_desde_registro = (fecha_actual - fecha_registro).days
        inicio_membresia_dias = random.randint(0, min(dias_desde_registro, 45))
        fecha_inicio_memb = fecha_registro + timedelta(days=inicio_membresia_dias)
        fecha_fin_memb = fecha_inicio_memb + timedelta(days=duracion_meses * 30)
        
        # Estado de membresía
        if fecha_fin_memb > fecha_actual:
            estado_memb = 'Activa'
        elif (fecha_actual - fecha_fin_memb).days <= 30:
            estado_memb = 'Vencida'
        else:
            estado_memb = 'Cancelada'
        
        membresias_data.append((
            id_miembro,
            id_membresia,
            fecha_inicio_memb.date(),
            fecha_fin_memb.date(),
            estado_memb
        ))
        
        # === PAGO DE MEMBRESÍA ===
        metodo_pago = random.choice(['Efectivo', 'Tarjeta', 'Transferencia'])
        pagos_data.append((
            id_miembro,
            precio_membresia,
            metodo_pago,
            f"Pago Membresía {membresia[0]}",
            fecha_inicio_memb
        ))
        
        # === ASISTENCIAS ===
        # Generar asistencias realistas
        dias_activo = min((fecha_actual - fecha_inicio_memb).days, 90)
        
        if dias_activo > 0 and estado_memb == 'Activa':
            # Nivel de compromiso del miembro
            nivel = random.choices(
                ['alto', 'medio', 'bajo'],
                weights=[0.3, 0.5, 0.2]
            )[0]
            
            if nivel == 'alto':
                frecuencia_semanal = random.randint(4, 6)
            elif nivel == 'medio':
                frecuencia_semanal = random.randint(2, 4)
            else:
                frecuencia_semanal = random.randint(1, 2)
            
            # Generar asistencias en los últimos 60 días
            for dia in range(min(dias_activo, 60)):
                fecha_dia = fecha_actual.date() - timedelta(days=dia)
                
                # Verificar si asiste ese día
                dia_semana = fecha_dia.weekday()
                
                # Mayor probabilidad lunes, miércoles, viernes
                if dia_semana in [0, 2, 4]:
                    prob_base = 0.7
                elif dia_semana in [5, 6]:  # Fin de semana
                    prob_base = 0.3
                else:
                    prob_base = 0.5
                
                if random.random() < (prob_base * (frecuencia_semanal / 5)):
                    # Hora de entrada
                    tipo_horario = random.choice(['mañana', 'tarde', 'noche'])
                    
                    if tipo_horario == 'mañana':
                        hora = random.randint(6, 10)
                    elif tipo_horario == 'tarde':
                        hora = random.randint(14, 17)
                    else:
                        hora = random.randint(18, 21)
                    
                    minuto = random.choice([0, 15, 30, 45])
                    hora_entrada = f"{hora:02d}:{minuto:02d}:00"
                    
                    # Duración 45-120 minutos
                    duracion = random.randint(45, 120)
                    entrada_dt = datetime.combine(fecha_dia, datetime.strptime(hora_entrada, "%H:%M:%S").time())
                    salida_dt = entrada_dt + timedelta(minutes=duracion)
                    
                    # Si es hoy y hace menos de 2 horas, no ha salido
                    if fecha_dia == fecha_actual.date() and (fecha_actual - entrada_dt).seconds < 7200:
                        hora_salida = None
                    else:
                        hora_salida = salida_dt.strftime("%H:%M:%S")
                    
                    asistencias_data.append((
                        id_miembro,
                        fecha_dia,
                        hora_entrada,
                        hora_salida
                    ))
        
        # === PROGRESO FÍSICO ===
        # 3-5 mediciones distribuidas en el tiempo
        num_mediciones = random.randint(3, 5)
        peso_actual = peso_inicial
        
        for idx in range(num_mediciones):
            dias_atras = [60, 45, 30, 15, 7][:num_mediciones][idx]
            fecha_medicion = fecha_actual - timedelta(days=dias_atras)
            
            # Cambio progresivo de peso
            if idx > 0:
                cambio = random.uniform(-1.5, 1.0)
                peso_actual += cambio
            
            # Calcular BMI
            estatura_m = estatura / 100
            bmi = peso_actual / (estatura_m ** 2)
            
            # Porcentajes realistas según sexo
            if sexo == 'M':
                grasa = round(random.uniform(12.0, 25.0), 2)
                masa_muscular = round(random.uniform(35.0, 50.0), 2)
            else:
                grasa = round(random.uniform(18.0, 32.0), 2)
                masa_muscular = round(random.uniform(28.0, 40.0), 2)
            
            agua = round(random.uniform(50.0, 65.0), 2)
            masa_osea = round(random.uniform(2.5, 4.0), 2)
            
            # Medidas corporales
            cintura = round(random.uniform(70.0, 100.0), 2)
            cadera = round(random.uniform(85.0, 115.0), 2)
            pecho = round(random.uniform(80.0, 110.0), 2)
            brazo_d = round(random.uniform(25.0, 40.0), 2)
            brazo_i = round(random.uniform(25.0, 40.0), 2)
            muslo_d = round(random.uniform(45.0, 65.0), 2)
            muslo_i = round(random.uniform(45.0, 65.0), 2)
            pantorrilla = round(random.uniform(30.0, 42.0), 2)
            
            progreso_data.append((
                id_miembro,
                round(peso_actual, 2),
                round(bmi, 2),
                grasa,
                masa_muscular,
                agua,
                masa_osea,
                cintura,
                cadera,
                pecho,
                brazo_d,
                brazo_i,
                muslo_d,
                muslo_i,
                pantorrilla,
                fecha_medicion.date()
            ))
        
        # Mostrar progreso cada 100 miembros
        if (i + 1) % 100 == 0:
            print(f"   📊 {i + 1}/{CANTIDAD_MIEMBROS} miembros procesados...")
    
    # === INSERCIÓN MASIVA ===
    print("   💾 Insertando datos relacionados...")
    
    # Membresías
    cursor.executemany(
        "INSERT INTO miembro_membresia (id_miembro, id_membresia, fecha_inicio, fecha_fin, estado) VALUES (%s, %s, %s, %s, %s)",
        membresias_data
    )
    
    # Pagos
    cursor.executemany(
        "INSERT INTO pagos (id_miembro, monto, metodo_pago, concepto, fecha_pago) VALUES (%s, %s, %s, %s, %s)",
        pagos_data
    )
    
    # Asistencias en lotes
    print(f"   🏋️ Insertando {len(asistencias_data)} asistencias...")
    batch_size = 5000
    for i in range(0, len(asistencias_data), batch_size):
        batch = asistencias_data[i:i+batch_size]
        cursor.executemany(
            "INSERT INTO asistencias (id_miembro, fecha, hora_entrada, hora_salida) VALUES (%s, %s, %s, %s)",
            batch
        )
        conn.commit()
    
    # Progreso físico
    cursor.executemany(
        """INSERT INTO progreso_fisico (id_miembro, peso, bmi, grasa_corporal, masa_muscular, 
           agua_corporal, masa_osea, cintura, cadera, pecho, brazo_derecho, brazo_izquierdo,
           muslo_derecho, muslo_izquierdo, pantorrilla, fecha_registro) 
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
        progreso_data
    )
    
    conn.commit()
    print("   ✅ Miembros y datos completos insertados")

def generar_ventas(cursor, conn, productos):
    """Genera ventas de productos"""
    print("💰 Generando ventas...")
    
    num_ventas = random.randint(150, 250)
    fecha_actual = datetime.now()
    
    ventas_data = []
    detalles_data = []
    
    for _ in range(num_ventas):
        # Fecha aleatoria últimos 30 días
        dias_atras = random.randint(0, 30)
        fecha_venta = fecha_actual - timedelta(days=dias_atras, hours=random.randint(0, 23))
        
        ventas_data.append([fecha_venta, 0])
    
    # Insertar ventas
    cursor.executemany("INSERT INTO ventas (fecha, total) VALUES (%s, %s)", ventas_data)
    conn.commit()
    
    # Obtener IDs de ventas
    cursor.execute(f"SELECT id_venta FROM ventas ORDER BY id_venta DESC LIMIT {num_ventas}")
    ids_ventas = [row[0] for row in cursor.fetchall()]
    
    ventas_updates = []
    
    for id_venta in ids_ventas:
        total_venta = 0
        num_productos = random.randint(1, 4)
        
        for _ in range(num_productos):
            producto = random.choice(productos)
            cantidad = random.randint(1, 3)
            subtotal = float(producto[1]) * cantidad
            total_venta += subtotal
            
            detalles_data.append((id_venta, producto[0], cantidad, subtotal))
        
        ventas_updates.append((total_venta, id_venta))
    
    cursor.executemany(
        "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES (%s, %s, %s, %s)",
        detalles_data
    )
    
    cursor.executemany("UPDATE ventas SET total = %s WHERE id_venta = %s", ventas_updates)
    conn.commit()
    
    print(f"   ✅ {num_ventas} ventas generadas")

def generar_gastos(cursor, conn):
    """Genera gastos del gimnasio"""
    print("📉 Generando gastos...")
    
    gastos_comunes = [
        ('Renta del local', 15000.00),
        ('Luz', 3500.00),
        ('Agua', 800.00),
        ('Internet', 600.00),
        ('Mantenimiento equipos', 2500.00),
        ('Limpieza', 2000.00),
        ('Sueldos personal', 45000.00),
        ('Compra de productos', 8000.00)
    ]
    
    gastos_data = []
    fecha_actual = datetime.now()
    
    for _ in range(3):  # Últimos 3 meses
        mes_atras = fecha_actual - timedelta(days=30 * _)
        
        for gasto in gastos_comunes:
            descripcion, monto_base = gasto
            monto = round(monto_base * random.uniform(0.9, 1.1), 2)
            
            gastos_data.append((
                descripcion,
                monto,
                mes_atras.date()
            ))
    
    cursor.executemany(
        "INSERT INTO gastos (descripcion, monto, fecha) VALUES (%s, %s, %s)",
        gastos_data
    )
    conn.commit()
    
    print(f"   ✅ {len(gastos_data)} gastos generados")

def mostrar_estadisticas(cursor):
    """Muestra estadísticas finales"""
    print("\n" + "="*60)
    print("📊 ESTADÍSTICAS FINALES")
    print("="*60)
    
    cursor.execute("SELECT COUNT(*) FROM usuarios")
    total_usuarios = cursor.fetchone()[0]
    print(f"👥 Total usuarios: {total_usuarios}")
    
    cursor.execute("SELECT COUNT(*) FROM miembros WHERE estado = 'Activo'")
    miembros_activos = cursor.fetchone()[0]
    print(f"💪 Miembros activos: {miembros_activos}")
    
    cursor.execute("SELECT COUNT(*) FROM miembro_membresia WHERE estado = 'Activa'")
    membresias_activas = cursor.fetchone()[0]
    print(f"📋 Membresías activas: {membresias_activas}")
    
    cursor.execute("SELECT COUNT(*) FROM asistencias")
    total_asistencias = cursor.fetchone()[0]
    print(f"🏋️ Total asistencias: {total_asistencias}")
    
    cursor.execute("SELECT COUNT(*) FROM progreso_fisico")
    total_progreso = cursor.fetchone()[0]
    print(f"📈 Registros de progreso: {total_progreso}")
    
    cursor.execute("SELECT COUNT(*), SUM(total) FROM ventas")
    ventas_info = cursor.fetchone()
    print(f"💰 Ventas: {ventas_info[0]} | Total: ${ventas_info[1]:.2f}")
    
    cursor.execute("SELECT SUM(monto) FROM pagos")
    total_ingresos = cursor.fetchone()[0]
    print(f"💵 Ingresos por membresías: ${total_ingresos:.2f}")
    
    print("="*60 + "\n")

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("🚀 SCRIPT DE POBLACIÓN COMPLETA - GYM DATABASE")
    print("="*60 + "\n")
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # 1. Limpiar base de datos
        limpiar_base_datos(cursor, conn)
        
        # 2. Insertar datos estáticos
        insertar_datos_estaticos(cursor, conn)
        
        # 3. Obtener IDs de referencia
        refs = obtener_ids_referencia(cursor)
        
        # 4. Crear administrador
        crear_administrador(cursor, conn, refs['roles']['admin'])
        
        # 5. Crear personal
        crear_personal(cursor, conn, refs['roles']['entrenador'], refs['roles']['recepcionista'])
        
        # 6. Crear miembros con datos completos
        crear_miembros_y_datos(
            cursor, 
            conn, 
            refs['roles']['miembro'], 
            refs['membresias'], 
            refs['productos']
        )
        
        # 7. Generar ventas
        generar_ventas(cursor, conn, refs['productos'])
        
        # 8. Generar gastos
        generar_gastos(cursor, conn)
        
        # 9. Mostrar estadísticas
        mostrar_estadisticas(cursor)
        
        print("✅ ¡POBLACIÓN COMPLETADA EXITOSAMENTE!")
        print("🎯 Base de datos lista con datos realistas y completos\n")
        
    except Exception as e:
        print(f"\n❌ Error durante la ejecución: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()