const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de tueste
const validateTueste = [
    // Fecha general de registro
    body('fecha_tueste')
        .notEmpty().withMessage('La fecha de registro es obligatoria')
        .isDate().withMessage('La fecha de registro debe ser una fecha válida'),
    
    // Peso inicial total (viene de la trilla)
    body('peso_inicial')
        .optional()
        .isFloat({ min: 0 }).withMessage('El peso inicial debe ser un número positivo o cero'),
    
    // Validaciones para café pergamino (condicionales)
    body('peso_pergamino_inicial')
        .optional()
        .isFloat({ min: 0 }).withMessage('El peso inicial de pergamino debe ser un número positivo o cero'),
    
    body('tipo_calidad_pergamino')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pergamino
            if (req.body.peso_pergamino_inicial && parseFloat(req.body.peso_pergamino_inicial) > 0) {
                if (!value) {
                    throw new Error('La calidad del café pergamino es obligatoria');
                }
                if (!['Premium', 'Normal'].includes(value)) {
                    throw new Error('La calidad del café pergamino debe ser Premium o Normal');
                }
            }
            return true;
        }),
    
    body('nivel_tueste_pergamino')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pergamino
            if (req.body.peso_pergamino_inicial && parseFloat(req.body.peso_pergamino_inicial) > 0) {
                if (!value) {
                    throw new Error('El nivel de tueste del café pergamino es obligatorio');
                }
                if (!['Alto', 'Medio', 'Bajo'].includes(value)) {
                    throw new Error('El nivel de tueste del café pergamino debe ser Alto, Medio o Bajo');
                }
            }
            return true;
        }),
    
    body('fecha_tueste_pergamino')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pergamino
            if (req.body.peso_pergamino_inicial && parseFloat(req.body.peso_pergamino_inicial) > 0 && !value) {
                throw new Error('La fecha de tueste para café pergamino es obligatoria');
            }
            return true;
        }),
    
    body('peso_pergamino_final')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso inicial de pergamino
            if (req.body.peso_pergamino_inicial && parseFloat(req.body.peso_pergamino_inicial) > 0) {
                if (!value) {
                    throw new Error('El peso final del café pergamino es obligatorio');
                }
                if (parseFloat(value) <= 0) {
                    throw new Error('El peso final del café pergamino debe ser mayor a cero');
                }
            }
            return true;
        }),
    
    // Validaciones para café pasilla (condicionales)
    body('peso_pasilla_inicial')
        .optional()
        .isFloat({ min: 0 }).withMessage('El peso inicial de pasilla debe ser un número positivo o cero'),
    
    body('tipo_calidad_pasilla')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pasilla
            if (req.body.peso_pasilla_inicial && parseFloat(req.body.peso_pasilla_inicial) > 0) {
                if (value !== 'Baja') {
                    throw new Error('La calidad del café pasilla debe ser Baja');
                }
            }
            return true;
        }),
    
    body('nivel_tueste_pasilla')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pasilla
            if (req.body.peso_pasilla_inicial && parseFloat(req.body.peso_pasilla_inicial) > 0) {
                if (value !== 'Alto') {
                    throw new Error('El nivel de tueste del café pasilla debe ser Alto');
                }
            }
            return true;
        }),
    
    body('fecha_tueste_pasilla')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso de pasilla
            if (req.body.peso_pasilla_inicial && parseFloat(req.body.peso_pasilla_inicial) > 0 && !value) {
                throw new Error('La fecha de tueste para café pasilla es obligatoria');
            }
            return true;
        }),
    
    body('peso_pasilla_final')
        .optional()
        .custom((value, { req }) => {
            // Solo validar si hay peso inicial de pasilla
            if (req.body.peso_pasilla_inicial && parseFloat(req.body.peso_pasilla_inicial) > 0) {
                if (!value) {
                    throw new Error('El peso final del café pasilla es obligatorio');
                }
                if (parseFloat(value) <= 0) {
                    throw new Error('El peso final del café pasilla debe ser mayor a cero');
                }
            }
            return true;
        }),
    
    // Validar que se haya registrado al menos un tipo de café
    body().custom((value, { req }) => {
        const tienePergamino = req.body.peso_pergamino_inicial && parseFloat(req.body.peso_pergamino_inicial) > 0;
        const tienePasilla = req.body.peso_pasilla_inicial && parseFloat(req.body.peso_pasilla_inicial) > 0;
        
        if (!tienePergamino && !tienePasilla) {
            throw new Error('Debe registrar al menos un tipo de café (pergamino o pasilla)');
        }
        
        return true;
    }),
    
    body('peso_final')
        .optional(), // El peso final ahora se calcula automáticamente en el backend
    
    body('observaciones')
        .optional()
        .isString().withMessage('Las observaciones deben ser texto'),
    
    // Middleware para manejar los errores de validación
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error', errorMessages);
            
            // Guardamos los datos ingresados para rellenar el formulario nuevamente
            req.flash('formData', req.body);
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/tueste/registrar`);
        }
        
        next();
    }
];

module.exports = { validateTueste }; 