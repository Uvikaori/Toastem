const express = require('express');
const router = express.Router();
const controladorAuth = require('../controllers/authController');
const { noAutenticado } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints para manejo de autenticación de usuarios
 */

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Muestra la página de inicio de sesión
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Página de inicio de sesión renderizada exitosamente
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               contraseña:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Credenciales incorrectas
 */
router.get('/login', noAutenticado, controladorAuth.mostrarPaginaInicioSesion);
router.post('/login', noAutenticado, controladorAuth.iniciarSesion);

/**
 * @swagger
 * /auth/register:
 *   get:
 *     summary: Muestra la página de registro
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Página de registro renderizada exitosamente
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contraseña
 *               - confirmarContraseña
 *               - pregunta_seguridad
 *               - respuesta_seguridad
 *               - nombre_finca
 *               - ubicacion_finca
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               contraseña:
 *                 type: string
 *                 format: password
 *                 description: Contraseña (mínimo 6 caracteres, letras y números)
 *               confirmarContraseña:
 *                 type: string
 *                 format: password
 *                 description: Confirmación de la contraseña
 *               pregunta_seguridad:
 *                 type: integer
 *                 description: ID de la pregunta de seguridad
 *               respuesta_seguridad:
 *                 type: string
 *                 description: Respuesta a la pregunta de seguridad
 *               nombre_finca:
 *                 type: string
 *                 description: Nombre de la finca
 *               ubicacion_finca:
 *                 type: string
 *                 description: Ubicación de la finca
 *     responses:
 *       200:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos inválidos o usuario ya existe
 */
router.get('/register', noAutenticado, controladorAuth.mostrarPaginaRegistro);
router.post('/register', noAutenticado, controladorAuth.registrarUsuario);

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Cierra la sesión del usuario
 *     tags: [Autenticación]
 *     responses:
 *       302:
 *         description: Redirección a la página de inicio de sesión
 */
router.get('/logout', controladorAuth.cerrarSesion);

/**
 * @swagger
 * /auth/recuperar-password:
 *   get:
 *     summary: Muestra la página de recuperación de contraseña
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Página de recuperación renderizada exitosamente
 *   post:
 *     summary: Verifica el correo y muestra la pregunta de seguridad
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Pregunta de seguridad recuperada exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/recuperar-password', noAutenticado, controladorAuth.mostrarPaginaRecuperacion);
router.post('/recuperar-password', noAutenticado, controladorAuth.verificarCorreo);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Verifica la respuesta y permite cambiar la contraseña
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - respuesta
 *               - nuevaContraseña
 *               - confirmarContraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *               respuesta:
 *                 type: string
 *               nuevaContraseña:
 *                 type: string
 *                 format: password
 *               confirmarContraseña:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Datos inválidos o respuesta incorrecta
 */
router.post('/reset-password', noAutenticado, controladorAuth.resetearContraseña);

module.exports = router; 