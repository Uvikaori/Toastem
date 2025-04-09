document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('loginForm');
  const errorGeneral = document.getElementById('errorGeneral');
  const errorGeneralText = document.getElementById('errorGeneralText');
  const togglePassword = document.getElementById('togglePassword');
  const contraseñaInput = document.getElementById('contraseña');

  // Función para mostrar errores
  function mostrarError(mensaje) {
    errorGeneralText.textContent = mensaje;
    errorGeneral.hidden = false;
  }

  // Función para ocultar errores
  function ocultarErrores() {
    errorGeneral.hidden = true;
  }

  // Toggle para mostrar/ocultar contraseña
  togglePassword.addEventListener('click', function() {
    const tipo = contraseñaInput.type === 'password' ? 'text' : 'password';
    contraseñaInput.type = tipo;
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
  });

  // Manejar envío del formulario
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    ocultarErrores();

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/dashboard';
      } else {
        mostrarError(data.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      mostrarError('Error al procesar la solicitud');
    }
  });
}); 