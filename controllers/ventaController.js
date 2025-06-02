const loteDAO = require('../models/dao/loteDAO');
const fincaDAO = require('../models/dao/fincaDAO');
const secadoDAO = require('../models/dao/secadoDAO');
const ventaDAO = require('../models/dao/ventaDAO');
const empacadoDAO = require('../models/dao/empacadoDAO');
const Venta = require('../models/entities/Venta');
const { validationResult } = require('express-validator');

// Función auxiliar para agrupar y sumar productos empacados
function agregarProductosEmpacados(productosEmpacadosCrudos) {
    if (!productosEmpacadosCrudos || productosEmpacadosCrudos.length === 0) {
        return [];
    }
    const agrupados = {};
    productosEmpacadosCrudos.forEach(p => {
        // Solo considerar los que tienen peso y no son históricos
        if (p.peso_empacado > 0 && !p.es_historico) {
            if (agrupados[p.tipo_producto_empacado]) {
                agrupados[p.tipo_producto_empacado].peso_total_empacado += parseFloat(p.peso_empacado);
                agrupados[p.tipo_producto_empacado].total_empaques_agrupado += parseInt(p.total_empaques, 10) || 0;
            } else {
                agrupados[p.tipo_producto_empacado] = {
                    tipo_producto_empacado: p.tipo_producto_empacado,
                    peso_total_empacado: parseFloat(p.peso_empacado),
                    total_empaques_agrupado: parseInt(p.total_empaques, 10) || 0,
                    // Podríamos necesitar otros campos si el formulario los usa directamente,
                    // por ahora, solo el tipo y el peso total para el select.
                };
            }
        }
    });
    return Object.values(agrupados);
}

class VentaController {

    async mostrarFormularioVentaPergamino(req, res) {
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
            if (!secadoInfo || !secadoInfo.decision_venta || secadoInfo.id_estado_proceso !== 3) {
                req.flash('error', 'El secado de este lote no está marcado para venta o no ha finalizado.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            // Verificar si ya existe una venta para este lote de tipo pergamino (opcional, para evitar duplicados)
            // const ventaExistente = await ventaDAO.getVentaByLoteIdAndTipo(id_lote, 'Pergamino');
            // if (ventaExistente) {
            //     req.flash('info', 'Ya se ha registrado una venta de pergamino para este lote.');
            //     return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            // }

            res.render('lotes/ventas/registrar-pergamino-form', { // NUEVA VISTA
                titulo: `Registrar Venta de Pergamino - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                secado: secadoInfo,
                // Para repoblar el formulario si hay error
                fecha_venta: req.flash('fecha_venta')[0] || new Date().toISOString().split('T')[0],
                cantidad: req.flash('cantidad')[0] || secadoInfo.peso_final,
                precio_kg: req.flash('precio_kg')[0] || '',
                comprador: req.flash('comprador')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de venta de pergamino:', error);
            req.flash('error', 'Error al cargar el formulario de venta.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarVentaPergamino(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req); // Usar validationResult

        const { fecha_venta, cantidad, precio_kg, comprador, observaciones } = req.body; // Mover extracción aquí para repopular

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            // Repopular campos del formulario en caso de error
            req.flash('fecha_venta', fecha_venta);
            req.flash('cantidad', cantidad);
            req.flash('precio_kg', precio_kg);
            req.flash('comprador', comprador);
            req.flash('observaciones', observaciones);
            // Es importante obtener secadoInfo también para renderizar el form con error
            try {
                const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
                const lote = await loteDAO.getLoteById(id_lote);
                const secadoInfo = await secadoDAO.getSecadoByLoteId(id_lote);
                return res.render('lotes/ventas/registrar-pergamino-form', {
                    titulo: `Registrar Venta de Pergamino - Lote ${lote.codigo}`,
                    finca: finca,
                    lote: lote,
                    secado: secadoInfo,
                    fecha_venta: fecha_venta,
                    cantidad: cantidad,
                    precio_kg: precio_kg,
                    comprador: comprador,
                    observaciones: observaciones,
                    error: req.flash('error') // Pasar los errores de flash
                });
            } catch (renderError) {
                console.error('Error al re-renderizar formulario de venta con errores:', renderError);
                req.flash('error', 'Error al procesar el formulario. Intente de nuevo.');
                return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
        }

        try {
            const id_tipo_venta = 1; // Asumiendo ID 1 para 'Venta de Pergamino'

            const nuevaVenta = new Venta(
                null, // id
                id_lote,
                fecha_venta, // Ya validada y convertida a Date por el validador
                id_tipo_venta,
                parseFloat(cantidad), // Ya validado como float
                parseFloat(precio_kg), // Ya validado como float
                comprador, // Sanitizado por el validador
                observaciones, // Sanitizado por el validador
                'Pergamino' // detalle_producto_vendido
            );

            await ventaDAO.createVenta(nuevaVenta);

            await loteDAO.updateLoteProcesoYEstado(id_lote, null, 5);
            await loteDAO.update(id_lote, { fecha_finalizacion: fecha_venta });

            req.flash('mensaje', 'Venta de pergamino registrada exitosamente. Lote finalizado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar venta de pergamino:', error);
            req.flash('error', 'Error interno al registrar la venta.');
            req.flash('fecha_venta', fecha_venta);
            req.flash('cantidad', cantidad);
            req.flash('precio_kg', precio_kg);
            req.flash('comprador', comprador);
            req.flash('observaciones', observaciones);
            // Redirigir de nuevo al formulario puede ser problemático si hay error en la lógica de renderizado de errores.
            // Considerar una página de error genérica o manejarlo con más cuidado.
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/ventas/registrar/pergamino`);
        }
    }

    async mostrarFormularioVentaEmpacado(req, res) {
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

            const productosEmpacadosCrudos = await empacadoDAO.getAllEmpacadosByLoteId(id_lote);
            const productosAgrupadosDisponibles = agregarProductosEmpacados(productosEmpacadosCrudos);

            if (productosAgrupadosDisponibles.length === 0) {
                req.flash('info', 'No hay productos empacados disponibles para la venta en este lote.');
                 return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);
            }
            
            res.render('lotes/ventas/registrar-empacado-form', { 
                titulo: `Registrar Venta de Producto Empacado - Lote ${lote.codigo}`,
                finca: finca,
                lote: lote,
                productosDisponibles: productosAgrupadosDisponibles.map(p => ({
                    tipo_producto_empacado: p.tipo_producto_empacado, 
                    peso_final_producto: p.peso_total_empacado,
                    total_empaques: p.total_empaques_agrupado
                })),
                tipo_producto_seleccionado: req.flash('tipo_producto_seleccionado')[0] || '',
                fecha_venta: req.flash('fecha_venta')[0] || new Date().toISOString().split('T')[0],
                cantidad: req.flash('cantidad')[0] || '',
                precio_kg: req.flash('precio_kg')[0] || '',
                comprador: req.flash('comprador')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                mensaje: req.flash('mensaje') || '',  // Aseguramos que mensaje siempre tenga un valor
                error: req.flash('error') || []       // También aseguramos que error siempre tenga un valor
            });

        } catch (error) {
            console.error('Error al mostrar formulario de venta de empacado:', error);
            req.flash('error', 'Error al cargar el formulario de venta de producto empacado.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    async registrarVentaEmpacado(req, res) {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/ventas/registrar/empacado`);
        }

        try {
            const { fecha_venta } = req.body;
            const ventas = [];

            // Procesar venta de café en grano si está seleccionado
            if (req.body.vender_grano === 'on') {
                ventas.push({
                    tipo: 'Grano',
                    cantidad: parseFloat(req.body.cantidad_vender_grano),
                    precio_kg: parseFloat(req.body.precio_kg_grano),
                    comprador: req.body.comprador_grano,
                    observaciones: req.body.observaciones_grano
                });
            }

            // Procesar venta de café molido si está seleccionado
            if (req.body.vender_molido === 'on') {
                ventas.push({
                    tipo: 'Molido',
                    cantidad: parseFloat(req.body.cantidad_vender_molido),
                    precio_kg: parseFloat(req.body.precio_kg_molido),
                    comprador: req.body.comprador_molido,
                    observaciones: req.body.observaciones_molido
                });
            }

            // Procesar venta de café pasilla si está seleccionado
            if (req.body.vender_pasilla === 'on') {
                ventas.push({
                    tipo: 'Pasilla Molido',
                    cantidad: parseFloat(req.body.cantidad_vender_pasilla),
                    precio_kg: parseFloat(req.body.precio_kg_pasilla),
                    comprador: req.body.comprador_pasilla,
                    observaciones: req.body.observaciones_pasilla
                });
            }

            // Verificar disponibilidad de productos
            const productosEmpacadosCrudos = await empacadoDAO.getAllEmpacadosByLoteId(id_lote);
            const productosAgrupados = agregarProductosEmpacados(productosEmpacadosCrudos);

            // Validar cantidades contra disponibilidad
            for (const venta of ventas) {
                const productoDisponible = productosAgrupados.find(p => p.tipo_producto_empacado === venta.tipo);
                if (!productoDisponible) {
                    req.flash('error', `No hay producto tipo ${venta.tipo} disponible para la venta.`);
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/ventas/registrar/empacado`);
                }
                if (venta.cantidad > productoDisponible.peso_total_empacado) {
                    req.flash('error', `La cantidad a vender de ${venta.tipo} (${venta.cantidad}kg) excede la disponible (${productoDisponible.peso_total_empacado}kg).`);
                    return res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/ventas/registrar/empacado`);
                }
            }

            // Registrar cada venta
            for (const venta of ventas) {
                const nuevaVenta = new Venta(
                    null,
                    id_lote,
                    fecha_venta,
                    2, // ID tipo venta para empacado
                    venta.cantidad,
                    venta.precio_kg,
                    venta.comprador || null,
                    venta.observaciones || null,
                    venta.tipo
                );
                await ventaDAO.createVenta(nuevaVenta);
            }

            // Actualizar estado del lote
            await loteDAO.updateLoteProcesoYEstado(id_lote, null, 5);
            await loteDAO.update(id_lote, { fecha_finalizacion: fecha_venta });

            req.flash('mensaje', 'Ventas de productos empacados registradas exitosamente. Lote finalizado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar venta de empacado:', error);
            req.flash('error', 'Error interno al registrar la venta de producto empacado.');
            res.redirect(`/fincas/${id_finca}/lotes/${id_lote}/ventas/registrar/empacado`);
        }
    }
}

module.exports = new VentaController(); 