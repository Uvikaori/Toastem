const { validarNombre, validarUbicacion } = require('../../utils/fincaValidations');

class Finca {
    constructor(id = null, idUsuario, nombre, ubicacion) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.ubicacion = ubicacion;
    }

    // Métodos de validación
    validar() {
        validarNombre(this.nombre);
        validarUbicacion(this.ubicacion);
    }
}

module.exports = Finca;