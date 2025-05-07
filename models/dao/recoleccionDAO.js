const db = require('../../config/database');
const Recoleccion = require('../entities/Recoleccion');

class RecoleccionDAO {
    static async crearRecoleccion(recoleccion) {
        try {
            const query = `
                INSERT INTO lotes (codigo, id_usuario, id_finca, fecha_recoleccion, peso_inicial, 
                                 tipo_recoleccion, tipo_cafe, observaciones, id_destino_final, 
                                 id_estado_proceso, id_proceso_actual)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.query(query, [
                recoleccion.codigo,
                recoleccion.id_usuario,
                recoleccion.id_finca,
                recoleccion.fecha_recoleccion,
                recoleccion.peso_inicial,
                recoleccion.tipo_recoleccion,
                recoleccion.tipo_cafe,
                recoleccion.observaciones,
                recoleccion.id_destino_final || 1, // Por defecto proceso completo
                recoleccion.id_estado_proceso || 1, // Por defecto "Por hacer"
                recoleccion.id_proceso_actual || 1  // Por defecto "Recolección"
            ]);

            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    static async obtenerRecoleccionPorId(id) {
        try {
            const query = `
                SELECT * FROM lotes 
                WHERE id = ?
            `;
            
            const [rows] = await db.query(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }

            return new Recoleccion(
                rows[0].id,
                rows[0].id_lote,
                rows[0].fecha_recoleccion,
                rows[0].peso_inicial,
                rows[0].tipo_recoleccion,
                rows[0].tipo_cafe,
                rows[0].observaciones
            );
        } catch (error) {
            throw error;
        }
    }

    static async actualizarRecoleccion(recoleccion) {
        try {
            const query = `
                UPDATE lotes 
                SET fecha_recoleccion = ?,
                    peso_inicial = ?,
                    tipo_recoleccion = ?,
                    tipo_cafe = ?,
                    observaciones = ?
                WHERE id = ?
            `;
            
            const [result] = await db.query(query, [
                recoleccion.fecha_recoleccion,
                recoleccion.peso_inicial,
                recoleccion.tipo_recoleccion,
                recoleccion.tipo_cafe,
                recoleccion.observaciones,
                recoleccion.id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = RecoleccionDAO; 