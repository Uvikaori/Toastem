const moliendaDAO = require('../models/dao/moliendaDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const tuesteDAO = require('../models/dao/tuesteDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Molienda = require('../models/entities/Molienda');
const { validationResult } = require('express-validator');
const { validateMolienda } = require('../validators/moliendaValidator');

/**
 * Middleware para cargar los datos del tueste antes de la validación
 */
const cargarDatosTueste = async (req, res, next) => {
    try {
        const id_lote = parseInt(req.params.id_lote);
        const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);
        
        if (!tuesteInfo || tuesteInfo.id_estado_proceso !== 3) {
            req.flash('error', 'El proceso de Tueste debe estar completado antes de registrar la Molienda.');
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
        }
        
        tuesteInfo.peso_pergamino_final = parseFloat(tuesteInfo.peso_pergamino_final || 0);
        tuesteInfo.peso_pasilla_final = parseFloat(tuesteInfo.peso_pasilla_final || 0);
        
        req.tueste_info = tuesteInfo;
        next();
    } catch (error) {
        console.error('Error al cargar datos de tueste:', error);
        req.flash('error', 'Error al cargar los datos del tueste: ' + error.message);
        return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
    }
};

class MoliendaController {
    /**
     * Muestra el formulario para registrar la molienda.
     */
    async mostrarFormularioMolienda(req, res) {
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

            const moliendaExistente = await moliendaDAO.getMoliendaByLoteId(id_lote);
            let esModificacion = false;
            let mensajeModificacion = '';
            
            if (moliendaExistente && moliendaExistente.some(m => m.id_estado_proceso === 2 || m.id_estado_proceso === 3)) {
                req.flash('error', 'Ya existe un registro de molienda activo para este lote. Si desea realizar un nuevo registro, primero debe reiniciar el proceso existente.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            if (moliendaExistente && moliendaExistente.some(m => m.id_estado_proceso === 1)) {
                esModificacion = true;
                mensajeModificacion = 'Está modificando un registro de molienda que fue reiniciado. Los cambios reemplazarán los datos anteriores.';
            }

            const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (!tuesteInfo || tuesteInfo.id_estado_proceso !== 3) {
                req.flash('error', 'El proceso de Tueste debe estar completado antes de registrar la Molienda.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            if (tuesteInfo) {
                tuesteInfo.peso_pergamino_final = parseFloat(tuesteInfo.peso_pergamino_final || 0);
                tuesteInfo.peso_pasilla_final = parseFloat(tuesteInfo.peso_pasilla_final || 0);
            }
            
            const fecha_molienda = req.flash('fecha_molienda')[0] || '';
            const observaciones = req.flash('observaciones')[0] || '';

            res.render('lotes/procesos/molienda-form', {
                titulo: `${esModificacion ? 'Modificar' : 'Registrar'} Molienda - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                tueste_info: tuesteInfo,
                fecha_molienda: fecha_molienda,
                observaciones: observaciones,
                mensaje: esModificacion ? mensajeModificacion : req.flash('mensaje'),
                error: req.flash('error'),
                esModificacion: esModificacion
            });

        } catch (error) {
            console.error('Error al mostrar formulario de molienda:', error);
            req.flash('error', 'Error al cargar el formulario de molienda: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de molienda.
     */
    async registrarMolienda(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(e => e.msg));
                req.flash('fecha_molienda', req.body.fecha_molienda);
                req.flash('observaciones', req.body.observaciones);
                
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/molienda/registrar`);
            }

            const tuesteInfo = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (!tuesteInfo || tuesteInfo.id_estado_proceso !== 3) {
                req.flash('error', 'El proceso de Tueste debe estar completado antes de registrar la Molienda.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const { fecha_molienda, observaciones } = req.body;
            let algunaMoliendaRegistrada = false;

            const moliendaExistente = await moliendaDAO.getMoliendaByLoteId(id_lote);
            const esModificacion = moliendaExistente && moliendaExistente.some(m => m.id_estado_proceso === 1);
            
            let observacionesConContexto = observaciones || '';
            if (esModificacion) {
                observacionesConContexto = `${observacionesConContexto} [Modificación: ${new Date().toLocaleString('es-CO')}]`.trim();
            }

            if (tuesteInfo.peso_pergamino_final && parseFloat(tuesteInfo.peso_pergamino_final) > 0) {
                const mantenerGranoPergamino = req.body.pergamino_mantener_grano_check === 'on';
                const pesoMantenidoGranoPergamino = parseFloat(req.body.pergamino_peso_mantenido_grano) || 0;
                
                if (mantenerGranoPergamino && pesoMantenidoGranoPergamino > 0) {
                    const moliendaGranoPergamino = new Molienda(
                        null, tuesteInfo.id, fecha_molienda,
                        pesoMantenidoGranoPergamino,
                        null,
                        pesoMantenidoGranoPergamino,
                        true,
                        pesoMantenidoGranoPergamino,
                        `${observacionesConContexto} [Pergamino en Grano]`.trim(),
                        3
                    );
                    await moliendaDAO.createMolienda(moliendaGranoPergamino, 'Pergamino');
                    algunaMoliendaRegistrada = true;
                }

                const pesoInicialAMolerPergamino = parseFloat(req.body.pergamino_peso_inicial_a_moler) || 0;
                const tipoMoliendaPergamino = req.body.pergamino_tipo_molienda;
                const pesoFinalMolidoPergamino = parseFloat(req.body.pergamino_peso_final_molido) || 0;

                if (pesoInicialAMolerPergamino > 0 && tipoMoliendaPergamino && pesoFinalMolidoPergamino > 0) {
                    const moliendaPergaminoMolido = new Molienda(
                        null, tuesteInfo.id, fecha_molienda,
                        pesoInicialAMolerPergamino,
                        tipoMoliendaPergamino,
                        pesoFinalMolidoPergamino,
                        false,
                        pesoFinalMolidoPergamino,
                        `${observacionesConContexto} [Pergamino Molido ${tipoMoliendaPergamino}]`.trim(),
                        3
                    );
                    await moliendaDAO.createMolienda(moliendaPergaminoMolido, 'Pergamino');
                    algunaMoliendaRegistrada = true;
                }
            }

            if (tuesteInfo.peso_pasilla_final && parseFloat(tuesteInfo.peso_pasilla_final) > 0) {
                const mantenerGranoPasilla = req.body.pasilla_mantener_grano_check === 'on';
                const pesoMantenidoGranoPasilla = parseFloat(req.body.pasilla_peso_mantenido_grano) || 0;

                if (mantenerGranoPasilla && pesoMantenidoGranoPasilla > 0) {
                    const moliendaGranoPasilla = new Molienda(
                        null, tuesteInfo.id, fecha_molienda,
                        pesoMantenidoGranoPasilla,
                        null,
                        pesoMantenidoGranoPasilla,
                        true,
                        pesoMantenidoGranoPasilla,
                        `${observacionesConContexto} [Pasilla en Grano]`.trim(),
                        3
                    );
                    await moliendaDAO.createMolienda(moliendaGranoPasilla, 'Pasilla');
                    algunaMoliendaRegistrada = true;
                }

                const pesoInicialAMolerPasilla = parseFloat(req.body.pasilla_peso_inicial_a_moler) || 0;
                const tipoMoliendaPasilla = req.body.pasilla_tipo_molienda;
                const pesoFinalMolidoPasilla = parseFloat(req.body.pasilla_peso_final_molido) || 0;

                if (pesoInicialAMolerPasilla > 0 && tipoMoliendaPasilla && pesoFinalMolidoPasilla > 0) {
                    const moliendaPasillaMolida = new Molienda(
                        null, tuesteInfo.id, fecha_molienda,
                        pesoInicialAMolerPasilla,
                        tipoMoliendaPasilla,
                        pesoFinalMolidoPasilla,
                        false,
                        pesoFinalMolidoPasilla,
                        `${observacionesConContexto} [Pasilla Molida ${tipoMoliendaPasilla}]`.trim(),
                        3
                    );
                    await moliendaDAO.createMolienda(moliendaPasillaMolida, 'Pasilla');
                    algunaMoliendaRegistrada = true;
                }
            }
            
            if (!algunaMoliendaRegistrada) {
                req.flash('error', 'No se proporcionaron datos suficientes para registrar ninguna molienda (ni en grano ni molido).');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/molienda/registrar`);
            }
            
            req.flash('mensaje', 'Molienda registrada exitosamente.');
            
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoMoliendaDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'molienda');
            
            if (!procesoMoliendaDef) {
                req.flash('error', "Error de configuración: Proceso 'Molienda' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoMoliendaDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoMoliendaDef.id;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3;
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);
            
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            
        } catch (error) {
            console.error('Error al registrar molienda:', error);
            req.flash('error', 'Error al registrar el proceso de molienda: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
    }

    /**
     * Reinicia un proceso de molienda para permitir su corrección.
     */
    async reiniciarProcesoMolienda(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_molienda = parseInt(req.params.id_molienda);

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

            const moliendas = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendas || !moliendas.some(m => m.id === id_molienda)) {
                req.flash('error', 'El proceso de molienda no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const molienda = moliendas.find(m => m.id === id_molienda);
            
            if (molienda.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            await moliendaDAO.reiniciarMolienda(id_molienda);

            const procesoMoliendaDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'molienda');
            
            if (procesoMoliendaDef) {
                await loteDAO.updateLoteProcesoYEstado(id_lote, procesoMoliendaDef.id, 2);
            }
            
            req.flash('mensaje', 'Proceso de molienda reiniciado correctamente. Puede volver a registrarlo.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/molienda/registrar`);
            
        } catch (error) {
            console.error('Error al reiniciar proceso de molienda:', error);
            req.flash('error', 'Ocurrió un error al reiniciar el proceso de molienda: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia todo el proceso de molienda para un lote, independientemente del tipo de café.
     */
    async reiniciarProcesoMoliendaCompleto(req, res) {
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

            const moliendas = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendas || moliendas.length === 0) {
                req.flash('error', 'No se encontraron registros de molienda para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const moliendaCompletadas = moliendas.filter(m => m.id_estado_proceso === 3);
            if (moliendaCompletadas.length === 0) {
                req.flash('error', 'No hay registros de molienda completados para reiniciar.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const promesasReinicio = moliendaCompletadas.map(m => moliendaDAO.reiniciarMolienda(m.id));
            await Promise.all(promesasReinicio);

            const procesoMoliendaDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'molienda');
            
            if (procesoMoliendaDef) {
                await loteDAO.updateLoteProcesoYEstado(id_lote, procesoMoliendaDef.id, 2);
            }
            
            req.flash('mensaje', 'Proceso de molienda reiniciado completamente. Puede volver a registrarlo.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/molienda/registrar`);
            
        } catch (error) {
            console.error('Error al reiniciar proceso completo de molienda:', error);
            req.flash('error', 'Ocurrió un error al reiniciar el proceso de molienda: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

MoliendaController.prototype.middlewares = {
    cargarDatosTueste
};

module.exports = new MoliendaController();
