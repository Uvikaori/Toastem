/**
 * Validaciones específicas para formularios de lotes
 */

export function validarPesoInicial(peso) {
    if (peso <= 0) {
        return 'El peso inicial debe ser mayor que 0';
    }
    if (peso > 10000) {
        return 'El peso inicial no puede ser mayor a 10,000 kg';
    }
    return null;
}

export function validarFechaRecoleccion(fecha) {
    const fechaActual = new Date();
    const fechaRecoleccion = new Date(fecha);
    
    if (fechaRecoleccion > fechaActual) {
        return 'La fecha de recolección no puede ser futura';
    }
    return null;
}

export function validarTipoCafe(tipo) {
    const tiposValidos = ['Rojo', 'Amarillo', 'Mezcla'];
    if (!tiposValidos.includes(tipo)) {
        return 'Tipo de café no válido';
    }
    return null;
}

export function validarTipoRecoleccion(tipo) {
    const tiposValidos = ['Selectiva', 'General'];
    if (!tiposValidos.includes(tipo)) {
        return 'Tipo de recolección no válido';
    }
    return null;
} 