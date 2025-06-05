const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargar variables de entorno

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306, // Añadimos el puerto explícitamente
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toastem_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión
pool.testConnection = async function() {
    let conn;
    try {
        console.log('Probando conexión con configuración:', {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_NAME || 'toastem_db'
        });
        conn = await pool.getConnection();
        await conn.ping();
        return true;
    } catch (error) {
        console.error('Error al probar la conexión a la base de datos:', error.message);
        return false;
    } finally {
        if (conn) conn.release();
    }
};

module.exports = pool; 