const db = require('../config/database');

async function checkSecurityQuestions() {
  try {
    console.log('Verificando preguntas de seguridad...');
    
    // Verificar la conexión
    await db.testConnection();
    console.log('Conexión a la base de datos exitosa');
    
    // Obtener preguntas de seguridad
    const [rows] = await db.query('SELECT * FROM preguntas_seguridad');
    console.log('Preguntas encontradas:', rows.length);
    console.log('Detalles de las preguntas:', rows);
    
    // Si no hay preguntas, insertar las predefinidas
    if (rows.length === 0) {
      console.log('No hay preguntas. Insertando preguntas predefinidas...');
      const preguntasPredefinidas = [
        '¿Cuál fue el nombre de tu primera mascota?',
        '¿En qué ciudad naciste?',
        '¿Cuál es el nombre de tu madre?',
        '¿Cuál fue tu primer colegio?',
        '¿Cuál es tu color favorito?'
      ];
      
      for (const pregunta of preguntasPredefinidas) {
        await db.query('INSERT INTO preguntas_seguridad (pregunta) VALUES (?)', [pregunta]);
      }
      console.log('Preguntas predefinidas insertadas correctamente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSecurityQuestions(); 