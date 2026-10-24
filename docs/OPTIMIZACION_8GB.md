# Optimización del stack para VPS de 8 GB (Contabo Cloud VPS 10)

Objetivo: que GymPro completo (Postgres + Mongo + Redis + API + web + Ollama) corra
con holgura en **8 GB / 4 vCPU**, consumiendo el mínimo de recursos sin perder función.

## Cambios aplicados

| # | Archivo | Cambio | Por qué |
|---|---------|--------|---------|
| 1 | `api/Dockerfile` | Eliminado `openjdk-17-jre-headless` y `JAVA_HOME` | La IA se migró de PySpark → scikit-learn (ver `spark_config.py`). La JVM era peso muerto: imagen **~200 MB más ligera**, build más rápido, menos superficie de ataque. Ningún módulo de `app/` importa pyspark. |
| 2 | `api/entrypoint.sh` | Gunicorn `4 sync` → `2 gthread × 4 threads` (+ `max-requests`) | ~½ de RAM (cada worker fork carga sklearn+pandas+numpy ≈ 300 MB). gthread es mejor para las llamadas a Ollama (I/O-bound, hasta 5 min): los threads no bloquean el worker. Thread-safe con NullPool + scoped_session. Reciclado por `max-requests` evita fugas. |
| 3 | `docker-compose.prod.yml` (nuevo) | `--wiredTigerCacheSizeGB 1` en Mongo | WiredTiger toma por defecto ~50% de (RAM-1GB) ≈ **3.5 GB**. Capado a 1 GB. |
| 4 | `docker-compose.prod.yml` | `OLLAMA_KEEP_ALIVE=60s`, `MAX_LOADED_MODELS=1`, `NUM_PARALLEL=1` | Descarga el modelo de RAM (~4 GB) tras 60 s sin uso; una sola inferencia a la vez evita picos que tumben el host. |
| 5 | `docker-compose.prod.yml` | `mem_limit` por servicio + Redis `maxmemory 96mb` LRU + Postgres `shared_buffers=128MB` | Ningún servicio puede acaparar RAM ni provocar OOM del host. |
| 6 | `docker-compose.prod.yml` | `ports: []` en postgres/mongo/ollama | Solo `web` (8080) mira al exterior; datos accesibles solo por la red interna `gympro` (o túnel SSH). |

### Presupuesto de RAM resultante (pico, sin ETL+IA en paralelo)
`SO+Docker 0.5 · Postgres 0.25 · Mongo 1.2 · Redis 0.1 · API 1.0 · web 0.03 · Ollama 4.0 ≈ 7 GB` → entra en 8 GB. El swap cubre picos puntuales.

## Despliegue

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
docker compose exec ollama ollama pull phi3:mini   # solo la 1ª vez (~2 min)

# Colchón de swap (recomendado en 8 GB)
sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Monitorear consumo real durante el piloto
docker stats
```

## Pendiente menor (no bloquea el piloto)
- `requirements.txt` de la **raíz** del repo todavía lista `pyspark==3.5.7` (legacy). El build NO lo usa —usa `api/requirements.txt` con scikit-learn— pero conviene limpiarlo para evitar confusión.
- Regla operativa en 8 GB: evita lanzar un análisis de IA (sklearn pesado) y una inferencia de Ollama exactamente a la vez. En el Cloud VPS 20 (12 GB, +$2/mes) esta precaución no haría falta.
