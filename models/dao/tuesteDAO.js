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
            tipo_cafe,
            tipo_calidad,
            nivel_tueste,
            peso_pergamino_inicial,
            peso_pergamino_final,
            peso_pasilla_inicial,
            peso_pasilla_final,
            peso_final,
            observaciones,
            id_estado_proceso = 3 // Por defecto 'Terminado'
        } = tuesteData;

        try {
            console.log("Ejecutando query de inserción para tueste en lote:", id_lote);
            console.log("Datos a insertar:", {
                id_lote,
                fecha_tueste,
                peso_inicial,
                tipo_cafe,
                tipo_calidad,
                nivel_tueste,
                peso_pergamino_inicial,
                peso_pergamino_final,
                peso_pasilla_inicial,
                peso_pasilla_final,
                peso_final,
                observaciones,
                id_estado_proceso
            });
            
            // Primero, verificar si ya existe un registro de tueste para este lote
            const [existing] = await db.query(
                'SELECT id FROM tueste WHERE id_lote = ?',
                [id_lote]
            );
            
            if (existing && existing.length > 0) {
                console.log("Ya existe un registro de tueste para este lote, actualizando...");
                // Si ya existe, actualizar en lugar de insertar
                const [result] = await db.query(
                    `UPDATE tueste SET 
                        tipo_cafe = ?,
                        peso_pergamino_inicial = ?,
                        peso_pasilla_inicial = ?,
                        peso_inicial = ?,
                        tipo_calidad = ?,
                        fecha_tueste = ?,
                        peso_final = ?,
                        nivel_tueste = ?,
                        peso_pergamino_final = ?,
                        peso_pasilla_final = ?,
                        observaciones = ?,
                        id_estado_proceso = ?
                    WHERE id_lote = ?`,
                    [
                        tipo_cafe,
                        peso_pergamino_inicial || null,
                        peso_pasilla_inicial || null,
                        peso_inicial,
                        tipo_calidad,
                        fecha_tueste,
                        peso_final,
                        nivel_tueste,
                        peso_pergamino_final || null,
                        peso_pasilla_final || null,
                        observaciones || null,
                        id_estado_proceso,
                        id_lote
                    ]
                );
                console.log("Registro de tueste actualizado:", result);
                return existing[0].id;
            } else {
                // Si no existe, insertar nuevo registro
                console.log("Creando nuevo registro de tueste...");
                
                // Inserción que coincide con la estructura de la tabla
                const [result] = await db.query(
                    `INSERT INTO tueste (
                        id_lote, tipo_cafe, 
                        peso_pergamino_inicial, peso_pasilla_inicial,
                        peso_inicial, tipo_calidad, fecha_tueste,
                        peso_final, nivel_tueste,
                        peso_pergamino_final, peso_pasilla_final,
                        observaciones, id_estado_proceso
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id_lote,
                        tipo_cafe,
                        peso_pergamino_inicial || null,
                        peso_pasilla_inicial || null,
                        peso_inicial,
                        tipo_calidad,
                        fecha_tueste,
                        peso_final,
                        nivel_tueste,
                        peso_pergamino_final || null,
                        peso_pasilla_final || null,
                        observaciones || null,
                        id_estado_proceso
                    ]
                );
                console.log("Nuevo registro de tueste creado:", result);
                return result.insertId;
            }
        } catch (error) {
            console.error('Error al crear/actualizar registro de tueste:', error);
            // Imprimir información más detallada sobre el error
            if (error.code) {
                console.error('Código de error SQL:', error.code);
            }
            if (error.sqlMessage) {
                console.error('Mensaje de error SQL:', error.sqlMessage);
            }
            if (error.sql) {
                console.error('SQL ejecutado:', error.sql);
            }
            throw new Error(`Error en la base de datos: ${error.message}`);
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