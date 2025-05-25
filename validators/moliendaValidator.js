const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de molienda
const validateMolienda = [
    body('fecha_molienda')
        .notEmpty().withMessage('La fecha de molienda es obligatoria')
        .isDate().withMessage('La fecha de molienda debe ser una fecha válida'),
    
    body('peso_inicial_molienda')
        .notEmpty().withMessage('El peso inicial es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El peso inicial debe ser un número positivo'),
    
    body('tipo_molienda')
        .notEmpty().withMessage('El tipo de molienda es obligatorio')
        .isIn(['Fina', 'Media', 'Gruesa']).withMessage('El tipo de molienda debe ser Fina, Media o Gruesa'),
    
    body('peso_final_molido')
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
                fecha_molienda, peso_inicial_molienda, tipo_molienda,
                peso_final_molido, observaciones 
            } = req.body;
            
            req.flash('formData', { 
                fecha_molienda, peso_inicial_molienda, tipo_molienda,
                peso_final_molido, observaciones
            });
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
        
        next();
    }
];

module.exports = { validateMolienda }; 