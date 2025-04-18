// Expresiones regulares para validaciones
const REGEX = {
  NOMBRE: /^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  UBICACION: /^[A-Za-zÑñÁáÉéÍíÓóÚúÜü0-9\s.,#-]+$/
};

// Función para capitalizar palabras
function capitalizarPalabras(texto) {
  return texto.toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

// Función para validar campo vacío
function validarCampoVacio(valor, nombreCampo) {
  if (!valor || valor.trim() === '') {
    return {
      valido: false,
      mensaje: `El campo ${nombreCampo} no puede estar vacío`
    };
  }
  return { valido: true };
}

// Función para validar nombre completo
function validarNombreCompleto(nombre) {
  // Validar campo vacío
  const validacionVacio = validarCampoVacio(nombre, 'nombre');
  if (!validacionVacio.valido) {
    return validacionVacio;
  }

  // Verificar que tenga al menos un espacio (nombre y apellido)
  if (!nombre.includes(' ')) {
    return {
      valido: false,
      mensaje: 'Debe ingresar nombre y apellido separados por un espacio'
    };
  }

  // Verificar que solo contenga letras y espacios
  if (!REGEX.NOMBRE.test(nombre)) {
    return {
      valido: false,
      mensaje: 'El nombre solo puede contener letras y espacios'
    };
  }

  return { valido: true };
}

// Función para validar email
function validarEmail(email) {
  // Validar campo vacío
  const validacionVacio = validarCampoVacio(email, 'correo electrónico');
  if (!validacionVacio.valido) {
    return validacionVacio;
  }

  if (!REGEX.EMAIL.test(email)) {
    return {
      valido: false,
      mensaje: 'Ingrese un correo electrónico válido'
    };
  }
  return { valido: true };
}

// Función para validar contraseña
function validarContraseña(contraseña) {
  // Validar campo vacío
  const validacionVacio = validarCampoVacio(contraseña, 'contraseña');
  if (!validacionVacio.valido) {
    return validacionVacio;
  }

  if (!REGEX.PASSWORD.test(contraseña)) {
    return {
      valido: false,
      mensaje: 'La contraseña debe tener al menos 8 caracteres, una letra y un número'
    };
  }
  return { valido: true };
}

// Función para validar ubicación
function validarUbicacion(ubicacion) {
  // Validar campo vacío
  const validacionVacio = validarCampoVacio(ubicacion, 'ubicación');
  if (!validacionVacio.valido) {
    return validacionVacio;
  }

  if (!REGEX.UBICACION.test(ubicacion)) {
    return {
      valido: false,
      mensaje: 'La ubicación solo puede contener letras, números, espacios y los caracteres .,#-'
    };
  }
  return { valido: true };
}

// Función para validar pregunta de seguridad
function validarPreguntaSeguridad(preguntaId) {
  if (!preguntaId || preguntaId === '') {
    return {
      valido: false,
      mensaje: 'Debe seleccionar una pregunta de seguridad'
    };
  }
  return { valido: true };
}

// Función para validar respuesta de seguridad
function validarRespuestaSeguridad(respuesta) {
  return validarCampoVacio(respuesta, 'respuesta de seguridad');
}

// Función para validar nombre de finca
function validarNombreFinca(nombre) {
  return validarCampoVacio(nombre, 'nombre de la finca');
}

// Función para mostrar error en un campo
function mostrarErrorCampo(campo, mensaje) {
  const errorElement = document.getElementById(`${campo}Error`);
  const inputElement = document.getElementById(campo);
  
  if (errorElement && inputElement) {
    errorElement.textContent = mensaje;
    errorElement.hidden = false;
    inputElement.classList.add('is-invalid');
  }
}

// Función para limpiar errores de un campo
function limpiarErrorCampo(campo) {
  const errorElement = document.getElementById(`${campo}Error`);
  const inputElement = document.getElementById(campo);
  
  if (errorElement && inputElement) {
    errorElement.hidden = true;
    inputElement.classList.remove('is-invalid');
  }
}

// Exportar funciones y constantes
window.Validaciones = {
  REGEX,
  capitalizarPalabras,
  validarNombreCompleto,
  validarEmail,
  validarContraseña,
  validarUbicacion,
  validarPreguntaSeguridad,
  validarRespuestaSeguridad,
  validarNombreFinca,
  mostrarErrorCampo,
  limpiarErrorCampo
}; 