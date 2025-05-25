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
            peso_inicial,
            fecha_trilla,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = trillaData;

        try {
            const [result] = await db.query(
                'INSERT INTO trilla (id_lote, peso_inicial, fecha_trilla, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?)',
                [id_lote, peso_inicial, fecha_trilla, peso_final, observaciones, id_estado_proceso]
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
                'SELECT t.*, ep.nombre as estado_nombre FROM trilla t JOIN estados_proceso ep ON t.id_estado_proceso = ep.id WHERE t.id_lote = ?',
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
     * Esto cambia el estado del proceso a "Por hacer" (id_estado_proceso = 1).
     * @param {number} id_trilla - ID del registro de trilla a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarTrilla(id_trilla) {
        try {
            // Obtener información actual de la trilla
            const [trillaActual] = await db.query(
                'SELECT observaciones FROM trilla WHERE id = ?',
                [id_trilla]
            );
            
            if (trillaActual.length === 0) {
                throw new Error('No se encontró el registro de trilla');
            }
            
            let observaciones = trillaActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE trilla SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_trilla]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar trilla:', error);
            throw error;
        }
    }
}

module.exports = new TrillaDAO(); 