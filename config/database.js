const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Definir valores directamente para Railway
const RAILWAY_CONFIG = {
    host: 'shortline.proxy.rlwy.net',
    port: 33692,
    user: 'root',
    password: 'liEXzBFCzYKWsrhHJovnGhRIWoOndiOC',
    database: 'railway'
};

// Verificar si existe el archivo .railway en la raíz del proyecto
const railwayFlagPath = path.join(__dirname, '..', '.railway');
const hasRailwayFlag = fs.existsSync(railwayFlagPath);

// Verificar si estamos en Railway
const isRailway = hasRailwayFlag || process.env.RAILWAY_SERVICE_NAME || process.env.RAILWAY || process.env.NODE_ENV === 'production';

// Forzar el uso de Railway si el archivo .railway existe
const config = isRailway ? RAILWAY_CONFIG : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toastem_db'
};

console.log('¿Usando configuración de Railway?', isRailway);
console.log('Configuración de base de datos:', {
    host: config.host,
    port: config.port,
    database: config.database
});

// Crear pool de conexiones a la base de datos
const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función para probar la conexión
pool.testConnection = async function() {
    let conn;
    try {
        console.log('Probando conexión a la base de datos con configuración:', {
            host: config.host,
            port: config.port,
            user: config.user,
            database: config.database
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