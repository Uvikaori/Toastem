const controlCalidadDAO = require('../models/dao/controlCalidadDAO');
const ControlCalidad = require('../models/entities/ControlCalidad');
const { validationResult } = require('express-validator');

class ControlCalidadController {

    /**
     * Muestra el formulario para registrar el proceso de control de calidad.
     */
    async mostrarFormularioControlCalidad(req, res) {
        try {
            const id_lote = parseInt(req.params.id_lote);
            const lote = req.lote; // Asumiendo que lote y finca vienen en req gracias a un middleware

            // Verificar si ya existe un registro de control de calidad
            const controlExistente = await controlCalidadDAO.getControlCalidadByLoteId(id_lote);
            if (controlExistente) {
                req.flash('error', 'Ya existe un registro de control de calidad para este lote.');
                return res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);
            }

            res.render('lotes/control-calidad', { 
                titulo: 'Registrar Control de Calidad',
                lote: lote,
                finca: req.finca, // Asumiendo que lote y finca vienen en req gracias a un middleware
                fecha_control: req.flash('fecha_control')[0] || '',
                tipo_control: req.flash('tipo_control')[0] || '',
                resultado_control: req.flash('resultado_control')[0] || '',
                puntaje_cata: req.flash('puntaje_cata')[0] || '',
                observaciones: req.flash('observaciones')[0] || '',
                error: req.flash('error')
            });

        } catch (error) {
            console.error('Error al mostrar formulario de control de calidad:', error);
            req.flash('error', 'Error al cargar el formulario de control de calidad.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }
    }

    /**
     * Procesa el registro de control de calidad.
     */
    async registrarControlCalidad(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('fecha_control', req.body.fecha_control);
            req.flash('tipo_control', req.body.tipo_control);
            req.flash('resultado_control', req.body.resultado_control);
            req.flash('puntaje_cata', req.body.puntaje_cata);
            req.flash('observaciones', req.body.observaciones);
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/control-calidad/registrar`);
        }

        try {
            const id_lote = parseInt(req.params.id_lote);
            const {
                fecha_control,
                tipo_control,
                resultado_control,
                puntaje_cata,
                observaciones
            } = req.body;

            const controlCalidad = new ControlCalidad(
                null,
                id_lote,
                fecha_control,
                tipo_control,
                resultado_control,
                puntaje_cata,
                observaciones
            );

            await controlCalidadDAO.createControlCalidad(controlCalidad);
            // await loteDAO.updateLoteProcesoYEstado(id_lote, SIGUIENTE_PROCESO_ID, ESTADO_COMPLETADO);
            // O marcar el lote como finalizado completamente
            // await loteDAO.updateLoteEstado(id_lote, ESTADO_LOTE_FINALIZADO);

            req.flash('mensaje', 'Proceso de control de calidad registrado exitosamente.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${id_lote}/procesos`);

        } catch (error) {
            console.error('Error al registrar control de calidad:', error);
            req.flash('error', 'Error al registrar el proceso de control de calidad.');
            res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/control-calidad/registrar`);
        }
    }
}

module.exports = new ControlCalidadController();



