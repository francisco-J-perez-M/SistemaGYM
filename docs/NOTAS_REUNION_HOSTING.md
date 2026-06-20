# Notas para reunión — Hosting piloto GymPro
_Para platicar con el equipo. TC: 1 USD = 17.22 MXN._

## Decisión propuesta
- **Proveedor:** Contabo — **Cloud VPS 20**
- **Specs:** 6 vCPU · 12 GB RAM · 100 GB NVMe · 2 snapshots · 300 Mbit/s
- **Facturación:** **MENSUAL** durante la prueba (NO anual)
- **Región:** EE.UU. Oeste (79 ms — mejor latencia para México)
- **SO:** Ubuntu LTS · **IPv4:** 1 (gratis)

## Costo
- **$11.50 USD/mes** (base $9.00 + región US Oeste $2.50) ≈ **198 MXN/mes**
- **Sin cargo inicial.**
- Prueba de 3 meses ≈ **$34.50 USD (~594 MXN)**
- (Anual prepagado serían $116.40 — NO conviene para 2-3 meses; el descuento 20% solo paga si nos quedamos ~10+ meses)

## Por qué VPS 20 y no VPS 10
- Por ~$2/mes más: +50% RAM (8→12 GB) y +2 vCPU (4→6).
- Aguanta **1-3 gimnasios + el módulo de IA (Ollama)** con holgura, sin tuning fino.

## Backup — lo dejamos SIN Auto Backup (ahorro $2.45/mes)
- Usamos los backups que **ya trae la app** (`pg_dump` + `mongodump`).
- + los **2 snapshots gratis** del plan antes de cambios riesgosos.

## Web React + dominio
- La **web React se aloja en el MISMO VPS** (ya es el servicio `web` del stack). Sin costo extra.
- **Dominio — decidir:**
  - DuckDNS = **gratis** (sirve para pruebas; menos serio ante un gym real)
  - `.com` en Cloudflare ≈ **$10.46/año (~180 MXN)** — recomendado, precio a costo, sin alza
  - `.com.mx` ≈ 293 MXN 1er año / `.mx` ≈ 445-630 MXN (solo si queremos marca MX)

## Presupuesto total estimado del piloto (3 meses)
- Servidor: ~$35 USD (~600 MXN)
- Dominio (opcional .com): ~$10 USD (~180 MXN)
- **Total ≈ $45 USD (~775 MXN)** por los 3 meses

## Alcance / siguiente paso
- Rama `saas` = **solo pruebas locales** por ahora.
- Producción (HTTPS/Caddy, hardening, cerrar puertos, secrets) se hará después en **rama `prod`**.
- Primero: terminar de limpiar y arreglar pendientes del proyecto.
