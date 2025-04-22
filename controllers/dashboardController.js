const { getFincaByUserId, getLotesByFincaId, getCoffeePrice } = require('../models/dao/fincaDAO');

class DashboardController {
    async index(req, res) {
        try {
            const usuario = req.session.usuario;

            // Obtener la finca seleccionada del usuario
            const fincaSeleccionada = await getFincaByUserId(usuario.id);

            // Obtener los lotes de la finca seleccionada
            const lotes = fincaSeleccionada ? await getLotesByFincaId(fincaSeleccionada.id) : [];

            // Filtrar lotes válidos antes de realizar operaciones
            const lotesValidos = lotes.filter(lote => lote !== null && lote !== undefined);

            // Calcular estadísticas de los lotes
            const lotesActivos = lotesValidos.filter(lote => lote.estado !== 'Seco').length;
            const lotesEnSecado = lotesValidos.filter(lote => lote.estado === 'En Secado').length;

            // Obtener el precio actual del café
            const { precio: precioCafe, fechaActualizacion } = await getCoffeePrice();

            res.render('dashboard', {
                titulo: 'Dashboard | Toastem',
                usuario,
                fincaSeleccionada,
                lotes: lotesValidos,
                lotesActivos,
                lotesEnSecado,
                precioCafe,
                fechaActualizacion,
                hideNavbar: false
            });
        } catch (error) {
            console.error('Error al cargar el dashboard:', error);
            req.flash('error', 'Error al cargar el dashboard');
            res.redirect('/');
        }
    }

    async redirigirAFincas(req, res) {
        res.redirect('/fincas');
    }
}

module.exports = new DashboardController();
