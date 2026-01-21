import threading
import time
import os
import subprocess
from datetime import datetime

MYSQLDUMP_PATH = r"C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysqldump.exe"



BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
BACKUP_DIR = os.path.join(BASE_DIR, "storage", "backups")

backup_state = {
    "is_running": False,
    "progress_percentage": 0,
    "current_step": None,
    "start_time": None,
    "job_id": None,
    "last_backup": None,
}

def ensure_dirs(backup_type):
    path = os.path.join(BACKUP_DIR, backup_type)
    os.makedirs(path, exist_ok=True)
    return path

def run_backup(job_id: str, backup_type: str):
    backup_state.update({
        "is_running": True,
        "progress_percentage": 0,
        "current_step": "Preparando respaldo...",
        "start_time": datetime.utcnow(),
        "job_id": job_id,
    })

    backup_path = ensure_dirs(backup_type)
    filename = f"backup_{backup_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql"
    file_path = os.path.join(backup_path, filename)

    try:
        # 1️⃣ Preparación
        time.sleep(1)
        backup_state.update({
            "progress_percentage": 10,
            "current_step": "Generando dump de base de datos..."
        })

        # --- LÓGICA DE CONTRASEÑA CORREGIDA ---
        db_password = os.getenv('DB_PASSWORD')
        my_env = os.environ.copy()
        
        # Solo configuramos la variable de entorno SI hay contraseña.
        # Si está vacía (como en tu caso), no hacemos nada y mysqldump 
        # intentará conectar sin contraseña (lo cual es correcto para tu .env).
        if db_password:
            my_env["MYSQL_PWD"] = db_password

        # 2️⃣ Backup REAL de la BD
        with open(file_path, "w") as f:
            subprocess.run(
                [
                    MYSQLDUMP_PATH, # Tu variable con la ruta al .exe
                    "-u", os.getenv("DB_USER"),
                    os.getenv("DB_NAME"),
                    # NOTA: NO agregamos argumentos "-p" aquí.
                    # Si hay pass, mysqldump la lee de my_env.
                    # Si no hay pass, mysqldump conecta sin ella.
                ],
                env=my_env, 
                stdout=f,
                stderr=subprocess.PIPE,
                check=True
            )

        backup_state.update({
            "progress_percentage": 80,
            "current_step": "Finalizando respaldo..."
        })
        
        time.sleep(1)

        backup_state.update({
            "progress_percentage": 100,
            "current_step": "Backup completado",
            "last_backup": datetime.utcnow(),
        })

    except subprocess.CalledProcessError as e:
        # Capturamos el error específico del subproceso para ver qué dijo MySQL
        error_msg = e.stderr.decode('utf-8') if e.stderr else str(e)
        backup_state.update({
            "current_step": f"Error MySQL: {error_msg}",
            "progress_percentage": 0,
            "is_running": False
        })
        print(f"DEBUG ERROR: {error_msg}") # Para verlo en tu consola

    except Exception as e:
        backup_state.update({
            "current_step": f"Error general: {str(e)}",
            "progress_percentage": 0,
            "is_running": False
        })
        
    except Exception as e:
        backup_state.update({
            "current_step": f"Error: {str(e)}",
            "progress_percentage": 0,
        })

    finally:
        backup_state["is_running"] = False
