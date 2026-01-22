import threading
import time
import os
import subprocess
import pandas as pd
from fpdf import FPDF
from datetime import datetime
from flask_mail import Message
from app.extensions import mail, db
from sqlalchemy import create_engine

# Ajusta esta ruta a tu ejecutable
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
    "generated_files": {} 
}

def ensure_dirs(backup_type):
    path = os.path.join(BACKUP_DIR, backup_type)
    os.makedirs(path, exist_ok=True)
    return path

# --- Función para generar Excel ---
def generate_excel(connection_str, output_path):
    try:
        engine = create_engine(connection_str)
        with engine.connect() as conn:
            tables = pd.read_sql("SHOW TABLES", conn)
            # Verificación de seguridad si la BD está vacía
            if tables.empty:
                return False
                
            table_names = tables.iloc[:, 0].tolist()

            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                for table in table_names:
                    df = pd.read_sql(f"SELECT * FROM {table}", conn)
                    df[:100000].to_excel(writer, sheet_name=table[:31], index=False)
        return True
    except Exception as e:
        print(f"Error generando Excel: {e}")
        return False

# --- Función para generar PDF (Simple) ---
def generate_pdf(connection_str, output_path):
    try:
        engine = create_engine(connection_str)
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=10)
        
        pdf.cell(200, 10, txt="Reporte de Backup de Base de Datos", ln=True, align='C')
        pdf.ln(10)

        with engine.connect() as conn:
            tables_df = pd.read_sql("SHOW TABLES", conn)
            if tables_df.empty:
                 return False
            tables = tables_df.iloc[:, 0].tolist()
            
            for table in tables:
                pdf.set_font("Arial", 'B', 12)
                pdf.cell(0, 10, f"Tabla: {table}", ln=True)
                pdf.set_font("Arial", size=8)
                
                df = pd.read_sql(f"SELECT * FROM {table} LIMIT 50", conn)
                text = df.to_string(index=False)
                pdf.multi_cell(0, 5, text)
                pdf.ln(5)
                
        pdf.output(output_path)
        return True
    except Exception as e:
        print(f"Error generando PDF: {e}")
        return False

# --- Función para enviar correo ---
def send_email_with_attachments(app, files):
    # Usamos el destinatario del config
    recipient = app.config.get('MAIL_RECIPIENT') or app.config.get('MAIL_USERNAME')
    
    print(f"[EMAIL DEBUG] Iniciando envío a: {recipient}")
    print(f"[EMAIL DEBUG] Config SMTP: {app.config.get('MAIL_SERVER')}:{app.config.get('MAIL_PORT')}")

    # IMPORTANTE: No abrimos 'with app.app_context()' aquí porque
    # ya lo abriremos en run_backup. Si se abre dos veces no pasa nada,
    # pero es más limpio hacerlo en la función principal del hilo.
    
    try:
        msg = Message(
            subject="[Backup Completo] Tu respaldo está listo",
            sender=app.config.get("MAIL_USERNAME"),
            recipients=[recipient],
            body="El proceso de respaldo ha finalizado exitosamente. Adjunto encontrarás los archivos."
        )

        for format_type, file_path in files.items():
            if os.path.exists(file_path):
                with open(file_path, "rb") as fp:
                    content_type = "application/octet-stream"
                    if file_path.endswith(".pdf"): content_type = "application/pdf"
                    elif file_path.endswith(".xlsx"): content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    
                    msg.attach(os.path.basename(file_path), content_type, fp.read())
        
        mail.send(msg)
        print("[EMAIL DEBUG] ✅ Correo enviado exitosamente.")
    except Exception as e:
        print(f"[EMAIL DEBUG] ❌ Error enviando correo: {e}")
        # Imprimimos el tipo de error para saber si es Auth o Conexión
        import traceback
        traceback.print_exc()

# --- UPDATE: run_backup recibe 'app' ---
def run_backup(job_id: str, backup_type: str, app):
    # Establecemos el contexto de la aplicación para todo el hilo
    # Esto es vital para que Flask-Mail acceda a la configuración
    with app.app_context():
        backup_state.update({
            "is_running": True,
            "progress_percentage": 0,
            "current_step": "Preparando respaldo...",
            "start_time": datetime.utcnow(),
            "job_id": job_id,
            "generated_files": {}
        })

        try:
            backup_path = ensure_dirs(backup_type)
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            
            sql_file = os.path.join(backup_path, f"backup_{timestamp}.sql")
            xlsx_file = os.path.join(backup_path, f"backup_{timestamp}.xlsx")
            pdf_file = os.path.join(backup_path, f"backup_{timestamp}.pdf")

            db_user = os.getenv("DB_USER")
            db_pass = os.getenv("DB_PASSWORD", "")
            db_host = os.getenv("DB_HOST", "localhost")
            db_name = os.getenv("DB_NAME")
            db_uri = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}/{db_name}"

            # 1️⃣ SQL DUMP
            backup_state.update({"progress_percentage": 10, "current_step": "Generando SQL..."})
            my_env = os.environ.copy()
            if db_pass: my_env["MYSQL_PWD"] = db_pass

            with open(sql_file, "w") as f:
                subprocess.run(
                    [MYSQLDUMP_PATH, "-u", db_user, db_name],
                    env=my_env, stdout=f, stderr=subprocess.PIPE, check=True
                )
            backup_state["generated_files"]["sql"] = sql_file

            # 2️⃣ EXCEL
            backup_state.update({"progress_percentage": 40, "current_step": "Exportando a Excel..."})
            if generate_excel(db_uri, xlsx_file):
                backup_state["generated_files"]["excel"] = xlsx_file

            # 3️⃣ PDF
            backup_state.update({"progress_percentage": 70, "current_step": "Generando reporte PDF..."})
            if generate_pdf(db_uri, pdf_file):
                backup_state["generated_files"]["pdf"] = pdf_file

            # 4️⃣ ENVIAR CORREO
            backup_state.update({"progress_percentage": 90, "current_step": "Enviando correo..."})
            # Pasamos 'app' aunque ya estamos en contexto, por compatibilidad con la función
            send_email_with_attachments(app, backup_state["generated_files"])

            # FINALIZAR
            time.sleep(1)
            backup_state.update({
                "progress_percentage": 100,
                "current_step": "Completado",
                "last_backup": datetime.utcnow(),
            })

        except Exception as e:
            error_msg = str(e)
            backup_state.update({
                "current_step": f"Error: {error_msg}",
                "progress_percentage": 0,
                "is_running": False
            })
            print(f"[BACKUP ERROR]: {error_msg}")

        finally:
            backup_state["is_running"] = False