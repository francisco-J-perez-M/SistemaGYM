from app.extensions import db
from datetime import datetime

class CertificacionEntrenador(db.Model):
    __tablename__ = 'certificaciones_entrenador'
    
    id_certificacion = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    institucion = db.Column(db.String(150))
    fecha_obtencion = db.Column(db.Date)
    fecha_expiracion = db.Column(db.Date)
    archivo_url = db.Column(db.String(255))
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id_certificacion': self.id_certificacion,
            'id_entrenador': self.id_entrenador,
            'nombre': self.nombre,
            'institucion': self.institucion,
            'fecha_obtencion': self.fecha_obtencion.isoformat() if self.fecha_obtencion else None,
            'fecha_expiracion': self.fecha_expiracion.isoformat() if self.fecha_expiracion else None,
            'archivo_url': self.archivo_url,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }