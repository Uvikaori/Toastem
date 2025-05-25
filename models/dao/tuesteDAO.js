const db = require('../../config/database');

class TuesteDAO {
    /**
     * Crea un nuevo registro de tueste.
     * @param {object} tuesteData - Datos del proceso.
     * @returns {Promise<number>} - ID del registro creado.
     */
    async createTueste(tuesteData) {
        const {
            id_lote,
            fecha_tueste,
            peso_inicial,
            tipo_calidad,
            nivel_tueste,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = tuesteData;

        try {
            const [result] = await db.query(
                'INSERT INTO tueste (id_lote, fecha_tueste, peso_inicial, tipo_calidad, nivel_tueste, peso_final, observaciones, id_estado_proceso) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id_lote, fecha_tueste, peso_inicial, tipo_calidad, nivel_tueste, peso_final, observaciones, id_estado_proceso]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de tueste:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de tueste para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Object|null>}
     */
    async getTuesteByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT t.*, ep.nombre as estado_nombre FROM tueste t JOIN estados_proceso ep ON t.id_estado_proceso = ep.id WHERE t.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener tueste por id_lote:', error);
            throw error;
        }
    }

    /**
     * Reinicia el proceso de tueste para un lote específico.
     * Esto cambia el estado del proceso a "Por hacer" (id_estado_proceso = 1).
     * @param {number} id_tueste - ID del registro de tueste a reiniciar.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async reiniciarTueste(id_tueste) {
        try {
            // Obtener información actual del tueste
            const [tuesteActual] = await db.query(
                'SELECT observaciones FROM tueste WHERE id = ?',
                [id_tueste]
            );
            
            if (tuesteActual.length === 0) {
                throw new Error('No se encontró el registro de tueste');
            }
            
            let observaciones = tuesteActual[0].observaciones || '';
            observaciones += '\n[CORRECCIÓN] Proceso reiniciado para corrección de datos: ' + new Date().toLocaleString();
            
            // Actualizar a estado "Por hacer" (id=1) y añadir indicador de corrección en observaciones
            const [result] = await db.query(
                'UPDATE tueste SET id_estado_proceso = 1, observaciones = ? WHERE id = ?',
                [observaciones, id_tueste]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar tueste:', error);
            throw error;
        }
    }
}

module.exports = new TuesteDAO(); 