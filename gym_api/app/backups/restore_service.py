import os
import subprocess

MYSQL_PATH = r"C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysql.exe"

def restore_sql_backup(sql_file_path):
    if not os.path.exists(sql_file_path):
        raise Exception("Archivo SQL no existe")

    db_user = os.getenv("DB_USER")
    db_pass = os.getenv("DB_PASSWORD", "")
    # db_host = os.getenv("DB_HOST", "localhost") # Opcional si usas conexión remota
    db_name = os.getenv("DB_NAME")

    env = os.environ.copy()
    if db_pass:
        env["MYSQL_PWD"] = db_pass

    # --- PASO 1: Crear la DB si no existe ---
    # Ejecutamos mysql con el flag -e (execute) para correr el comando SQL de creación.
    # Nota: No pasamos db_name como argumento de conexión, sino dentro del query.
    try:
        subprocess.run(
            [MYSQL_PATH, "-u", db_user, "-e", f"CREATE DATABASE IF NOT EXISTS `{db_name}`"],
            env=env,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    except subprocess.CalledProcessError as e:
        # Capturamos el error específico de creación para entender qué pasó
        raise Exception(f"Error al intentar crear la base de datos: {e.stderr.decode('utf-8', errors='ignore')}")

    # --- PASO 2: Restaurar el respaldo ---
    # Ahora que sabemos que la DB existe, procedemos con la carga del archivo.
    with open(sql_file_path, "r", encoding="utf-8") as f:
        subprocess.run(
            [MYSQL_PATH, "-u", db_user, db_name],
            stdin=f,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            check=True
        )