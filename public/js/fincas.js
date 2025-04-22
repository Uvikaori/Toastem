document.addEventListener('DOMContentLoaded', function() {
    // Validación en tiempo real
    const nombreInput = document.getElementById('nombre');
    const ubicacionInput = document.getElementById('ubicacion');
    const searchInput = document.getElementById('searchInput');

    nombreInput.addEventListener('input', validateNombre);
    
    function validateNombre() {
        const nombre = nombreInput.value.trim();
        const feedback = nombreInput.nextElementSibling;
        
        if (nombre === '') {
            setInvalid(nombreInput, 'El nombre es obligatorio');
            return false;
        } else if (nombre.length > 100) {
            setInvalid(nombreInput, 'El nombre no puede exceder los 100 caracteres');
            return false;
        }
        
        setValid(nombreInput);
        return true;
    }

    // Búsqueda en tiempo real
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = document.querySelectorAll('.finca-card');
        
        cards.forEach(card => {
            const nombre = card.querySelector('.card-title').textContent.toLowerCase();
            const ubicacion = card.querySelector('.card-text').textContent.toLowerCase();
            
            if (nombre.includes(searchTerm) || ubicacion.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Manejo del formulario de creación/edición
    const fincaForm = document.getElementById('fincaForm');
    const fincaModal = document.getElementById('fincaModal');
    const modal = new bootstrap.Modal(fincaModal);

    fincaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateNombre()) return;

        const formData = new FormData(this);
        const fincaId = this.dataset.fincaId;
        const url = fincaId ? `/fincas/${fincaId}` : '/fincas';
        const method = fincaId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Error al procesar la solicitud');
            }

            if (data.success) {
                modal.hide();
                window.location.reload();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError(error.message);
        }
    });

    // Manejo de eliminación
    document.querySelectorAll('.delete-finca').forEach(button => {
        button.addEventListener('click', async function() {
            if (!confirm('¿Está seguro de eliminar esta finca?')) return;

            const fincaId = this.dataset.id;
            try {
                const response = await fetch(`/fincas/${fincaId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al eliminar la finca');
                }

                if (data.success) {
                    window.location.reload();
                } else {
                    showError(data.message);
                }
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // Funciones auxiliares
    function setInvalid(input, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = message;
    }

    function setValid(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').insertAdjacentElement('afterbegin', errorDiv);
    }
}); 