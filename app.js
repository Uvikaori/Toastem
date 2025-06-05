const express = require('express');
const path = require('path');
const session = require('express-session');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const db = require('./config/database');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const flashFilter = require('./middlewares/flash');
const messageHandler = require('./middlewares/messageHandler');
require('dotenv').config();
const fincaRoutes = require('./routes/fincaRoutes');
const helpers = require('./utils/helpers');
const loteRoutes = require('./routes/loteRoutes');
const apiRoutes = require('./routes/apiRoutes');

// Cargar variables de entorno al inicio
require('dotenv').config();
// Sobreescribir la variable NODE_ENV si no está definida
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Toastem',
      version: '1.0.0',
      description: 'Documentación de la API de Toastem para la gestión de procesos de café',
      contact: {
        name: 'Soporte Toastem',
        email: 'soporte@toastem.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ]
  },
  apis: ['./routes/*.js'] // archivos que contienen anotaciones
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// App
const app = express();

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');

// Configurar la ruta del layout principal
app.set('layout', 'layouts/main');

// Hacer helpers disponibles globalmente en las vistas
app.locals.capitalizarPalabras = helpers.capitalizarPalabras;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(expressLayouts);
app.use(methodOverride('_method'));

// Configuración de Swagger UI
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'toastem-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Desactivado para funcionar tanto en HTTP como HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true, // Previene acceso JS al lado del cliente
    sameSite: 'lax' // Restringe cookies a mismo sitio
  }
}));

// Protecciones de seguridad
/*
app.use(require('helmet')({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:", "data:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"]
    }
  }
}));
*/

// Comentado temporalmente para diagnosticar problemas con los íconos
// Recuerda volver a habilitar estas protecciones después

// Limitar tasa de peticiones para prevenir ataques de fuerza bruta
const limiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.'
});
app.use('/auth', limiter); // Aplicar solo a rutas de autenticación

// Middleware para pasar usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario;
  res.locals.currentPath = req.path;
  res.locals.titulo = 'Toastem - Gestión de Café';
  next();
});

// Después de la configuración de session
app.use(flash());
app.use(flashFilter); // Filtrar mensajes flash vacíos
app.use(messageHandler.prepareViewMessages); // Middleware para manejo centralizado de mensajes

// Routes
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio | Toastem' });
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/fincas', fincaRoutes);
app.use('/fincas/:id_finca/lotes', loteRoutes);
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('error', { 
    titulo: 'Página no encontrada | Toastem',
    mensaje: 'La página que buscas no existe.',
    hideNavbar: true
  });
});

// Error handler - con más detalles temporalmente para depuración en producción
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Distinguir entre peticiones API y vistas
  if (req.xhr || req.path.includes('/auth/login') && req.method === 'POST') {
    // Para APIs, devolver JSON con detalles
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
  
  // Para vistas, renderizar página de error
  res.status(500).render('error', { 
    titulo: 'Error interno del servidor | Toastem',
    mensaje: 'Ocurrió un error inesperado.',
    hideNavbar: true,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Exportar la app para pruebas
module.exports = app;

// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Test DB connection
    try {
      console.log('Intentando conectar a la base de datos...');
      const connected = await db.testConnection();
      if (connected) {
        console.log('✅ Conexión a la base de datos establecida correctamente');
        console.log(`Host: ${db.pool ? db.pool.config.connectionConfig.host : 'No disponible'}`);
        console.log(`Puerto: ${db.pool ? db.pool.config.connectionConfig.port : 'No disponible'}`);
        console.log(`Base de datos: ${db.pool ? db.pool.config.connectionConfig.database : 'No disponible'}`);
      } else {
        console.error('❌ No se pudo conectar a la base de datos');
      }
    } catch (error) {
      console.error('❌ Error al conectar a la base de datos:', error);
    }
  });
}
