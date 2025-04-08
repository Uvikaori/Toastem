// Funciones auxiliares para manejo de errores
const showError = (elementId, message) => {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.hidden = false;
  element.parentElement.classList.add('was-validated');
};

const hideErrors = () => {
  const errorElements = document.querySelectorAll('.invalid-feedback');
  errorElements.forEach(element => {
    element.hidden = true;
    element.parentElement.classList.remove('was-validated');
  });
  const errorGeneral = document.getElementById('errorGeneral');
  if (errorGeneral) {
    errorGeneral.hidden = true;
  }
};

// Configuración de visibilidad de contraseña
const setupPasswordToggle = (buttonId, inputId) => {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (button && input) {
    button.addEventListener('click', () => {
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      button.querySelector('i').classList.toggle('fa-eye');
      button.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }
};

// Manejador de eventos para el formulario de login
const setupLoginForm = () => {
  const form = document.getElementById('loginForm');
  const errorGeneral = document.getElementById('errorGeneral');
  const errorGeneralText = document.getElementById('errorGeneralText');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideErrors();

      const formData = new FormData(form);
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = '/dashboard';
        } else {
          if (data.errors) {
            if (data.errors.email) showError('emailError', data.errors.email);
            if (data.errors.password) showError('passwordError', data.errors.password);
            if (data.errors.general) {
              errorGeneralText.textContent = data.errors.general;
              errorGeneral.hidden = false;
            }
          }
        }
      } catch (error) {
        errorGeneralText.textContent = 'Error al conectar con el servidor';
        errorGeneral.hidden = false;
      }
    });
  }
};

// Manejador de eventos para el formulario de registro
const setupRegisterForm = () => {
  const form = document.getElementById('registerForm');
  const errorGeneral = document.getElementById('errorGeneral');
  const errorGeneralText = document.getElementById('errorGeneralText');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideErrors();

      const formData = new FormData(form);
      try {
        const response = await fetch('/auth/register', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = '/auth/login?registered=true';
        } else {
          if (data.errors) {
            Object.keys(data.errors).forEach(key => {
              showError(`${key}Error`, data.errors[key]);
            });
            if (data.errors.general) {
              errorGeneralText.textContent = data.errors.general;
              errorGeneral.hidden = false;
            }
          }
        }
      } catch (error) {
        errorGeneralText.textContent = 'Error al conectar con el servidor';
        errorGeneral.hidden = false;
      }
    });
  }
};

// Inicialización de eventos
document.addEventListener('DOMContentLoaded', () => {
  // Configurar toggles de contraseña
  setupPasswordToggle('togglePassword', 'password');
  setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

  // Configurar formularios según la página
  if (document.getElementById('loginForm')) {
    setupLoginForm();
  }
  if (document.getElementById('registerForm')) {
    setupRegisterForm();
  }
}); 