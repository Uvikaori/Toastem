/**
 * Funciones para gestionar los procesos de lotes de café
 */

document.addEventListener('DOMContentLoaded', function() {
    // Formatear fechas al estilo español (DD/MM/AAAA)
    formatearFechasEspanol();
    
    // Inicializar validaciones de peso
    inicializarValidacionesPeso();
    
    // Inicializar tooltips de Bootstrap si están disponibles
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }
    
    // Gestionar campos con asterisco para campos requeridos
    marcarCamposRequeridos();
    
    // Inicializar manejadores de eventos para cálculos de clasificación
    inicializarCalculosClasificacion();
    
    // Inicializar funcionalidades específicas según la página
    inicializarTueste();
    inicializarMolienda();
    inicializarEmpacado();
    inicializarTrilla();
    
    // Prevenir scroll en campos numéricos
    prevenirScrollEnCamposNumericos();
});

/**
 * Aplica formato español a las fechas en el documento
 */
function formatearFechasEspanol() {
    // Agregar tooltip a los campos de fecha
    const camposFecha = document.querySelectorAll('input[type="date"], input[type="datetime-local"]');
    
    camposFecha.forEach(campo => {
        campo.classList.add('form-fecha-tooltip');
    });
    
    // Formatear fechas mostradas en la interfaz
    const elementosFecha = document.querySelectorAll('.fecha-formateada');
    elementosFecha.forEach(elemento => {
        const fechaOriginal = elemento.getAttribute('data-fecha');
        if (fechaOriginal) {
            const fecha = new Date(fechaOriginal);
            elemento.textContent = fecha.toLocaleDateString('es-ES');
        }
    });
}

/**
 * Inicializa validaciones de campos de peso
 */
function inicializarValidacionesPeso() {
    const camposPeso = document.querySelectorAll('input[type="number"][name*="peso"]');
    
    camposPeso.forEach(campo => {
        campo.addEventListener('input', function() {
            const valor = parseFloat(this.value);
            
            // Validar que el peso sea positivo
            if (valor < 0) {
                this.value = 0;
            }
            
            // Si hay un peso máximo definido, validar que no lo exceda
            const pesoMax = this.getAttribute('data-peso-max');
            if (pesoMax && valor > parseFloat(pesoMax)) {
                this.value = pesoMax;
                mostrarAlerta(`El peso no puede ser mayor que ${pesoMax} kg`, 'warning');
            }
        });
    });
}

/**
 * Marca los campos requeridos con asterisco
 */
function marcarCamposRequeridos() {
    const camposRequeridos = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    camposRequeridos.forEach(campo => {
        const label = document.querySelector(`label[for="${campo.id}"]`);
        if (label) {
            label.classList.add('required-field');
        }
    });
}

/**
 * Inicializa los cálculos para el formulario de clasificación
 */
function inicializarCalculosClasificacion() {
    const formClasificacion = document.querySelector('form[action*="clasificacion"]');
    
    if (formClasificacion) {
        const pesoPergamino = document.getElementById('peso_pergamino');
        const pesoPasilla = document.getElementById('peso_pasilla');
        const pesoTotal = document.getElementById('peso_total');
        const calculoSuma = document.getElementById('calculoSuma');
        const pesoTotalFeedback = document.getElementById('pesoTotalFeedback');
        const btnSubmit = document.getElementById('btnSubmit');
        
        // Verificar si los campos existen
        if (!pesoPergamino || !pesoPasilla || !pesoTotal) {
            return; // Salir si algún campo no existe
        }
        
        // Obtener peso del secado desde el atributo data del formulario
        const pesoSecadoFinal = parseFloat(formClasificacion.getAttribute('data-peso-secado-final')) || 100;
        const toleranciaMax = pesoSecadoFinal * 1.01;
        
        // Función para actualizar la suma
        function actualizarSuma() {
            const pesoPergaminoVal = parseFloat(pesoPergamino.value) || 0;
            const pesoPasillaVal = parseFloat(pesoPasilla.value) || 0;
            const pesoTotalVal = parseFloat(pesoTotal.value) || 0;
            const suma = pesoPergaminoVal + pesoPasillaVal;
            
            if (calculoSuma) {
                calculoSuma.textContent = `Suma: ${suma.toFixed(2)} kg`;
            }
            
            // Validar que la suma sea igual al peso total
            const tolerancia = 0.1;
            if (Math.abs(suma - pesoTotalVal) > tolerancia) {
                pesoTotal.classList.add('is-invalid');
                if (pesoTotalFeedback) {
                    pesoTotalFeedback.textContent = `El peso total debe ser igual a la suma del pergamino y pasilla (${suma.toFixed(2)} kg)`;
                }
                if (btnSubmit) btnSubmit.disabled = true;
            } else if (pesoTotalVal > toleranciaMax) {
                pesoTotal.classList.add('is-invalid');
                if (pesoTotalFeedback) {
                    pesoTotalFeedback.textContent = `El peso total no puede superar ${toleranciaMax.toFixed(2)} kg (peso final del secado + 1%)`;
                }
                if (btnSubmit) btnSubmit.disabled = true;
            } else {
                pesoTotal.classList.remove('is-invalid');
                if (btnSubmit) btnSubmit.disabled = false;
            }
        }
        
        // Función para calcular el total
        const calcularTotal = () => {
            let totalCalculado = 0;
            
            // Calcular suma de pergamino y pasilla
            if (pesoPergamino && pesoPergamino.value) {
                totalCalculado += parseFloat(pesoPergamino.value) || 0;
            }
            
            if (pesoPasilla && pesoPasilla.value) {
                totalCalculado += parseFloat(pesoPasilla.value) || 0;
            }
            
            // Actualizar el peso total solo si se han ingresado valores en los otros campos
            if (totalCalculado > 0) {
                pesoTotal.value = totalCalculado.toFixed(2);
            }
            
            actualizarSuma();
        };
        
        // Asignar eventos a los campos de peso
        if (pesoPergamino) {
            pesoPergamino.addEventListener('input', calcularTotal);
            pesoPergamino.addEventListener('input', actualizarSuma);
            pesoPergamino.addEventListener('change', calcularTotal);
        }
        
        if (pesoPasilla) {
            pesoPasilla.addEventListener('input', calcularTotal);
            pesoPasilla.addEventListener('input', actualizarSuma);
            pesoPasilla.addEventListener('change', calcularTotal);
        }
        
        if (pesoTotal) {
            pesoTotal.addEventListener('input', actualizarSuma);
        }
        
        // Si ya hay valores, calcular el total al cargar
        if ((pesoPergamino && pesoPergamino.value) || (pesoPasilla && pesoPasilla.value)) {
            calcularTotal();
        }
        
        // Inicializar suma al cargar la página
        actualizarSuma();
    }
}

/**
 * Inicializa funcionalidades del formulario de tueste
 */
function inicializarTueste() {
    const formTueste = document.querySelector('form[action*="tueste"]');
    
    if (formTueste) {
        // Calcular el peso final total automáticamente
        function calcularPesoFinalTotal() {
            const pesoPergamino = parseFloat(document.getElementById('peso_pergamino_final')?.value) || 0;
            const pesoPasilla = parseFloat(document.getElementById('peso_pasilla_final')?.value) || 0;
            const pesoFinalInput = document.getElementById('peso_final');
            if (pesoFinalInput) {
                pesoFinalInput.value = (pesoPergamino + pesoPasilla).toFixed(2);
            }
        }

        // Añadir listeners a los inputs de peso final
        const pesoPergaminoFinal = document.getElementById('peso_pergamino_final');
        const pesoPasillaFinal = document.getElementById('peso_pasilla_final');
        
        if (pesoPergaminoFinal) {
            pesoPergaminoFinal.addEventListener('input', calcularPesoFinalTotal);
        }
        
        if (pesoPasillaFinal) {
            pesoPasillaFinal.addEventListener('input', calcularPesoFinalTotal);
        }
    }
}

/**
 * Inicializa funcionalidades del formulario de molienda
 */
function inicializarMolienda() {
    const formMolienda = document.querySelector('form[action*="molienda"]');
    
    if (formMolienda) {
        // Función para formatear el valor al perder el foco
        function formatNumberInput(input) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                input.value = value.toString(); // Asegura que se use punto como separador decimal
            }
        }

        // Aplicar a los campos de peso
        const pesoInputs = document.querySelectorAll('input[type="number"]');
        pesoInputs.forEach(input => {
            input.addEventListener('blur', function() {
                formatNumberInput(this);
            });
        });
        
        function setupCafeMoliendaSection(idPrefix, tipoCafeReal, pesoTostadoFinal) {
            // Asegurar que pesoTostadoFinal sea un número
            const pesoTostadoFinalNum = parseFloat(pesoTostadoFinal || 0);
            
            const mantenerGranoCheck = document.getElementById(`${idPrefix}_mantener_grano_check`);
            const granoSection = document.getElementById(`${idPrefix}_grano_section`);
            const pesoMantenidoGranoInput = document.getElementById(`${idPrefix}_peso_mantenido_grano`);
            
            const moliendaSeparator = document.getElementById(`${idPrefix}_molienda_separator`);
            const moliendaTitle = document.getElementById(`${idPrefix}_molienda_title`);
            const pesoInicialAMolerInput = document.getElementById(`${idPrefix}_peso_inicial_a_moler`);
            const tipoMoliendaField = document.getElementById(`${idPrefix}_tipo_molienda_field`);
            const pesoFinalField = document.getElementById(`${idPrefix}_peso_final_field`);
            const tipoMoliendaSelect = document.getElementById(`${idPrefix}_tipo_molienda`);
            const pesoFinalMolidoInput = document.getElementById(`${idPrefix}_peso_final_molido`);

            // Si es Pasilla, la lógica de mantener en grano no aplica y los campos de molienda son siempre visibles
            if (tipoCafeReal.toLowerCase() === 'pasilla') {
                if(granoSection) granoSection.style.display = 'none';
                if(moliendaSeparator) moliendaSeparator.style.display = 'block';
                if(moliendaTitle) moliendaTitle.style.display = 'block';
                if (pesoInicialAMolerInput) pesoInicialAMolerInput.value = pesoTostadoFinalNum.toFixed(2);
                if (tipoMoliendaField) tipoMoliendaField.style.display = 'block';
                if (pesoFinalField) pesoFinalField.style.display = 'block';
                if (tipoMoliendaSelect) tipoMoliendaSelect.setAttribute('required', 'required');
                if (pesoFinalMolidoInput) pesoFinalMolidoInput.setAttribute('required', 'required');
                return;
            }

            // Lógica original para Pergamino (o cualquier otro tipo que permita mantener en grano)
            if (!mantenerGranoCheck) return; 

            mantenerGranoCheck.addEventListener('change', function() {
                const mostrarGrano = this.checked;
                if (granoSection) granoSection.style.display = mostrarGrano ? 'block' : 'none';
                if (moliendaSeparator) moliendaSeparator.style.display = mostrarGrano ? 'block' : 'none';
                if (moliendaTitle) moliendaTitle.style.display = mostrarGrano ? 'block' : 'none';
                
                actualizarPesosYMolienda();
            });

            if (pesoMantenidoGranoInput) {
                pesoMantenidoGranoInput.addEventListener('input', function() {
                    actualizarPesosYMolienda();
                });
            }

            function actualizarPesosYMolienda() {
                let pesoMantenidoGrano = 0;
                if (mantenerGranoCheck.checked && pesoMantenidoGranoInput) {
                    pesoMantenidoGrano = parseFloat(pesoMantenidoGranoInput.value) || 0;
                    if (pesoMantenidoGrano < 0) pesoMantenidoGrano = 0;
                    if (pesoMantenidoGrano > pesoTostadoFinalNum) {
                        pesoMantenidoGrano = pesoTostadoFinalNum;
                        pesoMantenidoGranoInput.value = pesoMantenidoGrano.toFixed(2);
                    }
                }
                
                const pesoParaMoler = pesoTostadoFinalNum - pesoMantenidoGrano;
                if (pesoInicialAMolerInput) {
                    pesoInicialAMolerInput.value = pesoParaMoler.toFixed(2);
                }

                const hayAlgoParaMoler = pesoParaMoler > 0.001; 
                
                if (tipoMoliendaField) tipoMoliendaField.style.display = hayAlgoParaMoler ? 'block' : 'none';
                if (pesoFinalField) pesoFinalField.style.display = hayAlgoParaMoler ? 'block' : 'none';
                
                if (hayAlgoParaMoler) {
                    if (tipoMoliendaSelect) tipoMoliendaSelect.setAttribute('required', 'required');
                    if (pesoFinalMolidoInput) pesoFinalMolidoInput.setAttribute('required', 'required');
                } else {
                    if (tipoMoliendaSelect) {
                        tipoMoliendaSelect.removeAttribute('required');
                        tipoMoliendaSelect.value = '';
                    }
                    if (pesoFinalMolidoInput) {
                        pesoFinalMolidoInput.removeAttribute('required');
                        pesoFinalMolidoInput.value = '';
                    }
                }
            }
            actualizarPesosYMolienda();
        }

        // Buscar datos de tueste en el DOM para inicializar las secciones
        const pergaminoData = document.querySelector('[data-pergamino-peso]');
        const pasillaData = document.querySelector('[data-pasilla-peso]');
        
        if (pergaminoData) {
            const peso = parseFloat(pergaminoData.getAttribute('data-pergamino-peso'));
            if (peso > 0) {
                setupCafeMoliendaSection('pergamino', 'Pergamino', peso);
            }
        }
        
        if (pasillaData) {
            const peso = parseFloat(pasillaData.getAttribute('data-pasilla-peso'));
            if (peso > 0) {
                setupCafeMoliendaSection('pasilla', 'Pasilla', peso);
            }
        }
    }
}

/**
 * Inicializa funcionalidades del formulario de empacado
 */
function inicializarEmpacado() {
    const formEmpacado = document.getElementById('formEmpacadoUnificado');
    
    if (formEmpacado) {
        // Toggle de formularios según checkboxes
        const toggleForms = () => {
            const empacarGrano = document.getElementById('empacar_grano');
            const formGrano = document.getElementById('form_grano');
            if (empacarGrano && formGrano) {
                formGrano.querySelectorAll('input, textarea').forEach(input => {
                    input.required = false;
                });
                formGrano.style.display = empacarGrano.checked ? 'block' : 'none';
            }

            const empacarMolido = document.getElementById('empacar_molido');
            const formMolido = document.getElementById('form_molido');
            if (empacarMolido && formMolido) {
                formMolido.querySelectorAll('input, textarea').forEach(input => {
                    input.required = false;
                });
                formMolido.style.display = empacarMolido.checked ? 'block' : 'none';
            }

            const empacarPasilla = document.getElementById('empacar_pasilla');
            const formPasilla = document.getElementById('form_pasilla');
            if (empacarPasilla && formPasilla) {
                formPasilla.querySelectorAll('input, textarea').forEach(input => {
                    input.required = false;
                });
                formPasilla.style.display = empacarPasilla.checked ? 'block' : 'none';
            }

            const btnRegistrar = document.getElementById('btnRegistrarEmpacado');
            if (btnRegistrar) {
                btnRegistrar.disabled = false;
            }
        };

        // Eventos de toggle para checkboxes
        const checkboxes = document.querySelectorAll('.form-check-input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', toggleForms);
        });

        // Inicializar formularios
        toggleForms();
    }
}

/**
 * Inicializa funcionalidades del formulario de trilla
 */
function inicializarTrilla() {
    const formTrilla = document.querySelector('form[action*="trilla"]');
    
    if (formTrilla) {
        // Función para formatear el valor al perder el foco
        function formatNumberInput(input) {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                input.value = value.toString(); // Asegura que se use punto como separador decimal
            }
        }

        // Aplicar a los campos de peso
        const pesoInputs = document.querySelectorAll('input[type="number"]');
        pesoInputs.forEach(input => {
            input.addEventListener('blur', function() {
                formatNumberInput(this);
            });
        });
    }
}

/**
 * Muestra una alerta temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta (success, warning, danger, info)
 */
function mostrarAlerta(mensaje, tipo = 'info') {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertaDiv.setAttribute('role', 'alert');
    
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar al inicio del contenedor principal
    const contenedor = document.querySelector('.container');
    if (contenedor) {
        contenedor.insertBefore(alertaDiv, contenedor.firstChild);
        
        // Eliminar automáticamente después de 5 segundos
        setTimeout(() => {
            alertaDiv.classList.remove('show');
            setTimeout(() => alertaDiv.remove(), 150);
        }, 5000);
    }
}

/**
 * Previene que la rueda del ratón haga scroll en la página cuando se está sobre un campo numérico
 */
function prevenirScrollEnCamposNumericos() {
    const camposNumericos = document.querySelectorAll('input[type="number"]');
    
    camposNumericos.forEach(campo => {
        // Prevenir scroll con la rueda del ratón
        campo.addEventListener('wheel', function(e) {
            // Solo si el campo está enfocado, prevenimos el scroll de la página
            if (document.activeElement === this) {
                e.preventDefault();
            }
        }, { passive: false }); // Es importante usar passive: false para poder prevenir el comportamiento por defecto
        
        // Prevenir scroll con teclado (flechas arriba/abajo)
        campo.addEventListener('keydown', function(e) {
            // Códigos de tecla para flechas arriba y abajo
            if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && document.activeElement === this) {
                e.stopPropagation(); // Evitar que el evento se propague a los manejadores de eventos de scroll
            }
        });
        
        // Agregar clase visual cuando el campo tiene foco
        campo.addEventListener('focus', function() {
            this.classList.add('input-number-focused');
        });
        
        campo.addEventListener('blur', function() {
            this.classList.remove('input-number-focused');
        });
    });
    
    // Añadir estilo CSS para los campos numéricos enfocados
    const style = document.createElement('style');
    style.textContent = `
        .input-number-focused {
            box-shadow: 0 0 5px rgba(81, 203, 238, 1);
            border-color: rgba(81, 203, 238, 1);
            transition: all 0.3s ease;
        }
        
        /* Añadir indicadores de flechas más visibles en inputs numéricos */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            opacity: 1;
            height: 24px;
        }
    `;
    document.head.appendChild(style);
} 