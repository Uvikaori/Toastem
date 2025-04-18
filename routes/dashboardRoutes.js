const express = require('express');
const router = express.Router();
const controladorDashboard = require('../controllers/dashboardController');
const { autenticado } = require('../middlewares/auth');

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
router.get('/', autenticado, controladorDashboard.mostrarDashboard);

module.exports = router; 