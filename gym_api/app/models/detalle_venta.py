# app/models/detalle_venta.py
from app.extensions import db

class DetalleVenta(db.Model):
    __tablename__ = 'detalle_venta'
    
    id_detalle = db.Column(db.Integer, primary_key=True)
    id_venta = db.Column(db.Integer, db.ForeignKey('ventas.id_venta'))
    id_producto = db.Column(db.Integer, db.ForeignKey('productos.id_producto'))
    cantidad = db.Column(db.Integer)
    subtotal = db.Column(db.Numeric(10, 2))
    
    # Relaciones
    producto = db.relationship('Producto', backref='detalles_venta')
    
    def to_dict(self):
        return {
            'id_detalle': self.id_detalle,
            'id_venta': self.id_venta,
            'id_producto': self.id_producto,
            'nombre_producto': self.producto.nombre if self.producto else 'N/A',
            'cantidad': self.cantidad,
            'subtotal': float(self.subtotal) if self.subtotal else 0
        }
    
    def __repr__(self):
        return f'<DetalleVenta {self.id_detalle}>'