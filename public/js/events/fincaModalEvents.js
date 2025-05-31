/**
 * Manejador de eventos para el modal de fincas
 */

export function inicializarEventosFincaModal() {
    const fincaForm = document.getElementById('fincaForm');
    if (!fincaForm) return;

    // Configurar los botones de edición
    const editButtons = document.querySelectorAll('.edit-finca-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;
            const ubicacion = this.dataset.ubicacion || '';
            
            document.getElementById('fincaId').value = id;
            document.getElementById('nombre').value = nombre;
            document.getElementById('ubicacion').value = ubicacion;
            fincaForm.dataset.action = 'editar';
            
            // Actualizar título del modal
            const modal = document.querySelector('#fincaModal .modal-title');
            if (modal) modal.textContent = 'Editar Finca';
        });
    });

    // Resetear el formulario cuando se cierra el modal
    const fincaModal = document.getElementById('fincaModal');
    if (fincaModal) {
        fincaModal.addEventListener('hidden.bs.modal', function() {
            fincaForm.reset();
            fincaForm.dataset.action = 'crear';
            // Restablecer título
            const modal = document.querySelector('#fincaModal .modal-title');
            if (modal) modal.textContent = 'Gestionar Finca';
            
            // Limpiar mensajes de error
            const feedbacks = fincaForm.querySelectorAll('.invalid-feedback');
            feedbacks.forEach(fb => fb.textContent = '');
            
            const inputs = fincaForm.querySelectorAll('.form-control');
            inputs.forEach(input => {
                input.classList.remove('is-invalid');
                input.classList.remove('is-valid');
            });
        });
    }

    fincaForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Limpiar errores previos
        const feedbacks = fincaForm.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(fb => fb.textContent = '');
            
        const inputs = fincaForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
        });

        const form = event.target;
        const action = form.dataset.action;
        const id = document.getElementById('fincaId').value;
        const nombre = document.getElementById('nombre').value;
        const ubicacion = document.getElementById('ubicacion').value;

        // Validación básica en el cliente
        let hasErrors = false;
        if (!nombre.trim()) {
            const feedback = document.querySelector('#nombre + .invalid-feedback');
            if (feedback) {
                feedback.textContent = 'El nombre de la finca es obligatorio';
                document.getElementById('nombre').classList.add('is-invalid');
                hasErrors = true;
            }
        }

        if (hasErrors) return;

        try {
            const response = await fetch(`/fincas/${action === 'editar' ? id : 'crear'}`, {
                method: action === 'editar' ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, ubicacion })
            });

            const result = await response.json();

            if (result.success) {
                // Cerrar modal y recargar página
                const modal = bootstrap.Modal.getInstance(document.getElementById('fincaModal'));
                if (modal) modal.hide();
                
                // Recargar para mostrar flash message
                window.location.href = '/fincas/gestionar';
            } else {
                // Mostrar errores
                if (result.errors && Array.isArray(result.errors)) {
                    result.errors.forEach(err => {
                        const field = err.param;
                        const message = err.msg;
                        const feedback = document.querySelector(`#${field} + .invalid-feedback`);
                        if (feedback) {
                            feedback.textContent = message;
                            document.getElementById(field).classList.add('is-invalid');
                        }
                    });
                } else {
                    alert(result.message || 'Error al guardar la finca');
                }
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            alert('Error de conexión al enviar el formulario');
        }
    });
} 