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

RUN npm install --legacy-peer-deps

# Build arg para URL base de la API en tiempo de compilación.
# CRA embebe las variables REACT_APP_* en el bundle estático.
# Valor por defecto "/api" asume que nginx hace el proxy en el mismo origen.
ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Copiar el resto del código y construir
COPY . .
RUN npm run build

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
