const db = require('../../config/database');

class VentaDAO {
    async createVenta(venta) {
        const { id_lote, fecha_venta, id_tipo_venta, cantidad, precio_kg, comprador, observaciones, detalle_producto_vendido } = venta;
        try {
            const sql = 'INSERT INTO ventas (id_lote, fecha_venta, id_tipo_venta, cantidad, precio_kg, comprador, observaciones, detalle_producto_vendido) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await db.query(sql, [id_lote, fecha_venta, id_tipo_venta, cantidad, precio_kg, comprador, observaciones, detalle_producto_vendido]);
            return result.insertId; // Devuelve el ID de la venta creada
        } catch (error) {
            console.error('Error al crear la venta en la base de datos:', error);
            throw error; // Propaga el error para que el controlador lo maneje
        }
    }

    // Podrías añadir un método para verificar si ya existe una venta para evitar duplicados si es necesario
    // async getVentaByLoteIdAndTipo(id_lote, tipoVentaNombre) { 
    //    try {
    //        const [rows] = await db.query('SELECT * FROM ventas WHERE id_lote = ? AND id_tipo_venta = (SELECT id FROM tipos_venta WHERE nombre = ?)', [id_lote, tipoVentaNombre]);
    //        return rows.length > 0 ? rows[0] : null;
    //    } catch (error) {
    //        console.error('Error al obtener venta por lote y tipo:', error);
    //        throw error;
    //    }
    // }
}

module.exports = new VentaDAO(); 