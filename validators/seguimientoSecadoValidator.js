const { body } = require('express-validator');
const secadoDAO = require('../models/dao/secadoDAO'); // Para validar que existe el secado

const validateSeguimientoSecado = [
    body('fecha_seguimiento')
        .notEmpty().withMessage('La fecha de seguimiento es obligatoria.')
        .isISO8601().withMessage('Formato de fecha inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de seguimiento esté entre la fecha de inicio y fin del secado
            const id_secado = parseInt(req.params.id_secado);
            if (id_secado && !isNaN(id_secado)) {
                const [secadoInfo] = await secadoDAO.db.query(
                    'SELECT fecha_inicio, fecha_fin FROM secado WHERE id = ?',
                    [id_secado]
                );
                
                if (secadoInfo && secadoInfo.length > 0) {
                    const fechaInicio = new Date(secadoInfo[0].fecha_inicio);
                    const fechaSeguimiento = new Date(value);
                    
                    if (fechaSeguimiento < fechaInicio) {
                        throw new Error(`La fecha de seguimiento debe ser posterior a la fecha de inicio del secado (${fechaInicio.toLocaleString()}).`);
                    }
                    
                    if (secadoInfo[0].fecha_fin) {
                        const fechaFin = new Date(secadoInfo[0].fecha_fin);
                        if (fechaSeguimiento > fechaFin) {
                            throw new Error(`La fecha de seguimiento no puede ser posterior a la fecha de finalización del secado (${fechaFin.toLocaleString()}).`);
                        }
                    }
                }
            }
            return true;
        }),

    body('temperatura')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('La temperatura debe ser un número.')
        .toFloat()
        .custom((value) => {
            if (value < -10 || value > 70) {
                throw new Error('La temperatura debe estar entre -10°C y 70°C.');
            }
            return true;
        }),

    body('humedad')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('La humedad debe ser un número.')
        .toFloat()
        .custom((value) => {
            if (value < 0 || value > 100) {
                throw new Error('La humedad debe estar entre 0% y 100%.');
            }
            return true;
        }),

    body('observaciones')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

module.exports = { validateSeguimientoSecado }; 