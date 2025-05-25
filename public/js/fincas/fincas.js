/**
 * Módulo principal para la gestión de fincas
 */

import { inicializarEventosFincaModal } from '../events/fincaModalEvents.js';

// Inicializar todos los eventos relacionados con fincas
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventosFincaModal();
}); 