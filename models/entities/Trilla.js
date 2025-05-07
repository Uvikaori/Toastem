class Trilla {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso ANTES de la trilla (del proceso anterior, ej. clasificacion_atributos.peso_final_clasificado)
        fecha_trilla,
        proveedor_externo = false,
        nombre_proveedor = null,
        costo_servicio = null,
        peso_final_trillado, // Peso DESPUÉS de la trilla
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_trilla = fecha_trilla;
        this.proveedor_externo = proveedor_externo;
        this.nombre_proveedor = nombre_proveedor;
        this.costo_servicio = costo_servicio;
        this.peso_final_trillado = peso_final_trillado;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Trilla; 