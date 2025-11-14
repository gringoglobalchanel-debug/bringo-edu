#!/bin/bash

echo "🔨 Building React app..."
npm run build

echo "📁 Copying build to docs folder..."
rm -rf docs/*
cp -r build/* docs/

echo "🚀 Deploying to GitHub Pages..."
git add docs/
git commit -m "deploy: $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo "✅ Deploy completed! Visit: https://tu-usuario.github.io/bringo-edu"
