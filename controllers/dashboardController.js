/**
 * Muestra el dashboard principal
 */
const mostrarDashboard = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    
    // Por ahora, solo mostraremos un dashboard básico
    // En el futuro, aquí cargaríamos datos de lotes activos, etc.
    
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