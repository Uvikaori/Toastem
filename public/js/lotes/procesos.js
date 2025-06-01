/**
 * Funciones para gestionar los procesos de lotes de café
 */

document.addEventListener('DOMContentLoaded', function() {
    // Formatear fechas al estilo español (DD/MM/AAAA)
    formatearFechasEspanol();
    
    // Inicializar validaciones de peso
    inicializarValidacionesPeso();
    
    // Inicializar tooltips de Bootstrap si están disponibles
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }
    
    // Gestionar campos con asterisco para campos requeridos
    marcarCamposRequeridos();
    
    // Inicializar manejadores de eventos para cálculos de clasificación
    inicializarCalculosClasificacion();
});

/**
 * Aplica formato español a las fechas en el documento
 */
function formatearFechasEspanol() {
    // Agregar tooltip a los campos de fecha
    const camposFecha = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
    
    camposFecha.forEach(campo => {
        campo.classList.add('form-fecha-tooltip');
    });
    
    // Formatear fechas mostradas en la interfaz
    const elementosFecha = document.querySelectorAll('.fecha-formateada');
    elementosFecha.forEach(elemento => {
        const fechaOriginal = elemento.getAttribute('data-fecha');
        if (fechaOriginal) {
            const fecha = new Date(fechaOriginal);
            elemento.textContent = fecha.toLocaleDateString('es-ES');
        }
    });
}

/**
 * Inicializa validaciones de campos de peso
 */
function inicializarValidacionesPeso() {
    const camposPeso = document.querySelectorAll('input[type="number"][name*="peso"]');
    
    camposPeso.forEach(campo => {
        campo.addEventListener('input', function() {
            const valor = parseFloat(this.value);
            
            // Validar que el peso sea positivo
            if (valor < 0) {
                this.value = 0;
            }
            
            // Si hay un peso máximo definido, validar que no lo exceda
            const pesoMax = this.getAttribute('data-peso-max');
            if (pesoMax && valor > parseFloat(pesoMax)) {
                this.value = pesoMax;
                mostrarAlerta(`El peso no puede ser mayor que ${pesoMax} kg`, 'warning');
            }
        });
    });
}

/**
 * Marca los campos requeridos con asterisco
 */
function marcarCamposRequeridos() {
    const camposRequeridos = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    camposRequeridos.forEach(campo => {
        const label = document.querySelector(`label[for="${campo.id}"]`);
        if (label) {
            label.classList.add('required-field');
        }
    });
}

/**
 * Inicializa los cálculos para el formulario de clasificación
 */
function inicializarCalculosClasificacion() {
    const formClasificacion = document.querySelector('form[action*="clasificacion"]');
    
    if (formClasificacion) {
        const pesoPergamino = document.getElementById('peso_pergamino');
        const pesoPasilla = document.getElementById('peso_pasilla');
        const pesoTotal = document.getElementById('peso_total');
        
        // Verificar si los campos existen
        if (!pesoPergamino || !pesoPasilla || !pesoTotal) {
            return; // Salir si algún campo no existe
        }
        
        // Función para calcular el total
        const calcularTotal = () => {
            let totalCalculado = 0;
            
            // Calcular suma de pergamino y pasilla
            if (pesoPergamino && pesoPergamino.value) {
                totalCalculado += parseFloat(pesoPergamino.value) || 0;
            }
            
            if (pesoPasilla && pesoPasilla.value) {
                totalCalculado += parseFloat(pesoPasilla.value) || 0;
            }
            
            // Actualizar el peso total solo si se han ingresado valores en los otros campos
            if (totalCalculado > 0) {
                pesoTotal.value = totalCalculado.toFixed(2);
            }
        };
        
        // Asignar evento a los campos de peso
        if (pesoPergamino) {
            pesoPergamino.addEventListener('input', calcularTotal);
        }
        
        if (pesoPasilla) {
            pesoPasilla.addEventListener('input', calcularTotal);
        }
        
        // Si ya hay valores, calcular el total al cargar
        if ((pesoPergamino && pesoPergamino.value) || (pesoPasilla && pesoPasilla.value)) {
            calcularTotal();
        }
    }
}

/**
 * Muestra una alerta temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta (success, warning, danger, info)
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertaDiv.setAttribute('role', 'alert');
    
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar al inicio del contenedor principal
    const contenedor = document.querySelector('.container');
    if (contenedor) {
        contenedor.insertBefore(alertaDiv, contenedor.firstChild);
        
        // Eliminar automáticamente después de 5 segundos
        setTimeout(() => {
            alertaDiv.classList.remove('show');
            setTimeout(() => alertaDiv.remove(), 150);
        }, 5000);
    }
} 