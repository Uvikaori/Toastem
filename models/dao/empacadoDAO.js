const db = require('../../config/database');
const Empacado = require('../entities/Empacado');

class EmpacadoDAO {
    /**
     * Crea un nuevo registro de empacado en la base de datos.
     * @param {Empacado} empacado - Objeto con los datos del empacado a crear
     * @returns {Promise<number>} ID del registro creado
     */
    async createEmpacado(empacado) {
        try {
            const [result] = await db.query(
                `INSERT INTO empacado 
                (id_lote, fecha_empacado, peso_inicial, peso_empacado, 
                 total_empaques, tipo_producto_empacado, observaciones, id_estado_proceso,
                 id_tueste, id_molienda) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    empacado.id_lote, 
                    empacado.fecha_empacado, 
                    empacado.peso_inicial,
                    empacado.peso_empacado,
                    empacado.total_empaques,
                    empacado.tipo_producto_empacado,
                    empacado.observaciones,
                    empacado.id_estado_proceso,
                    empacado.id_tueste,
                    empacado.id_molienda
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error en empacadoDAO.createEmpacado:', error);
            throw error;
        }
    }

    /**
     * Obtiene un empacado específico por su ID
     * @param {number} idEmpacado - ID del empacado a buscar
     * @returns {Promise<Empacado|null>} Datos del empacado o null si no existe
     */
    async getEmpacadoById(idEmpacado) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM empacado WHERE id = ?',
                [idEmpacado]
            );
            
            if (rows.length === 0) {
                return null;
            }
            
            return new Empacado(
                rows[0].id,
                rows[0].id_lote,
                rows[0].fecha_empacado,
                rows[0].peso_inicial,
                rows[0].peso_empacado,
                rows[0].total_empaques,
                rows[0].tipo_producto_empacado,
                rows[0].observaciones,
                rows[0].id_estado_proceso,
                rows[0].id_tueste,
                rows[0].id_molienda
            );
        } catch (error) {
            console.error('Error en empacadoDAO.getEmpacadoById:', error);
            throw error;
        }
    }

    /**
     * Obtiene los datos del empacado de un lote específico.
     * @param {number} idLote - ID del lote
     * @returns {Promise<Empacado|null>} Datos del empacado o null si no existe
     */
    async getEmpacadoByLoteId(idLote) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM empacado WHERE id_lote = ?',
                [idLote]
            );
            
            if (rows.length === 0) {
                return null;
            }
            
            return new Empacado(
                rows[0].id,
                rows[0].id_lote,
                rows[0].fecha_empacado,
                rows[0].peso_inicial,
                rows[0].peso_empacado,
                rows[0].total_empaques,
                rows[0].tipo_producto_empacado,
                rows[0].observaciones,
                rows[0].id_estado_proceso,
                rows[0].id_tueste,
                rows[0].id_molienda
            );
        } catch (error) {
            console.error('Error en empacadoDAO.getEmpacadoByLoteId:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los datos de empacado de un lote específico.
     * @param {number} idLote - ID del lote
     * @returns {Promise<Array<Empacado>>} Lista de todos los empacados del lote
     */
    async getAllEmpacadosByLoteId(idLote) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM empacado WHERE id_lote = ? ORDER BY tipo_producto_empacado, fecha_empacado',
                [idLote]
            );
            
            return rows.map(row => new Empacado(
                row.id,
                row.id_lote,
                row.fecha_empacado,
                row.peso_inicial,
                row.peso_empacado,
                row.total_empaques,
                row.tipo_producto_empacado,
                row.observaciones,
                row.id_estado_proceso,
                row.id_tueste,
                row.id_molienda
            ));
        } catch (error) {
            console.error('Error en empacadoDAO.getAllEmpacadosByLoteId:', error);
            throw error;
        }
    }

    /**
     * Obtiene los datos de empacado por tipo de producto
     * @param {number} idLote - ID del lote
     * @param {string} tipoProducto - Tipo de producto ('Grano', 'Molido', 'Pasilla Molido')
     * @returns {Promise<Array<Empacado>>} Lista de registros de empacado que coinciden
     */
    async getEmpacadosByTipoProducto(idLote, tipoProducto) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM empacado WHERE id_lote = ? AND tipo_producto_empacado = ?',
                [idLote, tipoProducto]
            );
            
            return rows.map(row => new Empacado(
                row.id,
                row.id_lote,
                row.fecha_empacado,
                row.peso_inicial,
                row.peso_empacado,
                row.total_empaques,
                row.tipo_producto_empacado,
                row.observaciones,
                row.id_estado_proceso,
                row.id_tueste,
                row.id_molienda
            ));
        } catch (error) {
            console.error('Error en empacadoDAO.getEmpacadosByTipoProducto:', error);
            throw error;
        }
    }

    /**
     * Reinicia un proceso de empacado, cambiando su estado a "Reiniciado" (1).
     * @param {number} idEmpacado - ID del registro de empacado a reiniciar
     * @returns {Promise<void>}
     */
    async reiniciarEmpacado(idEmpacado) {
        try {
            await db.query(
                'UPDATE empacado SET id_estado_proceso = 1 WHERE id = ?',
                [idEmpacado]
            );
        } catch (error) {
            console.error('Error en empacadoDAO.reiniciarEmpacado:', error);
            throw error;
        }
    }
}

module.exports = new EmpacadoDAO(); 