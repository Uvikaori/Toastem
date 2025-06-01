const tuesteDAO = require('../models/dao/tuesteDAO');
const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const trillaDAO = require('../models/dao/trillaDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const Tueste = require('../models/entities/Tueste');
const { validationResult } = require('express-validator');

class TuesteController {
    /**
     * Muestra el formulario para registrar el tueste.
     */
    async mostrarFormularioTueste(req, res) {
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

            const tuesteExistente = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (tuesteExistente && tuesteExistente.id_estado_proceso !== 1) {
                req.flash('info', 'El Tueste ya ha sido registrado para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            if (!trillaInfo || trillaInfo.id_estado_proceso !== 3) { // 3 = Terminado
                req.flash('error', 'El proceso de Trilla debe estar completado antes de registrar el Tueste.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Verificar que la fecha de tueste sea posterior a la fecha de trilla
            const fechaTrilla = new Date(trillaInfo.fecha_trilla);
            const fechaActual = new Date();
            
            // Usar datos del flash si existen, o valores por defecto si no
            const formData = req.flash('formData')[0] || {};
            
            // Formatear fecha mínima para el input datetime-local
            const fechaTrillaISO = fechaTrilla.toISOString().slice(0, 16);
            const fechaActualISO = fechaActual.toISOString().slice(0, 16);
            
            res.render('lotes/procesos/tueste-form', {
                titulo: `Registrar Tueste - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                trilla_info: trillaInfo,
                peso_trilla_final: trillaInfo.peso_final,
                fecha_trilla: fechaTrillaISO, // Pasamos la fecha de trilla para usarla como mínimo
                
                // Para café pergamino
                peso_pergamino_inicial: formData.peso_pergamino_inicial || '',
                tipo_calidad_pergamino: formData.tipo_calidad_pergamino || '',
                nivel_tueste_pergamino: formData.nivel_tueste_pergamino || '',
                fecha_tueste_pergamino: formData.fecha_tueste_pergamino || fechaTrillaISO,
                peso_pergamino_final: formData.peso_pergamino_final || '',
                
                // Para café pasilla
                peso_pasilla_inicial: formData.peso_pasilla_inicial || '',
                tipo_calidad_pasilla: 'Baja', // Siempre 'Baja'
                nivel_tueste_pasilla: 'Alto', // Siempre 'Alto'
                fecha_tueste_pasilla: formData.fecha_tueste_pasilla || fechaTrillaISO,
                peso_pasilla_final: formData.peso_pasilla_final || '',
                
                // Datos generales
                peso_inicial: formData.peso_inicial || trillaInfo.peso_final || '',
                fecha_tueste: formData.fecha_tueste || fechaActualISO,
                peso_final: formData.peso_final || '',
                observaciones: formData.observaciones || '',
                
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar form de tueste:', error);
            req.flash('error', 'Error al cargar el formulario de tueste.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarTueste(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);

        try {
            console.log("Iniciando registro de tueste para lote:", id_lote);
            console.log("Datos recibidos:", JSON.stringify(req.body));
            
            const trillaInfo = await trillaDAO.getTrillaByLoteId(id_lote);
            if (!trillaInfo) {
                req.flash('error', 'No se encontró información de trilla para este lote.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
            }

            // Validar según los requisitos
            const errores = [];

            // 1. Validar que se haya registrado al menos un tipo de café (pergamino o pasilla)
            const tienePergamino = trillaInfo.peso_pergamino_final > 0;
            const tienePasilla = trillaInfo.peso_pasilla_final > 0;
            
            // Validar café pergamino si viene de la trilla
            if (tienePergamino) {
                if (!req.body.peso_pergamino_inicial) {
                    errores.push('Debe ingresar el peso inicial del café pergamino.');
                }
                if (!req.body.tipo_calidad_pergamino) {
                    errores.push('Debe seleccionar la calidad del café pergamino.');
                } else if (!['Premium', 'Normal'].includes(req.body.tipo_calidad_pergamino)) {
                    errores.push('La calidad del café pergamino debe ser Premium o Normal.');
                }
                if (!req.body.nivel_tueste_pergamino) {
                    errores.push('Debe seleccionar el nivel de tueste para el café pergamino.');
                }
                if (!req.body.fecha_tueste_pergamino) {
                    errores.push('Debe ingresar la fecha de tueste del café pergamino.');
                }
                if (!req.body.peso_pergamino_final) {
                    errores.push('Debe ingresar el peso final del café pergamino.');
                }
            }
            
            // Validar café pasilla si viene de la trilla
            if (tienePasilla) {
                if (!req.body.peso_pasilla_inicial) {
                    errores.push('Debe ingresar el peso inicial del café pasilla.');
                }
                if (req.body.tipo_calidad_pasilla !== 'Baja') {
                    errores.push('La calidad del café pasilla debe ser Baja.');
                }
                if (req.body.nivel_tueste_pasilla !== 'Alto') {
                    errores.push('El nivel de tueste del café pasilla debe ser Alto.');
                }
                if (!req.body.fecha_tueste_pasilla) {
                    errores.push('Debe ingresar la fecha de tueste del café pasilla.');
                }
                if (!req.body.peso_pasilla_final) {
                    errores.push('Debe ingresar el peso final del café pasilla.');
                }
            }

            // Validar fecha general de registro
            if (!req.body.fecha_tueste) {
                errores.push('Debe ingresar la fecha de registro del tueste.');
            }

            // Si hay errores, devolver al formulario
            if (errores.length > 0) {
                req.flash('error', errores);
                req.flash('formData', req.body);
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
            }

            // Calcular peso final total (suma de pergamino y pasilla)
            const pesoPergaminoFinal = parseFloat(req.body.peso_pergamino_final || 0);
            const pesoPasillaFinal = parseFloat(req.body.peso_pasilla_final || 0);
            const pesoFinalTotal = pesoPergaminoFinal + pesoPasillaFinal;

            console.log("Peso final calculado:", pesoFinalTotal);

            // Crear objeto tueste adaptado a la estructura de la tabla
            const tuesteData = {
                id_lote: id_lote,
                fecha_tueste: req.body.fecha_tueste,
                peso_inicial: trillaInfo.peso_final,
                
                // Determinar tipo de café y calidad
                tipo_cafe: tienePergamino ? 'Pergamino' : 'Pasilla',
                tipo_calidad: tienePergamino ? req.body.tipo_calidad_pergamino : 'Baja',
                nivel_tueste: tienePergamino ? req.body.nivel_tueste_pergamino : 'Alto',
                
                // Datos pergamino y pasilla
                peso_pergamino_inicial: tienePergamino ? req.body.peso_pergamino_inicial : null,
                peso_pergamino_final: tienePergamino ? req.body.peso_pergamino_final : null,
                peso_pasilla_inicial: tienePasilla ? req.body.peso_pasilla_inicial : null,
                peso_pasilla_final: tienePasilla ? req.body.peso_pasilla_final : null,
                
                peso_final: pesoFinalTotal,
                observaciones: req.body.observaciones || null,
                id_estado_proceso: 3 // Terminado
            };
            
            console.log("Datos de tueste a registrar:", JSON.stringify(tuesteData));
            
            // Registrar tueste en la base de datos
            try {
                await tuesteDAO.createTueste(tuesteData);
                console.log("Tueste registrado correctamente en la base de datos");
            } catch (dbError) {
                console.error("Error en la inserción en la base de datos:", dbError);
                throw new Error(`Error en la base de datos: ${dbError.message}`);
            }

            // Actualizar estado general y proceso actual del LOTE
            // Buscar el ID del proceso de tueste o usar el último proceso disponible
            const todosLosProcesos = await procesosDAO.getAllProcesosOrdenados();
            const procesoTuesteDef = todosLosProcesos.find(p => p.nombre.toLowerCase() === 'tueste');
            const procesoId = procesoTuesteDef ? procesoTuesteDef.id : todosLosProcesos[todosLosProcesos.length - 1].id;
            
            // Encontrar el siguiente proceso en la secuencia, basado en el campo 'orden'
            const ordenProcesoTueste = procesoTuesteDef ? procesoTuesteDef.orden : 0;
            const siguienteProcesoDef = todosLosProcesos.find(p => p.orden === (ordenProcesoTueste + 1));
            
            // Si hay un siguiente proceso, marcar como "En progreso", sino "Finalizado"
            const idNuevoProcesoActualParaLote = siguienteProcesoDef ? siguienteProcesoDef.id : procesoId;
            const nuevoEstadoLote = siguienteProcesoDef ? 2 : 3; // 2 = En progreso, 3 = Finalizado
            
            console.log("Actualizando estado del lote:", {
                idNuevoProcesoActualParaLote,
                nuevoEstadoLote
            });
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, idNuevoProcesoActualParaLote, nuevoEstadoLote);

            req.flash('mensaje', 'Tueste registrado exitosamente.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar tueste:', error);
            req.flash('error', `Error interno al registrar el tueste: ${error.message || 'Error desconocido'}`);
            req.flash('formData', req.body);
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/tueste/registrar`);
        }
    }

    /**
     * Reinicia un proceso de tueste para permitir su corrección.
     */
    async reiniciarProcesoTueste(req, res) {
        try {
            const id_finca = parseInt(req.params.id_finca);
            const id_lote = parseInt(req.params.id_lote);
            const id_tueste = parseInt(req.params.id_tueste);

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
            const tueste = await tuesteDAO.getTuesteByLoteId(id_lote);
            if (!tueste || tueste.id !== id_tueste) {
                req.flash('error', 'El proceso de tueste no existe o no corresponde al lote indicado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Solo se pueden reiniciar procesos terminados
            if (tueste.id_estado_proceso !== 3) {
                req.flash('error', 'Solo se pueden reiniciar procesos que estén marcados como terminados.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }

            // Reiniciar el proceso
            await tuesteDAO.reiniciarTueste(id_tueste);

            // Actualizar el estado del lote
            const procesoTuesteDef = (await procesosDAO.getAllProcesosOrdenados()).find(p => p.nombre.toLowerCase() === 'tueste');
            
            if (!procesoTuesteDef) {
                req.flash('error', "Error de configuración: Proceso 'Tueste' no encontrado.");
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            await loteDAO.updateLoteProcesoYEstado(id_lote, procesoTuesteDef.id, 2); // 2 = 'En progreso'

            req.flash('mensaje', 'Proceso de Tueste reiniciado exitosamente para su corrección.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al reiniciar proceso de tueste:', error);
            req.flash('error', 'Error interno al reiniciar el proceso de tueste.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }
}

module.exports = new TuesteController();
