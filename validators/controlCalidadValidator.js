const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de control de calidad
const validateControlCalidad = [
    body('fecha_control')
        .notEmpty().withMessage('La fecha del control es obligatoria')
        .isDate().withMessage('La fecha del control debe ser una fecha válida'),
    
    body('tipo_control')
        .notEmpty().withMessage('El tipo de control es obligatorio')
        .isIn(['Cata', 'Análisis Físico', 'Análisis Químico', 'Otro']).withMessage('El tipo de control debe ser Cata, Análisis Físico, Análisis Químico u Otro'),
    
    body('resultado_control')
        .notEmpty().withMessage('El resultado del control es obligatorio')
        .isIn(['Aprobado', 'Rechazado', 'Condicional']).withMessage('El resultado debe ser Aprobado, Rechazado o Condicional'),
    
    body('puntaje_cata')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('El puntaje de cata debe ser un número entre 0 y 100'),
    
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
            const { 
                fecha_control, tipo_control, resultado_control,
                puntaje_cata, observaciones 
            } = req.body;
            
            req.flash('formData', { 
                fecha_control, tipo_control, resultado_control,
                puntaje_cata, observaciones
            });
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/control-calidad/registrar`);
        }
        
        next();
    }
];

module.exports = { validateControlCalidad }; 