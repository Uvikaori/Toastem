const express = require('express');
const router = express.Router();
const fincaController = require('../controllers/fincaController');
const { isAuthenticated } = require('../middlewares/auth');
const { validateFinca } = require('../validators/fincaValidator');

// Aplicar middleware de autenticación
router.use(isAuthenticated);

// Ruta para MOSTRAR el formulario de creación
router.get('/crear', fincaController.mostrarFormularioCrearFinca);

// Ruta para PROCESAR la creación de la finca (con validación)
router.post('/crear', validateFinca, fincaController.crearFinca);

// Rutas API para obtener datos dinámicamente para los selects
router.get('/api/municipios/:departamento', fincaController.getMunicipiosAPI);
router.get('/api/veredas/:departamento/:municipio', fincaController.getVeredasAPI);

// Ruta para listar las fincas del usuario (cambiado de '/' a '/gestionar' por claridad)
router.get('/gestionar', fincaController.listarFincas);

// Rutas para actualizar y eliminar (requieren ID)
router.put('/:id', validateFinca, fincaController.actualizarFinca);
router.delete('/:id', fincaController.eliminarFinca);

module.exports = router;