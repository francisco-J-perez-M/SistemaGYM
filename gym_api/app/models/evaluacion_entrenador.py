# app/models/evaluacion_entrenador.py
from app.extensions import db
from datetime import datetime

class EvaluacionEntrenador(db.Model):
    __tablename__ = 'evaluaciones_entrenador'
    
    id_evaluacion = db.Column(db.Integer, primary_key=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'), nullable=False)
    calificacion = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text)
    fecha = db.Column(db.Date, default=datetime.now)
    fecha_creacion = db.Column(db.DateTime, default=datetime.now)
    
    entrenador = db.relationship('User', foreign_keys=[id_entrenador])
    miembro = db.relationship('Miembro', foreign_keys=[id_miembro])