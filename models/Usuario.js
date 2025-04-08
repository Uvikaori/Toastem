const usuarioDAO = require('./dao/usuarioDAO');

class Usuario {
  constructor(id, nombre, email, id_pregunta_seguridad, respuesta_seguridad, nombre_finca, ubicacion_finca) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.id_pregunta_seguridad = id_pregunta_seguridad;
    this.respuesta_seguridad = respuesta_seguridad;
    this.nombre_finca = nombre_finca;
    this.ubicacion_finca = ubicacion_finca;
  }

  /**
   * Crea un usuario a partir de un objeto de datos
   * @param {Object} data - Datos del usuario
   * @returns {Usuario} - Instancia de Usuario
   */
  static fromData(data) {
    return new Usuario(
      data.id,
      data.nombre,
      data.email,
      data.id_pregunta_seguridad,
      data.respuesta_seguridad,
      data.nombre_finca,
      data.ubicacion_finca
    );
  }

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos para crear el usuario
   * @returns {Promise<Usuario>} - Usuario creado
   */
  static async register(userData) {
    try {
      // Verificar si el email ya está registrado
      const existingUser = await usuarioDAO.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('El correo electrónico ya está registrado');
      }
      
      // Crear el usuario
      const userId = await usuarioDAO.create(userData);
      
      // Obtener usuario completo
      const nuevoUsuario = {
        id: userId,
        ...userData
      };
      
      return Usuario.fromData(nuevoUsuario);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Realiza la autenticación de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña sin encriptar
   * @returns {Promise<Usuario|null>} - Usuario autenticado o null
   */
  static async authenticate(email, password) {
    try {
      const usuario = await usuarioDAO.validateCredentials(email, password);
      
      if (!usuario) {
        return null;
      }
      
      return Usuario.fromData(usuario);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene las preguntas de seguridad disponibles
   * @returns {Promise<Array>} - Lista de preguntas de seguridad
   */
  static async getSecurityQuestions() {
    return await usuarioDAO.getSecurityQuestions();
  }

  /**
   * Valida la respuesta a la pregunta de seguridad
   * @param {string} email - Email del usuario
   * @param {string} respuesta - Respuesta proporcionada
   * @returns {Promise<boolean>} - true si la respuesta es correcta
   */
  static async validateSecurityAnswer(email, respuesta) {
    return await usuarioDAO.validateSecurityAnswer(email, respuesta);
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {string} email - Email del usuario
   * @param {string} newPassword - Nueva contraseña sin encriptar
   * @returns {Promise<boolean>} - true si se actualizó correctamente
   */
  static async updatePassword(email, newPassword) {
    return await usuarioDAO.updatePassword(email, newPassword);
  }

  /**
   * Busca un usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Usuario|null>} - Usuario encontrado o null
   */
  static async findByEmail(email) {
    const usuario = await usuarioDAO.findByEmail(email);
    
    if (!usuario) {
      return null;
    }
    
    return Usuario.fromData(usuario);
  }
}

module.exports = Usuario; 