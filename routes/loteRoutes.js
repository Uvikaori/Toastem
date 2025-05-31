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
const { validateControlCalidad } = require('../validators/controlCalidadValidator'); 
const despulpadoController = require('../controllers/despulpadoController');
const fermentacionLavadoController = require('../controllers/fermentacionLavadoController');


// Mostrar formulario para crear un nuevo lote para una finca
router.get('/crear', loteController.mostrarFormularioCrearLote);

// Procesar la creación de un nuevo lote
router.post('/crear', validateLote, loteController.crearLote);

// Listar todos los lotes de una finca
router.get('/', loteController.listarLotesPorFinca);

// Vista general de procesos de un lote
router.get('/:id_lote/procesos', isLoteOwner, loteController.mostrarVistaProcesosLote);

// Vista de flujo completo del lote (usando vista_flujo_lote)
router.get('/:id_lote/flujo', isLoteOwner, loteController.mostrarFlujoLote);

// Rutas para el proceso de DESPULPADO
router.get('/:id_lote/despulpado/registrar', despulpadoController.mostrarFormularioDespulpado);
router.post('/:id_lote/despulpado/registrar', despulpadoController.registrarDespulpado);
router.post('/:id_lote/despulpado/:id_despulpado/reiniciar', despulpadoController.reiniciarProcesoDespulpado);

// Rutas para el proceso de FERMENTACIÓN Y LAVADO
router.get('/:id_lote/fermentacion-lavado/registrar', fermentacionLavadoController.mostrarFormularioFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado/registrar', validateFermentacionLavado, fermentacionLavadoController.registrarFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado/:id_fermentacion/reiniciar', fermentacionLavadoController.reiniciarProcesoFermentacionLavado);

// Rutas para el proceso de ZARANDEO
router.get('/:id_lote/zarandeo/registrar', isLoteOwner, loteController.mostrarFormularioZarandeo);
router.post('/:id_lote/zarandeo', isLoteOwner, validateZarandeo, loteController.registrarZarandeo);

// Rutas para el proceso de SECADO
router.get('/:id_lote/secado/iniciar', isLoteOwner, loteController.mostrarFormularioInicioSecado);
router.post('/:id_lote/secado/iniciar', isLoteOwner, validateInicioSecado, loteController.registrarInicioSecado);
router.get('/:id_lote/secado/finalizar', isLoteOwner, loteController.mostrarFormularioFinSecado);
router.post('/:id_lote/secado/finalizar', isLoteOwner, validateFinSecado, loteController.registrarFinSecado);
router.get('/:id_lote/secado/corregir-inicio', isLoteOwner, loteController.mostrarFormularioCorregirInicioSecado);
router.post('/:id_lote/secado/corregir-inicio', isLoteOwner, loteController.corregirDatosInicioSecado);

// Rutas para el proceso de CLASIFICACIÓN POR ATRIBUTOS
router.get('/:id_lote/clasificacion/registrar', isLoteOwner, loteController.mostrarFormularioClasificacion);
router.post('/:id_lote/clasificacion', isLoteOwner, validateClasificacion, loteController.registrarClasificacion);

// Rutas para el proceso de TRILLA
router.get('/:id_lote/trilla/registrar', isLoteOwner, loteController.mostrarFormularioTrilla);
router.post('/:id_lote/trilla', isLoteOwner, validateTrilla, loteController.registrarTrilla);

// Rutas para el proceso de TUESTE
router.get('/:id_lote/tueste/registrar', isLoteOwner, loteController.mostrarFormularioTueste);
router.post('/:id_lote/tueste', isLoteOwner, validateTueste, loteController.registrarTueste);

// Rutas para el proceso de MOLIENDA (Opcional)
router.get('/:id_lote/molienda/registrar', isLoteOwner, loteController.mostrarFormularioMolienda);
router.post('/:id_lote/molienda', isLoteOwner, validateMolienda, loteController.registrarMolienda);

// Rutas para el proceso de EMPACADO (Opcional)
router.get('/:id_lote/empacado/registrar', isLoteOwner, loteController.mostrarFormularioEmpacado);
router.post('/:id_lote/empacado', isLoteOwner, validateEmpacado, loteController.registrarEmpacado);

// Rutas para el proceso de CONTROL DE CALIDAD (Opcional)
router.get('/:id_lote/control-calidad/registrar', isLoteOwner, loteController.mostrarFormularioControlCalidad);
router.post('/:id_lote/control-calidad', isLoteOwner, validateControlCalidad, loteController.registrarControlCalidad);

// Rutas para gestión de correcciones y cancelaciones
router.get('/:id_lote/cancelar', isLoteOwner, loteController.mostrarFormularioCancelarLote);
router.post('/:id_lote/cancelar', isLoteOwner, loteController.cancelarLote);
router.get('/:id_lote/duplicar', isLoteOwner, loteController.mostrarFormularioDuplicarLote);
router.post('/:id_lote/duplicar', isLoteOwner, loteController.duplicarLote);
// router.post('/:id_lote/fermentacion-lavado/:id_fermentacion/reiniciar', isLoteOwner, loteController.reiniciarProcesoFermentacionLavado);
router.post('/:id_lote/recoleccion/corregir', isLoteOwner, loteController.corregirProcesoRecoleccion);
router.post('/:id_lote/zarandeo/:id_zarandeo/reiniciar', isLoteOwner, loteController.reiniciarProcesoZarandeo);
router.post('/:id_lote/secado/:id_secado/reiniciar', isLoteOwner, loteController.reiniciarProcesoSecado);
router.post('/:id_lote/clasificacion/:id_clasificacion/reiniciar', isLoteOwner, loteController.reiniciarProcesoClasificacion);
router.post('/:id_lote/trilla/:id_trilla/reiniciar', isLoteOwner, loteController.reiniciarProcesoTrilla);
router.post('/:id_lote/tueste/:id_tueste/reiniciar', isLoteOwner, loteController.reiniciarProcesoTueste);

module.exports = router; 