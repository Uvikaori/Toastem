class Tueste {
    constructor(
        id = null,
        id_lote,
        fecha_tueste,
        tipo_cafe, // enum('Pergamino', 'Pasilla')
        
        // Peso inicial total
        peso_inicial,
        
        // Campos de calidad y nivel
        tipo_calidad, // enum('Premium', 'Normal', 'Baja')
        nivel_tueste, // enum('Alto', 'Medio', 'Bajo')
        
        // Pesos de pergamino y pasilla
        peso_pergamino_inicial = null,
        peso_pergamino_final = null,
        peso_pasilla_inicial = null,
        peso_pasilla_final = null,
        
        // Peso final total (suma de pergamino y pasilla)
        peso_final,
        
        observaciones = null,
        id_estado_proceso = 3 // ID 3 para 'Terminado' para esta ETAPA
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_tueste = fecha_tueste;
        this.tipo_cafe = tipo_cafe;
        this.peso_inicial = peso_inicial;
        
        this.tipo_calidad = tipo_calidad;
        this.nivel_tueste = nivel_tueste;
        
        // Pesos
        this.peso_pergamino_inicial = peso_pergamino_inicial;
        this.peso_pergamino_final = peso_pergamino_final;
        this.peso_pasilla_inicial = peso_pasilla_inicial;
        this.peso_pasilla_final = peso_pasilla_final;
        
        this.peso_final = peso_final;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
    }
}

module.exports = Tueste; 