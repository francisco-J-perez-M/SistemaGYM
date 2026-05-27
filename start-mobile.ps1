# start-mobile.ps1 — Arranca el contenedor mobile con la IP LAN correcta
#
# Uso:
#   .\start-mobile.ps1            # detecta IP automáticamente
#   .\start-mobile.ps1 -rebuild   # reconstruye la imagen antes de arrancar
#   .\start-mobile.ps1 -ip 192.168.1.45  # fuerza una IP específica
#
# Por qué es necesario:
#   Docker Desktop en Windows resuelve "host.docker.internal" como 192.168.65.254
#   (IP interna de la VM de Docker), NO la IP WiFi/LAN de la máquina Windows.
#   Un teléfono físico en la misma red WiFi NO puede alcanzar 192.168.65.254.
#   Este script detecta la IP real del adaptador WiFi o Ethernet activo y la
#   pasa como HOST_IP al contenedor, overrideando la detección automática.

param(
    [switch]$rebuild,
    [string]$ip = ""
)

# ── Detectar IP LAN real ───────────────────────────────────────────────────────
if ($ip -eq "") {
    Write-Host "[start-mobile] Detectando IP LAN..." -ForegroundColor Cyan

    # Obtener todas las IPs de adaptadores activos, excluyendo loopback y VPN típicas
    $candidates = Get-NetIPAddress -AddressFamily IPv4 `
        | Where-Object {
            $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet|Hyper-V|VirtualBox|vmnet|Tailscale|ZeroTier" `
            -and $_.PrefixOrigin -ne "WellKnown" `
            -and $_.IPAddress -ne "127.0.0.1" `
            -and $_.IPAddress -notmatch "^169\.254\." `
            -and $_.IPAddress -notmatch "^192\.168\.65\." `
            -and $_.IPAddress -notmatch "^172\.(1[6-9]|2[0-9]|3[01])\."
        } | Sort-Object InterfaceMetric

    if ($candidates.Count -eq 0) {
        Write-Host "[start-mobile] ERROR: No se encontró ninguna IP LAN válida." -ForegroundColor Red
        Write-Host "  Usa:  .\start-mobile.ps1 -ip 192.168.1.X" -ForegroundColor Yellow
        exit 1
    }

    # Preferir WiFi (Wi-Fi) > Ethernet > cualquier otra
    $best = $candidates | Where-Object { $_.InterfaceAlias -match "Wi-Fi|WiFi|Wireless" } | Select-Object -First 1
    if (-not $best) {
        $best = $candidates | Where-Object { $_.InterfaceAlias -match "Ethernet" } | Select-Object -First 1
    }
    if (-not $best) {
        $best = $candidates | Select-Object -First 1
    }

    $ip = $best.IPAddress
    Write-Host "[start-mobile] Usando IP: $ip  (adaptador: $($best.InterfaceAlias))" -ForegroundColor Green
} else {
    Write-Host "[start-mobile] IP forzada por parámetro: $ip" -ForegroundColor Yellow
}

# ── Validar formato IP ─────────────────────────────────────────────────────────
if ($ip -notmatch '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$') {
    Write-Host "[start-mobile] ERROR: '$ip' no es una IPv4 válida." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  La app móvil usará:  http://$ip`:8080/api" -ForegroundColor White
Write-Host "  Metro bundler en:    http://$ip`:8081" -ForegroundColor White
Write-Host "  Escanea el QR con Expo Go en tu teléfono (misma red WiFi)." -ForegroundColor White
Write-Host ""

# ── Arrancar contenedor ────────────────────────────────────────────────────────
$env:HOST_IP = $ip

if ($rebuild) {
    Write-Host "[start-mobile] Reconstruyendo imagen..." -ForegroundColor Cyan
    docker compose build mobile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "[start-mobile] Arrancando contenedor mobile..." -ForegroundColor Cyan
docker compose up mobile

