const { body } = require('express-validator');
const secadoDAO = require('../models/dao/secadoDAO'); // Para obtener el peso final del secado

const validateClasificacion = [
    body('fecha_clasificacion')
        .notEmpty().withMessage('La fecha de clasificación es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de clasificación sea posterior o igual a la fecha de fin de secado
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
                if (secadoInfo && secadoInfo.fecha_fin) {
                    const fechaFinSecado = new Date(secadoInfo.fecha_fin);
                    const fechaClasificacion = new Date(value);
                    
                    // Comparar solo las fechas (sin horas) para permitir el mismo día
                    fechaFinSecado.setHours(0, 0, 0, 0);
                    fechaClasificacion.setHours(0, 0, 0, 0);
                    
                    if (fechaClasificacion < fechaFinSecado) {
                        throw new Error(`La fecha de clasificación debe ser igual o posterior a la fecha de finalización del secado (${new Date(secadoInfo.fecha_fin).toLocaleDateString()}).`);
                    }
                }
            }
            return true;
        }),

    body('peso_total')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('El peso total debe ser un número.')
        .toFloat()
        .custom((value) => {
            if (value < 0) {
                throw new Error('El peso total no puede ser negativo.');
            }
            return true;
        }),

    body('peso_pergamino')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('El peso del pergamino debe ser un número.')
        .toFloat()
        .custom((value) => {
            if (value < 0) {
                throw new Error('El peso del pergamino no puede ser negativo.');
            }
            return true;
        }),

    body('peso_pasilla')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('El peso de la pasilla debe ser un número.')
        .toFloat()
        .custom((value) => {
            if (value < 0) {
                throw new Error('El peso de la pasilla no puede ser negativo.');
            }
            return true;
        }),

    body('observaciones')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateClasificacion }; 