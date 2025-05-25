class Empacado {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso del café entrante, debe venir de tueste o molienda
        fecha_empacado,
        peso_empacado,
        total_empaques = 1,
        tipo_producto_empacado = 'Grano', // Enum: 'Grano', 'Molido', 'Pasilla Molido'
        id_tueste = null,
        id_molienda = null,
        observaciones = null,
        id_estado_proceso = 3 // Por defecto 'Terminado'
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_empacado = fecha_empacado;
        this.peso_empacado = peso_empacado;
        this.total_empaques = total_empaques;
        this.tipo_producto_empacado = tipo_producto_empacado;
        this.id_tueste = id_tueste;
        this.id_molienda = id_molienda;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Empacado; 