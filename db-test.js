// Script para probar la conexión a la base de datos de Railway
require('dotenv').config(); // Cargar variables de entorno desde .env
const mysql = require('mysql2/promise');

// Datos de conexión de Railway
const DB_CONFIG = {
  host: 'shortline.proxy.rlwy.net',
  port: 33692,
  user: 'root',
  password: 'liEXzBFCzYKWsrhHJovnGhRIWoOndiOC',
  database: 'railway'
};

async function testConnection() {
  console.log('Intentando conectar a la base de datos de Railway...');
  console.log('Configuración:', {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
    // No mostramos la contraseña por seguridad
    hasPassword: DB_CONFIG.password ? 'Sí' : 'No'
  });

  let connection;
  try {
    // Crear conexión
    connection = await mysql.createConnection(DB_CONFIG);
    
    // Probar consulta simple
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    
    console.log('¡Conexión exitosa a Railway!');
    console.log('Resultado de prueba:', rows[0].result);
    
    // Mostrar algunas tablas si existen
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log('\nTablas encontradas en la base de datos:');
      tables.forEach(table => {
        console.log(`- ${Object.values(table)[0]}`);
      });
    } catch (err) {
      console.log('No se pudieron listar las tablas:', err.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Verifica que el host y puerto sean correctos y que no haya restricciones de firewall.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Usuario o contraseña incorrectos.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('La base de datos especificada no existe.');
    }
    return false;
  } finally {
    if (connection) {
      console.log('Cerrando conexión...');
      await connection.end();
    }
  }
}

// Ejecutar la prueba
testConnection()
  .then(success => {
    if (!success) {
      console.log('\nSugerencias para solucionar problemas:');
      console.log('1. Verifica que las credenciales sean correctas.');
      console.log('2. Comprueba que el servicio de Railway esté activo.');
      console.log('3. Asegúrate de que tu red permita conexiones al puerto especificado.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
  }); 