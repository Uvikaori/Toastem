const db = require('../../config/database');

class TrillaDAO {
    /**
     * Crea un nuevo registro de trilla.
     * @param {object} trillaData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createTrilla(trillaData) {
        const {
            id_lote,
            peso_inicial,
            fecha_trilla,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = trillaData;

        try {
            const [result] = await db.query(
                'INSERT INTO trilla (id_lote, peso_inicial, fecha_trilla, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_trilla, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de trilla:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de trilla para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getTrillaByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT t.*, ep.nombre as estado_nombre FROM trilla t JOIN estados_proceso ep ON t.id_estado_proceso = ep.id WHERE t.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener trilla por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new TrillaDAO(); 