const db = require('../../config/database');

class MoliendaDAO {
    /**
     * Crea un nuevo registro de molienda.
     * @param {object} moliendaData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createMolienda(moliendaData) {
        const {
            id_tueste,
            fecha_molienda,
            peso_inicial,
            tipo_molienda,
            peso_final,
            es_grano = false,
            cantidad = null,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = moliendaData;

        try {
            const [result] = await db.query(
                'INSERT INTO molienda (id_tueste, fecha_molienda, peso_inicial, tipo_molienda, peso_final, es_grano, cantidad, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id_tueste, fecha_molienda, peso_inicial, tipo_molienda, peso_final, es_grano, cantidad, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de molienda:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de molienda para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getMoliendaByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT m.*, ep.nombre as estado_nombre FROM molienda m ' +
                'JOIN tueste t ON m.id_tueste = t.id ' +
                'JOIN estados_proceso ep ON m.id_estado_proceso = ep.id ' +
                'WHERE t.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener molienda por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new MoliendaDAO(); 