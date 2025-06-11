/**
 * Middleware para validar que un proceso solo puede registrarse si el estado del lote es correcto
 * - No se permite registrar un proceso posterior si hay uno en curso (id_estado_proceso = 2)
 */

const { setMessages } = require('../../utils/messages');

/**
 * Valida que el lote no tenga un proceso en curso antes de permitir registrar uno posterior
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @param {Function} next - Función next
 */
function validateProcessStatus(req, res, next) {
    try {
        const lote = req.lote; // Asumimos que el lote ya está cargado en el request

        // Si no hay lote, no podemos validar
        if (!lote) {
            return next();
        }

        // Verificar si el lote tiene un proceso en curso (id_estado_proceso = 2)
        if (lote.id_estado_proceso === 2) {
            setMessages.procesos.error(req, 'No puedes registrar un proceso posterior mientras hay uno en curso. Debes completar el proceso actual primero.');
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
        }

        // Si no hay proceso en curso, continuar
        next();
    } catch (error) {
        console.error('Error en validateProcessStatus middleware:', error);
        setMessages.procesos.error(req, 'Error interno al validar el estado del proceso.');
        return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/procesos`);
    }
}

module.exports = validateProcessStatus; 