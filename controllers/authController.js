const bcrypt = require('bcrypt');
const db = require('../config/database');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../utils/helpers');
const { setMessages } = require('../utils/messages');

/**
 * Muestra la página de inicio de sesión
 */
const mostrarPaginaInicioSesion = (req, res) => {
  const errorMessages = req.flash('error') || [];
  const successMessages = req.flash('mensaje') || [];
  
  const filteredErrors = errorMessages.filter(msg => msg && msg.toString().trim() !== '');
  const filteredSuccess = successMessages.filter(msg => msg && msg.toString().trim() !== '');

  res.render('auth/login', {
    titulo: 'Iniciar sesión | Toastem',
    hideNavbar: false,
    error: filteredErrors.length > 0 ? filteredErrors : null,
    mensaje: filteredSuccess.length > 0 ? filteredSuccess : null
  });
};

/**
 * Procesa el inicio de sesión
 */
const iniciarSesion = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    console.log('Datos recibidos:', { correo });

    if (!correo || correo.trim() === '') {
      return res.status(400).json({
        errores: { correo: 'El correo electrónico no puede estar vacío' }
      });
    }

    if (!contraseña) {
      return res.status(400).json({
        errores: { contraseña: 'La contraseña no puede estar vacía' }
      });
    }

    console.log('Configuración DB:', {
      host: db.pool ? db.pool.config.connectionConfig.host : 'No disponible',
      port: db.pool ? db.pool.config.connectionConfig.port : 'No disponible',
      database: db.pool ? db.pool.config.connectionConfig.database : 'No disponible'
    });

    let usuarios;
    try {
      console.log('Intentando ejecutar consulta para buscar usuario...');
      [usuarios] = await db.query(
        'SELECT * FROM usuarios WHERE email = ?',
        [correo]
      );
      console.log('Usuario encontrado:', usuarios[0]?.id);
    } catch (dbError) {
      console.error('Error de base de datos al buscar usuario:', dbError);
      return res.status(500).json({
        errores: { 
          general: 'Error al buscar el usuario en la base de datos',
          details: dbError.message
        }
      });
    }

    if (usuarios.length === 0) {
      return res.status(400).json({
        errores: { correo: 'El correo electrónico no está registrado' }
      });
    }

    const usuario = usuarios[0];

    let contraseñaValida;
    try {
      contraseñaValida = await bcrypt.compare(contraseña, usuario.password);
    } catch (bcryptError) {
      console.error('Error al verificar contraseña con bcrypt:', bcryptError);
      return res.status(500).json({
        errores: { 
          general: 'Error al verificar la contraseña',
          details: bcryptError.message
        }
      });
    }
    
    if (!contraseñaValida) {
      return res.status(400).json({
        errores: { contraseña: 'La contraseña es incorrecta' }
      });
    }

    delete usuario.password;
    delete usuario.respuesta_seguridad;

    req.session.usuario = usuario;
    req.session.idUsuario = usuario.id;

    req.flash('error');

    console.log('Sesión establecida y flashes de error limpiados:', req.session);

    req.session.save(err => {
      if (err) {
        console.error('Error al guardar sesión después de limpiar flash:', err);
        return res.status(500).json({
          errores: { 
            general: 'Error al procesar el inicio de sesión al guardar la sesión.',
            details: err.message
          }
        });
      }

      res.json({
        success: true,
        redirect: '/fincas/gestionar'
      });
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      errores: { 
        general: 'Error al procesar el inicio de sesión',
        details: error.message,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      }
    });
  }
};

/**
 * Muestra la página de registro
 */
const mostrarPaginaRegistro = async (req, res) => {
  try {
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
      preguntas: [],
      hideNavbar: true,
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

function validarDatosRegistro(datos) {
  const errores = {};

  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre no puede estar vacío';
  } else if (!/^[A-Za-zÑñÁáÉéÍíÓóÚúÜü\s]+$/.test(datos.nombre)) {
    errores.nombre = 'El nombre solo puede contener letras y espacios';
  } else if (!datos.nombre.includes(' ')) {
    errores.nombre = 'Debe ingresar nombre y apellido separados por un espacio';
  }

  if (!datos.correo || datos.correo.trim() === '') {
    errores.correo = 'El correo electrónico no puede estar vacío';
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(datos.correo)) {
    errores.correo = 'Ingrese un correo electrónico válido';
  }

  if (!datos.contraseña) {
    errores.contraseña = 'La contraseña no puede estar vacía';
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(datos.contraseña)) {
    errores.contraseña = 'La contraseña debe tener al menos 6 caracteres, una letra y un número';
  }

  if (!datos.confirmarContraseña) {
    errores.confirmarContraseña = 'Debe confirmar la contraseña';
  } else if (datos.contraseña !== datos.confirmarContraseña) {
    errores.confirmarContraseña = 'Las contraseñas no coinciden';
  }

  if (!datos.pregunta_seguridad) {
    errores.pregunta_seguridad = 'Debe seleccionar una pregunta de seguridad';
  }

  if (!datos.respuesta_seguridad || datos.respuesta_seguridad.trim() === '') {
    errores.respuesta_seguridad = 'La respuesta de seguridad no puede estar vacía';
  }
  return errores;
}

/**
 * Procesa el registro de un nuevo usuario
 */
const registrarUsuario = async (req, res) => {
  try {
    const datos = req.body;
    console.log('Datos recibidos:', datos);

    const errores = validarDatosRegistro(datos);

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(datos.contraseña, salt);

    const [resultado] = await db.query(
      `INSERT INTO usuarios (
        nombre, email, password, id_pregunta_seguridad, 
        respuesta_seguridad
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        capitalizarPalabras(datos.nombre),
        datos.correo,
        hashedPassword,
        datos.pregunta_seguridad,
        datos.respuesta_seguridad,
      ]
    );

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
 * Cierra la sesión del usuario vía AJAX (para cuando se cierra la ventana)
 */
const cerrarSesionAjax = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
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
      hideNavbar: true,
      error: process.env.NODE_ENV === 'development' ? error : {},
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

    if (!correo || correo.trim() === '') {
      return res.status(400).json({
        errores: {
          correo: 'El correo electrónico no puede estar vacío'
        }
      });
    }

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

    if (!nuevaContraseña) {
      errores.nuevaContraseña = 'La contraseña no puede estar vacía';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(nuevaContraseña)) {
      errores.nuevaContraseña = 'La contraseña debe tener al menos 6 caracteres, una letra y un número';
    }

    if (!confirmarContraseña) {
      errores.confirmarContraseña = 'Debe confirmar la contraseña';
    } else if (nuevaContraseña !== confirmarContraseña) {
      errores.confirmarContraseña = 'Las contraseñas no coinciden';
    }

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

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

    if (respuesta.toLowerCase() !== usuario.respuesta_seguridad.toLowerCase()) {
      return res.status(400).json({
        errores: {
          respuesta: 'La respuesta de seguridad es incorrecta'
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(nuevaContraseña, salt);

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
  cerrarSesionAjax,
  mostrarPaginaRecuperacion,
  verificarCorreo,
  resetearContraseña
};