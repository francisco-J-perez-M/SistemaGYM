# app/models/certificacion_entrenador.py
from app.extensions import db
from datetime import datetime

class CertificacionEntrenador(db.Model):
    __tablename__ = 'certificaciones_entrenador'
    
    id_certificacion = db.Column(db.Integer, primary_key=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    institucion = db.Column(db.String(150))
    fecha_obtencion = db.Column(db.Date)
    fecha_expiracion = db.Column(db.Date)
    archivo_url = db.Column(db.String(255))
    fecha_creacion = db.Column(db.DateTime, default=datetime.now)
    
    entrenador = db.relationship('User', backref='certificaciones')