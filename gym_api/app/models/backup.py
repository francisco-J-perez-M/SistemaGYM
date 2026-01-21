from datetime import datetime
from app.extensions import db

class Backup(db.Model):
    __tablename__ = "backups"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20))  # incremental | full
    status = db.Column(db.String(20))  # pending | running | completed | failed
    progress = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    finished_at = db.Column(db.DateTime)
