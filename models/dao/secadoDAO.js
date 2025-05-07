const db = require('../../config/database');

class SecadoDAO {
    /**
     * Crea un nuevo registro de inicio de secado.
     * @param {object} secadoData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createSecado(secadoData) {
        const {
            id_lote,
            peso_inicial,
            fecha_inicio,
            metodo_secado,
            humedad_inicial,
            fecha_fin = null,      // Puede ser null al inicio
            peso_final = null,     // Puede ser null al inicio
            observaciones,
            id_estado_proceso = 2 // Por defecto 'En progreso' para la etapa
        } = secadoData;

        try {
            const [result] = await db.query(
                'INSERT INTO secado (id_lote, peso_inicial, fecha_inicio, metodo_secado, humedad_inicial, fecha_fin, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_inicio, metodo_secado, humedad_inicial, fecha_fin, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de secado:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de secado para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getSecadoByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT s.*, ep.nombre as estado_nombre FROM secado s JOIN estados_proceso ep ON s.id_estado_proceso = ep.id WHERE s.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener secado por id_lote:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de secado, típicamente para marcarlo como finalizado.
     * @param {number} id_secado - ID del registro de secado a actualizar.
     * @param {object} dataToUpdate - Datos a actualizar (ej: fecha_fin, peso_final, id_estado_proceso).
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async updateSecado(id_secado, dataToUpdate) {
        const fields = [];
        const values = [];
        for (const key in dataToUpdate) {
            // Asegurarse de que la propiedad realmente pertenece al objeto y no a su prototipo
            if (Object.prototype.hasOwnProperty.call(dataToUpdate, key) && dataToUpdate[key] !== undefined) {
                fields.push(`${key} = ?`);
                values.push(dataToUpdate[key]);
            }
        }

        if (fields.length === 0) {
            console.warn("UpdateSecado: No fields to update.");
            return false; 
        }

        values.push(id_secado); 

        const sql = `UPDATE secado SET ${fields.join(', ')} WHERE id = ?`;

        try {
            const [result] = await db.query(sql, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar el registro de secado:', error);
            throw error;
        }
    }
}

module.exports = new SecadoDAO(); 