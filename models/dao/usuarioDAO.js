const db = require('../../config/database');
const bcrypt = require('bcrypt');

class UsuarioDAO {
  constructor() {}

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  async findByEmail(email) {
    try {
      const usuario = await db.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      return usuario.length > 0 ? usuario[0] : null;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   * @param {Object} usuario - Datos del usuario
   * @returns {Promise<number>} - ID del usuario creado
   */
  async create(usuario) {
    try {
      // Generar hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(usuario.password, saltRounds);
      
      const result = await db.query(
        `INSERT INTO usuarios (nombre, email, password, id_pregunta_seguridad, 
          respuesta_seguridad, nombre_finca, ubicacion_finca) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          usuario.nombre,
          usuario.email,
          hashedPassword,
          usuario.id_pregunta_seguridad,
          usuario.respuesta_seguridad,
          usuario.nombre_finca,
          usuario.ubicacion_finca || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Verifica si las credenciales de un usuario son válidas
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña sin encriptar
   * @returns {Promise<Object|null>} - Usuario si las credenciales son válidas, null en caso contrario
   */
  async validateCredentials(email, password) {
    try {
      const usuario = await this.findByEmail(email);
      
      if (!usuario) {
        return null;
      }
      
      const isValid = await bcrypt.compare(password, usuario.password);
      
      return isValid ? usuario : null;
    } catch (error) {
      console.error('Error al validar credenciales:', error);
      throw error;
    }
  }

  /**
   * Obtiene las preguntas de seguridad disponibles
   * @returns {Promise<Array>} - Lista de preguntas de seguridad
   */
  async getSecurityQuestions() {
    try {
      return await db.query('SELECT * FROM preguntas_seguridad');
    } catch (error) {
      console.error('Error al obtener preguntas de seguridad:', error);
      throw error;
    }
  }

  /**
   * Valida la respuesta a la pregunta de seguridad
   * @param {string} email - Email del usuario
   * @param {string} respuesta - Respuesta proporcionada
   * @returns {Promise<boolean>} - true si la respuesta es correcta
   */
  async validateSecurityAnswer(email, respuesta) {
    try {
      const usuario = await this.findByEmail(email);
      
      if (!usuario) {
        return false;
      }
      
      // Comparamos directamente las respuestas (pueden guardarse encriptadas en un entorno real)
      return usuario.respuesta_seguridad.toLowerCase() === respuesta.toLowerCase();
    } catch (error) {
      console.error('Error al validar respuesta de seguridad:', error);
      throw error;
    }
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {string} email - Email del usuario
   * @param {string} newPassword - Nueva contraseña sin encriptar
   * @returns {Promise<boolean>} - true si se actualizó correctamente
   */
  async updatePassword(email, newPassword) {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const result = await db.query(
        'UPDATE usuarios SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }
}

module.exports = new UsuarioDAO(); 