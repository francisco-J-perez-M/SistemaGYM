from app.extensions import db
from datetime import datetime

class Rutina(db.Model):
    __tablename__ = 'rutinas'
    
    id_rutina = db.Column(db.Integer, primary_key=True)
    id_miembro = db.Column(db.Integer, db.ForeignKey('miembros.id_miembro'), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    activa = db.Column(db.Boolean, default=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.now)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relaciones
    miembro = db.relationship('Miembro', backref='rutinas')
    dias = db.relationship('RutinaDia', backref='rutina', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id_rutina,
            'id_miembro': self.id_miembro,
            'nombre': self.nombre,
            'activa': self.activa,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
            'dias': [dia.to_dict() for dia in self.dias]
        }


class RutinaDia(db.Model):
    __tablename__ = 'rutina_dias'
    
    id_rutina_dia = db.Column(db.Integer, primary_key=True)
    id_rutina = db.Column(db.Integer, db.ForeignKey('rutinas.id_rutina'), nullable=False)
    dia_semana = db.Column(db.Enum('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'))
    grupo_muscular = db.Column(db.String(100))
    orden = db.Column(db.Integer, default=0)
    
    # Relaciones
    ejercicios = db.relationship('RutinaEjercicio', backref='dia', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id_rutina_dia,
            'dia': self.dia_semana,
            'grupo': self.grupo_muscular,
            'orden': self.orden,
            'ejercicios': [ejercicio.to_dict() for ejercicio in sorted(self.ejercicios, key=lambda x: x.orden)]
        }


class RutinaEjercicio(db.Model):
    __tablename__ = 'rutina_ejercicios'
    
    id_rutina_ejercicio = db.Column(db.Integer, primary_key=True)
    id_rutina_dia = db.Column(db.Integer, db.ForeignKey('rutina_dias.id_rutina_dia'), nullable=False)
    nombre_ejercicio = db.Column(db.String(150), nullable=False)
    series = db.Column(db.String(10), default='3')
    repeticiones = db.Column(db.String(10), default='12')
    peso = db.Column(db.String(20))
    notas = db.Column(db.Text)
    orden = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id': self.id_rutina_ejercicio,
            'nombre': self.nombre_ejercicio,
            'series': self.series,
            'reps': self.repeticiones,
            'peso': self.peso,
            'notas': self.notas,
            'orden': self.orden
        }