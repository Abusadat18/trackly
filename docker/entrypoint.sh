#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node dist/prisma/seed.js || echo "Seed skipped (may already be seeded)"

echo "Starting API server..."
exec node dist/main.js
