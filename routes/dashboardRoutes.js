const express = require('express');
const router = express.Router();
const controladorDashboard = require('../controllers/dashboardController');
const { autenticado } = require('../middlewares/auth');

// Ruta para el dashboard principal
router.get('/', autenticado, controladorDashboard.mostrarDashboard);

module.exports = router; 