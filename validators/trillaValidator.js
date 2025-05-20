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

    body('peso_final')
        .notEmpty().withMessage('El peso final es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal.')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso final debe ser positivo.');
            }
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
                // Solo validar si la clasificación está terminada y tiene un peso_cafe_bueno
                if (clasificacionInfo && clasificacionInfo.peso_cafe_bueno !== null && clasificacionInfo.id_estado_proceso === 3) {
                    if (value > clasificacionInfo.peso_cafe_bueno) {
                        throw new Error(`El peso trillado (${value} kg) no puede ser mayor que el peso del café bueno de la clasificación (${clasificacionInfo.peso_cafe_bueno} kg).`);
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