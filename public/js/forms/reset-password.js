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

    // Validar contraseña en tiempo real
    const nuevaContraseñaInput = document.getElementById('nuevaContraseña');
    const confirmarContraseñaInput = document.getElementById('confirmarContraseña');

    nuevaContraseñaInput.addEventListener('input', function() {
        const contraseña = this.value;
        const validacion = Validaciones.validarContraseña(contraseña);
        
        if (validacion.valido) {
            Validaciones.limpiarErrorCampo('nuevaContraseña');
            this.classList.add('is-valid');
        } else {
            Validaciones.mostrarErrorCampo('nuevaContraseña', validacion.mensaje);
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

    // Función para validar contraseñas coincidentes
    function validarContraseñas() {
        const contraseña = nuevaContraseñaInput.value;
        const confirmarContraseña = confirmarContraseñaInput.value;

        // Validar formato de contraseña
        const validacionContraseña = Validaciones.validarContraseña(contraseña);
        if (!validacionContraseña.valido) {
            Validaciones.mostrarErrorCampo('nuevaContraseña', validacionContraseña.mensaje);
            nuevaContraseñaInput.classList.remove('is-valid');
            return false;
        } else {
            Validaciones.limpiarErrorCampo('nuevaContraseña');
            nuevaContraseñaInput.classList.add('is-valid');
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
        const nuevaContraseña = nuevaContraseñaInput.value;
        const confirmarContraseña = confirmarContraseñaInput.value;

        // Validar contraseñas antes de enviar
        if (!validarContraseñas()) {
            return;
        }

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
            const inputElement = document.getElementById(elementId.replace('Error', ''));
            if (inputElement) {
                inputElement.classList.add('is-invalid');
                inputElement.classList.remove('is-valid');
            }
        }
    }

    function limpiarErrores() {
        const errores = document.querySelectorAll('.invalid-feedback');
        errores.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }

    // Validar email cuando el campo pierde el foco
    const correoInput = document.getElementById('correo');
    correoInput.addEventListener('blur', async function() {
        const email = this.value.trim();
        const validacion = Validaciones.validarEmail(email);

        if (validacion.valido) {
            Validaciones.limpiarErrorCampo('correo');
            this.classList.add('is-valid');
            this.classList.remove('is-invalid');
            // Si el correo es válido, intentar obtener la pregunta de seguridad
            try {
                const response = await fetch('/auth/verificar-correo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo: email })
                });
                const data = await response.json();
                if (response.ok) {
                    preguntaLabel.textContent = data.pregunta;
                    formCorreo.classList.add('d-none');
                    formRespuesta.classList.remove('d-none');
                    Validaciones.limpiarErrorCampo('correo'); 
                } else {
                    Validaciones.mostrarErrorCampo('correo', data.errores?.correo || 'Error al verificar el correo.');
                    formCorreo.classList.remove('d-none');
                    formRespuesta.classList.add('d-none');
                }
            } catch (error) {
                Validaciones.mostrarErrorCampo('correo', 'Error al conectar con el servidor.');
                formCorreo.classList.remove('d-none');
                formRespuesta.classList.add('d-none');
            }
        } else {
            Validaciones.mostrarErrorCampo('correo', validacion.mensaje);
            this.classList.remove('is-valid');
            formCorreo.classList.remove('d-none');
            formRespuesta.classList.add('d-none'); // Ocultar pregunta si el email no es válido
        }
    });

    // Validar respuesta de seguridad en tiempo real
    const respuestaInput = document.getElementById('respuesta');
    respuestaInput.addEventListener('input', function() {
        // ... existing code ...
    });
}); 