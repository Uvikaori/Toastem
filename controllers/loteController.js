const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO'); // Para obtener info de la finca
const procesosDAO = require('../models/dao/procesosDAO'); // DAO para la tabla `procesos`
const despulpadoDAO = require('../models/dao/despulpadoDAO'); // DAO para la tabla `despulpado`
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO'); // Nuevo DAO
const zarandeoDAO = require('../models/dao/zarandeoDAO'); // Nuevo DAO
const secadoDAO = require('../models/dao/secadoDAO'); // Nuevo DAO
const clasificacionDAO = require('../models/dao/clasificacionDAO'); // Renombrado y actualizado
const trillaDAO = require('../models/dao/trillaDAO'); // Nuevo DAO
const Lote = require('../models/entities/Lote');
const Despulpado = require('../models/entities/Despulpado'); // Entidad Despulpado
const FermentacionLavado = require('../models/entities/FermentacionLavado'); // Nueva entidad
const Zarandeo = require('../models/entities/Zarandeo'); // Nueva entidad
const Secado = require('../models/entities/Secado'); // Nueva entidad
const Clasificacion = require('../models/entities/Clasificacion'); // Renombrado de ClasificacionAtributos
const Trilla = require('../models/entities/Trilla'); // Nueva entidad
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
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_recoleccion', req.body.fecha_recoleccion);
            req.flash('peso_inicial', req.body.peso_inicial);
            req.flash('tipo_cafe', req.body.tipo_cafe);
            req.flash('tipo_recoleccion', req.body.tipo_recoleccion);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${id_finca}/lotes/crear`);
        }

        try {
            if (isNaN(id_finca)) {
                req.flash('error', 'ID de finca inválido.');
                return res.redirect('/fincas/gestionar');
            }
            // Sería bueno verificar de nuevo que la finca pertenece al usuario.

            const { fecha_recoleccion, peso_inicial, tipo_cafe, tipo_recoleccion, observaciones } = req.body;
            const id_usuario = req.session.usuario.id;

            const codigoLote = await loteDAO.generarCodigoLoteUnico(id_finca);

            // Los valores por defecto para id_estado_proceso, id_proceso_actual, 
            // fecha_registro y id_destino_final se tomarán de la entidad Lote.
            const nuevoLote = new Lote(
                null, // id
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
            res.redirect(`/fincas/${id_finca}/lotes`); // Redirigir a la lista de lotes de la finca

        } catch (error) {
            console.error('Error al crear lote:', error);
            req.flash('error', 'Error interno al crear el lote.');
            req.flash('fecha_recoleccion', req.body.fecha_recoleccion);
            req.flash('peso_inicial', req.body.peso_inicial);
            req.flash('tipo_cafe', req.body.tipo_cafe);
            req.flash('tipo_recoleccion', req.body.tipo_recoleccion);
            req.flash('observaciones', req.body.observaciones);
            res.redirect(`/fincas/${id_finca}/lotes/crear`);
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

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                req.flash('error', 'Finca no encontrada o no tiene permiso.');
                return res.redirect('/fincas/gestionar');
            }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                req.flash('error', 'Lote no encontrado o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            const todosLosProcesosDefinidos = await procesosDAO.getAllProcesosOrdenados();
            
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            // TODO: const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);

            const procesosConEstado = todosLosProcesosDefinidos.map(procesoDef => {
                let etapaInfo = null;
                let urlFormulario = '#';
                let urlVer = '#';
                let urlAccionAdicional = null;
                let textoAccionAdicional = null;

                switch (procesoDef.nombre.toLowerCase()) {
                    case 'despulpado':
                        etapaInfo = despulpadoInfo;
                        urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/despulpado/registrar`;
                        break;
                    case 'fermentación y lavado':
                        etapaInfo = fermentacionInfo;
                        urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`;
                        break;
                    case 'zarandeo':
                        etapaInfo = zarandeoInfo;
                        urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`;
                        break;
                    case 'secado': 
                        etapaInfo = secadoInfo;
                        if (!etapaInfo) {
                            urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/secado/iniciar`;
                        } else if (etapaInfo.id_estado_proceso === 2) {
                            urlAccionAdicional = `/fincas/${id_finca}/lotes/${id_lote}/secado/finalizar`;
                            textoAccionAdicional = 'Finalizar Secado';
                            urlFormulario = '#';
                        }
                        break;
                    case 'clasificación':  
                        etapaInfo = clasificacionInfo;
                        urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`;
                        break;
                    case 'trilla':
                        etapaInfo = trillaInfo;
                        urlFormulario = `/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`;
                        break;
                    // TODO: Añadir caso para Tueste
                }

                return {
                    ...procesoDef,
                    datosEtapa: etapaInfo,
                    urlFormulario: urlFormulario,
                    urlVerDetalles: urlVer,
                    urlAccionAdicional: urlAccionAdicional,
                    textoAccionAdicional: textoAccionAdicional
                };
            });

            res.render('lotes/procesos', {
                titulo: `Procesos del Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                procesosConEstado: procesosConEstado,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar vista de procesos del lote:', error);
            req.flash('error', 'Error al cargar la vista de procesos del lote.');
            const id_finca_param = req.params.id_finca ? parseInt(req.params.id_finca) : null;
            if (id_finca_param && !isNaN(id_finca_param)){
                 res.redirect(`/fincas/${id_finca_param}/lotes`);
            } else {
                 res.redirect('/fincas/gestionar');
            }
        }
    }
    
    // --- Controladores para DESPULPADO ---
    async mostrarFormularioDespulpado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Validaciones y obtención de finca y lote (similar a mostrarVistaProcesosLote)
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { return res.redirect(`/fincas/${id_finca}/lotes`);}

            // Verificar si ya existe un registro de despulpado para no permitir duplicados por error
            const despulpadoExistente = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (despulpadoExistente) {
                req.flash('error', 'El proceso de despulpado ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/despulpado-form', {
                titulo: `Registrar Despulpado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                // Valores para repoblar el formulario
                fecha_remojo: req.flash('fecha_remojo')[0] || '',
                fecha_despulpado: req.flash('fecha_despulpado')[0] || '',
                peso_final_despulpado: req.flash('peso_final_despulpado')[0] || '',
                observaciones_despulpado: req.flash('observaciones_despulpado')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de despulpado:', error);
            req.flash('error', 'Error al cargar el formulario de despulpado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarDespulpado(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req); // Asumiendo que hay un despulpadoValidator

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            // Repoblar campos específicos de despulpado
            req.flash('fecha_remojo', req.body.fecha_remojo);
            req.flash('fecha_despulpado', req.body.fecha_despulpado);
            req.flash('peso_final_despulpado', req.body.peso_final_despulpado);
            req.flash('observaciones_despulpado', req.body.observaciones_despulpado);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/despulpado/registrar`);
        }

        try {
            const loteOriginal = await loteDAO.getLoteById(id_lote); // Para obtener peso_inicial del lote
            if(!loteOriginal) { throw new Error('Lote original no encontrado para despulpado.'); }

            const despulpadoData = {
                id_lote: id_lote,
                peso_inicial: loteOriginal.peso_inicial, // Peso ANTES del despulpado es el peso inicial del lote
                fecha_remojo: req.body.fecha_remojo,
                fecha_despulpado: req.body.fecha_despulpado,
                peso_final: req.body.peso_final_despulpado, // Peso DESPUÉS del despulpado
                observaciones: req.body.observaciones_despulpado,
                id_estado_proceso: 3 // 3 = Terminado para la etapa
            };
            
            await despulpadoDAO.createDespulpado(despulpadoData);

            // Actualizar estado general y proceso actual del LOTE
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoDespulpadoActualDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'despulpado');

            if (!procesoDespulpadoActualDef) {
                console.error("Error crítico: El proceso 'despulpado' no está definido en la tabla 'procesos'.");
                req.flash('error', "Error de configuración del sistema: Proceso 'despulpado' no encontrado.");
                // Redirigir para evitar más errores si la configuración es incorrecta.
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const ordenProcesoDespulpado = procesoDespulpadoActualDef.orden;
            
            // Encontrar el siguiente proceso en la secuencia, basado en el campo 'orden'
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (ordenProcesoDespulpado + 1));
            
            // Determinar el ID del nuevo proceso actual para el lote.
            // Si no hay un siguiente proceso definido, el lote se queda con el ID de despulpado como proceso actual.
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoDespulpadoActualDef.id;

            // Actualizar el lote para que refleje este nuevo proceso actual y el estado general 'En progreso'
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2); // 2 = 'En progreso' (estado general del lote)

            req.flash('mensaje', 'Proceso de Despulpado registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar despulpado:', error);
            req.flash('error', 'Error interno al registrar el despulpado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/despulpado/registrar`);
        }
    }

    // --- Controladores para FERMENTACIÓN Y LAVADO ---
    async mostrarFormularioFermentacionLavado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

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

            // Verificar si ya existe un registro para no permitir duplicados
            const fermentacionExistente = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (fermentacionExistente) {
                req.flash('error', 'El proceso de Fermentación y Lavado ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Verificar que el proceso anterior (Despulpado) esté completado
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpadoInfo || despulpadoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Despulpado debe estar completado antes de registrar la Fermentación y Lavado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/fermentacion-lavado-form', {
                titulo: `Registrar Fermentación y Lavado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_despulpado_final: despulpadoInfo.peso_final, // Para información y posible validación en el form
                // Valores para repoblar el formulario
                fecha_inicio_fermentacion: req.flash('fecha_inicio_fermentacion')[0] || '',
                fecha_lavado: req.flash('fecha_lavado')[0] || '',
                peso_final_fermentacion: req.flash('peso_final_fermentacion')[0] || '',
                observaciones_fermentacion: req.flash('observaciones_fermentacion')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de fermentación y lavado:', error);
            req.flash('error', 'Error al cargar el formulario de fermentación y lavado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarFermentacionLavado(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_inicio_fermentacion', req.body.fecha_inicio_fermentacion);
            req.flash('fecha_lavado', req.body.fecha_lavado);
            req.flash('peso_final_fermentacion', req.body.peso_final_fermentacion);
            req.flash('observaciones_fermentacion', req.body.observaciones_fermentacion);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`);
        }

        try {
            // Obtener el peso final del despulpado para usar como peso inicial de la fermentación
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpadoInfo || !despulpadoInfo.peso_final) {
                req.flash('error', 'No se encontró el peso final del despulpado. Asegúrese de que el proceso de despulpado esté registrado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`);
            }

            const fermentacionData = new FermentacionLavado(
                null, // id
                id_lote,
                despulpadoInfo.peso_final, // Peso inicial para fermentación
                req.body.fecha_inicio_fermentacion,
                req.body.fecha_lavado,
                req.body.peso_final_fermentacion, // Peso final después del lavado
                req.body.observaciones_fermentacion
                // id_estado_proceso se toma por defecto de la entidad (3 = Terminado)
            );
            
            await fermentacionLavadoDAO.createFermentacionLavado(fermentacionData);

            // Actualizar estado general y proceso actual del LOTE
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoFermentacionDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'fermentación y lavado'); // Ajustar el nombre exacto

            if (!procesoFermentacionDef) {
                console.error("Error crítico: El proceso 'Fermentación y Lavado' no está definido.");
                req.flash('error', "Error de configuración: Proceso 'Fermentación y Lavado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoFermentacionDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoFermentacionDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2); // 2 = 'En progreso' (estado general del lote)

            req.flash('mensaje', 'Proceso de Fermentación y Lavado registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar fermentación y lavado:', error);
            req.flash('error', 'Error interno al registrar la fermentación y lavado.');
            // Repoblar campos en caso de error no cubierto por el validador
            req.flash('fecha_inicio_fermentacion', req.body.fecha_inicio_fermentacion);
            req.flash('fecha_lavado', req.body.fecha_lavado);
            req.flash('peso_final_fermentacion', req.body.peso_final_fermentacion);
            req.flash('observaciones_fermentacion', req.body.observaciones_fermentacion);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`);
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
            if (!finca) { /* ... manejo error ... */ return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { /* ... manejo error ... */ return res.redirect(`/fincas/${id_finca}/lotes`); }

            const secadoExistente = await secadoDAO.getSecadoByLoteId(id_lote);
            if (secadoExistente) {
                req.flash('error', 'El proceso de Secado ya ha sido iniciado o registrado para este lote.');
                // Podríamos redirigir a una vista para ACTUALIZAR/FINALIZAR secado si ya existe
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`); 
            }

            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (!zarandeoInfo || zarandeoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Zarandeo debe estar completado para iniciar el secado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/secado-inicio-form', {
                titulo: `Iniciar Proceso de Secado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_zarandeo_final: zarandeoInfo.peso_final,
                fecha_inicio_secado: req.flash('fecha_inicio_secado')[0] || '',
                metodo_secado: req.flash('metodo_secado')[0] || '',
                humedad_inicial_secado: req.flash('humedad_inicial_secado')[0] || '',
                observaciones_secado: req.flash('observaciones_secado')[0] || '',
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

            const secadoData = new Secado(
                null, // id
                id_lote,
                zarandeoInfo.peso_final, // Peso inicial para secado
                req.body.fecha_inicio_secado,
                req.body.metodo_secado,
                req.body.humedad_inicial_secado || null,
                null, // fecha_fin (se registra al finalizar)
                null, // peso_final (se registra al finalizar)
                req.body.observaciones_secado
                // id_estado_proceso es 2 ('En progreso') por defecto desde la entidad Secado
            );
            
            await secadoDAO.createSecado(secadoData);

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
            if (!secadoActual || secadoActual.id_estado_proceso !== 2) { // Debe existir y estar 'En Progreso'
                req.flash('error', 'El proceso de secado no está en estado para ser finalizado o no existe.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const datosActualizacion = {
                fecha_fin: req.body.fecha_fin_secado,
                peso_final: req.body.peso_final_secado,
                observaciones: req.body.observaciones_fin_secado, 
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
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoSecadoDef.id; 
            const nuevoEstadoGeneralLote = siguienteProcesoDef ? 2 : 3; // 2 En progreso, 3 Finalizado Lote

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
            if (!finca) { /* ... */ return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { /* ... */ return res.redirect(`/fincas/${id_finca}/lotes`); }

            const clasificacionExistente = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (clasificacionExistente) {
                req.flash('info', 'La Clasificación ya ha sido registrada para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || secadoInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Secado debe estar completado (Terminado) antes de registrar la Clasificación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            res.render('lotes/procesos/clasificacion-form', {
                titulo: `Registrar Clasificación - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_secado_final: secadoInfo.peso_final,
                // Para repoblar
                fecha_clasificacion: req.flash('fecha_clasificacion')[0] || '',
                proveedor_externo: req.flash('proveedor_externo')[0] === 'true', // Convertir a booleano
                nombre_proveedor: req.flash('nombre_proveedor')[0] || '',
                costo_servicio: req.flash('costo_servicio')[0] || '',
                peso_final_clasificado: req.flash('peso_final_clasificado')[0] || '',
                observaciones_clasificacion: req.flash('observaciones_clasificacion')[0] || '',
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
            req.flash('proveedor_externo', req.body.proveedor_externo); // string 'true' or 'false'
            req.flash('nombre_proveedor', req.body.nombre_proveedor);
            req.flash('costo_servicio', req.body.costo_servicio);
            req.flash('peso_final_clasificado', req.body.peso_final_clasificado);
            req.flash('observaciones_clasificacion', req.body.observaciones_clasificacion);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
        }

        try {
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secadoInfo || !secadoInfo.peso_final) {
                req.flash('error', 'No se encontró el peso final del secado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
            }

            const esProveedorExterno = req.body.proveedor_externo === 'true';

            const clasificacionData = new Clasificacion(
                null, // id
                id_lote,
                secadoInfo.peso_final, // peso_inicial para clasificación
                req.body.fecha_clasificacion,
                esProveedorExterno,
                esProveedorExterno ? req.body.nombre_proveedor : null,
                esProveedorExterno ? (req.body.costo_servicio || null) : null,
                req.body.peso_final_clasificado,
                req.body.observaciones_clasificacion
            );
            
            await clasificacionDAO.createClasificacion(clasificacionData);

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoClasificacionDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'clasificación');

            if (!procesoClasificacionDef) {
                req.flash('error', "Error de configuración: Proceso 'Clasificación' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoClasificacionDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoClasificacionDef.id;
            const nuevoEstadoGeneralLote = siguienteProcesoDef ? 2 : 3; // 2 En progreso, 3 Finalizado Lote

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoGeneralLote);

            req.flash('mensaje', 'Clasificación registrada exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar clasificación:', error);
            req.flash('error', 'Error interno al registrar la clasificación.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
        }
    }

    // --- Controladores para TRILLA ---
    async mostrarFormularioTrilla(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { /* ... */ return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { /* ... */ return res.redirect(`/fincas/${id_finca}/lotes`); }

            const trillaExistente = await trillaDAO.getTrillaByLoteId(id_lote);
            if (trillaExistente) {
                req.flash('info', 'La Trilla ya ha sido registrada para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (!clasificacionInfo || clasificacionInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Clasificación debe estar completado antes de registrar la Trilla.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            res.render('lotes/procesos/trilla-form', {
                titulo: `Registrar Trilla - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_clasificado_final: clasificacionInfo.peso_final_clasificado,
                // Para repoblar
                fecha_trilla: req.flash('fecha_trilla')[0] || '',
                proveedor_externo: req.flash('proveedor_externo')[0] === 'true',
                nombre_proveedor: req.flash('nombre_proveedor')[0] || '',
                costo_servicio: req.flash('costo_servicio')[0] || '',
                peso_final_trillado: req.flash('peso_final_trillado')[0] || '',
                observaciones_trilla: req.flash('observaciones_trilla')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar form de trilla:', error);
            req.flash('error', 'Error al cargar el formulario de trilla.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarTrilla(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_trilla', req.body.fecha_trilla);
            req.flash('proveedor_externo', req.body.proveedor_externo);
            req.flash('nombre_proveedor', req.body.nombre_proveedor);
            req.flash('costo_servicio', req.body.costo_servicio);
            req.flash('peso_final_trillado', req.body.peso_final_trillado);
            req.flash('observaciones_trilla', req.body.observaciones_trilla);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
        }

        try {
            const clasificacionInfo = await clasificacionDAO.getClasificacionByLoteId(id_lote);
            if (!clasificacionInfo || !clasificacionInfo.peso_final_clasificado) {
                req.flash('error', 'No se encontró el peso final de la clasificación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }

            const esProveedorExterno = req.body.proveedor_externo === 'true';

            const trillaData = new Trilla(
                null, // id
                id_lote,
                clasificacionInfo.peso_final_clasificado, // peso_inicial para trilla
                req.body.fecha_trilla,
                esProveedorExterno,
                esProveedorExterno ? req.body.nombre_proveedor : null,
                esProveedorExterno ? (req.body.costo_servicio || null) : null,
                req.body.peso_final_trillado,
                req.body.observaciones_trilla
            );
            
            await trillaDAO.createTrilla(trillaData);

            // Actualizar estado general y proceso actual del LOTE
            // Trilla suele ser el último proceso de beneficio, así que el lote pasará a estado 'Finalizado' (3)
            // y su proceso actual será 'Trilla' (ya que no hay siguiente en este flujo básico).
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoTrillaDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'trilla');

            if (!procesoTrillaDef) {
                req.flash('error', "Error de configuración: Proceso 'Trilla' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Como Trilla es el último proceso en la lista de la BD que me diste, el lote se considera finalizado.
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoTrillaDef.id, 3); // 3 = 'Finalizado' (estado general del lote)

            req.flash('mensaje', 'Trilla registrada exitosamente. El lote ha completado su ciclo de procesos.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar trilla:', error);
            req.flash('error', 'Error interno al registrar la trilla.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
        }
    }

}

module.exports = new LoteController(); 