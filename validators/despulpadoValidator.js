const { body } = require('express-validator');

const validateDespulpado = [
    body('fecha_remojo')
        .notEmpty().withMessage('La fecha de inicio de remojo es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de remojo inválido.')
        .toDate(),

    body('fecha_despulpado')
        .notEmpty().withMessage('La fecha de despulpado es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de despulpado inválido.')
        .toDate()
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.fecha_remojo)) {
                throw new Error('La fecha de despulpado no puede ser anterior a la fecha de remojo.');
            }
            return true;
        }),

    body('peso_final_despulpado') // Corresponde al peso_final en la tabla despulpado
        .notEmpty().withMessage('El peso después del despulpado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal (ej: 100.50).')
        .toFloat()
        .custom((value, { req }) => {
            // Asumiendo que el peso_inicial del lote se podría pasar de alguna forma para comparar
            // o que el lote.peso_inicial está disponible en req via algun pre-load.
            // Por ahora, una validación simple de que sea positivo.
            if (value <= 0) {
                throw new Error('El peso después del despulpado debe ser positivo.');
            }
            return true;
        }),

    body('observaciones_despulpado') // Usamos un nombre específico para el campo del form
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateDespulpado }; 