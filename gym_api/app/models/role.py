#gym_api\app\models\role.py
from app.extensions import db

class Role(db.Model):
    __tablename__ = "roles"

    id_role = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
