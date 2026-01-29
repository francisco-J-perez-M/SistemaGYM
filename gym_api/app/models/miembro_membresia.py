from app.extensions import db

class MiembroMembresia(db.Model):
    __tablename__ = 'miembro_membresia'

    id_mm = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'))
    id_membresia = db.Column(db.Integer, db.ForeignKey('membresias.id_membresia'))
    
    fecha_inicio = db.Column(db.Date)
    fecha_fin = db.Column(db.Date)
    estado = db.Column(db.Enum('Activa', 'Vencida', 'Cancelada'))

    miembro = db.relationship('Miembro', backref='historial_membresias')
    membresia = db.relationship('Membresia', backref='historial_usuarios')

    def to_dict(self):
        return {
            "id": self.id_mm,
            "id_miembro": self.id_miembro,
            "id_membresia": self.id_membresia,
            # Gracias a las relaciones de arriba, ahora podemos hacer esto:
            "nombre_membresia": self.membresia.nombre if self.membresia else "N/A",
            "fecha_inicio": str(self.fecha_inicio),
            "fecha_fin": str(self.fecha_fin),
            "estado": self.estado
        }