const db = require('../../config/database');

class ControlCalidadDAO {
    /**
     * Crea un nuevo registro de control de calidad.
     * @param {object} controlData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createControlCalidad(controlData) {
        const {
            id_lote,
            fecha_control,
            tipo_control,
            resultado_control,
            puntaje_cata,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = controlData;

        try {
            const [result] = await db.query(
                'INSERT INTO control_calidad (id_lote, fecha_control, tipo_control, resultado_control, puntaje_cata, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id_lote, fecha_control, tipo_control, resultado_control, puntaje_cata, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de control de calidad:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de control de calidad para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getControlCalidadByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT cc.*, ep.nombre as estado_nombre FROM control_calidad cc JOIN estados_proceso ep ON cc.id_estado_proceso = ep.id WHERE cc.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener control de calidad por id_lote:', error);
            throw error;
        }
    }
}

module.exports = new ControlCalidadDAO(); 