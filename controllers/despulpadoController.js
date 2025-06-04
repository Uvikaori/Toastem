const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const despulpadoDAO = require('../models/dao/despulpadoDAO');
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO');
const FermentacionLavado = require('../models/entities/FermentacionLavado');

const { validationResult } = require('express-validator');

class DespulpadoController {
    async mostrarFormularioDespulpado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { return res.redirect('/fincas/gestionar'); }
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { return res.redirect(`/fincas/${id_finca}/lotes`);}

            const despulpadoExistente = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (despulpadoExistente && despulpadoExistente.id_estado_proceso !== 1) {
                req.flash('error', 'El proceso de despulpado ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/procesos/despulpado-form', {
                titulo: `Registrar Despulpado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
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
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_remojo', req.body.fecha_remojo);
            req.flash('fecha_despulpado', req.body.fecha_despulpado);
            req.flash('peso_final_despulpado', req.body.peso_final_despulpado);
            req.flash('observaciones_despulpado', req.body.observaciones_despulpado);
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/despulpado/registrar`);
        }

        try {
            const loteOriginal = await loteDAO.getLoteById(id_lote);
            if(!loteOriginal) { throw new Error('Lote original no encontrado para despulpado.'); }

            const despulpadoExistente = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            
            const despulpadoData = {
                id_lote: id_lote,
                peso_inicial: loteOriginal.peso_inicial,
                fecha_remojo: req.body.fecha_remojo,
                fecha_despulpado: req.body.fecha_despulpado,
                peso_final: req.body.peso_final_despulpado,
                observaciones: req.body.observaciones_despulpado,
                id_estado_proceso: 3
            };
            
            if (despulpadoExistente && despulpadoExistente.id_estado_proceso === 1) {
                let observaciones = despulpadoData.observaciones || '';
                observaciones += '\n[CORRECCIÓN COMPLETADA] ' + new Date().toLocaleString();
                despulpadoData.observaciones = observaciones;
                
                await despulpadoDAO.updateDespulpado(despulpadoExistente.id, despulpadoData);
            } else {
                await despulpadoDAO.createDespulpado(despulpadoData);
            }

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoDespulpadoActualDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'despulpado');

            if (!procesoDespulpadoActualDef) {
                console.error("Error crítico: El proceso 'despulpado' no está definido en la tabla 'procesos'.");
                req.flash('error', "Error de configuración del sistema: Proceso 'despulpado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const ordenProcesoDespulpado = procesoDespulpadoActualDef.orden;
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (ordenProcesoDespulpado + 1));
            
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoDespulpadoActualDef.id;

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, 2);

            req.flash('mensaje', 'Proceso de Despulpado registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar despulpado:', error);
            req.flash('error', 'Error interno al registrar el despulpado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/despulpado/registrar`);
        }
    }

     async reiniciarProcesoDespulpado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_despulpado = parseInt(req.params.id_despulpado);
            const { motivo } = req.body;

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

            const despulpado = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpado || despulpado.id !== id_despulpado) {
                req.flash('error', 'El proceso de despulpado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (despulpado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            await despulpadoDAO.reiniciarDespulpado(id_despulpado);

            const procesoDespulpadoActualDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'despulpado');
            
            if (!procesoDespulpadoActualDef) {
                req.flash('error', "Error de configuración: Proceso 'Despulpado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoDespulpadoActualDef.id, 2);

            req.flash('mensaje', 'Proceso de Despulpado reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de despulpado:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de despulpado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

module.exports = new DespulpadoController();