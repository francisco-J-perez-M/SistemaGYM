from app.extensions import db
from datetime import datetime

class ProgresoFisico(db.Model):
    __tablename__ = 'progreso_fisico'
    
    id_progreso = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'), nullable=False)
    peso = db.Column(db.Numeric(5, 2))
    bmi = db.Column(db.Numeric(5, 2))
    cintura = db.Column(db.Numeric(5, 2))
    cadera = db.Column(db.Numeric(5, 2))
    fecha_registro = db.Column(db.Date, default=datetime.now().date)
    
    # Relación con Miembro
    miembro = db.relationship('Miembro', backref='progresos')
    
    def to_dict(self):
        return {
            'id_progreso': self.id_progreso,
            'id_miembro': self.id_miembro,
            'peso': float(self.peso) if self.peso else 0,
            'bmi': float(self.bmi) if self.bmi else 0,
            'cintura': float(self.cintura) if self.cintura else 0,
            'cadera': float(self.cadera) if self.cadera else 0,
            'fecha_registro': self.fecha_registro.strftime('%Y-%m-%d') if self.fecha_registro else None
        }
    
    def calcular_bmi(self, estatura_metros):
        """Calcula el BMI automáticamente"""
        if self.peso and estatura_metros:
            self.bmi = float(self.peso) / (estatura_metros ** 2)
    
    def __repr__(self):
        return f'<ProgresoFisico {self.id_progreso} - Peso: {self.peso}kg>'