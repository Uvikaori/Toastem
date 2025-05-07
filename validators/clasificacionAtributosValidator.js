const { body } = require('express-validator');
const secadoDAO = require('../models/dao/secadoDAO'); // Para obtener el peso final del secado

const validateClasificacion = [
    body('fecha_clasificacion')
        .notEmpty().withMessage('La fecha de clasificación es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate(),

    body('proveedor_externo')
        .isBoolean().withMessage('Valor inválido para proveedor externo.'),

    body('nombre_proveedor')
        .if(body('proveedor_externo').equals('true'))
        .notEmpty().withMessage('El nombre del proveedor es obligatorio si es externo.')
        .trim().escape(),

    body('costo_servicio')
        .if(body('proveedor_externo').equals('true'))
        .optional({ checkFalsy: true })
        .isDecimal().withMessage('El costo del servicio debe ser un número.')
        .toFloat(),

    body('peso_final_clasificado')
        .notEmpty().withMessage('El peso final clasificado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal.')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso final clasificado debe ser positivo.');
            }
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
                // Solo validar si el secado está terminado y tiene un peso_final
                if (secadoInfo && secadoInfo.peso_final !== null && secadoInfo.id_estado_proceso === 3) {
                    if (value > secadoInfo.peso_final) {
                        throw new Error(`El peso clasificado (${value} kg) no puede ser mayor que el peso final del secado (${secadoInfo.peso_final} kg).`);
                    }
                }
            }
            return true;
        }),

    body('observaciones_clasificacion')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateClasificacion }; 