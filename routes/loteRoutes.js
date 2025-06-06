const express = require('express');
const router = express.Router({ mergeParams: true }); 
const loteController = require('../controllers/loteController');
const { isAuthenticated, isLoteOwner } = require('../middlewares/auth'); // Importamos isLoteOwner para verificar que es el dueño del lote
const { validateLote } = require('../validators/loteValidator');
const { validateDespulpado } = require('../validators/despulpadoValidator'); 
const { validateFermentacionLavado } = require('../validators/fermentacionLavadoValidator');
const { validateZarandeo } = require('../validators/zarandeoValidator'); 
const { validateInicioSecado, validateFinSecado } = require('../validators/secadoValidator'); 
const { validateClasificacion } = require('../validators/clasificacionAtributosValidator'); 
const { validateTrilla } = require('../validators/trillaValidator'); 
const { validateTueste } = require('../validators/tuesteValidator'); 
const { validateMolienda } = require('../validators/moliendaValidator'); 
const { validateEmpacado } = require('../validators/empacadoValidator');
const despulpadoController = require('../controllers/despulpadoController');
const fermentacionLavadoController = require('../controllers/fermentacionLavadoController');
const zarandeoController = require('../controllers/zarandeoController');
const secadoController = require('../controllers/secadoController');
const clasificacionController = require('../controllers/clasificacionController');
const trillaController = require('../controllers/trillaController');
const tuesteController = require('../controllers/tuesteController');
const moliendaController = require('../controllers/moliendaController');
const empacadoController = require('../controllers/empacadoController');
const controlCalidadController = require('../controllers/controlCalidadController');
const ventaController = require('../controllers/ventaController');
const { validateVentaPergamino, validateVentaEmpacado } = require('../validators/ventaValidator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Lote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del lote
 *         codigo:
 *           type: string
 *           description: Código único que identifica al lote
 *         id_finca:
 *           type: integer
 *           description: ID de la finca a la que pertenece el lote
 *         fecha_recoleccion:
 *           type: string
 *           format: date
 *           description: Fecha en que se recolectó el café
 *         tipo_cafe:
 *           type: string
 *           description: Variedad del café
 *         tipo_recoleccion:
 *           type: string
 *           description: Método de recolección utilizado
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del lote en kilogramos
 *         observaciones:
 *           type: string
 *           description: Observaciones adicionales sobre el lote
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 */

/**
 * @swagger
 * tags:
 *   name: Lotes
 *   description: Gestión de lotes de café
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/crear:
 *   get:
 *     summary: Muestra el formulario para crear un nuevo lote
 *     tags: [Lotes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca donde se creará el lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de creación de lote
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Finca no encontrada
 */
router.get('/crear', loteController.mostrarFormularioCrearLote);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/crear:
 *   post:
 *     summary: Crea un nuevo lote de café
 *     tags: [Lotes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca donde se creará el lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - fecha_recoleccion
 *               - tipo_cafe
 *               - tipo_recoleccion
 *               - peso_inicial
 *             properties:
 *               codigo:
 *                 type: string
 *                 description: Código único que identifica al lote
 *               fecha_recoleccion:
 *                 type: string
 *                 format: date
 *                 description: Fecha en que se recolectó el café
 *               tipo_cafe:
 *                 type: string
 *                 description: Variedad del café
 *               tipo_recoleccion:
 *                 type: string
 *                 description: Método de recolección utilizado
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del lote en kilogramos
 *               observaciones:
 *                 type: string
 *                 description: Observaciones adicionales sobre el lote
 *     responses:
 *       200:
 *         description: Lote creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lote'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/crear', validateLote, loteController.crearLote);

/**
 * @swagger
 * /fincas/{id_finca}/lotes:
 *   get:
 *     summary: Obtiene todos los lotes de una finca
 *     tags: [Lotes]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca para obtener sus lotes
 *     responses:
 *       200:
 *         description: Lista de lotes de la finca
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lote'
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Finca no encontrada
 */
router.get('/', loteController.listarLotesPorFinca);

// Vista general de procesos de un lote
router.get('/:id_lote/procesos', isLoteOwner, loteController.mostrarVistaProcesosLote);

// Vista de flujo completo del lote (usando vista_flujo_lote)
router.get('/:id_lote/flujo', isLoteOwner, loteController.mostrarFlujoLote);

/**
 * @swagger
 * tags:
 *   name: Despulpado
 *   description: Gestión del proceso de despulpado del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Despulpado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de despulpado
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_remojo:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del remojo del café
 *         fecha_despulpado:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del despulpado
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del café antes del despulpado (kg)
 *         peso_final:
 *           type: number
 *           description: Peso final del café después del despulpado (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de despulpado
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/despulpado/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de despulpado
 *     tags: [Despulpado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de despulpado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/despulpado/registrar', isLoteOwner, despulpadoController.mostrarFormularioDespulpado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/despulpado/registrar:
 *   post:
 *     summary: Registra un nuevo proceso de despulpado
 *     tags: [Despulpado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_remojo
 *               - fecha_despulpado
 *               - peso_inicial
 *               - peso_final
 *             properties:
 *               fecha_remojo:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del remojo del café
 *               fecha_despulpado:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del despulpado
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del café antes del despulpado (kg)
 *               peso_final:
 *                 type: number
 *                 description: Peso final del café después del despulpado (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de despulpado
 *     responses:
 *       200:
 *         description: Proceso de despulpado registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Despulpado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/despulpado/registrar', isLoteOwner, validateDespulpado, despulpadoController.registrarDespulpado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/despulpado/{id_despulpado}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de despulpado
 *     tags: [Despulpado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_despulpado
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de despulpado a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de despulpado reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de despulpado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/despulpado/:id_despulpado/reiniciar', isLoteOwner, despulpadoController.reiniciarProcesoDespulpado);

/**
 * @swagger
 * tags:
 *   name: Fermentación y Lavado
 *   description: Gestión del proceso de fermentación y lavado del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FermentacionLavado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de fermentación y lavado
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_inicio_fermentacion:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del inicio de la fermentación
 *         fecha_lavado:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del lavado
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del café antes del proceso (kg)
 *         peso_final:
 *           type: number
 *           description: Peso final del café después del proceso (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/fermentacion-lavado/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de fermentación y lavado
 *     tags: [Fermentación y Lavado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de fermentación y lavado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/fermentacion-lavado/registrar', isLoteOwner, fermentacionLavadoController.mostrarFormularioFermentacionLavado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/fermentacion-lavado/registrar:
 *   post:
 *     summary: Registra un nuevo proceso de fermentación y lavado
 *     tags: [Fermentación y Lavado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_inicio_fermentacion
 *               - fecha_lavado
 *               - peso_inicial
 *               - peso_final
 *             properties:
 *               fecha_inicio_fermentacion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del inicio de la fermentación
 *               fecha_lavado:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del lavado
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del café antes del proceso (kg)
 *               peso_final:
 *                 type: number
 *                 description: Peso final del café después del proceso (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso
 *     responses:
 *       200:
 *         description: Proceso de fermentación y lavado registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FermentacionLavado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/fermentacion-lavado/registrar', isLoteOwner, validateFermentacionLavado, fermentacionLavadoController.registrarFermentacionLavado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/fermentacion-lavado/{id_fermentacion}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de fermentación y lavado
 *     tags: [Fermentación y Lavado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_fermentacion
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de fermentación a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de fermentación y lavado reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/fermentacion-lavado/:id_fermentacion/reiniciar', isLoteOwner, fermentacionLavadoController.reiniciarProcesoFermentacionLavado);

/**
 * @swagger
 * tags:
 *   name: Zarandeo
 *   description: Gestión del proceso de zarandeo del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Zarandeo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de zarandeo
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_zarandeo:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del zarandeo
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del café antes del zarandeo (kg)
 *         peso_final:
 *           type: number
 *           description: Peso final del café después del zarandeo (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de zarandeo
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/zarandeo/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de zarandeo
 *     tags: [Zarandeo]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de zarandeo
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/zarandeo/registrar', isLoteOwner, zarandeoController.mostrarFormularioZarandeo);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/zarandeo/registrar:
 *   post:
 *     summary: Registra un nuevo proceso de zarandeo
 *     tags: [Zarandeo]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_zarandeo
 *               - peso_inicial
 *               - peso_final
 *             properties:
 *               fecha_zarandeo:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del zarandeo
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del café antes del zarandeo (kg)
 *               peso_final:
 *                 type: number
 *                 description: Peso final del café después del zarandeo (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de zarandeo
 *     responses:
 *       200:
 *         description: Proceso de zarandeo registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Zarandeo'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/zarandeo/registrar', isLoteOwner, validateZarandeo, zarandeoController.registrarZarandeo);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/zarandeo/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de zarandeo
 *     tags: [Zarandeo]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Proceso de zarandeo reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/zarandeo/reiniciar', isLoteOwner, zarandeoController.reiniciarProcesoZarandeo);

/**
 * @swagger
 * tags:
 *   name: Secado
 *   description: Gestión del proceso de secado del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Secado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de secado
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_inicio:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de inicio del secado
 *         metodo_secado:
 *           type: string
 *           description: Método utilizado para el secado (Solar, Mecánico, Mixto)
 *         humedad_inicial:
 *           type: number
 *           description: Porcentaje de humedad inicial del café
 *         fecha_fin:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de finalización del secado
 *         peso_final:
 *           type: number
 *           description: Peso final del café después del secado (kg)
 *         humedad_final:
 *           type: number
 *           description: Porcentaje de humedad final del café
 *         decision_venta:
 *           type: boolean
 *           description: Indica si el café se venderá después del secado
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de secado
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 *     SeguimientoSecado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del seguimiento
 *         id_secado:
 *           type: integer
 *           description: ID del proceso de secado al que pertenece
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del seguimiento
 *         temperatura:
 *           type: number
 *           description: Temperatura en grados Celsius
 *         humedad:
 *           type: number
 *           description: Porcentaje de humedad
 *         observaciones:
 *           type: string
 *           description: Observaciones del seguimiento
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/iniciar:
 *   get:
 *     summary: Muestra el formulario para iniciar el proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de inicio de secado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/secado/iniciar', isLoteOwner, secadoController.mostrarFormularioInicioSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/iniciar:
 *   post:
 *     summary: Registra el inicio del proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_inicio
 *               - metodo_secado
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de inicio del secado
 *               metodo_secado:
 *                 type: string
 *                 description: Método utilizado para el secado (Solar, Mecánico, Mixto)
 *               humedad_inicial:
 *                 type: number
 *                 description: Porcentaje de humedad inicial del café
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el inicio del proceso
 *     responses:
 *       200:
 *         description: Inicio del proceso de secado registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/secado/iniciar', isLoteOwner, validateInicioSecado, secadoController.registrarInicioSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/finalizar:
 *   get:
 *     summary: Muestra el formulario para finalizar el proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de finalización de secado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado o no iniciado
 */
router.get('/:id_lote/secado/finalizar', isLoteOwner, secadoController.mostrarFormularioFinSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/finalizar:
 *   post:
 *     summary: Registra la finalización del proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_fin
 *               - peso_final
 *               - humedad_final
 *             properties:
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de finalización del secado
 *               peso_final:
 *                 type: number
 *                 description: Peso final del café después del secado (kg)
 *               humedad_final:
 *                 type: number
 *                 description: Porcentaje de humedad final del café
 *               decision_venta:
 *                 type: boolean
 *                 description: Indica si el café se venderá después del secado
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre la finalización del proceso
 *     responses:
 *       200:
 *         description: Finalización del proceso de secado registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/secado/finalizar', isLoteOwner, validateFinSecado, secadoController.registrarFinSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/corregir-inicio:
 *   get:
 *     summary: Muestra el formulario para corregir los datos de inicio del secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de corrección de datos de inicio
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado
 */
router.get('/:id_lote/secado/corregir-inicio', isLoteOwner, secadoController.mostrarFormularioCorregirInicioSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/corregir-inicio:
 *   post:
 *     summary: Corrige los datos de inicio del proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *                 description: Nueva fecha y hora de inicio del secado
 *               metodo_secado:
 *                 type: string
 *                 description: Nuevo método de secado
 *               humedad_inicial:
 *                 type: number
 *                 description: Nuevo porcentaje de humedad inicial
 *               observaciones:
 *                 type: string
 *                 description: Nuevas observaciones
 *     responses:
 *       200:
 *         description: Datos de inicio corregidos exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/secado/corregir-inicio', isLoteOwner, secadoController.corregirDatosInicioSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/{id_secado}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_secado
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de secado a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de secado reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/secado/:id_secado/reiniciar', isLoteOwner, secadoController.reiniciarProcesoSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/seguimiento:
 *   get:
 *     summary: Muestra el formulario para registrar un seguimiento de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de seguimiento de secado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado o no en progreso
 */
router.get('/:id_lote/secado/seguimiento', isLoteOwner, secadoController.mostrarFormularioSeguimientoSecado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/secado/seguimiento:
 *   post:
 *     summary: Registra un nuevo seguimiento de secado
 *     tags: [Secado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del seguimiento
 *               temperatura:
 *                 type: number
 *                 description: Temperatura en grados Celsius
 *               humedad:
 *                 type: number
 *                 description: Porcentaje de humedad
 *               observaciones:
 *                 type: string
 *                 description: Observaciones del seguimiento
 *     responses:
 *       200:
 *         description: Seguimiento registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SeguimientoSecado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso de secado no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/secado/seguimiento', isLoteOwner, secadoController.procesarSeguimientoSecado);

/**
 * @swagger
 * tags:
 *   name: Clasificación
 *   description: Gestión del proceso de clasificación del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Clasificacion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de clasificación
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_clasificacion:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la clasificación
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del café antes de la clasificación (kg)
 *         peso_pergamino:
 *           type: number
 *           description: Peso del café pergamino clasificado (kg)
 *         peso_pasilla:
 *           type: number
 *           description: Peso de la pasilla clasificada (kg)
 *         peso_total:
 *           type: number
 *           description: Peso total después de la clasificación (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de clasificación
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/clasificacion/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de clasificación
 *     tags: [Clasificación]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de clasificación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/clasificacion/registrar', isLoteOwner, clasificacionController.mostrarFormularioClasificacion);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/clasificacion:
 *   post:
 *     summary: Registra un nuevo proceso de clasificación
 *     tags: [Clasificación]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_clasificacion
 *               - peso_inicial
 *               - peso_pergamino
 *               - peso_pasilla
 *             properties:
 *               fecha_clasificacion:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la clasificación
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del café antes de la clasificación (kg)
 *               peso_pergamino:
 *                 type: number
 *                 description: Peso del café pergamino clasificado (kg)
 *               peso_pasilla:
 *                 type: number
 *                 description: Peso de la pasilla clasificada (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de clasificación
 *     responses:
 *       200:
 *         description: Proceso de clasificación registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Clasificacion'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/clasificacion', isLoteOwner, validateClasificacion, clasificacionController.registrarClasificacion);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/clasificacion/{id_clasificacion}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de clasificación
 *     tags: [Clasificación]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_clasificacion
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de clasificación a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de clasificación reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/clasificacion/:id_clasificacion/reiniciar', isLoteOwner, clasificacionController.reiniciarProcesoClasificacion);

/**
 * @swagger
 * tags:
 *   name: Trilla
 *   description: Gestión del proceso de trilla del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Trilla:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de trilla
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_trilla:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la trilla
 *         peso_pergamino_inicial:
 *           type: number
 *           description: Peso inicial del café pergamino (kg)
 *         peso_pasilla_inicial:
 *           type: number
 *           description: Peso inicial de la pasilla (kg)
 *         peso_pergamino_final:
 *           type: number
 *           description: Peso final del café pergamino después de la trilla (kg)
 *         peso_pasilla_final:
 *           type: number
 *           description: Peso final de la pasilla después de la trilla (kg)
 *         peso_final:
 *           type: number
 *           description: Peso total final después de la trilla (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de trilla
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/trilla/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de trilla
 *     tags: [Trilla]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de trilla
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/trilla/registrar', isLoteOwner, trillaController.mostrarFormularioTrilla);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/trilla:
 *   post:
 *     summary: Registra un nuevo proceso de trilla
 *     tags: [Trilla]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_trilla
 *               - peso_pergamino_inicial
 *               - peso_pasilla_inicial
 *               - peso_pergamino_final
 *               - peso_pasilla_final
 *             properties:
 *               fecha_trilla:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la trilla
 *               peso_pergamino_inicial:
 *                 type: number
 *                 description: Peso inicial del café pergamino (kg)
 *               peso_pasilla_inicial:
 *                 type: number
 *                 description: Peso inicial de la pasilla (kg)
 *               peso_pergamino_final:
 *                 type: number
 *                 description: Peso final del café pergamino después de la trilla (kg)
 *               peso_pasilla_final:
 *                 type: number
 *                 description: Peso final de la pasilla después de la trilla (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de trilla
 *     responses:
 *       200:
 *         description: Proceso de trilla registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trilla'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/trilla', isLoteOwner, validateTrilla, trillaController.registrarTrilla);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/trilla/{id_trilla}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de trilla
 *     tags: [Trilla]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_trilla
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de trilla a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de trilla reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/trilla/:id_trilla/reiniciar', isLoteOwner, trillaController.reiniciarProcesoTrilla);

/**
 * @swagger
 * tags:
 *   name: Tueste
 *   description: Gestión del proceso de tueste del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tueste:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de tueste
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_tueste:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del registro general del tueste
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial total para el tueste (kg)
 *         peso_pergamino_inicial:
 *           type: number
 *           description: Peso inicial del café pergamino (kg)
 *         tipo_calidad_pergamino:
 *           type: string
 *           description: Tipo de calidad del café pergamino
 *         nivel_tueste_pergamino:
 *           type: string
 *           description: Nivel de tueste aplicado al café pergamino
 *         fecha_tueste_pergamino:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del tueste del café pergamino
 *         peso_pergamino_final:
 *           type: number
 *           description: Peso final del café pergamino después del tueste (kg)
 *         peso_pasilla_inicial:
 *           type: number
 *           description: Peso inicial de la pasilla (kg)
 *         tipo_calidad_pasilla:
 *           type: string
 *           description: Tipo de calidad de la pasilla
 *         nivel_tueste_pasilla:
 *           type: string
 *           description: Nivel de tueste aplicado a la pasilla
 *         fecha_tueste_pasilla:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del tueste de la pasilla
 *         peso_pasilla_final:
 *           type: number
 *           description: Peso final de la pasilla después del tueste (kg)
 *         peso_final:
 *           type: number
 *           description: Peso total final después del tueste (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de tueste
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/tueste/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de tueste
 *     tags: [Tueste]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de tueste
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/tueste/registrar', isLoteOwner, tuesteController.mostrarFormularioTueste);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/tueste:
 *   post:
 *     summary: Registra un nuevo proceso de tueste
 *     tags: [Tueste]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_tueste
 *             properties:
 *               fecha_tueste:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del registro del tueste
 *               peso_pergamino_inicial:
 *                 type: number
 *                 description: Peso inicial del café pergamino (kg)
 *               tipo_calidad_pergamino:
 *                 type: string
 *                 description: Tipo de calidad del café pergamino
 *               nivel_tueste_pergamino:
 *                 type: string
 *                 description: Nivel de tueste aplicado al café pergamino
 *               fecha_tueste_pergamino:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del tueste del café pergamino
 *               peso_pergamino_final:
 *                 type: number
 *                 description: Peso final del café pergamino después del tueste (kg)
 *               peso_pasilla_inicial:
 *                 type: number
 *                 description: Peso inicial de la pasilla (kg)
 *               tipo_calidad_pasilla:
 *                 type: string
 *                 description: Tipo de calidad de la pasilla
 *               nivel_tueste_pasilla:
 *                 type: string
 *                 description: Nivel de tueste aplicado a la pasilla
 *               fecha_tueste_pasilla:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del tueste de la pasilla
 *               peso_pasilla_final:
 *                 type: number
 *                 description: Peso final de la pasilla después del tueste (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de tueste
 *     responses:
 *       200:
 *         description: Proceso de tueste registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tueste'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/tueste', isLoteOwner, validateTueste, tuesteController.registrarTueste);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/tueste/{id_tueste}/reiniciar:
 *   post:
 *     summary: Reinicia el proceso de tueste
 *     tags: [Tueste]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_tueste
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de tueste a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de tueste reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/tueste/:id_tueste/reiniciar', isLoteOwner, tuesteController.reiniciarProcesoTueste);

/**
 * @swagger
 * tags:
 *   name: Molienda
 *   description: Gestión del proceso de molienda del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Molienda:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de molienda
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_molienda:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la molienda
 *         tipo_cafe:
 *           type: string
 *           description: Tipo de café (Pergamino o Pasilla)
 *         es_grano:
 *           type: boolean
 *           description: Indica si se mantiene en grano (true) o se muele (false)
 *         tipo_molienda:
 *           type: string
 *           description: Tipo de molienda (Fina, Media, Gruesa)
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial del café para la molienda (kg)
 *         peso_final:
 *           type: number
 *           description: Peso final después de la molienda (kg)
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de molienda
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/molienda/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de molienda
 *     tags: [Molienda]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de molienda
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/molienda/registrar', isLoteOwner, moliendaController.mostrarFormularioMolienda);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/molienda:
 *   post:
 *     summary: Registra un nuevo proceso de molienda
 *     tags: [Molienda]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_molienda
 *               - tipo_cafe
 *               - peso_inicial
 *             properties:
 *               fecha_molienda:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la molienda
 *               tipo_cafe:
 *                 type: string
 *                 enum: [Pergamino, Pasilla]
 *                 description: Tipo de café a procesar
 *               es_grano:
 *                 type: boolean
 *                 description: Indica si se mantiene en grano (true) o se muele (false)
 *               tipo_molienda:
 *                 type: string
 *                 enum: [Fina, Media, Gruesa]
 *                 description: Tipo de molienda a aplicar (requerido si es_grano=false)
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial del café para la molienda (kg)
 *               peso_final:
 *                 type: number
 *                 description: Peso final después de la molienda (kg)
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de molienda
 *     responses:
 *       200:
 *         description: Proceso de molienda registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Molienda'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/molienda', isLoteOwner, moliendaController.middlewares.cargarDatosTueste, validateMolienda, moliendaController.registrarMolienda);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/molienda/reiniciar:
 *   post:
 *     summary: Reinicia todos los procesos de molienda del lote
 *     tags: [Molienda]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Todos los procesos de molienda reiniciados exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/molienda/reiniciar', isLoteOwner, moliendaController.reiniciarProcesoMoliendaCompleto);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/molienda/{id_molienda}/reiniciar:
 *   post:
 *     summary: Reinicia un proceso específico de molienda
 *     tags: [Molienda]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_molienda
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de molienda a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de molienda reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/molienda/:id_molienda/reiniciar', isLoteOwner, moliendaController.reiniciarProcesoMolienda);

/**
 * @swagger
 * tags:
 *   name: Empacado
 *   description: Gestión del proceso de empacado del café
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Empacado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del proceso de empacado
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece el proceso
 *         fecha_empacado:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora del empacado
 *         tipo_producto_empacado:
 *           type: string
 *           enum: [Grano, Molido, Pasilla Molido]
 *           description: Tipo de producto que se empaca
 *         peso_inicial:
 *           type: number
 *           description: Peso inicial disponible para empacar (kg)
 *         peso_empacado:
 *           type: number
 *           description: Peso total empacado (kg)
 *         total_empaques:
 *           type: integer
 *           description: Número total de empaques realizados
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre el proceso de empacado
 *         id_estado_proceso:
 *           type: integer
 *           description: Estado del proceso (1=Registrado, 2=En Progreso, 3=Terminado, 4=Cancelado)
 *         empacados:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Empacado'
 *           description: Lista de empacados en caso de múltiples tipos de producto
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/empacado/registrar:
 *   get:
 *     summary: Muestra el formulario para registrar el proceso de empacado
 *     tags: [Empacado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de empacado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/empacado/registrar', isLoteOwner, empacadoController.mostrarFormularioEmpacado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/empacado:
 *   post:
 *     summary: Registra un nuevo proceso de empacado
 *     tags: [Empacado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_empacado
 *               - tipo_producto_empacado
 *               - peso_inicial
 *               - peso_empacado
 *               - total_empaques
 *             properties:
 *               fecha_empacado:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora del empacado
 *               tipo_producto_empacado:
 *                 type: string
 *                 enum: [Grano, Molido, Pasilla Molido]
 *                 description: Tipo de producto que se empaca
 *               peso_inicial:
 *                 type: number
 *                 description: Peso inicial disponible para empacar (kg)
 *               peso_empacado:
 *                 type: number
 *                 description: Peso total empacado (kg)
 *               total_empaques:
 *                 type: integer
 *                 description: Número total de empaques realizados
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre el proceso de empacado
 *     responses:
 *       200:
 *         description: Proceso de empacado registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Empacado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/empacado', isLoteOwner, validateEmpacado, empacadoController.registrarEmpacado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/empacado/{id_empacado}/reiniciar:
 *   post:
 *     summary: Reinicia un proceso específico de empacado
 *     tags: [Empacado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *       - in: path
 *         name: id_empacado
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del proceso de empacado a reiniciar
 *     responses:
 *       200:
 *         description: Proceso de empacado reiniciado exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Proceso no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/empacado/:id_empacado/reiniciar', isLoteOwner, empacadoController.reiniciarProcesoEmpacado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/empacado/reiniciar-todos:
 *   post:
 *     summary: Reinicia todos los procesos de empacado del lote
 *     tags: [Empacado]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Todos los procesos de empacado reiniciados exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/empacado/reiniciar-todos', isLoteOwner, empacadoController.reiniciarTodosEmpacados);

// Rutas para gestión de correcciones y cancelaciones
router.get('/:id_lote/cancelar', isLoteOwner, loteController.mostrarFormularioCancelarLote);
router.post('/:id_lote/cancelar', isLoteOwner, loteController.cancelarLote);
router.get('/:id_lote/duplicar', isLoteOwner, loteController.mostrarFormularioDuplicarLote);
router.post('/:id_lote/duplicar', isLoteOwner, loteController.duplicarLote);
router.post('/:id_lote/recoleccion/corregir', isLoteOwner, loteController.corregirProcesoRecoleccion);

// Rutas para el proceso de CONTROL DE CALIDAD (Opcional)
router.get('/:id_lote/control-calidad/registrar', isLoteOwner, controlCalidadController.mostrarFormularioControlCalidad);
router.post('/:id_lote/control-calidad', isLoteOwner, /* validateControlCalidad, */ controlCalidadController.registrarControlCalidad);

/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: Gestión de ventas de café (pergamino y empacado)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VentaPergamino:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la venta
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece la venta
 *         fecha_venta:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la venta
 *         cliente:
 *           type: string
 *           description: Nombre del cliente
 *         tipo_cliente:
 *           type: string
 *           description: Tipo de cliente (Particular, Empresa, Cooperativa)
 *         cantidad_vendida:
 *           type: number
 *           description: Cantidad de café vendido (kg)
 *         precio_kg:
 *           type: number
 *           description: Precio por kilogramo
 *         valor_total:
 *           type: number
 *           description: Valor total de la venta
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre la venta
 *     
 *     VentaEmpacado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la venta
 *         id_lote:
 *           type: integer
 *           description: ID del lote al que pertenece la venta
 *         fecha_venta:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de la venta
 *         cliente:
 *           type: string
 *           description: Nombre del cliente
 *         tipo_cliente:
 *           type: string
 *           description: Tipo de cliente (Particular, Empresa, Cooperativa)
 *         tipo_producto:
 *           type: string
 *           description: Tipo de producto vendido (Grano, Molido, Pasilla Molido)
 *         cantidad_empaques:
 *           type: integer
 *           description: Cantidad de empaques vendidos
 *         peso_total:
 *           type: number
 *           description: Peso total vendido (kg)
 *         precio_empaque:
 *           type: number
 *           description: Precio por empaque
 *         valor_total:
 *           type: number
 *           description: Valor total de la venta
 *         observaciones:
 *           type: string
 *           description: Observaciones sobre la venta
 */

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/ventas/registrar/pergamino:
 *   get:
 *     summary: Muestra el formulario para registrar venta de café pergamino
 *     tags: [Ventas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de venta de pergamino
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado
 */
router.get('/:id_lote/ventas/registrar/pergamino', isLoteOwner, ventaController.mostrarFormularioVentaPergamino);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/ventas/registrar/pergamino:
 *   post:
 *     summary: Registra una nueva venta de café pergamino
 *     tags: [Ventas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_venta
 *               - cliente
 *               - tipo_cliente
 *               - cantidad_vendida
 *               - precio_kg
 *             properties:
 *               fecha_venta:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la venta
 *               cliente:
 *                 type: string
 *                 description: Nombre del cliente
 *               tipo_cliente:
 *                 type: string
 *                 enum: [Particular, Empresa, Cooperativa]
 *                 description: Tipo de cliente
 *               cantidad_vendida:
 *                 type: number
 *                 description: Cantidad de café vendido (kg)
 *               precio_kg:
 *                 type: number
 *                 description: Precio por kilogramo
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre la venta
 *     responses:
 *       200:
 *         description: Venta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VentaPergamino'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/ventas/registrar/pergamino', isLoteOwner, validateVentaPergamino, ventaController.registrarVentaPergamino);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/ventas/registrar/empacado:
 *   get:
 *     summary: Muestra el formulario para registrar venta de café empacado
 *     tags: [Ventas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     responses:
 *       200:
 *         description: Muestra el formulario de registro de venta de empacado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Lote no encontrado o no hay productos empacados disponibles
 */
router.get('/:id_lote/ventas/registrar/empacado', isLoteOwner, ventaController.mostrarFormularioVentaEmpacado);

/**
 * @swagger
 * /fincas/{id_finca}/lotes/{id_lote}/ventas/registrar/empacado:
 *   post:
 *     summary: Registra una nueva venta de café empacado
 *     tags: [Ventas]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id_finca
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la finca
 *       - in: path
 *         name: id_lote
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del lote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_venta
 *               - cliente
 *               - tipo_cliente
 *               - tipo_producto
 *               - cantidad_empaques
 *               - precio_empaque
 *             properties:
 *               fecha_venta:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la venta
 *               cliente:
 *                 type: string
 *                 description: Nombre del cliente
 *               tipo_cliente:
 *                 type: string
 *                 enum: [Particular, Empresa, Cooperativa]
 *                 description: Tipo de cliente
 *               tipo_producto:
 *                 type: string
 *                 enum: [Grano, Molido, Pasilla Molido]
 *                 description: Tipo de producto vendido
 *               cantidad_empaques:
 *                 type: integer
 *                 description: Cantidad de empaques vendidos
 *               precio_empaque:
 *                 type: number
 *                 description: Precio por empaque
 *               observaciones:
 *                 type: string
 *                 description: Observaciones sobre la venta
 *     responses:
 *       200:
 *         description: Venta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VentaEmpacado'
 *       400:
 *         description: Datos inválidos o incompletos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:id_lote/ventas/registrar/empacado', isLoteOwner, validateVentaEmpacado, ventaController.registrarVentaEmpacado);

// Rutas para VENTA DE PRODUCTO MOLIDO (ELIMINADAS)
// ... existing code ...

module.exports = router; 
