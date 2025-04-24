const express = require('express');
const router = express.Router();
const fincaController = require('../controllers/fincaController');
const { isAuthenticated } = require('../middlewares/auth');

// Aplicar middleware de autenticación
router.use(isAuthenticated);

// Rutas básicas de CRUD
router.get('/', fincaController.listarFincas);
router.post('/crear', fincaController.crearFinca);
router.put('/:id', fincaController.actualizarFinca);
router.delete('/:id', fincaController.eliminarFinca);

// Ruta para mostrar el formulario de creación de fincas
router.get('/crear', (req, res) => {
    res.render('fincas/crear', {
        titulo: 'Crear Nueva Finca | Toastem',
        mensaje: null,
        error: null
    });
});

module.exports = router;