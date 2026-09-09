#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

"$SCRIPT_DIR/prepare-docker-ca.sh"

echo "============================================"
echo " Athlete Management App — Setup"
echo "============================================"
echo ""

if [ ! -f .env ]; then
  echo "No .env file found. Creating from .env.example..."
  cp .env.example .env
  echo ".env created."
  echo ""
else
  echo ".env already exists. Updating JWT_SECRET and admin password only."
  echo ""
fi

JWT_SECRET=$(openssl rand -base64 48)
if grep -q "^JWT_SECRET=" .env; then
  sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env && rm -f .env.bak
else
  echo "JWT_SECRET=${JWT_SECRET}" >> .env
fi
echo "Generated random JWT_SECRET."

echo ""
read -r -s -p "Enter admin password (min 8 characters): " ADMIN_PASSWORD
echo ""

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  echo "ERROR: Password must be at least 8 characters."
  exit 1
fi

sed -i.bak "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=${ADMIN_PASSWORD}|" .env && rm -f .env.bak
echo "Admin password set."

echo ""
echo "Please review .env and update any remaining CHANGE_ME values:"
grep -n "CHANGE_ME" .env || echo "  (no CHANGE_ME placeholders remaining)"
echo ""

read -r -p "Start the application now? [Y/n] " REPLY
REPLY=${REPLY:-Y}

if [[ "$REPLY" =~ ^[Yy]$ ]]; then
  echo ""
  echo "Starting application..."
  docker compose up -d --build
  echo ""
  echo "Application started. Open http://localhost:3000 in your browser."
else
  echo ""
  echo "Setup complete. Run 'docker compose up -d --build' when ready."
fi
