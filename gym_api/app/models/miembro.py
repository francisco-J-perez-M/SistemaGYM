from app.extensions import db
from app.models.user import User 

class Miembro(db.Model):
    __tablename__ = "miembros"

    id_miembro = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"))

    telefono = db.Column(db.String(20))
    fecha_nacimiento = db.Column(db.Date)
    sexo = db.Column(db.Enum("M", "F", "Otro"))
    peso_inicial = db.Column(db.Numeric(5,2))
    estatura = db.Column(db.Numeric(4,2))
    fecha_registro = db.Column(db.Date)
    estado = db.Column(db.Enum("Activo", "Inactivo"), default="Activo")

    # 🔥 RELACIÓN CORRECTA
    usuario = db.relationship("User", backref="perfil_miembro")

    def to_dict(self):
        return {
            "id": self.id_miembro,
            "nombre": self.usuario.nombre if self.usuario else "Sin Usuario",
            "email": self.usuario.email if self.usuario else "Sin Email",
            "telefono": self.telefono,
            "sexo": self.sexo,
            "peso_inicial": float(self.peso_inicial) if self.peso_inicial else None,
            "estatura": float(self.estatura) if self.estatura else None,
            "activo": self.estado == "Activo"
        }
