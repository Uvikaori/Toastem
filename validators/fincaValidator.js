const { body } = require('express-validator');

/**
 * Validación para la creación y actualización de fincas
 */
const validateFinca = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la finca es obligatorio.')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
    .escape(),
    
  body('ubicacion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('La ubicación no puede exceder los 255 caracteres.')
    .escape(),
    
  body('departamento')
    .trim()
    .notEmpty().withMessage('Debe seleccionar un departamento.')
    .escape(),
    
  body('id_municipio_vereda')
    .notEmpty().withMessage('Debe seleccionar una vereda/municipio.')
    .isInt({ gt: 0 }).withMessage('La selección de vereda/municipio no es válida.')
    .toInt()
];

module.exports = {
  validateFinca
}; 