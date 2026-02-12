# app/models/venta.py
from app.extensions import db
from datetime import datetime

class Venta(db.Model):
    __tablename__ = 'ventas'
    
    id_venta = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Numeric(10, 2))
    
    # Relación con detalles
    detalles = db.relationship('DetalleVenta', backref='venta', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id_venta': self.id_venta,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'total': float(self.total) if self.total else 0,
            'detalles': [detalle.to_dict() for detalle in self.detalles]
        }
    
    def __repr__(self):
        return f'<Venta {self.id_venta} - Total: ${self.total}>'