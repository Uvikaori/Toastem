const fincaDAO = require('../models/dao/fincaDAO');
const Finca = require('../models/entities/Finca');
const { validateFinca } = require('../validators/fincaValidator');
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../utils/helpers');

class FincaController {
    async listarFincas(req, res) {
        try {
            console.log('Sesión actual:', req.session); 
            
            // Verificar si el usuario está autenticado
            if (!req.session.usuario || !req.session.usuario.id) {
                console.log('Usuario no autenticado, redirigiendo...'); 
                return res.redirect('/auth/login');
            }

            const fincas = await fincaDAO.getFincasByUserId(req.session.usuario.id);
            const municipiosVeredasAll = await fincaDAO.getMunicipiosVeredas(); // Obtener todos para mostrar en la card
            
            res.render('gestionar-fincas', { 
                titulo: 'Gestionar Fincas | Toastem',
                fincas: Array.isArray(fincas) ? fincas : [],
                municipiosVeredasAll: municipiosVeredasAll, // Pasar a la vista
                mensaje: req.flash('mensaje'),
                error: null, // No pasar errores vacíos
                // Para el modal de edición de finca, si se usa en esta página
                departamentos: await fincaDAO.getDepartamentos(), 
            });
        } catch (error) {
            console.error('Error al listar fincas:', error);
            res.render('gestionar-fincas', {
                titulo: 'Gestionar Fincas | Toastem',
                fincas: [],
                municipiosVeredasAll: [], // Pasar vacío en caso de error
                mensaje: null,
                error: 'Error al cargar las fincas',
                departamentos: [],
            });
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
            // Ya no pasamos todos los municipiosVeredas. Se cargarán dinámicamente.

            res.render('fincas/crear', {
                titulo: 'Crear Nueva Finca | Toastem',
                departamentos: departamentos,
                // Los siguientes campos se usarán para repoblar si hay error y se seleccionaron valores
                nombre: req.flash('nombre')[0] || '',
                ubicacion: req.flash('ubicacion')[0] || '',
                selectedDepartamento: req.flash('selectedDepartamento')[0] || '',
                selectedMunicipio: req.flash('selectedMunicipio')[0] || '', // Nuevo para repoblar
                selectedMunicipioVereda: req.flash('selectedMunicipioVereda')[0] || '', // ID de la vereda
                mensaje: req.flash('mensaje'),
                error: req.flash('error')
            });
        } catch (error) {
            console.error('Error al mostrar formulario de crear finca:', error);
            req.flash('error', 'Error al cargar el formulario para crear fincas.');
            res.redirect('/fincas/gestionar');
        }
    }

    // API para obtener municipios por departamento
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

    // API para obtener veredas por municipio (y departamento para asegurar unicidad del municipio)
    async getVeredasAPI(req, res) {
        try {
            const nombreDepartamento = req.params.departamento;
            const nombreMunicipio = req.params.municipio;
            if (!nombreDepartamento || !nombreMunicipio) {
                return res.status(400).json({ error: 'Departamento y municipio son requeridos' });
            }
            const veredas = await fincaDAO.getVeredasPorMunicipio(nombreDepartamento, nombreMunicipio);
            res.json(veredas); // Devuelve [{id, nombre_ver}, ...]
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
            req.flash('selectedDepartamento', req.body.departamento); // Nombre del departamento
            req.flash('selectedMunicipio', req.body.municipio);       // Nombre del municipio
            req.flash('selectedMunicipioVereda', req.body.id_municipio_vereda); // ID de la vereda
            return res.redirect('/fincas/crear');
        }

        try {
            if (!req.session.usuario || !req.session.usuario.id) {
                 req.flash('error', 'No autorizado.');
                 return res.redirect('/auth/login');
            }

            // departamento y municipio del body son solo para repoblar el form en caso de error.
            // El que se guarda es id_municipio_vereda.
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
            // Manejar errores de validación (ej: devolver JSON con errores)
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            if (!id || isNaN(id)) {
                 // Si es JSON API
                 return res.status(400).json({ success: false, message: 'ID de finca inválido' });
                 // Si es web app con flash:
                 // req.flash('error', 'ID de finca inválido');
                 // return res.redirect('/ruta/a/editar');
            }

            // Verificar que la finca pertenece al usuario (IMPORTANTE, si no se hace en DAO)
            // const fincaExistente = await fincaDAO.getFincaByIdAndUserId(id, req.session.usuario.id);
            // if (!fincaExistente) {
            //     return res.status(404).json({ success: false, message: 'Finca no encontrada o no pertenece al usuario' });
            // }

            const { nombre, ubicacion, id_municipio_vereda } = req.body;

            // Capitalizar antes de actualizar
            const nombreCapitalizado = capitalizarPalabras(nombre);
            const ubicacionCapitalizada = ubicacion ? capitalizarPalabras(ubicacion) : '';

            const finca = new Finca(
                parseInt(id),
                req.session.usuario.id,
                nombreCapitalizado, // Usar nombre capitalizado
                ubicacionCapitalizada, // Usar ubicación capitalizada
                parseInt(id_municipio_vereda) // Asegurar que se incluye en la actualización si es necesario
            );

            await fincaDAO.updateFinca(finca); // Asegurarse que updateFinca maneje id_municipio_vereda si es editable

            // Respuesta para JSON API
            res.json({ success: true, message: 'Finca actualizada exitosamente' });

            // Si fuera web app con flash:
            // req.flash('mensaje', 'Finca actualizada exitosamente.');
            // res.redirect('/fincas/gestionar');

        } catch (error) {
            console.error('Error al actualizar finca:', error);
            // Respuesta para JSON API
            res.status(500).json({ success: false, message: 'Error interno al actualizar la finca' });
             // Si fuera web app con flash:
            // req.flash('error', 'Error interno al actualizar la finca.');
            // res.redirect('/ruta/a/editar/' + req.params.id);
        }
    }

    async eliminarFinca(req, res) {
        try {
            const { id } = req.params;
            
            // Validar que id sea un número
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