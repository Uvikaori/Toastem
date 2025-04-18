const { autenticado, noAutenticado } = require('../../middlewares/auth');

describe('Middlewares de Autenticación', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
        mockReq = {
            session: {},
            method: 'GET'
        };
        mockRes = {
            redirect: jest.fn()
        };
        nextFunction = jest.fn();
    });

    describe('middleware autenticado', () => {
        it('debería permitir el acceso si el usuario está autenticado', () => {
            mockReq.session.usuario = { id: 1, email: 'test@example.com' };

            autenticado(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

        it('debería redirigir a login si el usuario no está autenticado', () => {
            mockReq.session.usuario = null;

            autenticado(mockReq, mockRes, nextFunction);

            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });

    describe('middleware noAutenticado', () => {
        it('debería permitir el acceso si el usuario no está autenticado', () => {
            mockReq.session.usuario = null;

            noAutenticado(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });

        it('debería redirigir al dashboard si el usuario está autenticado y no es una petición POST', () => {
            mockReq.session.usuario = { id: 1, email: 'test@example.com' };
            mockReq.method = 'GET';

            noAutenticado(mockReq, mockRes, nextFunction);

            expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('debería permitir peticiones POST incluso si el usuario está autenticado', () => {
            mockReq.session.usuario = { id: 1, email: 'test@example.com' };
            mockReq.method = 'POST';

            noAutenticado(mockReq, mockRes, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect(mockRes.redirect).not.toHaveBeenCalled();
        });
    });
}); 