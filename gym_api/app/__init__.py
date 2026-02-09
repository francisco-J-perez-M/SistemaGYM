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
from app.routes.user_dashboard import user_dashboard_bp
from app.routes.user_payments import user_payments_bp
from app.routes.user_profile import user_profile_bp
from app.routes.user_health import user_health_bp
from app.routes.user_body_progress import user_body_progress_bp
from app.routes.user_membership import user_membership_bp
from app.routes.user_routine import user_routines_bp
from app.routes.trainer_routes import trainer_bp

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
    app.register_blueprint(user_payments_bp)
    app.register_blueprint(user_profile_bp)
    app.register_blueprint(trainer_bp)
    app.register_blueprint(user_health_bp)
    app.register_blueprint(user_body_progress_bp)
    app.register_blueprint(user_membership_bp)
    app.register_blueprint(user_dashboard_bp)
    app.register_blueprint(user_routines_bp, url_prefix="/api/user")
    app.register_blueprint(miembro_membresias_bp, url_prefix="/api")

    return app
