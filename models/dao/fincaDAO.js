const db = require('../../config/database');
const Finca = require('../entities/Finca');

class FincaDAO {
  constructor(database) {
    this.db = database;
  }

  /**
   * Obtiene la finca seleccionada por el usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object|null>} - Finca seleccionada o null
   */
  async getFincaByUserId(userId) {
    try {
      const result = await this.db.query(
        'SELECT * FROM fincas WHERE id_usuario = ? LIMIT 1',
        [userId]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error al obtener la finca del usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene los lotes de una finca
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de lotes
   */
  async getLotesByFincaId(fincaId) {
    try {
      return await this.db.query(
        'SELECT * FROM lotes WHERE id_finca = ?',
        [fincaId]
      );
    } catch (error) {
      console.error('Error al obtener los lotes de la finca:', error);
      throw error;
    }
  }

  /**
   * Obtiene el precio actual del café
   * @returns {Promise<Object>} - Precio del café y fecha de actualización
   */
  async getCoffeePrice() {
    try {
      // Por ahora, devolver valores predeterminados
      return { precio: null, fechaActualizacion: null };
    } catch (error) {
      console.error('Error al obtener el precio del café:', error);
      throw error;
    }
  }

  async getFincasByUserId(userId) {
    try {
      if (!userId) {
        console.error('ID de usuario no proporcionado');
        return [];
      }

      const result = await this.db.query(
        `SELECT f.*, COUNT(l.id) as total_lotes 
         FROM fincas f 
         LEFT JOIN lotes l ON f.id = l.id_finca 
         WHERE f.id_usuario = ? 
         GROUP BY f.id`,
        [userId]
      );
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error al obtener las fincas del usuario:', error);
      return [];
    }
  }

  async createFinca(finca) {
    try {
      finca.validar();
      const result = await this.db.query(
        'INSERT INTO fincas (id_usuario, nombre, ubicacion) VALUES (?, ?, ?)',
        [finca.idUsuario, finca.nombre, finca.ubicacion]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error al crear la finca:', error);
      throw error;
    }
  }

  async updateFinca(finca) {
    try {
      finca.validar();
      await this.db.query(
        'UPDATE fincas SET nombre = ?, ubicacion = ? WHERE id = ? AND id_usuario = ?',
        [finca.nombre, finca.ubicacion, finca.id, finca.idUsuario]
      );
    } catch (error) {
      console.error('Error al actualizar la finca:', error);
      throw error;
    }
  }

  async deleteFinca(id, userId) {
    try {
      // Verificar si tiene lotes
      const lotes = await this.db.query(
        'SELECT COUNT(*) as count FROM lotes WHERE id_finca = ?',
        [id]
      );
      
      if (lotes[0].count > 0) {
        throw new Error('No se puede eliminar una finca con lotes registrados');
      }

      await this.db.query(
        'DELETE FROM fincas WHERE id = ? AND id_usuario = ?',
        [id, userId]
      );
    } catch (error) {
      console.error('Error al eliminar la finca:', error);
      throw error;
    }
  }
}

module.exports = new FincaDAO(db);