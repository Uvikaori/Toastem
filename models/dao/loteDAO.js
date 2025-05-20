const db = require('../../config/database');

class LoteDAO {

    /**
     * Genera un código de lote único para una finca.
     * Formato simple: F[ID_FINCA]-L[TIMESTAMP_ACTUAL]
     * Podría mejorarse para ser secuencial por finca.
     * @param {number} id_finca - ID de la finca.
     * @returns {string} - Código de lote generado.
     */
    async generarCodigoLoteUnico(id_finca) {
        // Implementación simple por ahora, se puede hacer más robusta (ej. consultando último lote de la finca)
        const timestamp = Date.now();
        return `F${id_finca}-L${timestamp}`;
    }

    /**
     * Crea un nuevo lote en la base de datos.
     * @param {Lote} lote - Objeto Lote a crear.
     * @returns {Promise<number>} - ID del lote creado.
     */
    async createLote(lote) {
        const { codigo, id_usuario, id_finca, fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones, id_estado_proceso, id_proceso_actual, id_destino_final, fecha_registro } = lote;

        try {
            const [result] = await db.query(
                'INSERT INTO lotes (codigo, id_usuario, id_finca, fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones, id_estado_proceso, id_proceso_actual, id_destino_final, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [codigo, id_usuario, id_finca, fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones, id_estado_proceso, id_proceso_actual, id_destino_final, fecha_registro]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error al crear el lote:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los lotes asociados a una finca.
     * @param {number} id_finca - ID de la finca.
     * @returns {Promise<Array>} - Lista de lotes.
     */
    async getLotesByFincaId(id_finca) {
        try {
            const [rows] = await db.query(
                'SELECT l.*, ep.nombre as estado_proceso_nombre, p.nombre as proceso_actual_nombre FROM lotes l LEFT JOIN estados_proceso ep ON l.id_estado_proceso = ep.id LEFT JOIN procesos p ON l.id_proceso_actual = p.id WHERE l.id_finca = ? ORDER BY l.fecha_recoleccion DESC, l.fecha_registro DESC',
                 [id_finca]
            );
            return rows;
        } catch (error) {
            console.error('Error al obtener los lotes de la finca:', error);
            throw error;
        }
    }

    /**
     * Obtiene un lote por su ID.
     * @param {number} id_lote - ID del lote.
     * @returns {Promise<Object|null>} - Objeto del lote o null si no se encuentra.
     */
    async getLoteById(id_lote) {
        try {
            const [rows] = await db.query(
                 'SELECT l.*, ep.nombre as estado_proceso_nombre, p.nombre as proceso_actual_nombre FROM lotes l LEFT JOIN estados_proceso ep ON l.id_estado_proceso = ep.id LEFT JOIN procesos p ON l.id_proceso_actual = p.id WHERE l.id = ?',
                  [id_lote]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener el lote por ID:', error);
            throw error;
        }
    }

    /**
     * Obtiene un lote por su ID y verifica que pertenezca al usuario especificado.
     * @param {number} id_lote - ID del lote.
     * @param {number} id_usuario - ID del usuario.
     * @returns {Promise<Object|null>} - Objeto del lote o null si no se encuentra o no pertenece al usuario.
     */
    async getLoteByIdAndUserId(id_lote, id_usuario) {
        try {
            const [rows] = await db.query(
                'SELECT l.*, ep.nombre as estado_proceso_nombre, p.nombre as proceso_actual_nombre FROM lotes l LEFT JOIN estados_proceso ep ON l.id_estado_proceso = ep.id LEFT JOIN procesos p ON l.id_proceso_actual = p.id WHERE l.id = ? AND l.id_usuario = ?',
                [id_lote, id_usuario]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener el lote por ID y usuario:', error);
            throw error;
        }
    }

    /**
     * Actualiza el proceso actual y el estado general de un lote.
     * @param {number} id_lote - ID del lote a actualizar.
     * @param {number} id_nuevo_proceso_actual - ID del nuevo proceso actual (de la tabla `procesos`).
     * @param {number} id_nuevo_estado_lote - ID del nuevo estado general del lote (de la tabla `estados_proceso`).
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async updateLoteProcesoYEstado(id_lote, id_nuevo_proceso_actual, id_nuevo_estado_lote) {
        try {
            const [result] = await db.query(
                'UPDATE lotes SET id_proceso_actual = ?, id_estado_proceso = ? WHERE id = ?',
                [id_nuevo_proceso_actual, id_nuevo_estado_lote, id_lote]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar el proceso y estado del lote:', error);
            throw error;
        }
    }

    // TODO: Añadir métodos para actualizar estado, peso final, etc.
}

module.exports = new LoteDAO(); 