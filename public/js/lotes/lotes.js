/**
 * Funciones para gestionar los lotes de café
 */

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar tooltips para el ícono de información
    inicializarTooltips();
    
    // Inicializar validación de formularios
    inicializarValidacionFormularios();
});

/**
 * Inicializa los tooltips de Bootstrap
 */
function inicializarTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Inicializa la validación de formularios de Bootstrap
 */
function inicializarValidacionFormularios() {
    var forms = document.querySelectorAll('.needs-validation');
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