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

    /**
     * Marca un lote como "Cancelado" (estado id=4).
     * @param {number} id_lote - ID del lote a cancelar.
     * @param {string} motivo - Motivo de la cancelación.
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async cancelarLote(id_lote, motivo) {
        try {
            // Obtener el lote para añadir el motivo a las observaciones
            const loteActual = await this.getLoteById(id_lote);
            if (!loteActual) {
                throw new Error('No se encontró el lote');
            }
            
            // Actualizar observaciones
            let observaciones = loteActual.observaciones || '';
            observaciones += `\n[CANCELADO] ${motivo} - Fecha: ${new Date().toLocaleString()}`;
            
            // Actualizar el estado del lote a "Cancelado" (id=4)
            const [result] = await db.query(
                'UPDATE lotes SET id_estado_proceso = 4, observaciones = ? WHERE id = ?',
                [observaciones, id_lote]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al cancelar el lote:', error);
            throw error;
        }
    }

    /**
     * Duplica un lote para reiniciarlo, manteniendo algunos datos básicos.
     * @param {number} id_lote_original - ID del lote a duplicar.
     * @param {string} motivo - Motivo de la duplicación.
     * @returns {Promise<number>} - ID del nuevo lote creado.
     */
    async duplicarLote(id_lote_original, motivo) {
        try {
            // Obtener el lote original
            const loteOriginal = await this.getLoteById(id_lote_original);
            if (!loteOriginal) {
                throw new Error('No se encontró el lote original');
            }
            
            // Generar un nuevo código para el lote duplicado
            const fechaActual = new Date();
            const anio = fechaActual.getFullYear();
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const fincaId = loteOriginal.id_finca;
            
            // Obtener el último código de lote para esta finca
            const [ultimosLotes] = await db.query(
                'SELECT codigo FROM lotes WHERE id_finca = ? ORDER BY id DESC LIMIT 1',
                [fincaId]
            );
            
            let secuencia = 1;
            if (ultimosLotes.length > 0) {
                const ultimoCodigo = ultimosLotes[0].codigo;
                const match = ultimoCodigo.match(/(\d+)$/);
                if (match) {
                    secuencia = parseInt(match[1], 10) + 1;
                }
            }
            
            const nuevoCodigo = `${anio}${mes}-F${fincaId}-${secuencia}`;
            
            // Crear el nuevo lote con los datos básicos del original
            const nuevoLote = {
                codigo: nuevoCodigo,
                id_usuario: loteOriginal.id_usuario,
                id_finca: loteOriginal.id_finca,
                fecha_recoleccion: loteOriginal.fecha_recoleccion,
                peso_inicial: loteOriginal.peso_inicial,
                tipo_cafe: loteOriginal.tipo_cafe,
                tipo_recoleccion: loteOriginal.tipo_recoleccion,
                observaciones: `Lote duplicado a partir del lote ${loteOriginal.codigo}. Motivo: ${motivo}. Fecha: ${fechaActual.toLocaleString()}`,
                id_estado_proceso: 2, // En progreso
                id_proceso_actual: 1, // Recolección
                id_destino_final: loteOriginal.id_destino_final,
                fecha_registro: fechaActual
            };
            
            // Insertar el nuevo lote
            const [result] = await db.query(
                'INSERT INTO lotes (codigo, id_usuario, id_finca, fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones, id_estado_proceso, id_proceso_actual, id_destino_final, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nuevoLote.codigo, nuevoLote.id_usuario, nuevoLote.id_finca, nuevoLote.fecha_recoleccion, nuevoLote.peso_inicial, nuevoLote.tipo_cafe, nuevoLote.tipo_recoleccion, nuevoLote.observaciones, nuevoLote.id_estado_proceso, nuevoLote.id_proceso_actual, nuevoLote.id_destino_final, nuevoLote.fecha_registro]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Error al duplicar el lote:', error);
            throw error;
        }
    }

    /**
     * Actualiza campos específicos de un lote.
     * @param {number} id_lote - ID del lote a actualizar.
     * @param {object} camposAActualizar - Objeto con los campos y sus nuevos valores. Ejemplo: { fecha_finalizacion: 'YYYY-MM-DD', observaciones: 'Nuevo texto' }
     * @returns {Promise<boolean>} - True si fue exitoso, false en caso contrario.
     */
    async update(id_lote, camposAActualizar) {
        if (Object.keys(camposAActualizar).length === 0) {
            return false; // No hay campos para actualizar
        }

        const camposPermitidos = ['codigo', 'id_usuario', 'id_finca', 'fecha_recoleccion', 'peso_inicial', 'tipo_cafe', 'tipo_recoleccion', 'observaciones', 'id_destino_final', 'id_estado_proceso', 'id_proceso_actual', 'fecha_finalizacion'];
        
        let querySet = [];
        let queryParams = [];

        for (const campo in camposAActualizar) {
            if (camposAActualizar.hasOwnProperty(campo) && camposPermitidos.includes(campo)) {
                querySet.push(`${campo} = ?`);
                queryParams.push(camposAActualizar[campo]);
            }
        }

        if (querySet.length === 0) {
            console.warn('Ningún campo válido para actualizar en el lote.');
            return false;
        }

        queryParams.push(id_lote); // Añadir el ID del lote al final para el WHERE

        try {
            const sql = `UPDATE lotes SET ${querySet.join(', ')} WHERE id = ?`;
            const [result] = await db.query(sql, queryParams);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar el lote:', error);
            throw error;
        }
    }

    // TODO: Añadir métodos para actualizar estado, peso final, etc.
}

module.exports = new LoteDAO(); 