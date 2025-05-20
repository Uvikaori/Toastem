class Clasificacion {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso ANTES de la clasificación (del proceso anterior, ej. secado.peso_final)
        fecha_clasificacion,
        peso_cafe_bueno, // Peso del café de buena calidad
        peso_total = null, // Peso total después de la clasificación
        peso_pergamino = null, // Peso del café en pergamino
        peso_pasilla = null, // Peso del café pasilla
        peso_otro = null, // Peso de otros tipos o subproductos
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_clasificacion = fecha_clasificacion;
        this.peso_cafe_bueno = peso_cafe_bueno;
        this.peso_total = peso_total;
        this.peso_pergamino = peso_pergamino;
        this.peso_pasilla = peso_pasilla;
        this.peso_otro = peso_otro;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Clasificacion; 