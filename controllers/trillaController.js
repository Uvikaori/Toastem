const trillaDAO = require('../models/dao/trillaDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const clasificacionDAO = require('../models/dao/clasificacionDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Trilla = require('../models/entities/Trilla');
const { validationResult } = require('express-validator');

class TrillaController {
    /**
     * Muestra el formulario para registrar la trilla.
     */
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

            // Verificar que la clasificación esté terminada
            if (clasificacion.id_estado_proceso !== 3) {
                req.flash('error', 'El proceso de Clasificación debe estar completado antes de registrar la Trilla.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Verificar si hay datos en flash (provienen de una validación fallida)
            const fechaTrilla = req.flash('fecha_trilla')[0];
            const pesoPergaminoFinal = req.flash('peso_pergamino_final')[0];
            const pesoPasillaFinal = req.flash('peso_pasilla_final')[0];
            const observacionesFlash = req.flash('observaciones')[0];

            // Determinar título según si es nuevo registro o edición
            const titulo = trilla && trilla.id_estado_proceso === 2 
                ? `Editar Trilla - Lote ${lote.codigo}` 
                : `Registrar Trilla - Lote ${lote.codigo}`;

            res.render('lotes/procesos/trilla-form', {
                titulo,
                finca,
                lote,
                peso_clasificado_final: clasificacion.peso_total,
                peso_pergamino: clasificacion.peso_pergamino,
                peso_pasilla: clasificacion.peso_pasilla,
                // Prioridad: 1. Valores de flash, 2. Valores existentes, 3. Valores por defecto
                fecha_trilla: fechaTrilla || (trilla ? trilla.fecha_trilla : new Date().toISOString().slice(0, 16)),
                peso_pergamino_final: pesoPergaminoFinal || (trilla ? trilla.peso_pergamino_final : ''),
                peso_pasilla_final: pesoPasillaFinal || (trilla ? trilla.peso_pasilla_final : ''),
                observaciones: observacionesFlash || (trilla ? trilla.observaciones : ''),
                es_edicion: trilla && trilla.id_estado_proceso === 2,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de trilla:', error);
            req.flash('error', 'Error al cargar el formulario de trilla.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de trilla.
     */
    async registrarTrilla(req, res) {
        try {
            const { id_finca, id_lote } = req.params;
            const { fecha_trilla, peso_pergamino_final, peso_pasilla_final, observaciones } = req.body;
            
            console.log('Datos de trilla recibidos:', { 
                fecha_trilla, 
                peso_pergamino_final, 
                peso_pasilla_final, 
                observaciones 
            });
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(e => e.msg));
                req.flash('fecha_trilla', fecha_trilla);
                req.flash('peso_pergamino_final', peso_pergamino_final);
                req.flash('peso_pasilla_final', peso_pasilla_final);
                req.flash('observaciones', observaciones);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }

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
            
            // Verificar que la clasificación esté terminada
            if (clasificacion.id_estado_proceso !== 3) {
                req.flash('error', 'El proceso de Clasificación debe estar completado antes de registrar la Trilla.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Convertir valores a números y asegurar que son valores válidos
            const pergaminoFinal = parseFloat(peso_pergamino_final);
            const pasillaFinal = parseFloat(peso_pasilla_final);
            
            if (isNaN(pergaminoFinal) || isNaN(pasillaFinal)) {
                req.flash('error', 'Los pesos deben ser números válidos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }
            
            if (pergaminoFinal < 0 || pasillaFinal < 0) {
                req.flash('error', 'Los pesos no pueden ser negativos.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }

            // Verificar que los pesos finales no sean mayores que los iniciales (con tolerancia)
            const pergaminoInicial = parseFloat(clasificacion.peso_pergamino) || 0;
            const pasillaInicial = parseFloat(clasificacion.peso_pasilla) || 0;
            const tolerancia = 0.01; // 1%
            
            if (pergaminoFinal > pergaminoInicial * (1 + tolerancia)) {
                req.flash('error', `El peso final del pergamino (${pergaminoFinal} kg) no puede ser mayor que el peso inicial (${pergaminoInicial} kg) más una tolerancia del 1%.`);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }
            
            if (pasillaFinal > pasillaInicial * (1 + tolerancia)) {
                req.flash('error', `El peso final de la pasilla (${pasillaFinal} kg) no puede ser mayor que el peso inicial (${pasillaInicial} kg) más una tolerancia del 1%.`);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/trilla/registrar`);
            }

            // Calcular peso final total
            const peso_final = pergaminoFinal + pasillaFinal;

            // Verificar si ya existe un registro de trilla para este lote
            const trillaExistente = await trillaDAO.getTrillaByLoteId(id_lote);
            
            console.log('Trilla existente:', trillaExistente);
            
            if (trillaExistente && (trillaExistente.id_estado_proceso === 2 || trillaExistente.id_estado_proceso === 1)) {
                // Si existe y está en estado "En progreso" o "Registrado", actualizarlo
                let nuevasObservaciones = observaciones || trillaExistente.observaciones || '';
                if (nuevasObservaciones && !nuevasObservaciones.includes("[ACTUALIZADO]")) {
                    nuevasObservaciones += '\n[ACTUALIZADO] ' + new Date().toLocaleString();
                }
                
                // Crear objeto con datos actualizados
                const datosActualizacion = {
                    fecha_trilla,
                    peso_pergamino_final: pergaminoFinal,
                    peso_pasilla_final: pasillaFinal,
                    peso_final,
                    observaciones: nuevasObservaciones,
                    id_estado_proceso: 3 // Cambiar a terminado
                };
                
                console.log('Actualizando trilla con datos:', datosActualizacion);
                
                // Actualizar el registro
                const resultado = await trillaDAO.updateTrilla(trillaExistente.id, datosActualizacion);
                console.log('Resultado de actualización:', resultado);
                
                req.flash('mensaje', 'Trilla actualizada exitosamente.');
            } else {
                // Si no existe o no está en estado "En progreso", crear uno nuevo
                const trillaData = new Trilla(
                    null, // id
                    id_lote,
                    fecha_trilla,
                    pergaminoInicial, // peso_pergamino_inicial
                    pasillaInicial, // peso_pasilla_inicial
                    pergaminoFinal, // peso_pergamino_final
                    pasillaFinal, // peso_pasilla_final
                    peso_final, // peso_final
                    observaciones, // observaciones
                    3 // id_estado_proceso = 3 (Terminado)
                );
    
                console.log('Creando nueva trilla con datos:', trillaData);
                
                // Registrar trilla
                await trillaDAO.createTrilla(trillaData);
                
                req.flash('mensaje', 'Trilla registrada exitosamente.');
            }

            // Buscar el siguiente proceso
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoTrillaDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'trilla');
            
            if (!procesoTrillaDef) {
                req.flash('error', "Error de configuración: Proceso 'Trilla' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoTrillaDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoTrillaDef.id;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = 'En progreso', 3 = 'Terminado'

            // Actualizar estado del lote
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);

            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
        } catch (error) {
            console.error('Error al registrar trilla:', error);
            req.flash('error', 'Error al registrar la trilla: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/trilla/registrar`);
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
}

module.exports = new TrillaController();
