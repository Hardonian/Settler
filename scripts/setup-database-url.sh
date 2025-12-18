#!/bin/bash
# Setup DATABASE_URL from individual DB_* environment variables or use existing DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
  # Construct DATABASE_URL from individual components
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}
  DB_NAME=${DB_NAME:-settler}
  DB_USER=${DB_USER:-postgres}
  DB_PASSWORD=${DB_PASSWORD:-postgres}
  DB_SSL=${DB_SSL:-false}
  
  if [ "$DB_SSL" = "true" ]; then
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
  else
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  fi
  
  echo "✅ Constructed DATABASE_URL from DB_* variables"
else
  echo "✅ Using existing DATABASE_URL"
fi

echo "DATABASE_URL is set (host: ${DB_HOST:-$(echo $DATABASE_URL | grep -oP '@\K[^:]+')})"
