class Trilla {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso ANTES de la trilla (del proceso anterior, clasificacion.peso_cafe_bueno)
        fecha_trilla,
        peso_final, // Peso DESPUÉS de la trilla
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_trilla = fecha_trilla;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Trilla; 