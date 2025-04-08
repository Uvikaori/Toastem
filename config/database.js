const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = null;
  }

  async getConnection() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      console.log('Configuración de DB:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        hasPassword: process.env.DB_PASSWORD ? 'Sí' : 'No'
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