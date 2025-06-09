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

  // Solo configurar el cierre automático de sesión si el usuario está logueado
  const usuario = document.querySelector('nav .dropdown-toggle'); // Verifica si hay dropdown de usuario
  if (usuario) {
    setupAutoLogout();
  }
});

// Función para configurar el cierre automático de sesión al cerrar la ventana
function setupAutoLogout() {
  // Variable para saber si el usuario está cerrando sesión manualmente
  let manualLogout = false;
  
  // Marcar como logout manual cuando hace clic en "Cerrar Sesión"
  const logoutLink = document.querySelector('a[href="/auth/logout"]');
  if (logoutLink) {
    logoutLink.addEventListener('click', function() {
      manualLogout = true;
    });
  }
  
  // Detectar cuando el usuario cierra la ventana o cambia de página
  window.addEventListener('beforeunload', function() {
    if (!manualLogout) {
      // Usar sendBeacon para mayor confiabilidad al cerrar la ventana
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/auth/logout-ajax', JSON.stringify({}));
      } else {
        // Fallback para navegadores que no soportan sendBeacon
        fetch('/auth/logout-ajax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}),
          keepalive: true
        }).catch(() => {
          // Ignorar errores ya que la ventana se está cerrando
        });
      }
    }
  });
  
  // También detectar cuando la página se oculta (cambio de tab, etc.)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden' && !manualLogout) {
      // Solo cerrar sesión si la página lleva oculta más de 30 segundos
      setTimeout(() => {
        if (document.visibilityState === 'hidden' && !manualLogout) {
          fetch('/auth/logout-ajax', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({}),
            keepalive: true
          }).catch(() => {
            // Ignorar errores
          });
        }
      }, 30000); // 30 segundos
    }
  });
} 