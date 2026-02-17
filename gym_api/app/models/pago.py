from app.extensions import db
from datetime import datetime

class Pago(db.Model):
    __tablename__ = "pagos"

    id_pago = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey("miembros.id_miembro"), nullable=False)
    
    # --- NUEVO CAMPO ---
    # nullable=True porque un pago de una botella de agua no tiene entrenador
    id_entrenador = db.Column(db.Integer, db.ForeignKey("usuarios.id_usuario"), nullable=True) 

    monto = db.Column(db.Numeric(10, 2), nullable=False)
    metodo_pago = db.Column(
        db.Enum("Efectivo", "Tarjeta", "Transferencia", "Simulado"),
        nullable=False
    )
    concepto = db.Column(db.String(100), nullable=False)
    fecha_pago = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    miembro = db.relationship("Miembro", backref="pagos")
    
    # Relación opcional para acceder a los datos del entrenador desde el pago
    # Usamos string "User" para evitar problemas de importación circular si User está en otro archivo
    entrenador = db.relationship("User", foreign_keys=[id_entrenador], backref="pagos_recibidos")

    def to_dict(self):
        nombre_mostrar = "Desconocido"

        if self.miembro:
            if self.miembro.usuario: 
                nombre_mostrar = self.miembro.usuario.nombre
            else:
                nombre_mostrar = "Miembro sin usuario"
        
        return {
            "id_pago": self.id_pago,
            "id_miembro": self.id_miembro,
            "id_entrenador": self.id_entrenador,  # <--- Agregado al diccionario
            "nombre_miembro": nombre_mostrar,
            "monto": float(self.monto),
            "metodo_pago": self.metodo_pago,
            "concepto": self.concepto,
            "fecha_pago": self.fecha_pago.isoformat()
        }