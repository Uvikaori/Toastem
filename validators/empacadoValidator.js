const { body } = require('express-validator');

const validateEmpacado = [
    body('fecha_empacado')
        .notEmpty().withMessage('La fecha de empacado es obligatoria')
        .isDate().withMessage('La fecha de empacado debe ser una fecha válida'),

    // Validadores para Grano
    body('peso_inicial_grano')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso inicial del grano debe ser un número positivo'),

    body('peso_empacado_grano')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso empacado del grano debe ser un número positivo'),

    body('total_empaques_grano')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('El número de empaques debe ser al menos 1'),

    // Validadores para Molido
    body('peso_inicial_molido')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso inicial del molido debe ser un número positivo'),

    body('peso_empacado_molido')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso empacado del molido debe ser un número positivo'),

    body('total_empaques_molido')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('El número de empaques debe ser al menos 1'),

    // Validadores para Pasilla
    body('peso_inicial_pasilla')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso inicial de la pasilla debe ser un número positivo'),

    body('peso_empacado_pasilla')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso empacado de la pasilla debe ser un número positivo'),

    body('total_empaques_pasilla')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('El número de empaques debe ser al menos 1')
];

module.exports = {
    validateEmpacado
};
