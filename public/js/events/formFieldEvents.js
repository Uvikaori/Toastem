document.addEventListener('DOMContentLoaded', () => {
    // Asegurarse que Validaciones esté cargado (contiene capitalizarPalabras)
    if (typeof Validaciones === 'undefined') {
        console.error('El script validations.js debe cargarse antes de formFieldEvents.js');
        return;
    }

    /**
     * Aplica capitalización en tiempo real a un elemento input.
     * @param {HTMLInputElement} inputElement - El elemento input.
     */
    function applyRealtimeCapitalization(inputElement) {
        if (inputElement) {
            inputElement.addEventListener('input', (event) => {
                const textoOriginal = event.target.value;
                const textoCapitalizado = Validaciones.capitalizarPalabras(textoOriginal);

                if (textoOriginal !== textoCapitalizado) {
                    const start = event.target.selectionStart;
                    const end = event.target.selectionEnd;
                    event.target.value = textoCapitalizado;
                    // Restaurar la posición del cursor
                    event.target.setSelectionRange(start, end);
                }
            });
        }
    }

    // Aplicar a campos específicos por ID
    const nombreUserInput = document.getElementById('nombre'); // Para registro de usuario
    const nombreFincaInput = document.getElementById('nombre'); // Para crear/editar finca (mismo ID puede ser problemático si no están en páginas diferentes)
    const ubicacionInput = document.getElementById('ubicacion'); // Para crear/editar finca

    // Llama a la función para los campos que existan en la página actual
    applyRealtimeCapitalization(nombreUserInput); 
    // Si 'nombre' se usa en ambas páginas, esto funciona, pero sería mejor diferenciarlos si fuera necesario.
    // applyRealtimeCapitalization(nombreFincaInput); // Comentado porque nombreUserInput ya lo cubre si el ID es el mismo.
    applyRealtimeCapitalization(ubicacionInput);

}); 