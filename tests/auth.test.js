const request = require('supertest');
const app = require('../app');
const mysql = require('mysql2/promise');
const { testDbConfig } = require('./setup/test_db_config');

describe('Pruebas de autenticación', () => {
    let connection;

    beforeAll(async () => {
        connection = await mysql.createConnection(testDbConfig);
    });

    afterAll(async () => {
        await connection.end();
    });

    describe('POST /auth/register', () => {
        const validUser = {
            nombre_completo: 'Juan Pérez',
            email: 'juan@example.com',
            password: 'Password123!',
            pregunta_seguridad: '¿Cuál es el nombre de tu primera mascota?',
            respuesta_seguridad: 'Rex',
            nombre_finca: 'Finca Los Olivos',
            ubicacion_finca: 'Granada'
        };

        it('debería registrar un nuevo usuario con datos válidos', async () => {
            const response = await request(app)
                .post('/auth/register')
                .send(validUser);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Usuario registrado correctamente');
        });

        it('debería rechazar un registro con email duplicado', async () => {
            // Primer registro
            await request(app)
                .post('/auth/register')
                .send(validUser);

            // Intento de registro duplicado
            const response = await request(app)
                .post('/auth/register')
                .send(validUser);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('debería rechazar un registro con datos incompletos', async () => {
            const incompleteUser = {
                email: 'incompleto@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(incompleteUser);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Crear un usuario para las pruebas de login
            const user = {
                nombre_completo: 'Ana García',
                email: 'ana@example.com',
                password: 'Password123!',
                pregunta_seguridad: '¿Cuál es el nombre de tu primera mascota?',
                respuesta_seguridad: 'Luna',
                nombre_finca: 'Finca El Pinar',
                ubicacion_finca: 'Sevilla'
            };

            await request(app)
                .post('/auth/register')
                .send(user);
        });

        it('debería permitir el login con credenciales correctas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'ana@example.com',
                    password: 'Password123!'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login exitoso');
        });

        it('debería rechazar el login con contraseña incorrecta', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'ana@example.com',
                    password: 'ContraseñaIncorrecta123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('debería rechazar el login con email no registrado', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'noexiste@example.com',
                    password: 'Password123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /auth/logout', () => {
        it('debería cerrar la sesión correctamente', async () => {
            // Primero hacemos login
            await request(app)
                .post('/auth/login')
                .send({
                    email: 'ana@example.com',
                    password: 'Password123!'
                });

            // Luego intentamos hacer logout
            const response = await request(app)
                .get('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Sesión cerrada correctamente');
        });
    });
}); 