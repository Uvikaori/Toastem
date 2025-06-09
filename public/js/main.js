// Scripts personalizados para Toastem

// Función para inicializar todos los tooltips de Bootstrap
function initTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Función para inicializar todos los popovers de Bootstrap
function initPopovers() {
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
  });
}

// Función para agregar validaciones a los formularios
function setupFormValidation() {
  const forms = document.querySelectorAll('.needs-validation');
  
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      form.classList.add('was-validated');
    }, false);
  });
}

// Agregar funcionalidad de confirmar acción
function setupConfirmActions() {
  const confirmButtons = document.querySelectorAll('[data-confirm]');
  
  Array.from(confirmButtons).forEach(button => {
    button.addEventListener('click', event => {
      const message = button.getAttribute('data-confirm') || '¿Está seguro de realizar esta acción?';
      
      if (!confirm(message)) {
        event.preventDefault();
      }
    });
  });
}

// Inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar componentes de Bootstrap
  initTooltips();
  initPopovers();
  
  // Configurar validaciones
  setupFormValidation();
  
  // Configurar confirmaciones
  setupConfirmActions();
  
  // Auto-cerrar alerts después de 5 segundos
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
}); 