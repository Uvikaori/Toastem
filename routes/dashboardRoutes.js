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
 * components:
 *   schemas:
 *     EstadisticasProcesos:
 *       type: object
 *       properties:
 *         procesosPorMes:
 *           type: array
 *           description: Distribución de procesos por mes
 *           items:
 *             type: object
 *             properties:
 *               mes:
 *                 type: string
 *                 description: Nombre del mes
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad de procesos completados
 *         estadoProcesos:
 *           type: array
 *           description: Distribución de procesos por estado
 *           items:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 description: Nombre del estado del proceso
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad de procesos en este estado
 *         totalLotes:
 *           type: integer
 *           description: Total de lotes gestionados
 *         totalFincas:
 *           type: integer
 *           description: Total de fincas registradas
 *         ventasPorMes:
 *           type: array
 *           description: Distribución de ventas por mes
 *           items:
 *             type: object
 *             properties:
 *               mes:
 *                 type: string
 *                 description: Nombre del mes
 *               valor:
 *                 type: number
 *                 description: Valor total de las ventas del mes
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Muestra el panel de control del usuario
 *     tags: [Dashboard]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Panel de control renderizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estadisticasProcesos:
 *                   $ref: '#/components/schemas/EstadisticasProcesos'
 *                 resumenVentas:
 *                   type: object
 *                   properties:
 *                     totalVentas:
 *                       type: number
 *                       description: Valor total de todas las ventas
 *                     ventasPergamino:
 *                       type: number
 *                       description: Valor total de las ventas de café pergamino
 *                     ventasEmpacado:
 *                       type: number
 *                       description: Valor total de las ventas de café empacado
 *                 rendimientoProduccion:
 *                   type: object
 *                   properties:
 *                     pergaminoSeco:
 *                       type: number
 *                       description: Rendimiento promedio de pergamino seco
 *                     pesoFinalEmpacado:
 *                       type: number
 *                       description: Rendimiento promedio de producto empacado
 *       401:
 *         description: Usuario no autenticado
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /dashboard/fincas:
 *   get:
 *     summary: Redirige a la gestión de fincas
 *     tags: [Dashboard]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       302:
 *         description: Redirección a la página de gestión de fincas
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