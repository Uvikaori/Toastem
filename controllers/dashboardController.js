const fincaDAO = require('../models/dao/fincaDAO');

class DashboardController {
  async index(req, res) {
    try {
      const usuario = req.session.usuario;

      if (!usuario) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener datos básicos
      const fincaSeleccionada = await fincaDAO.getFincaByUserId(usuario.id);
      const lotes = fincaSeleccionada ? await fincaDAO.getLotesByFincaId(fincaSeleccionada.id) : [];
      const lotesValidos = lotes.filter(lote => lote !== null && lote !== undefined);
      const lotesActivos = lotesValidos.filter(lote => lote.estado !== 'Seco').length;
      const lotesEnSecado = lotesValidos.filter(lote => lote.estado === 'En Secado').length;
      const { precio: precioCafe } = await fincaDAO.getCoffeePrice();

      res.render('dashboard/index', {
        titulo: 'Dashboard | Toastem',
        usuario,
        fincaSeleccionada,
        lotes: lotesValidos,
        lotesActivos,
        lotesEnSecado,
        precioCafe,
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
