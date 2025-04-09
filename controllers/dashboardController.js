/**
 * Muestra el dashboard principal
 */
const mostrarDashboard = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    
    // Por ahora, solo s e muestra un dashboard básico
    // En las siguientes implementaciones, en este controlador se cargarían datos de lotes activos y las demás partes del proceso
    
    res.render('dashboard', {
      titulo: 'Dashboard | Toastem',
      usuario,
      hideNavbar: false
    });
  } catch (error) {
    console.error('Error al cargar el dashboard:', error);
    res.status(500).render('error', { 
      titulo: 'Error | Toastem',
      mensaje: 'Error al cargar el dashboard',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

module.exports = {
  mostrarDashboard
}; 
