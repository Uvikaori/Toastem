class Clasificacion {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso inicial para el proceso de clasificación (viene de secado.peso_final)
        fecha_clasificacion,
        peso_total = null, // Peso total del café clasificado
        peso_pergamino = null, // Peso del café pergamino clasificado
        peso_pasilla = null, // Peso de la pasilla clasificada
        observaciones = null,
        id_estado_proceso = 3 // Por defecto 'Terminado'
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_clasificacion = fecha_clasificacion;
        this.peso_total = peso_total;
        this.peso_pergamino = peso_pergamino;
        this.peso_pasilla = peso_pasilla;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Clasificacion; 