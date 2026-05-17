# Clean restart of Hyperion wails dev (Windows).
$ErrorActionPreference = "Stop"

Write-Host "[dev] killing stale processes..."
Get-Process -Name "hyperion-desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "wails" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Set-Location $PSScriptRoot

Write-Host "[dev] regenerating Wails bindings..."
wails generate module

Write-Host "[dev] launching wails dev..."
wails dev
