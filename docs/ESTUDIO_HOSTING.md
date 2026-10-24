# Estudio de hosting — GymPro (piloto julio 2026)

> Objetivo: alojar el stack completo de GymPro para una prueba con datos reales de un gimnasio a inicios de julio, con **precio fijo anual ≤ ~150 USD** e incluyendo el módulo de IA (Ollama) en el mismo servidor.

---

## 1. Veredicto rápido

| | Recomendación |
|---|---|
| **Tipo de hosting** | **VPS / Cloud Server con root + Docker.** El hosting compartido (Hostinger Shared, HostGator Shared, etc.) **queda descartado**: no permite Docker, root, ni levantar Mongo/Postgres/Redis/Ollama como servicios. |
| **Mejor opción dentro de presupuesto** | **Hetzner CX32** (4 vCPU / 8 GB / 80 GB NVMe) — ~7,5 €/mes ≈ **~90 USD/año**. Mejor rendimiento por euro y precio plano sin trampa de renovación. |
| **Mejor opción si quieres holgura de RAM** | **Contabo Cloud VPS M** (6 vCPU / 16 GB / NVMe) — ~14 USD/mes ≈ **~168 USD/año** (ligeramente sobre presupuesto; baja con pago a 12 meses). Es lo más cómodo para Ollama + Spark simultáneos. |
| **A evitar** | **Hostinger VPS** (precio promo engañoso, renovación ~15 USD/mes y solo 2 vCPU) y **HostGator** (VPS caro, orientado a cPanel/EE.UU., poco amistoso con Docker). |

---

## 2. Qué usa el proyecto (inventario real del stack)

Leído de `docker-compose.yml`, `api/Dockerfile` y `requirements.txt`:

| Servicio | Imagen / runtime | Rol | Coste de recursos |
|---|---|---|---|
| `postgres` | postgres:16-alpine | Plataforma, finanzas, multi-tenant | Bajo (~150–250 MB) |
| `mongo` | mongo:7 | Datos operativos | **Alto si no se limita** (WiredTiger toma ~50% de la RAM por defecto) |
| `redis` | redis:7-alpine | Cache + rate limiting (Flask-Limiter) | Muy bajo (~50 MB) |
| `api` | Flask + Gunicorn, **Python 3.12 + Java 17 (PySpark 3.5.7)** | Backend, ETL con Spark, backups (pg_dump/mongodump) | Medio-alto: el job de Spark levanta una JVM (~1–2 GB en picos) |
| `web` | React build servido por nginx | Frontend | Bajo (~30 MB) |
| `ollama` | ollama/ollama + `phi3:mini` | LLM local para el AI-ETL | **Alto**: ~2,3 GB de modelo + runtime → ~3–4 GB en inferencia |
| `mobile` | Expo / Metro | **No se despliega en el servidor** (corre local en dev) | — |

**Conclusión técnica:** son 6 contenedores en producción, dos de ellos pesados en RAM (Mongo sin tunear y Ollama). El cuello de botella **no es el tráfico** (un solo gimnasio de prueba), sino la **memoria** cuando coinciden un job de Spark y una inferencia de Ollama.

### Presupuesto de RAM estimado (pico realista)

| Componente | RAM en pico |
|---|---|
| SO + Docker | ~0,5 GB |
| PostgreSQL | ~0,25 GB |
| MongoDB (con `--wiredTigerCacheSizeGB 1`) | ~1,2 GB |
| Redis | ~0,05 GB |
| Gunicorn + driver Spark (JVM) | ~1,5–2 GB |
| nginx | ~0,03 GB |
| Ollama (phi3:mini en inferencia) | ~3,5–4 GB |
| **Total pico** | **~7–8,5 GB** |

→ **8 GB es el suelo absoluto** (funciona con tuning + swap si el ETL/IA no corren en paralelo). **16 GB es lo recomendable** para un piloto sin sustos.

---

## 3. Por qué el hosting compartido no sirve

Hostinger, HostGator, Bluehost, etc. en su plan *Shared/Cloud Hosting* (lo que se asocia a "alojar una web barata"):

- Sin acceso root ni Docker → no puedes levantar `docker compose`.
- Sin posibilidad de instalar Java/Spark, Ollama, Mongo ni Postgres propios (solo MySQL gestionado y limitado).
- Pensados para PHP/WordPress, no para un stack contenerizado con LLM local.

Tu proyecto **exige un VPS/Cloud con root**. Todo lo que sigue compara esa categoría.

---

## 4. Comparativa de VPS (precio plano, junio 2026)

Precios en USD aprox. (1 € ≈ 1,08 USD). "Plano" = sin truco de promo/renovación.

| Proveedor / plan | vCPU | RAM | Disco | Precio/mes | **Precio/año** | Notas |
|---|---|---|---|---|---|---|
| **Hetzner CX32** | 4 | 8 GB | 80 GB NVMe | ~7,5 USD | **~90 USD** ✅ | Mejor rendimiento/€, red excelente, facturación plana por hora/mes. DC en EE.UU. (Ashburn/Hillsboro) y EU. |
| **Contabo VPS S** | 4 | 8 GB | ~100–200 GB NVMe | ~6,99 USD | **~84 USD** ✅ | Mucho disco, precio plano. CPU compartida/sobrevendida → más lento en picos. DC en EE.UU. disponible. |
| **Contabo VPS M** | 6 | **16 GB** | NVMe | ~13,99 USD | **~168 USD** ⚠️ | Holgura ideal para Ollama+Spark. Algo sobre presupuesto; baja con commit a 12 meses. |
| **Hetzner CX42** | 8 | 16 GB | 160 GB NVMe | ~17–18 USD | ~210 USD ❌ | Excelente pero fuera de presupuesto. |
| Hostinger VPS KVM 2 | 2 | 8 GB | 100 GB | promo 8,99 / **renueva ~14,99** | ~108 año 1 → **~180 después** ❌ | Solo 2 vCPU (pobre para Spark), precio **no fijo** (sube fuerte al renovar). |
| HostGator VPS | 2 | 8 GB | 120 GB | ~20–30+ USD | ~250–360 USD ❌ | Caro, orientado a cPanel/EE.UU., poco idiomático para Docker. |

✅ entra en presupuesto · ⚠️ borde · ❌ fuera o no recomendado

---

## 5. Recomendación

**Para el piloto de julio, en orden:**

1. **Contabo Cloud VPS M (16 GB) — recomendado si aceptas ~168 USD/año.** Es la opción que corre **todo el stack incluido Ollama sin tuning agresivo**. Como eres dev con Docker, su CPU compartida no es problema para un solo gimnasio. Pago anual reduce el coste mensual y elimina sorpresas de renovación.

2. **Hetzner CX32 (8 GB) — recomendado si quieres ceñirte a ≤100 USD/año.** Más rápido por core y mejor red que Contabo, pero **obliga a tunear memoria** (sección 6). Precio totalmente plano, sin promo/renovación.

> Si dudas: empieza en **Hetzner CX32** (puedes redimensionar a 16 GB en caliente desde el panel si te quedas corto, pagando por hora). Es la decisión más reversible.

**Descarta Hostinger/HostGator VPS** para este caso: pagas más por menos vCPU y, en Hostinger, el "precio bajo" no es fijo.

---

## 6. Tuning para que el stack entre en 8 GB (si eliges CX32)

```yaml
# docker-compose.override.yml (producción) — recortes de memoria
services:
  mongo:
    command: ["--wiredTigerCacheSizeGB", "1"]   # evita que Mongo acapare la RAM
    mem_limit: 1500m

  ollama:
    mem_limit: 4500m
    environment:
      OLLAMA_KEEP_ALIVE: "30s"   # descarga el modelo de RAM tras inactividad

  api:
    mem_limit: 2g
    environment:
      SPARK_ENABLED: "true"
      # En service.py / config Spark, fija driver memory bajo:
      # spark.driver.memory=1g  spark.master=local[2]
```

Además, en el servidor:

```bash
# 4 GB de swap como colchón para picos no concurrentes
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Regla operativa del piloto: **no lances el ETL con Spark mientras corre una inferencia de Ollama** en 8 GB. En 16 GB no necesitas esta precaución.

---

## 7. Plan de despliegue para inicios de julio

1. **Contratar VPS** (Ubuntu 22.04/24.04 LTS) e instalar Docker + Compose plugin.
2. **Hardening base**: usuario no-root, SSH por clave, `ufw` permitiendo solo 22/80/443, fail2ban.
3. **Cerrar puertos de datos**: en producción, **quitar** los `ports:` expuestos de `postgres` (5433), `mongo` (27035) y `ollama` (11434) — que queden solo en la red interna `gympro`. Solo `web` (80/443) mira al exterior.
4. **TLS**: poner Caddy o nginx + Let's Encrypt delante de `web`/`api` (dominio o subdominio del gimnasio).
5. **Secrets**: `api/.env` con credenciales reales (no las default `gymuser/gympassword`); activar auth en Mongo (`MONGO_INITDB_ROOT_*`).
6. **Arranque**: `docker compose up --build -d` y `docker compose exec ollama ollama pull phi3:mini` (una sola vez, ~2 min).
7. **Backups**: ya tienes pg_dump/mongodump en la API; programa un cron diario que vuelque a `./backups` y, idealmente, a un bucket S3/Backblaze B2 barato.
8. **Verificación**: `GET /api/health`, carga de datos reales del gimnasio y prueba del AI-ETL antes de abrir a usuarios.

---

## 8. Checklist de seguridad mínima (producción)

- [ ] Sin puertos de BD/Ollama expuestos al exterior (solo red Docker interna)
- [ ] Contraseñas Postgres/Mongo cambiadas y fuera del repo (`.env` git-ignored)
- [ ] Mongo con autenticación habilitada
- [ ] HTTPS forzado (redirección 80→443)
- [ ] Firewall (ufw) + fail2ban
- [ ] Backups automáticos verificados (restore test)
- [ ] `restart: unless-stopped` ya presente en todos los servicios ✔️

---

*Fuentes de precios (jun 2026): páginas oficiales y comparadores de Hetzner, Contabo y Hostinger. Los precios de VPS varían con el tipo de cambio €/USD y promociones; confirmar en el panel del proveedor antes de contratar.*
