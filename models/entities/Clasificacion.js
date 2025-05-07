class Clasificacion {
    constructor(
        id = null,
        id_lote,
        peso_inicial, // Peso ANTES de la clasificación (del proceso anterior, ej. secado.peso_final)
        fecha_clasificacion,
        proveedor_externo = false,
        nombre_proveedor = null,
        costo_servicio = null,
        peso_final_clasificado, // Peso DESPUÉS de la clasificación
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.peso_inicial = peso_inicial;
        this.fecha_clasificacion = fecha_clasificacion;
        this.proveedor_externo = proveedor_externo;
        this.nombre_proveedor = nombre_proveedor;
        this.costo_servicio = costo_servicio;
        this.peso_final_clasificado = peso_final_clasificado;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Clasificacion; 