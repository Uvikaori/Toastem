const { body } = require('express-validator');
const clasificacionDAO = require('../models/dao/clasificacionDAO');

const validateTrilla = [
    body('fecha_trilla')
        .notEmpty().withMessage('La fecha de trilla es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de trilla sea posterior a la fecha de clasificación
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
                if (clasificacionInfo && clasificacionInfo.fecha_clasificacion) {
                    const fechaClasificacion = new Date(clasificacionInfo.fecha_clasificacion);
                    if (new Date(value) < fechaClasificacion) {
                        throw new Error(`La fecha de trilla debe ser posterior a la fecha de clasificación (${fechaClasificacion.toLocaleString()}).`);
                    }
                }
            }
            return true;
        }),

    body('peso_pergamino_final')
        .notEmpty().withMessage('El peso final del pergamino es obligatorio.')
        .isFloat({ min: 0 }).withMessage('El peso del pergamino debe ser un número positivo.')
        .toFloat(),

    body('peso_pasilla_final')
        .notEmpty().withMessage('El peso final de la pasilla es obligatorio.')
        .isFloat({ min: 0 }).withMessage('El peso de la pasilla debe ser un número positivo.')
        .toFloat(),

    // Validación personalizada para verificar que la suma de pesos finales no exceda el peso inicial
    body().custom(async (value, { req }) => {
        const pergaminoFinal = parseFloat(req.body.peso_pergamino_final) || 0;
        const pasillaFinal = parseFloat(req.body.peso_pasilla_final) || 0;
        
        // Verificar que los valores son números válidos
        if (isNaN(pergaminoFinal) || isNaN(pasillaFinal)) {
            throw new Error('Los pesos deben ser números válidos.');
        }
        
        const id_lote = parseInt(req.params.id_lote);
        if (id_lote && !isNaN(id_lote)) {
            const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            
            if (clasificacionInfo) {
                // Verificar que los pesos finales no exceden los iniciales con una tolerancia del 1%
                const pergaminoInicial = parseFloat(clasificacionInfo.peso_pergamino) || 0;
                const pasillaInicial = parseFloat(clasificacionInfo.peso_pasilla) || 0;
                const tolerancia = 0.01; // 1%
                
                if (pergaminoFinal > pergaminoInicial * (1 + tolerancia)) {
                    throw new Error(`El peso final del pergamino (${pergaminoFinal} kg) no puede ser mayor que el peso inicial (${pergaminoInicial} kg) más una tolerancia del 1%.`);
                }
                
                if (pasillaFinal > pasillaInicial * (1 + tolerancia)) {
                    throw new Error(`El peso final de la pasilla (${pasillaFinal} kg) no puede ser mayor que el peso inicial (${pasillaInicial} kg) más una tolerancia del 1%.`);
                }
            }
        }
        
        return true;
    }),

    body('observaciones')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateTrilla }; 