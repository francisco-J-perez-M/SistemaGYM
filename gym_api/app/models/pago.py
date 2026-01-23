from app.extensions import db

class Pago(db.Model):
    __tablename__ = "pagos"

    id_pago = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey("miembros.id_miembro"))
    monto = db.Column(db.Numeric(10,2))
    metodo_pago = db.Column(db.Enum("Efectivo", "Tarjeta", "Transferencia", "Simulado"))
    concepto = db.Column(db.String(100))
    fecha_pago = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id_pago": self.id_pago,
            "id_miembro": self.id_miembro,
            "monto": float(self.monto),
            "metodo_pago": self.metodo_pago,
            "concepto": self.concepto,
            "fecha_pago": self.fecha_pago.isoformat() if self.fecha_pago else None
        }
