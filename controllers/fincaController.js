const fincaDAO = require('../models/dao/fincaDAO');
const Finca = require('../models/entities/Finca');
const { validateFinca } = require('../validators/fincaValidator');
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../utils/helpers');

class FincaController {
    async listarFincas(req, res) {
        try {
            console.log('Sesión actual:', req.session); 
            
            if (!req.session.usuario || !req.session.usuario.id) {
                console.log('Usuario no autenticado, redirigiendo...'); 
                req.flash('error', 'Debes iniciar sesión para acceder a esta página');
                return res.redirect('/auth/login');
            }

            const fincas = await fincaDAO.getFincasByUserId(req.session.usuario.id);
            const municipiosVeredasAll = await fincaDAO.getMunicipiosVeredas();
            
            res.render('gestionar-fincas', { 
                titulo: 'Gestionar Fincas | Toastem',
                fincas: Array.isArray(fincas) ? fincas : [],
                municipiosVeredasAll: municipiosVeredasAll,
                mensaje: req.flash('mensaje'),
                error: req.flash('error'),
                departamentos: await fincaDAO.getDepartamentos(), 
            });
        } catch (error) {
            console.error('Error al listar fincas:', error);
            req.flash('error', 'Error al cargar las fincas');
            res.redirect('/');
        }
    }

    /**
     * Muestra el formulario para crear una nueva finca.
     */
    async mostrarFormularioCrearFinca(req, res) {
        try {
            if (!req.session.usuario || !req.session.usuario.id) {
                req.flash('error', 'Debes iniciar sesión para crear una finca.');
                return res.redirect('/auth/login');
            }

            const departamentos = await fincaDAO.getDepartamentos();

            res.render('fincas/crear', {
                titulo: 'Crear Nueva Finca | Toastem',
                departamentos: departamentos,
                nombre: req.flash('nombre')[0] || '',
                ubicacion: req.flash('ubicacion')[0] || '',
                selectedDepartamento: req.flash('selectedDepartamento')[0] || '',
                selectedMunicipio: req.flash('selectedMunicipio')[0] || '',
                selectedMunicipioVereda: req.flash('selectedMunicipioVereda')[0] || '',
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de crear finca:', error);
            req.flash('error', 'Error al cargar el formulario para crear fincas.');
            res.redirect('/fincas/gestionar');
        }
    }

    async getMunicipiosAPI(req, res) {
        try {
            const nombreDepartamento = req.params.departamento;
            if (!nombreDepartamento) {
                return res.status(400).json({ error: 'Nombre de departamento es requerido' });
            }
            const municipios = await fincaDAO.getMunicipiosPorDepartamento(nombreDepartamento);
            res.json(municipios);
        } catch (error) {
            console.error('Error al obtener municipios API:', error);
            res.status(500).json({ error: 'Error interno al obtener municipios' });
        }
    }

    async getVeredasAPI(req, res) {
        try {
            const nombreDepartamento = req.params.departamento;
            const nombreMunicipio = req.params.municipio;
            if (!nombreDepartamento || !nombreMunicipio) {
                return res.status(400).json({ error: 'Departamento y municipio son requeridos' });
            }
            const veredas = await fincaDAO.getVeredasPorMunicipio(nombreDepartamento, nombreMunicipio);
            res.json(veredas);
        } catch (error) {
            console.error('Error al obtener veredas API:', error);
            res.status(500).json({ error: 'Error interno al obtener veredas' });
        }
    }

    /**
     * Procesa el envío del formulario para crear una nueva finca.
     */
    async crearFinca(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array().map(e => e.msg));
            req.flash('nombre', req.body.nombre);
            req.flash('ubicacion', req.body.ubicacion);
            req.flash('selectedDepartamento', req.body.departamento);
            req.flash('selectedMunicipio', req.body.municipio);
            req.flash('selectedMunicipioVereda', req.body.id_municipio_vereda);
            return res.redirect('/fincas/crear');
        }

        try {
            if (!req.session.usuario || !req.session.usuario.id) {
                 req.flash('error', 'No autorizado.');
                 return res.redirect('/auth/login');
            }

            const { nombre, ubicacion, id_municipio_vereda } = req.body;

            const nombreCapitalizado = capitalizarPalabras(nombre);
            const ubicacionCapitalizada = ubicacion ? capitalizarPalabras(ubicacion) : '';

            const finca = new Finca(
                null,
                req.session.usuario.id,
                nombreCapitalizado,
                ubicacionCapitalizada,
                parseInt(id_municipio_vereda)
            );
            await fincaDAO.createFinca(finca);
            req.flash('mensaje', 'Finca creada exitosamente.');
            res.redirect('/fincas/gestionar');
        } catch (error) {
            console.error('Error al crear finca:', error);
            req.flash('error', 'Error interno al crear la finca.');
            req.flash('nombre', req.body.nombre);
            req.flash('ubicacion', req.body.ubicacion);
            req.flash('selectedDepartamento', req.body.departamento);
            req.flash('selectedMunicipio', req.body.municipio);
            req.flash('selectedMunicipioVereda', req.body.id_municipio_vereda);
            res.redirect('/fincas/crear');
        }
    }

    async actualizarFinca(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            if (!id || isNaN(id)) {
                 return res.status(400).json({ success: false, message: 'ID de finca inválido' });
            }

            const { nombre, ubicacion, id_municipio_vereda } = req.body;

            const nombreCapitalizado = capitalizarPalabras(nombre);
            const ubicacionCapitalizada = ubicacion ? capitalizarPalabras(ubicacion) : '';

            const finca = new Finca(
                parseInt(id),
                req.session.usuario.id,
                nombreCapitalizado,
                ubicacionCapitalizada,
                parseInt(id_municipio_vereda)
            );

            await fincaDAO.updateFinca(finca);

            res.json({ success: true, message: 'Finca actualizada exitosamente' });

        } catch (error) {
            console.error('Error al actualizar finca:', error);
            res.status(500).json({ success: false, message: 'Error interno al actualizar la finca' });
        }
    }

    async eliminarFinca(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de finca inválido' 
                });
            }

            await fincaDAO.deleteFinca(parseInt(id), req.session.usuario.id);
            res.json({ 
                success: true, 
                message: 'Finca eliminada exitosamente' 
            });
        } catch (error) {
            console.error('Error al eliminar finca:', error);
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
}

module.exports = new FincaController();