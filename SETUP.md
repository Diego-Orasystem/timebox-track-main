# Configuración del Proyecto Timebox Track

## Requisitos Previos

- Node.js (versión 16 o superior)
- MariaDB o MySQL
- Angular CLI (versión 17 o superior)

## Configuración del Backend

### 1. Configurar la Base de Datos

#### Opción A: Usar Docker (Recomendado)
```bash
# Crear y ejecutar contenedor de MariaDB
docker run --name mariadb-timebox \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=timebox_tracking \
  -e MYSQL_USER=timebox_user \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  -d mariadb:latest
```

#### Opción B: Instalar MariaDB Localmente
1. Descargar e instalar MariaDB desde https://mariadb.org/
2. Crear la base de datos y usuario:
```sql
CREATE DATABASE timebox_tracking;
CREATE USER 'timebox_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON timebox_tracking.* TO 'timebox_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configurar Variables de Entorno

Crear el archivo `.env` en el directorio `backend/`:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de base de datos MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=timebox_user
DB_PASSWORD=your_password
DB_NAME=timebox_tracking
DB_CONNECTION_LIMIT=10

# Configuración JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Configuración de archivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuración CORS
CORS_ORIGIN=http://localhost:4200
```

### 3. Instalar Dependencias e Inicializar Base de Datos

```bash
cd backend
npm install
npm run setup
```

### 4. Ejecutar el Backend

```bash
cd backend
npm start
```

El backend estará disponible en `http://localhost:3000`

## Configuración del Frontend

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Ejecutar el Frontend

```bash
ng serve
```

El frontend estará disponible en `http://localhost:4200`

## Estructura de la API

### Endpoints Principales

- `GET /api/projects` - Obtener todos los proyectos
- `POST /api/projects` - Crear un nuevo proyecto
- `GET /api/projects/:id` - Obtener un proyecto específico
- `PUT /api/projects/:id` - Actualizar un proyecto
- `DELETE /api/projects/:id` - Eliminar un proyecto

- `GET /api/timeboxes` - Obtener todos los timeboxes
- `POST /api/timeboxes` - Crear un nuevo timebox
- `GET /api/timeboxes/:id` - Obtener un timebox específico
- `PUT /api/timeboxes/:id` - Actualizar un timebox
- `DELETE /api/timeboxes/:id` - Eliminar un timebox

- `GET /api/timebox-categories` - Obtener categorías de timebox
- `GET /api/timebox-types` - Obtener tipos de timebox
- `GET /api/personas` - Obtener todas las personas

## Cambios Realizados

### Frontend

1. **Nuevo servicio API base** (`src/app/shared/services/api.service.ts`)
   - Maneja todas las llamadas HTTP al backend
   - Incluye manejo de errores centralizado
   - Usa configuración de entorno

2. **Servicio de API para Timeboxes** (`src/app/features/timebox/services/timebox-api.service.ts`)
   - Interfaz específica para operaciones de timeboxes
   - Métodos para CRUD de timeboxes
   - Métodos para categorías, tipos y personas

3. **Servicios actualizados**
   - `ProjectService`: Ahora usa el backend en lugar de datos mock
   - `TimeboxService`: Integrado con el nuevo servicio de API
   - Todos los métodos ahora retornan Observables

4. **Configuración de entorno**
   - `environment.ts`: Configuración para desarrollo
   - `environment.prod.ts`: Configuración para producción

### Backend

El backend ya está configurado con:
- Express.js con CORS habilitado
- MariaDB con conexión pool
- Rutas para proyectos y timeboxes
- Middleware de manejo de errores

## Solución de Problemas

### Error de Conexión a Base de Datos
- Verificar que MariaDB esté ejecutándose
- Confirmar credenciales en el archivo `.env`
- Verificar que el puerto 3306 esté disponible

### Error de CORS
- Verificar que `CORS_ORIGIN` en `.env` apunte a `http://localhost:4200`
- Reiniciar el backend después de cambiar la configuración

### Error de Frontend
- Verificar que el backend esté ejecutándose en el puerto 3000
- Confirmar que `environment.apiUrl` apunte a `http://localhost:3000/api`

## Próximos Pasos

1. Implementar autenticación JWT
2. Agregar validación de datos en el backend
3. Implementar paginación para listas grandes
4. Agregar tests unitarios y de integración
5. Configurar CI/CD 