const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints para el panel de control
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Muestra el panel de control del usuario
 *     tags: [Dashboard]
 *     security:
 *       - session: []
 *     responses:
 *       200:
 *         description: Panel de control renderizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estadisticasProcesos:
 *                   type: object
 *                   properties:
 *                     procesosPorMes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mes:
 *                             type: string
 *                           cantidad:
 *                             type: integer
 *                     estadoProcesos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           estado:
 *                             type: string
 *                           cantidad:
 *                             type: integer
 *       401:
 *         description: Usuario no autenticado
 */

// Middleware de autenticación
router.use(isAuthenticated);

// Ruta principal del dashboard
router.get('/', dashboardController.index);

// Ruta para redirigir a gestión de fincas
router.get('/fincas', dashboardController.redirigirAFincas);

module.exports = router; 