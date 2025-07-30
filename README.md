# timeboxTrack

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.19.

## 🐳 Docker

### 🚀 Inicio Rápido

#### Usando scripts de ayuda (Recomendado)

**Windows:**
```cmd
# Producción
docker-run.bat prod

# Desarrollo
docker-run.bat dev

# Ver ayuda
docker-run.bat help
```

**Linux/MacOS:**
```bash
# Hacer ejecutable (solo la primera vez)
chmod +x docker-run.sh

# Producción
./docker-run.sh prod

# Desarrollo
./docker-run.sh dev

# Ver ayuda
./docker-run.sh help
```

### 📋 Opciones Manuales

#### Opción 1: Docker Compose

**Producción:**
```bash
docker-compose up --build
# URL: http://localhost:4000
```

**Desarrollo:**
```bash
docker-compose --profile dev up --build
# URL: http://localhost:4200
```

#### Opción 2: Docker Directo

**Producción:**
```bash
docker build -t timebox-track .
docker run -p 4000:4000 timebox-track
```

**Desarrollo:**
```bash
docker build -f Dockerfile.dev -t timebox-track-dev .
docker run -p 4200:4200 -v $(pwd):/app -v /app/node_modules timebox-track-dev
```

### 🌐 URLs de Acceso

#### Docker (Backend Productivo)
- **Producción**: http://localhost:4000 → Backend: http://10.90.0.190:3000
- **Desarrollo**: http://localhost:4200 → Backend: http://10.90.0.190:3000

#### Desarrollo Local (ng serve)
- **Frontend**: http://localhost:4200 → Backend: http://localhost:3000

### ⚙️ Configuraciones de Entorno

La aplicación está configurada para usar diferentes backends automáticamente:

| Entorno | Frontend | Backend | Comando |
|---------|----------|---------|---------|
| **Docker Producción** | localhost:4000 | 10.90.0.190:3000 | `docker-run.bat prod` |
| **Docker Desarrollo** | localhost:4200 | 10.90.0.190:3000 | `docker-run.bat dev` |
| **Local Desarrollo** | localhost:4200 | localhost:3000 | `ng serve` |

Los archivos de configuración están en:
- `src/environments/environment.ts` - Desarrollo local
- `src/environments/environment.docker.ts` - Docker (productivo)
- `src/environments/environment.prod.ts` - Producción

### 🛠️ Comandos Útiles
```bash
# Detener contenedores
docker-compose down

# Ver logs
docker-compose logs -f

# Limpiar todo
docker-compose down --volumes --remove-orphans

# Desarrollo local con backend local
ng serve

# Ver configuración actual en consola del navegador
# (Se muestra automáticamente al cargar la app)
```

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
