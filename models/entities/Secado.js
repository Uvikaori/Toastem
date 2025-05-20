class Secado {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso ANTES del secado (viene de zarandeo.peso_final)
        fecha_inicio,
        metodo_secado, // 'Secado al sol', 'Secado mecánico', 'Secado por vía húmeda (con cereza)'
        humedad_inicial = null,
        fecha_fin = null,
        peso_final = null,
        observaciones = null,
        // decision_venta y fecha_decision se manejarán por separado si es necesario una actualización posterior.
        id_estado_proceso = 2 // ID 2 para 'En progreso' al iniciar, ya que secado toma tiempo.
                          // Se podría cambiar a 3 ('Terminado') cuando se registre fecha_fin y peso_final.
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_inicio = fecha_inicio;
        this.metodo_secado = metodo_secado;
        this.humedad_inicial = humedad_inicial;
        this.fecha_fin = fecha_fin;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Secado; 