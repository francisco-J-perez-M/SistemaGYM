from app.extensions import db
# No necesitas importar User aquí si usas string en relationship, 
# pero si ya lo tienes, déjalo.

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
    
    foto_perfil = db.Column(db.String(255), nullable=True)

    usuario = db.relationship("User", backref="perfil_miembro")

    def to_dict(self):
        # Lógica para la imagen: Si tiene foto, devolvemos la ruta, si no, null
        # Nota: Asumiremos que las fotos se guardan en static/uploads/
        foto_url = f"/static/uploads/{self.foto_perfil}" if self.foto_perfil else None

        return {
            "id": self.id_miembro,
            "nombre": self.usuario.nombre if self.usuario else "Sin Usuario",
            "email": self.usuario.email if self.usuario else "Sin Email",
            "telefono": self.telefono,
            "sexo": self.sexo,
            "peso_inicial": float(self.peso_inicial) if self.peso_inicial else None,
            "estatura": float(self.estatura) if self.estatura else None,
            "activo": self.estado == "Activo",
            "foto_perfil": foto_url  # ✅ Enviamos la URL al frontend
        }