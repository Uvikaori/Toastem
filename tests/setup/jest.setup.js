const { setupTestDb, cleanupTestDb } = require('./test_db_config');

// Configurar el entorno de pruebas
process.env.NODE_ENV = 'test';

// Configurar la base de datos antes de todas las pruebas
beforeAll(async () => {
    try {
        await setupTestDb();
    } catch (error) {
        console.error('Error configurando la base de datos de prueba:', error);
    }
});

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
    try {
        await cleanupTestDb();
    } catch (error) {
        console.error('Error limpiando la base de datos de prueba:', error);
    }
});

// Aumentar el tiempo de espera para las pruebas
jest.setTimeout(10000); 