const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const procesosDAO = require('../models/dao/procesosDAO'); // Para la lógica de avanzar al siguiente proceso
const despulpadoDAO = require('../models/dao/despulpadoDAO');
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO');
const FermentacionLavado = require('../models/entities/FermentacionLavado'); // Si usas la entidad directamente

const { validationResult } = require('express-validator');

class DespulpadoController {
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
            if (despulpadoExistente && despulpadoExistente.id_estado_proceso !== 1) {
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

            // Verificar si ya existe un registro en estado "Por hacer"
            const despulpadoExistente = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            
            const despulpadoData = {
                id_lote: id_lote,
                peso_inicial: loteOriginal.peso_inicial, // Peso ANTES del despulpado es el peso inicial del lote
                fecha_remojo: req.body.fecha_remojo,
                fecha_despulpado: req.body.fecha_despulpado,
                peso_final: req.body.peso_final_despulpado, // Peso DESPUÉS del despulpado
                observaciones: req.body.observaciones_despulpado,
                id_estado_proceso: 3 // 3 = Terminado para la etapa
            };
            
            // Si existe un registro en estado "Por hacer", actualizarlo en lugar de crear uno nuevo
            if (despulpadoExistente && despulpadoExistente.id_estado_proceso === 1) {
                // Añadir indicador de que ha sido una corrección
                let observaciones = despulpadoData.observaciones || '';
                observaciones += '\n[CORRECCIÓN COMPLETADA] ' + new Date().toLocaleString();
                despulpadoData.observaciones = observaciones;
                
                await despulpadoDAO.updateDespulpado(despulpadoExistente.id, despulpadoData);
            } else {
                // Crear un nuevo registro si no existe uno en estado "Por hacer"
                await despulpadoDAO.createDespulpado(despulpadoData);
            }

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

     async reiniciarProcesoDespulpado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_despulpado = parseInt(req.params.id_despulpado);
            const { motivo } = req.body;

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

            // Verificar que el proceso existe
            const despulpado = await despulpadoDAO.getDespulpadoByLoteId(id_lote);
            if (!despulpado || despulpado.id !== id_despulpado) {
                req.flash('error', 'El proceso de despulpado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (despulpado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await despulpadoDAO.reiniciarDespulpado(id_despulpado);

            // Actualizar el estado del lote para reflejar que está en el proceso de despulpado
            const procesoDespulpadoActualDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'despulpado');
            
            if (!procesoDespulpadoActualDef) {
                req.flash('error', "Error de configuración: Proceso 'Despulpado' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Actualizar el lote para que refleje este proceso actual y el estado general 'En progreso'
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoDespulpadoActualDef.id, 2); // 2 = 'En progreso'

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