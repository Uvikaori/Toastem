const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const despulpadoDAO = require('../models/dao/despulpadoDAO');
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO');
const FermentacionLavado = require('../models/entities/FermentacionLavado');
const { validationResult } = require('express-validator');

class FermentacionLavadoController {
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

            const fermentacionExistente = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (fermentacionExistente && fermentacionExistente.id_estado_proceso !== 1) {
                req.flash('error', 'El proceso de Fermentación y Lavado ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpadoInfo || despulpadoInfo.id_estado_proceso !== 3) {
                req.flash('error', 'El proceso de Despulpado debe estar completado antes de registrar la Fermentación y Lavado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/fermentacion-lavado-form', {
                titulo: `Registrar Fermentación y Lavado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                peso_despulpado_final: despulpadoInfo.peso_final,
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
            const despulpadoInfo = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpadoInfo || !despulpadoInfo.peso_final) {
                req.flash('error', 'No se encontró el peso final del despulpado. Asegúrese de que el proceso de despulpado esté registrado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`);
            }

            const fermentacionExistente = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);

            const fermentacionData = new FermentacionLavado(
                null,
                id_lote,
                despulpadoInfo.peso_final,
                req.body.fecha_inicio_fermentacion,
                req.body.fecha_lavado,
                req.body.peso_final_fermentacion,
                req.body.observaciones_fermentacion
            );

            if (fermentacionExistente && fermentacionExistente.id_estado_proceso === 1) {
                let observaciones = fermentacionData.observaciones || '';
                observaciones += '\n[CORRECCIÓN COMPLETADA] ' + new Date().toLocaleString();
                fermentacionData.observaciones = observaciones;
                fermentacionData.id = fermentacionExistente.id;

                await fermentacionLavadoDAO.updateFermentacionLavado(fermentacionData);
            } else {
                await fermentacionLavadoDAO.createFermentacionLavado(fermentacionData);
            }

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoFermentacionDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'fermentación y lavado');

            if (!procesoFermentacionDef) {
                console.error("Error crítico: El proceso 'Fermentación y Lavado' no está definido.");
                req.flash('error', "Error de configuración: Proceso 'Fermentación y Lavado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoFermentacionDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoFermentacionDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2);

            req.flash('mensaje', 'Proceso de Fermentación y Lavado registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar fermentación y lavado:', error);
            req.flash('error', 'Error interno al registrar la fermentación y lavado.');
            req.flash('fecha_inicio_fermentacion', req.body.fecha_inicio_fermentacion);
            req.flash('fecha_lavado', req.body.fecha_lavado);
            req.flash('peso_final_fermentacion', req.body.peso_final_fermentacion);
            req.flash('observaciones_fermentacion', req.body.observaciones_fermentacion);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/fermentacion-lavado/registrar`);
        }
    }
    
     async reiniciarProcesoFermentacionLavado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_fermentacion = parseInt(req.params.id_fermentacion);

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

            const fermentacion = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (!fermentacion || fermentacion.id !== id_fermentacion) {
                req.flash('error', 'El proceso de fermentación y lavado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (fermentacion.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            await fermentacionLavadoDAO.reiniciarFermentacionLavado(id_fermentacion);

            const procesoFermentacionDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'fermentación y lavado');
            
            if (!procesoFermentacionDef) {
                req.flash('error', "Error de configuración: Proceso 'Fermentación y Lavado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoFermentacionDef.id, 2);

            req.flash('mensaje', 'Proceso de Fermentación y Lavado reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de fermentación y lavado:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de fermentación y lavado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

module.exports = new FermentacionLavadoController();
