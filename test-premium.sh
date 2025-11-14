#!/bin/bash

echo "🔧 Cambiando a usuario FREE..."
sed -i 's/tienePremium: true/tienePremium: false/g' services/premium-service.js

echo "🏗️ Compilando aplicación..."
npm run build

echo "📁 Copiando build a docs..."
cp -r build/* docs/

echo "🚀 Haciendo deploy..."
git add .
git commit -m "test: free user simulation"
git push origin main

echo "✅ ¡Listo! En 1-2 minutos verás usuario FREE en:"
echo "   https://tu-usuario.github.io/bringo-edu"
