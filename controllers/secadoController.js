const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const zarandeoDAO = require('../models/dao/zarandeoDAO');
const secadoDAO = require('../models/dao/secadoDAO');
const seguimientoSecadoDAO = require('../models/dao/seguimientoSecadoDAO');
const Secado = require('../models/entities/Secado');
const { validationResult } = require('express-validator');

class SecadoController {
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
     * Registra un nuevo seguimiento del proceso de secado
     * Endpoint: POST /api/seguimiento-secado
     */
    async registrarSeguimientoSecado(req, res) {
        try {
            const { id_secado, fecha_seguimiento, temperatura, humedad, observaciones_seguimiento } = req.body;
            
            // Validaciones básicas
            if (!id_secado) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El ID del proceso de secado es requerido' 
                });
            }

            // Verificar que exista el proceso de secado
            const secado = await secadoDAO.getSecadoById(parseInt(id_secado));
            if (!secado) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Proceso de secado no encontrado' 
                });
            }

            // Verificar que el proceso esté en progreso
            if (secado.id_estado_proceso !== 2) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se puede registrar seguimiento para procesos en progreso' 
                });
            }

            // Verificar que se haya proporcionado al menos un dato
            if (!temperatura && !humedad && !observaciones_seguimiento) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Debe proporcionar al menos un dato (temperatura, humedad u observaciones)' 
                });
            }

            // Crear objeto con datos del seguimiento
            const datosSeguimiento = {
                id_secado: parseInt(id_secado),
                fecha: fecha_seguimiento || new Date().toISOString(),
                temperatura: temperatura ? parseFloat(temperatura) : null,
                humedad: humedad ? parseFloat(humedad) : null,
                observaciones: observaciones_seguimiento || null
            };

            // Registrar el seguimiento en la base de datos
            const seguimientoId = await seguimientoSecadoDAO.createSeguimientoSecado(datosSeguimiento);
            
            if (!seguimientoId) {
                throw new Error('Error al guardar el seguimiento en la base de datos');
            }

            // Enviar respuesta exitosa
            res.json({
                success: true,
                message: 'Seguimiento registrado correctamente',
                data: {
                    id: seguimientoId,
                    ...datosSeguimiento
                }
            });

        } catch (error) {
            console.error('Error al registrar seguimiento de secado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al registrar el seguimiento',
                error: error.message
            });
        }
    }

    /**
     * Muestra el formulario para registrar un nuevo seguimiento de secado
     */
    async mostrarFormularioSeguimientoSecado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            // Verificar permisos
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

            // Verificar que existe el proceso de secado y está en progreso
            const secado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (!secado) {
                req.flash('error', 'El proceso de secado no ha sido iniciado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            if (secado.id_estado_proceso !== 2) { // 2 = En Progreso
                req.flash('error', 'Solo se puede agregar seguimiento a procesos de secado en progreso.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Obtener los seguimientos existentes
            const seguimientos = await seguimientoSecadoDAO.getSeguimientosBySecadoId(secado.id);

            res.render('lotes/procesos/seguimiento-secado-form', {
                titulo: `Seguimiento de Secado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                secado: secado,
                seguimientos: seguimientos,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de seguimiento de secado:', error);
            req.flash('error', 'Error al cargar el formulario de seguimiento de secado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el formulario de seguimiento de secado
     */
    async procesarSeguimientoSecado(req, res) {
        const id_lote = parseInt(req.params.id_lote);
        const id_finca = parseInt(req.body.id_finca_param);
        const errors = validationResult(req);

        if (!id_finca) {
            req.flash('error', 'No se pudo determinar la finca para la redirección.');
            return res.redirect('/fincas/gestionar'); 
        }

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/seguimiento`);
        }

        try {
            const { id_secado, fecha_seguimiento, temperatura, humedad, observaciones_seguimiento } = req.body;
            
            // Validaciones básicas
            if (!id_secado) {
                req.flash('error', 'El ID del proceso de secado es requerido');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/seguimiento`);
            }

            // Verificar que exista el proceso de secado
            const secado = await secadoDAO.getSecadoById(parseInt(id_secado));
            if (!secado) {
                req.flash('error', 'Proceso de secado no encontrado');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Verificar que el proceso esté en progreso
            if (secado.id_estado_proceso !== 2) {
                req.flash('error', 'Solo se puede registrar seguimiento para procesos en progreso');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Verificar que se haya proporcionado al menos un dato
            if (!temperatura && !humedad && !observaciones_seguimiento) {
                req.flash('error', 'Debe proporcionar al menos un dato (temperatura, humedad u observaciones)');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/seguimiento`);
            }

            // Crear objeto con datos del seguimiento
            const datosSeguimiento = {
                id_secado: parseInt(id_secado),
                fecha: fecha_seguimiento || new Date().toISOString(),
                temperatura: temperatura ? parseFloat(temperatura) : null,
                humedad: humedad ? parseFloat(humedad) : null,
                observaciones: observaciones_seguimiento || null
            };

            // Registrar el seguimiento en la base de datos
            const seguimientoId = await seguimientoSecadoDAO.createSeguimientoSecado(datosSeguimiento);
            
            if (!seguimientoId) {
                throw new Error('Error al guardar el seguimiento en la base de datos');
            }

            req.flash('mensaje', 'Seguimiento registrado correctamente');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/seguimiento`);
        } catch (error) {
            console.error('Error al procesar seguimiento de secado:', error);
            req.flash('error', 'Error interno al registrar el seguimiento: ' + error.message);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/secado/seguimiento`);
        }
    }
}

module.exports = new SecadoController();
