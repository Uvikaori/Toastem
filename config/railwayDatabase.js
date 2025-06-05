const mysql = require('mysql2/promise');

// Configuración para Railway
const pool = mysql.createPool({
    host: 'shortline.proxy.rlwy.net',
    port: 33692,
    user: 'root',
    password: 'liEXzBFCzYKWsrhHJovnGhRIWoOndiOC',
    database: 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión
pool.testConnection = async function() {
    let conn;
    try {
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