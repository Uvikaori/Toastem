class Despulpado {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso del lote ANTES del despulpado (viene del lote.peso_inicial o anterior proceso)
        fecha_remojo,
        fecha_despulpado,
        peso_final,   // Peso DESPUÉS del despulpado
        // Se elimina peso_despues ya que parece redundante con peso_final para esta tabla.
        // Si se refiere a la merma, se puede calcular.
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' en la tabla 'estados_proceso' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_remojo = fecha_remojo;
        this.fecha_despulpado = fecha_despulpado;
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Despulpado; 