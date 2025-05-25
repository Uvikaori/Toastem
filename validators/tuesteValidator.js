const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de tueste
const validateTueste = [
    body('fecha_tueste')
        .notEmpty().withMessage('La fecha de tueste es obligatoria')
        .isDate().withMessage('La fecha de tueste debe ser una fecha válida'),
    
    body('peso_inicial')
        .notEmpty().withMessage('El peso inicial es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El peso inicial debe ser un número positivo'),
    
    body('tipo_calidad')
        .notEmpty().withMessage('El tipo de calidad es obligatorio')
        .isIn(['Premium', 'Normal', 'Baja']).withMessage('El tipo de calidad debe ser Premium, Normal o Baja'),
    
    body('nivel_tueste')
        .notEmpty().withMessage('El nivel de tueste es obligatorio')
        .isIn(['Alto', 'Medio', 'Bajo']).withMessage('El nivel de tueste debe ser Alto, Medio o Bajo'),
    
    body('peso_final')
        .notEmpty().withMessage('El peso final es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El peso final debe ser un número positivo'),
    
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
                fecha_tueste, peso_inicial, tipo_calidad,
                nivel_tueste, peso_final, observaciones 
            } = req.body;
            
            req.flash('formData', { 
                fecha_tueste, peso_inicial, tipo_calidad,
                nivel_tueste, peso_final, observaciones
            });
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/tueste/registrar`);
        }
        
        next();
    }
];

module.exports = { validateTueste }; 