from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.membresia import Membresia

membresias_bp = Blueprint("membresias", __name__)

@membresias_bp.route("/api/membresias", methods=["GET"])
@jwt_required()
def listar_membresias():
    membresias = Membresia.query.all()
    return jsonify([m.to_dict() for m in membresias]), 200
