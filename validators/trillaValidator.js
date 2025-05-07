const { body } = require('express-validator');
const clasificacionDAO = require('../models/dao/clasificacionDAO'); // Actualizado para usar el DAO renombrado

const validateTrilla = [
    body('fecha_trilla')
        .notEmpty().withMessage('La fecha de trilla es obligatoria.')
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

    body('peso_final_trillado')
        .notEmpty().withMessage('El peso final trillado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal.')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso final trillado debe ser positivo.');
            }
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
                // Solo validar si la clasificación está terminada y tiene un peso_final
                if (clasificacionInfo && clasificacionInfo.peso_final_clasificado !== null && clasificacionInfo.id_estado_proceso === 3) {
                    if (value > clasificacionInfo.peso_final_clasificado) {
                        throw new Error(`El peso trillado (${value} kg) no puede ser mayor que el peso final clasificado (${clasificacionInfo.peso_final_clasificado} kg).`);
                    }
                }
            }
            return true;
        }),

    body('observaciones_trilla')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateTrilla }; 