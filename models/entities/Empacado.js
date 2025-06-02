/**
 * Clase que representa un proceso de Empacado en el sistema
 */
class Empacado {
    /**
     * Constructor de la clase Empacado
     * @param {number|null} id - ID del registro (null para nuevos registros)
     * @param {number} id_lote - ID del lote al que pertenece
     * @param {string} fecha_empacado - Fecha en que se realizó el empacado
     * @param {number} peso_inicial - Peso del café antes de empacar
     * @param {number} peso_empacado - Peso final después del empacado
     * @param {number} total_empaques - Número total de empaques/unidades generados
     * @param {string} tipo_producto_empacado - Tipo de producto empacado (Grano, Molido, Pasilla Molido)
     * @param {string|null} observaciones - Observaciones adicionales
     * @param {number} id_estado_proceso - ID del estado del proceso (1=Reiniciado, 2=En progreso, 3=Terminado)
     * @param {number|null} id_tueste - ID del tueste relacionado (opcional)
     * @param {number|null} id_molienda - ID de la molienda relacionada (opcional)
     */
    constructor(
        id,
        id_lote,
        fecha_empacado,
        peso_inicial,
        peso_empacado,
        total_empaques,
        tipo_producto_empacado,
        observaciones,
        id_estado_proceso,
        id_tueste = null,
        id_molienda = null
    ) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_empacado = fecha_empacado;
        this.peso_inicial = peso_inicial;
        this.peso_empacado = peso_empacado;
        this.total_empaques = total_empaques;
        this.tipo_producto_empacado = tipo_producto_empacado;
        this.observaciones = observaciones;
        this.id_estado_proceso = id_estado_proceso;
        this.id_tueste = id_tueste;
        this.id_molienda = id_molienda;
    }
}

module.exports = Empacado; 