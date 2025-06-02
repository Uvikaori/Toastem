const { body } = require('express-validator');

const validateVentaPergamino = [
    body('fecha_venta')
        .notEmpty().withMessage('La fecha de venta es obligatoria.')
        .isISO8601().withMessage('El formato de la fecha de venta no es válido.')
        .toDate(),

    body('cantidad')
        .notEmpty().withMessage('La cantidad vendida es obligatoria.')
        .isFloat({ gt: 0 }).withMessage('La cantidad debe ser un número positivo.')
        .toFloat(),

    body('precio_kg')
        .notEmpty().withMessage('El precio por kg es obligatorio.')
        .isFloat({ gt: 0 }).withMessage('El precio por kg debe ser un número positivo.')
        .toFloat(),

    body('comprador')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('El nombre del comprador no puede exceder los 100 caracteres.')
        .escape(),

    body('observaciones')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

const validateVentaEmpacado = [
    body('fecha_venta')
        .notEmpty().withMessage('La fecha de venta es obligatoria.')
        .isISO8601().withMessage('El formato de la fecha de venta no es válido.')
        .toDate(),

    // Validar que al menos un producto está siendo vendido
    body(['vender_grano', 'vender_molido', 'vender_pasilla'])
        .custom((value, { req }) => {
            if (!req.body.vender_grano && !req.body.vender_molido && !req.body.vender_pasilla) {
                throw new Error('Debe seleccionar al menos un producto para vender.');
            }
            return true;
        }),

    // Validar cantidad y precio para cada tipo de producto si está seleccionado
    body('cantidad_vender_grano')
        .if(body('vender_grano').equals('on'))
        .notEmpty().withMessage('La cantidad de café en grano es obligatoria.')
        .isFloat({ gt: 0 }).withMessage('La cantidad de café en grano debe ser un número positivo.')
        .toFloat(),

    body('precio_kg_grano')
        .if(body('vender_grano').equals('on'))
        .notEmpty().withMessage('El precio por kg de café en grano es obligatorio.')
        .isFloat({ gt: 0 }).withMessage('El precio por kg de café en grano debe ser un número positivo.')
        .toFloat(),

    body('cantidad_vender_molido')
        .if(body('vender_molido').equals('on'))
        .notEmpty().withMessage('La cantidad de café molido es obligatoria.')
        .isFloat({ gt: 0 }).withMessage('La cantidad de café molido debe ser un número positivo.')
        .toFloat(),

    body('precio_kg_molido')
        .if(body('vender_molido').equals('on'))
        .notEmpty().withMessage('El precio por kg de café molido es obligatorio.')
        .isFloat({ gt: 0 }).withMessage('El precio por kg de café molido debe ser un número positivo.')
        .toFloat(),

    body('cantidad_vender_pasilla')
        .if(body('vender_pasilla').equals('on'))
        .notEmpty().withMessage('La cantidad de café pasilla es obligatoria.')
        .isFloat({ gt: 0 }).withMessage('La cantidad de café pasilla debe ser un número positivo.')
        .toFloat(),

    body('precio_kg_pasilla')
        .if(body('vender_pasilla').equals('on'))
        .notEmpty().withMessage('El precio por kg de café pasilla es obligatorio.')
        .isFloat({ gt: 0 }).withMessage('El precio por kg de café pasilla debe ser un número positivo.')
        .toFloat(),

    // Validaciones opcionales para cada tipo
    body(['comprador_grano', 'comprador_molido', 'comprador_pasilla'])
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('El nombre del comprador no puede exceder los 100 caracteres.')
        .escape(),

    body(['observaciones_grano', 'observaciones_molido', 'observaciones_pasilla'])
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateVentaPergamino, validateVentaEmpacado }; 