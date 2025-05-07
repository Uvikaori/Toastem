const { validateFinca } = require('../../validators/fincaValidator');

class Finca {
    constructor(id = null, idUsuario, nombre, ubicacion, id_municipio_vereda) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.ubicacion = ubicacion;
        this.id_municipio_vereda = id_municipio_vereda;
    }

    // Métodos de validación
    validar() {
        validateFinca(this.nombre, this.ubicacion);
    }
}

module.exports = Finca;