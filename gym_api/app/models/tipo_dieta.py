# app/models/tipo_dieta.py
from app.extensions import db

class TipoDieta(db.Model):
    __tablename__ = 'tipos_dieta'
    
    id_tipo_dieta = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), unique=True, nullable=False)
    descripcion = db.Column(db.Text)
    calorias_objetivo = db.Column(db.String(50))
    
    # Relaciones
    recetas = db.relationship('Receta', backref='tipo_dieta', cascade='all, delete-orphan')
    planes = db.relationship('PlanAlimenticio', backref='tipo_dieta')
    
    def to_dict(self):
        return {
            'id_tipo_dieta': self.id_tipo_dieta,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'calorias_objetivo': self.calorias_objetivo
        }
    
    def __repr__(self):
        return f'<TipoDieta {self.nombre}>'