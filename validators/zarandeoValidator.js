const { body } = require('express-validator');
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO'); // Para obtener el peso final del proceso anterior

const validateZarandeo = [
    body('fecha_zarandeo')
        .notEmpty().withMessage('La fecha de zarandeo es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de zarandeo inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de zarandeo sea posterior a la fecha de lavado
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
                if (fermentacionInfo && fermentacionInfo.fecha_lavado) {
                    const fechaLavado = new Date(fermentacionInfo.fecha_lavado);
                    if (new Date(value) < fechaLavado) {
                        throw new Error(`La fecha de zarandeo debe ser posterior a la fecha de lavado (${fechaLavado.toLocaleString()}).`);
                    }
                }
            }
            return true;
        }),

    body('peso_final_zarandeo')
        .notEmpty().withMessage('El peso después del zarandeo es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso debe ser un número decimal (ej: 35.20).')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso después del zarandeo debe ser positivo.');
            }
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
                if (fermentacionInfo && fermentacionInfo.peso_final) {
                    if (value > fermentacionInfo.peso_final) {
                        throw new Error(`El peso después del zarandeo (${value} kg) no puede ser mayor que el peso final de la fermentación/lavado (${fermentacionInfo.peso_final} kg).`);
                    }
                }
            }
            return true;
        }),

    body('observaciones_zarandeo')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateZarandeo }; 