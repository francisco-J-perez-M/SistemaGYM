from app.extensions import db
from datetime import datetime

class Asistencia(db.Model):
    __tablename__ = 'asistencias'
    
    id_asistencia = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'), nullable=False)
    fecha = db.Column(db.Date, nullable=False, default=datetime.now().date)
    hora_entrada = db.Column(db.Time)
    hora_salida = db.Column(db.Time)
    
    # Relación con Miembro
    miembro = db.relationship('Miembro', backref='asistencias')
    
    def to_dict(self):
        return {
            'id_asistencia': self.id_asistencia,
            'id_miembro': self.id_miembro,
            'fecha': self.fecha.strftime('%Y-%m-%d') if self.fecha else None,
            'hora_entrada': self.hora_entrada.strftime('%H:%M:%S') if self.hora_entrada else None,
            'hora_salida': self.hora_salida.strftime('%H:%M:%S') if self.hora_salida else None
        }
    
    def __repr__(self):
        return f'<Asistencia {self.id_asistencia} - Miembro {self.id_miembro}>'