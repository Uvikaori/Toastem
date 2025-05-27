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
      const [rows] = await db.query('SELECT * FROM lotes WHERE id_finca = ?', [fincaId]);
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
   * Obtiene una lista de nombres de departamentos únicos.
   * @returns {Promise<Array<{nom_dep: string}>>} - Lista de departamentos.
   */
  async getDepartamentos() {
    try {
      const [rows] = await db.query('SELECT DISTINCT nom_dep FROM municipio_vereda ORDER BY nom_dep');
      return rows;
    } catch (error) {
      console.error('Error al obtener los departamentos:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista completa de municipios/veredas con su ID y departamento asociado.
   * @returns {Promise<Array<{id: number, nombre_ver: string, nomb_mpio: string, nom_dep: string}>>} - Lista de municipios/veredas.
   */
  async getMunicipiosVeredas() {
    try {
      // Seleccionamos id, nombre_ver, nomb_mpio y nom_dep para usar en los selects del frontend
      const [rows] = await db.query('SELECT id, nombre_ver, nomb_mpio, nom_dep FROM municipio_vereda ORDER BY nom_dep, nomb_mpio, nombre_ver');
      return rows;
    } catch (error) {
      console.error('Error al obtener los municipios/veredas:', error);
      throw error;
    }
  }

  /**
   * Obtiene una lista de nombres de municipios únicos para un departamento dado.
   * @param {string} nombreDepartamento - El nombre del departamento.
   * @returns {Promise<Array<{nomb_mpio: string}>>} - Lista de municipios.
   */
  async getMunicipiosPorDepartamento(nombreDepartamento) {
    try {
      const [rows] = await db.query(
        'SELECT DISTINCT nomb_mpio FROM municipio_vereda WHERE nom_dep = ? ORDER BY nomb_mpio',
        [nombreDepartamento]
      );
      return rows;
    } catch (error) {
      console.error('Error al obtener los municipios por departamento:', error);
      throw error;
    }
  }

  /**
   * Obtiene una lista de veredas (con su ID y nombre) para un municipio y departamento dados.
   * @param {string} nombreDepartamento - El nombre del departamento.
   * @param {string} nombreMunicipio - El nombre del municipio.
   * @returns {Promise<Array<{id: number, nombre_ver: string}>>} - Lista de veredas.
   */
  async getVeredasPorMunicipio(nombreDepartamento, nombreMunicipio) {
    try {
      const [rows] = await db.query(
        'SELECT id, nombre_ver FROM municipio_vereda WHERE nom_dep = ? AND nomb_mpio = ? ORDER BY nombre_ver',
        [nombreDepartamento, nombreMunicipio]
      );
      return rows;
    } catch (error) {
      console.error('Error al obtener las veredas por municipio:', error);
      throw error;
    }
  }

  /**
   * Obtiene una finca específica por su ID y el ID del usuario propietario.
   * @param {number} id_finca - ID de la finca.
   * @param {number} id_usuario - ID del usuario.
   * @returns {Promise<Object|null>} - Objeto de la finca o null si no se encuentra o no pertenece al usuario.
   */
  async getFincaByIdAndUserId(id_finca, id_usuario) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM fincas WHERE id = ? AND id_usuario = ?',
        [id_finca, id_usuario]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error al obtener la finca por ID y usuario:', error);
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
        'INSERT INTO fincas (id_usuario, nombre, ubicacion, id_municipio_vereda) VALUES (?, ?, ?, ?)',
        [finca.idUsuario, finca.nombre, finca.ubicacion, finca.id_municipio_vereda]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error al crear la finca:', error);
      throw error;
    }
  }
}

module.exports = new FincaDAO();