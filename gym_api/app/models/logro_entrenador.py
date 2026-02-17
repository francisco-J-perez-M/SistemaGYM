# app/models/logro_entrenador.py
from app.extensions import db
from datetime import datetime

class LogroEntrenador(db.Model):
    __tablename__ = 'logros_entrenador'
    
    id_logro = db.Column(db.Integer, primary_key=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    titulo = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text)
    fecha = db.Column(db.Date)
    tipo = db.Column(db.String(50))
    fecha_creacion = db.Column(db.DateTime, default=datetime.now)
    
    entrenador = db.relationship('User', backref='logros')