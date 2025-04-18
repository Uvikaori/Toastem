const express = require('express');
const path = require('path');
const session = require('express-session');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const db = require('./config/database');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
require('dotenv').config();

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

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(expressLayouts);

// Configuración de Swagger UI
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'toastem-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para pasar usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.titulo = 'Toastem - Gestión de Café';
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { titulo: 'Inicio | Toastem' });
});

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Página no encontrada',
    title: '404 - No encontrado | Toastem'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { 
    message: 'Error del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {},
    title: 'Error | Toastem'
  });
});

// Exportar la app para pruebas
module.exports = app;

// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    
    // Test DB connection
    try {
      const connected = await db.testConnection();
      if (connected) {
        console.log('Conexión a la base de datos establecida correctamente');
      } else {
        console.error('No se pudo conectar a la base de datos');
      }
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error);
    }
  });
}
