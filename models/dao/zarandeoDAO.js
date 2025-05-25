const db = require('../../config/database');

class ZarandeoDAO {
    /**
     * Crea un nuevo registro de zarandeo.
     * @param {object} zarandeoData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createZarandeo(zarandeoData) {
        const {
            id_lote,
            peso_inicial,
            fecha_zarandeo,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado' para la etapa
        } = zarandeoData;

        try {
            const [result] = await db.query(
                'INSERT INTO zarandeo (id_lote, peso_inicial, fecha_zarandeo, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_zarandeo, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de zarandeo:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de zarandeo para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getZarandeoByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT z.*, ep.nombre as estado_nombre FROM zarandeo z JOIN estados_proceso ep ON z.id_estado_proceso = ep.id WHERE z.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener zarandeo por id_lote:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de zarandeo para un lote específico.
     * Esto cambia el estado del proceso a "Por hacer" (id_estado_proceso = 1).
     * @param {number} id_zarandeo - ID del registro de zarandeo a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarZarandeo(id_zarandeo) {
        try {
            // Obtener información actual del zarandeo
            const [zarandeoActual] = await db.query(
                'SELECT observaciones FROM zarandeo WHERE id = ?',
                [id_zarandeo]
            );
            
            if (zarandeoActual.length === 0) {
                throw new Error('No se encontró el registro de zarandeo');
            }
            
            let observaciones = zarandeoActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE zarandeo SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_zarandeo]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar zarandeo:', error);
            throw error;
        }
    }
}

module.exports = new ZarandeoDAO(); 