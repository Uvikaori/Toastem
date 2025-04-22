const fincaDAO = require('../models/dao/fincaDAO');

class FincaController {
    async listarFincas(req, res) {
        try {
            console.log('Sesión actual:', req.session); // Log para debug
            
            // Verificar si el usuario está autenticado
            if (!req.session.usuario || !req.session.usuario.id) {
                console.log('Usuario no autenticado, redirigiendo...'); // Log para debug
                return res.redirect('/auth/login');
            }

            const fincas = await fincaDAO.getFincasByUserId(req.session.usuario.id);
            console.log('Fincas encontradas:', fincas); // Log para debug
            
            res.render('gestionar-fincas', { 
                titulo: 'Gestionar Fincas | Toastem',
                fincas: Array.isArray(fincas) ? fincas : [],
                mensaje: null,
                error: null
            });
        } catch (error) {
            console.error('Error al listar fincas:', error);
            res.render('gestionar-fincas', {
                titulo: 'Gestionar Fincas | Toastem',
                fincas: [],
                mensaje: null,
                error: 'Error al cargar las fincas'
            });
        }
    }

    async crearFinca(req, res) {
        try {
            if (!req.session.usuario || !req.session.usuario.id) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }

            const { nombre, ubicacion } = req.body;
            
            // Validaciones
            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ success: false, message: 'El nombre de la finca es obligatorio' });
            }
            if (nombre.length > 100) {
                return res.status(400).json({ success: false, message: 'El nombre no puede exceder los 100 caracteres' });
            }
            if (ubicacion && ubicacion.length > 255) {
                return res.status(400).json({ success: false, message: 'La ubicación no puede exceder los 255 caracteres' });
            }

            const finca = new Finca(null, req.session.usuario.id, nombre, ubicacion);
            const id = await fincaDAO.createFinca(finca);
            
            res.status(201).json({ 
                success: true, 
                message: 'Finca creada exitosamente',
                data: { id }
            });
        } catch (error) {
            console.error('Error al crear finca:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error al crear la finca' 
            });
        }
    }

    async actualizarFinca(req, res) {
        try {
            const { id } = req.params;
            
            // Validar que id sea un número
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de finca inválido' 
                });
            }

            const { nombre, ubicacion } = req.body;

            // Validaciones
            if (!nombre || nombre.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El nombre de la finca es obligatorio' 
                });
            }
            if (nombre.length > 100) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El nombre no puede exceder los 100 caracteres' 
                });
            }
            if (ubicacion && ubicacion.length > 255) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'La ubicación no puede exceder los 255 caracteres' 
                });
            }

            const finca = new Finca(
                parseInt(id),
                req.session.usuario.id,
                nombre,
                ubicacion
            );

            await fincaDAO.updateFinca(finca);
            res.json({ 
                success: true, 
                message: 'Finca actualizada exitosamente' 
            });
        } catch (error) {
            console.error('Error al actualizar finca:', error);
            res.status(400).json({ 
                success: false, 
                message: error.message 
            });
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