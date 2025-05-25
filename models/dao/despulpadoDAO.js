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

    /**
     * Actualiza un registro de despulpado existente.
     * @param {number} id_despulpado - ID del registro a actualizar.
     * @param {object} despulpadoData - Nuevos datos del despulpado.
     * @returns {Promise<boolean>} - True si la actualización fue exitosa.
     */
    async updateDespulpado(id_despulpado, despulpadoData) {
        const {
            peso_inicial,
            fecha_remojo,
            fecha_despulpado,
            peso_final,
            observaciones,
            id_estado_proceso
        } = despulpadoData;

        try {
            const [result] = await db.query(
                `UPDATE despulpado 
                SET peso_inicial = ?, 
                    fecha_remojo = ?, 
                    fecha_despulpado = ?, 
                    peso_final = ?, 
                    observaciones = ?, 
                    id_estado_proceso = ? 
                WHERE id = ?`,
                [peso_inicial, fecha_remojo, fecha_despulpado, peso_final, observaciones, id_estado_proceso, id_despulpado]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar registro de despulpado:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de despulpado para un lote específico.
     * Esto cambia el estado del proceso a "Por hacer" (id_estado_proceso = 1).
     * @param {number} id_despulpado - ID del registro de despulpado a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarDespulpado(id_despulpado) {
        try {
            // Obtener información actual del despulpado
            const [despulpadoActual] = await db.query(
                'SELECT observaciones FROM despulpado WHERE id = ?',
                [id_despulpado]
            );
            
            if (despulpadoActual.length === 0) {
                throw new Error('No se encontró el registro de despulpado');
            }
            
            let observaciones = despulpadoActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE despulpado SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_despulpado]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar despulpado:', error);
            throw error;
        }
    }
}

module.exports = new DespulpadoDAO(); 