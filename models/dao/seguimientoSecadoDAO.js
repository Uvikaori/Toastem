const db = require('../../config/database');

class SeguimientoSecadoDAO {
    /**
     * Crea un nuevo registro de seguimiento de secado.
     * @param {object} seguimientoData - Datos del seguimiento.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createSeguimientoSecado(seguimientoData) {
        const {
            id_secado,
            fecha,
            temperatura,
            humedad,
            observaciones
        } = seguimientoData;

        try {
            const [result] = await db.query(
                'INSERT INTO seguimiento_secado (id_secado, fecha, temperatura, humedad, observaciones) VALUES (?, ?, ?, ?, ?)',
                [id_secado, fecha, temperatura, humedad, observaciones]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de seguimiento de secado:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los registros de seguimiento para un secado específico.
     * @param {number} id_secado
     * @returns {Promise<Array>}
     */
    async getSeguimientosBySecadoId(id_secado) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM seguimiento_secado WHERE id_secado = ? ORDER BY fecha ASC',
                [id_secado]
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener seguimientos por id_secado:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de seguimiento de secado.
     * @param {number} id_seguimiento - ID del registro a actualizar.
     * @param {object} dataToUpdate - Datos a actualizar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async updateSeguimientoSecado(id_seguimiento, dataToUpdate) {
        const fields = [];
        const values = [];
        for (const key in dataToUpdate) {
            if (Object.prototype.hasOwnProperty.call(dataToUpdate, key) && dataToUpdate[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(dataToUpdate[key]);
            }
        }

        if (fields.length === 0) {
            console.warn("UpdateSeguimientoSecado: No fields to update.");
            return false; 
        }

        values.push(id_seguimiento); 

        const sql = `UPDATE seguimiento_secado SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const [result] = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar el registro de seguimiento de secado:', error);
            throw error;
        }
    }

    /**
     * Elimina un registro de seguimiento de secado.
     * @param {number} id_seguimiento - ID del registro a eliminar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async deleteSeguimientoSecado(id_seguimiento) {
        try {
            const [result] = await db.query(
                'DELETE FROM seguimiento_secado WHERE id = ?',
                [id_seguimiento]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar seguimiento de secado:', error);
            throw error;
        }
    }
}

module.exports = new SeguimientoSecadoDAO(); 