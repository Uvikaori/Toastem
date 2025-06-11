/**
 * Índice de middlewares para validación de procesos
 */

const loadLoteData = require('./loadLoteData');
const validateProcessStatus = require('./validateProcessStatus');

module.exports = {
    loadLoteData,
    validateProcessStatus
}; 