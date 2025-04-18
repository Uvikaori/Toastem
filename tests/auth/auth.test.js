const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb } = require('../setup/test_db_config');

describe('Pruebas de Autenticación', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('POST /auth/register', () => {
    const validUser = {
      nombre_completo: 'Test User',
      email: 'test@example.com',
      password: 'Test1234!',
      confirm_password: 'Test1234!',
      pregunta_seguridad: '¿Cuál es el nombre de tu primera mascota?',
      respuesta_seguridad: 'Max',
      nombre_finca: 'Finca Test',
      ubicacion_finca: 'Test Location'
    };

    it('debería registrar un nuevo usuario con datos válidos', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Usuario registrado exitosamente');
    });

    it('debería fallar al registrar un usuario con email duplicado', async () => {
      // Primero registramos un usuario
      await request(app)
        .post('/auth/register')
        .send(validUser);

      // Intentamos registrar el mismo usuario
      const response = await request(app)
        .post('/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería fallar al registrar con datos incompletos', async () => {
      const incompleteUser = {
        email: 'incomplete@example.com',
        password: 'Test1234!'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      nombre_completo: 'Test User',
      email: 'test@example.com',
      password: 'Test1234!',
      confirm_password: 'Test1234!',
      pregunta_seguridad: '¿Cuál es el nombre de tu primera mascota?',
      respuesta_seguridad: 'Max',
      nombre_finca: 'Finca Test',
      ubicacion_finca: 'Test Location'
    };

    beforeEach(async () => {
      // Registrar un usuario de prueba antes de cada test
      await request(app)
        .post('/auth/register')
        .send(testUser);
    });

    it('debería iniciar sesión con credenciales válidas', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Inicio de sesión exitoso');
    });

    it('debería fallar al iniciar sesión con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debería fallar al iniciar sesión con email no registrado', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 