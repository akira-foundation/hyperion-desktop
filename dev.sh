#!/usr/bin/env bash
# Clean restart of Hyperion wails dev.
set -e

echo "[dev] killing stale processes..."
pkill -f "hyperion-desktop" 2>/dev/null || true
pkill -f "wails dev" 2>/dev/null || true
sleep 1

cd "$(dirname "$0")"

echo "[dev] regenerating Wails bindings..."
wails generate module

echo "[dev] launching wails dev..."
exec wails dev
