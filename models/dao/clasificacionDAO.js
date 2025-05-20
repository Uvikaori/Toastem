const db = require('../../config/database');

class ClasificacionDAO {
    /**
     * Crea un nuevo registro de clasificación por atributos.
     * @param {object} clasificacionData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createClasificacion(clasificacionData) {
        const {
            id_lote,
            peso_inicial,
            fecha_clasificacion,
            peso_cafe_bueno,
            peso_total,
            peso_pergamino,
            peso_pasilla,
            peso_otro,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = clasificacionData;

        try {
            const [result] = await db.query(
                'INSERT INTO clasificacion (id_lote, peso_inicial, fecha_clasificacion, peso_cafe_bueno, observaciones, id_estado_proceso, peso_total, peso_pergamino, peso_pasilla, peso_otro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_clasificacion, peso_cafe_bueno, observaciones, id_estado_proceso, peso_total, peso_pergamino, peso_pasilla, peso_otro]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de clasificación:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de clasificación por atributos para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getClasificacionByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT ca.*, ep.nombre as estado_nombre FROM clasificacion ca JOIN estados_proceso ep ON ca.id_estado_proceso = ep.id WHERE ca.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener clasificación por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new ClasificacionDAO(); 