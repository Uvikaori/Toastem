const empacadoDAO = require('../models/dao/empacadoDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const moliendaDAO = require('../models/dao/moliendaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Empacado = require('../models/entities/Empacado');
const { validationResult } = require('express-validator');

/**
 * Procesa un empacado individual
 * @private
 */
async function procesarEmpacadoIndividual(id_lote, fecha_empacado, peso_inicial, peso_empacado, total_empaques, tipo_producto, observaciones, moliendaInfo) {
    try {
        // Buscar la molienda correspondiente al tipo de producto
        let moliendaCorrespondiente = null;
        
        if (Array.isArray(moliendaInfo)) {
            if (tipo_producto === 'Grano') {
                // Buscar molienda de pergamino en grano
                moliendaCorrespondiente = moliendaInfo.find(m => 
                    m.tipo_cafe === 'Pergamino' && 
                    m.es_grano == 1 &&
                    m.id_estado_proceso === 3
                );
            } else if (tipo_producto === 'Molido') {
                // Buscar molienda de pergamino molido
                moliendaCorrespondiente = moliendaInfo.find(m => 
                    m.tipo_cafe === 'Pergamino' && 
                    m.es_grano == 0 && 
                    m.id_estado_proceso === 3
                );
                
                // Si no se encontró, buscar con es_grano como entero 0
                if (!moliendaCorrespondiente) {
                    moliendaCorrespondiente = moliendaInfo.find(m => 
                        m.tipo_cafe === 'Pergamino' && 
                        (m.es_grano === 0 || m.es_grano === '0') && 
                        m.id_estado_proceso === 3
                    );
                }
            } else if (tipo_producto === 'Pasilla Molido') {
                // Buscar molienda de pasilla molida
                moliendaCorrespondiente = moliendaInfo.find(m => 
                    m.tipo_cafe === 'Pasilla' && 
                    m.es_grano == 0 && 
                    m.id_estado_proceso === 3
                );
                
                // Si no se encontró, buscar con es_grano como entero 0
                if (!moliendaCorrespondiente) {
                    moliendaCorrespondiente = moliendaInfo.find(m => 
                        m.tipo_cafe === 'Pasilla' && 
                        (m.es_grano === 0 || m.es_grano === '0') && 
                        m.id_estado_proceso === 3
                    );
                }
            }
        }

        if (!moliendaCorrespondiente) {
            return { 
                error: `No se encontró una molienda correspondiente al tipo de producto ${tipo_producto}.`
            };
        }

        // Verificar el peso disponible después de los empacados existentes
        const empacadosExistentes = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, tipo_producto);
        const pesoYaEmpacado = empacadosExistentes
            .filter(e => e.id_estado_proceso === 3)
            .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
        
        const pesoDisponible = parseFloat(moliendaCorrespondiente.peso_final) - pesoYaEmpacado;
        const pesoAEmpacar = parseFloat(peso_empacado);
        
        if (pesoAEmpacar > pesoDisponible) {
            return {
                error: `El peso a empacar para ${tipo_producto} (${pesoAEmpacar.toFixed(2)} kg) excede el peso disponible (${pesoDisponible.toFixed(2)} kg).`
            };
        }

        // Crear nuevo registro de empacado
        const empacado = new Empacado(
            null,
            id_lote,
            fecha_empacado,
            parseFloat(peso_inicial),
            parseFloat(peso_empacado),
            parseInt(total_empaques),
            tipo_producto,
            observaciones,
            3, // id_estado_proceso = Terminado
            null, // id_tueste (opcional)
            moliendaCorrespondiente.id // id_molienda
        );

        await empacadoDAO.createEmpacado(empacado);
        
        return { success: true };
    } catch (error) {
        console.error(`Error al procesar empacado de ${tipo_producto}:`, error);
        return { error: `Error al procesar empacado de ${tipo_producto}: ${error.message}` };
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
                req.flash('error', 'No tienes permisos para acceder a esta finca.');
                return res.redirect('/fincas/gestionar');
            }
            
            const lote = await loteDAO.getLoteById(id_lote);
            if (!lote || lote.id_finca !== id_finca) {
                req.flash('error', 'El lote no existe o no pertenece a esta finca.');
                return res.redirect(`/fincas/${id_finca}/lotes`);
            }

            // Verificar que existe un proceso de molienda previo y está terminado
            const moliendaInfo = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendaInfo || (Array.isArray(moliendaInfo) && !moliendaInfo.some(m => m.id_estado_proceso === 3))) {
                req.flash('error', 'El proceso de Molienda debe estar completado antes de registrar el Empacado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Obtener los empacados existentes para este lote por tipo de producto
            const empacadoGrano = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Grano');
            const empacadoMolido = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Molido');
            const empacadoPasilla = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Pasilla Molido');
            
            // Calcular el peso total disponible para empacar (suma de todos los pesos finales de molienda)
            let pesoTotalDisponible = 0;
            
            // Separar los pesos disponibles por tipo de café
            let pesoPergaminoMolido = 0;
            let pesoPergaminoGrano = 0;
            let pesoPasillaMolido = 0;
            
            if (Array.isArray(moliendaInfo)) {
                moliendaInfo.forEach(m => {
                    if (m.id_estado_proceso === 3 && m.peso_final) {
                        const pesoFinal = parseFloat(m.peso_final);
                        pesoTotalDisponible += pesoFinal;
                        
                        // Clasificar según tipo de café y si es grano o molido
                        if (m.tipo_cafe === 'Pergamino') {
                            if (m.es_grano) {
                                pesoPergaminoGrano += pesoFinal;
                            } else {
                                pesoPergaminoMolido += pesoFinal;
                            }
                        } else if (m.tipo_cafe === 'Pasilla') {
                            // Asumimos que pasilla siempre es molida, pero verificamos por si acaso
                            if (!m.es_grano) {
                                pesoPasillaMolido += pesoFinal;
                            }
                        }
                    }
                });
            } else if (moliendaInfo && moliendaInfo.id_estado_proceso === 3) {
                pesoTotalDisponible = parseFloat(moliendaInfo.peso_final) || 0;
                // En caso de un solo registro de molienda, clasificarlo según su tipo
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

            // Nueva lógica para el mensaje opcional
            const hayEmpacadosPreviosCompletados =
                (empacadoGrano && empacadoGrano.some(e => e.id_estado_proceso === 3)) ||
                (empacadoMolido && empacadoMolido.some(e => e.id_estado_proceso === 3)) ||
                (empacadoPasilla && empacadoPasilla.some(e => e.id_estado_proceso === 3));

            const aunQuedaCafePorEmpacar =
                pesoPergaminoGrano > 0 ||
                pesoPergaminoMolido > 0 ||
                pesoPasillaMolido > 0;

            const mostrarMensajeOpcional = hayEmpacadosPreviosCompletados && aunQuedaCafePorEmpacar;

            // Obtener valores flash o por defecto
            const formData = req.flash('formData')[0] || {};
            
            res.render('lotes/procesos/empacado-form', {
                titulo: `Registrar Empacado - Lote ${lote.codigo}`,
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
                mostrarMensajeOpcional: mostrarMensajeOpcional,
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de empacado:', error);
            req.flash('error', 'Error al cargar el formulario de empacado: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
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
                req.flash('error', errors.array().map(e => e.msg));
                // Almacenar todos los datos del formulario para repoblarlo en caso de error
                req.flash('formData', req.body);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
            }

            // Verificar que existe molienda previa y está terminada
            const moliendaInfo = await moliendaDAO.getMoliendaByLoteId(id_lote);
            if (!moliendaInfo || (Array.isArray(moliendaInfo) && !moliendaInfo.some(m => m.id_estado_proceso === 3))) {
                req.flash('error', 'El proceso de Molienda debe estar completado antes de registrar el Empacado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Fecha común para todos los empacados
            const fecha_empacado = req.body.fecha_empacado;
            
            // Array para almacenar los tipos de producto empacados
            const tiposProductosEmpacados = [];
            
            // Procesar empacado de Pergamino en Grano
            if (req.body.empacar_grano === 'on') {
                const tipoProducto = 'Grano';
                tiposProductosEmpacados.push(tipoProducto);
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    fecha_empacado,
                    req.body.peso_inicial_grano,
                    req.body.peso_empacado_grano,
                    req.body.total_empaques_grano,
                    tipoProducto,
                    req.body.observaciones_grano,
                    moliendaInfo
                );
                
                if (resultado.error) {
                    req.flash('error', resultado.error);
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
                }
            }
            
            // Procesar empacado de Pergamino Molido
            if (req.body.empacar_molido === 'on') {
                const tipoProducto = 'Molido';
                tiposProductosEmpacados.push(tipoProducto);
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    fecha_empacado,
                    req.body.peso_inicial_molido,
                    req.body.peso_empacado_molido,
                    req.body.total_empaques_molido,
                    tipoProducto,
                    req.body.observaciones_molido,
                    moliendaInfo
                );
                
                if (resultado.error) {
                    req.flash('error', resultado.error);
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
                }
            }
            
            // Procesar empacado de Pasilla Molido
            if (req.body.empacar_pasilla === 'on') {
                const tipoProducto = 'Pasilla Molido';
                tiposProductosEmpacados.push(tipoProducto);
                
                const resultado = await procesarEmpacadoIndividual(
                    id_lote,
                    fecha_empacado,
                    req.body.peso_inicial_pasilla,
                    req.body.peso_empacado_pasilla,
                    req.body.total_empaques_pasilla,
                    tipoProducto,
                    req.body.observaciones_pasilla,
                    moliendaInfo
                );
                
                if (resultado.error) {
                    req.flash('error', resultado.error);
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
                }
            }
            
            // Verificar si al menos se empacó un tipo de producto
            if (tiposProductosEmpacados.length === 0) {
                req.flash('error', 'Debes seleccionar al menos un tipo de café para empacar.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
            }
            
            // Verificar si todos los productos han sido empacados completamente
            const empacadosGrano = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Grano');
            const empacadosMolido = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Molido');
            const empacadosPasilla = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Pasilla Molido');
            
            let todosLosProductosEmpacados = true;
            let pesoTotalDisponible = 0;
            let pesoTotalEmpacado = 0;
            
            // Calcular pesos disponibles y empacados por tipo
            if (Array.isArray(moliendaInfo)) {
                // Pergamino en Grano
                const moliendaGrano = moliendaInfo.find(m => m.tipo_cafe === 'Pergamino' && m.es_grano === true && m.id_estado_proceso === 3);
                if (moliendaGrano) {
                    const pesoGranoDisponible = parseFloat(moliendaGrano.peso_final);
                    pesoTotalDisponible += pesoGranoDisponible;
                    
                    const pesoGranoEmpacado = empacadosGrano
                        .filter(e => e.id_estado_proceso === 3)
                        .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                    pesoTotalEmpacado += pesoGranoEmpacado;
                    
                    if (pesoGranoDisponible > pesoGranoEmpacado) {
                        todosLosProductosEmpacados = false;
                    }
                }
                
                // Pergamino Molido
                const moliendaMolido = moliendaInfo.find(m => m.tipo_cafe === 'Pergamino' && m.es_grano === false && m.id_estado_proceso === 3);
                if (moliendaMolido) {
                    const pesoMolidoDisponible = parseFloat(moliendaMolido.peso_final);
                    pesoTotalDisponible += pesoMolidoDisponible;
                    
                    const pesoMolidoEmpacado = empacadosMolido
                        .filter(e => e.id_estado_proceso === 3)
                        .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                    pesoTotalEmpacado += pesoMolidoEmpacado;
                    
                    if (pesoMolidoDisponible > pesoMolidoEmpacado) {
                        todosLosProductosEmpacados = false;
                    }
                }
                
                // Pasilla Molido
                const moliendaPasilla = moliendaInfo.find(m => m.tipo_cafe === 'Pasilla' && m.id_estado_proceso === 3);
                if (moliendaPasilla) {
                    const pesoPasillaDisponible = parseFloat(moliendaPasilla.peso_final);
                    pesoTotalDisponible += pesoPasillaDisponible;
                    
                    const pesoPasillaEmpacado = empacadosPasilla
                        .filter(e => e.id_estado_proceso === 3)
                        .reduce((sum, e) => sum + parseFloat(e.peso_empacado), 0);
                    pesoTotalEmpacado += pesoPasillaEmpacado;
                    
                    if (pesoPasillaDisponible > pesoPasillaEmpacado) {
                        todosLosProductosEmpacados = false;
                    }
                }
            }
            
            // Si todos los productos han sido empacados o si el margen de error es mínimo (1% o menos),
            // avanzar al siguiente proceso
            const margenError = Math.abs(pesoTotalDisponible - pesoTotalEmpacado) / pesoTotalDisponible;
            const empacadoCompleto = todosLosProductosEmpacados || margenError <= 0.01;
            
            if (empacadoCompleto) {
                // Actualizar estado general y proceso actual del LOTE
                const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
                const procesoEmpacadoDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'empacado');
                
                if (!procesoEmpacadoDef) {
                    req.flash('error', "Error de configuración: Proceso 'Empacado' no encontrado.");
                    // No cambiar estado del lote si hay error de configuración
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
                }
                
                // Avanzar al siguiente proceso o finalizar si es el último
                const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (procesoEmpacadoDef.orden + 1));
                const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoEmpacadoDef.id;
                const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = 'En progreso', 3 = 'Terminado' si Empacado es el último
                
                await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);
                
                req.flash('mensaje', `Se han registrado con éxito ${tiposProductosEmpacados.length} tipos de café. Todos los tipos de café han sido empacados completamente.`);
            } else {
                // NO actualizar el estado del lote para permitir registrar más tipos de café
                req.flash('mensaje', `Se han registrado con éxito ${tiposProductosEmpacados.length} tipos de café: ${tiposProductosEmpacados.join(', ')}. Aún hay café disponible para empacar.`);
            }
            
            // Independientemente de si se completó el proceso o no, redirigir al formulario de empacado
            // para permitir registrar otros tipos de café
            if (!empacadoCompleto) {
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
            }
            
            // Solo si está completo, ir a la vista de procesos
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            
        } catch (error) {
            console.error('Error al registrar empacado:', error);
            req.flash('error', 'Error al registrar el proceso de empacado: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/empacado/registrar`);
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
            const empacado = await empacadoDAO.getEmpacadoById(id_empacado);
            if (!empacado || empacado.id_lote !== id_lote) {
                req.flash('error', 'El proceso de empacado no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (empacado.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await empacadoDAO.reiniciarEmpacado(id_empacado);

            // Actualizar el estado del lote solo si todos los empacados han sido reiniciados
            const empacadosGrano = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Grano');
            const empacadosMolido = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Molido');
            const empacadosPasilla = await empacadoDAO.getEmpacadosByTipoProducto(id_lote, 'Pasilla Molido');
            
            const todosReiniciados = 
                (!empacadosGrano.some(e => e.id_estado_proceso === 3)) &&
                (!empacadosMolido.some(e => e.id_estado_proceso === 3)) &&
                (!empacadosPasilla.some(e => e.id_estado_proceso === 3));
                
            if (todosReiniciados) {
                const procesoEmpacadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'empacado');
                
                if (procesoEmpacadoDef) {
                    await loteDAO.updateLoteProcesoYEstado(id_lote, procesoEmpacadoDef.id, 2); // 2 = En progreso
                }
            }
            
            req.flash('mensaje', `Empacado de ${empacado.tipo_producto_empacado} reiniciado correctamente.`);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
            
        } catch (error) {
            console.error('Error al reiniciar proceso de empacado:', error);
            req.flash('error', 'Ocurrió un error al reiniciar el proceso de empacado: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Reinicia todos los procesos de empacado de un lote.
     */
    async reiniciarTodosEmpacados(req, res) {
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

            // Obtener todos los empacados del lote
            const todosEmpacados = await empacadoDAO.getAllEmpacadosByLoteId(id_lote);
            
            if (!todosEmpacados || todosEmpacados.length === 0) {
                req.flash('error', 'No hay procesos de empacado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar todos los empacados terminados
            const empacadosCompletados = todosEmpacados.filter(e => e.id_estado_proceso === 3);
            
            if (empacadosCompletados.length === 0) {
                req.flash('error', 'No hay procesos de empacado completados para reiniciar.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Reiniciar cada empacado
            for (const empacado of empacadosCompletados) {
                await empacadoDAO.reiniciarEmpacado(empacado.id);
            }

            // Actualizar el estado del lote
            const procesoEmpacadoDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'empacado');
            
            if (procesoEmpacadoDef) {
                await loteDAO.updateLoteProcesoYEstado(id_lote, procesoEmpacadoDef.id, 2); // 2 = En progreso
            }
            
            req.flash('mensaje', `Se han reiniciado todos los procesos de empacado (${empacadosCompletados.length}) correctamente.`);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/empacado/registrar`);
            
        } catch (error) {
            console.error('Error al reiniciar todos los procesos de empacado:', error);
            req.flash('error', 'Ocurrió un error al reiniciar los procesos de empacado: ' + error.message);
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

module.exports = new EmpacadoController();
