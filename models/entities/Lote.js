class Lote {
    constructor(
        id = null,
        codigo = null, // Se generará antes de guardar
        id_usuario,
        id_finca,
        fecha_recoleccion,
        peso_inicial,
        tipo_cafe,       // Nuevo campo
        tipo_recoleccion,
        observaciones = null,
        id_estado_proceso = 2, // Estado general del lote: 2 ('En progreso')
        id_proceso_actual = 1, // Proceso actual del lote: 1 ('Recolección')
        fecha_registro = new Date(),
        id_destino_final = 1 // Asumiendo destino por defecto 'Proceso completo'
    ) {
        this.id = id;
        this.codigo = codigo;
        this.id_usuario = id_usuario;
        this.id_finca = id_finca;
        this.fecha_recoleccion = fecha_recoleccion;
        this.peso_inicial = peso_inicial;
        this.tipo_cafe = tipo_cafe;
        this.tipo_recoleccion = tipo_recoleccion;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso; // Estado general del lote
        this.id_proceso_actual = id_proceso_actual; // Etapa actual del flujo de procesos
        this.fecha_registro = fecha_registro;
        this.id_destino_final = id_destino_final;
    }
}

module.exports = Lote; 