const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams para acceder a :id_finca de la ruta padre
const loteController = require('../controllers/loteController');
const { isAuthenticated, isLoteOwner } = require('../middlewares/auth'); // Importamos isLoteOwner
const { validateLote } = require('../validators/loteValidator');
const { validateDespulpado } = require('../validators/despulpadoValidator'); // Validador para despulpado
const { validateFermentacionLavado } = require('../validators/fermentacionLavadoValidator'); // Nuevo validador
const { validateZarandeo } = require('../validators/zarandeoValidator'); // Nuevo validador
const { validateInicioSecado, validateFinSecado } = require('../validators/secadoValidator'); // Validadores de secado
const { validateClasificacion } = require('../validators/clasificacionAtributosValidator'); // Nuevo validador
const { validateTrilla } = require('../validators/trillaValidator'); // Nuevo validador
const { validateTueste } = require('../validators/tuesteValidator'); // Nuevo validador para tueste
const { validateMolienda } = require('../validators/moliendaValidator'); // Nuevo validador para molienda
const { validateEmpacado } = require('../validators/empacadoValidator'); // Nuevo validador para empacado
const { validateControlCalidad } = require('../validators/controlCalidadValidator'); // Nuevo validador para control de calidad

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

// Vista de flujo completo del lote (usando vista_flujo_lote)
router.get('/:id_lote/flujo', isLoteOwner, loteController.mostrarFlujoLote);

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
router.post('/:id_lote/despulpado/:id_despulpado/reiniciar', isLoteOwner, loteController.reiniciarProcesoDespulpado);
router.post('/:id_lote/fermentacion-lavado/:id_fermentacion/reiniciar', isLoteOwner, loteController.reiniciarProcesoFermentacionLavado);
router.post('/:id_lote/recoleccion/corregir', isLoteOwner, loteController.corregirProcesoRecoleccion);
router.post('/:id_lote/zarandeo/:id_zarandeo/reiniciar', isLoteOwner, loteController.reiniciarProcesoZarandeo);
router.post('/:id_lote/secado/:id_secado/reiniciar', isLoteOwner, loteController.reiniciarProcesoSecado);
router.post('/:id_lote/clasificacion/:id_clasificacion/reiniciar', isLoteOwner, loteController.reiniciarProcesoClasificacion);
router.post('/:id_lote/trilla/:id_trilla/reiniciar', isLoteOwner, loteController.reiniciarProcesoTrilla);
router.post('/:id_lote/tueste/:id_tueste/reiniciar', isLoteOwner, loteController.reiniciarProcesoTueste);

module.exports = router; 