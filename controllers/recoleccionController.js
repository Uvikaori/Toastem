const RecoleccionDAO = require('../models/dao/recoleccionDAO');

class RecoleccionController {
    static async mostrarFormulario(req, res) {
        try {
            const finca = req.finca;
            const usuario = req.user;
            
            res.render('lotes/recoleccion', {
                finca,
                usuario,
                error: null
            });
        } catch (error) {
            console.error('Error al mostrar formulario de recolección:', error);
            res.status(500).render('error', {
                mensaje: 'Error al cargar el formulario de recolección'
            });
        }
    }

    static async registrarRecoleccion(req, res) {
        try {
            const {
                id_finca,
                id_usuario,
                fecha_recoleccion,
                peso_inicial,
                tipo_recoleccion,
                tipo_cafe,
                observaciones
            } = req.body;

            // Generar código único para el lote
            const codigo = `F${id_finca}-L${Date.now()}`;

            const recoleccion = {
                codigo,
                id_usuario,
                id_finca,
                fecha_recoleccion,
                peso_inicial,
                tipo_recoleccion,
                tipo_cafe,
                observaciones
            };

            const idLote = await RecoleccionDAO.crearRecoleccion(recoleccion);

            req.flash('mensaje', 'Recolección registrada exitosamente');
            res.redirect(`/fincas/${id_finca}/lotes`);
        } catch (error) {
            console.error('Error al registrar recolección:', error);
            res.render('lotes/recoleccion', {
                finca: { id: req.body.id_finca },
                usuario: { id: req.body.id_usuario },
                error: ['Error al registrar la recolección. Por favor, intente nuevamente.']
            });
        }
    }
}

module.exports = RecoleccionController; 