const db = require('../../config/database'); 

class FincaDAO {
  /**
   * Obtiene todas las fincas asociadas a un usuario por su ID
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} - Lista de fincas
   */
  async getFincasByUserId(userId) {
    try {
      const [rows] = await db.query('SELECT * FROM fincas WHERE id_usuario = ?', [userId]);
      return rows;
    } catch (error) {
      console.error('Error al obtener las fincas del usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene los lotes asociados a una finca por su ID
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de lotes
   */
  async getLotesByFincaId(fincaId) {
    try {
      const [rows] = await db.query('SELECT * FROM lotes WHERE finca_id = ?', [fincaId]);
      return rows;
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
      const [rows] = await db.query('SELECT precio, fecha_actualizacion FROM precios_cafe ORDER BY fecha_actualizacion DESC LIMIT 1');
      return rows.length > 0 ? rows[0] : { precio: 0, fecha_actualizacion: null };
    } catch (error) {
      console.error('Error al obtener el precio del café:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva finca en la base de datos
   * @param {Finca} finca - Objeto de la finca a crear
   * @returns {Promise<number>} - ID de la finca creada
   */
  async createFinca(finca) {
    try {
      const [result] = await db.query(
        'INSERT INTO fincas (id_usuario, nombre, ubicacion) VALUES (?, ?, ?)',
        [finca.idUsuario, finca.nombre, finca.ubicacion]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error al crear la finca:', error);
      throw error;
    }
  }
}

module.exports = new FincaDAO();