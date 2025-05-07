const db = require('../../config/database');

class FermentacionLavadoDAO {
    /**
     * Crea un nuevo registro de fermentación y lavado.
     * @param {object} fermentacionData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createFermentacionLavado(fermentacionData) {
        const {
            id_lote,
            peso_inicial,
            fecha_inicio_fermentacion,
            fecha_lavado,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado' para la etapa
        } = fermentacionData;

        try {
            const [result] = await db.query(
                'INSERT INTO fermentacion_lavado (id_lote, peso_inicial, fecha_inicio_fermentacion, fecha_lavado, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_inicio_fermentacion, fecha_lavado, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de fermentación y lavado:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de fermentación y lavado para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getFermentacionLavadoByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT fl.*, ep.nombre as estado_nombre FROM fermentacion_lavado fl JOIN estados_proceso ep ON fl.id_estado_proceso = ep.id WHERE fl.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener fermentación y lavado por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new FermentacionLavadoDAO(); 