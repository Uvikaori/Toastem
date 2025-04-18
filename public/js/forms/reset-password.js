document.addEventListener('DOMContentLoaded', function() {
    const formCorreo = document.getElementById('formCorreo');
    const formRespuesta = document.getElementById('formRespuesta');
    const preguntaLabel = document.getElementById('preguntaLabel');
    let correoVerificado = '';

    // Manejadores para mostrar/ocultar contraseña
    document.getElementById('togglePassword').addEventListener('click', function() {
        const input = document.getElementById('nuevaContraseña');
        togglePasswordVisibility(input, this);
    });

    document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
        const input = document.getElementById('confirmarContraseña');
        togglePasswordVisibility(input, this);
    });

    // Función para alternar la visibilidad de la contraseña
    function togglePasswordVisibility(input, button) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        button.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    }

    // Paso 1: Verificar correo
    formCorreo.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar errores previos
        limpiarErrores();

        const correo = document.getElementById('correo').value;
        
        try {
            const response = await fetch('/auth/recuperar-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo })
            });

            const data = await response.json();

            if (!response.ok) {
                mostrarError('correoError', data.errores.correo || data.errores.general);
                return;
            }

            // Guardar correo verificado y mostrar pregunta
            correoVerificado = correo;
            preguntaLabel.textContent = data.pregunta;
            
            // Ocultar primer formulario y mostrar segundo
            formCorreo.classList.add('d-none');
            formRespuesta.classList.remove('d-none');

        } catch (error) {
            console.error('Error:', error);
            mostrarError('correoError', 'Error al procesar la solicitud');
        }
    });

    // Paso 2: Verificar respuesta y cambiar contraseña
    formRespuesta.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar errores previos
        limpiarErrores();

        const respuesta = document.getElementById('respuesta').value;
        const nuevaContraseña = document.getElementById('nuevaContraseña').value;
        const confirmarContraseña = document.getElementById('confirmarContraseña').value;

        try {
            const response = await fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo: correoVerificado,
                    respuesta,
                    nuevaContraseña,
                    confirmarContraseña
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errores) {
                    Object.keys(data.errores).forEach(key => {
                        mostrarError(`${key}Error`, data.errores[key]);
                    });
                }
                return;
            }

            // Mostrar mensaje de éxito y redirigir
            alert('Contraseña actualizada exitosamente');
            window.location.href = '/auth/login';

        } catch (error) {
            console.error('Error:', error);
            mostrarError('generalError', 'Error al procesar la solicitud');
        }
    });

    // Funciones auxiliares
    function mostrarError(elementId, mensaje) {
        const elemento = document.getElementById(elementId);
        if (elemento) {
            elemento.textContent = mensaje;
            elemento.style.display = 'block';
        }
    }

    function limpiarErrores() {
        const errores = document.querySelectorAll('.invalid-feedback');
        errores.forEach(error => error.textContent = '');
    }
}); 