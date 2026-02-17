from app.extensions import db

class Miembro(db.Model):
    __tablename__ = "miembros"

    # --- CAMPOS ORIGINALES (NO TOCAR) ---
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

    # --- NUEVOS CAMPOS (Necesarios para Dashboard Entrenador) ---
    # Se ponen nullable=True para no romper registros antiguos que no tengan estos datos
    id_entrenador = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=True)
    objetivo = db.Column(db.String(150), nullable=True)
    peso_objetivo = db.Column(db.Numeric(5, 2), nullable=True)
    grasa_objetivo = db.Column(db.Numeric(5, 2), nullable=True)
    masa_muscular_objetivo = db.Column(db.Numeric(5, 2), nullable=True)
    fecha_asignacion = db.Column(db.Date, nullable=True)
    ultima_sesion = db.Column(db.Date, nullable=True)

    # --- RELACIONES ---
    # Especificamos foreign_keys explícitamente porque ahora hay dos FK a la tabla usuarios
    usuario = db.relationship("User", foreign_keys=[id_usuario], backref="perfil_miembro")
    entrenador = db.relationship("User", foreign_keys=[id_entrenador], backref="miembros_asignados")

    def to_dict(self):
        foto_url = f"/static/uploads/{self.foto_perfil}" if self.foto_perfil else None

        # Manejo seguro de historial_membresias por si no está cargado
        membresia_activa = None
        if hasattr(self, 'historial_membresias'):
            membresia_activa = next(
                (mm for mm in self.historial_membresias if mm.estado == "Activa"),
                None
            )

        return {
            "id": self.id_miembro,
            "nombre": self.usuario.nombre if self.usuario else "Sin Usuario",
            "email": self.usuario.email if self.usuario else "Sin Email",
            "telefono": self.telefono,
            "sexo": self.sexo,
            "peso_inicial": float(self.peso_inicial) if self.peso_inicial else None,
            "estatura": float(self.estatura) if self.estatura else None,
            "activo": self.estado == "Activo",
            "foto_perfil": foto_url,
            
            # Nuevos campos agregados al diccionario (con manejo de nulos)
            "id_entrenador": self.id_entrenador,
            "objetivo": self.objetivo,
            "peso_objetivo": float(self.peso_objetivo) if self.peso_objetivo else None,
            "grasa_objetivo": float(self.grasa_objetivo) if self.grasa_objetivo else None,

            "membresia": {
                "nombre": membresia_activa.membresia.nombre,
                "fecha_inicio": str(membresia_activa.fecha_inicio),
                "fecha_fin": str(membresia_activa.fecha_fin),
                "estado": membresia_activa.estado
            } if membresia_activa else None
        }