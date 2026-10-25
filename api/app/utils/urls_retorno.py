"""
utils/urls_retorno.py — URL del frontend para las páginas de retorno de pago.

La usan tanto el checkout de pagos (routes/pagos_online.py: membresías,
productos y la suscripción/capacidad de la plataforma) como el alta de
cargos recurrentes (routes/owner_gym/suscripcion_recurrente.py): ambos
necesitan la URL pública del frontend para construir las success/cancel
URLs que se envían a la pasarela (PayPal, Mercado Pago).
"""
import os

from flask import Request

# Esquemas que solo tienen sentido en desarrollo (docker-compose local).
_PREFIJOS_LOCALHOST = (
    "http://localhost", "https://localhost",
    "http://127.0.0.1", "https://127.0.0.1",
)


def url_base_front() -> str:
    """URL pública del frontend tal como está configurada (FRONTEND_URL)."""
    return os.getenv("FRONTEND_URL", "http://localhost:8080").rstrip("/")


def url_front_retorno(request: Request, origen: str | None) -> tuple[str, str]:
    """
    Resuelve (front, sufijo) para construir las URLs de retorno de un pago.

      front  - base de la URL del frontend, sin slash final.
      sufijo - "&app=1" cuando el pago se originó en la app móvil (para que
               la página de retorno sepa devolver el control a la app vía
               el deep link gympro://), "" en cualquier otro caso.

    FRONTEND_URL (ver url_base_front) es la fuente de verdad: se usa siempre
    que apunte a un dominio público, tanto si el pago viene de la web como
    de la app móvil -- en producción eso es https://gympro.lat.

    Solo se sustituye por el host con el que la app llamó a la API
    (request.host_url) cuando FRONTEND_URL apunta a localhost/127.0.0.1 *y*
    el origen es la app móvil: eso solo pasa en desarrollo, donde el nginx
    del contenedor "web" sirve el frontend y proxea /api/ en el mismo puerto
    (8080) -- y hace falta porque en el teléfono 'localhost' es el propio
    teléfono, no la máquina que corre el frontend, así que ahí no hay forma
    de llegar al FRONTEND_URL configurado.

    Reusar request.host_url también en producción (como se hacía antes) es
    incorrecto: la app móvil llega a la API por su propio subdominio
    (api.gympro.lat), distinto del dominio del frontend (gympro.lat) -- y,
    como no hay un ProxyFix delante del proxy de Nginx (ver
    deploy/nginx/*.conf) que le haga confiar en X-Forwarded-Proto, Flask
    reporta el esquema como http:// aunque la conexión pública real sea
    https://. El resultado era un back_url con el dominio Y el esquema
    equivocados, que Mercado Pago rechazaba con 400 "back_urls invalid.
    Wrong format" -- solo para pagos desde la app, nunca desde la web
    (que sí usa FRONTEND_URL directamente).
    """
    es_movil = (origen or "").lower() == "mobile"
    sufijo = "&app=1" if es_movil else ""

    front = url_base_front()
    if es_movil and front.startswith(_PREFIJOS_LOCALHOST):
        front = request.host_url.rstrip("/")

    return front, sufijo
