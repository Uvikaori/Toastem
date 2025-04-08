/**
 * Verifica si el usuario está autenticado
 */
const autenticado = (req, res, next) => {
  if (req.session.idUsuario) {
    return next();
  }
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
  autenticado,
  noAutenticado
}; 