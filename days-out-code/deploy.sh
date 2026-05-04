#!/bin/bash
set -e

echo "=== Days Out deploy ==="

cd /opt/days-out
git pull

cd days-out-code

echo "Building image..."
docker compose build app

echo "Starting database..."
docker compose up -d db

echo "Waiting for database to be healthy..."
until docker compose exec db pg_isready -U daysout 2>/dev/null; do
  printf "."
  sleep 2
done
echo " ready."

echo "Running migrations..."
docker compose run --rm --no-deps app npm run db:migrate

echo "Starting all services..."
docker compose up -d

echo "=== Deploy complete ==="
