/**
 * Manejador de eventos para el modal de fincas
 */

export function inicializarEventosFincaModal() {
    const fincaForm = document.getElementById('fincaForm');
    if (!fincaForm) return;

    fincaForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const form = event.target;
        const action = form.dataset.action;
        const id = document.getElementById('fincaId').value;
        const nombre = document.getElementById('nombre').value;
        const ubicacion = document.getElementById('ubicacion').value;

        try {
            const response = await fetch(`/fincas/${action === 'editar' ? id : 'crear'}`, {
                method: action === 'editar' ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, ubicacion })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                location.reload();
            } else {
                alert(result.message || 'Error al guardar la finca');
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            alert('Error al enviar el formulario');
        }
    });
} 