document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registerForm');
  const errorGeneral = document.getElementById('errorGeneral');
  const errorGeneralText = document.getElementById('errorGeneralText');
  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const contraseñaInput = document.getElementById('contraseña');
  const confirmarContraseñaInput = document.getElementById('confirmarContraseña');
  const successMessage = document.getElementById('successMessage');
  const successMessageText = document.getElementById('successMessageText');
  const loginLink = document.getElementById('loginLink');

  // Función para mostrar errores generales
  function mostrarError(mensaje) {
    errorGeneralText.textContent = mensaje;
    errorGeneral.hidden = false;
    successMessage.hidden = true;
  }

  // Función para ocultar errores generales
  function ocultarErrores() {
    errorGeneral.hidden = true;
    successMessage.hidden = true;
    // Limpiar todos los errores de campos
    document.querySelectorAll('.invalid-feedback').forEach(el => el.hidden = true);
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
  }

  // Función para mostrar mensaje de éxito
  function mostrarExito(mensaje) {
    successMessageText.textContent = mensaje;
    successMessage.hidden = false;
    errorGeneral.hidden = true;
  }

  // Función para mostrar errores de campos
  function mostrarErroresCampos(errores) {
    console.log('Mostrando errores:', errores);
    
    // Limpiar todos los errores primero
    document.querySelectorAll('.invalid-feedback').forEach(el => el.hidden = true);
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));

    // Mostrar los nuevos errores
    for (const campo in errores) {
      const errorElement = document.getElementById(`${campo}Error`);
      const inputElement = document.getElementById(campo);
      
      if (errorElement && inputElement) {
        errorElement.textContent = errores[campo];
        errorElement.hidden = false;
        inputElement.classList.add('is-invalid');
      } else {
        console.log(`No se encontró elemento de error para el campo: ${campo}`);
        console.log('ID buscado:', `${campo}Error`);
      }
    }
  }

  // Toggle para mostrar/ocultar contraseña
  togglePassword.addEventListener('click', function() {
    const tipo = contraseñaInput.type === 'password' ? 'text' : 'password';
    contraseñaInput.type = tipo;
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Toggle para mostrar/ocultar confirmación de contraseña
  toggleConfirmPassword.addEventListener('click', function() {
    const tipo = confirmarContraseñaInput.type === 'password' ? 'text' : 'password';
    confirmarContraseñaInput.type = tipo;
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Validar nombre y apellido en tiempo real
  nombreCompletoInput.addEventListener('input', function() {
    const nombre = this.value;
    const validacion = Validaciones.validarNombreCompleto(nombre);
    if (validacion.valido) {
      Validaciones.limpiarErrorCampo('nombre_completo');
      this.classList.add('is-valid');
      this.classList.remove('is-invalid');
    } else {
      Validaciones.mostrarErrorCampo('nombre_completo', validacion.mensaje);
      this.classList.remove('is-valid');
    }
  });

  // Validar email cuando el campo pierde el foco
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

  // Validar contraseña en tiempo real
  contraseñaInput.addEventListener('input', function() {
    const contraseña = this.value;
    const validacion = Validaciones.validarContraseña(contraseña);
    
    if (validacion.valido) {
      Validaciones.limpiarErrorCampo('contraseña');
      this.classList.add('is-valid');
    } else {
      Validaciones.mostrarErrorCampo('contraseña', validacion.mensaje);
      this.classList.remove('is-valid');
    }

    // Validar coincidencia de contraseñas si hay confirmación
    if (confirmarContraseñaInput.value) {
      validarContraseñas();
    }
  });

  // Validar confirmación de contraseña en tiempo real
  confirmarContraseñaInput.addEventListener('input', function() {
    validarContraseñas();
  });

  // Validar pregunta de seguridad en tiempo real
  preguntaSeguridadInput.addEventListener('change', function() {
    const validacion = Validaciones.validarPreguntaSeguridad(this.value);
    if (validacion.valido) {
      Validaciones.limpiarErrorCampo('pregunta_seguridad');
    } else {
      Validaciones.mostrarErrorCampo('pregunta_seguridad', validacion.mensaje);
    }
  });

  // Validar respuesta de seguridad
  const respuestaSeguridadInput = document.getElementById('respuesta_seguridad');
  respuestaSeguridadInput.addEventListener('blur', function() {
    const validacion = Validaciones.validarRespuestaSeguridad(this.value);
    if (validacion.valido) {
      Validaciones.limpiarErrorCampo('respuesta_seguridad');
    } else {
      Validaciones.mostrarErrorCampo('respuesta_seguridad', validacion.mensaje);
    }
  });

  // Validar contraseñas coincidentes
  function validarContraseñas() {
    const contraseña = contraseñaInput.value;
    const confirmarContraseña = confirmarContraseñaInput.value;

    // Validar formato de contraseña
    const validacionContraseña = Validaciones.validarContraseña(contraseña);
    if (!validacionContraseña.valido) {
      Validaciones.mostrarErrorCampo('contraseña', validacionContraseña.mensaje);
      contraseñaInput.classList.remove('is-valid');
      return false;
    } else {
      Validaciones.limpiarErrorCampo('contraseña');
      contraseñaInput.classList.add('is-valid');
    }

    // Validar campo vacío de confirmación
    if (!confirmarContraseña) {
      Validaciones.mostrarErrorCampo('confirmarContraseña', 'Debe confirmar la contraseña');
      confirmarContraseñaInput.classList.remove('is-valid');
      return false;
    }

    // Validar coincidencia de contraseñas
    if (contraseña !== confirmarContraseña) {
      Validaciones.mostrarErrorCampo('confirmarContraseña', 'Las contraseñas no coinciden');
      confirmarContraseñaInput.classList.remove('is-valid');
      return false;
    } else {
      Validaciones.limpiarErrorCampo('confirmarContraseña');
      confirmarContraseñaInput.classList.add('is-valid');
    }

    return true;
  }

  // Validar y capitalizar nombre
  const nombreInput = document.getElementById('nombre');
  nombreInput.addEventListener('blur', function() {
    const nombre = this.value.trim();
    const validacion = Validaciones.validarNombreCompleto(nombre);
    
    if (validacion.valido) {
      this.value = Validaciones.capitalizarPalabras(nombre);
      Validaciones.limpiarErrorCampo('nombre');
    } else {
      Validaciones.mostrarErrorCampo('nombre', validacion.mensaje);
    }
  });

  // Validar pregunta de seguridad
  const preguntaSeguridadInput = document.getElementById('pregunta_seguridad');
  preguntaSeguridadInput.addEventListener('change', function() {
    const validacion = Validaciones.validarPreguntaSeguridad(this.value);
    if (validacion.valido) {
      Validaciones.limpiarErrorCampo('pregunta_seguridad');
    } else {
      Validaciones.mostrarErrorCampo('pregunta_seguridad', validacion.mensaje);
    }
  });

  // Manejar envío del formulario
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    ocultarErrores();

    try {
      const formData = new FormData(form);
      const data = {};
      
      // Convertir FormData a objeto
      for (const [key, value] of formData.entries()) {
        data[key] = value.trim();
      }
      
      console.log('Enviando datos:', data);
      
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      console.log('Respuesta recibida:', responseData);

      if (response.ok && responseData.exito) {
        // Mostrar mensaje de éxito
        mostrarExito(responseData.mensaje);
        // Limpiar el formulario
        form.reset();
        // Ocultar todos los errores
        ocultarErrores();
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = '/auth/login?registro=exitoso';
        }, 2000);
      } else {
        if (responseData.errores) {
          if (responseData.errores.general) {
            mostrarError(responseData.errores.general);
          } else {
            mostrarErroresCampos(responseData.errores);
          }
        } else {
          mostrarError('Error al procesar el registro');
        }
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      mostrarError('Error al procesar la solicitud: ' + error.message);
    }
  });
});