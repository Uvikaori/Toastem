class SeguimientoSecado {
    constructor(
        id = null,
        id_secado,
        fecha,
        temperatura = null, // Temperatura en grados Celsius
        humedad = null, // Humedad relativa en porcentaje
        observaciones = null
    ) {
        this.id = id;
        this.id_secado = id_secado;
        this.fecha = fecha;
        this.temperatura = temperatura;
        this.humedad = humedad;
        this.observaciones = observaciones;
    }
}

module.exports = SeguimientoSecado; 