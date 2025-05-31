document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('loginForm');
  const errorGeneral = document.getElementById('errorGeneralClient');
  const errorGeneralText = document.getElementById('errorGeneralClientText');
  const registroExitoso = document.getElementById('registroExitosoClient');
  const registroExitosoText = document.getElementById('registroExitosoClientText');
  const togglePassword = document.getElementById('togglePassword');
  const contraseñaInput = document.getElementById('contraseña');
  const correoInput = document.getElementById('correo');

  // Verificar si viene de un registro exitoso
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registro') === 'exitoso') {
    registroExitoso.classList.remove('d-none');
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      registroExitoso.classList.add('d-none');
    }, 5000);
  }

  // Función para mostrar errores generales
  function mostrarError(mensaje) {
    if (errorGeneralText && errorGeneral) {
      errorGeneralText.textContent = mensaje;
      errorGeneral.classList.remove('d-none');
      if (registroExitoso) registroExitoso.classList.add('d-none');
    }
  }

  // Función para ocultar errores generales
  function ocultarErrores() {
    if (errorGeneral) errorGeneral.classList.add('d-none');
    document.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    document.querySelectorAll('.form-control').forEach(el => {
      el.classList.remove('is-invalid');
      el.classList.remove('is-valid');
    });
  }

  // Función para mostrar errores de campos
  function mostrarErroresCampos(errores) {
    // Limpiar todos los errores primero
    ocultarErrores();

    // Mostrar los nuevos errores
    for (const campo in errores) {
      const errorElement = document.getElementById(`${campo}Error`);
      const inputElement = document.getElementById(campo);
      
      if (errorElement && inputElement) {
        errorElement.textContent = errores[campo];
        errorElement.style.display = 'block';
        inputElement.classList.add('is-invalid');
      }
    }
  }

  // Toggle para mostrar/ocultar contraseña
  if (togglePassword && contraseñaInput) {
    togglePassword.addEventListener('click', function() {
      const tipo = contraseñaInput.type === 'password' ? 'text' : 'password';
      contraseñaInput.type = tipo;
      this.querySelector('i').classList.toggle('fa-eye');
      this.querySelector('i').classList.toggle('fa-eye-slash');
    });
  }

  // Validar email cuando el campo pierde el foco
  if (correoInput) {
    correoInput.addEventListener('blur', function() {
      const email = this.value.trim();
      const validacion = Validaciones.validarEmail(email);
      
      if (validacion.valido) {
        Validaciones.limpiarErrorCampo('correo');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
      } else {
        Validaciones.mostrarErrorCampo('correo', validacion.mensaje);
        this.classList.remove('is-valid');
      }
    });
  }

  // Validar contraseña en tiempo real
  if (contraseñaInput) {
    contraseñaInput.addEventListener('input', function() {
      const contraseña = this.value;
      const validacion = Validaciones.validarContraseña(contraseña);
      
      if (validacion.valido) {
        Validaciones.limpiarErrorCampo('contraseña');
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');
      } else {
        Validaciones.mostrarErrorCampo('contraseña', validacion.mensaje);
        this.classList.remove('is-valid');
      }
    });
  }

  // Manejar envío del formulario
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Limpiar errores previos
      ocultarErrores();
      
      const formData = {
        correo: correoInput.value.trim(),
        contraseña: contraseñaInput.value
      };
  
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
  
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Redirigir al usuario
          window.location.href = data.redirect || '/fincas/gestionar';
        } else {
          // Mostrar errores
          if (data.errores) {
            mostrarErroresCampos(data.errores);
          } else {
            mostrarError('Error al procesar la solicitud');
          }
        }
      } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al procesar la solicitud');
      }
    });
  }
}); 