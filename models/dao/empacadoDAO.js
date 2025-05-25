const db = require('../../config/database');

class EmpacadoDAO {
    /**
     * Crea un nuevo registro de empacado.
     * @param {object} empacadoData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createEmpacado(empacadoData) {
        const {
            id_lote,
            fecha_empacado,
            tipo_empaque,
            peso_inicial,
            peso_empacado,
            total_empaques = 1,
            tipo_producto_empacado = 'Grano',
            id_tueste,
            id_molienda,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = empacadoData;

        try {
            const [result] = await db.query(
                'INSERT INTO empacado (id_lote, fecha_empacado, tipo_empaque, peso_inicial, peso_empacado, total_empaques, tipo_producto_empacado, id_tueste, id_molienda, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id_lote, fecha_empacado, tipo_empaque, peso_inicial, peso_empacado, total_empaques, tipo_producto_empacado, id_tueste, id_molienda, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de empacado:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de empacado para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getEmpacadoByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT e.*, ep.nombre as estado_nombre FROM empacado e JOIN estados_proceso ep ON e.id_estado_proceso = ep.id WHERE e.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener empacado por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new EmpacadoDAO(); 