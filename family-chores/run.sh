#!/bin/bash

echo "[INFO] Starting HomeHero..."
echo "[INFO] Using SQLite database at /data/family-chores.db"

cd /app
exec npm start
