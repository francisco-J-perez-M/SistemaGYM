from app.extensions import db
from datetime import datetime

class LogroEntrenador(db.Model):
    __tablename__ = 'logros_entrenador'
    
    id_logro = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    titulo = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text)
    fecha = db.Column(db.Date)
    tipo = db.Column(db.String(50))
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id_logro': self.id_logro,
            'id_entrenador': self.id_entrenador,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'tipo': self.tipo,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }