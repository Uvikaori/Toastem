const authController = require('../../controllers/authController');
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

describe('AuthController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            session: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            render: jest.fn(),
            redirect: jest.fn()
        };

        // Limpiar todos los mocks
        jest.clearAllMocks();
    });

    describe('registrarUsuario', () => {
        const validUser = {
            nombre_completo: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
            pregunta_seguridad: '¿Cuál es tu color favorito?',
            respuesta_seguridad: 'Azul',
            nombre_finca: 'Finca Test',
            ubicacion_finca: 'Test Location'
        };

        it('debería registrar un usuario exitosamente', async () => {
            mockReq.body = validUser;
            Usuario.findByEmail.mockResolvedValue(null);
            Usuario.create.mockResolvedValue({ id: 1, ...validUser });

            await authController.registrarUsuario(mockReq, mockRes);

            expect(Usuario.findByEmail).toHaveBeenCalledWith(validUser.email);
            expect(Usuario.create).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String)
                })
            );
        });

        it('debería manejar errores de validación', async () => {
            mockReq.body = {
                email: 'invalid-email',
                password: '123' // Contraseña muy corta
            };

            await authController.registrarUsuario(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });

        it('debería rechazar un email duplicado', async () => {
            mockReq.body = validUser;
            Usuario.findByEmail.mockResolvedValue({ id: 2, email: validUser.email });

            await authController.registrarUsuario(mockReq, mockRes);

            expect(Usuario.findByEmail).toHaveBeenCalledWith(validUser.email);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('existe')
                })
            );
        });
    });

    describe('iniciarSesion', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'Password123!'
        };

        const mockUser = {
            id: 1,
            email: 'test@example.com',
            password: bcrypt.hashSync('Password123!', 10)
        };

        it('debería iniciar sesión exitosamente', async () => {
            mockReq.body = validCredentials;
            Usuario.findByEmail.mockResolvedValue(mockUser);
            Usuario.validatePassword.mockResolvedValue(true);

            await authController.iniciarSesion(mockReq, mockRes);

            expect(Usuario.findByEmail).toHaveBeenCalledWith(validCredentials.email);
            expect(mockReq.session.usuario).toBeDefined();
            expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
        });

        it('debería rechazar credenciales inválidas', async () => {
            mockReq.body = {
                email: validCredentials.email,
                password: 'WrongPassword123!'
            };
            Usuario.findByEmail.mockResolvedValue(mockUser);
            Usuario.validatePassword.mockResolvedValue(false);

            await authController.iniciarSesion(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });

        it('debería rechazar un email no registrado', async () => {
            mockReq.body = validCredentials;
            Usuario.findByEmail.mockResolvedValue(null);

            await authController.iniciarSesion(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String)
                })
            );
        });
    });

    describe('cerrarSesion', () => {
        it('debería cerrar sesión correctamente', () => {
            mockReq.session.destroy = jest.fn(callback => callback());

            authController.cerrarSesion(mockReq, mockRes);

            expect(mockReq.session.destroy).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
        });
    });
}); 