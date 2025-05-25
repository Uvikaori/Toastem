/**
 * Manejadores de eventos específicos para lotes
 */

import { validarPesoInicial, validarFechaRecoleccion, validarTipoCafe, validarTipoRecoleccion } from '../forms/validations.js';

export function inicializarEventosLotes() {
    // Evento para validar peso inicial en tiempo real
    const pesoInput = document.getElementById('peso_inicial');
    if (pesoInput) {
        pesoInput.addEventListener('input', function() {
            const error = validarPesoInicial(this.value);
            if (error) {
                this.setCustomValidity(error);
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Evento para validar fecha de recolección
    const fechaInput = document.getElementById('fecha_recoleccion');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            const error = validarFechaRecoleccion(this.value);
            if (error) {
                this.setCustomValidity(error);
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Evento para validar tipo de café
    const tipoCafeSelect = document.getElementById('tipo_cafe');
    if (tipoCafeSelect) {
        tipoCafeSelect.addEventListener('change', function() {
            const error = validarTipoCafe(this.value);
            if (error) {
                this.setCustomValidity(error);
            } else {
                this.setCustomValidity('');
            }
        });
    }

    // Evento para validar tipo de recolección
    const tipoRecoleccionSelect = document.getElementById('tipo_recoleccion');
    if (tipoRecoleccionSelect) {
        tipoRecoleccionSelect.addEventListener('change', function() {
            const error = validarTipoRecoleccion(this.value);
            if (error) {
                this.setCustomValidity(error);
            } else {
                this.setCustomValidity('');
            }
        });
    }
} 