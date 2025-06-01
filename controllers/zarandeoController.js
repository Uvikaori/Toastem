const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const fermentacionLavadoDAO = require('../models/dao/fermentacionLavadoDAO');
const zarandeoDAO = require('../models/dao/zarandeoDAO');
const secadoDAO = require('../models/dao/secadoDAO'); // Necesario para la validación en reiniciar
const Zarandeo = require('../models/entities/Zarandeo');
const { validationResult } = require('express-validator');
const fermentacionLavadoController = require('../controllers/fermentacionLavadoController');

class ZarandeoController {
    // --- Controladores para ZARANDEO ---
    async mostrarFormularioZarandeo(req, res) {
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

            const zarandeoExistente = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            
            // Si existe un zarandeo y está en estado "En Progreso" (id_estado_proceso = 2),
            // permitimos editarlo en lugar de redirigir
            if (zarandeoExistente && zarandeoExistente.id_estado_proceso !== 2) {
                req.flash('info', 'El proceso de Zarandeo ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const fermentacionInfo = await fermentacionLavadoDAO.getFermentacionLavadoByLoteId(id_lote);
            if (!fermentacionInfo || fermentacionInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Fermentación y Lavado debe estar completado para registrar el Zarandeo.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Si estamos editando un zarandeo existente, usamos sus valores
            const titulo = zarandeoExistente ? `Actualizar Zarandeo - Lote ${lote.codigo}` : `Registrar Zarandeo - Lote ${lote.codigo}`;
            const fechaZarandeo = req.flash('fecha_zarandeo')[0] || 
                                 (zarandeoExistente ? zarandeoExistente.fecha_zarandeo : '');
            const pesoFinalZarandeo = req.flash('peso_final_zarandeo')[0] || 
                                     (zarandeoExistente ? zarandeoExistente.peso_final : '');
            const observacionesZarandeo = req.flash('observaciones_zarandeo')[0] || 
                                         (zarandeoExistente ? zarandeoExistente.observaciones : '');

            res.render('lotes/procesos/zarandeo-form', {
                titulo: titulo,
                finca: finca,
                lote: lote,
                peso_fermentacion_final: fermentacionInfo.peso_final,
                fecha_zarandeo: fechaZarandeo,
                peso_final_zarandeo: pesoFinalZarandeo,
                observaciones_zarandeo: observacionesZarandeo,
                zarandeo: zarandeoExistente, // Pasamos el objeto zarandeo a la vista
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
                req.flash('error', 'No se encontró el peso final de la fermentación. Asegúrese de que el proceso anterior esté registrado y completado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);
            }

            const zarandeoData = new Zarandeo(
                null, // id
                id_lote,
                fermentacionInfo.peso_final, // Peso inicial para zarandeo
                req.body.fecha_zarandeo,
                req.body.peso_final_zarandeo,
                req.body.observaciones_zarandeo
                // id_estado_proceso será 3 (Terminado) por defecto desde la entidad o DAO
            );
            
            await zarandeoDAO.createZarandeo(zarandeoData);

            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoZarandeoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'zarandeo');

            if (!procesoZarandeoDef) {
                req.flash('error', "Error de configuración: Proceso 'Zarandeo' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoZarandeoDef.orden + 1));
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoZarandeoDef.id;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = 'En progreso', 3 = 'Terminado' (si no hay siguiente)

            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);

            req.flash('mensaje', 'Proceso de Zarandeo registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar zarandeo:', error);
            req.flash('error', 'Error interno al registrar el zarandeo.');
            req.flash('fecha_zarandeo', req.body.fecha_zarandeo);
            req.flash('peso_final_zarandeo', req.body.peso_final_zarandeo);
            req.flash('observaciones_zarandeo', req.body.observaciones_zarandeo);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);
        }
    }

    /**
     * Reinicia un proceso de zarandeo para permitir su corrección.
     * Solo se puede reiniciar si es el proceso actual o si no hay procesos posteriores registrados.
     */
    async reiniciarProcesoZarandeo(req, res) {
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

            const zarandeo = await zarandeoDAO.getZarandeoByLoteId(id_lote);
            if (!zarandeo) {
                req.flash('error', 'El proceso de zarandeo no ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            if (zarandeo.id_estado_proceso !== 3) { // Solo se pueden reiniciar procesos terminados
                req.flash('error', 'El Zarandeo solo se puede reiniciar si está marcado como terminado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Verificar que no haya procesos posteriores al zarandeo ya registrados para este lote
            const secadoRegistrado = await secadoDAO.getSecadoByLoteId(id_lote);
            if (secadoRegistrado) {
                 req.flash('error', 'No se puede reiniciar el Zarandeo porque ya existen procesos posteriores (Secado) registrados.');
                 return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Cambiar el estado del zarandeo a 'En Progreso' (o 'Por Hacer')
            // Aquí lo pondremos 'En Progreso' para que se pueda editar directamente
            await zarandeoDAO.updateEstadoZarandeo(zarandeo.id, 2); // 2 = En Progreso

            // Actualizar el estado del lote para que el proceso actual sea 'Zarandeo' y estado 'En Progreso'
            const procesoZarandeoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'zarandeo');
            
            if (!procesoZarandeoDef) {
                req.flash('error', "Error de configuración: Proceso 'Zarandeo' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoZarandeoDef.id, 2); // Lote en estado 'En progreso'

            req.flash('mensaje', 'Proceso de Zarandeo reiniciado. Ahora puede corregir los datos en el formulario.');
            // Redirigir al formulario de Zarandeo para editar.
            // Es importante que el formulario de Zarandeo ahora pueda manejar la edición.
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/zarandeo/registrar`);

        } catch (error) {
            console.error('Error al reiniciar proceso de zarandeo:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de zarandeo.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

module.exports = new ZarandeoController();