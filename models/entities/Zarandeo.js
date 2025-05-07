class Zarandeo {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso del lote ANTES del zarandeo (viene de fermentacion_lavado.peso_final)
        fecha_zarandeo,
        peso_final,   // Peso DESPUÉS del zarandeo
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' en la tabla 'estados_proceso' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_zarandeo = fecha_zarandeo;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Zarandeo; 