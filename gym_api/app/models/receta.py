# app/models/receta.py
from app.extensions import db

class Receta(db.Model):
    __tablename__ = 'recetas'
    
    id_receta = db.Column(db.Integer, primary_key=True)
    id_tipo_dieta = db.Column(db.Integer, db.ForeignKey('tipos_dieta.id_tipo_dieta'), nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    tipo_comida = db.Column(db.Enum('Desayuno', 'Media Mañana', 'Almuerzo', 'Merienda', 'Cena', 'Post-Entreno'), nullable=False)
    ingredientes = db.Column(db.Text, nullable=False)
    preparacion = db.Column(db.Text, nullable=False)
    
    # Información nutricional
    calorias = db.Column(db.Numeric(6, 2))
    proteinas = db.Column(db.Numeric(5, 2))
    carbohidratos = db.Column(db.Numeric(5, 2))
    grasas = db.Column(db.Numeric(5, 2))
    tiempo_preparacion = db.Column(db.Integer)  # minutos
    
    # Relaciones
    planes_recetas = db.relationship('PlanReceta', backref='receta', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id_receta': self.id_receta,
            'id_tipo_dieta': self.id_tipo_dieta,
            'nombre_tipo_dieta': self.tipo_dieta.nombre if self.tipo_dieta else 'N/A',
            'nombre': self.nombre,
            'tipo_comida': self.tipo_comida,
            'ingredientes': self.ingredientes,
            'preparacion': self.preparacion,
            'calorias': float(self.calorias) if self.calorias else 0,
            'proteinas': float(self.proteinas) if self.proteinas else 0,
            'carbohidratos': float(self.carbohidratos) if self.carbohidratos else 0,
            'grasas': float(self.grasas) if self.grasas else 0,
            'tiempo_preparacion': self.tiempo_preparacion
        }
    
    def __repr__(self):
        return f'<Receta {self.nombre}>'