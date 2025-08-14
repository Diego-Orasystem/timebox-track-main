# Mis Pagos - Componente de Finanzas

## 🎯 Descripción
Este componente permite visualizar los pagos de un usuario específico. Por defecto, está configurado para mostrar los pagos de **Juan Pérez**.

## 👤 Usuario por Defecto
- **Nombre**: Juan Pérez
- **ID**: `c4ec45fc-1939-43c6-9d4b-2be658567c79`
- **Estado**: Se configura automáticamente al cargar el componente

## 🚀 Funcionalidades

### 1. Configuración Automática
- Al cargar el componente, si no hay usuario configurado, se usa Juan Pérez por defecto
- El usuario se guarda en `localStorage` para futuras visitas

### 2. Botones de Configuración
- **👤 Ver Pagos de Juan Pérez**: Configura Juan Pérez como usuario activo
- **🔧 Usuario Temporal**: Configura un usuario temporal para testing
- **🧪 Usuario Test 2**: Configura otro usuario de testing

### 3. Controles de Usuario
- **👤 Juan Pérez**: Cambia a Juan Pérez
- **🧹 Limpiar**: Limpia la configuración actual
- **🔄 Cambiar Usuario**: Cambia a un usuario de testing

## 🔧 Comandos de Consola

### Métodos Disponibles
```javascript
// Ver comandos disponibles
configurarMisPagos.help()

// Configurar Juan Pérez
configurarMisPagos.setJuanPerez()

// Configurar usuario específico
configurarMisPagos.setDeveloperId("mi-usuario-123")

// Ver usuario actual
configurarMisPagos.getCurrentId()

// Limpiar configuración
configurarMisPagos.limpiar()
```

### Ejemplos de Uso
```javascript
// Cambiar a Juan Pérez
configurarMisPagos.setJuanPerez()

// Cambiar a otro usuario
configurarMisPagos.setDeveloperId("developer-456")

// Verificar usuario actual
configurarMisPagos.getCurrentId()
```

## 📊 Estados del Componente

### 1. Sin Usuario Configurado
- Muestra mensaje de advertencia
- Botones para configurar usuario
- **Botón destacado**: "👤 Ver Pagos de Juan Pérez"

### 2. Con Usuario Configurado
- Muestra información del usuario actual
- Indica si es Juan Pérez (usuario por defecto)
- Botones de control y cambio de usuario
- Tabla de pagos (si existen)

### 3. Loading
- Spinner de carga
- Mensaje "Cargando pagos..."

### 4. Sin Pagos
- Mensaje informativo
- Opción para cambiar de usuario

## 🎨 Características de UI

### Colores y Estilos
- **Verde**: Juan Pérez (usuario por defecto)
- **Azul**: Usuario temporal
- **Púrpura**: Usuario de testing
- **Rojo**: Limpiar configuración
- **Amarillo**: Advertencias

### Responsive Design
- Botones se adaptan a diferentes tamaños de pantalla
- Layout flexible con `flex-wrap`

## 🔍 Debug y Testing

### Logs de Consola
- Información del developerId configurado
- Estado de carga y errores
- Confirmación de cambios de usuario

### Métodos de Testing
- Funciones expuestas globalmente
- Fácil cambio entre usuarios
- Limpieza de configuración

## 📝 Notas Técnicas

### localStorage
- Se usa `window.localStorage` para compatibilidad
- Persiste la configuración entre sesiones
- Se limpia con el botón "🧹 Limpiar"

### API Calls
- Endpoint: `/api/finanzas/mis-pagos/:developerId`
- Se llama automáticamente al cambiar usuario
- Manejo de errores y estados de carga

### Componente Standalone
- Usa `CommonModule` para funcionalidades básicas
- Inyección de `FinanzasService`
- Métodos privados para lógica interna

## 🚨 Solución de Problemas

### Error: "Ruta no encontrada"
- Verificar que el developerId esté configurado
- Usar el botón "👤 Ver Pagos de Juan Pérez"
- Revisar logs de consola para debug

### No se muestran pagos
- Verificar que el usuario tenga pagos en la base de datos
- Cambiar a Juan Pérez (usuario por defecto)
- Revisar estado de la API

### Problemas de localStorage
- Usar `configurarMisPagos.limpiar()`
- Recargar la página
- Verificar permisos del navegador
