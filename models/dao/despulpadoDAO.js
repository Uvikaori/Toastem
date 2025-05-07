const db = require('../../config/database');

class DespulpadoDAO {
    /**
     * Crea un nuevo registro de despulpado.
     * @param {object} despulpadoData - Datos del despulpado.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createDespulpado(despulpadoData) {
        const {
            id_lote,
            peso_inicial, // Este sería el peso del lote ANTES del despulpado
            fecha_remojo,
            fecha_despulpado,
            peso_final,   // Peso DESPUÉS del despulpado
            // peso_despues, // Aclarar si es necesario o igual a peso_final
            observaciones,
            id_estado_proceso = 3 // Asumir 3 ('Terminado') para la etapa al registrarla
        } = despulpadoData;

        try {
            const [result] = await db.query(
                'INSERT INTO despulpado (id_lote, peso_inicial, fecha_remojo, fecha_despulpado, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_remojo, fecha_despulpado, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de despulpado:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de despulpado para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getDespulpadoByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT d.*, ep.nombre as estado_nombre FROM despulpado d JOIN estados_proceso ep ON d.id_estado_proceso = ep.id WHERE d.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener despulpado por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new DespulpadoDAO(); 