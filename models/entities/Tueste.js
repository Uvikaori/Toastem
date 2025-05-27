class Tueste {
    constructor(
        id = null,
        id_lote,
        fecha_tueste,
        
        // Peso inicial total
        peso_inicial,
        
        // Para café pergamino
        peso_pergamino_inicial = null,
        tipo_calidad_pergamino = null, // enum('Premium', 'Normal')
        nivel_tueste_pergamino = null, // enum('Alto', 'Medio', 'Bajo')
        fecha_tueste_pergamino = null,
        peso_pergamino_final = null,
        
        // Para café pasilla
        peso_pasilla_inicial = null,
        tipo_calidad_pasilla = 'Baja', // Siempre será 'Baja'
        nivel_tueste_pasilla = 'Alto', // Siempre será 'Alto'
        fecha_tueste_pasilla = null,
        peso_pasilla_final = null,
        
        // Peso final total (suma de pergamino y pasilla)
        peso_final,
        
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_tueste = fecha_tueste;
        this.peso_inicial = peso_inicial;
        
        // Campos para pergamino
        this.peso_pergamino_inicial = peso_pergamino_inicial;
        this.tipo_calidad_pergamino = tipo_calidad_pergamino;
        this.nivel_tueste_pergamino = nivel_tueste_pergamino;
        this.fecha_tueste_pergamino = fecha_tueste_pergamino;
        this.peso_pergamino_final = peso_pergamino_final;
        
        // Campos para pasilla
        this.peso_pasilla_inicial = peso_pasilla_inicial;
        this.tipo_calidad_pasilla = tipo_calidad_pasilla;
        this.nivel_tueste_pasilla = nivel_tueste_pasilla;
        this.fecha_tueste_pasilla = fecha_tueste_pasilla;
        this.peso_pasilla_final = peso_pasilla_final;
        
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Tueste; 