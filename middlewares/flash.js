/**
 * Middleware para filtrar y limpiar mensajes flash vacíos
 * Este middleware se ejecuta después de flash() y antes de las rutas
 */
const flashFilter = (req, res, next) => {
    // Guardar la función original de flash
    const originalFlash = req.flash;
    
    // Reemplazar la función flash para que filtre mensajes vacíos al leer
    req.flash = function(type, value) {
        // Si se llama solo con tipo, es para leer mensajes
        if (arguments.length === 1) {
            // Obtener mensajes usando la función original
            const messages = originalFlash.call(this, type);
            
            // Filtrar mensajes vacíos
            if (Array.isArray(messages)) {
                return messages.filter(msg => msg && msg.toString().trim() !== '');
            }
            
            return messages;
        }
        
        // Si el valor es un string vacío o null/undefined, no agregarlo
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return originalFlash.call(this, type);
        }
        
        // Si es un array, filtrar elementos vacíos
        if (Array.isArray(value)) {
            const filteredValue = value.filter(msg => msg && msg.toString().trim() !== '');
            if (filteredValue.length === 0) {
                return originalFlash.call(this, type);
            }
            return originalFlash.call(this, type, filteredValue);
        }
        
        // Caso normal: agregar mensaje
        return originalFlash.call(this, type, value);
    };
    
    next();
};

module.exports = flashFilter; 