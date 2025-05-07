class Recoleccion {
    constructor(id, id_lote, fecha_recoleccion, peso_inicial, tipo_recoleccion, tipo_cafe, observaciones) {
        this.id = id;
        this.id_lote = id_lote;
        this.fecha_recoleccion = fecha_recoleccion;
        this.peso_inicial = peso_inicial;
        this.tipo_recoleccion = tipo_recoleccion;
        this.tipo_cafe = tipo_cafe;
        this.observaciones = observaciones;
    }
}

module.exports = Recoleccion; 