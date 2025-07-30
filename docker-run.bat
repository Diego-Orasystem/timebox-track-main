@echo off
REM Script para facilitar el uso de Docker con timebox-track en Windows

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="prod" goto prod
if "%1"=="dev" goto dev
if "%1"=="build" goto build
if "%1"=="stop" goto stop
if "%1"=="clean" goto clean
goto error

:help
echo Uso: docker-run.bat [OPCION]
echo.
echo Opciones:
echo   prod      Ejecutar en modo produccion (puerto 4000)
echo   dev       Ejecutar en modo desarrollo (puerto 4200)
echo   build     Solo construir las imagenes sin ejecutar
echo   stop      Detener todos los contenedores
echo   clean     Limpiar imagenes y contenedores
echo   help      Mostrar esta ayuda
echo.
echo Ejemplos:
echo   docker-run.bat prod    # Ejecutar en produccion
echo   docker-run.bat dev     # Ejecutar en desarrollo
echo   docker-run.bat stop    # Detener contenedores
goto end

:prod
echo 🚀 Iniciando aplicacion en modo PRODUCCION...
echo 📍 Frontend: http://localhost:4000
echo 🔗 Backend: http://10.90.0.190:3000
docker-compose up --build
goto end

:dev
echo 🛠️  Iniciando aplicacion en modo DESARROLLO (Docker)...
echo 📍 Frontend: http://localhost:4200
echo 🔗 Backend: http://10.90.0.190:3000
docker-compose --profile dev up --build
goto end

:build
echo 🔨 Construyendo imagenes de Docker...
docker-compose build
docker build -f Dockerfile.dev -t timebox-track-dev .
echo ✅ Imagenes construidas exitosamente
goto end

:stop
echo 🛑 Deteniendo contenedores...
docker-compose down
echo ✅ Contenedores detenidos
goto end

:clean
echo 🧹 Limpiando imagenes y contenedores...
docker-compose down --volumes --remove-orphans
docker image rm timebox-track timebox-track-dev 2>nul
echo ✅ Limpieza completada
goto end

:error
echo ❌ Opcion no valida: %1
echo.
goto help

:end