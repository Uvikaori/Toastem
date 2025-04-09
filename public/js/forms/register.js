document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registerForm');
  const errorGeneral = document.getElementById('errorGeneral');
  const errorGeneralText = document.getElementById('errorGeneralText');
  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const contraseñaInput = document.getElementById('contraseña');
  const confirmarContraseñaInput = document.getElementById('confirmarContraseña');

  // Función para mostrar errores
  function mostrarError(mensaje) {
    errorGeneralText.textContent = mensaje;
    errorGeneral.hidden = false;
  }

  // Función para ocultar errores
  function ocultarErrores() {
    errorGeneral.hidden = true;
    document.querySelectorAll('.invalid-feedback').forEach(el => el.hidden = true);
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
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

  // Validar contraseñas coincidentes
  function validarContraseñas() {
    const contraseña = contraseñaInput.value;
    const confirmarContraseña = confirmarContraseñaInput.value;

    if (contraseña !== confirmarContraseña) {
      confirmarContraseñaInput.classList.add('is-invalid');
      document.getElementById('confirmarContraseñaError').hidden = false;
      return false;
    }
    return true;
  }

  // Manejar envío del formulario
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    ocultarErrores();

    // Validar contraseñas
    if (!validarContraseñas()) {
      return;
    }

    try {
      const formData = new FormData(form);
      const data = {};
      
      // Convertir FormData a objeto
      for (const [key, value] of formData.entries()) {
        data[key] = value;
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

      if (response.ok) {
        window.location.href = '/auth/login?success=true';
      } else {
        if (responseData.error) {
          mostrarError(responseData.error);
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