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
// const { validateEmpacado } = require('../validators/empacadoValidator'); 
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
router.get('/:id_lote/despulpado/registrar', isLoteOwner, despulpadoController.mostrarFormularioDespulpado);
router.post('/:id_lote/despulpado/registrar', isLoteOwner, validateDespulpado, despulpadoController.registrarDespulpado);
router.post('/:id_lote/despulpado/:id_despulpado/reiniciar', isLoteOwner, despulpadoController.reiniciarProcesoDespulpado);

// Rutas para el proceso de FERMENTACIÓN Y LAVADO
router.get('/:id_lote/fermentacion-lavado/registrar', isLoteOwner, fermentacionLavadoController.mostrarFormularioFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado/registrar', isLoteOwner, validateFermentacionLavado, fermentacionLavadoController.registrarFermentacionLavado);
router.post('/:id_lote/fermentacion-lavado/:id_fermentacion/reiniciar', isLoteOwner, fermentacionLavadoController.reiniciarProcesoFermentacionLavado);

// Rutas para el proceso de ZARANDEO
router.get('/:id_lote/zarandeo/registrar', isLoteOwner, zarandeoController.mostrarFormularioZarandeo);
router.post('/:id_lote/zarandeo/registrar', isLoteOwner, validateZarandeo, zarandeoController.registrarZarandeo);
router.post('/:id_lote/zarandeo/reiniciar', isLoteOwner, zarandeoController.reiniciarProcesoZarandeo);

// Rutas para el proceso de SECADO
router.get('/:id_lote/secado/iniciar', isLoteOwner, secadoController.mostrarFormularioInicioSecado);
router.post('/:id_lote/secado/iniciar', isLoteOwner, validateInicioSecado, secadoController.registrarInicioSecado);
router.get('/:id_lote/secado/finalizar', isLoteOwner, secadoController.mostrarFormularioFinSecado);
router.post('/:id_lote/secado/finalizar', isLoteOwner, validateFinSecado, secadoController.registrarFinSecado);
router.get('/:id_lote/secado/corregir-inicio', isLoteOwner, secadoController.mostrarFormularioCorregirInicioSecado);
router.post('/:id_lote/secado/corregir-inicio', isLoteOwner, secadoController.corregirDatosInicioSecado);
router.post('/:id_lote/secado/:id_secado/reiniciar', isLoteOwner, secadoController.reiniciarProcesoSecado);
// Nuevas rutas para el seguimiento de secado
router.get('/:id_lote/secado/seguimiento', isLoteOwner, secadoController.mostrarFormularioSeguimientoSecado);
router.post('/:id_lote/secado/seguimiento', isLoteOwner, secadoController.procesarSeguimientoSecado);

// Rutas para el proceso de CLASIFICACIÓN POR ATRIBUTOS
router.get('/:id_lote/clasificacion/registrar', isLoteOwner, clasificacionController.mostrarFormularioClasificacion);
router.post('/:id_lote/clasificacion', isLoteOwner, validateClasificacion, clasificacionController.registrarClasificacion);
router.post('/:id_lote/clasificacion/:id_clasificacion/reiniciar', isLoteOwner, clasificacionController.reiniciarProcesoClasificacion);

// Rutas para el proceso de TRILLA
router.get('/:id_lote/trilla/registrar', isLoteOwner, trillaController.mostrarFormularioTrilla);
router.post('/:id_lote/trilla', isLoteOwner, validateTrilla, trillaController.registrarTrilla);
router.post('/:id_lote/trilla/:id_trilla/reiniciar', isLoteOwner, trillaController.reiniciarProcesoTrilla);

// Rutas para el proceso de TUESTE
router.get('/:id_lote/tueste/registrar', isLoteOwner, tuesteController.mostrarFormularioTueste);
router.post('/:id_lote/tueste', isLoteOwner, validateTueste, tuesteController.registrarTueste);
router.post('/:id_lote/tueste/:id_tueste/reiniciar', isLoteOwner, tuesteController.reiniciarProcesoTueste);

// Rutas para el proceso de MOLIENDA
router.get('/:id_lote/molienda/registrar', isLoteOwner, moliendaController.mostrarFormularioMolienda);
router.post('/:id_lote/molienda', isLoteOwner, moliendaController.middlewares.cargarDatosTueste, validateMolienda, moliendaController.registrarMolienda);
// La ruta específica debe ir antes que la paramétrica para evitar conflictos
router.post('/:id_lote/molienda/reiniciar', isLoteOwner, moliendaController.reiniciarProcesoMoliendaCompleto);
router.post('/:id_lote/molienda/:id_molienda/reiniciar', isLoteOwner, moliendaController.reiniciarProcesoMolienda);

// Rutas para el proceso de EMPACADO
router.get('/:id_lote/empacado/registrar', isLoteOwner, empacadoController.mostrarFormularioEmpacado);
router.post('/:id_lote/empacado', isLoteOwner, empacadoController.registrarEmpacado);
router.post('/:id_lote/empacado/:id_empacado/reiniciar', isLoteOwner, empacadoController.reiniciarProcesoEmpacado);
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

// Rutas para el proceso de VENTA
router.get('/:id_lote/ventas/registrar/pergamino', isLoteOwner, ventaController.mostrarFormularioVentaPergamino);
router.post('/:id_lote/ventas/registrar/pergamino', isLoteOwner, validateVentaPergamino, ventaController.registrarVentaPergamino);

// Rutas para VENTA DE PRODUCTO EMPACADO
router.get('/:id_lote/ventas/registrar/empacado', isLoteOwner, ventaController.mostrarFormularioVentaEmpacado);
router.post('/:id_lote/ventas/registrar/empacado', isLoteOwner, validateVentaEmpacado, ventaController.registrarVentaEmpacado);

// Rutas para VENTA DE PRODUCTO MOLIDO (ELIMINADAS)
// router.get('/:id_lote/ventas/registrar/molido', isLoteOwner, ventaController.mostrarFormularioVentaMolido);
// router.post('/:id_lote/ventas/registrar/molido', isLoteOwner, validateVentaPergamino, ventaController.registrarVentaMolido);

module.exports = router; 
