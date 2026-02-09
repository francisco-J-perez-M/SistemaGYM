from app.extensions import db
from datetime import datetime

class Sesion(db.Model):
    """Modelo para sesiones de entrenamiento"""
    __tablename__ = "sesiones"

    id_sesion = db.Column(db.Integer, primary_key=True)
    id_entrenador = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=False)
    id_miembro = db.Column(db.Integer, db.ForeignKey("miembros.id_miembro"), nullable=True)  # Null si es grupal
    
    # Información de la sesión
    fecha = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    duracion_minutos = db.Column(db.Integer, default=60)
    tipo = db.Column(db.Enum("Personal", "Grupal", "Consulta"), default="Personal")
    ubicacion = db.Column(db.String(100))
    estado = db.Column(db.Enum("scheduled", "in-progress", "completed", "cancelled"), default="scheduled")
    
    # Detalles
    nombre_sesion = db.Column(db.String(150))  # Para clases grupales o nombre personalizado
    notas = db.Column(db.Text)
    num_ejercicios = db.Column(db.Integer, default=0)
    asistencia = db.Column(db.Boolean, default=False)
    
    # Timestamps
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    entrenador = db.relationship("User", foreign_keys=[id_entrenador], backref="sesiones_entrenador")
    miembro = db.relationship("Miembro", foreign_keys=[id_miembro], backref="sesiones")

    def to_dict(self):
        """Serializa la sesión a diccionario"""
        return {
            "id": self.id_sesion,
            "date": str(self.fecha),
            "time": str(self.hora_inicio)[:5],  # HH:MM
            "client": self.nombre_sesion if self.tipo == "Grupal" else (self.miembro.usuario.nombre if self.miembro else "Sin asignar"),
            "type": self.tipo,
            "duration": f"{self.duracion_minutos} min",
            "location": self.ubicacion or "Sin ubicación",
            "status": self.estado,
            "notes": self.notas or "",
            "exercises": self.num_ejercicios,
            "attendance": self.asistencia
        }

    def to_schedule_item(self):
        """Serializa para la vista de agenda"""
        return {
            "time": str(self.hora_inicio)[:5],
            "client": self.nombre_sesion if self.tipo == "Grupal" else (self.miembro.usuario.nombre if self.miembro else "Sin asignar"),
            "type": self.tipo,
            "status": self.estado
        }

    def iniciar_sesion(self):
        """Inicia la sesión"""
        self.estado = "in-progress"
        db.session.commit()

    def completar_sesion(self, notas=None):
        """Completa la sesión"""
        self.estado = "completed"
        self.asistencia = True
        if notas:
            self.notas = notas
        db.session.commit()

    def cancelar_sesion(self, motivo=None):
        """Cancela la sesión"""
        self.estado = "cancelled"
        if motivo:
            self.notas = f"Cancelada: {motivo}"
        db.session.commit()