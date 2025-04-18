const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.test' });

const testDbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
};

async function setupTestDb() {
    let connection;
    try {
        // Crear conexión inicial sin base de datos
        connection = await mysql.createConnection(testDbConfig);

        // Crear base de datos si no existe y usarla
        const dbName = process.env.DB_NAME || 'toastem_test_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await connection.query(`USE ${dbName}`);

        // Leer y ejecutar el script SQL
        const sqlPath = path.join(__dirname, 'test_db.sql');
        const sqlScript = await fs.readFile(sqlPath, 'utf8');
        await connection.query(sqlScript);

        console.log('Base de datos de prueba configurada correctamente');
    } catch (error) {
        console.error('Error al configurar la base de datos de prueba:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

async function cleanupTestDb() {
    let connection;
    try {
        // Conectar a la base de datos incluyendo el nombre
        connection = await mysql.createConnection({
            ...testDbConfig,
            database: process.env.DB_NAME || 'toastem_test_db'
        });
        
        // Limpiar todas las tablas y reinsertar datos base
        await connection.query(`
            SET FOREIGN_KEY_CHECKS = 0;
            TRUNCATE TABLE usuarios;
            TRUNCATE TABLE sessions;
            TRUNCATE TABLE preguntas_seguridad;
            SET FOREIGN_KEY_CHECKS = 1;
            
            INSERT INTO preguntas_seguridad (pregunta) VALUES 
            ('¿Cuál es el nombre de tu primera mascota?'),
            ('¿En qué ciudad naciste?'),
            ('¿Cuál es tu color favorito?'),
            ('¿Cuál es el nombre de tu mejor amigo de la infancia?'),
            ('¿Cuál fue tu primer coche?');
        `);

        console.log('Base de datos de prueba limpiada correctamente');
    } catch (error) {
        console.error('Error al limpiar la base de datos de prueba:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = {
    testDbConfig,
    setupTestDb,
    cleanupTestDb
}; 