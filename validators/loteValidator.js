const { body } = require('express-validator');

const validateLote = [
    body('fecha_recoleccion')
        .notEmpty().withMessage('La fecha de recolección es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate(),

    body('peso_inicial')
        .notEmpty().withMessage('El peso inicial es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso inicial debe ser un número decimal (ej: 100.50).')
        .toFloat(),

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
    
    // No validamos id_finca aquí porque vendrá de la URL
    // No validamos id_usuario porque vendrá de la sesión
    // No validamos codigo porque se generará automáticamente
    // No validamos id_estado_proceso porque se asignará por defecto
];

module.exports = { validateLote }; 