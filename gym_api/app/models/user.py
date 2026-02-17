from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime  # <--- Importación necesaria

class User(db.Model):
    __tablename__ = "usuarios"

    id_usuario = db.Column(db.Integer, primary_key=True)
    id_role = db.Column(db.Integer, db.ForeignKey("roles.id_role"))
    nombre = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    
    # --- NUEVO CAMPO ---
    # Usamos datetime.utcnow como default para que coincida con CURRENT_TIMESTAMP
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow) 

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)