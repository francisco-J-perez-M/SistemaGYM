from flask import Blueprint, jsonify, request, current_app, send_file
from datetime import datetime, timedelta
import uuid
import threading
import os
from flask_mail import Message
from app.extensions import mail
from app.backups.service import backup_state, run_backup, BACKUP_DIR

backups_bp = Blueprint("backups", __name__, url_prefix="/api/backups")


@backups_bp.route("/dashboard-summary", methods=["GET"])
def dashboard_summary():
    response = {
        "system_status": "OK" if not backup_state["is_running"] else "PENDIENTE",
        "last_backup": (
            backup_state["last_backup"].isoformat()
            if backup_state["last_backup"]
            else None
        ),
        "config": {
            "frequency": "Diaria",
            "default_type": "Incremental",
            "next_scheduled": (
                datetime.utcnow() + timedelta(days=1)
            ).replace(hour=3, minute=0, second=0).isoformat(),
        },
        "backup_plan": [
            {"title": "Respaldos diarios", "desc": "Cada madrugada"},
            {"title": "Respaldo semanal", "desc": "Base de datos y archivos"},
        ],
    }

    return jsonify(response), 200


@backups_bp.route("/trigger", methods=["POST"])
def trigger_backup():
    if backup_state["is_running"]:
        return jsonify({
            "message": "Backup en curso",
            "status": "running",
            "job_id": backup_state.get("job_id")
        }), 409

    data = request.get_json() or {}
    backup_type = data.get("type", "incremental")
    job_id = f"job_{uuid.uuid4().hex[:8]}"

    # Importante: pasar la app real al thread
    app_instance = current_app._get_current_object()

    thread = threading.Thread(
        target=run_backup,
        args=(job_id, backup_type, app_instance),
        daemon=True
    )
    thread.start()

    return jsonify({
        "message": "Backup iniciado",
        "job_id": job_id,
        "status": "running"
    }), 202


@backups_bp.route("/status", methods=["GET"])
def backup_status():
    response = {
        "is_running": backup_state["is_running"],
        "progress_percentage": backup_state["progress_percentage"],
        "current_step": backup_state["current_step"],
        "last_backup": backup_state["last_backup"],
        "files": {}
    }

    if backup_state.get("generated_files"):
        for f_type, f_path in backup_state["generated_files"].items():
            filename = os.path.basename(f_path)
            response["files"][f_type] = f"/api/backups/download/{filename}"

    return jsonify(response), 200


@backups_bp.route("/download/<filename>", methods=["GET"])
def download_backup(filename):
    for root, dirs, files in os.walk(BACKUP_DIR):
        if filename in files:
            file_path = os.path.join(root, filename)
            return send_file(file_path, as_attachment=True)

    return jsonify({"error": "Archivo no encontrado"}), 404
@backups_bp.route("/test-email", methods=["GET"])
def test_email():
    try:
        msg = Message(
            subject="Prueba de Configuración",
            sender="al222310604@gmail.com", # Asegúrate que coincida con tu .env
            recipients=["al222310604@gmail.com"],
            body="Si lees esto, el correo funciona."
        )
        mail.send(msg)
        return jsonify({"message": "Correo enviado con éxito"}), 200
    except Exception as e:
        # Esto nos mostrará el error real en el navegador
        return jsonify({"error": str(e)}), 500