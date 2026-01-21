# app/backups/routes.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import uuid
import threading

from app.backups.service import backup_state, run_backup

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
            "message": "Ya hay un backup en ejecución",
            "status": "running",
            "job_id": backup_state["job_id"],
        }), 409

    data = request.get_json() or {}
    backup_type = data.get("type", "incremental")

    job_id = f"job_{uuid.uuid4().hex[:8]}"

    thread = threading.Thread(
        target=run_backup,
        args=(job_id, backup_type),
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
    if not backup_state["start_time"]:
        return jsonify({
            "is_running": False,
            "progress_percentage": 0,
            "current_step": None,
            "time_elapsed": "00:00:00"
        }), 200

    elapsed = datetime.utcnow() - backup_state["start_time"]
    time_elapsed = str(elapsed).split(".")[0]

    return jsonify({
        "is_running": backup_state["is_running"],
        "progress_percentage": backup_state["progress_percentage"],
        "current_step": backup_state["current_step"],
        "time_elapsed": time_elapsed
    }), 200
