# Decisión de servidor — Contabo Cloud VPS (piloto GymPro, julio 2026)

Hoja para revisar con el equipo. Tipo de cambio usado: 1 € ≈ 1,08 USD ≈ 18,6 MXN (1 USD = 17,22 MXN).

---

## 1. Configuración que estamos viendo (Cloud VPS 10, 12 meses)

| Campo | Valor | Nota |
|---|---|---|
| Plan | **Cloud VPS 10** | 4 vCPU · **8 GB RAM** · 1 snapshot · puerto 200 Mbit/s |
| Contrato | **12 meses** (ahorro 20%) | Base **€4,40/mes**. A 1 mes serían €5,50; a 6 meses €4,95. |
| Región | **EE.UU. Oeste** (+€1,30/mes) | **79 ms** de latencia → la mejor para México. La UE es gratis pero son 182 ms. |
| Almacenamiento | 150 GB SSD (gratis) *o* 75 GB NVMe (gratis) | **Decisión abierta** — ver punto 3. |
| Auto Backup | **Desactivado** ahora | +€1,50/mes. Recomendado para piloto con datos reales. |
| Imagen | Ubuntu (incluido) | Usar Ubuntu 22.04/24.04 LTS. |
| IPv4 | 1 dirección (gratis) | Suficiente. |
| **Total actual** | **€5,70/mes → €68,40 al año** | ≈ **74 USD ≈ 1.272 MXN/año** |
| **Con Auto Backup** | **€7,20/mes → €86,40 al año** | ≈ **93 USD ≈ 1.608 MXN/año** |

> Importante: **sin cargo inicial** (Contabo lo tiene en €0). El "Total a pagar hoy €68,40" es el año completo por adelantado.

---

## 2. Comparación VPS 10 vs VPS 20

| | **Cloud VPS 10** | **Cloud VPS 20** |
|---|---|---|
| vCPU | 4 | **6** |
| RAM | **8 GB** | **12 GB** |
| Disco (NVMe base) | 75 GB | 100 GB |
| Snapshots | 1 | 2 |
| Puerto | 200 Mbit/s | 300 Mbit/s |
| Base 12 meses | €4,40/mes | ≈ €6,1–6,5/mes *(confirmar en la misma página)* |
| Total/año c/región US + backup | ≈ €86 (~93 USD / 1.608 MXN) | ≈ €105–110 (~115 USD / ~2.000 MXN) |
| ¿Necesita el tuning fino de 8 GB? | **Sí** (caché Mongo capada, swap, no IA+ETL a la vez) | **No** — corre todo con holgura |
| Margen para 2º gimnasio / multi-tenant | Justo | **Cómodo** |

**Diferencia real: ~€2/mes (~€24/año ≈ 440 MXN/año) por +50% RAM, +2 vCPU y +25 GB.**

> Para tener el número exacto del VPS 20: en esta misma pantalla pulsa **"Cambiar"** (arriba, junto a la ficha del plan) → elige Cloud VPS 20 manteniendo **misma región, mismo storage y mismo backup**. El "Total a pagar hoy" te da el delta limpio.

---

## 3. Cuatro decisiones a cerrar con el equipo

1. **RAM: 8 GB (VPS 10) vs 12 GB (VPS 20).**
   Con las optimizaciones que ya dejé en el repo, el stack **cabe en 8 GB** (pico ≈ 7 GB). Pero el proyecto está en rama `saas` (multi-tenant): si se suma un segundo gimnasio o se quiere correr IA + analítica a la vez sin pensar, **el VPS 20 es la compra más inteligente** por solo ~€24/año más.

2. **Disco: 75 GB NVMe vs 150 GB SSD (ambos gratis).**
   - NVMe = más rápido en I/O de base de datos (mejor para Postgres + Mongo).
   - 150 GB SSD = más espacio para uploads de medios (fotos de socios/ejercicios), backups y modelos de Ollama.
   - Recomendación: **75 GB NVMe** para el piloto (las BDs de un gimnasio son pequeñas y la velocidad ayuda). Pasar a 150 GB SSD solo si se prevén muchas imágenes.

3. **Auto Backup (+€1,50/mes).**
   Para una prueba con **datos reales del gimnasio**, vale la pena: copias diarias automáticas, 10 versiones, restore en 1 clic. Recomendado **activarlo**.

4. **Región: EE.UU. Oeste (+€1,30, 79 ms).**
   Confirmada como la mejor para México. La opción UE gratis (182 ms) se notaría lenta en la app.

---

## 4. Recomendación

**Para el piloto inmediato:** VPS 10 (8 GB) + 75 GB NVMe + Auto Backup + US Oeste = **~€86/año (~1.600 MXN)**. Funciona con el stack ya optimizado.

**Si el equipo ve cerca el segundo gimnasio / SaaS multi-tenant:** subir a **VPS 20 (12 GB)** por ~€24/año más y olvidarse del tuning fino. Es lo que yo elegiría dado que el repo ya va por la rama `saas`.

Ambas opciones quedan dentro del presupuesto de ~150 USD/año.

---

## 5. Para tus anotaciones rápidas

```
Proveedor : Contabo (Cloud VPS)
Plan      : VPS 10 (8GB/4vCPU)  | VPS 20 (12GB/6vCPU)  ← decidir
Contrato  : 12 meses (ahorro 20%, sin cargo inicial)
Región    : EE.UU. Oeste (79 ms) +€1,30/mes
Disco     : 75 GB NVMe (rápido) | 150 GB SSD (más espacio)  ← decidir
Backup    : Auto Backup +€1,50/mes  ← recomendado SÍ
SO        : Ubuntu LTS
Costo VPS10 final (NVMe+backup+US) : ~€86/año ≈ 1.600 MXN
Costo VPS20 final (estimado)       : ~€107/año ≈ 2.000 MXN
Acceso    : usuario root + se agregan claves SSH luego en el panel
```
