from app.extensions import db
from datetime import datetime

class EvaluacionEntrenador(db.Model):
    __tablename__ = 'evaluaciones_entrenador'
    
    id_evaluacion = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'), nullable=False)
    calificacion = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text)
    fecha = db.Column(db.Date)
    fecha_creacion = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id_evaluacion': self.id_evaluacion,
            'id_entrenador': self.id_entrenador,
            'id_miembro': self.id_miembro,
            'calificacion': self.calificacion,
            'comentario': self.comentario,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }