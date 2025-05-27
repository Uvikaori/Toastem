class Trilla {
    constructor(
        id = null,
        id_lote,
        fecha_trilla,
        peso_pergamino_inicial,
        peso_pasilla_inicial,
        peso_pergamino_final,
        peso_pasilla_final,
        peso_final, // Peso DESPUÉS de la trilla
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_trilla = fecha_trilla;
        this.peso_pergamino_inicial = peso_pergamino_inicial;
        this.peso_pasilla_inicial = peso_pasilla_inicial;
        this.peso_pergamino_final = peso_pergamino_final;
        this.peso_pasilla_final = peso_pasilla_final;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Trilla; 