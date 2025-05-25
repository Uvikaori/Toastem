class Molienda {
    constructor(
        id = null,
        id_tueste,
        fecha_molienda,
        peso_inicial,
        tipo_molienda, // enum('Granulado','Fino')
        peso_final,
        es_grano = false,
        cantidad = null,
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_tueste = id_tueste;
        this.fecha_molienda = fecha_molienda;
        this.peso_inicial = peso_inicial;
        this.tipo_molienda = tipo_molienda;
        this.peso_final = peso_final;
        this.es_grano = es_grano;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Molienda; 