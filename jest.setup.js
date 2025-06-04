const mysql = require('mysql2/promise');
const dbModuleOriginal = require('./config/database');

// Mock de la clase Database
jest.mock('./config/database', () => {
  return jest.fn().mockImplementation(() => {
    return {
      query: jest.fn().mockImplementation(() => {
        return Promise.resolve([[], null]);
      }),
      connect: jest.fn().mockImplementation(() => {
        return Promise.resolve();
      }),
      disconnect: jest.fn().mockImplementation(() => {
        return Promise.resolve();
      })
    };
  });
});

// Configuración de variables de entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.PORT = 3001; // Puerto diferente para pruebas
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'toastem_test_db'; // CAMBIADO de DB_DATABASE a DB_NAME
process.env.SESSION_SECRET = 'test_secret';

// Configuración de JWT para pruebas
process.env.JWT_SECRET = 'test_secret_key';

// Tiempo de expiración del token para pruebas
process.env.JWT_EXPIRES_IN = '1h';

// Configuración global de timeouts
jest.setTimeout(10000);

// Variables globales para las pruebas
global.testDb = null;

// Configuración antes de todas las pruebas
beforeAll(async () => {
  // Crear objeto de configuración para la base de datos de prueba
  const testDbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
  };
  
  // Crear conexión a la base de datos de pruebas usando el objeto de configuración
  global.testDb = await mysql.createConnection(testDbConfig); // CAMBIADO
  
  // Limpiar y preparar la base de datos de pruebas
  await global.testDb.execute('DROP TABLE IF EXISTS usuarios');
  await global.testDb.execute(`
    CREATE TABLE usuarios (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      pregunta_seguridad VARCHAR(255) NOT NULL,
      respuesta_seguridad VARCHAR(255) NOT NULL,
      nombre_finca VARCHAR(100) NOT NULL,
      ubicacion_finca VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Limpieza después de cada prueba
afterEach(async () => {
  await global.testDb.execute('DELETE FROM usuarios');
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  if (global.testDb) {
    await global.testDb.end();
  }
}); 