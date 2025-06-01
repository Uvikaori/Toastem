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
            fecha_trilla,
            peso_pergamino_inicial,
            peso_pasilla_inicial,
            peso_pergamino_final,
            peso_pasilla_final,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = trillaData;

        try {
            const [result] = await db.query(
                `INSERT INTO trilla (
                    id_lote, fecha_trilla, 
                    peso_pergamino_inicial, peso_pasilla_inicial,
                    peso_pergamino_final, peso_pasilla_final,
                    peso_final, observaciones, id_estado_proceso
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_lote, fecha_trilla,
                    peso_pergamino_inicial, peso_pasilla_inicial,
                    peso_pergamino_final, peso_pasilla_final,
                    peso_final, observaciones, id_estado_proceso
                ]
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
                `SELECT t.*, ep.nombre as estado_nombre 
                FROM trilla t 
                JOIN estados_proceso ep ON t.id_estado_proceso = ep.id 
                WHERE t.id_lote = ?`,
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener trilla por id_lote:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de trilla para un lote específico.
     * @param {number} id_trilla - ID del registro de trilla a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarTrilla(id_trilla) {
        try {
            // Obtener el registro completo para preservar todos los valores actuales
            const [trillaActual] = await db.query(
                'SELECT * FROM trilla WHERE id = ?',
                [id_trilla]
            );
            
            if (trillaActual.length === 0) {
                throw new Error('No se encontró el registro de trilla');
            }
            
            // Actualizar las observaciones
            let observaciones = trillaActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            console.log('Reiniciando trilla, preservando fecha actual:', trillaActual[0].fecha_trilla);
            
            // Solo actualizar el estado y las observaciones, preservando todos los demás valores
            const [result] = await db.query(
                'UPDATE trilla SET id_estado_proceso = 2, observaciones = ? WHERE id = ?',
                [observaciones, id_trilla]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar trilla:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de trilla existente.
     * @param {number} id_trilla - ID del registro a actualizar.
     * @param {object} datosActualizacion - Datos a actualizar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async updateTrilla(id_trilla, datosActualizacion) {
        try {
            // Construir la consulta dinámicamente basada en los campos proporcionados
            let queryParts = [];
            let queryParams = [];
            
            for (const [key, value] of Object.entries(datosActualizacion)) {
                if (value !== undefined) {
                    queryParts.push(`${key} = ?`);
                    queryParams.push(value);
                }
            }
            
            if (queryParts.length === 0) {
                return false; // No hay nada que actualizar
            }
            
            // Añadir el ID al final de los parámetros
            queryParams.push(id_trilla);
            
            const query = `UPDATE trilla SET ${queryParts.join(', ')} WHERE id = ?`;
            
            const [result] = await db.query(query, queryParams);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar trilla:', error);
            throw error;
        }
    }
}

module.exports = new TrillaDAO(); 