from bson.objectid import ObjectId
from app.mongo import get_db

class Miembro:
    collection = "miembros"

    def __init__(self, id_usuario, telefono=None, fecha_nacimiento=None, sexo=None,
                 peso_inicial=None, estatura=None, fecha_registro=None, estado="Activo",
                 foto_perfil=None, id_entrenador=None, objetivo=None, peso_objetivo=None,
                 grasa_objetivo=None, masa_muscular_objetivo=None, fecha_asignacion=None,
                 ultima_sesion=None, _id=None):
        self._id = _id
        self.id_usuario = ObjectId(id_usuario) if isinstance(id_usuario, str) else id_usuario
        self.telefono = telefono
        self.fecha_nacimiento = fecha_nacimiento
        self.sexo = sexo
        self.peso_inicial = float(peso_inicial) if peso_inicial else None
        self.estatura = float(estatura) if estatura else None
        self.fecha_registro = fecha_registro
        self.estado = estado
        self.foto_perfil = foto_perfil

        self.id_entrenador = ObjectId(id_entrenador) if isinstance(id_entrenador, str) and id_entrenador else id_entrenador
        self.objetivo = objetivo
        self.peso_objetivo = float(peso_objetivo) if peso_objetivo else None
        self.grasa_objetivo = float(grasa_objetivo) if grasa_objetivo else None
        self.masa_muscular_objetivo = float(masa_muscular_objetivo) if masa_muscular_objetivo else None
        self.fecha_asignacion = fecha_asignacion
        self.ultima_sesion = ultima_sesion

    def to_dict(self):
        db = get_db()
        foto_url = f"/static/uploads/{self.foto_perfil}" if self.foto_perfil else None

        # --- Obtener datos del Usuario ---
        usuario_doc = db.usuarios.find_one({"_id": self.id_usuario}) if self.id_usuario else None
        nombre_usuario = usuario_doc["nombre"] if usuario_doc and "nombre" in usuario_doc else "Sin Usuario"
        email_usuario = usuario_doc["email"] if usuario_doc and "email" in usuario_doc else "Sin Email"

        # --- Obtener Membresía Activa ---
        membresia_activa_data = None
        # Buscar la asignación de membresía activa para este miembro
        mm_doc = db.miembro_membresia.find_one({"id_miembro": self._id, "estado": "Activa"})
        if mm_doc:
            # Si hay asignación, buscar los detalles de la membresía (nombre)
            membresia_doc = db.membresias.find_one({"_id": mm_doc["id_membresia"]})
            if membresia_doc:
                membresia_activa_data = {
                    "nombre": membresia_doc["nombre"],
                    "fecha_inicio": str(mm_doc.get("fecha_inicio", "")),
                    "fecha_fin": str(mm_doc.get("fecha_fin", "")),
                    "estado": mm_doc["estado"]
                }

        return {
            "id": self._id,
            "nombre": nombre_usuario,
            "email": email_usuario,
            "telefono": self.telefono,
            "sexo": self.sexo,
            "peso_inicial": self.peso_inicial,
            "estatura": self.estatura,
            "activo": self.estado == "Activo",
            "foto_perfil": foto_url,
            "id_entrenador": self.id_entrenador,
            "objetivo": self.objetivo,
            "peso_objetivo": self.peso_objetivo,
            "grasa_objetivo": self.grasa_objetivo,
            "masa_muscular_objetivo": self.masa_muscular_objetivo,
            "fecha_asignacion": str(self.fecha_asignacion) if self.fecha_asignacion else None,
            "ultima_sesion": str(self.ultima_sesion) if self.ultima_sesion else None,
            "membresia": membresia_activa_data
        }

    def save(self):
        db = get_db()
        data = self.__dict__.copy()
        if "_id" in data and not data["_id"]:
            del data["_id"]

        if self._id:
            db[self.collection].update_one({"_id": self._id}, {"$set": data})
        else:
            result = db[self.collection].insert_one(data)
            self._id = result.inserted_id
        return self._id

    @classmethod
    def find_by_id(cls, miembro_id):
        try:
            oid = ObjectId(miembro_id) if isinstance(miembro_id, str) else miembro_id
            data = get_db()[cls.collection].find_one({"_id": oid})
            return cls(**data) if data else None
        except Exception:
            return None