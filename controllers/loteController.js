const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO'); // Para obtener info de la finca
const procesosDAO = require('../models/dao/procesosDAO'); // DAO para la tabla `procesos`
const despulpadoDAO = require('../models/dao/despulpadoDAO'); // DAO para la tabla `despulpado`
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO'); // Nuevo DAO
const zarandeoDAO = require('../models/dao/zarandeoDAO'); // Nuevo DAO
const secadoDAO = require('../models/dao/secadoDAO'); // Nuevo DAO
const clasificacionDAO = require('../models/dao/clasificacionDAO'); // Renombrado y actualizado
const trillaDAO = require('../models/dao/trillaDAO'); // Nuevo DAO
const tuesteDAO = require('../models/dao/tuesteDAO'); // Nuevo DAO para tueste
const moliendaDAO = require('../models/dao/moliendaDAO');
const empacadoDAO = require('../models/dao/empacadoDAO');
const controlCalidadDAO = require('../models/dao/controlCalidadDAO');
const db = require('../config/database'); // Importar la conexión a la base de datos
const Lote = require('../models/entities/Lote');
const Despulpado = require('../models/entities/Despulpado'); // Entidad Despulpado
const FermentacionLavado = require('../models/entities/FermentacionLavado'); // Nueva entidad
const Zarandeo = require('../models/entities/Zarandeo'); // Nueva entidad
const Secado = require('../models/entities/Secado'); // Nueva entidad
const Clasificacion = require('../models/entities/Clasificacion'); // Renombrado de ClasificacionAtributos
const Trilla = require('../models/entities/Trilla'); // Nueva entidad
const Tueste = require('../models/entities/Tueste'); // Nueva entidad para tueste
const Molienda = require('../models/entities/Molienda');
const Empacado = require('../models/entities/Empacado');
const ControlCalidad = require('../models/entities/ControlCalidad');
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../utils/helpers'); // Si se usa para algo

class LoteController {

    /**
     * Muestra el formulario para crear un nuevo lote para una finca específica.
     */
    async mostrarFormularioCrearLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            if (isNaN(id_finca)) {
                req.flash('error', 'ID de finca inválido.');
                return res.redirect('/fincas/gestionar');
            }

            // Verificar que la finca pertenece al usuario (o existe)
            // Esta lógica podría estar en un middleware o servicio
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id); // Asumiendo que existe este método en fincaDAO
            if (!finca) {
                req.flash('error', 'Finca no encontrada o no tiene permiso para accederla.');
                return res.redirect('/fincas/gestionar');
            }

            res.render('lotes/crear', {
                titulo: `Crear Lote para Finca: ${finca.nombre}`,
                id_finca: id_finca,
                nombre_finca: finca.nombre,
                // Para repoblar el formulario en caso de error
                fecha_recoleccion: req.flash('fecha_recoleccion')[0] || '',
                peso_inicial: req.flash('peso_inicial')[0] || '',
                tipo_cafe: req.flash('tipo_cafe')[0] || '',
                tipo_recoleccion: req.flash('tipo_recoleccion')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de crear lote:', error);
            req.flash('error', 'Error al cargar el formulario para crear lotes.');
            // Si id_finca es válido, redirigir a la gestión de esa finca, sino a la general
            const id_finca_param = req.params.id_finca ? parseInt(req.params.id_finca) : null;
            if (id_finca_param && !isNaN(id_finca_param)){
                res.redirect(`/fincas/${id_finca_param}/lotes`);
            } else {
                res.redirect('/fincas/gestionar');
            }
        }
    }

    /**
     * Procesa la creación de un nuevo lote.
     */
    async crearLote(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // En lugar de usar flash, pasamos los errores directamente a la vista
            return res.render('lotes/crear', {
                titulo: 'Crear Nuevo Lote',
                id_finca: id_finca,
                nombre_finca: req.body.nombre_finca,
                fecha_recoleccion: req.body.fecha_recoleccion,
                peso_inicial: req.body.peso_inicial,
                tipo_cafe: req.body.tipo_cafe,
                tipo_recoleccion: req.body.tipo_recoleccion,
                observaciones: req.body.observaciones,
                error: errors.array().map(e => e.msg)
            });
        }

        try {
            if (isNaN(id_finca)) {
                return res.render('lotes/crear', {
                    titulo: 'Crear Nuevo Lote',
                    id_finca: id_finca,
                    nombre_finca: req.body.nombre_finca,
                    fecha_recoleccion: req.body.fecha_recoleccion,
                    peso_inicial: req.body.peso_inicial,
                    tipo_cafe: req.body.tipo_cafe,
                    tipo_recoleccion: req.body.tipo_recoleccion,
                    observaciones: req.body.observaciones,
                    error: ['ID de finca inválido.']
                });
            }

            const { fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones } = req.body;
            const id_usuario = req.session.usuario.id;

            const codigoLote = await loteDAO.generarCodigoLoteUnico(id_finca);

            const nuevoLote = new Lote(
                null,
                codigoLote,
                id_usuario,
                id_finca,
                fecha_recoleccion,
                peso_inicial,
                tipo_cafe,
                tipo_recoleccion,
                observaciones
            );

            await loteDAO.createLote(nuevoLote);
            req.flash('mensaje', `Lote ${codigoLote} creado exitosamente.`);
            res.redirect(`/fincas/${id_finca}/lotes`);

        } catch (error) {
            console.error('Error al crear lote:', error);
            return res.render('lotes/crear', {
                titulo: 'Crear Nuevo Lote',
                id_finca: id_finca,
                nombre_finca: req.body.nombre_finca,
                fecha_recoleccion: req.body.fecha_recoleccion,
                peso_inicial: req.body.peso_inicial,
                tipo_cafe: req.body.tipo_cafe,
                tipo_recoleccion: req.body.tipo_recoleccion,
                observaciones: req.body.observaciones,
                error: ['Error interno al crear el lote.']
            });
        }
    }

    /**
     * Muestra la lista de lotes para una finca específica.
     */
    async listarLotesPorFinca(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            if (isNaN(id_finca)) {
                req.flash('error', 'ID de finca inválido.');
                return res.redirect('/fincas/gestionar');
            }

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                req.flash('error', 'Finca no encontrada o no tiene permiso para accederla.');
                return res.redirect('/fincas/gestionar');
            }

            const lotes = await loteDAO.getLotesByFincaId(id_finca);

            res.render('lotes/gestionar', {
                titulo: `Lotes de la Finca: ${finca.nombre}`,
                finca: finca,
                lotes: lotes,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al listar lotes por finca:', error);
            req.flash('error', 'Error al cargar los lotes de la finca.');
            const id_finca_param = req.params.id_finca ? parseInt(req.params.id_finca) : null;
            if (id_finca_param && !isNaN(id_finca_param)){
                 res.redirect(`/fincas/${id_finca_param}/lotes`);
            } else {
                 res.redirect('/fincas/gestionar');
            }
        }
    }

    /**
     * Muestra la vista general de todos los procesos para un lote específico.
     */
    async mostrarVistaProcesosLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Obtener la finca y el lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                req.flash('error', 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                req.flash('error', 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const todosLosProcesosDefinidos = await procesosDAO.getAllProcesosOrdenados();
            
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);
            const moliendaInfo = await moliendaDAO.getMoliendaByLoteId(id_lote);
            const empacadoInfo = await empacadoDAO.getEmpacadoByLoteId(id_lote);
            const controlCalidadInfo = await controlCalidadDAO.getControlCalidadByLoteId(id_lote);

            const procesosConEstado = todosLosProcesosDefinidos.map(procesoDef => {
                let etapaInfo = null;
                
                switch (procesoDef.nombre.toLowerCase()) {
                    case 'recolección':
                        etapaInfo = { id_estado_proceso: 3 };
                        break;
                    case 'despulpado':
                        etapaInfo = despulpadoInfo;
                        break;
                    case 'fermentación y lavado':
                        etapaInfo = fermentacionInfo;
                        break;
                    case 'zarandeo':
                        etapaInfo = zarandeoInfo;
                        break;
                    case 'secado': 
                        etapaInfo = secadoInfo;
                        break;
                    case 'clasificación':  
                        etapaInfo = clasificacionInfo;
                        break;
                    case 'trilla':
                        etapaInfo = trillaInfo;
                        break;
                    case 'tueste':
                        etapaInfo = tuesteInfo;
                        break;
                    case 'molienda':
                        etapaInfo = moliendaInfo;
                        break;
                    case 'empacado':
                        etapaInfo = empacadoInfo;
                        break;
                    case 'control de calidad':
                        etapaInfo = controlCalidadInfo;
                        break;
                }

                return {
                    ...procesoDef,
                    datosEtapa: etapaInfo,
                };
            });

            const mensajeFlash = req.flash('mensaje');
            const mensaje = mensajeFlash && mensajeFlash.length > 0 ? mensajeFlash : null;
            const error = req.flash('error');

            res.render('lotes/procesos', {
                titulo: `Procesos del Lote: ${lote.codigo || lote.codigo_lote}`,
                finca: finca,
                lote: lote,
                procesosConEstado: procesosConEstado,
                mensaje: mensaje,
                error: error
            });

        } catch (error) {
            console.error('Error al mostrar vista de procesos:', error);
            req.flash('error', 'Error al cargar la vista de procesos.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes`);
        }
    }
    
   
   

    
    // --- Controladores para ZARANDEO ---
    async mostrarFormularioZarandeo(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { /* ... manejo error ... */ return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { /* ... manejo error ... */ return res.redirect(`/fincas/${id_finca}/lotes`); }

            const zarandeoExistente = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (zarandeoExistente) {
                req.flash('error', 'El proceso de Zarandeo ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (!fermentacionInfo || fermentacionInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Fermentación y Lavado debe estar completado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/zarandeo-form', {
                titulo: `Registrar Zarandeo - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_fermentacion_final: fermentacionInfo.peso_final,
                fecha_zarandeo: req.flash('fecha_zarandeo')[0] || '',
                peso_final_zarandeo: req.flash('peso_final_zarandeo')[0] || '',
                observaciones_zarandeo: req.flash('observaciones_zarandeo')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de zarandeo:', error);
            req.flash('error', 'Error al cargar el formulario de zarandeo.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarZarandeo(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_zarandeo', req.body.fecha_zarandeo);
            req.flash('peso_final_zarandeo', req.body.peso_final_zarandeo);
            req.flash('observaciones_zarandeo', req.body.observaciones_zarandeo);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);
        }

        try {
            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (!fermentacionInfo || !fermentacionInfo.peso_final) {
                req.flash('error', 'No se encontró el peso final de la fermentación. Asegúrese de que el proceso anterior esté registrado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);
            }

            const zarandeoData = new Zarandeo(
                null, // id
                id_lote,
                fermentacionInfo.peso_final, // Peso inicial para zarandeo
                req.body.fecha_zarandeo,
                req.body.peso_final_zarandeo,
                req.body.observaciones_zarandeo
            );
            
            await zarandeoDAO.createZarandeo(zarandeoData);

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoZarandeoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'zarandeo');

            if (!procesoZarandeoDef) {
                /* ... manejo error ... */ 
                req.flash('error', "Error de configuración: Proceso 'Zarandeo' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoZarandeoDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoZarandeoDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2);

            req.flash('mensaje', 'Proceso de Zarandeo registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            /* ... manejo error ... */
            req.flash('error', 'Error interno al registrar el zarandeo.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);
        }
    }

    // --- Controladores para SECADO (Inicio) ---
    async mostrarFormularioInicioSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o no tiene permiso.');
                return res.redirect('/fincas/gestionar'); 
            }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const secadoExistente = await secadoDAO.getSecadoByLoteId(id_lote);
            if (secadoExistente) {
                req.flash('error', 'El proceso de Secado ya ha sido iniciado o registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`); 
            }

            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (!zarandeoInfo || zarandeoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Zarandeo debe estar completado para iniciar el secado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Obtener la fecha actual en formato datetime-local
            const now = new Date();
            const fechaActual = now.toISOString().slice(0, 16); // Formato: YYYY-MM-DDTHH:mm

            res.render('lotes/procesos/secado-inicio-form', {
                titulo: `Iniciar Proceso de Secado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_zarandeo_final: zarandeoInfo.peso_final || 0,
                fecha_inicio_secado: req.flash('fecha_inicio_secado')[0] || fechaActual,
                metodo_secado: req.flash('metodo_secado')[0] || '',
                humedad_inicial_secado: req.flash('humedad_inicial_secado')[0] || '',
                observaciones_secado: req.flash('observaciones_secado')[0] || '',
                decision_venta: false, // Valor por defecto
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de inicio de secado:', error);
            req.flash('error', 'Error al cargar el formulario de inicio de secado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarInicioSecado(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req); // Usará validateInicioSecado

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_inicio_secado', req.body.fecha_inicio_secado);
            req.flash('metodo_secado', req.body.metodo_secado);
            req.flash('humedad_inicial_secado', req.body.humedad_inicial_secado);
            req.flash('observaciones_secado', req.body.observaciones_secado);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/iniciar`);
        }

        try {
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (!zarandeoInfo || !zarandeoInfo.peso_final) {
                req.flash('error', 'No se encontró el peso final del zarandeo.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/iniciar`);
            }

            // Extraer el peso inicial del formulario (campo hidden)
            const peso_inicial = req.body.peso_inicial_secado || zarandeoInfo.peso_final;
            
            // Determinar si hay decisión de venta (checkbox)
            const decision_venta = req.body.decision_venta ? 1 : 0;
            const fecha_decision = decision_venta ? new Date() : null;

            const secadoData = new Secado(
                null, // id
                id_lote,
                peso_inicial, // Ahora obtenemos del formulario o fallback al zarandeo
                req.body.fecha_inicio_secado,
                req.body.metodo_secado,
                req.body.humedad_inicial_secado || null,
                null, // fecha_fin (se registra al finalizar)
                null, // peso_final (se registra al finalizar)
                req.body.observaciones_secado
                // id_estado_proceso es 2 ('En progreso') por defecto desde la entidad Secado
            );
            
            // Realizar la inserción básica
            const id_secado = await secadoDAO.createSecado(secadoData);
            
            // Actualizar campos adicionales (decision_venta y fecha_decision)
            if (id_secado) {
                await secadoDAO.updateSecado(id_secado, { decision_venta, fecha_decision });
            }

            // Actualizar estado general y proceso actual del LOTE al proceso de Secado
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoSecadoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'secado');

            if (!procesoSecadoDef) {
                req.flash('error', "Error de configuración: Proceso 'Secado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // El lote sigue 'En progreso' (estado 2), pero su proceso actual es 'Secado'
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoSecadoDef.id, 2);

            req.flash('mensaje', 'Proceso de Secado iniciado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar inicio de secado:', error);
            req.flash('error', 'Error interno al registrar el inicio del secado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/iniciar`);
        }
    }

    // TODO: Implementar mostrarFormularioFinSecado y registrarFinSecado más adelante.
    async mostrarFormularioFinSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o no tiene permiso.');
                return res.redirect('/fincas/gestionar'); 
            }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
             }

            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo) {
                req.flash('error', 'El proceso de Secado no ha sido iniciado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            if (secadoInfo.id_estado_proceso === 3) { // 3 = Terminado
                req.flash('info', 'El proceso de Secado ya fue finalizado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            if (secadoInfo.id_estado_proceso !== 1 && secadoInfo.id_estado_proceso !== 2) {
                req.flash('error', 'El proceso de Secado debe estar registrado o en progreso para poder finalizarlo.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/secado-fin-form', {
                titulo: `Finalizar Secado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                secado: secadoInfo, // Pasar la info del secado actual (ej. fecha_inicio)
                fecha_fin_secado: req.flash('fecha_fin_secado')[0] || '',
                peso_final_secado: req.flash('peso_final_secado')[0] || '',
                observaciones_fin_secado: req.flash('observaciones_fin_secado')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de fin de secado:', error);
            req.flash('error', 'Error al cargar el formulario de fin de secado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarFinSecado(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req); 

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_fin_secado', req.body.fecha_fin_secado);
            req.flash('peso_final_secado', req.body.peso_final_secado);
            req.flash('observaciones_fin_secado', req.body.observaciones_fin_secado);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/finalizar`);
        }

        try {
            const secadoActual = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoActual || (secadoActual.id_estado_proceso !== 1 && secadoActual.id_estado_proceso !== 2)) { 
                // Debe existir y estar 'Registrado' (1) o 'En Progreso' (2)
                req.flash('error', 'El proceso de secado no está en estado para ser finalizado o no existe.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Determinar si hay decisión de venta (checkbox)
            const decision_venta = req.body.decision_venta ? 1 : 0;
            const fecha_decision = decision_venta ? new Date() : null;

            const datosActualizacion = {
                fecha_fin: req.body.fecha_fin_secado,
                peso_final: req.body.peso_final_secado,
                observaciones: req.body.observaciones_fin_secado,
                decision_venta: decision_venta,
                fecha_decision: fecha_decision,
                id_estado_proceso: 3 // 3 = Terminado
            };

            await secadoDAO.updateSecado(secadoActual.id, datosActualizacion);

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoSecadoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'secado');
            
            if (!procesoSecadoDef) {
                req.flash('error', "Error de configuración: Proceso 'Secado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoSecadoDef.orden + 1));
            
            // Si hay decisión de venta, no continuamos con el siguiente proceso
            let idNuevoProcesoActualParaLote; 
            let nuevoEstadoGeneralLote;
            
            if (decision_venta) {
                // Si hay decisión de venta, marcamos como proceso terminado
                idNuevoProcesoActualParaLote = procesoSecadoDef.id;
                nuevoEstadoGeneralLote = 3; // 3 = Terminado
            } else {
                // De lo contrario, avanzamos al siguiente proceso
                idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoSecadoDef.id;
                nuevoEstadoGeneralLote = siguienteProcesoDef ? 2 : 3; // 2 En progreso, 3 Finalizado Lote
            }

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoGeneralLote);

            req.flash('mensaje', 'Proceso de Secado finalizado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar fin de secado:', error);
            req.flash('error', 'Error interno al registrar el fin del secado.');
            // Repopular campos
            req.flash('fecha_fin_secado', req.body.fecha_fin_secado);
            req.flash('peso_final_secado', req.body.peso_final_secado);
            req.flash('observaciones_fin_secado', req.body.observaciones_fin_secado);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/finalizar`);
        }
    }

   
    async mostrarFormularioClasificacion(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o no tiene permiso.');
                return res.redirect('/fincas/gestionar'); 
            }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || secadoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Secado debe estar completado (Terminado) antes de registrar la Clasificación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Obtener la fecha de finalización del secado como fecha por defecto
            // Si no hay fecha de fin de secado, usar la fecha actual
            let fechaPorDefecto;
            if (secadoInfo.fecha_fin) {
                fechaPorDefecto = new Date(secadoInfo.fecha_fin).toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:mm
            } else {
                const now = new Date();
                fechaPorDefecto = now.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:mm
            }
            
            res.render('lotes/procesos/clasificacion-form', {
                titulo: `Registrar Clasificación - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_secado_final: secadoInfo.peso_final || 0,
                secado_info: secadoInfo,
                fecha_clasificacion: req.flash('fecha_clasificacion')[0] || fechaPorDefecto,
                peso_total: req.flash('peso_total')[0] || '',
                peso_pergamino: req.flash('peso_pergamino')[0] || '',
                peso_pasilla: req.flash('peso_pasilla')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar form de clasificación:', error);
            req.flash('error', 'Error al cargar el formulario de clasificación.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarClasificacion(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_clasificacion', req.body.fecha_clasificacion);
            req.flash('peso_total', req.body.peso_total);
            req.flash('peso_pergamino', req.body.peso_pergamino);
            req.flash('peso_pasilla', req.body.peso_pasilla);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
        }

        try {
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o no tiene permiso.');
                return res.redirect('/fincas/gestionar'); 
            }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || secadoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Secado debe estar completado (Terminado) antes de registrar la Clasificación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const clasificacionExistente = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (clasificacionExistente && clasificacionExistente.id_estado_proceso === 3) {
                req.flash('error', 'La Clasificación ya ha sido registrada para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Si existe en estado 1, actualizar (UPDATE), si no existe, crear (INSERT)
            if (clasificacionExistente && clasificacionExistente.id_estado_proceso === 1) {
                // UPDATE
                await clasificacionDAO.updateClasificacion(clasificacionExistente.id, {
                    peso_inicial: secadoInfo.peso_final,
                    fecha_clasificacion: req.body.fecha_clasificacion,
                    peso_total: req.body.peso_total || null,
                    peso_pergamino: req.body.peso_pergamino || null,
                    peso_pasilla: req.body.peso_pasilla || null,
                    observaciones: req.body.observaciones || null,
                    id_estado_proceso: 3
                });
            } else {
                // INSERT
                const clasificacionData = new Clasificacion(
                    null, // id
                    id_lote,
                    secadoInfo.peso_final, // peso_inicial
                    req.body.fecha_clasificacion,
                    req.body.peso_total || null, // peso_total
                    req.body.peso_pergamino || null, // peso_pergamino
                    req.body.peso_pasilla || null, // peso_pasilla
                    req.body.observaciones || null, // observaciones
                    3 // id_estado_proceso = 3 (Terminado)
                );
                await clasificacionDAO.createClasificacion(clasificacionData);
            }
            
            // Buscar el siguiente proceso después de la clasificación
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoClasificacionDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'clasificación');
            
            if (!procesoClasificacionDef) {
                req.flash('error', "Error de configuración: Proceso 'Clasificación' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoClasificacionDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoClasificacionDef.id;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = 'En progreso', 3 = 'Terminado'
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);
            req.flash('mensaje', 'Clasificación registrada exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
        } catch (error) {
            console.error('Error al registrar clasificación:', error);
            req.flash('error', error.message || 'Error al registrar la clasificación. Por favor, verifica los datos e intenta nuevamente.');
            req.flash('fecha_clasificacion', req.body.fecha_clasificacion);
            req.flash('peso_total', req.body.peso_total);
            req.flash('peso_pergamino', req.body.peso_pergamino);
            req.flash('peso_pasilla', req.body.peso_pasilla); 
            req.flash('observaciones', req.body.observaciones);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
        }
    }

    // --- Controladores para TRILLA ---
    async mostrarFormularioTrilla(req, res) {
        try {
            const { id_finca, id_lote } = req.params;
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            const lote = await loteDAO.getLoteById(id_lote);
            const clasificacion = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            const trilla = await trillaDAO.getTrillaByLoteId(id_lote);

            if (!finca) {
                req.flash('error', 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }

            if (!lote || lote.id_finca !== parseInt(id_finca)) {
                req.flash('error', 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            if (!clasificacion) {
                req.flash('error', 'No se encontró el registro de clasificación para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/trilla-form', {
                titulo: 'Registrar Trilla',
                finca,
                lote,
                peso_clasificado_final: clasificacion.peso_total,
                peso_pergamino: clasificacion.peso_pergamino,
                peso_pasilla: clasificacion.peso_pasilla,
                fecha_trilla: trilla ? trilla.fecha_trilla : new Date().toISOString().slice(0, 16),
                peso_pergamino_final: trilla ? trilla.peso_pergamino_final : '',
                peso_pasilla_final: trilla ? trilla.peso_pasilla_final : '',
                observaciones: trilla ? trilla.observaciones : '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de trilla:', error);
            req.flash('error', 'Error al cargar el formulario de trilla.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarTrilla(req, res) {
        try {
            const { id_finca, id_lote } = req.params;
            const { fecha_trilla, peso_pergamino_final, peso_pasilla_final, observaciones } = req.body;

            // Validar que el lote existe
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote) {
                req.flash('error', 'No se encontró el lote especificado.');
                return res.redirect('/fincas/gestionar');
            }

            // Obtener datos de clasificación
            const clasificacion = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (!clasificacion) {
                req.flash('error', 'No se encontró el registro de clasificación para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Calcular peso final total
            const peso_final = parseFloat(peso_pergamino_final) + parseFloat(peso_pasilla_final);

            // Crear objeto con datos de trilla
            const trillaData = {
                id_lote,
                fecha_trilla,
                peso_pergamino_inicial: clasificacion.peso_pergamino,
                peso_pasilla_inicial: clasificacion.peso_pasilla,
                peso_pergamino_final: parseFloat(peso_pergamino_final),
                peso_pasilla_final: parseFloat(peso_pasilla_final),
                peso_final,
                observaciones
            };

            // Registrar trilla
            await trillaDAO.createTrilla(trillaData);

            // Actualizar estado del lote
            await loteDAO.updateLoteProcesoYEstado(id_lote, 8, 2); // 8 = Tueste, 2 = En progreso

            req.flash('mensaje', 'Trilla registrada exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
        } catch (error) {
            console.error('Error al registrar trilla:', error);
            req.flash('error', 'Error al registrar la trilla.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    // --- Controladores para TUESTE ---
    async mostrarFormularioTueste(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                req.flash('error', 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }
            
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                req.flash('error', 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const tuesteExistente = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (tuesteExistente && tuesteExistente.id_estado_proceso !== 1) {
                req.flash('info', 'El Tueste ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            if (!trillaInfo || trillaInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Trilla debe estar completado antes de registrar el Tueste.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Usar datos del flash si existen, o valores por defecto si no
            const formData = req.flash('formData')[0] || {};
            
            res.render('lotes/procesos/tueste-form', {
                titulo: `Registrar Tueste - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                trilla_info: trillaInfo,
                peso_trilla_final: trillaInfo.peso_final,
                
                // Para café pergamino
                peso_pergamino_inicial: formData.peso_pergamino_inicial || '',
                tipo_calidad_pergamino: formData.tipo_calidad_pergamino || '',
                nivel_tueste_pergamino: formData.nivel_tueste_pergamino || '',
                fecha_tueste_pergamino: formData.fecha_tueste_pergamino || '',
                peso_pergamino_final: formData.peso_pergamino_final || '',
                
                // Para café pasilla
                peso_pasilla_inicial: formData.peso_pasilla_inicial || '',
                tipo_calidad_pasilla: 'Baja', // Siempre 'Baja'
                nivel_tueste_pasilla: 'Alto', // Siempre 'Alto'
                fecha_tueste_pasilla: formData.fecha_tueste_pasilla || '',
                peso_pasilla_final: formData.peso_pasilla_final || '',
                
                // Datos generales
                peso_inicial: formData.peso_inicial || trillaInfo.peso_final || '',
                fecha_tueste: formData.fecha_tueste || new Date().toISOString().split('T')[0],
                peso_final: formData.peso_final || '',
                observaciones: formData.observaciones || '',
                
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar form de tueste:', error);
            req.flash('error', 'Error al cargar el formulario de tueste.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarTueste(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);

        try {
            console.log("Iniciando registro de tueste para lote:", id_lote);
            console.log("Datos recibidos:", JSON.stringify(req.body));
            
            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            if (!trillaInfo) {
                req.flash('error', 'No se encontró información de trilla para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
            }

            // Validar según los requisitos
            const errores = [];

            // 1. Validar que se haya registrado al menos un tipo de café (pergamino o pasilla)
            const tienePergamino = trillaInfo.peso_pergamino_final > 0;
            const tienePasilla = trillaInfo.peso_pasilla_final > 0;
            
            // Validar café pergamino si viene de la trilla
            if (tienePergamino) {
                if (!req.body.peso_pergamino_inicial) {
                    errores.push('Debe ingresar el peso inicial del café pergamino.');
                }
                if (!req.body.tipo_calidad_pergamino) {
                    errores.push('Debe seleccionar la calidad del café pergamino.');
                } else if (!['Premium', 'Normal'].includes(req.body.tipo_calidad_pergamino)) {
                    errores.push('La calidad del café pergamino debe ser Premium o Normal.');
                }
                if (!req.body.nivel_tueste_pergamino) {
                    errores.push('Debe seleccionar el nivel de tueste para el café pergamino.');
                }
                if (!req.body.fecha_tueste_pergamino) {
                    errores.push('Debe ingresar la fecha de tueste del café pergamino.');
                }
                if (!req.body.peso_pergamino_final) {
                    errores.push('Debe ingresar el peso final del café pergamino.');
                }
            }
            
            // Validar café pasilla si viene de la trilla
            if (tienePasilla) {
                if (!req.body.peso_pasilla_inicial) {
                    errores.push('Debe ingresar el peso inicial del café pasilla.');
                }
                if (req.body.tipo_calidad_pasilla !== 'Baja') {
                    errores.push('La calidad del café pasilla debe ser Baja.');
                }
                if (req.body.nivel_tueste_pasilla !== 'Alto') {
                    errores.push('El nivel de tueste del café pasilla debe ser Alto.');
                }
                if (!req.body.fecha_tueste_pasilla) {
                    errores.push('Debe ingresar la fecha de tueste del café pasilla.');
                }
                if (!req.body.peso_pasilla_final) {
                    errores.push('Debe ingresar el peso final del café pasilla.');
                }
            }

            // Validar fecha general de registro
            if (!req.body.fecha_tueste) {
                errores.push('Debe ingresar la fecha de registro del tueste.');
            }

            // Si hay errores, devolver al formulario
            if (errores.length > 0) {
                req.flash('error', errores);
                req.flash('formData', req.body);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
            }

            // Calcular peso final total (suma de pergamino y pasilla)
            const pesoPergaminoFinal = parseFloat(req.body.peso_pergamino_final || 0);
            const pesoPasillaFinal = parseFloat(req.body.peso_pasilla_final || 0);
            const pesoFinalTotal = pesoPergaminoFinal + pesoPasillaFinal;

            console.log("Peso final calculado:", pesoFinalTotal);

            // Crear objeto tueste con todos los datos
            const tuesteData = {
                id_lote: id_lote,
                fecha_tueste: req.body.fecha_tueste,
                peso_inicial: trillaInfo.peso_final,
                
                // Datos pergamino
                peso_pergamino_inicial: tienePergamino ? req.body.peso_pergamino_inicial : null,
                tipo_calidad_pergamino: tienePergamino ? req.body.tipo_calidad_pergamino : null,
                nivel_tueste_pergamino: tienePergamino ? req.body.nivel_tueste_pergamino : null,
                fecha_tueste_pergamino: tienePergamino ? req.body.fecha_tueste_pergamino : null,
                peso_pergamino_final: tienePergamino ? req.body.peso_pergamino_final : null,
                
                // Datos pasilla
                peso_pasilla_inicial: tienePasilla ? req.body.peso_pasilla_inicial : null,
                tipo_calidad_pasilla: tienePasilla ? req.body.tipo_calidad_pasilla : null,
                nivel_tueste_pasilla: tienePasilla ? req.body.nivel_tueste_pasilla : null,
                fecha_tueste_pasilla: tienePasilla ? req.body.fecha_tueste_pasilla : null,
                peso_pasilla_final: tienePasilla ? req.body.peso_pasilla_final : null,
                
                peso_final: pesoFinalTotal,
                observaciones: req.body.observaciones || null,
                id_estado_proceso: 3 // Terminado
            };
            
            console.log("Datos de tueste a registrar:", JSON.stringify(tuesteData));
            
            // Registrar tueste en la base de datos
            try {
                await tuesteDAO.createTueste(tuesteData);
                console.log("Tueste registrado correctamente en la base de datos");
            } catch (dbError) {
                console.error("Error en la inserción en la base de datos:", dbError);
                throw new Error(`Error en la base de datos: ${dbError.message}`);
            }

            // Actualizar estado general y proceso actual del LOTE
            // Buscar el ID del proceso de tueste o usar el último proceso disponible
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoTuesteDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'tueste');
            const procesoId = procesoTuesteDef ? procesoTuesteDef.id : todosLosProcesos[todosLosProcesos.length - 1].id;
            
            // Encontrar el siguiente proceso en la secuencia, basado en el campo 'orden'
            const ordenProcesoTueste = procesoTuesteDef ? procesoTuesteDef.orden : 0;
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (ordenProcesoTueste + 1));
            
            // Si hay un siguiente proceso, marcar como "En progreso", sino "Finalizado"
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoId;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = En progreso, 3 = Finalizado
            
            console.log("Actualizando estado del lote:", {
                idNuevoProcesoActualParaLote,
                nuevoEstadoLote
            });
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);

            req.flash('mensaje', 'Tueste registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar tueste:', error);
            req.flash('error', `Error interno al registrar el tueste: ${error.message || 'Error desconocido'}`);
            req.flash('formData', req.body);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
        }
    }

    /**
     * Muestra el formulario para registrar el proceso de molienda.
     */
    async mostrarFormularioMolienda(req, res) {
        try {
            const id_lote = parseInt(req.params.id_lote);
            const lote = req.lote;

            // Verificar si ya existe un registro de molienda
            const moliendaExistente = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (moliendaExistente) {
                req.flash('error', 'Ya existe un registro de molienda para este lote.');
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/molienda', {
                titulo: 'Registrar Molienda',
                lote: lote,
                finca: req.finca,
                fecha_molienda: req.flash('fecha_molienda')[0] || '',
                peso_inicial: req.flash('peso_inicial')[0] || '',
                tipo_molienda: req.flash('tipo_molienda')[0] || '',
                peso_final: req.flash('peso_final')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de molienda:', error);
            req.flash('error', 'Error al cargar el formulario de molienda.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de molienda.
     */
    async registrarMolienda(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_molienda', req.body.fecha_molienda);
            req.flash('peso_inicial', req.body.peso_inicial);
            req.flash('tipo_molienda', req.body.tipo_molienda);
            req.flash('peso_final', req.body.peso_final);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }

        try {
            const id_lote = parseInt(req.params.id_lote);
            
            // Primero, obtener el id_tueste para este lote
            const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (!tuesteInfo) {
                req.flash('error', 'No se encontró registro de tueste para este lote. Debe registrar el tueste primero.');
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const {
                fecha_molienda,
                peso_inicial,
                tipo_molienda,
                peso_final,
                es_grano,
                observaciones
            } = req.body;

            const molienda = new Molienda(
                null,
                tuesteInfo.id, // id_tueste en lugar de id_lote
                fecha_molienda,
                peso_inicial,
                tipo_molienda,
                peso_final,
                es_grano === 'on' || es_grano === true, // Convertir checkbox en booleano
                null, // cantidad (puede ser calculada o dejada en null)
                observaciones,
                3 // Terminado
            );

            await moliendaDAO.createMolienda(molienda);
            
            // Actualizar estado general y proceso actual del LOTE
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoMoliendaDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'molienda');

            if (!procesoMoliendaDef) {
                req.flash('error', "Error de configuración: Proceso 'Molienda' no encontrado.");
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoMoliendaDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoMoliendaDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2); // 2 = 'En progreso'
            
            req.flash('mensaje', 'Proceso de molienda registrado exitosamente.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar molienda:', error);
            req.flash('error', 'Error al registrar el proceso de molienda.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
    }

    /**
     * Muestra el formulario para registrar el proceso de empacado.
     */
    async mostrarFormularioEmpacado(req, res) {
        try {
            const id_lote = parseInt(req.params.id_lote);
            const lote = req.lote;

            // Verificar si ya existe un registro de empacado
            const empacadoExistente = await empacadoDAO.getEmpacadoByLoteId(id_lote);
            if (empacadoExistente) {
                req.flash('error', 'Ya existe un registro de empacado para este lote.');
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/empacado', {
                titulo: 'Registrar Empacado',
                lote: lote,
                finca: req.finca,
                fecha_empacado: req.flash('fecha_empacado')[0] || '',
                tipo_empaque: req.flash('tipo_empaque')[0] || '',
                peso_inicial: req.flash('peso_inicial')[0] || '',
                unidades_empacadas: req.flash('unidades_empacadas')[0] || '',
                peso_por_unidad: req.flash('peso_por_unidad')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de empacado:', error);
            req.flash('error', 'Error al cargar el formulario de empacado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de empacado.
     */
    async registrarEmpacado(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_empacado', req.body.fecha_empacado);
            req.flash('tipo_empaque', req.body.tipo_empaque);
            req.flash('peso_inicial', req.body.peso_inicial);
            req.flash('peso_empacado', req.body.peso_empacado);
            req.flash('id_tipo_producto', req.body.id_tipo_producto);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/empacado/registrar`);
        }

        try {
            const id_lote = parseInt(req.params.id_lote);
            const {
                fecha_empacado,
                tipo_empaque,
                peso_inicial,
                peso_empacado,
                id_tipo_producto,
                observaciones
            } = req.body;

            // Calcular peso_final, puede ser el mismo que peso_empacado o cero si no hay valor
            const peso_final = peso_empacado || 0;

            const empacado = new Empacado(
                null,
                id_lote,
                fecha_empacado,
                tipo_empaque,
                peso_inicial,
                peso_final,
                peso_empacado,
                id_tipo_producto || 1, // Por defecto, tipo 1
                observaciones,
                3 // Estado 'Terminado'
            );

            await empacadoDAO.createEmpacado(empacado);
            
            // Actualizar estado general y proceso actual del LOTE
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoEmpacadoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'empacado');

            if (!procesoEmpacadoDef) {
                req.flash('error', "Error de configuración: Proceso 'Empacado' no encontrado.");
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoEmpacadoDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoEmpacadoDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2); // 2 = 'En progreso'
            
            req.flash('mensaje', 'Proceso de empacado registrado exitosamente.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar empacado:', error);
            req.flash('error', 'Error al registrar el proceso de empacado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/empacado/registrar`);
        }
    }

    /**
     * Muestra el formulario para registrar el proceso de control de calidad.
     */
    async mostrarFormularioControlCalidad(req, res) {
        try {
            const id_lote = parseInt(req.params.id_lote);
            const lote = req.lote;

            // Verificar si ya existe un registro de control de calidad
            const controlExistente = await controlCalidadDAO.getControlCalidadByLoteId(id_lote);
            if (controlExistente) {
                req.flash('error', 'Ya existe un registro de control de calidad para este lote.');
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/control-calidad', {
                titulo: 'Registrar Control de Calidad',
                lote: lote,
                finca: req.finca,
                fecha_control: req.flash('fecha_control')[0] || '',
                tipo_control: req.flash('tipo_control')[0] || '',
                resultado_control: req.flash('resultado_control')[0] || '',
                puntaje_cata: req.flash('puntaje_cata')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de control de calidad:', error);
            req.flash('error', 'Error al cargar el formulario de control de calidad.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de control de calidad.
     */
    async registrarControlCalidad(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_control', req.body.fecha_control);
            req.flash('tipo_control', req.body.tipo_control);
            req.flash('resultado_control', req.body.resultado_control);
            req.flash('puntaje_cata', req.body.puntaje_cata);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/control-calidad/registrar`);
        }

        try {
            const id_lote = parseInt(req.params.id_lote);
            const {
                fecha_control,
                tipo_control,
                resultado_control,
                puntaje_cata,
                observaciones
            } = req.body;

            const controlCalidad = new ControlCalidad(
                null,
                id_lote,
                fecha_control,
                tipo_control,
                resultado_control,
                puntaje_cata,
                observaciones
            );

            await controlCalidadDAO.createControlCalidad(controlCalidad);
            req.flash('mensaje', 'Proceso de control de calidad registrado exitosamente.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar control de calidad:', error);
            req.flash('error', 'Error al registrar el proceso de control de calidad.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/control-calidad/registrar`);
        }
    }

    /**
     * Muestra la vista de flujo completo de un lote usando la vista_flujo_lote.
     */
    async mostrarFlujoLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            
            // Verificar que la finca pertenezca al usuario y que el lote exista
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                req.flash('error', 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }
            
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                req.flash('error', 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }
            
            // Obtener datos del flujo del lote desde la vista SQL
            const [flujoLote] = await db.query(
                'SELECT * FROM vista_flujo_lote WHERE lote_id = ?',
                [id_lote]
            );
            
            if (!flujoLote || flujoLote.length === 0) {
                req.flash('error', 'No se encontraron datos de flujo para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Enviar los datos a la vista
            res.render('lotes/flujo', {
                titulo: `Flujo Completo del Lote: ${lote.codigo}`,
                finca: finca,
                lote: lote,
                flujo: flujoLote[0], // Tomamos el primer registro (debería ser único por lote)
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
            
        } catch (error) {
            console.error('Error al mostrar vista de flujo de lote:', error);
            req.flash('error', 'Error al cargar los datos del flujo de lote.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    // --- Controladores para GESTIÓN DE CORRECCIONES Y CANCELACIONES ---
    
   

    /**
     * Muestra el formulario para cancelar un lote.
     */
    async mostrarFormularioCancelarLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar si el usuario tiene permisos sobre la finca/lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // No permitir cancelar lotes ya cancelados
            if (lote.id_estado_proceso === 4) {
                req.flash('error', 'Este lote ya se encuentra cancelado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/cancelar-lote', {
                titulo: `Cancelar Lote: ${lote.codigo}`,
                finca: finca,
                lote: lote,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de cancelación de lote:', error);
            req.flash('error', 'Error al cargar el formulario de cancelación.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes`);
        }
    }

    /**
     * Procesa la cancelación de un lote.
     */
    async cancelarLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const { motivo } = req.body;

            if (!motivo || motivo.trim() === '') {
                req.flash('error', 'Debe proporcionar un motivo para la cancelación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/cancelar`);
            }

            // Verificar si el usuario tiene permisos sobre la finca/lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Cancelar el lote
            await loteDAO.cancelarLote(id_lote, motivo);

            req.flash('mensaje', `El lote ${lote.codigo} ha sido cancelado exitosamente.`);
            res.redirect(`/fincas/${id_finca}/lotes`);

        } catch (error) {
            console.error('Error al cancelar lote:', error);
            req.flash('error', 'Error interno al cancelar el lote.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/cancelar`);
        }
    }

    /**
     * Muestra el formulario para duplicar un lote.
     */
    async mostrarFormularioDuplicarLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar si el usuario tiene permisos sobre la finca/lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            res.render('lotes/duplicar-lote', {
                titulo: `Duplicar Lote: ${lote.codigo}`,
                finca: finca,
                lote: lote,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario para duplicar lote:', error);
            req.flash('error', 'Error al cargar el formulario de duplicación.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes`);
        }
    }

    /**
     * Procesa la duplicación de un lote.
     */
    async duplicarLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const { motivo } = req.body;

            if (!motivo || motivo.trim() === '') {
                req.flash('error', 'Debe proporcionar un motivo para la duplicación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/duplicar`);
            }

            // Verificar si el usuario tiene permisos sobre la finca/lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Duplicar el lote
            const idNuevoLote = await loteDAO.duplicarLote(id_lote, motivo);
            const nuevoLote = await loteDAO.getLoteById(idNuevoLote);

            req.flash('mensaje', `El lote ha sido duplicado exitosamente. Nuevo código: ${nuevoLote.codigo}`);
            res.redirect(`/fincas/${id_finca}/lotes/${idNuevoLote}/procesos`);

        } catch (error) {
            console.error('Error al duplicar lote:', error);
            req.flash('error', 'Error interno al duplicar el lote.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/duplicar`);
        }
    }

   

    /**
     * Permite corregir el proceso de recolección solo bajo condiciones específicas.
     */
    async corregirProcesoRecoleccion(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // VALIDACIONES DE SEGURIDAD
            
            // 1. Verificar si hay procesos posteriores registrados
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            
            if (despulpadoInfo || fermentacionInfo || zarandeoInfo || secadoInfo) {
                req.flash('error', 'No se puede modificar la recolección porque ya existen procesos posteriores registrados. Esto podría causar inconsistencias en los datos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // 2. Verificar ventana de tiempo (opcional - 48 horas)
            const fechaCreacion = new Date(lote.fecha_registro);
            const ahora = new Date();
            const horasTranscurridas = (ahora - fechaCreacion) / (1000 * 60 * 60);
            
            if (horasTranscurridas > 48) {
                req.flash('error', 'No se puede modificar la recolección después de 48 horas de su registro por motivos de integridad de datos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // 3. Solo permitir si el lote está en estado "En progreso" y proceso actual es "Recolección"
            const procesoRecoleccionDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'recolección');
            
            if (!procesoRecoleccionDef) {
                req.flash('error', "Error de configuración: Proceso 'Recolección' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (lote.id_proceso_actual !== procesoRecoleccionDef.id) {
                req.flash('error', 'Solo se puede corregir la recolección si es el proceso actual del lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Si pasa todas las validaciones, redirigir al formulario de edición
            req.flash('mensaje', 'Corrección de recolección habilitada. Los cambios se registrarán en el historial de auditoría.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/recoleccion/corregir`);

        } catch (error) {
            console.error('Error al validar corrección de recolección:', error);
            req.flash('error', 'Error interno al validar la corrección de recolección.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia un proceso de zarandeo para permitir su corrección.
     */
    async reiniciarProcesoZarandeo(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_zarandeo = parseInt(req.params.id_zarandeo);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const zarandeo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (!zarandeo || zarandeo.id !== id_zarandeo) {
                req.flash('error', 'El proceso de zarandeo no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (zarandeo.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await zarandeoDAO.reiniciarZarandeo(id_zarandeo);

            // Actualizar el estado del lote
            const procesoZarandeoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'zarandeo');
            
            if (!procesoZarandeoDef) {
                req.flash('error', "Error de configuración: Proceso 'Zarandeo' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoZarandeoDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Zarandeo reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de zarandeo:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de zarandeo.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia un proceso de secado para permitir su corrección.
     */
    async reiniciarProcesoSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_secado = parseInt(req.params.id_secado);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado || secado.id !== id_secado) {
                req.flash('error', 'El proceso de secado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (secado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await secadoDAO.reiniciarSecado(id_secado);

            // Actualizar el estado del lote
            const procesoSecadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'secado');
            
            if (!procesoSecadoDef) {
                req.flash('error', "Error de configuración: Proceso 'Secado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoSecadoDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Secado reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de secado:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de secado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia un proceso de clasificación para permitir su corrección.
     */
    async reiniciarProcesoClasificacion(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_clasificacion = parseInt(req.params.id_clasificacion);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const clasificacion = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (!clasificacion || clasificacion.id !== id_clasificacion) {
                req.flash('error', 'El proceso de clasificación no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (clasificacion.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await clasificacionDAO.reiniciarClasificacion(id_clasificacion);

            // Actualizar el estado del lote
            const procesoClasificacionDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'clasificación');
            
            if (!procesoClasificacionDef) {
                req.flash('error', "Error de configuración: Proceso 'Clasificación' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoClasificacionDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Clasificación reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de clasificación:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de clasificación.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia un proceso de trilla para permitir su corrección.
     */
    async reiniciarProcesoTrilla(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_trilla = parseInt(req.params.id_trilla);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const trilla = await trillaDAO.getTrillaByLoteId(id_lote);
            if (!trilla || trilla.id !== id_trilla) {
                req.flash('error', 'El proceso de trilla no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (trilla.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await trillaDAO.reiniciarTrilla(id_trilla);

            // Actualizar el estado del lote
            const procesoTrillaDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'trilla');
            
            if (!procesoTrillaDef) {
                req.flash('error', "Error de configuración: Proceso 'Trilla' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoTrillaDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Trilla reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de trilla:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de trilla.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia un proceso de tueste para permitir su corrección.
     */
    async reiniciarProcesoTueste(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_tueste = parseInt(req.params.id_tueste);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const tueste = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (!tueste || tueste.id !== id_tueste) {
                req.flash('error', 'El proceso de tueste no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (tueste.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await tuesteDAO.reiniciarTueste(id_tueste);

            // Actualizar el estado del lote
            const procesoTuesteDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'tueste');
            
            if (!procesoTuesteDef) {
                req.flash('error', "Error de configuración: Proceso 'Tueste' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoTuesteDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Tueste reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de tueste:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de tueste.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Muestra el formulario para corregir los datos de inicio del secado.
     */
    async mostrarFormularioCorregirInicioSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el secado existe y está en estado válido para corrección
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado) {
                req.flash('error', 'No se encontró el proceso de secado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (secado.id_estado_proceso !== 1 && secado.id_estado_proceso !== 2 && secado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden corregir los datos de inicio cuando el secado está registrado, en progreso o terminado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Obtener peso del zarandeo para mostrar como referencia
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);

            res.render('lotes/procesos/secado-corregir-inicio', {
                titulo: `Corregir Datos de Inicio - Secado Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                secado: secado,
                peso_zarandeo_final: zarandeoInfo ? zarandeoInfo.peso_final : 0,
                // Para repoblar el formulario
                fecha_inicio_secado: req.flash('fecha_inicio_secado')[0] || secado.fecha_inicio,
                metodo_secado: req.flash('metodo_secado')[0] || secado.metodo_secado,
                humedad_inicial_secado: req.flash('humedad_inicial_secado')[0] || secado.humedad_inicial,
                observaciones_secado: req.flash('observaciones_secado')[0] || secado.observaciones,
                decision_venta: req.flash('decision_venta')[0] || secado.decision_venta,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de corrección de inicio de secado:', error);
            req.flash('error', 'Error interno al cargar el formulario de corrección.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa la corrección de los datos de inicio del secado.
     */
    async corregirDatosInicioSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                req.flash('error', 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                req.flash('error', 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el secado existe y está en estado válido para corrección
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado) {
                req.flash('error', 'No se encontró el proceso de secado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (secado.id_estado_proceso !== 1 && secado.id_estado_proceso !== 2 && secado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden corregir los datos de inicio cuando el secado está registrado, en progreso o terminado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Preparar observaciones con el formato estándar de corrección
            let observacionesExistentes = secado.observaciones || '';
            let observacionesNuevas = req.body.observaciones_secado || '';
            let observacionesFinales = '';
            
            // Si hay observaciones existentes, las mantenemos
            if (observacionesExistentes.trim() !== '') {
                observacionesFinales = observacionesExistentes;
            }
            
            // Si hay observaciones nuevas del usuario, las añadimos
            if (observacionesNuevas.trim() !== '') {
                if (observacionesFinales.trim() !== '') {
                    observacionesFinales += '\n';
                }
                observacionesFinales += observacionesNuevas;
            }
            
            // Añadir la nota de corrección automática
            if (observacionesFinales.trim() !== '') {
                observacionesFinales += '\n';
            }
            observacionesFinales += '[CORRECCIÓN COMPLETADA] ' + new Date().toLocaleString();

            const datosActualizacion = {
                fecha_inicio: req.body.fecha_inicio_secado,
                metodo_secado: req.body.metodo_secado,
                humedad_inicial: req.body.humedad_inicial_secado || null,
                observaciones: observacionesFinales
            };

            // Si el secado está en estado 1 (Por hacer) y se está corrigiendo, 
            // mantenerlo en estado 1 pero con los datos actualizados
            // Si está en estado 2 o 3, mantener su estado actual
            
            // Actualizar solo los datos de inicio
            await secadoDAO.updateSecado(secado.id, datosActualizacion);

            req.flash('mensaje', 'Datos de inicio del secado corregidos exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al corregir datos de inicio de secado:', error);
            req.flash('error', 'Error interno al corregir los datos de inicio.');
            
            // Mantener los datos del formulario
            req.flash('fecha_inicio_secado', req.body.fecha_inicio_secado);
            req.flash('metodo_secado', req.body.metodo_secado);
            req.flash('humedad_inicial_secado', req.body.humedad_inicial_secado);
            req.flash('observaciones_secado', req.body.observaciones_secado);
            req.flash('decision_venta', req.body.decision_venta);
            
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/corregir-inicio`);
        }
    }
}

module.exports = new LoteController(); 