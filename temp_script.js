const { body, validationResult } = require('express-validator');

// Array de validaciones para el proceso de molienda
const validateMolienda = [
    body('fecha_molienda')
        .notEmpty().withMessage('La fecha de molienda es obligatoria')
        .isDate().withMessage('La fecha de molienda debe ser una fecha válida'),
    
    // --- Validaciones para Café Pergamino ---
    body('pergamino_peso_mantenido_grano')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso de pergamino a mantener en grano debe ser un número positivo o cero.')
        .custom((value, { req }) => {
            const pesoIngresado = parseFloat(value) || 0;
            return true;
        }),

    body('pergamino_tipo_molienda')
        .custom((value, { req }) => {
            const mantenerGrano = req.body.pergamino_mantener_grano_check === 'on';
            const pesoMantenido = parseFloat(req.body.pergamino_peso_mantenido_grano) || 0;
            const pesoTostado = parseFloat(req.tueste_info?.peso_pergamino_final) || 0;
            const pesoAMoler = pesoTostado - (mantenerGrano ? pesoMantenido : 0);
            if (pesoAMoler > 0.001 && !value) { // Si hay algo que moler, el tipo es requerido
                throw new Error('El tipo de molienda para pergamino es obligatorio si se va a moler.');
            }
            if (value && !['Granulado', 'Fino'].includes(value)) {
                throw new Error('El tipo de molienda para pergamino debe ser Granulado o Fino.');
            }
            return true;
        }),

    body('pergamino_peso_final_molido')
        .custom((value, { req }) => {
            const mantenerGrano = req.body.pergamino_mantener_grano_check === 'on';
            const pesoMantenido = parseFloat(req.body.pergamino_peso_mantenido_grano) || 0;
            const pesoTostado = parseFloat(req.tueste_info?.peso_pergamino_final) || 0;
            const pesoAMoler = pesoTostado - (mantenerGrano ? pesoMantenido : 0);

            if (pesoAMoler > 0.001) { // Si hay algo que moler, el peso final es requerido
                if (!value && value !== '0') { // Permitir 0 como valor válido si se ingresa explícitamente
                    throw new Error('El peso final de pergamino molido es obligatorio si se va a moler.');
                }
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                    throw new Error('El peso final de pergamino molido debe ser un número positivo o cero.');
                }
                // Opcional: if (numValue > pesoAMoler) throw new Error('El peso final molido no puede exceder el peso inicial a moler.');
            }
            return true;
        }),

    // --- Validaciones para Café Pasilla ---
    body('pasilla_peso_mantenido_grano')
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('El peso de pasilla a mantener en grano debe ser un número positivo o cero.')
        .custom((value, { req }) => {
            const pesoTostado = parseFloat(req.tueste_info?.peso_pasilla_final) || 0;
            if (parseFloat(value) > pesoTostado) {
                throw new Error('El peso de pasilla en grano no puede exceder el peso tostado disponible.');
            }
            return true;
        }),

    body('pasilla_tipo_molienda')
        .custom((value, { req }) => {
            const mantenerGrano = req.body.pasilla_mantener_grano_check === 'on';
            const pesoMantenido = parseFloat(req.body.pasilla_peso_mantenido_grano) || 0;
            const pesoTostado = parseFloat(req.tueste_info?.peso_pasilla_final) || 0;
            const pesoAMoler = pesoTostado - (mantenerGrano ? pesoMantenido : 0);
            if (pesoAMoler > 0.001 && !value) {
                throw new Error('El tipo de molienda para pasilla es obligatorio si se va a moler.');
            }
            if (value && !['Granulado', 'Fino'].includes(value)) {
                throw new Error('El tipo de molienda para pasilla debe ser Granulado o Fino.');
            }
            return true;
        }),
    
    body('pasilla_peso_final_molido')
        .custom((value, { req }) => {
            const mantenerGrano = req.body.pasilla_mantener_grano_check === 'on';
            const pesoMantenido = parseFloat(req.body.pasilla_peso_mantenido_grano) || 0;
            const pesoTostado = parseFloat(req.tueste_info?.peso_pasilla_final) || 0;
            const pesoAMoler = pesoTostado - (mantenerGrano ? pesoMantenido : 0);

            if (pesoAMoler > 0.001) {
                if (!value && value !== '0') {
                    throw new Error('El peso final de pasilla molido es obligatorio si se va a moler.');
                }
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                    throw new Error('El peso final de pasilla molido debe ser un número positivo o cero.');
                }
            }
            return true;
        }),
    
    body('observaciones')
        .optional()
        .isString().withMessage('Las observaciones deben ser texto'),
    
    // Validación personalizada para asegurar que al menos una acción se realiza (mantener grano o moler)
    (req, res, next) => {
        const { 
            pergamino_mantener_grano_check, pergamino_peso_mantenido_grano, pergamino_peso_inicial_a_moler, pergamino_tipo_molienda, pergamino_peso_final_molido,
            pasilla_mantener_grano_check, pasilla_peso_mantenido_grano, pasilla_peso_inicial_a_moler, pasilla_tipo_molienda, pasilla_peso_final_molido
        } = req.body;

        const tuestePergamino = parseFloat(req.tueste_info?.peso_pergamino_final) || 0;
        const tuestePasilla = parseFloat(req.tueste_info?.peso_pasilla_final) || 0;

        let accionPergamino = false;
        if (tuestePergamino > 0) {
            const mantuvoGranoPergamino = pergamino_mantener_grano_check === 'on' && parseFloat(pergamino_peso_mantenido_grano) > 0;
            const pesoAMolerPergamino = parseFloat(pergamino_peso_inicial_a_moler) || 0;
            const moliendaPergamino = pesoAMolerPergamino > 0.001 && pergamino_tipo_molienda && (parseFloat(pergamino_peso_final_molido) >= 0 && pergamino_peso_final_molido !== '');
            if (mantuvoGranoPergamino || moliendaPergamino) {
                accionPergamino = true;
            }
        } else {
            accionPergamino = true; // Si no hay pergamino tostado, no se espera acción
        }
        
        let accionPasilla = false;
        if (tuestePasilla > 0) {
            const mantuvoGranoPasilla = pasilla_mantener_grano_check === 'on' && parseFloat(pasilla_peso_mantenido_grano) > 0;
            const pesoAMolerPasilla = parseFloat(pasilla_peso_inicial_a_moler) || 0;
            const moliendaPasilla = pesoAMolerPasilla > 0.001 && pasilla_tipo_molienda && (parseFloat(pasilla_peso_final_molido) >= 0 && pasilla_peso_final_molido !== '');
            if (mantuvoGranoPasilla || moliendaPasilla) {
                accionPasilla = true;
            }
        } else {
            accionPasilla = true; // Si no hay pasilla tostada, no se espera acción
        }

        if ((tuestePergamino > 0 && !accionPergamino) && (tuestePasilla > 0 && !accionPasilla)) {
            // Ambas secciones tienen café disponible pero ninguna acción válida
             req.flash('error', 'Debe registrar una acción (mantener en grano o moler) para al menos un tipo de café disponible (Pergamino o Pasilla).');
             return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
        if (tuestePergamino > 0 && !accionPergamino && tuestePasilla === 0) {
             // Solo hay pergamino y no se hizo nada
             req.flash('error', 'Debe registrar una acción (mantener en grano o moler) para el café Pergamino.');
             return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
        if (tuestePasilla > 0 && !accionPasilla && tuestePergamino === 0) {
            // Solo hay pasilla y no se hizo nada
            req.flash('error', 'Debe registrar una acción (mantener en grano o moler) para el café Pasilla.');
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
        
        next();
    },
    
    // Middleware para manejar los errores de validación
    (req, res, next) => {
        // Personalizar las validaciones que necesitan datos del controlador
        // Estos datos no están disponibles directamente en los validadores de express-validator
        const errors = validationResult(req);
        const pergaminoPesoMantenido = parseFloat(req.body.pergamino_peso_mantenido_grano) || 0;
        const tuestePergaminoFinal = parseFloat(req.body.pergamino_peso_disponible) || 
                                    (req.tueste_info ? parseFloat(req.tueste_info.peso_pergamino_final) || 0 : 0);
        
        const pasillaPesoMantenido = parseFloat(req.body.pasilla_peso_mantenido_grano) || 0;
        const tuestePasillaFinal = parseFloat(req.body.pasilla_peso_disponible) || 
                                  (req.tueste_info ? parseFloat(req.tueste_info.peso_pasilla_final) || 0 : 0);
        
        let customErrors = errors.array();
        
        // Verificar si el peso mantenido de pergamino excede el disponible
        if (pergaminoPesoMantenido > tuestePergaminoFinal) {
            const errorMsg = `El peso de pergamino en grano (${pergaminoPesoMantenido}) no puede exceder el peso tostado disponible (${tuestePergaminoFinal}).`;
            customErrors.push({
                msg: errorMsg,
                param: 'pergamino_peso_mantenido_grano'
            });
        }
        
        // Verificar si el peso mantenido de pasilla excede el disponible
        if (pasillaPesoMantenido > tuestePasillaFinal) {
            const errorMsg = `El peso de pasilla en grano (${pasillaPesoMantenido}) no puede exceder el peso tostado disponible (${tuestePasillaFinal}).`;
            customErrors.push({
                msg: errorMsg,
                param: 'pasilla_peso_mantenido_grano'
            });
        }
        
        if (customErrors.length > 0 || !errors.isEmpty()) {
            req.flash('error', customErrors.map(e => e.msg));
            
            // Guardamos los datos ingresados para rellenar el formulario nuevamente
            req.flash('fecha_molienda', req.body.fecha_molienda);
            req.flash('observaciones', req.body.observaciones);
            // También los datos específicos de cada tipo de café
            req.flash('pergamino_mantener_grano_check', req.body.pergamino_mantener_grano_check);
            req.flash('pergamino_peso_mantenido_grano', req.body.pergamino_peso_mantenido_grano);
            req.flash('pergamino_tipo_molienda', req.body.pergamino_tipo_molienda);
            req.flash('pergamino_peso_final_molido', req.body.pergamino_peso_final_molido);
            req.flash('pasilla_mantener_grano_check', req.body.pasilla_mantener_grano_check);
            req.flash('pasilla_peso_mantenido_grano', req.body.pasilla_peso_mantenido_grano);
            req.flash('pasilla_tipo_molienda', req.body.pasilla_tipo_molienda);
            req.flash('pasilla_peso_final_molido', req.body.pasilla_peso_final_molido);
            
            return res.redirect(`/fincas/${req.params.id_finca}/lotes/${req.params.id_lote}/molienda/registrar`);
        }
        
        next();
    }
];

module.exports = { validateMolienda }; 