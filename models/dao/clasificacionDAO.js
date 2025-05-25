const db = require('../../config/database');

class ClasificacionDAO {
    /**
     * Crea un nuevo registro de clasificación por atributos.
     * @param {object} clasificacionData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createClasificacion(clasificacionData) {
        const {
            id_lote,
            peso_inicial,
            fecha_clasificacion,
            peso_total,
            peso_pergamino,
            peso_pasilla,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = clasificacionData;

        try {
            const [result] = await db.query(
                'INSERT INTO clasificacion (id_lote, peso_inicial, fecha_clasificacion, observaciones, id_estado_proceso, peso_total, peso_pergamino, peso_pasilla) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_clasificacion, observaciones, id_estado_proceso, peso_total, peso_pergamino, peso_pasilla]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de clasificación:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de clasificación por atributos para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getClasificacionByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT ca.*, ep.nombre as estado_nombre FROM clasificacion ca JOIN estados_proceso ep ON ca.id_estado_proceso = ep.id WHERE ca.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener clasificación por id_lote:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de clasificación para un lote específico.
     * Esto cambia el estado del proceso a "Por hacer" (id_estado_proceso = 1).
     * @param {number} id_clasificacion - ID del registro de clasificación a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarClasificacion(id_clasificacion) {
        try {
            // Obtener información actual de la clasificación
            const [clasificacionActual] = await db.query(
                'SELECT observaciones FROM clasificacion WHERE id = ?',
                [id_clasificacion]
            );
            
            if (clasificacionActual.length === 0) {
                throw new Error('No se encontró el registro de clasificación');
            }
            
            let observaciones = clasificacionActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE clasificacion SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_clasificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar clasificación:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de clasificación existente.
     * @param {number} id_clasificacion
     * @param {object} datos
     * @returns {Promise<boolean>}
     */
    async updateClasificacion(id_clasificacion, datos) {
        try {
            const {
                peso_inicial,
                fecha_clasificacion,
                peso_total,
                peso_pergamino,
                peso_pasilla,
                observaciones,
                id_estado_proceso
            } = datos;
            const [result] = await db.query(
                'UPDATE clasificacion SET peso_inicial = ?, fecha_clasificacion = ?, peso_total = ?, peso_pergamino = ?, peso_pasilla = ?, observaciones = ?, id_estado_proceso = ? WHERE id = ?',
                [peso_inicial, fecha_clasificacion, peso_total, peso_pergamino, peso_pasilla, observaciones, id_estado_proceso, id_clasificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar clasificación:', error);
            throw error;
        }
    }
}

module.exports = new ClasificacionDAO(); 