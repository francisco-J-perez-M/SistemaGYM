# app/models/perfil_entrenador.py
from app.extensions import db
from datetime import datetime

class PerfilEntrenador(db.Model):
    __tablename__ = 'perfil_entrenador'
    
    id_perfil = db.Column(db.Integer, primary_key=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    direccion = db.Column(db.String(200))
    especializacion = db.Column(db.String(100))
    biografia = db.Column(db.Text)
    redes_sociales = db.Column(db.JSON)
    fecha_creacion = db.Column(db.DateTime, default=datetime.now)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    entrenador = db.relationship('User', backref='perfil_entrenador')