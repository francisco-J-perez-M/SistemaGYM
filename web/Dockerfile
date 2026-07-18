# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder
#   Node 20 LTS + react-scripts build (CRA 5)
#   React 19 requiere --legacy-peer-deps porque CRA 5 declara peerDeps en React 16-18
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests primero para aprovechar el cache de capas de Docker.
# Si package.json no cambia, npm ci se saltea y reutiliza la capa anterior.
COPY package.json package-lock.json ./

# --mount=type=cache reutiliza el cache global de npm (~/.npm) entre builds:
# cuando cambian dependencias, npm no vuelve a descargar los paquetes ya vistos.
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Build arg para URL base de la API en tiempo de compilación.
# CRA embebe las variables REACT_APP_* en el bundle estático.
# Valor por defecto "/api" asume que nginx hace el proxy en el mismo origen.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copiar el resto del código y construir
COPY . .

# Optimización de memoria del build (CRA OOM en máquinas/Docker con poca RAM):
#   - GENERATE_SOURCEMAP=false: evita generar source maps, que es lo que más
#     RAM consume en `react-scripts build` (suele ser la causa del "cannot
#     allocate memory"). Además acelera el build y reduce el bundle.
#   - NODE_OPTIONS=--max-old-space-size=2048: techo explícito del heap de V8.
#   - CI=false: evita que react-scripts trate los warnings de ESLint como errores
#     si algún entorno define CI=true (localmente CI viene vacío y ya pasaba).
ENV GENERATE_SOURCEMAP=false \
    NODE_OPTIONS=--max-old-space-size=2048 \
    CI=false
# Cache mount de la carpeta de cache de CRA (babel-loader, terser-webpack-plugin):
# en cambios SOLO de código el rebuild reutiliza el trabajo previo y el paso baja
# de ~125 s a decenas de segundos.
RUN --mount=type=cache,target=/app/node_modules/.cache \
    npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime
#   nginx:stable-alpine (< 50 MB) sirve los estáticos y proxea /api/ → Flask
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runtime

# Eliminar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar la configuración del SPA
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copiar el bundle generado por react-scripts
COPY --from=builder /app/build /usr/share/nginx/html

# nginx corre con usuario no-root (nginx:nginx ya definido en la imagen base)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
