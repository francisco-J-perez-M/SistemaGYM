import mysql.connector
from faker import Faker
import random
from datetime import datetime, timedelta, time

# ==========================================
# CONFIGURACIÓN
# ==========================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',      
    'password': '',      
    'database': 'gym_db'
}

fake = Faker('es_MX')

def connect_db():
    """Conecta a la base de datos"""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as err:
        print(f"❌ Error al conectar con la base de datos: {err}")
        exit(1)

def limpiar_datos_antiguos(cursor):
    """Limpia datos antiguos para evitar duplicados"""
    print("🧹 Limpiando datos antiguos...")
    
    # Eliminar asistencias de hace más de 60 días
    fecha_limite = datetime.now() - timedelta(days=60)
    cursor.execute("DELETE FROM asistencias WHERE fecha < %s", (fecha_limite.date(),))
    
    print(f"   ✅ Asistencias antiguas eliminadas")

def actualizar_membresias(cursor, conn):
    """Actualiza las fechas de las membresías para que estén activas"""
    print("📅 Actualizando membresías...")
    
    # Activar todos los usuarios y miembros
    cursor.execute("UPDATE usuarios SET activo = 1")
    cursor.execute("UPDATE miembros SET estado = 'Activo'")
    
    # Obtener todas las relaciones miembro_membresia
    cursor.execute("SELECT id_mm, id_membresia FROM miembro_membresia")
    membresias_asignadas = cursor.fetchall()
    
    # Obtener duración de cada tipo de membresía
    cursor.execute("SELECT id_membresia, duracion_meses FROM membresias")
    duraciones = dict(cursor.fetchall())
    
    updates_membresia = []
    fecha_hoy = datetime.now().date()
    
    for mm in membresias_asignadas:
        id_mm = mm[0]
        id_membresia = mm[1]
        
        # Fecha de inicio: entre 1 y 45 días atrás
        dias_atras = random.randint(1, 45)
        nueva_fecha_inicio = fecha_hoy - timedelta(days=dias_atras)
        
        # Calcular fecha fin según la duración de la membresía
        meses_duracion = duraciones.get(id_membresia, 1)
        nueva_fecha_fin = nueva_fecha_inicio + timedelta(days=meses_duracion * 30)
        
        # Determinar estado
        if nueva_fecha_fin < fecha_hoy:
            estado = 'Vencida'
        elif (nueva_fecha_fin - fecha_hoy).days <= 7:
            estado = 'Activa'  # Pero pronto a vencer
        else:
            estado = 'Activa'
        
        updates_membresia.append((nueva_fecha_inicio, nueva_fecha_fin, estado, id_mm))

    sql_update_mm = "UPDATE miembro_membresia SET fecha_inicio=%s, fecha_fin=%s, estado=%s WHERE id_mm=%s"
    cursor.executemany(sql_update_mm, updates_membresia)
    conn.commit()
    
    print(f"   ✅ {len(updates_membresia)} membresías actualizadas")

def generar_asistencias_inteligentes(cursor, conn):
    """Genera asistencias con patrones realistas"""
    print("🏋️ Generando asistencias realistas...")
    
    # Obtener miembros activos con sus fechas de membresía
    cursor.execute("""
        SELECT m.id_miembro, mm.fecha_inicio, mm.fecha_fin 
        FROM miembros m
        JOIN miembro_membresia mm ON m.id_miembro = mm.id_miembro
        WHERE m.estado = 'Activo' AND mm.estado = 'Activa'
    """)
    miembros = cursor.fetchall()
    
    if not miembros:
        print("❌ No se encontraron miembros activos con membresías")
        return

    nuevas_asistencias = []
    fecha_hoy = datetime.now().date()
    
    # Generar asistencias para los últimos 30 días
    for dias_atras in range(30):
        fecha_objetivo = fecha_hoy - timedelta(days=dias_atras)
        dia_semana = fecha_objetivo.weekday()  # 0=Lunes, 6=Domingo
        
        # Ajustar probabilidad según el día
        if dia_semana in [5, 6]:  # Fin de semana
            probabilidad_base = 0.25
        elif dia_semana in [0, 2, 4]:  # Lun, Mie, Vie (días pico)
            probabilidad_base = 0.60
        else:  # Mar, Jue
            probabilidad_base = 0.45
        
        for miembro_data in miembros:
            id_miembro = miembro_data[0]
            fecha_inicio_membresia = miembro_data[1]
            fecha_fin_membresia = miembro_data[2]
            
            # Solo generar asistencias si la membresía estaba activa ese día
            if not (fecha_inicio_membresia <= fecha_objetivo <= fecha_fin_membresia):
                continue
            
            # Simular diferentes niveles de compromiso
            nivel_compromiso = random.choices(
                ['alto', 'medio', 'bajo'],
                weights=[0.3, 0.5, 0.2],
                k=1
            )[0]

            
            if nivel_compromiso == 'alto':
                probabilidad = probabilidad_base * 1.5
            elif nivel_compromiso == 'bajo':
                probabilidad = probabilidad_base * 0.4
            else:
                probabilidad = probabilidad_base
            
            # Decidir si asiste ese día
            if random.random() < probabilidad:
                # Definir horarios según tipo de persona
                tipo_persona = random.choice(['mañanero', 'tarde', 'noche'])
                
                if tipo_persona == 'mañanero':
                    hora = random.randint(6, 9)
                elif tipo_persona == 'tarde':
                    hora = random.randint(14, 17)
                else:
                    hora = random.randint(18, 21)
                
                minuto = random.choice([0, 15, 30, 45])
                hora_entrada = time(hora, minuto)
                
                # Duración del entrenamiento
                duracion_minutos = random.randint(45, 120)
                
                # Calcular hora de salida
                entrada_datetime = datetime.combine(fecha_objetivo, hora_entrada)
                salida_datetime = entrada_datetime + timedelta(minutes=duracion_minutos)
                
                # Si es hoy y entró hace menos de 2 horas, aún no sale
                if fecha_objetivo == fecha_hoy and (datetime.now() - entrada_datetime).seconds < 7200:
                    hora_salida = None
                else:
                    hora_salida = salida_datetime.time()
                
                nuevas_asistencias.append((
                    id_miembro, 
                    fecha_objetivo, 
                    hora_entrada, 
                    hora_salida
                ))

    # Insertar en lotes para mejor rendimiento
    sql_asist = "INSERT INTO asistencias (id_miembro, fecha, hora_entrada, hora_salida) VALUES (%s, %s, %s, %s)"
    
    batch_size = 1000
    total_insertadas = 0
    
    for i in range(0, len(nuevas_asistencias), batch_size):
        batch = nuevas_asistencias[i:i+batch_size]
        cursor.executemany(sql_asist, batch)
        conn.commit()
        total_insertadas += len(batch)
        print(f"   📊 {total_insertadas}/{len(nuevas_asistencias)} asistencias insertadas...")
    
    print(f"   ✅ Total: {len(nuevas_asistencias)} asistencias generadas")

def generar_progreso_fisico(cursor, conn):
    """Genera registros de progreso físico realistas"""
    print("📊 Generando progreso físico...")
    
    # Obtener miembros con su peso inicial y estatura
    cursor.execute("""
        SELECT m.id_miembro, m.peso_inicial, m.estatura 
        FROM miembros m
        WHERE m.estado = 'Activo' AND m.peso_inicial IS NOT NULL
    """)
    miembros = cursor.fetchall()
    
    progresos = []
    fecha_hoy = datetime.now().date()
    
    for miembro_data in miembros:
        id_miembro = miembro_data[0]
        peso_inicial = float(miembro_data[1])
        estatura = float(miembro_data[2]) if miembro_data[2] else 170
        
        # Generar 3-5 mediciones distribuidas en el tiempo
        num_mediciones = random.randint(3, 5)
        
        peso_actual = peso_inicial
        
        for i in range(num_mediciones):
            # Fechas distribuidas: hace 60, 45, 30, 15, 7 días
            dias_atras = [60, 45, 30, 15, 7, 0][:num_mediciones][i]
            fecha_medicion = fecha_hoy - timedelta(days=dias_atras)
            
            # Simular cambio de peso (puede subir o bajar)
            if i > 0:
                # Cambio entre -2kg y +1.5kg por medición
                cambio = random.uniform(-2.0, 1.5)
                peso_actual += cambio
            
            # Calcular BMI
            estatura_metros = estatura / 100
            bmi = peso_actual / (estatura_metros ** 2)
            
            # Medidas corporales (simuladas)
            cintura = random.uniform(70, 100)
            cadera = random.uniform(85, 110)
            
            progresos.append((
                id_miembro,
                round(peso_actual, 2),
                round(bmi, 2),
                round(cintura, 2),
                round(cadera, 2),
                fecha_medicion
            ))
    
    # Insertar progresos
    sql_prog = """
        INSERT INTO progreso_fisico 
        (id_miembro, peso, bmi, cintura, cadera, fecha_registro) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    cursor.executemany(sql_prog, progresos)
    conn.commit()
    
    print(f"   ✅ {len(progresos)} registros de progreso generados")

def generar_ventas_recientes(cursor, conn):
    """Genera ventas de productos recientes"""
    print("💵 Generando ventas recientes...")
    
    # Verificar si hay productos
    cursor.execute("SELECT id_producto, precio FROM productos")
    productos = cursor.fetchall()
    
    if not productos:
        print("   ⚠️ No hay productos en la base de datos, saltando ventas...")
        return
    
    ventas_data = []
    detalles_data = []
    
    fecha_hoy = datetime.now()
    
    # Generar 50-80 ventas en los últimos 7 días
    num_ventas = random.randint(50, 80)
    
    for _ in range(num_ventas):
        # Fecha aleatoria en los últimos 7 días
        dias_atras = random.randint(0, 7)
        horas_atras = random.randint(0, 23)
        fecha_venta = fecha_hoy - timedelta(days=dias_atras, hours=horas_atras)
        
        ventas_data.append([fecha_venta, 0])  # total se calcula después

    # Insertar ventas
    cursor.executemany("INSERT INTO ventas (fecha, total) VALUES (%s, %s)", ventas_data)
    conn.commit()
    
    # Obtener los IDs de las ventas recién creadas
    cursor.execute("SELECT id_venta FROM ventas ORDER BY id_venta DESC LIMIT %s", (num_ventas,))
    ids_ventas = [row[0] for row in cursor.fetchall()]
    
    ventas_updates = []
    
    for id_venta in ids_ventas:
        total_venta = 0
        num_productos = random.randint(1, 3)  # 1 a 3 productos por venta
        
        for _ in range(num_productos):
            producto = random.choice(productos)
            cantidad = random.randint(1, 2)
            subtotal = float(producto[1]) * cantidad
            total_venta += subtotal
            
            detalles_data.append((id_venta, producto[0], cantidad, subtotal))
        
        ventas_updates.append((total_venta, id_venta))
    
    # Insertar detalles de venta
    cursor.executemany(
        "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES (%s, %s, %s, %s)", 
        detalles_data
    )
    
    # Actualizar totales
    cursor.executemany("UPDATE ventas SET total = %s WHERE id_venta = %s", ventas_updates)
    conn.commit()
    
    print(f"   ✅ {num_ventas} ventas generadas con {len(detalles_data)} productos vendidos")

def mostrar_estadisticas(cursor):
    """Muestra estadísticas finales"""
    print("\n" + "="*50)
    print("📈 ESTADÍSTICAS FINALES")
    print("="*50)
    
    # Miembros activos
    cursor.execute("SELECT COUNT(*) FROM miembros WHERE estado = 'Activo'")
    miembros_activos = cursor.fetchone()[0]
    print(f"👥 Miembros activos: {miembros_activos}")
    
    # Asistencias últimos 7 días
    fecha_limite = datetime.now() - timedelta(days=7)
    cursor.execute("SELECT COUNT(*) FROM asistencias WHERE fecha >= %s", (fecha_limite.date(),))
    asistencias_semana = cursor.fetchone()[0]
    print(f"🏋️ Asistencias (últimos 7 días): {asistencias_semana}")
    
    # Membresías activas
    cursor.execute("SELECT COUNT(*) FROM miembro_membresia WHERE estado = 'Activa'")
    membresias_activas = cursor.fetchone()[0]
    print(f"📋 Membresías activas: {membresias_activas}")
    
    # Progreso físico
    cursor.execute("SELECT COUNT(*) FROM progreso_fisico")
    registros_progreso = cursor.fetchone()[0]
    print(f"📊 Registros de progreso: {registros_progreso}")
    
    # Ventas últimos 7 días
    cursor.execute("SELECT COUNT(*), SUM(total) FROM ventas WHERE fecha >= %s", (fecha_limite,))
    ventas_data = cursor.fetchone()
    print(f"💰 Ventas (últimos 7 días): {ventas_data[0]} | Total: ${ventas_data[1] or 0:.2f}")
    
    print("="*50 + "\n")

def main():
    """Función principal"""
    print("\n" + "="*50)
    print("🚀 SCRIPT DE ACTUALIZACIÓN DE DATOS - GYM DASHBOARD")
    print("="*50 + "\n")
    
    conn = connect_db()
    cursor = conn.cursor()
    
    try:
        # Paso 1: Limpiar datos antiguos
        limpiar_datos_antiguos(cursor)
        conn.commit()
        
        # Paso 2: Actualizar membresías
        actualizar_membresias(cursor, conn)
        
        # Paso 3: Generar asistencias inteligentes
        generar_asistencias_inteligentes(cursor, conn)
        
        # Paso 4: Generar progreso físico
        generar_progreso_fisico(cursor, conn)
        
        # Paso 5: Generar ventas
        generar_ventas_recientes(cursor, conn)
        
        # Paso 6: Mostrar estadísticas
        mostrar_estadisticas(cursor)
        
        print("✅ ¡PROCESO COMPLETADO EXITOSAMENTE!")
        print("🎯 Tu dashboard ahora tiene datos actualizados y realistas\n")
        
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