from app.extensions import db
from datetime import datetime

class Pago(db.Model):
    __tablename__ = "pagos"

    id_pago = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey("miembros.id_miembro"), nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    metodo_pago = db.Column(
        db.Enum("Efectivo", "Tarjeta", "Transferencia", "Simulado"),
        nullable=False
    )
    concepto = db.Column(db.String(100), nullable=False)
    fecha_pago = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación con Miembro
    miembro = db.relationship("Miembro", backref="pagos")

    def to_dict(self):
        # Lógica para obtener el nombre desde la tabla de Usuarios
        nombre_mostrar = "Desconocido"

        if self.miembro: # 1. ¿Existe el miembro?
            if self.miembro.usuario: # 2. ¿Ese miembro tiene un usuario asociado?
                nombre_mostrar = self.miembro.usuario.nombre
            else:
                nombre_mostrar = "Miembro sin usuario"
        
        return {
            "id_pago": self.id_pago,
            "id_miembro": self.id_miembro,
            "nombre_miembro": nombre_mostrar, # <--- Aquí ya va el nombre correcto
            "monto": float(self.monto),
            "metodo_pago": self.metodo_pago,
            "concepto": self.concepto,
            "fecha_pago": self.fecha_pago.isoformat()
        }