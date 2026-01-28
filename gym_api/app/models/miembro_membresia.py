from app.extensions import db

class MiembroMembresia(db.Model):
    __tablename__ = "miembro_membresia"

    id_mm = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey("miembros.id_miembro"), nullable=False)
    id_membresia = db.Column(db.Integer, db.ForeignKey("membresias.id_membresia"), nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum("Activa", "Vencida", "Cancelada"), nullable=False)
