#!/bin/bash

# Script para facilitar el uso de Docker con timebox-track

show_help() {
    echo "Uso: ./docker-run.sh [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  prod      Ejecutar en modo producción (puerto 4000)"
    echo "  dev       Ejecutar en modo desarrollo (puerto 4200)"
    echo "  build     Solo construir las imágenes sin ejecutar"
    echo "  stop      Detener todos los contenedores"
    echo "  clean     Limpiar imágenes y contenedores"
    echo "  help      Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./docker-run.sh prod    # Ejecutar en producción"
    echo "  ./docker-run.sh dev     # Ejecutar en desarrollo"
    echo "  ./docker-run.sh stop    # Detener contenedores"
}

case "$1" in
    "prod")
        echo "🚀 Iniciando aplicación en modo PRODUCCIÓN..."
        echo "📍 Frontend: http://localhost:4000"
        echo "🔗 Backend: http://10.90.0.190:3000"
        docker-compose up --build
        ;;
    "dev")
        echo "🛠️  Iniciando aplicación en modo DESARROLLO (Docker)..."
        echo "📍 Frontend: http://localhost:4200"
        echo "🔗 Backend: http://10.90.0.190:3000"
        docker-compose --profile dev up --build
        ;;
    "build")
        echo "🔨 Construyendo imágenes de Docker..."
        docker-compose build
        docker build -f Dockerfile.dev -t timebox-track-dev .
        echo "✅ Imágenes construidas exitosamente"
        ;;
    "stop")
        echo "🛑 Deteniendo contenedores..."
        docker-compose down
        echo "✅ Contenedores detenidos"
        ;;
    "clean")
        echo "🧹 Limpiando imágenes y contenedores..."
        docker-compose down --volumes --remove-orphans
        docker image rm timebox-track timebox-track-dev 2>/dev/null || true
        echo "✅ Limpieza completada"
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "❌ Opción no válida: $1"
        echo ""
        show_help
        exit 1
        ;;
esac