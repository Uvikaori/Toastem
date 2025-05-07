const db = require('../../config/database');

class ProcesosDAO {
    /**
     * Obtiene todos los procesos definidos en el sistema, ordenados.
     * @returns {Promise<Array>} - Lista de objetos de proceso (ej: {id, nombre, descripcion, orden}).
     */
    async getAllProcesosOrdenados() {
        try {
            const [rows] = await db.query('SELECT * FROM procesos ORDER BY orden ASC');
            return rows;
        } catch (error) {
            console.error('Error al obtener todos los procesos:', error);
            throw error;
        }
    }

    /**
     * Obtiene un proceso por su ID.
     * @param {number} id_proceso
     * @returns {Promise<Object|null>}
     */
    async getProcesoById(id_proceso) {
        try {
            const [rows] = await db.query('SELECT * FROM procesos WHERE id = ?', [id_proceso]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener proceso por ID:', error);
            throw error;
        }
    }
}

module.exports = new ProcesosDAO(); 