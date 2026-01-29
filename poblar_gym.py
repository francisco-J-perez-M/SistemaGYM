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

CANTIDAD_MIEMBROS = 1500 
PROMEDIO_VENTAS = 2000    

fake = Faker('es_MX')
DEFAULT_PASSWORD = 'scrypt:32768:8:1$U1umhxfH8LDLojFb$7c6b302a3cdc30296572691480bfcad86209846fe6896a4f69c0f22caf58e23a85d8396fdce945a45fad84d8b27682c9e9f6919a4d7481bd912aa2d001470309'

def connect_db():
    return mysql.connector.connect(**DB_CONFIG)

def main():
    conn = connect_db()
    cursor = conn.cursor()
    
    print("🚀 Iniciando población de base de datos (Versión Final)...")
    
    # 1. OBTENER IDs DE REFERENCIA
    cursor.execute("SELECT id_role FROM roles WHERE nombre = 'Miembro'")
    res = cursor.fetchone()
    if not res:
        print("❌ Error: No existe el rol 'Miembro'. Ejecuta el script SQL primero.")
        return
    role_miembro_id = res[0]
    
    cursor.execute("SELECT id_membresia, precio, duracion_meses FROM membresias")
    membresias = cursor.fetchall()
    
    cursor.execute("SELECT id_producto, precio FROM productos")
    productos = cursor.fetchall()

    if not membresias or not productos:
        print("❌ Error: Faltan membresías o productos en la DB.")
        return

    # 2. GENERAR USUARIOS Y MIEMBROS
    print(f"👤 Generando e insertando {CANTIDAD_MIEMBROS} usuarios y miembros...")
    
    miembro_membresia_data = []
    pagos_data = []
    asistencias_data = []
    miembros_creados_info = []

    start_date_sim = datetime.now() - timedelta(days=180)

    sql_user = "INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo, fecha_creacion) VALUES (%s, %s, %s, %s, %s, %s)"
    sql_miembro = "INSERT INTO miembros (id_usuario, telefono, fecha_nacimiento, sexo, peso_inicial, estatura, fecha_registro, estado) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"

    for _ in range(CANTIDAD_MIEMBROS):
        # Datos Usuario
        sexo = random.choice(['M', 'F'])
        nombre = fake.name_male() if sexo == 'M' else fake.name_female()
        email = f"{fake.user_name()}{random.randint(1000,9999)}@{fake.free_email_domain()}"
        fecha_registro = fake.date_time_between(start_date=start_date_sim, end_date='now')
        
        # Insertar Usuario
        cursor.execute(sql_user, (role_miembro_id, nombre, email, DEFAULT_PASSWORD, 1, fecha_registro))
        id_usuario_generado = cursor.lastrowid
        
        # Datos Miembro
        if sexo == 'M':
            peso = round(random.uniform(65.0, 110.0), 2)
            estatura = round(random.uniform(1.65, 1.95), 2)
        else:
            peso = round(random.uniform(50.0, 85.0), 2)
            estatura = round(random.uniform(1.50, 1.75), 2)
            
        fecha_nac = fake.date_of_birth(minimum_age=16, maximum_age=60)
        telefono = fake.phone_number()[:20]
        
        # Insertar Miembro
        cursor.execute(sql_miembro, (id_usuario_generado, telefono, fecha_nac, sexo, peso, estatura, fecha_registro, 'Activo'))
        id_miembro_generado = cursor.lastrowid
        
        miembros_creados_info.append({
            'id': id_miembro_generado,
            'fecha_reg': fecha_registro
        })

    conn.commit()
    print("   ✅ Usuarios insertados.")

    # 3. GENERAR MEMBRESÍAS, PAGOS Y ASISTENCIAS
    print("💳 Generando historial de pagos y asistencias...")

    for m in miembros_creados_info:
        id_miembro = m['id']
        fecha_reg = m['fecha_reg']
        
        # Membresía
        memb = random.choice(membresias)
        id_memb, precio, duracion = memb
        
        fecha_fin = fecha_reg + timedelta(days=duracion*30)
        estado_m = 'Activa' if fecha_fin > datetime.now() else 'Vencida'
        
        miembro_membresia_data.append((id_miembro, id_memb, fecha_reg, fecha_fin, estado_m))
        
        # Pago
        metodo = random.choice(['Efectivo', 'Tarjeta', 'Transferencia'])
        pagos_data.append((id_miembro, precio, metodo, f"Pago Membresia {id_memb}", fecha_reg))
        
        # Asistencias (CORREGIDO EL ERROR AQUÍ)
        dias_desde_registro = (datetime.now() - fecha_reg).days
        
        if dias_desde_registro > 0:
            # Si se registró hace 60 días o más, tope es 60. Si fue hace 2 días, tope es 2.
            max_dias_posibles = min(dias_desde_registro, 60)
            
            # El mínimo no puede ser 5 si el máximo es 2.
            min_asistencias = 1 if max_dias_posibles < 5 else 5
            
            num_asistencias = random.randint(min_asistencias, max_dias_posibles)
            
            for _ in range(num_asistencias):
                dias_random = random.randint(0, dias_desde_registro)
                fecha_asistencia = fecha_reg + timedelta(days=dias_random)
                
                # Hora lógica de gimnasio (6am a 9pm)
                hora_entrada = datetime.strptime(f"{random.randint(6,21)}:{random.randint(0,59)}", "%H:%M")
                hora_salida = hora_entrada + timedelta(minutes=random.randint(45, 90))
                
                asistencias_data.append((id_miembro, fecha_asistencia.date(), hora_entrada.time(), hora_salida.time()))

    cursor.executemany("INSERT INTO miembro_membresia (id_miembro, id_membresia, fecha_inicio, fecha_fin, estado) VALUES (%s, %s, %s, %s, %s)", miembro_membresia_data)
    cursor.executemany("INSERT INTO pagos (id_miembro, monto, metodo_pago, concepto, fecha_pago) VALUES (%s, %s, %s, %s, %s)", pagos_data)
    conn.commit()

    print(f"🏋️  Insertando {len(asistencias_data)} asistencias...")
    batch_size = 5000
    sql_asist = "INSERT INTO asistencias (id_miembro, fecha, hora_entrada, hora_salida) VALUES (%s, %s, %s, %s)"
    for i in range(0, len(asistencias_data), batch_size):
        cursor.executemany(sql_asist, asistencias_data[i:i+batch_size])
        conn.commit()

    # 4. GENERAR VENTAS
    print("🥤 Generando ventas...")
    ventas_data = []
    detalles_data = []
    
    for _ in range(PROMEDIO_VENTAS):
        fecha_venta = fake.date_time_between(start_date=start_date_sim, end_date='now')
        ventas_data.append([fecha_venta, 0])

    cursor.executemany("INSERT INTO ventas (fecha, total) VALUES (%s, %s)", ventas_data)
    conn.commit()
    
    # Recuperar IDs de las ventas recién creadas
    # NOTA: Usamos ORDER BY ID DESC para asegurar que tomamos las últimas
    cursor.execute(f"SELECT id_venta FROM ventas ORDER BY id_venta DESC LIMIT {PROMEDIO_VENTAS}")
    # Fetchall devuelve [(id1,), (id2,)...], necesitamos lista plana
    ids_ventas = [row[0] for row in cursor.fetchall()]
    
    ventas_updates = []
    
    for id_venta in ids_ventas:
        total_venta = 0
        for _ in range(random.randint(1, 3)):
            prod = random.choice(productos)
            cantidad = random.randint(1, 2)
            subtotal = float(prod[1]) * cantidad
            total_venta += subtotal
            detalles_data.append((id_venta, prod[0], cantidad, subtotal))
        ventas_updates.append((total_venta, id_venta))

    cursor.executemany("INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES (%s, %s, %s, %s)", detalles_data)
    cursor.executemany("UPDATE ventas SET total = %s WHERE id_venta = %s", ventas_updates)
    conn.commit()

    print("✅ ¡Base de datos poblada exitosamente!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error Fatal: {e}")