# start-mobile.ps1 -- Inicia GymPro Mobile (Expo) localmente con Node.js
#
# Uso:
#   .\start-mobile.ps1              # instala deps si faltan y arranca Metro
#   .\start-mobile.ps1 -install     # fuerza reinstalacion de node_modules
#   .\start-mobile.ps1 -ip 192.168.1.45  # fuerza IP de la API
#
# Requisitos: Node.js >= 20 instalado en Windows (nodejs.org)

param(
    [switch]$install,
    [string]$ip = ""
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# -- Verificar Node.js ----------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[start-mobile] ERROR: Node.js no encontrado." -ForegroundColor Red
    Write-Host "  Descarga e instala desde: https://nodejs.org/en/download" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = (node --version)
Write-Host "[start-mobile] Node.js $nodeVersion detectado." -ForegroundColor Green

# -- Detectar IP LAN real -------------------------------------------------------
if ($ip -eq "") {
    $candidates = Get-NetIPAddress -AddressFamily IPv4 `
        | Where-Object {
            $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet|Hyper-V|VirtualBox|vmnet|Tailscale|ZeroTier" `
            -and $_.PrefixOrigin -ne "WellKnown" `
            -and $_.IPAddress -ne "127.0.0.1" `
            -and $_.IPAddress -notmatch "^169\.254\." `
            -and $_.IPAddress -notmatch "^192\.168\.65\."
        } | Sort-Object InterfaceMetric

    $best = $candidates | Where-Object { $_.InterfaceAlias -match "Wi-Fi|WiFi|Wireless" } | Select-Object -First 1
    if (-not $best) { $best = $candidates | Where-Object { $_.InterfaceAlias -match "Ethernet" } | Select-Object -First 1 }
    if (-not $best) { $best = $candidates | Select-Object -First 1 }

    if (-not $best) {
        Write-Host "[start-mobile] ERROR: No se encontro una IP LAN valida." -ForegroundColor Red
        Write-Host "  Usa: .\start-mobile.ps1 -ip 192.168.X.X" -ForegroundColor Yellow
        exit 1
    }
    $ip = $best.IPAddress
    Write-Host "[start-mobile] IP detectada: $ip  ($($best.InterfaceAlias))" -ForegroundColor Green
} else {
    Write-Host "[start-mobile] IP forzada: $ip" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  API:    http://${ip}:8080/api" -ForegroundColor White
Write-Host "  Metro:  http://${ip}:8081" -ForegroundColor White
Write-Host "  Escanea el QR con Expo Go (misma red WiFi)." -ForegroundColor White
Write-Host ""

# -- Instalar dependencias si es necesario --------------------------------------
$mobileDir = Join-Path $PSScriptRoot "mobile"
$nodeModules = Join-Path $mobileDir "node_modules"

if ($install -or -not (Test-Path $nodeModules)) {
    Write-Host "[start-mobile] Instalando dependencias npm..." -ForegroundColor Cyan
    Push-Location $mobileDir
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
    Pop-Location
}

# -- Arrancar Metro -------------------------------------------------------------
# EXPO_PUBLIC_API_BASE_URL es leida por constants/Api.ts si hostUri no resuelve bien
$env:EXPO_PUBLIC_API_BASE_URL = "http://${ip}:8080/api"

Write-Host "[start-mobile] Arrancando Metro Bundler..." -ForegroundColor Cyan
Push-Location $mobileDir
npx expo start --host lan
Pop-Location
