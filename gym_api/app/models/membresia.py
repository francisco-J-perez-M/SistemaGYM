from app.extensions import db

class Membresia(db.Model):
    __tablename__ = "membresias"

    id_membresia = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    duracion_meses = db.Column(db.Integer, nullable=False)
    precio = db.Column(db.Numeric(10, 2), nullable=False)

    def to_dict(self):
        return {
            "id_membresia": self.id_membresia,
            "nombre": self.nombre,
            "duracion_meses": self.duracion_meses,
            "precio": float(self.precio)
        }
