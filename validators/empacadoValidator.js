const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de empacado
const validateEmpacado = [
    body('fecha_empacado')
        .notEmpty().withMessage('La fecha de empacado es obligatoria')
        .isDate().withMessage('La fecha de empacado debe ser una fecha válida'),
    
    body('tipo_empaque')
        .notEmpty().withMessage('El tipo de empaque es obligatorio')
        .isIn(['Bolsa', 'Lata', 'Tarro', 'Otro']).withMessage('El tipo de empaque debe ser Bolsa, Lata, Tarro u Otro'),
    
    body('peso_inicial_empacado')
        .notEmpty().withMessage('El peso inicial es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El peso inicial debe ser un número positivo'),
    
    body('total_empaques')
        .notEmpty().withMessage('El número total de empaques es obligatorio')
        .isInt({ min: 1 }).withMessage('El número total de empaques debe ser un número entero positivo'),
    
    body('peso_empacado')
        .notEmpty().withMessage('El peso empacado es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El peso empacado debe ser un número positivo'),
    
    body('tipo_producto_empacado')
        .notEmpty().withMessage('El tipo de producto empacado es obligatorio')
        .isIn(['Grano', 'Molido', 'Pasilla Molido']).withMessage('El tipo de producto empacado debe ser Grano, Molido o Pasilla Molido'),
    
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
                fecha_empacado, tipo_empaque, peso_inicial_empacado,
                total_empaques, peso_empacado, tipo_producto_empacado, observaciones 
            } = req.body;
            
            req.flash('formData', { 
                fecha_empacado, tipo_empaque, peso_inicial_empacado,
                total_empaques, peso_empacado, tipo_producto_empacado, observaciones
            });
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/empacado/registrar`);
        }
        
        next();
    }
];

module.exports = { validateEmpacado }; 