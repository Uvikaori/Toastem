const { body } = require('express-validator');
const despulpadoDAO = require('../models/dao/despulpadoDAO'); // Para obtener el peso final del despulpado

const validateFermentacionLavado = [
    body('fecha_inicio_fermentacion')
        .notEmpty().withMessage('La fecha de inicio de fermentación es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de inicio de fermentación inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de inicio de fermentación sea posterior a la fecha de despulpado
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
                if (despulpadoInfo && despulpadoInfo.fecha_despulpado) {
                    const fechaDespulpado = new Date(despulpadoInfo.fecha_despulpado);
                    if (new Date(value) < fechaDespulpado) {
                        throw new Error(`La fecha de inicio de fermentación debe ser posterior a la fecha de despulpado (${fechaDespulpado.toLocaleString()}).`);
                    }
                }
            }
            return true;
        }),

    body('fecha_lavado')
        .notEmpty().withMessage('La fecha de lavado es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de lavado inválido.')
        .toDate()
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.fecha_inicio_fermentacion)) {
                throw new Error('La fecha de lavado no puede ser anterior a la fecha de inicio de fermentación.');
            }
            return true;
        }),

    body('peso_final_fermentacion') // Corresponde al peso_final en la tabla fermentacion_lavado
        .notEmpty().withMessage('El peso después del lavado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal (ej: 40.50).')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso después del lavado debe ser positivo.');
            }
            // Validación opcional: El peso después del lavado no debería ser mayor que el peso después del despulpado.
            // Para esto, necesitamos el id_lote para buscar el registro de despulpado.
            const id_lote = parseInt(req.params.id_lote); // Asumiendo que id_lote está en los parámetros de la ruta
            if (id_lote && !isNaN(id_lote)) {
                const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
                if (despulpadoInfo && despulpadoInfo.peso_final) {
                    if (value > despulpadoInfo.peso_final) {
                        throw new Error(`El peso después del lavado (${value} kg) no puede ser mayor que el peso final del despulpado (${despulpadoInfo.peso_final} kg).`);
                    }
                }
            }
            return true;
        }),

    body('observaciones_fermentacion')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateFermentacionLavado }; 