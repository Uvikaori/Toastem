/**
 * Middleware para manejo centralizado de mensajes
 * Este middleware reemplaza el uso de flash messages por un enfoque más consistente
 * basado en variables de sesión
 */

/**
 * Establece un mensaje de éxito en la sesión para una ruta específica
 * @param {Object} req - Objeto request
 * @param {string} route - Nombre de la ruta (ej: 'procesos', 'flujo', etc.)
 * @param {string} message - Mensaje a mostrar
 */
function setSuccessMessage(req, route, message) {
    const key = `mensaje${route.charAt(0).toUpperCase() + route.slice(1)}`;
    req.session[key] = message;
}

/**
 * Establece un mensaje de error en la sesión para una ruta específica
 * @param {Object} req - Objeto request
 * @param {string} route - Nombre de la ruta (ej: 'procesos', 'flujo', etc.)
 * @param {string|Array} error - Mensaje o array de mensajes de error
 */
function setErrorMessage(req, route, error) {
    const key = `error${route.charAt(0).toUpperCase() + route.slice(1)}`;
    req.session[key] = error;
}

/**
 * Middleware que prepara los mensajes para la vista y los elimina de la sesión
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @param {Function} next - Función next
 */
function prepareViewMessages(req, res, next) {
    // Buscar cualquier variable de sesión relacionada con mensajes
    const messageKeys = Object.keys(req.session).filter(key => 
        key.startsWith('mensaje') || key.startsWith('error')
    );

    // Si existen mensajes, los pasamos a res.locals para accederlos en las vistas
    if (messageKeys.length > 0) {
        messageKeys.forEach(key => {
            // Pasamos el mensaje a res.locals
            res.locals[key] = req.session[key];
            // Eliminar el mensaje de la sesión para que no persista
            delete req.session[key];
        });
    }

    // Pasar funciones de utilidad a res.locals
    res.locals.hayError = function(error) {
        if (!error) return false;
        
        if (Array.isArray(error)) {
            return error.some(err => err && err.toString().trim() !== '');
        } else if (typeof error === 'string') {
            return error.trim() !== '';
        }
        
        return false;
    };

    next();
}

module.exports = {
    setSuccessMessage,
    setErrorMessage,
    prepareViewMessages
}; 