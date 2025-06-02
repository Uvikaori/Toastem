const empacadoDAO = require('../models/dao/empacadoDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const moliendaDAO = require('../models/dao/moliendaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Empacado = require('../models/entities/Empacado');
const { validationResult } = require('express-validator');
const MoliendaDAO = require('../models/dao/moliendaDAO');
const { setMessages } = require('../utils/messages');

/**
 * Procesa un empacado individual
 * @private
 */
async function procesarEmpacadoIndividual(id_lote, tipo_producto_empacado, datosFormulario, id_molienda_asociada, fecha_empacado) {
    // Verificar si ya existe un empacado para este tipo y lote
    const empacadosExistentesTipo = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, tipo_producto_empacado);
    
    // Si hay alguno TERMINADO (estado 3) y NO histórico, no permitimos empacar de nuevo este tipo
    if (empacadosExistentesTipo.some(e => e.id_estado_proceso === 3 && !e.es_historico)) { 
        console.warn(`Intento de re-empacar ${tipo_producto_empacado} para lote ${id_lote} que ya está finalizado. Omitiendo.`);
        return {
            omitido: true,
            tipo: tipo_producto_empacado,
            mensaje: `El tipo de producto '${tipo_producto_empacado}' ya fue empacado y finalizado. No se registró nuevamente.`
        };
    }

    // Construir claves dinámicamente para acceder a los datos del formulario
    const tipo_key_suffix = tipo_producto_empacado.toLowerCase().replace(' pasilla molido', '_pasilla').replace(' ', '_');
    const peso_inicial_key = 'peso_inicial_' + tipo_key_suffix;
    const peso_empacado_key = 'peso_empacado_' + tipo_key_suffix;
    const total_empaques_key = 'total_empaques_' + tipo_key_suffix;
    const observaciones_key = 'observaciones_' + tipo_key_suffix;

    // Parsear valores con valores por defecto si no existen
    let peso_inicial_form = parseFloat(datosFormulario[peso_inicial_key]) || 0;
    let peso_empacado_form = parseFloat(datosFormulario[peso_empacado_key]) || 0;
    let total_empaques_form = parseInt(datosFormulario[total_empaques_key]) || 0;
    const observaciones_form = datosFormulario[observaciones_key] || '';

    // Asegurar valores mínimos positivos
    peso_inicial_form = Math.max(0.01, peso_inicial_form);
    peso_empacado_form = Math.max(0.01, peso_empacado_form);
    total_empaques_form = Math.max(1, total_empaques_form);

    try {
        // Comprobar si hay algún empacado REINICIADO (estado 1) y NO histórico para actualizar
        const empacadoReiniciado = empacadosExistentesTipo.find(e => e.id_estado_proceso === 1 && !e.es_historico);
        
        if (empacadoReiniciado) {
            // Si existe un registro reiniciado, actualizarlo
            let nuevasObservaciones = observaciones_form;
            
            if (empacadoReiniciado.observaciones && empacadoReiniciado.observaciones.includes('[CORRECCIÓN INICIADA]')) {
                nuevasObservaciones = (nuevasObservaciones ? nuevasObservaciones + '\n' : '') +
                    `[CORRECCIÓN COMPLETADA] ${new Date().toLocaleString()}`;
            }
            
            await empacadoDAO.updateEmpacado(empacadoReiniciado.id, {
                fecha_empacado,
                peso_inicial: peso_inicial_form,
                peso_empacado: peso_empacado_form,
                total_empaques: total_empaques_form,
                observaciones: nuevasObservaciones,
                id_estado_proceso: 3
            });
            
            return { 
                id: empacadoReiniciado.id, 
                tipo: tipo_producto_empacado,
                actualizado: true
            };
        } else {
            // Obtener el ID de molienda adecuado
            let id_molienda_final = null;
            
            // Si id_molienda_asociada es un array, buscar la molienda correspondiente
            if (Array.isArray(id_molienda_asociada)) {
                // Para Grano, buscar molienda de Pergamino que sea grano
                if (tipo_producto_empacado === 'Grano') {
                    const moliendaGrano = id_molienda_asociada.find(
                        m => m.tipo_cafe === 'Pergamino' && m.es_grano === true && m.id_estado_proceso === 3
                    );
                    if (moliendaGrano) id_molienda_final = moliendaGrano.id;
                } 
                // Para Molido, buscar molienda de Pergamino que no sea grano
                else if (tipo_producto_empacado === 'Molido') {
                    const moliendaMolido = id_molienda_asociada.find(
                        m => m.tipo_cafe === 'Pergamino' && m.es_grano === false && m.id_estado_proceso === 3
                    );
                    if (moliendaMolido) id_molienda_final = moliendaMolido.id;
                } 
                // Para Pasilla Molido, buscar molienda de Pasilla
                else if (tipo_producto_empacado === 'Pasilla Molido') {
                    const moliendaPasilla = id_molienda_asociada.find(
                        m => m.tipo_cafe === 'Pasilla' && m.id_estado_proceso === 3
                    );
                    if (moliendaPasilla) id_molienda_final = moliendaPasilla.id;
                }
            } 
            // Si es un único ID, usarlo directamente
            else if (id_molienda_asociada && typeof id_molienda_asociada === 'number') {
                id_molienda_final = id_molienda_asociada;
            }

            // Crear un nuevo registro
            const nuevoEmpacado = new Empacado(
                null,
                id_lote,
                fecha_empacado,
                peso_inicial_form,
                peso_empacado_form,
                total_empaques_form,
                tipo_producto_empacado,
                observaciones_form,
                3,
                null, // id_tueste
                id_molienda_final,
                false // No es histórico
            );

            try {
                console.log('Intentando crear empacado con datos:', JSON.stringify(nuevoEmpacado));
                const resultado = await empacadoDAO.createEmpacado(nuevoEmpacado);
                return { 
                    id: resultado, 
                    tipo: tipo_producto_empacado,
                    nuevo: true
                };
            } catch (error) {
                console.error(`Error al guardar empacado de ${tipo_producto_empacado}:`, error);
                return {
                    error: `Error al guardar empacado de ${tipo_producto_empacado}: ${error.message}`
                };
            }
        }
    } catch (error) {
        console.error(`Error al procesar empacado de ${tipo_producto_empacado}:`, error);
        return {
            error: `Error al procesar empacado de ${tipo_producto_empacado}: ${error.message}`
        };
    }
}

class EmpacadoController {
    /**
     * Muestra el formulario para registrar el empacado.
     */
    async mostrarFormularioEmpacado(req, res) {
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
                return res.redirect('/fincas/' + id_finca + '/lotes');
            }

            // Verificar que existe un proceso de molienda previo y está terminado
            const moliendaInfo = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendaInfo || (Array.isArray(moliendaInfo) && !moliendaInfo.some(m => m.id_estado_proceso === 3))) {
                setMessages.procesos.error(req, 'El proceso de Molienda debe estar completado antes de registrar el Empacado.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }
            
            // Obtener los empacados existentes para este lote por tipo de producto
            const empacadoGrano = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Grano');
            const empacadoMolido = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Molido');
            const empacadoPasilla = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Pasilla Molido');
            
            // Calcular el peso total disponible para empacar
            let pesoTotalDisponible = 0;
            let pesoPergaminoMolido = 0;
            let pesoPergaminoGrano = 0;
            let pesoPasillaMolido = 0;
            
            if (Array.isArray(moliendaInfo)) {
                moliendaInfo.forEach(m => {
                    if (m.id_estado_proceso === 3 && m.peso_final) {
                        const pesoFinal = parseFloat(m.peso_final);
                        pesoTotalDisponible += pesoFinal;
                        
                        if (m.tipo_cafe === 'Pergamino') {
                            if (m.es_grano) {
                                pesoPergaminoGrano += pesoFinal;
                            } else {
                                pesoPergaminoMolido += pesoFinal;
                            }
                        } else if (m.tipo_cafe === 'Pasilla' && !m.es_grano) {
                            pesoPasillaMolido += pesoFinal;
                        }
                    }
                });
            } else if (moliendaInfo && moliendaInfo.id_estado_proceso === 3) {
                pesoTotalDisponible = parseFloat(moliendaInfo.peso_final) || 0;
                if (moliendaInfo.tipo_cafe === 'Pergamino') {
                    if (moliendaInfo.es_grano) {
                        pesoPergaminoGrano = pesoTotalDisponible;
                    } else {
                        pesoPergaminoMolido = pesoTotalDisponible;
                    }
                } else if (moliendaInfo.tipo_cafe === 'Pasilla' && !moliendaInfo.es_grano) {
                    pesoPasillaMolido = pesoTotalDisponible;
                }
            }

            // Restar los pesos ya empacados
            if (empacadoGrano.length > 0 && empacadoGrano.some(e => e.id_estado_proceso === 3)) {
                const pesoYaEmpacado = empacadoGrano
                    .filter(e => e.id_estado_proceso === 3)
                    .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                pesoPergaminoGrano -= pesoYaEmpacado;
            }
            
            if (empacadoMolido.length > 0 && empacadoMolido.some(e => e.id_estado_proceso === 3)) {
                const pesoYaEmpacado = empacadoMolido
                    .filter(e => e.id_estado_proceso === 3)
                    .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                pesoPergaminoMolido -= pesoYaEmpacado;
            }
            
            if (empacadoPasilla.length > 0 && empacadoPasilla.some(e => e.id_estado_proceso === 3)) {
                const pesoYaEmpacado = empacadoPasilla
                    .filter(e => e.id_estado_proceso === 3)
                    .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                pesoPasillaMolido -= pesoYaEmpacado;
            }
            
            // Asegurar que no haya pesos negativos
            pesoPergaminoGrano = Math.max(0, pesoPergaminoGrano);
            pesoPergaminoMolido = Math.max(0, pesoPergaminoMolido);
            pesoPasillaMolido = Math.max(0, pesoPasillaMolido);

            // Recalcular el peso total disponible
            pesoTotalDisponible = pesoPergaminoGrano + pesoPergaminoMolido + pesoPasillaMolido;

            // Verificar si hay empacados previos y café por empacar
            const hayEmpacadosPreviosCompletados =
                (empacadoGrano && empacadoGrano.some(e => e.id_estado_proceso === 3)) ||
                (empacadoMolido && empacadoMolido.some(e => e.id_estado_proceso === 3)) ||
                (empacadoPasilla && empacadoPasilla.some(e => e.id_estado_proceso === 3));

            const aunQuedaCafePorEmpacar =
                pesoPergaminoGrano > 0 ||
                pesoPergaminoMolido > 0 ||
                pesoPasillaMolido > 0;

            const mostrarMensajeOpcional = hayEmpacadosPreviosCompletados && aunQuedaCafePorEmpacar;

            // Obtener valores flash para datos del formulario
            const formData = req.flash('formData')[0] || {};
            
            // Renderizar la vista, los mensajes son manejados por el middleware
            res.render('lotes/procesos/empacado-form', {
                titulo: 'Registrar Empacado - Lote ' + lote.codigo,
                finca: finca,
                lote: lote,
                molienda_info: moliendaInfo,
                peso_total_disponible: pesoTotalDisponible,
                peso_pergamino_molido: pesoPergaminoMolido,
                peso_pergamino_grano: pesoPergaminoGrano,
                peso_pasilla_molido: pesoPasillaMolido,
                empacado_grano: empacadoGrano,
                empacado_molido: empacadoMolido,
                empacado_pasilla: empacadoPasilla,
                formData: formData,
                mostrarMensajeOpcional: mostrarMensajeOpcional
            });

        } catch (error) {
            console.error('Error al mostrar formulario de empacado:', error);
            setMessages.procesos.error(req, 'Error al cargar el formulario de empacado: ' + error.message);
            res.redirect('/fincas/' + req.params.id_finca + '/lotes/' + req.params.id_lote + '/procesos');
        }
    }

    /**
     * Procesa el registro de empacado.
     */
    async registrarEmpacado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                setMessages.form.error(req, errors.array().map(e => e.msg));
                req.flash('formData', req.body);
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
            }

            // Verificar que existe molienda previa y está terminada
            const moliendaInfo = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendaInfo) {
                setMessages.form.error(req, 'No se encontró información de molienda para este lote.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }
            
            const fecha_empacado = req.body.fecha_empacado || new Date().toISOString().split('T')[0];
            const tiposProductosEmpacados = [];
            let mensajesResultado = [];
            let alMenosUnProductoSeleccionado = false;
            
            // Procesar empacado de Pergamino en Grano
            if (req.body.empacar_grano === 'on') {
                alMenosUnProductoSeleccionado = true;
                const tipoProducto = 'Grano';
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    tipoProducto,
                    req.body,
                    moliendaInfo,
                    fecha_empacado
                );
                
                if (resultado.error) {
                    setMessages.form.error(req, resultado.error);
                    return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
                }
                
                if (resultado.omitido) {
                    mensajesResultado.push(resultado.mensaje);
                } else {
                    tiposProductosEmpacados.push(tipoProducto);
                }
            }
            
            // Procesar empacado de Pergamino Molido
            if (req.body.empacar_molido === 'on') {
                alMenosUnProductoSeleccionado = true;
                const tipoProducto = 'Molido';
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    tipoProducto,
                    req.body,
                    moliendaInfo,
                    fecha_empacado
                );
                
                if (resultado.error) {
                    setMessages.form.error(req, resultado.error);
                    return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
                }
                
                if (resultado.omitido) {
                    mensajesResultado.push(resultado.mensaje);
                } else {
                    tiposProductosEmpacados.push(tipoProducto);
                }
            }
            
            // Procesar empacado de Pasilla Molido
            if (req.body.empacar_pasilla === 'on') {
                alMenosUnProductoSeleccionado = true;
                const tipoProducto = 'Pasilla Molido';
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    tipoProducto,
                    req.body,
                    moliendaInfo,
                    fecha_empacado
                );
                
                if (resultado.error) {
                    setMessages.form.error(req, resultado.error);
                    return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
                }
                
                if (resultado.omitido) {
                    mensajesResultado.push(resultado.mensaje);
                } else {
                    tiposProductosEmpacados.push(tipoProducto);
                }
            }
            
            if (!alMenosUnProductoSeleccionado) {
                setMessages.form.error(req, 'Debes seleccionar al menos un tipo de café para empacar.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
            }
            
            if (tiposProductosEmpacados.length === 0) {
                if (mensajesResultado.length > 0) {
                    setMessages.form.error(req, mensajesResultado);
                    return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
                }
            }
            
            // Verificar si todos los productos han sido empacados completamente
            // Esta lógica es aproximada, no necesitamos ser tan estrictos
            let empacadoCompleto = tiposProductosEmpacados.length > 0;
            
            if (empacadoCompleto) {
                const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
                const procesoEmpacadoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'empacado');
                
                if (!procesoEmpacadoDef) {
                    setMessages.form.error(req, "Error de configuración: Proceso 'Empacado' no encontrado.");
                    return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
                }
                
                const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoEmpacadoDef.orden + 1));
                const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoEmpacadoDef.id;
                const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3;
                
                await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);
                
                setMessages.procesos.success(req, 'Se han registrado con éxito ' + tiposProductosEmpacados.length + ' tipos de café: ' + tiposProductosEmpacados.join(', '));
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            } else {
                setMessages.form.success(req, 'Se han registrado con éxito ' + tiposProductosEmpacados.length + ' tipos de café: ' + tiposProductosEmpacados.join(', ') + '. Aún hay café disponible para empacar.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
            }
            
        } catch (error) {
            console.error('Error al registrar empacado:', error);
            setMessages.form.error(req, 'Error al registrar el proceso de empacado: ' + error.message);
            res.redirect('/fincas/' + req.params.id_finca + '/lotes/' + req.params.id_lote + '/empacado/registrar');
        }
    }

    /**
     * Reinicia un proceso de empacado para permitir su corrección.
     */
    async reiniciarProcesoEmpacado(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_empacado = parseInt(req.params.id_empacado);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect('/fincas/' + id_finca + '/lotes');
            }

            const empacado = await empacadoDAO.getEmpacadoById(id_empacado);
            if (!empacado || empacado.id_lote !== id_lote) {
                setMessages.procesos.error(req, 'El proceso de empacado no existe o no corresponde al lote indicado.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }

            if (empacado.id_estado_proceso !== 3 || empacado.es_historico) {
                setMessages.procesos.error(req, 'Solo se pueden reiniciar procesos que estén marcados como terminados y no sean históricos.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }

            // Añadir indicador de corrección a las observaciones
            let observaciones = empacado.observaciones || '';
            if (!observaciones.includes('[CORRECCIÓN INICIADA]')) {
                observaciones = (observaciones ? observaciones + '\n' : '') + 
                    `[CORRECCIÓN INICIADA] ${new Date().toLocaleString()} - Proceso reiniciado para corrección o adición de datos.`;
                
                // Actualizar observaciones en el empacado
                await empacadoDAO.updateEmpacadoObservaciones(empacado.id, observaciones);
            }

            await empacadoDAO.reiniciarEmpacado(id_empacado);

            const empacadosGrano = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Grano');
            const empacadosMolido = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Molido');
            const empacadosPasilla = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Pasilla Molido');
            
            const todosReiniciados = 
                (!empacadosGrano.some(e => e.id_estado_proceso === 3 && !e.es_historico)) &&
                (!empacadosMolido.some(e => e.id_estado_proceso === 3 && !e.es_historico)) &&
                (!empacadosPasilla.some(e => e.id_estado_proceso === 3 && !e.es_historico));
                
            if (todosReiniciados) {
                const procesoEmpacadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'empacado');
                
                if (procesoEmpacadoDef) {
                    await loteDAO.updateLoteProcesoYEstado(id_lote, procesoEmpacadoDef.id, 2);
                }
            }
            
            setMessages.form.success(req, 'Empacado de ' + empacado.tipo_producto_empacado + ' reiniciado correctamente. Puedes modificar o agregar más productos empacados.');
            res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
            
        } catch (error) {
            console.error('Error al reiniciar proceso de empacado:', error);
            setMessages.procesos.error(req, 'Ocurrió un error al reiniciar el proceso de empacado: ' + error.message);
            res.redirect('/fincas/' + req.params.id_finca + '/lotes/' + req.params.id_lote + '/procesos');
        }
    }

    /**
     * Reinicia todos los procesos de empacado de un lote.
     */
    async reiniciarTodosEmpacados(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);

            const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
            if (!finca) { 
                setMessages.lotes.error(req, 'Finca no encontrada o sin permiso.');
                return res.redirect('/fincas/gestionar'); 
            }

            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) { 
                setMessages.lotes.error(req, 'Lote no encontrado o no pertenece a la finca.');
                return res.redirect('/fincas/' + id_finca + '/lotes');
            }

            const todosEmpacados = await empacadoDAO.getAllEmpacadosByLoteId(id_lote);
            
            if (!todosEmpacados || todosEmpacados.length === 0) {
                setMessages.procesos.error(req, 'No hay procesos de empacado para este lote.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }

            const empacadosCompletados = todosEmpacados.filter(e => e.id_estado_proceso === 3);
            
            if (empacadosCompletados.length === 0) {
                setMessages.procesos.error(req, 'No hay procesos de empacado completados para reiniciar.');
                return res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/procesos');
            }
            
            // Reiniciamos todos los empacados completados
            for (const empacado of empacadosCompletados) {
                // Añadir indicador de corrección a las observaciones
                let observaciones = empacado.observaciones || '';
                if (!observaciones.includes('[CORRECCIÓN INICIADA]')) {
                    observaciones = (observaciones ? observaciones + '\n' : '') + 
                        `[CORRECCIÓN INICIADA] ${new Date().toLocaleString()} - Proceso reiniciado para corrección o adición de datos.`;
                    
                    // Actualizar observaciones en el empacado
                    await empacadoDAO.updateEmpacadoObservaciones(empacado.id, observaciones);
                }
                
                // Cambiar estado a "Reiniciado"
                await empacadoDAO.reiniciarEmpacado(empacado.id);
            }

            // Actualizar el estado del lote para que vuelva al proceso de empacado
            const procesoEmpacadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'empacado');
            
            if (procesoEmpacadoDef) {
                await loteDAO.updateLoteProcesoYEstado(id_lote, procesoEmpacadoDef.id, 2);
            }
            
            setMessages.form.success(req, 'Se han reiniciado todos los procesos de empacado (' + empacadosCompletados.length + ') correctamente. Puedes modificar o agregar más productos empacados.');
            res.redirect('/fincas/' + id_finca + '/lotes/' + id_lote + '/empacado/registrar');
            
        } catch (error) {
            console.error('Error al reiniciar todos los procesos de empacado:', error);
            setMessages.procesos.error(req, 'Ocurrió un error al reiniciar los procesos de empacado: ' + error.message);
            res.redirect('/fincas/' + req.params.id_finca + '/lotes/' + req.params.id_lote + '/procesos');
        }
    }
}

module.exports = new EmpacadoController();