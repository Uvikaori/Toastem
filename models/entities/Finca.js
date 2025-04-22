class Finca {
    constructor(id = null, idUsuario, nombre, ubicacion) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.ubicacion = ubicacion;
    }

    // Métodos de validación
    validar() {
        if (!this.nombre || this.nombre.trim() === '') {
            throw new Error('El nombre de la finca es obligatorio');
        }
        if (this.nombre.length > 100) {
            throw new Error('El nombre de la finca no puede exceder los 100 caracteres');
        }
        if (this.ubicacion && this.ubicacion.length > 255) {
            throw new Error('La ubicación no puede exceder los 255 caracteres');
        }
    }
}

module.exports = Finca; 