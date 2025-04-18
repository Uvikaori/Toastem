const bcrypt = require('bcrypt');
const db = require('../config/database');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');

/**
 * Muestra la página de inicio de sesión
 */
const mostrarPaginaInicioSesion = (req, res) => {
  res.render('auth/login', {
    titulo: 'Iniciar sesión | Toastem',
    hideNavbar: false
  });
};

/**
 * Procesa el inicio de sesión
 */
const iniciarSesion = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    const errores = {};

    // Validar campos vacíos
    if (!correo || correo.trim() === '') {
      errores.correo = 'El correo electrónico no puede estar vacío';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)) {
      errores.correo = 'Ingrese un correo electrónico válido';
    }

    if (!contraseña) {
      errores.contraseña = 'La contraseña no puede estar vacía';
    }

    // Si hay errores de validación, devolverlos
    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Buscar usuario
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ 
        errores: { 
          correo: 'El correo electrónico no está registrado' 
        } 
      });
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.password);
    if (!contraseñaValida) {
      return res.status(400).json({ 
        errores: { 
          contraseña: 'La contraseña es incorrecta' 
        } 
      });
    }

    // Eliminar datos sensibles
    delete usuario.password;
    delete usuario.respuesta_seguridad;
    
    // Guardar usuario en sesión
    req.session.idUsuario = usuario.id;
    req.session.usuario = usuario;
    
    res.json({ exito: true });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ 
      errores: { 
        general: 'Error al procesar el inicio de sesión' 
      } 
    });
  }
};

/**
 * Muestra la página de registro
 */
const mostrarPaginaRegistro = async (req, res) => {
  try {
    // Usar preguntas predefinidas directamente
    const preguntasArray = [
      { id: 1, pregunta: '¿Cuál fue el nombre de tu primera mascota?' },
      { id: 2, pregunta: '¿En qué ciudad naciste?' },
      { id: 3, pregunta: '¿Cuál es el nombre de tu madre?' },
      { id: 4, pregunta: '¿Cuál fue tu primer colegio?' },
      { id: 5, pregunta: '¿Cuál es tu color favorito?' }
    ];
    
    res.render('auth/register', {
      titulo: 'Registro | Toastem',
      preguntas: preguntasArray,
      hideNavbar: false
    });
  } catch (error) {
    console.error('Error al cargar la página de registro:', error);
    res.status(500).render('error', { 
      titulo: 'Error | Toastem',
      mensaje: 'Error al cargar la página de registro',
      preguntas: [] // Proporcionar un array vacío en caso de error
    });
  }
};

// Función para validar los datos del formulario
function validarDatosRegistro(datos) {
  const errores = {};

  // Validar nombre
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre no puede estar vacío';
  } else if (!/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/.test(datos.nombre)) {
    errores.nombre = 'El nombre solo puede contener letras y espacios';
  } else if (!datos.nombre.includes(' ')) {
    errores.nombre = 'Debe ingresar nombre y apellido separados por un espacio';
  }

  // Validar email
  if (!datos.correo || datos.correo.trim() === '') {
    errores.correo = 'El correo electrónico no puede estar vacío';
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(datos.correo)) {
    errores.correo = 'Ingrese un correo electrónico válido';
  }

  // Validar contraseña
  if (!datos.contraseña) {
    errores.contraseña = 'La contraseña no puede estar vacía';
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(datos.contraseña)) {
    errores.contraseña = 'La contraseña debe tener al menos 6 caracteres, una letra y un número';
  }

  // Validar confirmación de contraseña
  if (!datos.confirmarContraseña) {
    errores.confirmarContraseña = 'Debe confirmar la contraseña';
  } else if (datos.contraseña !== datos.confirmarContraseña) {
    errores.confirmarContraseña = 'Las contraseñas no coinciden';
  }

  // Validar pregunta de seguridad
  if (!datos.pregunta_seguridad) {
    errores.pregunta_seguridad = 'Debe seleccionar una pregunta de seguridad';
  }

  // Validar respuesta de seguridad
  if (!datos.respuesta_seguridad || datos.respuesta_seguridad.trim() === '') {
    errores.respuesta_seguridad = 'La respuesta de seguridad no puede estar vacía';
  }

  // Validar nombre de finca
  if (!datos.nombre_finca || datos.nombre_finca.trim() === '') {
    errores.nombre_finca = 'El nombre de la finca no puede estar vacío';
  }

  // Validar ubicación de finca
  if (!datos.ubicacion_finca || datos.ubicacion_finca.trim() === '') {
    errores.ubicacion_finca = 'La ubicación de la finca no puede estar vacía';
  } else if (!/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü0-9\s.,#-]+$/.test(datos.ubicacion_finca)) {
    errores.ubicacion_finca = 'La ubicación solo puede contener letras, números, espacios y los caracteres .,#-';
  }

  return errores;
}

// Función para capitalizar palabras
function capitalizarPalabras(texto) {
  return texto.toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

/**
 * Procesa el registro de un nuevo usuario
 */
const registrarUsuario = async (req, res) => {
  try {
    const datos = req.body;
    console.log('Datos recibidos:', datos);

    // Validar datos
    const errores = validarDatosRegistro(datos);
    
    // Si hay errores, devolverlos
    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar si el usuario ya existe
    const [usuariosExistentes] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [datos.correo]
    );

    if (usuariosExistentes && usuariosExistentes.length > 0) {
      return res.status(400).json({ 
        errores: { 
          correo: 'El correo electrónico ya está registrado' 
        } 
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(datos.contraseña, salt);

    // Insertar usuario
    const [resultado] = await db.query(
      `INSERT INTO usuarios (
        nombre, email, password, id_pregunta_seguridad, 
        respuesta_seguridad, nombre_finca, ubicacion_finca
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        capitalizarPalabras(datos.nombre),
        datos.correo,
        hashedPassword,
        datos.pregunta_seguridad,
        datos.respuesta_seguridad,
        capitalizarPalabras(datos.nombre_finca),
        capitalizarPalabras(datos.ubicacion_finca)
      ]
    );

    // Verificar si la inserción fue exitosa
    if (resultado && resultado.insertId) {
      console.log('Usuario registrado con ID:', resultado.insertId);
      return res.status(200).json({ 
        exito: true,
        mensaje: 'Su registro ha sido exitoso, ahora puede iniciar sesión'
      });
    } else {
      throw new Error('No se pudo crear el usuario en la base de datos');
    }
  } catch (error) {
    console.error('Error en registrarUsuario:', error);
    return res.status(500).json({ 
      errores: { 
        general: 'Error al procesar el registro: ' + error.message
      } 
    });
  }
};

/**
 * Cierra la sesión del usuario
 */
const cerrarSesion = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

/**
 * Muestra la página de recuperación de contraseña
 */
const mostrarPaginaRecuperacion = (req, res) => {
  try {
    res.render('auth/recuperar-password', {
      titulo: 'Recuperar Contraseña | Toastem',
      hideNavbar: false,
      usuario: req.session.usuario || null
    });
  } catch (error) {
    console.error('Error al mostrar página de recuperación:', error);
    res.status(500).render('error', {
      titulo: 'Error | Toastem',
      mensaje: 'Error al cargar la página de recuperación de contraseña',
      hideNavbar: false,
      usuario: req.session.usuario || null
    });
  }
};

/**
 * Verifica el correo y devuelve la pregunta de seguridad
 */
const verificarCorreo = async (req, res) => {
  try {
    const { correo } = req.body;
    
    // Validar correo
    if (!correo || correo.trim() === '') {
      return res.status(400).json({ 
        errores: { 
          correo: 'El correo electrónico no puede estar vacío' 
        } 
      });
    }

    // Buscar usuario
    const [usuarios] = await db.query(
      'SELECT id, id_pregunta_seguridad FROM usuarios WHERE email = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ 
        errores: { 
          correo: 'No existe una cuenta con este correo electrónico' 
        } 
      });
    }

    // Obtener pregunta de seguridad
    const preguntasArray = [
      { id: 1, pregunta: '¿Cuál fue el nombre de tu primera mascota?' },
      { id: 2, pregunta: '¿En qué ciudad naciste?' },
      { id: 3, pregunta: '¿Cuál es el nombre de tu madre?' },
      { id: 4, pregunta: '¿Cuál fue tu primer colegio?' },
      { id: 5, pregunta: '¿Cuál es tu color favorito?' }
    ];

    const pregunta = preguntasArray.find(p => p.id === usuarios[0].id_pregunta_seguridad);

    if (!pregunta) {
      return res.status(500).json({ 
        errores: { 
          general: 'Error al recuperar la pregunta de seguridad' 
        } 
      });
    }

    res.json({ 
      pregunta: pregunta.pregunta 
    });

  } catch (error) {
    console.error('Error al verificar correo:', error);
    res.status(500).json({ 
      errores: { 
        general: 'Error al procesar la solicitud' 
      } 
    });
  }
};

/**
 * Verifica la respuesta y permite resetear la contraseña
 */
const resetearContraseña = async (req, res) => {
  try {
    const { correo, respuesta, nuevaContraseña, confirmarContraseña } = req.body;
    const errores = {};

    // Validar contraseña
    if (!nuevaContraseña) {
      errores.nuevaContraseña = 'La contraseña no puede estar vacía';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(nuevaContraseña)) {
      errores.nuevaContraseña = 'La contraseña debe tener al menos 6 caracteres, una letra y un número';
    }

    // Validar confirmación
    if (!confirmarContraseña) {
      errores.confirmarContraseña = 'Debe confirmar la contraseña';
    } else if (nuevaContraseña !== confirmarContraseña) {
      errores.confirmarContraseña = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    // Verificar respuesta de seguridad
    const [usuarios] = await db.query(
      'SELECT id, respuesta_seguridad FROM usuarios WHERE email = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ 
        errores: { 
          general: 'Usuario no encontrado' 
        } 
      });
    }

    const usuario = usuarios[0];

    // Verificar respuesta
    if (respuesta.toLowerCase() !== usuario.respuesta_seguridad.toLowerCase()) {
      return res.status(400).json({ 
        errores: { 
          respuesta: 'La respuesta de seguridad es incorrecta' 
        } 
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(nuevaContraseña, salt);

    // Actualizar contraseña
    await db.query(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hash, usuario.id]
    );

    res.json({ 
      mensaje: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ 
      errores: { 
        general: 'Error al procesar la solicitud' 
      } 
    });
  }
};

module.exports = {
  mostrarPaginaInicioSesion,
  iniciarSesion,
  mostrarPaginaRegistro,
  registrarUsuario,
  cerrarSesion,
  mostrarPaginaRecuperacion,
  verificarCorreo,
  resetearContraseña
}; 