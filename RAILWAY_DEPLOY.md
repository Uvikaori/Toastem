# Guía de despliegue de Toastem en Railway

## Prerrequisitos
- Cuenta en [Railway](https://railway.app/)
- Repositorio de GitHub con el código
- Base de datos MySQL ya configurada en Railway 

## Paso 1: Preparar el proyecto para producción

1. **Asegurarse de que `package.json` tenga un script `start` correcto**

```json
"scripts": {
  "start": "node app.js",
  "dev": "nodemon app.js"
}
```

2. **Verificar que la aplicación use el puerto correcto**

```javascript
const PORT = process.env.PORT || 3000;
```

## Paso 2: Desplegar el backend en Railway

### Opción A: Desde GitHub (recomendado)

1. Iniciar sesión en [Railway](https://railway.app/)
2. Hacer click en "New Project" → "Deploy from GitHub repo"
3. Seleccionar repositorio
4. Railway detectará automáticamente que es una aplicación Node.js
5. Hacer click en "Deploy"

### Opción B: Desde el ordenador

1. Instalar la CLI de Railway:
   ```
   npm i -g @railway/cli
   ```

2. Iniciar sesión:
   ```
   railway login
   ```

3. Conectar proyecto:
   ```
   railway init
   ```

4. Desplegar:
   ```
   railway up
   ```

## Paso 3: Conectar el backend con la base de datos

Como ya se modificó `config/database.js` para conectarse directamente a la base de datos MySQL de Railway, no se necesita configurar variables de entorno adicionales para la conexión.

Sin embargo, es mejor establecer estas variables para producción:

1. Ir a la sección "Variables" del servicio de backend en Railway
2. Añadir:
   - `NODE_ENV=production`
   - `SESSION_SECRET=una-clave-segura-diferente` (cambiar esto por una clave segura)
   - `PORT=3000` (o el puerto que se prefiera)

## Paso 4: Configurar el dominio (opcional)

1. En el proyecto de Railway, ir a la pestaña "Settings"
2. En "Domains", generar un dominio personalizado de Railway o configurar un propio dominio

## Paso 5: Verificar el despliegue

1. Visitar la URL proporcionada por Railway
2. Probar que la aplicación funcione correctamente
3. Verificar que se conecte a la base de datos

## Solución de problemas comunes

- **Error de conexión a la base de datos**: Verificar que los servicios estén en la misma red en Railway
- **Error 503**: Revisar los logs para ver si hay errores en el inicio de la aplicación
- **Problemas con archivos estáticos**: Asegurarse de que las rutas sean correctas en producción

## Configuración de CORS (si existe frontend y backend separados)

Si el frontend está en un dominio diferente, añadir esto a `app.js`:

```javascript
app.use(cors({
  origin: ['https://tu-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

## Monitoreo y logs

- Utilizar la sección "Metrics" de Railway para monitorear el rendimiento
- Revisar "Logs" para ver los registros de la aplicación
- Configurar alertas en "Settings" para recibir notificaciones 