const request = require('supertest');
const app = require('../../app');
const bcrypt = require('bcrypt');

// Mock de la clase Usuario
jest.mock('../../models/Usuario', () => {
    return {
        findByEmail: jest.fn(),
        create: jest.fn(),
        validatePassword: jest.fn()
    };
});

const Usuario = require('../../models/Usuario');

describe('Rutas de Autenticación', () => {
    beforeEach(() => {
        // Limpiar todos los mocks
        jest.clearAllMocks();
    });

    describe('GET /auth/login', () => {
        it('debería renderizar la página de login', async () => {
            const response = await request(app)
                .get('/auth/login')
                .expect(200);

            expect(response.text).toContain('Iniciar Sesión');
        });
    });

    describe('GET /auth/register', () => {
        it('debería renderizar la página de registro', async () => {
            const response = await request(app)
                .get('/auth/register')
                .expect(200);

            expect(response.text).toContain('Registro');
        });
    });

    describe('POST /auth/register', () => {
        const validUser = {
            nombre_completo: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
            pregunta_seguridad: '¿Cuál es tu color favorito?',
            respuesta_seguridad: 'Azul',
            nombre_finca: 'Finca Test',
            ubicacion_finca: 'Test Location'
        };

        it('debería registrar un nuevo usuario con datos válidos', async () => {
            Usuario.findByEmail.mockResolvedValue(null);
            Usuario.create.mockResolvedValue({ id: 1, ...validUser });

            const response = await request(app)
                .post('/auth/register')
                .send(validUser)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Usuario registrado correctamente');
            expect(Usuario.findByEmail).toHaveBeenCalledWith(validUser.email);
            expect(Usuario.create).toHaveBeenCalled();
        });

        it('debería rechazar un registro con email duplicado', async () => {
            Usuario.findByEmail.mockResolvedValue({ id: 2, email: validUser.email });

            const response = await request(app)
                .post('/auth/register')
                .send(validUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(Usuario.findByEmail).toHaveBeenCalledWith(validUser.email);
            expect(Usuario.create).not.toHaveBeenCalled();
        });

        it('debería rechazar un registro con datos incompletos', async () => {
            const incompleteUser = {
                email: 'incomplete@example.com',
                password: 'Password123!'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(incompleteUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(Usuario.create).not.toHaveBeenCalled();
        });
    });

    describe('POST /auth/login', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'Password123!'
        };

        const mockUser = {
            id: 1,
            email: 'test@example.com',
            password: bcrypt.hashSync('Password123!', 10)
        };

        it('debería permitir el login con credenciales correctas', async () => {
            Usuario.findByEmail.mockResolvedValue(mockUser);
            Usuario.validatePassword.mockResolvedValue(true);

            const response = await request(app)
                .post('/auth/login')
                .send(validCredentials)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login exitoso');
            expect(Usuario.findByEmail).toHaveBeenCalledWith(validCredentials.email);
        });

        it('debería rechazar el login con contraseña incorrecta', async () => {
            Usuario.findByEmail.mockResolvedValue(mockUser);
            Usuario.validatePassword.mockResolvedValue(false);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: validCredentials.email,
                    password: 'WrongPassword123!'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('debería rechazar el login con email no registrado', async () => {
            Usuario.findByEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: validCredentials.password
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /auth/logout', () => {
        it('debería cerrar la sesión correctamente', async () => {
            const response = await request(app)
                .get('/auth/logout')
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Sesión cerrada correctamente');
        });
    });
}); 