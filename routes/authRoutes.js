const express = require('express');
const router = express.Router();
const controladorAuth = require('../controllers/authController');
const { noAutenticado } = require('../middlewares/auth');

// Rutas de autenticación
router.get('/login', noAutenticado, controladorAuth.mostrarPaginaInicioSesion);
router.post('/login', noAutenticado, controladorAuth.iniciarSesion);

router.get('/register', noAutenticado, controladorAuth.mostrarPaginaRegistro);
router.post('/register', noAutenticado, controladorAuth.registrarUsuario);

router.get('/logout', controladorAuth.cerrarSesion);

module.exports = router; 