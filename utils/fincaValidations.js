// Función para validar el nombre de la finca
function validarNombre(nombre) {
    if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre de la finca es obligatorio');
    }
    if (nombre.length > 100) {
        throw new Error('El nombre de la finca no puede exceder los 100 caracteres');
    }
}

// Función para validar la ubicación de la finca
function validarUbicacion(ubicacion) {
    if (ubicacion && ubicacion.length > 255) {
        throw new Error('La ubicación no puede exceder los 255 caracteres');
    }
}

module.exports = {
    validarNombre,
    validarUbicacion
};