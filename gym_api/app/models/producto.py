# app/models/producto.py
from app.extensions import db

class Producto(db.Model):
    __tablename__ = 'productos'
    
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    precio = db.Column(db.Numeric(10, 2))
    stock = db.Column(db.Integer)
    
    def to_dict(self):
        return {
            'id_producto': self.id_producto,
            'nombre': self.nombre,
            'precio': float(self.precio) if self.precio else 0,
            'stock': self.stock
        }
    
    def __repr__(self):
        return f'<Producto {self.nombre}>'