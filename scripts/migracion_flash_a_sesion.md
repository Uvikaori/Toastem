# Guía de migración: Reemplazar flash messages por mensajes de sesión

Este documento describe el proceso para migrar del sistema de mensajes flash al nuevo sistema basado en sesiones.

## Pasos de migración

### 1. Identificar controladores que usan flash messages

Buscar en el código todas las instancias de:
- `req.flash('error', ...)`
- `req.flash('mensaje', ...)`
- `req.flash('exito', ...)`

### 2. Importar las utilidades de mensajes en cada controlador

```javascript
const { setMessages } = require('../utils/messages');
```

### 3. Reemplazar los flash messages por funciones del nuevo sistema

#### Mensajes de error:

**Antes**:
```javascript
req.flash('error', 'Mensaje de error');
```

**Después**:
```javascript
setMessages.procesos.error(req, 'Mensaje de error');
```

#### Mensajes de éxito:

**Antes**:
```javascript
req.flash('mensaje', 'Operación exitosa');
```

**Después**:
```javascript
setMessages.procesos.success(req, 'Operación exitosa');
```

### 4. Actualizar el código de renderizado de vistas

**Antes**:
```javascript
res.render('vista', {
    // ... otros datos
    mensaje: req.flash('mensaje'),
    error: req.flash('error')
});
```

**Después**:
```javascript
// Obtener mensajes de la sesión o de flash (para compatibilidad)
const mensaje = req.session.mensajeVistaActual || req.flash('mensaje');
const error = req.session.errorVistaActual || req.flash('error');

// Limpiar mensajes de la sesión
delete req.session.mensajeVistaActual;
delete req.session.errorVistaActual;

res.render('vista', {
    // ... otros datos
    mensaje: mensaje,
    error: error
});
```

### 5. Funciones para diferentes contextos

El sistema `setMessages` ofrece varios contextos predefinidos:

- `setMessages.procesos`: Para la vista de procesos de lotes
- `setMessages.flujo`: Para la vista de flujo de lotes
- `setMessages.lotes`: Para la vista de listado de lotes
- `setMessages.fincas`: Para la vista de fincas
- `setMessages.dashboard`: Para el dashboard
- `setMessages.form`: Para formularios genéricos

Cada contexto tiene dos métodos:
- `success(req, mensaje)`: Para mensajes de éxito
- `error(req, error)`: Para mensajes de error

## Recordatorios importantes

1. Los mensajes se almacenan en `req.session` con nombres basados en el contexto:
   - `req.session.mensajeProcesos` (éxito en procesos)
   - `req.session.errorProcesos` (error en procesos)
   - etc.

2. El middleware `messageHandler.prepareViewMessages` se encarga de pasar estos mensajes a `res.locals` y eliminarlos de la sesión.

3. Se ha añadido una función `hayError()` a `res.locals` para verificar si un error está realmente presente.

## Uso recomendado en vistas

```ejs
<% if (typeof mensaje !== 'undefined' && mensaje && mensaje.length > 0) { %>
    <div class="alert alert-success">
        <%= mensaje %>
    </div>
<% } %>

<% if (typeof error !== 'undefined' && (typeof hayError === 'function' ? hayError(error) : error)) { %>
    <div class="alert alert-danger">
        <strong><i class="fas fa-exclamation-triangle me-1"></i> Error:</strong>
        <% if (Array.isArray(error)) { %>
            <ul class="mb-0 ps-3">
            <% error.forEach(function(err) { %>
                <% if (err && err.toString().trim() !== '') { %>
                    <li><%= Array.isArray(err) ? err.join(', ') : err %></li>
                <% } %>
            <% }) %>
            </ul>
        <% } else { %>
            <%= error %>
        <% } %>
    </div>
<% } %>
``` 