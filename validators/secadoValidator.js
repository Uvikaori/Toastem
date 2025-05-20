const { body } = require('express-validator');
const zarandeoDAO = require('../models/dao/zarandeoDAO'); // Para obtener el peso final del proceso anterior
const secadoDAO = require('../models/dao/secadoDAO'); // Añadido para validateFinSecado

const validateInicioSecado = [
    body('fecha_inicio_secado')
        .notEmpty().withMessage('La fecha de inicio de secado es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de inicio inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            // Validar que la fecha de inicio de secado sea posterior a la fecha de zarandeo
            const id_lote = parseInt(req.params.id_lote);
            if (id_lote && !isNaN(id_lote)) {
                const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
                if (zarandeoInfo && zarandeoInfo.fecha_zarandeo) {
                    const fechaZarandeo = new Date(zarandeoInfo.fecha_zarandeo);
                    if (new Date(value) < fechaZarandeo) {
                        throw new Error(`La fecha de inicio de secado debe ser posterior a la fecha de zarandeo (${fechaZarandeo.toLocaleString()}).`);
                    }
                }
            }
            return true;
        }),

    body('metodo_secado')
        .notEmpty().withMessage('El método de secado es obligatorio.')
        .isIn(['Secado al sol', 'Secado mecánico', 'Secado por vía húmeda (con cereza)'])
        .withMessage('Método de secado inválido. Valores permitidos: Secado al sol, Secado mecánico, Secado por vía húmeda (con cereza).'),

    body('peso_inicial_secado')
        .notEmpty().withMessage('El peso inicial del secado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso inicial debe ser un número decimal.')
        .toFloat()
        .custom(value => {
            if (value <= 0) {
                throw new Error('El peso inicial debe ser positivo.');
            }
            return true;
        }),

    body('humedad_inicial_secado')
        .optional({ checkFalsy: true })
        .isDecimal({ decimal_digits: '1,2' }).withMessage('La humedad inicial debe ser un número decimal (ej: 70.5).')
        .toFloat()
        .custom(value => {
            if (value < 0 || value > 100) {
                throw new Error('La humedad inicial debe estar entre 0 y 100.');
            }
            return true;
        }),
    
    body('decision_venta')
        .optional()
        .isBoolean().withMessage('La decisión de venta debe ser un valor booleano.')
        .toBoolean(),

    body('observaciones_secado')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];

// Validador para cuando se finaliza el secado
const validateFinSecado = [
    body('fecha_fin_secado')
        .notEmpty().withMessage('La fecha de fin de secado es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de fin inválido.')
        .toDate()
        .custom(async (value, { req }) => {
            const id_lote = parseInt(req.params.id_lote); 
            if (isNaN(id_lote)) { throw new Error('ID de lote inválido para validación.'); }
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || !secadoInfo.fecha_inicio) { 
                // Si no hay info de secado o fecha_inicio, no se puede validar contra ella.
                // Esto podría indicar un problema si se llega aquí sin un secado iniciado.
                // El controlador debería manejar esto antes.
                return true; 
            }
            if (new Date(value) < new Date(secadoInfo.fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio del secado (' + new Date(secadoInfo.fecha_inicio).toLocaleDateString('es-CO') + ').');
            }
            return true;
        }),
    body('peso_final_secado')
        .notEmpty().withMessage('El peso final del secado es obligatorio.')
        .isDecimal({ decimal_digits: '1,2' }).withMessage('El peso final debe ser un número decimal.')
        .toFloat()
        .custom(async (value, { req }) => {
            if (value <= 0) {
                throw new Error('El peso final debe ser positivo.');
            }
            const id_lote = parseInt(req.params.id_lote);
            if (isNaN(id_lote)) { throw new Error('ID de lote inválido para validación.'); }
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || secadoInfo.peso_inicial === null || secadoInfo.peso_inicial === undefined) {
                // Similar al caso de fecha_fin, si no hay peso_inicial, no se puede comparar.
                return true;
            }
            if (value > secadoInfo.peso_inicial) {
                throw new Error(`El peso final (${value} kg) no puede ser mayor que el peso inicial del secado (${secadoInfo.peso_inicial} kg).`);
            }
            return true;
        }),
    body('decision_venta')
        .optional()
        .isBoolean().withMessage('La decisión de venta debe ser un valor booleano.')
        .toBoolean(),
    
    body('observaciones_fin_secado')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder los 1000 caracteres.')
        .escape(),
];


module.exports = { validateInicioSecado, validateFinSecado }; 