class Tueste {
    constructor(
        id = null,
        id_lote,
        fecha_tueste,
        peso_inicial,
        tipo_calidad, // enum('Premium', 'Normal', 'Baja')
        nivel_tueste, // enum('Alto', 'Medio', 'Bajo')
        peso_final,
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_tueste = fecha_tueste;
        this.peso_inicial = peso_inicial;
        this.tipo_calidad = tipo_calidad;
        this.nivel_tueste = nivel_tueste;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Tueste; 