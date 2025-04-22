/**
 * Verifica si el usuario está autenticado
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.usuario && req.session.usuario.id) {
    return next();
  }
  
  // Si la petición es AJAX, devolver error 401
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado' 
    });
  }
  
  // Si es una petición normal, redirigir al login
  req.flash('error', 'Debes iniciar sesión para acceder a esta página');
  res.redirect('/auth/login');
};

/**
 * Verifica si el usuario NO está autenticado
 */
const noAutenticado = (req, res, next) => {
  // Permitir solicitudes POST para registro y login
  if (req.method === 'POST') {
    return next();
  }
  
  if (!req.session.idUsuario) {
    return next();
  }
  res.redirect('/dashboard');
};

module.exports = {
  isAuthenticated,
  noAutenticado
}; 