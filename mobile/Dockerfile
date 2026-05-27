# ── GymPro Mobile — Expo Dev Server ─────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Herramientas de red para detectar la IP del host (ip, getent)
RUN apk add --no-cache git curl iproute2 bind-tools

# Copiar manifiestos antes para aprovechar cache de capas
COPY package.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar el resto del proyecto
COPY . .

# Dar permisos al script de arranque
RUN chmod +x entrypoint.sh

# Metro bundler + Expo DevTools
EXPOSE 8081 19000 19001 19002

ENV NODE_ENV=development

# El entrypoint detecta automáticamente la IP del host
ENTRYPOINT ["./entrypoint.sh"]
