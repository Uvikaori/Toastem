/**
 * Utilidades para manejar mensajes y errores en la aplicación
 */

const { setSuccessMessage, setErrorMessage } = require('../middlewares/messageHandler');

/**
 * Funciones de acceso rápido para establecer mensajes en diferentes rutas
 */
const setMessages = {
    // Para la vista de procesos
    procesos: {
        success: (req, message) => setSuccessMessage(req, 'procesos', message),
        error: (req, error) => setErrorMessage(req, 'procesos', error)
    },
    
    // Para la vista de flujo
    flujo: {
        success: (req, message) => setSuccessMessage(req, 'flujo', message),
        error: (req, error) => setErrorMessage(req, 'flujo', error)
    },
    
    // Para la vista de lotes
    lotes: {
        success: (req, message) => setSuccessMessage(req, 'lotes', message),
        error: (req, error) => setErrorMessage(req, 'lotes', error)
    },
    
    // Para la vista de fincas
    fincas: {
        success: (req, message) => setSuccessMessage(req, 'fincas', message),
        error: (req, error) => setErrorMessage(req, 'fincas', error)
    },
    
    // Para la vista de dashboard
    dashboard: {
        success: (req, message) => setSuccessMessage(req, 'dashboard', message),
        error: (req, error) => setErrorMessage(req, 'dashboard', error)
    },
    
    // Para formularios genéricos
    form: {
        success: (req, message) => setSuccessMessage(req, 'form', message),
        error: (req, error) => setErrorMessage(req, 'form', error)
    }
};

module.exports = {
    setMessages
}; 