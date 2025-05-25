class ControlCalidad {
    constructor(
        id = null,
        id_lote,
        fecha_control,
        tipo_control, // enum('Cata','Análisis Físico','Análisis Químico','Otro')
        resultado_control, // enum('Aprobado','Rechazado','Condicional')
        puntaje_cata = null,
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_control = fecha_control;
        this.tipo_control = tipo_control;
        this.resultado_control = resultado_control;
        this.puntaje_cata = puntaje_cata;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = ControlCalidad; 