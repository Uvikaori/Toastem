const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams para acceder a :id_finca de la ruta padre
const loteController = require('../controllers/loteController');
const { isAuthenticated, isLoteOwner } = require('../middlewares/auth'); // Importamos isLoteOwner
const { validateLote } = require('../validators/loteValidator');
const { validateDespulpado } = require('../validators/despulpadoValidator'); // Validador para despulpado
const { validateFermentacionLavado } = require('../validators/fermentacionLavadoValidator'); // Nuevo validador
const { validateZarandeo } = require('../validators/zarandeoValidator'); // Nuevo validador
const { validateInicioSecado, validateFinSecado } = require('../validators/secadoValidator'); // Ahora importa ambos
const { validateClasificacion } = require('../validators/clasificacionAtributosValidator'); // Nuevo validador
const { validateTrilla } = require('../validators/trillaValidator'); // Nuevo validador

// No necesitamos aplicar isAuthenticated aquí porque ya se aplicó en las rutas de fincas
// que incluyen estas rutas de lotes

// Mostrar formulario para crear un nuevo lote para una finca
router.get('/crear', loteController.mostrarFormularioCrearLote);

// Procesar la creación de un nuevo lote
router.post('/crear', validateLote, loteController.crearLote);

// Listar todos los lotes de una finca
router.get('/', loteController.listarLotesPorFinca);

// Vista general de procesos de un lote
router.get('/:id_lote/procesos', isLoteOwner, loteController.mostrarVistaProcesosLote);

// Rutas para el proceso de DESPULPADO
router.get('/:id_lote/despulpado/registrar', isLoteOwner, loteController.mostrarFormularioDespulpado);
router.post('/:id_lote/despulpado', isLoteOwner, validateDespulpado, loteController.registrarDespulpado);

// Rutas para el proceso de FERMENTACIÓN Y LAVADO
router.get('/:id_lote/fermentacion-lavado/registrar', isLoteOwner, loteController.mostrarFormularioFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado', isLoteOwner, validateFermentacionLavado, loteController.registrarFermentacionLavado);

// Rutas para el proceso de ZARANDEO
router.get('/:id_lote/zarandeo/registrar', isLoteOwner, loteController.mostrarFormularioZarandeo);
router.post('/:id_lote/zarandeo', isLoteOwner, validateZarandeo, loteController.registrarZarandeo);

// Rutas para el proceso de SECADO
router.get('/:id_lote/secado/iniciar', isLoteOwner, loteController.mostrarFormularioInicioSecado);
router.post('/:id_lote/secado/iniciar', isLoteOwner, validateInicioSecado, loteController.registrarInicioSecado);
router.get('/:id_lote/secado/finalizar', isLoteOwner, loteController.mostrarFormularioFinSecado);
router.post('/:id_lote/secado/finalizar', isLoteOwner, validateFinSecado, loteController.registrarFinSecado);

// Rutas para el proceso de CLASIFICACIÓN POR ATRIBUTOS
router.get('/:id_lote/clasificacion/registrar', isLoteOwner, loteController.mostrarFormularioClasificacion);
router.post('/:id_lote/clasificacion', isLoteOwner, validateClasificacion, loteController.registrarClasificacion);

// Rutas para el proceso de TRILLA
router.get('/:id_lote/trilla/registrar', isLoteOwner, loteController.mostrarFormularioTrilla);
router.post('/:id_lote/trilla', isLoteOwner, validateTrilla, loteController.registrarTrilla);

// TODO: Rutas para otros procesos (Clasificación, Trilla, etc.)

module.exports = router; 