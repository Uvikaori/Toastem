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
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Configuración para la documentación de la API
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Toastem',
      version: '1.0.0',
      description: 'Documentación de la API de Toastem para la gestión de procesos de café',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ]
  },
  apis: ['./routes/*.js'] 
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);

const app = express();

// Configuración del motor de vistas EJS
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');

// Helpers globales para las vistas
app.locals.capitalizarPalabras = helpers.capitalizarPalabras;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(expressLayouts);
app.use(methodOverride('_method'));

// Ruta para la documentación de la API
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Configuración de la sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'toastem-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // En desarrollo debe ser false para usar HTTP
    // Sin maxAge, la cookie expira al cerrar el navegador
    httpOnly: true, 
    sameSite: 'lax' 
  }
}));

// Limita las peticiones para prevenir ataques de fuerza bruta
const limiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, 
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.'
});
app.use('/auth', limiter);

// Middleware para pasar datos a las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario;
  res.locals.currentPath = req.path;
  res.locals.titulo = 'Toastem - Gestión de Café';
  next();
});

// Middlewares para mensajes flash
app.use(flash());
app.use(flashFilter); 
app.use(messageHandler.prepareViewMessages);

// Rutas
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio | Toastem' });
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/fincas', fincaRoutes);
app.use('/fincas/:id_finca/lotes', loteRoutes);
app.use('/api', apiRoutes);

// Error 404
app.use((req, res) => {
  res.status(404).render('error', { 
    titulo: 'Página no encontrada | Toastem',
    mensaje: 'La página que buscas no existe.',
    hideNavbar: true
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Si es una petición de API, se devuelve JSON
  if (req.xhr || req.path.includes('/auth/login') && req.method === 'POST') {
    return res.status(500).json({ 
      error: 'Error interno del servidor', 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  }
  
  // Para peticiones normales, se renderiza la página de error
  res.status(500).render('error', { 
    titulo: 'Error interno del servidor | Toastem',
    mensaje: 'Ocurrió un error inesperado.',
    hideNavbar: true,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Exportar la app para las pruebas
module.exports = app;

// Iniciar el servidor solo si no se está en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Testear la conexión a la base de datos
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
