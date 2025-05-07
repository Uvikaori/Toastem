const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams para acceder a :id_finca de la ruta padre
const loteController = require('../controllers/loteController');
const { isAuthenticated } = require('../middlewares/auth'); // Corregido el path y el nombre del middleware
const { validateLote } = require('../validators/loteValidator');
const { validateDespulpado } = require('../validators/despulpadoValidator'); // Validador para despulpado
const { validateFermentacionLavado } = require('../validators/fermentacionLavadoValidator'); // Nuevo validador
const { validateZarandeo } = require('../validators/zarandeoValidator'); // Nuevo validador
const { validateInicioSecado, validateFinSecado } = require('../validators/secadoValidator'); // Ahora importa ambos
const { validateClasificacion } = require('../validators/clasificacionAtributosValidator'); // Nuevo validador
const { validateTrilla } = require('../validators/trillaValidator'); // Nuevo validador
const RecoleccionController = require('../controllers/recoleccionController');

// Aplicar autenticación a todas las rutas de lotes
router.use(isAuthenticated);

// Mostrar formulario para crear un nuevo lote para una finca
router.get('/crear', loteController.mostrarFormularioCrearLote);

// Procesar la creación de un nuevo lote
router.post('/crear', validateLote, loteController.crearLote);

// Listar todos los lotes de una finca
router.get('/', loteController.listarLotesPorFinca);

// Vista general de procesos de un lote
router.get('/:id_lote/procesos', loteController.mostrarVistaProcesosLote);

// Rutas para el proceso de DESPULPADO
router.get('/:id_lote/despulpado/registrar', loteController.mostrarFormularioDespulpado);
router.post('/:id_lote/despulpado', validateDespulpado, loteController.registrarDespulpado);

// Rutas para el proceso de FERMENTACIÓN Y LAVADO
router.get('/:id_lote/fermentacion-lavado/registrar', loteController.mostrarFormularioFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado', validateFermentacionLavado, loteController.registrarFermentacionLavado);

// Rutas para el proceso de ZARANDEO
router.get('/:id_lote/zarandeo/registrar', loteController.mostrarFormularioZarandeo);
router.post('/:id_lote/zarandeo', validateZarandeo, loteController.registrarZarandeo);

// Rutas para el proceso de SECADO
router.get('/:id_lote/secado/iniciar', loteController.mostrarFormularioInicioSecado);
router.post('/:id_lote/secado/iniciar', validateInicioSecado, loteController.registrarInicioSecado);
router.get('/:id_lote/secado/finalizar', loteController.mostrarFormularioFinSecado);
router.post('/:id_lote/secado/finalizar', validateFinSecado, loteController.registrarFinSecado);

// Rutas para el proceso de CLASIFICACIÓN POR ATRIBUTOS
router.get('/:id_lote/clasificacion/registrar', loteController.mostrarFormularioClasificacion);
router.post('/:id_lote/clasificacion', validateClasificacion, loteController.registrarClasificacion);

// Rutas para el proceso de TRILLA
router.get('/:id_lote/trilla/registrar', loteController.mostrarFormularioTrilla);
router.post('/:id_lote/trilla', validateTrilla, loteController.registrarTrilla);

// Rutas para recolección
router.get('/recoleccion', isAuthenticated, RecoleccionController.mostrarFormulario);
router.post('/recoleccion', isAuthenticated, RecoleccionController.registrarRecoleccion);

// TODO: Rutas para otros procesos (Clasificación, Trilla, etc.)

module.exports = router; 