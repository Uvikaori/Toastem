const db = require('../../config/database');

class MoliendaDAO {
    /**
     * Crea un nuevo registro de molienda.
     * @param {Molienda} molienda - El objeto molienda a insertar
     * @param {string} tipo_cafe - El tipo de café (Pergamino/Pasilla)
     * @returns {Promise<number>} - El ID del nuevo registro
     */
    async createMolienda(molienda, tipo_cafe) {
        try {
            const { id_tueste, fecha_molienda, peso_inicial, tipo_molienda, 
                    peso_final, es_grano, cantidad, observaciones, id_estado_proceso } = molienda;
            
            // Usar peso_final como cantidad si cantidad es NULL (la columna cantidad no permite valores NULL)
            const cantidadFinal = cantidad || peso_final;
            
            const [result] = await db.query(
                'INSERT INTO molienda (id_tueste, fecha_molienda, peso_inicial, tipo_molienda, ' +
                'peso_final, es_grano, cantidad, observaciones, id_estado_proceso, tipo_cafe) ' +
                'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id_tueste, fecha_molienda, peso_inicial, tipo_molienda, 
                 peso_final, es_grano, cantidadFinal, observaciones, id_estado_proceso, tipo_cafe]
            );
            console.log('Registro de molienda creado con ID:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('Error al crear registro de molienda:', error);
            throw error;
        }
    }

    /**
     * Actualiza un registro de molienda existente.
     * @param {number} id_molienda - ID del registro a actualizar
     * @param {object} datosActualizados - Datos a actualizar
     * @returns {Promise<boolean>} - true si se actualizó correctamente
     */
    async updateMolienda(id_molienda, datosActualizados) {
        try {
            const { fecha_molienda, peso_inicial, tipo_molienda, 
                    peso_final, es_grano, cantidad, observaciones, id_estado_proceso } = datosActualizados;
            
            const fieldsToUpdate = [];
            const values = [];
            
            if (fecha_molienda !== undefined) {
                fieldsToUpdate.push('fecha_molienda = ?');
                values.push(fecha_molienda);
            }
            if (peso_inicial !== undefined) {
                fieldsToUpdate.push('peso_inicial = ?');
                values.push(peso_inicial);
            }
            if (tipo_molienda !== undefined) {
                fieldsToUpdate.push('tipo_molienda = ?');
                values.push(tipo_molienda);
            }
            if (peso_final !== undefined) {
                fieldsToUpdate.push('peso_final = ?');
                values.push(peso_final);
                
                // Actualizar también cantidad con el valor de peso_final si cantidad no se proporciona
                if (cantidad === undefined) {
                    fieldsToUpdate.push('cantidad = ?');
                    values.push(peso_final);
                }
            }
            if (es_grano !== undefined) {
                fieldsToUpdate.push('es_grano = ?');
                values.push(es_grano);
            }
            if (cantidad !== undefined) {
                fieldsToUpdate.push('cantidad = ?');
                values.push(cantidad);
            }
            if (observaciones !== undefined) {
                fieldsToUpdate.push('observaciones = ?');
                values.push(observaciones);
            }
            if (id_estado_proceso !== undefined) {
                fieldsToUpdate.push('id_estado_proceso = ?');
                values.push(id_estado_proceso);
            }
            
            if (fieldsToUpdate.length === 0) {
                return false; // No hay campos para actualizar
            }
            
            values.push(id_molienda); // Para la cláusula WHERE
            
            const [result] = await db.query(
                `UPDATE molienda SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar molienda:', error);
            throw error;
        }
    }

    /**
     * Obtiene el registro de molienda para un lote específico.
     * @param {number} id_lote
     * @returns {Promise<Array>} - Array de objetos molienda
     */
    async getMoliendaByLoteId(id_lote) {
        try {
            const [rows] = await db.query(
                'SELECT m.*, ep.nombre as estado_nombre FROM molienda m ' +
                'JOIN tueste t ON m.id_tueste = t.id ' +
                'JOIN estados_proceso ep ON m.id_estado_proceso = ep.id ' +
                'WHERE t.id_lote = ?',
                [id_lote]
            );
            return rows.length > 0 ? rows : [];
        } catch (error) {
            console.error('Error al obtener molienda por id_lote:', error);
            throw error;
        }
    }

    /**
     * Obtiene un registro de molienda por su ID.
     * @param {number} id_molienda 
     * @returns {Promise<Object|null>}
     */
    async getMoliendaById(id_molienda) {
        try {
            const [rows] = await db.query(
                'SELECT m.*, ep.nombre as estado_nombre FROM molienda m ' +
                'JOIN estados_proceso ep ON m.id_estado_proceso = ep.id ' +
                'WHERE m.id = ?',
                [id_molienda]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error al obtener molienda por ID:', error);
            throw error;
        }
    }

    /**
     * Reinicia un registro de molienda a estado pendiente para su corrección.
     * @param {number} id_molienda 
     * @returns {Promise<boolean>}
     */
    async reiniciarMolienda(id_molienda) {
        try {
            const [result] = await db.query(
                'UPDATE molienda SET id_estado_proceso = 1, ' +
                'observaciones = CONCAT(IFNULL(observaciones, ""), " [REINICIADO] ", NOW()) ' +
                'WHERE id = ?',
                [id_molienda]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al reiniciar molienda:', error);
            throw error;
        }
    }
}

module.exports = new MoliendaDAO(); 