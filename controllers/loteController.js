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
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../utils/helpers'); // Si se usa para algo
const seguimientoSecadoDAO = require('../models/dao/seguimientoSecadoDAO');
const { setMessages } = require('../utils/messages');


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
     * Muestra la vista de procesos de un lote.
     */
    async mostrarVistaProcesosLote(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar permisos
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) {
                setMessages.procesos.error(req, 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                setMessages.procesos.error(req, 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Obtener info del lote con nombres de estado y proceso - getLoteInfoById no existe, usamos getLoteById
            // const loteInfo = await loteDAO.getLoteInfoById(id_lote);
            // No es necesario esta línea ya que ya tenemos la información del lote en la variable 'lote'
            
            // Obtener todos los procesos ordenados
            const procesos = await procesosDAO.getAllProcesosOrdenados();
            
            // Obtener y relacionar datos de cada proceso
            const procesosConEstado = await Promise.all(procesos.map(async proceso => {
                switch (proceso.nombre.toLowerCase()) {
                    case 'recolección':
                        // Los datos de recolección ya están en el lote
                        return proceso;
                        
                    case 'despulpado':
                        const despulpado = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
                        return { ...proceso, datosEtapa: despulpado };
                        
                    case 'fermentación y lavado':
                        const fermentacionLavado = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
                        return { ...proceso, datosEtapa: fermentacionLavado };
                        
                    case 'zarandeo':
                        const zarandeo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
                        return { ...proceso, datosEtapa: zarandeo };
                        
                    case 'secado': 
                        const secado = await secadoDAO.getSecadoByLoteId(id_lote);
                        return { ...proceso, datosEtapa: secado };
                        
                    case 'clasificación':  
                        const clasificacion = await clasificacionDAO.getClasificacionByLoteId(id_lote);
                        return { ...proceso, datosEtapa: clasificacion };
                        
                    case 'trilla':
                        const trilla = await trillaDAO.getTrillaByLoteId(id_lote);
                        return { ...proceso, datosEtapa: trilla };
                        
                    case 'tueste':
                        const tueste = await tuesteDAO.getTuesteByLoteId(id_lote);
                        return { ...proceso, datosEtapa: tueste };
                        
                    case 'molienda':
                        const molienda = await moliendaDAO.getMoliendaByLoteId(id_lote);
                        return { ...proceso, datosEtapa: molienda };
                        
                    case 'empacado':
                        let datosEmpacado = null;
                        const empacados = await empacadoDAO.getAllEmpacadosByLoteId(id_lote);
                        if (empacados && empacados.length > 0) {
                            // Contar cantidades totales por tipo
                            let pesoInicialTotal = 0;
                            let pesoEmpacadoTotal = 0;
                            let totalEmpaques = 0;
                            
                            empacados.forEach(e => {
                                if (e.id_estado_proceso === 3) { // Solo contar los terminados
                                    pesoInicialTotal += parseFloat(e.peso_inicial) || 0;
                                    pesoEmpacadoTotal += parseFloat(e.peso_empacado) || 0;
                                    totalEmpaques += parseInt(e.total_empaques) || 0;
                                }
                            });
                            
                            // Tomar la fecha del empacado más reciente
                            const ultimoEmpacado = [...empacados].sort((a, b) => {
                                return new Date(b.fecha_empacado) - new Date(a.fecha_empacado);
                            })[0];
                            
                            datosEmpacado = {
                                id_estado_proceso: empacados.some(e => e.id_estado_proceso === 3) ? 3 : 
                                                  empacados.some(e => e.id_estado_proceso === 2) ? 2 : 1,
                                fecha_empacado: ultimoEmpacado.fecha_empacado,
                                peso_inicial: pesoInicialTotal,
                                peso_empacado: pesoEmpacadoTotal,
                                total_empaques: totalEmpaques,
                                observaciones: ultimoEmpacado.observaciones,
                                empacados: empacados
                            };
                        }
                        return { ...proceso, datosEtapa: datosEmpacado };
                        
                    case 'control de calidad':
                        // NOTA: Actualmente en construcción / no implementado
                        return { 
                            ...proceso, 
                            datosEtapa: { 
                                enConstruccion: true,
                                id_estado_proceso: 0
                            } 
                        };
                        
                    default:
                        return proceso;
                }
            }));
            
            // Obtener datos adicionales como seguimientos de secado
            let seguimientosSecado = [];
            if (procesosConEstado.find(p => p.nombre.toLowerCase() === 'secado' && p.datosEtapa)) {
                const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
                if (secadoInfo && secadoInfo.id) {
                    seguimientosSecado = await seguimientoSecadoDAO.getSeguimientosBySecadoId(secadoInfo.id);
                }
            }
            
            // La renderización ahora usa los mensajes preparados por el middleware
            res.render('lotes/procesos', {
                titulo: `Procesos del Lote: ${lote.codigo || lote.codigo_lote}`,
                finca: finca,
                lote: lote,
                procesosConEstado: procesosConEstado,
                seguimientosSecado: seguimientosSecado
            });

        } catch (error) {
            console.error('Error al mostrar vista de procesos:', error);
            setMessages.procesos.error(req, 'Error al cargar la vista de procesos: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes`);
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
                setMessages.flujo.error(req, 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }
            
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                setMessages.flujo.error(req, 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }
            
            // Obtener datos del flujo del lote desde la vista SQL
            const [flujoLote] = await db.query(
                'SELECT * FROM vista_flujo_lote WHERE lote_id = ?',
                [id_lote]
            );
            
            if (!flujoLote || flujoLote.length === 0) {
                setMessages.flujo.error(req, 'No se encontraron datos de flujo para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Enviar los datos a la vista - los mensajes son manejados por el middleware
            res.render('lotes/flujo', {
                titulo: `Flujo Completo del Lote: ${lote.codigo}`,
                finca: finca,
                lote: lote,
                flujo: flujoLote[0] // Tomamos el primer registro (debería ser único por lote)
            });
            
        } catch (error) {
            console.error('Error al mostrar vista de flujo de lote:', error);
            setMessages.flujo.error(req, 'Error al cargar los datos del flujo de lote: ' + error.message);
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
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // No permitir cancelar lotes ya cancelados
            if (lote.id_estado_proceso === 4) {
                setMessages.procesos.error(req, 'Este lote ya se encuentra cancelado.');
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
            setMessages.lotes.error(req, 'Error al cargar el formulario de cancelación.');
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
                setMessages.form.error(req, 'Debe proporcionar un motivo para la cancelación.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/cancelar`);
            }

            // Verificar si el usuario tiene permisos sobre la finca/lote
            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Cancelar el lote
            await loteDAO.cancelarLote(id_lote, motivo);

            setMessages.lotes.success(req, `El lote ${lote.codigo} ha sido cancelado exitosamente.`);
            res.redirect(`/fincas/${id_finca}/lotes`);

        } catch (error) {
            console.error('Error al cancelar lote:', error);
            setMessages.form.error(req, 'Error interno al cancelar el lote.');
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
                setMessages.lotes.error(req, 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // VALIDACIONES DE SEGURIDAD
            
            // 1. Verificar si hay procesos posteriores registrados
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            const zarandeoInfo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
            
            if (despulpadoInfo || fermentacionInfo || zarandeoInfo || secadoInfo) {
                setMessages.procesos.error(req, 'No se puede modificar la recolección porque ya existen procesos posteriores registrados. Esto podría causar inconsistencias en los datos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // 2. Verificar ventana de tiempo (opcional - 48 horas)
            const fechaCreacion = new Date(lote.fecha_registro);
            const ahora = new Date();
            const horasTranscurridas = (ahora - fechaCreacion) / (1000 * 60 * 60);
            
            if (horasTranscurridas > 48) {
                setMessages.procesos.error(req, 'No se puede modificar la recolección después de 48 horas de su registro por motivos de integridad de datos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // 3. Solo permitir si el lote está en estado "En progreso" y proceso actual es "Recolección"
            const procesoRecoleccionDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'recolección');
            
            if (!procesoRecoleccionDef) {
                setMessages.procesos.error(req, "Error de configuración: Proceso 'Recolección' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (lote.id_proceso_actual !== procesoRecoleccionDef.id) {
                setMessages.procesos.error(req, 'Solo se puede corregir la recolección si es el proceso actual del lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Si pasa todas las validaciones, redirigir al formulario de edición
            setMessages.form.success(req, 'Corrección de recolección habilitada. Los cambios se registrarán en el historial de auditoría.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/recoleccion/corregir`);

        } catch (error) {
            console.error('Error al validar corrección de recolección:', error);
            setMessages.procesos.error(req, 'Error interno al validar la corrección de recolección.');
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
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el proceso existe
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado || secado.id !== id_secado) {
                setMessages.procesos.error(req, 'El proceso de secado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (secado.id_estado_proceso !== 3) {
                setMessages.procesos.error(req, 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await secadoDAO.reiniciarSecado(id_secado);

            // Actualizar el estado del lote
            const procesoSecadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'secado');
            
            if (!procesoSecadoDef) {
                setMessages.procesos.error(req, "Error de configuración: Proceso 'Secado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoSecadoDef.id, 2); // 2 = 'En progreso'

            setMessages.procesos.success(req, 'Proceso de Secado reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de secado:', error);
            setMessages.procesos.error(req, 'Error interno al reiniciar el proceso de secado.');
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
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el secado existe y está en estado válido para corrección
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado) {
                setMessages.procesos.error(req, 'No se encontró el proceso de secado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (secado.id_estado_proceso !== 1 && secado.id_estado_proceso !== 2 && secado.id_estado_proceso !== 3) {
                setMessages.procesos.error(req, 'Solo se pueden corregir los datos de inicio cuando el secado está registrado, en progreso o terminado.');
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
                decision_venta: req.flash('decision_venta')[0] || secado.decision_venta
                // Los mensajes ya son manejados por el middleware
            });

        } catch (error) {
            console.error('Error al mostrar formulario de corrección de inicio de secado:', error);
            setMessages.procesos.error(req, 'Error interno al cargar el formulario de corrección.');
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
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que el secado existe y está en estado válido para corrección
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado) {
                setMessages.procesos.error(req, 'No se encontró el proceso de secado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (secado.id_estado_proceso !== 1 && secado.id_estado_proceso !== 2 && secado.id_estado_proceso !== 3) {
                setMessages.procesos.error(req, 'Solo se pueden corregir los datos de inicio cuando el secado está registrado, en progreso o terminado.');
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

            setMessages.procesos.success(req, 'Datos de inicio del secado corregidos exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al corregir datos de inicio de secado:', error);
            setMessages.form.error(req, 'Error interno al corregir los datos de inicio.');
            
            // Mantener los datos del formulario usando req.flash temporalmente
            // Esto se migrará completamente cuando se implemente el almacenamiento de datos de formulario
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