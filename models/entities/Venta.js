class Venta {
    constructor(
        id = null,
        id_lote,
        fecha_venta,
        id_tipo_venta, // ID de la tabla tipos_venta (1: Pergamino, 2: Empacado)
        cantidad,      // ej: kg vendidos
        precio_kg,
        comprador = null,
        observaciones = null,
        detalle_producto_vendido = null
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_venta = fecha_venta;
        this.id_tipo_venta = id_tipo_venta;
        this.cantidad = cantidad;
        this.precio_kg = precio_kg;
        this.comprador = comprador;
        this.observaciones = observaciones;
        this.detalle_producto_vendido = detalle_producto_vendido;
    }
}

module.exports = Venta; 