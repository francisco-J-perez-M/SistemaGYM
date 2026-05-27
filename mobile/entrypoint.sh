#!/bin/sh
# ── GymPro Mobile — Auto-detect host IP for Metro bundler ───────────────────
# El dispositivo físico necesita conectarse al Metro bundler por la IP LAN
# real del host, no por 127.0.0.1 ni por la IP del contenedor.
#
# Estrategias de detección (en orden):
#   1. REACT_NATIVE_PACKAGER_HOSTNAME ya definida → usarla directamente
#   2. host.docker.internal             → Mac / Windows Docker Desktop
#   3. Variable HOST_IP del entorno     → inyectada por docker-compose
#   4. Gateway de la interfaz eth0      → Linux Docker (la IP del host suele
#      ser la del default gateway de la red bridge de Docker)
# ─────────────────────────────────────────────────────────────────────────────
set -e

if [ -z "$REACT_NATIVE_PACKAGER_HOSTNAME" ]; then

  # Estrategia 1: host.docker.internal (Docker Desktop en Mac/Windows)
  if getent hosts host.docker.internal > /dev/null 2>&1; then
    DETECTED_IP=$(getent hosts host.docker.internal | awk '{print $1}')
    echo "[entrypoint] Detectada IP via host.docker.internal: $DETECTED_IP"

  # Estrategia 2: variable HOST_IP pasada explícitamente
  elif [ -n "$HOST_IP" ]; then
    DETECTED_IP="$HOST_IP"
    echo "[entrypoint] Usando HOST_IP del entorno: $DETECTED_IP"

  # Estrategia 3: default gateway (Linux — el host suele ser el gateway de la red bridge)
  else
    DETECTED_IP=$(ip route | awk '/default/{print $3; exit}')
    echo "[entrypoint] Detectada IP via default gateway: $DETECTED_IP"
  fi

  export REACT_NATIVE_PACKAGER_HOSTNAME="$DETECTED_IP"
fi

echo "[entrypoint] REACT_NATIVE_PACKAGER_HOSTNAME = $REACT_NATIVE_PACKAGER_HOSTNAME"
echo "[entrypoint] El dispositivo deberá acceder a la API en: http://$REACT_NATIVE_PACKAGER_HOSTNAME:8080/api"

exec npx expo start --host lan --port 8081 --no-dev-client
