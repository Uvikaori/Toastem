const clasificacionDAO = require('../models/dao/clasificacionDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const secadoDAO = require('../models/dao/secadoDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Clasificacion = require('../models/entities/Clasificacion');
const { validationResult } = require('express-validator');

class ClasificacionController {
    /**
     * Muestra el formulario para registrar la clasificación.
     */
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

    /**
     * Procesa el registro de clasificación.
     */
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

            // Convertir pesos a números para realizar validaciones
            const pesoTotal = parseFloat(req.body.peso_total) || 0;
            const pesoPergamino = parseFloat(req.body.peso_pergamino) || 0;
            const pesoPasilla = parseFloat(req.body.peso_pasilla) || 0;
            const pesoSecadoFinal = parseFloat(secadoInfo.peso_final) || 0;

            // Validación 1: El peso total debe ser cercano a la suma de peso pergamino y peso pasilla
            // Permitimos una pequeña tolerancia (0.1 kg) para errores de redondeo
            const sumaPesos = pesoPergamino + pesoPasilla;
            const tolerancia = 0.1;
            if (Math.abs(pesoTotal - sumaPesos) > tolerancia) {
                req.flash('error', `El peso total (${pesoTotal} kg) debe ser igual a la suma del peso pergamino (${pesoPergamino} kg) y peso pasilla (${pesoPasilla} kg): ${sumaPesos} kg.`);
                req.flash('fecha_clasificacion', req.body.fecha_clasificacion);
                req.flash('peso_total', req.body.peso_total);
                req.flash('peso_pergamino', req.body.peso_pergamino);
                req.flash('peso_pasilla', req.body.peso_pasilla);
                req.flash('observaciones', req.body.observaciones);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
            }

            // Validación 2: El peso total no debe superar el peso final del secado
            // Consideramos una tolerancia del 1% para posibles errores de medición
            const toleranciaPorcentaje = 0.01;
            const toleranciaMaxima = pesoSecadoFinal * (1 + toleranciaPorcentaje);
            if (pesoTotal > toleranciaMaxima) {
                req.flash('error', `El peso total de la clasificación (${pesoTotal} kg) no puede superar el peso final del secado (${pesoSecadoFinal} kg) más una tolerancia del 1% (${toleranciaMaxima.toFixed(2)} kg).`);
                req.flash('fecha_clasificacion', req.body.fecha_clasificacion);
                req.flash('peso_total', req.body.peso_total);
                req.flash('peso_pergamino', req.body.peso_pergamino);
                req.flash('peso_pasilla', req.body.peso_pasilla);
                req.flash('observaciones', req.body.observaciones);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/clasificacion/registrar`);
            }

            // Si existe en estado 1, actualizar (UPDATE), si no existe, crear (INSERT)
            if (clasificacionExistente && clasificacionExistente.id_estado_proceso === 1) {
                // UPDATE
                await clasificacionDAO.updateClasificacion(clasificacionExistente.id, {
                    peso_inicial: secadoInfo.peso_final,
                    fecha_clasificacion: req.body.fecha_clasificacion,
                    peso_total: pesoTotal,
                    peso_pergamino: pesoPergamino,
                    peso_pasilla: pesoPasilla,
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
                    pesoTotal, // peso_total
                    pesoPergamino, // peso_pergamino
                    pesoPasilla, // peso_pasilla
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
}

module.exports = new ClasificacionController();
