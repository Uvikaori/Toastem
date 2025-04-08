const bcrypt = require('bcrypt');
const db = require('../config/database');

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
  const { correo, contraseña } = req.body;
  
  try {
    // Buscar usuario
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        error: 'Correo electrónico o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Correo electrónico o contraseña incorrectos'
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
      error: 'Error al procesar el inicio de sesión'
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

/**
 * Procesa el registro de un nuevo usuario
 */
const registrarUsuario = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    
    const {
      nombre,
      correo,
      contraseña,
      pregunta_seguridad,
      respuesta_seguridad,
      nombre_finca,
      ubicacion_finca
    } = req.body;

    // Verificar si el correo ya está registrado
    const [usuariosExistentes] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [correo]
    );

    // Verificar si usuariosExistentes es un array antes de acceder a length
    if (usuariosExistentes && usuariosExistentes.length > 0) {
      return res.status(400).json({
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Hashear la contraseña
    const rondasSalt = 10;
    const contraseñaHasheada = await bcrypt.hash(contraseña, rondasSalt);

    // Insertar usuario
    const [resultado] = await db.query(
      `INSERT INTO usuarios (
        nombre, email, password, id_pregunta_seguridad, 
        respuesta_seguridad, nombre_finca, ubicacion_finca
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        correo,
        contraseñaHasheada,
        pregunta_seguridad,
        respuesta_seguridad,
        nombre_finca,
        ubicacion_finca
      ]
    );

    console.log('Usuario registrado con ID:', resultado.insertId);
    res.json({ exito: true });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      error: 'Error al procesar el registro: ' + error.message
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

module.exports = {
  mostrarPaginaInicioSesion,
  iniciarSesion,
  mostrarPaginaRegistro,
  registrarUsuario,
  cerrarSesion
}; 