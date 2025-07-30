# timeboxTrack

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.19.

## 🐳 Docker

### Opción 1: Usando Docker Compose (Recomendado)

#### Producción
```bash
# Construir y ejecutar la aplicación en modo producción
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build
```

#### Desarrollo
```bash
# Ejecutar en modo desarrollo con hot-reload
docker-compose --profile dev up --build
```

### Opción 2: Usando Docker directamente

#### Producción
```bash
# Construir la imagen
docker build -t timebox-track .

# Ejecutar el contenedor
docker run -p 4000:4000 timebox-track
```

#### Desarrollo
```bash
# Construir la imagen de desarrollo
docker build -f Dockerfile.dev -t timebox-track-dev .

# Ejecutar el contenedor de desarrollo
docker run -p 4200:4200 -v $(pwd):/app -v /app/node_modules timebox-track-dev
```

### Acceso a la aplicación
- **Producción (SSR)**: http://localhost:4000
- **Desarrollo**: http://localhost:4200

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
