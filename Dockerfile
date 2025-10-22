# Dockerfile Multi-stage para aplicación Angular con SSR
# Etapa 1: Build de la aplicación
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación para Docker (con backend de producción)
RUN npm run build:docker

# Etapa 2: Imagen de producción
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar los archivos construidos desde la etapa de build
COPY --from=builder /app/dist ./dist

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S angular -u 1001

# Cambiar ownership de archivos al usuario nodejs
RUN chown -R angular:nodejs /app
USER angular

# Exponer el puerto
EXPOSE 4000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=4000

# Comando de inicio
CMD ["node", "dist/timebox-track/server/server.mjs"]