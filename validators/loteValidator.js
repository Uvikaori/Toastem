const { body } = require('express-validator');

const validateLote = [
    body('fecha_recoleccion')
        .notEmpty().withMessage('La fecha de recolección es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate(),

    body('peso_inicial')
        .notEmpty().withMessage('El peso inicial es obligatorio.')
        .isNumeric().withMessage('El peso inicial debe ser un número.')
        .toFloat()
        .custom(value => {
            if (value <= 0) {
                throw new Error('El peso inicial debe ser mayor que cero.');
            }
            return true;
        }),

    body('tipo_cafe')
        .notEmpty().withMessage('El tipo de café es obligatorio.')
        .isIn(['Rojo', 'Amarillo', 'Mezcla']).withMessage('Tipo de café inválido.'),

    body('tipo_recoleccion')
        .notEmpty().withMessage('El tipo de recolección es obligatorio.')
        .isIn(['Selectiva', 'General']).withMessage('Tipo de recolección inválido.'),

    body('observaciones')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
    
    
];

module.exports = { validateLote }; 