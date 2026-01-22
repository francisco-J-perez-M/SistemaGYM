import os
import subprocess
import json
import pandas as pd
from fpdf import FPDF
from datetime import datetime
from flask_mail import Message
from sqlalchemy import create_engine, text
from app.extensions import mail

# ================= CONFIG =================

MYSQLDUMP_PATH = r"C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysqldump.exe"

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../"))
BACKUP_DIR = os.path.join(BASE_DIR, "storage", "backups")

LAST_FULL_BACKUP_FILE = os.path.join(BACKUP_DIR, "last_full_backup.txt")
LAST_BACKUP_FILE = os.path.join(BACKUP_DIR, "last_backup_any.txt")
HISTORY_FILE = os.path.join(BACKUP_DIR, "backup_history.json")

# ================= STATE =================

backup_state = {
    "is_running": False,
    "progress_percentage": 0,
    "current_step": None,
    "start_time": None,
    "job_id": None,
    "last_backup": None,
    "generated_files": {}
}

# ================= UTILS =================

def ensure_dirs(backup_type):
    path = os.path.join(BACKUP_DIR, backup_type)
    os.makedirs(path, exist_ok=True)
    return path

def now_str():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def save_last_backup(path):
    with open(path, "w") as f:
        f.write(datetime.now().isoformat())

def get_last_backup(path):
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return f.read().strip()

# ================= HISTORY =================

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_history(entry):
    history = load_history()
    history.insert(0, entry)
    history = history[:10]  # máximo 10 registros
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

# ================= EXCEL =================

def generate_excel(connection_str, output_path, since_date=None):
    engine = create_engine(connection_str)
    with engine.connect() as conn:
        # Obtener lista de tablas
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]

        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            for table in tables:
                try:
                    # Verificar si la tabla tiene columna updated_at
                    columns_result = conn.execute(text(f"SHOW COLUMNS FROM `{table}`"))
                    columns = [row[0] for row in columns_result]
                    
                    if since_date and "updated_at" in columns:
                        # Backup incremental/diferencial
                        query = text(f"SELECT * FROM `{table}` WHERE updated_at >= :since_date")
                        df = pd.read_sql(query, conn, params={"since_date": since_date})
                    else:
                        # Backup completo o tabla sin updated_at
                        query = text(f"SELECT * FROM `{table}`")
                        df = pd.read_sql(query, conn)
                    
                    if not df.empty:
                        # Limitar nombre de hoja a 31 caracteres
                        sheet_name = table[:31]
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                except Exception as e:
                    print(f"Error procesando tabla {table}: {e}")
                    continue

# ================= PDF =================

def generate_pdf(connection_str, output_path, since_date=None, mode="FULL"):
    engine = create_engine(connection_str)
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    pdf.cell(0, 10, f"Reporte de Respaldo {mode}", ln=True, align="C")
    pdf.cell(0, 8, f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)

    if since_date:
        pdf.cell(0, 8, f"Desde: {since_date}", ln=True)

    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]

        for table in tables:
            try:
                columns_result = conn.execute(text(f"SHOW COLUMNS FROM `{table}`"))
                columns = [row[0] for row in columns_result]
                
                if since_date and "updated_at" in columns:
                    query = text(f"SELECT * FROM `{table}` WHERE updated_at >= :since_date LIMIT 20")
                    result = conn.execute(query, {"since_date": since_date})
                else:
                    query = text(f"SELECT * FROM `{table}` LIMIT 20")
                    result = conn.execute(query)
                
                rows = result.fetchall()
                
                if not rows:
                    continue

                pdf.ln(5)
                pdf.set_font("Arial", "B", 11)
                pdf.cell(0, 8, f"Tabla: {table}", ln=True)
                pdf.set_font("Arial", size=8)
                
                # Mostrar primeras filas
                pdf.multi_cell(0, 5, f"Registros: {len(rows)}")
                
            except Exception as e:
                print(f"Error en PDF para tabla {table}: {e}")
                continue

    pdf.output(output_path)

# ================= SQL =================

def generate_incremental_sql(connection_str, output_path, since_date):
    engine = create_engine(connection_str)
    with engine.connect() as conn, open(output_path, "w", encoding="utf-8") as f:
        f.write(f"-- Backup Incremental desde {since_date}\n")
        f.write(f"-- Generado: {datetime.now().isoformat()}\n\n")
        
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]

        for table in tables:
            try:
                # Verificar si tiene updated_at
                columns_result = conn.execute(text(f"SHOW COLUMNS FROM `{table}`"))
                columns = [row[0] for row in columns_result]
                
                if "updated_at" not in columns:
                    continue

                # Obtener datos modificados
                query = text(f"SELECT * FROM `{table}` WHERE updated_at >= :since_date")
                result = conn.execute(query, {"since_date": since_date})
                rows = result.fetchall()
                
                if not rows:
                    continue
                
                f.write(f"-- Tabla: {table}\n")
                
                for row in rows:
                    cols = ", ".join([f"`{col}`" for col in columns])
                    values = []
                    
                    for val in row:
                        if val is None:
                            values.append("NULL")
                        elif isinstance(val, (int, float)):
                            values.append(str(val))
                        else:
                            # Escapar comillas simples
                            escaped = str(val).replace("'", "''")
                            values.append(f"'{escaped}'")
                    
                    values_str = ", ".join(values)
                    f.write(f"INSERT INTO `{table}` ({cols}) VALUES ({values_str});\n")
                
                f.write("\n")
                
            except Exception as e:
                f.write(f"-- Error en tabla {table}: {e}\n")
                print(f"Error procesando tabla {table}: {e}")
                continue

# ================= EMAIL =================

def send_email_with_attachments(app, files, backup_type):
    try:
        recipient = app.config.get("MAIL_RECIPIENT") or app.config.get("MAIL_USERNAME")

        msg = Message(
            subject=f"[Backup] Respaldo {backup_type.upper()} generado",
            sender=app.config.get("MAIL_USERNAME"),
            recipients=[recipient],
            body=f"El respaldo {backup_type} se generó correctamente.\n\nFecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )

        for file_type, file_path in files.items():
            if os.path.exists(file_path):
                with open(file_path, "rb") as f:
                    msg.attach(
                        os.path.basename(file_path), 
                        "application/octet-stream", 
                        f.read()
                    )

        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False

# ================= MAIN =================

def run_backup(job_id: str, backup_type: str, app):
    with app.app_context():
        backup_state.update({
            "is_running": True,
            "progress_percentage": 10,
            "current_step": "Iniciando respaldo",
            "job_id": job_id,
            "generated_files": {}
        })

        try:
            timestamp = now_str()
            path = ensure_dirs(backup_type)

            db_user = os.getenv("DB_USER")
            db_pass = os.getenv("DB_PASSWORD", "")
            db_host = os.getenv("DB_HOST", "localhost")
            db_name = os.getenv("DB_NAME")
            db_uri = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}"

            sql = None
            xlsx = None
            pdf = None
            file_size = 0

            if backup_type == "full":
                backup_state["current_step"] = "Generando backup completo SQL"
                backup_state["progress_percentage"] = 20
                
                sql = os.path.join(path, f"backup_full_{timestamp}.sql")
                xlsx = os.path.join(path, f"backup_full_{timestamp}.xlsx")
                pdf = os.path.join(path, f"backup_full_{timestamp}.pdf")

                env = os.environ.copy()
                if db_pass:
                    env["MYSQL_PWD"] = db_pass

                with open(sql, "w", encoding="utf-8") as f:
                    subprocess.run(
                        [MYSQLDUMP_PATH, "-u", db_user, db_name],
                        stdout=f, stderr=subprocess.PIPE, env=env, check=True
                    )

                backup_state["progress_percentage"] = 50
                backup_state["current_step"] = "Generando Excel"
                generate_excel(db_uri, xlsx)

                backup_state["progress_percentage"] = 75
                backup_state["current_step"] = "Generando PDF"
                generate_pdf(db_uri, pdf, mode="FULL")

                save_last_backup(LAST_FULL_BACKUP_FILE)
                save_last_backup(LAST_BACKUP_FILE)

            elif backup_type == "differential":
                since = get_last_backup(LAST_FULL_BACKUP_FILE)
                if not since:
                    raise Exception("No existe respaldo FULL previo. Ejecute primero un backup completo.")

                backup_state["current_step"] = "Generando backup diferencial"
                backup_state["progress_percentage"] = 30
                
                sql = os.path.join(path, f"backup_diff_{timestamp}.sql")
                xlsx = os.path.join(path, f"backup_diff_{timestamp}.xlsx")
                pdf = os.path.join(path, f"backup_diff_{timestamp}.pdf")

                generate_incremental_sql(db_uri, sql, since)
                
                backup_state["progress_percentage"] = 60
                generate_excel(db_uri, xlsx, since)
                
                backup_state["progress_percentage"] = 80
                generate_pdf(db_uri, pdf, since, "DIFERENCIAL")

                save_last_backup(LAST_BACKUP_FILE)

            elif backup_type == "incremental":
                since = get_last_backup(LAST_BACKUP_FILE)
                if not since:
                    raise Exception("No existe respaldo previo. Ejecute primero un backup completo.")

                backup_state["current_step"] = "Generando backup incremental"
                backup_state["progress_percentage"] = 30
                
                sql = os.path.join(path, f"backup_inc_{timestamp}.sql")
                xlsx = os.path.join(path, f"backup_inc_{timestamp}.xlsx")
                pdf = os.path.join(path, f"backup_inc_{timestamp}.pdf")

                generate_incremental_sql(db_uri, sql, since)
                
                backup_state["progress_percentage"] = 60
                generate_excel(db_uri, xlsx, since)
                
                backup_state["progress_percentage"] = 80
                generate_pdf(db_uri, pdf, since, "INCREMENTAL")

                save_last_backup(LAST_BACKUP_FILE)

            else:
                raise Exception("Tipo de respaldo no válido")

            # Calcular tamaño
            if sql and os.path.exists(sql):
                file_size = os.path.getsize(sql) / (1024 * 1024)  # MB

            backup_state["generated_files"] = {
                "sql": sql,
                "excel": xlsx,
                "pdf": pdf
            }

            backup_state["progress_percentage"] = 90
            backup_state["current_step"] = "Guardando historial"

            # Guardar en historial
            save_history({
                "date": datetime.now().isoformat(),
                "type": backup_type,
                "size": f"{file_size:.2f} MB",
                "url": sql
            })

            backup_state["progress_percentage"] = 95
            backup_state["current_step"] = "Enviando email"
            
            send_email_with_attachments(app, backup_state["generated_files"], backup_type)

            backup_state["current_step"] = "Completado"
            backup_state["progress_percentage"] = 100
            backup_state["last_backup"] = datetime.now()

        except Exception as e:
            backup_state["current_step"] = f"Error: {str(e)}"
            backup_state["progress_percentage"] = 0
            print("[BACKUP ERROR]", e)
            
            # Guardar error en historial
            save_history({
                "date": datetime.now().isoformat(),
                "type": backup_type,
                "size": "ERROR",
                "url": None,
                "error": str(e)
            })

        finally:
            backup_state["is_running"] = False