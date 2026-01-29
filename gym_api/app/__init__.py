from flask import Flask
from .config import Config
from .extensions import db, jwt
from app.backups.routes import backups_bp
from .extensions import db, jwt, mail
from app.routes.miembros import miembros_bp
from app.routes.pagos import pagos_bp
from app.routes.membresias import membresias_bp
from app.routes.miembro_membresias import miembro_membresias_bp
from app.routes.dashboard_routes import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)

    from .auth.routes import auth_bp
    from .routes.health import health_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(backups_bp)
    app.register_blueprint(membresias_bp)
    app.register_blueprint(miembros_bp)
    app.register_blueprint(dashboard_bp, url_prefix="/api") 
    app.register_blueprint(pagos_bp)
    app.register_blueprint(miembro_membresias_bp, url_prefix="/api")

    return app
