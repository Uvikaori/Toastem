const express = require('express');
const router = express.Router();
const secadoController = require('../controllers/secadoController');
const { isAuthenticated } = require('../middlewares/auth');

/**
 * @swagger
 * /api/seguimiento-secado:
 *   post:
 *     summary: Registra un nuevo seguimiento de secado
 *     description: Permite registrar datos de seguimiento durante el proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_secado
 *             properties:
 *               id_secado:
 *                 type: integer
 *                 description: ID del proceso de secado
 *               fecha_seguimiento:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del seguimiento
 *               temperatura:
 *                 type: number
 *                 description: Temperatura en grados Celsius
 *               humedad:
 *                 type: number
 *                 description: Porcentaje de humedad
 *               observaciones_seguimiento:
 *                 type: string
 *                 description: Observaciones adicionales
 *     responses:
 *       200:
 *         description: Seguimiento registrado exitosamente
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/seguimiento-secado', isAuthenticated, secadoController.registrarSeguimientoSecado);

module.exports = router; 