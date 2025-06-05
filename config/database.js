const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = null;
  }

  async getConnection() {
    if (!this.pool) {
      // Configuración directa para Railway (sin depender de .env)
      const connectionString = 'mysql://root:liEXzBFCzYKWsrhHJovnGhRIWoOndiOC@shortline.proxy.rlwy.net:33692/railway';
      this.pool = mysql.createPool(connectionString);
      
      console.log('Configuración de DB:', {
        host: 'shortline.proxy.rlwy.net',
        user: 'root',
        database: 'railway',
        hasPassword: 'Sí'
      });
    }
    
    try {
      const connection = await this.pool.getConnection();
      return connection;
    } catch (error) {
      console.error('Error al obtener conexión a la base de datos:', error);
      throw error;
    }
  }

  async query(sql, params) {
    let connection;
    try {
      connection = await this.getConnection();
      const [results] = await connection.query(sql, params);
      return [results, null];
    } catch (error) {
      console.error('Error al ejecutar consulta:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  async testConnection() {
    let connection;
    try {
      connection = await this.getConnection();
      console.log('Conexión a la base de datos establecida correctamente');
      return true;
    } catch (error) {
      console.error('Error al conectar a la base de datos:', error);
      return false;
    } finally {
      if (connection) connection.release();
    }
  }
}

// Singleton para una única instancia de la conexión a la base de datos
const db = new Database();

module.exports = db; 