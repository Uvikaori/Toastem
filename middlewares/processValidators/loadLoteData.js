/**
 * Middleware para cargar los datos del lote antes de la validación del proceso
 * Este middleware debe ejecutarse antes de validateProcessStatus
 */

const loteDAO = require('../../models/dao/loteDAO');
const fincaDAO = require('../../models/dao/fincaDAO');
const { setMessages } = require('../../utils/messages');

/**
 * Carga los datos del lote en el objeto request
 * @param {Object} req - Objeto request
 * @param {Object} res - Objeto response
 * @param {Function} next - Función next
 */
async function loadLoteData(req, res, next) {
    try {
        const id_finca = parseInt(req.params.id_finca);
        const id_lote = parseInt(req.params.id_lote);

        // Verificar que la finca pertenece al usuario
        const finca = await fincaDAO.getFincaByIdAndUserId(id_finca, req.session.usuario.id);
        if (!finca) {
            setMessages.procesos.error(req, 'No tienes permisos para acceder a esta finca.');
            return res.redirect('/fincas/gestionar');
        }

        // Cargar datos del lote
        const lote = await loteDAO.getLoteById(id_lote);
        if (!lote || lote.id_finca !== id_finca) {
            setMessages.procesos.error(req, 'El lote no existe o no pertenece a esta finca.');
            return res.redirect(`/fincas/${id_finca}/lotes`);
        }

        // Guardar los datos en el objeto request
        req.finca = finca;
        req.lote = lote;

        next();
    } catch (error) {
        console.error('Error en loadLoteData middleware:', error);
        setMessages.procesos.error(req, 'Error interno al cargar los datos del lote.');
        return res.redirect(`/fincas/${req.params.id_finca}/lotes`);
    }
}

module.exports = loadLoteData; 