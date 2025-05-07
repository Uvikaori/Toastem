class FermentacionLavado {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso del lote ANTES de la fermentación (viene del despulpado.peso_final)
        fecha_inicio_fermentacion,
        fecha_lavado,
        peso_final,   // Peso DESPUÉS del lavado
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' en la tabla 'estados_proceso' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_inicio_fermentacion = fecha_inicio_fermentacion;
        this.fecha_lavado = fecha_lavado;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = FermentacionLavado; 