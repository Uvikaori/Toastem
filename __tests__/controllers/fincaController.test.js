const fincaController = require('../../controllers/fincaController');
const fincaDAO = require('../../models/dao/fincaDAO');
const Finca = require('../../models/entities/Finca');
const { validationResult } = require('express-validator');
const { capitalizarPalabras } = require('../../utils/helpers');
const { setMessages } = require('../../utils/messages');

// Mockear los módulos DAO y otros helpers
jest.mock('../../models/dao/fincaDAO');
jest.mock('../../models/entities/Finca');
jest.mock('express-validator');

// Mockear helpers
jest.mock('../../utils/helpers', () => ({
    capitalizarPalabras: jest.fn((str) => str) 
}));

jest.mock('../../utils/messages', () => ({
    setMessages: {
        fincas: {
            success: jest.fn(),
            error: jest.fn()
        },
        // Añadir otros namespaces si son usados por fincaController
    }
}));


describe('FincaController', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            flash: jest.fn(() => []),
            session: {
                usuario: { id: 1 } 
            },
            params: {},
            body: {}
        };
        mockRes = {
            render: jest.fn(),
            redirect: jest.fn(),
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        
        // Limpiar mocks
        fincaDAO.getFincasByUserId.mockClear();
        fincaDAO.getMunicipiosVeredas.mockClear();
        fincaDAO.getDepartamentos.mockClear();
        fincaDAO.createFinca.mockClear();
        fincaDAO.updateFinca.mockClear();
        fincaDAO.deleteFinca.mockClear();
        fincaDAO.getFincaByIdAndUserId.mockClear();
        fincaDAO.getMunicipiosPorDepartamento.mockClear();
        fincaDAO.getVeredasPorMunicipio.mockClear();
        validationResult.mockClear();
        mockReq.flash.mockClear();
        capitalizarPalabras.mockClear();
        if (Finca.mockClear) {
            Finca.mockClear();
        }
        if (setMessages.fincas) {
            setMessages.fincas.error.mockClear();
            setMessages.fincas.success.mockClear();
        }
    });

    describe('listarFincas', () => {
        it('debería renderizar la vista gestionar-fincas con las fincas y datos necesarios si el usuario está autenticado', async () => {
            const mockFincas = [{ id: 1, nombre: 'Finca Test', id_usuario: 1 }];
            const mockMunicipiosVeredas = [{ id: 1, nom_dep: 'Antioquia', nomb_mpio: 'Medellín', nombre_ver: 'El Poblado' }];
            const mockDepartamentos = [{ nom_dep: 'Antioquia' }];

            fincaDAO.getFincasByUserId.mockResolvedValue(mockFincas);
            fincaDAO.getMunicipiosVeredas.mockResolvedValue(mockMunicipiosVeredas);
            fincaDAO.getDepartamentos.mockResolvedValue(mockDepartamentos);
            mockReq.flash = jest.fn().mockReturnValue([]); 

            await fincaController.listarFincas(mockReq, mockRes);

            expect(fincaDAO.getFincasByUserId).toHaveBeenCalledWith(mockReq.session.usuario.id);
            expect(fincaDAO.getMunicipiosVeredas).toHaveBeenCalled();
            expect(fincaDAO.getDepartamentos).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('gestionar-fincas', {
                titulo: 'Gestionar Fincas | Toastem',
                fincas: mockFincas,
                municipiosVeredasAll: mockMunicipiosVeredas,
                mensaje: [],
                error: [],
                departamentos: mockDepartamentos,
            });
        });

        it('debería redirigir al login si el usuario no está autenticado', async () => {
            mockReq.session.usuario = null; 

            await fincaController.listarFincas(mockReq, mockRes);

            expect(mockReq.flash).toHaveBeenCalledWith('error', 'Debes iniciar sesión para acceder a esta página');
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
            expect(mockRes.render).not.toHaveBeenCalled();
        });
        
        it('debería manejar errores al listar fincas y redirigir a /', async () => {
            fincaDAO.getFincasByUserId.mockRejectedValue(new Error('Error de DB'));
            mockReq.flash = jest.fn().mockReturnValue([]);

            await fincaController.listarFincas(mockReq, mockRes);
            
            expect(mockReq.flash).toHaveBeenCalledWith('error', 'Error al cargar las fincas');
            expect(mockRes.redirect).toHaveBeenCalledWith('/');
        });
    });

    describe('mostrarFormularioCrearFinca', () => {
        it('debería renderizar el formulario de creación de finca si el usuario está autenticado', async () => {
            const mockDepartamentos = [{ nom_dep: 'Cundinamarca' }];
            fincaDAO.getDepartamentos.mockResolvedValue(mockDepartamentos);
            mockReq.flash = jest.fn().mockReturnValue([]);

            await fincaController.mostrarFormularioCrearFinca(mockReq, mockRes);

            expect(fincaDAO.getDepartamentos).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('fincas/crear', {
                titulo: 'Crear Nueva Finca | Toastem',
                departamentos: mockDepartamentos,
                nombre: '',
                ubicacion: '',
                selectedDepartamento: '',
                selectedMunicipio: '',
                selectedMunicipioVereda: '',
                mensaje: [],
                error: []
            });
        });

        it('debería repoblar el formulario con datos de flash si existen', async () => {
            const mockDepartamentos = [{ nom_dep: 'Antioquia' }];
            fincaDAO.getDepartamentos.mockResolvedValue(mockDepartamentos);
            
            const flashValues = {
                nombre: ['Finca Flash'],
                ubicacion: ['Ubicacion Flash'],
                selectedDepartamento: ['Antioquia'],
                selectedMunicipio: ['Medellín'],
                selectedMunicipioVereda: ['123'],
                mensaje: ['Mensaje Flash'],
                error: ['Error Flash']
            };
            mockReq.flash = jest.fn(key => flashValues[key] || []);


            await fincaController.mostrarFormularioCrearFinca(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('fincas/crear', {
                titulo: 'Crear Nueva Finca | Toastem',
                departamentos: mockDepartamentos,
                nombre: 'Finca Flash',
                ubicacion: 'Ubicacion Flash',
                selectedDepartamento: 'Antioquia',
                selectedMunicipio: 'Medellín',
                selectedMunicipioVereda: '123',
                mensaje: ['Mensaje Flash'],
                error: ['Error Flash']
            });
        });

        it('debería redirigir al login si el usuario no está autenticado', async () => {
            mockReq.session.usuario = null;

            await fincaController.mostrarFormularioCrearFinca(mockReq, mockRes);

            expect(mockReq.flash).toHaveBeenCalledWith('error', 'Debes iniciar sesión para crear una finca.');
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
            expect(mockRes.render).not.toHaveBeenCalled();
        });

        it('debería manejar errores al cargar departamentos y redirigir a gestionar fincas', async () => {
            fincaDAO.getDepartamentos.mockRejectedValue(new Error('Error de DB'));
            mockReq.flash = jest.fn().mockReturnValue([]);

            await fincaController.mostrarFormularioCrearFinca(mockReq, mockRes);
            
            expect(mockReq.flash).toHaveBeenCalledWith('error', 'Error al cargar el formulario para crear fincas.');
            expect(mockRes.redirect).toHaveBeenCalledWith('/fincas/gestionar');
        });
    });

    describe('crearFinca', () => {
        beforeEach(() => {
            mockReq.body = {
                nombre: 'Finca Nueva',
                ubicacion: 'Vereda El Jardín',
                departamento: 'Antioquia',
                id_municipio_vereda: '123'
            };
            validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
            fincaDAO.createFinca.mockResolvedValue(1);
            Finca.mockImplementation((id, idUsuario, nombre, ubicacion, id_municipio_vereda) => {
                return { idUsuario, nombre, ubicacion, id_municipio_vereda };
            });
        });

        it('debería crear una finca y redirigir si la validación es exitosa y el usuario está autenticado', async () => {
            await fincaController.crearFinca(mockReq, mockRes);

            expect(validationResult).toHaveBeenCalledWith(mockReq);
            expect(capitalizarPalabras).toHaveBeenCalledWith('Finca Nueva');
            expect(capitalizarPalabras).toHaveBeenCalledWith('Vereda El Jardín');
            expect(Finca).toHaveBeenCalledWith(
                null,
                mockReq.session.usuario.id,
                'Finca Nueva',
                'Vereda El Jardín',
                123 
            );
            expect(fincaDAO.createFinca).toHaveBeenCalledWith(expect.objectContaining({
                nombre: 'Finca Nueva',
                id_municipio_vereda: 123
            }));
            expect(mockReq.flash).toHaveBeenCalledWith('mensaje', 'Finca creada exitosamente.');
            expect(mockRes.redirect).toHaveBeenCalledWith('/fincas/gestionar');
        });

        it('debería redirigir a /fincas/crear con errores si la validación falla', async () => {
            const mockErrors = [{ msg: 'Error de nombre' }, { msg: 'Error de ubicación' }];
            validationResult.mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

            await fincaController.crearFinca(mockReq, mockRes);

            expect(mockReq.flash).toHaveBeenCalledWith('error', ['Error de nombre', 'Error de ubicación']);
            expect(mockReq.flash).toHaveBeenCalledWith('nombre', mockReq.body.nombre);
            expect(mockReq.flash).toHaveBeenCalledWith('ubicacion', mockReq.body.ubicacion);
            expect(mockReq.flash).toHaveBeenCalledWith('selectedDepartamento', mockReq.body.departamento);
            expect(mockReq.flash).toHaveBeenCalledWith('selectedMunicipioVereda', mockReq.body.id_municipio_vereda);
            expect(mockRes.redirect).toHaveBeenCalledWith('/fincas/crear');
            expect(fincaDAO.createFinca).not.toHaveBeenCalled();
        });

        it('debería redirigir al login si el usuario no está autenticado', async () => {
            mockReq.session.usuario = null;

            await fincaController.crearFinca(mockReq, mockRes);

            expect(mockReq.flash).toHaveBeenCalledWith('error', 'No autorizado.');
            expect(mockRes.redirect).toHaveBeenCalledWith('/auth/login');
            expect(fincaDAO.createFinca).not.toHaveBeenCalled();
        });
        
        it('debería manejar errores durante la creación de la finca y redirigir a /fincas/crear con error', async () => {
            fincaDAO.createFinca.mockRejectedValue(new Error('Error de DB al crear'));

            await fincaController.crearFinca(mockReq, mockRes);

            expect(mockReq.flash).toHaveBeenCalledWith('error', 'Error interno al crear la finca.');
            expect(mockReq.flash).toHaveBeenCalledWith('nombre', mockReq.body.nombre);
            expect(mockRes.redirect).toHaveBeenCalledWith('/fincas/crear');
        });
         
        it('debería manejar una ubicación vacía correctamente', async () => {
            mockReq.body.ubicacion = '';
    
            await fincaController.crearFinca(mockReq, mockRes);
    
            expect(Finca).toHaveBeenCalledWith(
                null,
                mockReq.session.usuario.id,
                'Finca Nueva',
                '', 
                123
            );
            expect(fincaDAO.createFinca).toHaveBeenCalledWith(expect.objectContaining({
                ubicacion: '' 
            }));
            expect(mockReq.flash).toHaveBeenCalledWith('mensaje', 'Finca creada exitosamente.');
            expect(mockRes.redirect).toHaveBeenCalledWith('/fincas/gestionar');
        });
    });

    describe('actualizarFinca', () => {
        beforeEach(() => {
            mockReq.params = { id: '1' }; 
            mockReq.body = {
                nombre: 'Finca Actualizada',
                ubicacion: 'Nueva Vereda',
                id_municipio_vereda: '456'
            };
            validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
            fincaDAO.updateFinca.mockResolvedValue({ affectedRows: 1 }); 
            Finca.mockImplementation((id, idUsuario, nombre, ubicacion, id_municipio_vereda) => {
                return { id, idUsuario, nombre, ubicacion, id_municipio_vereda };
            });
        });

        it('debería actualizar una finca y devolver JSON de éxito si la validación es correcta', async () => {
            await fincaController.actualizarFinca(mockReq, mockRes);

            expect(validationResult).toHaveBeenCalledWith(mockReq);
            expect(capitalizarPalabras).toHaveBeenCalledWith('Finca Actualizada');
            expect(capitalizarPalabras).toHaveBeenCalledWith('Nueva Vereda');
            expect(Finca).toHaveBeenCalledWith(
                1, 
                mockReq.session.usuario.id,
                'Finca Actualizada',
                'Nueva Vereda',
                456 
            );
            expect(fincaDAO.updateFinca).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                nombre: 'Finca Actualizada'
            }));
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Finca actualizada exitosamente' });
        });

        it('debería devolver un error 400 con detalles si la validación falla', async () => {
            const mockErrors = [{ msg: 'Error de nombre en actualización' }];
            validationResult.mockReturnValue({ isEmpty: () => false, array: () => mockErrors });

            await fincaController.actualizarFinca(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ errors: mockErrors });
            expect(fincaDAO.updateFinca).not.toHaveBeenCalled();
        });

        it('debería devolver un error 400 si el ID de la finca no es válido', async () => {
            mockReq.params.id = 'abc'; 

            await fincaController.actualizarFinca(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'ID de finca inválido' });
            expect(fincaDAO.updateFinca).not.toHaveBeenCalled();
        });
        
        it('debería devolver un error 400 si el ID de la finca falta', async () => {
            mockReq.params.id = undefined;

            await fincaController.actualizarFinca(mockReq, mockRes);
            
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'ID de finca inválido' });
            expect(fincaDAO.updateFinca).not.toHaveBeenCalled();
        });

        it('debería manejar errores durante la actualización de la finca y devolver un error 500', async () => {
            fincaDAO.updateFinca.mockRejectedValue(new Error('Error de DB al actualizar'));

            await fincaController.actualizarFinca(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Error interno al actualizar la finca' });
        });
    });

    describe('eliminarFinca', () => {
        beforeEach(() => {
            mockReq.params = { id: '1' };
            fincaDAO.deleteFinca.mockResolvedValue({ affectedRows: 1 });
        });

        it('debería eliminar una finca y devolver JSON de éxito', async () => {
            await fincaController.eliminarFinca(mockReq, mockRes);

            expect(fincaDAO.deleteFinca).toHaveBeenCalledWith(1, mockReq.session.usuario.id);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true, message: 'Finca eliminada exitosamente' });
        });

        it('debería devolver un error 400 si el ID de la finca no es válido (no numérico)', async () => {
            mockReq.params.id = 'abc';

            await fincaController.eliminarFinca(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'ID de finca inválido' });
            expect(fincaDAO.deleteFinca).not.toHaveBeenCalled();
        });
        
        it('debería devolver un error 400 si el ID de la finca falta', async () => {
            mockReq.params.id = undefined;

            await fincaController.eliminarFinca(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'ID de finca inválido' });
            expect(fincaDAO.deleteFinca).not.toHaveBeenCalled();
        });

        it('debería manejar errores durante la eliminación de la finca y devolver un error 400 con el mensaje del error', async () => {
            const errorMessage = 'Finca no encontrada o error específico';
            fincaDAO.deleteFinca.mockRejectedValue(new Error(errorMessage));

            await fincaController.eliminarFinca(mockReq, mockRes);

            expect(fincaDAO.deleteFinca).toHaveBeenCalledWith(1, mockReq.session.usuario.id);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: errorMessage });
        });
    });

    describe('getMunicipiosAPI', () => {
        beforeEach(() => {
            mockReq.params = { departamento: 'Antioquia' };
            fincaDAO.getMunicipiosPorDepartamento.mockResolvedValue([{ nomb_mpio: 'Medellín' }, { nomb_mpio: 'Envigado' }]);
        });

        it('debería devolver una lista de municipios en JSON si el departamento es proporcionado', async () => {
            await fincaController.getMunicipiosAPI(mockReq, mockRes);

            expect(fincaDAO.getMunicipiosPorDepartamento).toHaveBeenCalledWith('Antioquia');
            expect(mockRes.json).toHaveBeenCalledWith([{ nomb_mpio: 'Medellín' }, { nomb_mpio: 'Envigado' }]);
        });

        it('debería devolver un error 400 si el nombre del departamento no se proporciona', async () => {
            mockReq.params.departamento = undefined;

            await fincaController.getMunicipiosAPI(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Nombre de departamento es requerido' });
            expect(fincaDAO.getMunicipiosPorDepartamento).not.toHaveBeenCalled();
        });

        it('debería devolver un error 500 si ocurre un error en el DAO', async () => {
            fincaDAO.getMunicipiosPorDepartamento.mockRejectedValue(new Error('Error de DB al obtener municipios'));

            await fincaController.getMunicipiosAPI(mockReq, mockRes);

            expect(fincaDAO.getMunicipiosPorDepartamento).toHaveBeenCalledWith('Antioquia');
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error interno al obtener municipios' });
        });
    });

    describe('getVeredasAPI', () => {
        beforeEach(() => {
            mockReq.params = { departamento: 'Antioquia', municipio: 'Medellín' };
            fincaDAO.getVeredasPorMunicipio.mockResolvedValue([{ id: 1, nombre_ver: 'El Poblado' }, { id: 2, nombre_ver: 'Laureles' }]);
        });

        it('debería devolver una lista de veredas en JSON si departamento y municipio son proporcionados', async () => {
            await fincaController.getVeredasAPI(mockReq, mockRes);

            expect(fincaDAO.getVeredasPorMunicipio).toHaveBeenCalledWith('Antioquia', 'Medellín');
            expect(mockRes.json).toHaveBeenCalledWith([{ id: 1, nombre_ver: 'El Poblado' }, { id: 2, nombre_ver: 'Laureles' }]);
        });

        it('debería devolver un error 400 si el departamento no se proporciona', async () => {
            mockReq.params.departamento = undefined;

            await fincaController.getVeredasAPI(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Departamento y municipio son requeridos' });
            expect(fincaDAO.getVeredasPorMunicipio).not.toHaveBeenCalled();
        });

        it('debería devolver un error 400 si el municipio no se proporciona', async () => {
            mockReq.params.municipio = undefined;

            await fincaController.getVeredasAPI(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Departamento y municipio son requeridos' });
            expect(fincaDAO.getVeredasPorMunicipio).not.toHaveBeenCalled();
        });
        
        it('debería devolver un error 400 si ni el departamento ni el municipio se proporcionan', async () => {
            mockReq.params.departamento = undefined;
            mockReq.params.municipio = undefined;

            await fincaController.getVeredasAPI(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Departamento y municipio son requeridos' });
            expect(fincaDAO.getVeredasPorMunicipio).not.toHaveBeenCalled();
        });

        it('debería devolver un error 500 si ocurre un error en el DAO', async () => {
            fincaDAO.getVeredasPorMunicipio.mockRejectedValue(new Error('Error de DB al obtener veredas'));

            await fincaController.getVeredasAPI(mockReq, mockRes);

            expect(fincaDAO.getVeredasPorMunicipio).toHaveBeenCalledWith('Antioquia', 'Medellín');
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Error interno al obtener veredas' });
        });
    });

}); 