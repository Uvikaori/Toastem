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

    /**
     * Actualiza un registro de fermentación y lavado existente.
     * @param {object} fermentacionData - Datos actualizados del proceso.
     * @returns {Promise<boolean>} - True si la actualización fue exitosa.
     */
    async updateFermentacionLavado(fermentacionData) {
        const {
            id,
            peso_inicial,
            fecha_inicio_fermentacion,
            fecha_lavado,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado' para la etapa
        } = fermentacionData;

        try {
            const [result] = await db.query(
                `UPDATE fermentacion_lavado 
                SET peso_inicial = ?, 
                    fecha_inicio_fermentacion = ?, 
                    fecha_lavado = ?, 
                    peso_final = ?, 
                    observaciones = ?, 
                    id_estado_proceso = ? 
                WHERE id = ?`,
                [peso_inicial, fecha_inicio_fermentacion, fecha_lavado, peso_final, observaciones, id_estado_proceso, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar registro de fermentación y lavado:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de fermentación y lavado para un lote específico.
     * @param {number} id_fermentacion - ID del registro a reiniciar.
     * @returns {Promise<boolean>} - True si el reinicio fue exitoso.
     */
    async reiniciarFermentacionLavado(id_fermentacion) {
        try {
            // Obtener información actual del registro
            const [fermentacionActual] = await db.query(
                'SELECT observaciones FROM fermentacion_lavado WHERE id = ?',
                [id_fermentacion]
            );
            
            if (fermentacionActual.length === 0) {
                throw new Error('No se encontró el registro de fermentación y lavado');
            }
            
            let observaciones = fermentacionActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE fermentacion_lavado SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_fermentacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar fermentación y lavado:', error);
            throw error;
        }
    }
}

module.exports = new FermentacionLavadoDAO(); 