#!/bin/sh
set -e
npm install --ignore-scripts
npx prisma generate --no-engine
