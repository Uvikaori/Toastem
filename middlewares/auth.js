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

/**
 * Verifica si el usuario es propietario de una finca
 * Se debe usar después de isAuthenticated
 */
const isFincaOwner = async (req, res, next) => {
  try {
    const id_finca = parseInt(req.params.id_finca);
    if (isNaN(id_finca)) {
      req.flash('error', 'ID de finca inválido');
      return res.redirect('/fincas/gestionar');
    }

    const fincaDAO = require('../models/dao/fincaDAO');
    const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
    
    if (!finca) {
      req.flash('error', 'No tienes acceso a esta finca');
      return res.redirect('/fincas/gestionar');
    }
    
    // Añadir la finca al objeto request para uso posterior
    req.finca = finca;
    next();
  } catch (error) {
    console.error('Error al verificar propiedad de la finca:', error);
    req.flash('error', 'Error al verificar propiedad de la finca');
    res.redirect('/fincas/gestionar');
  }
};

/**
 * Verifica si el usuario es propietario de un lote
 * Se debe usar después de isAuthenticated
 */
const isLoteOwner = async (req, res, next) => {
  try {
    const id_lote = parseInt(req.params.id_lote);
    if (isNaN(id_lote)) {
      req.flash('error', 'ID de lote inválido');
      return res.redirect('/fincas/gestionar');
    }

    const loteDAO = require('../models/dao/loteDAO');
    const lote = await loteDAO.getLoteByIdAndUserId(id_lote, req.session.usuario.id);
    
    if (!lote) {
      req.flash('error', 'No tienes acceso a este lote');
      const id_finca = parseInt(req.params.id_finca);
      if (!isNaN(id_finca)) {
        return res.redirect(`/fincas/${id_finca}/lotes`);
      }
      return res.redirect('/fincas/gestionar');
    }
    
    // Añadir el lote al objeto request para uso posterior
    req.lote = lote;
    next();
  } catch (error) {
    console.error('Error al verificar propiedad del lote:', error);
    req.flash('error', 'Error al verificar propiedad del lote');
    const id_finca = parseInt(req.params.id_finca);
    if (!isNaN(id_finca)) {
      return res.redirect(`/fincas/${id_finca}/lotes`);
    }
    res.redirect('/fincas/gestionar');
  }
};

module.exports = {
  isAuthenticated,
  noAutenticado,
  isFincaOwner,
  isLoteOwner
}; 