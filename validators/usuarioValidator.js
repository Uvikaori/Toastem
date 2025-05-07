const { body, validationResult } = require('express-validator');

/**
 * Validación para el registro de usuarios
 */
const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
    .escape(),
  
  body('email')
    .trim()
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
    
  body('id_pregunta_seguridad')
    .isInt({ min: 1 }).withMessage('Seleccione una pregunta de seguridad válida'),
    
  body('respuesta_seguridad')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('La respuesta de seguridad debe tener entre 2 y 255 caracteres')
    .escape(),
    
  body('nombre_finca')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre de la finca debe tener entre 2 y 100 caracteres')
    .escape(),
    
  body('ubicacion_finca')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('La ubicación de la finca debe tener máximo 255 caracteres')
    .escape(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

/**
 * Validación para el inicio de sesión
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 1 }).withMessage('Ingrese su contraseña'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

/**
 * Validación para la recuperación de contraseña (email y respuesta de seguridad)
 */
const validateRecoveryRequest = [
  body('email')
    .trim()
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
    
  body('respuesta_seguridad')
    .trim()
    .isLength({ min: 1 }).withMessage('Ingrese la respuesta a la pregunta de seguridad')
    .escape(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

/**
 * Validación para la actualización de contraseña
 */
const validatePasswordUpdate = [
  body('email')
    .trim()
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRecoveryRequest,
  validatePasswordUpdate
}; 