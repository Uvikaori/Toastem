/**
 * Validaciones comunes para formularios
 */

export function inicializarValidacionFormularios() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

export function validarCampoRequerido(valor, nombreCampo) {
    if (!valor || valor.trim() === '') {
        return `El campo ${nombreCampo} es requerido`;
    }
    return null;
}

export function validarLongitudMinima(valor, longitud, nombreCampo) {
    if (valor.length < longitud) {
        return `El campo ${nombreCampo} debe tener al menos ${longitud} caracteres`;
    }
    return null;
}

export function validarLongitudMaxima(valor, longitud, nombreCampo) {
    if (valor.length > longitud) {
        return `El campo ${nombreCampo} no puede tener más de ${longitud} caracteres`;
    }
    return null;
}

export function validarFormatoEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
        return 'El formato del correo electrónico no es válido';
    }
    return null;
} 