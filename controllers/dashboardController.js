const fincaDAO = require('../models/dao/fincaDAO');
const loteDAO = require('../models/dao/loteDAO');
const procesosDAO = require('../models/dao/procesosDAO');
const dashboardDAO = require('../models/dao/dashboardDAO');

class DashboardController {
  async index(req, res) {
    try {
      const usuario = req.session.usuario;

      if (!usuario) {
        throw new Error('Usuario no autenticado');
      }

      // Objeto para almacenar datos del dashboard con valores por defecto
      let dashboardData = {
        titulo: 'Dashboard | Toastem',
        usuario,
        hideNavbar: false,
        error: null,
        fincasUsuario: [],
        lotesStats: { 
          totalLotes: 0, 
          lotesActivos: 0, 
          lotesFinalizados: 0, 
          lotesCancelados: 0, 
          ultimosLotes: [] 
        },
        procesosStats: { 
          procesosPorMes: [], 
          estadoProcesos: [] 
        },
        lotesTerminadosPorTipo: { 
          pergamino: { cantidad: 0, total_kg: 0 }, 
          tostadoGrano: { cantidad: 0, total_kg: 0 }, 
          tostadoMolido: { cantidad: 0, total_kg: 0 } 
        },
        lotesEnProceso: { 
          despulpado: [], 
          lavado: [], 
          secado: [], 
          clasificacion: [],
          trilla: [], 
          tueste: [], 
          molienda: [],
          empacado: [],
          conteos: {
            despulpado_count: 0,
            fermentacion_lavado_count: 0,
            secado_count: 0,
            clasificacion_count: 0,
            trilla_count: 0,
            tueste_count: 0,
            molienda_count: 0,
            empacado_count: 0
          }
        },
        resumenVentas: { 
          pasilla: { kg: 0, total: 0 }, 
          pergamino: { kg: 0, total: 0 }, 
          tostadoGrano: { kg: 0, total: 0 }, 
          tostadoMolido: { kg: 0, total: 0 } 
        },
        productosEmpacados: {
          grano: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
          molido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
          pasillaMolido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 }
        },
        procesosDataForChart: '[]',
        estadoProcesosDataForChart: '[]',
        tipoProcesoDataForChart: '[]'
      };

      // Cargar datos de manera segura
      try {
        dashboardData.fincasUsuario = await fincaDAO.getFincasByUserId(usuario.id) || [];
      } catch (error) {
        console.error('Error al cargar fincas del usuario:', error);
      }
      
      try {
        dashboardData.lotesStats = await dashboardDAO.obtenerEstadisticasLotes(usuario.id);
      } catch (error) {
        console.error('Error al cargar estadísticas de lotes:', error);
      }

      try {
        dashboardData.procesosStats = await dashboardDAO.obtenerEstadisticasProcesos(usuario.id);
      } catch (error) {
        console.error('Error al cargar estadísticas de procesos:', error);
      }

      try {
        dashboardData.lotesTerminadosPorTipo = await dashboardDAO.obtenerLotesTerminadosPorTipo(usuario.id);
      } catch (error) {
        console.error('Error al cargar lotes terminados por tipo:', error);
      }

      try {
        dashboardData.lotesEnProceso = await dashboardDAO.obtenerLotesEnProceso(usuario.id);
      } catch (error) {
        console.error('Error al cargar lotes en proceso:', error);
      }

      try {
        dashboardData.resumenVentas = await dashboardDAO.obtenerResumenVentas(usuario.id);
      } catch (error) {
        console.error('Error al cargar resumen de ventas:', error);
      }

      try {
        dashboardData.productosEmpacados = await dashboardDAO.obtenerEmpacadoDisponible(usuario.id);
      } catch (error) {
        console.error('Error al cargar productos empacados:', error);
      }

      // Formatear datos para gráficos
      try {
        // Datos para gráfico de procesos por mes
        if (dashboardData.procesosStats.procesosPorMes && dashboardData.procesosStats.procesosPorMes.length > 0) {
          const procesosPorMesData = dashboardData.procesosStats.procesosPorMes.map(item => ({
            mes: item.mes,
            cantidad: Number(item.cantidad) || 0
          }));
          dashboardData.procesosDataForChart = JSON.stringify(procesosPorMesData);
        }

        // Datos para gráfico de estado de procesos
        if (dashboardData.procesosStats.estadoProcesos && dashboardData.procesosStats.estadoProcesos.length > 0) {
          const estadoProcesosData = dashboardData.procesosStats.estadoProcesos.map(item => ({
            estado: item.estado,
            cantidad: Number(item.cantidad) || 0
          }));
          dashboardData.estadoProcesosDataForChart = JSON.stringify(estadoProcesosData);
        }

        // Datos para gráfico de tipo de proceso
        if (dashboardData.lotesEnProceso.conteos) {
          const tipoProcesoData = [
            { tipo: 'Despulpado', cantidad: dashboardData.lotesEnProceso.conteos.despulpado_count || 0 },
            { tipo: 'Lavado', cantidad: dashboardData.lotesEnProceso.conteos.fermentacion_lavado_count || 0 },
            { tipo: 'Secado', cantidad: dashboardData.lotesEnProceso.conteos.secado_count || 0 },
            { tipo: 'Clasificación', cantidad: dashboardData.lotesEnProceso.conteos.clasificacion_count || 0 },
            { tipo: 'Trilla', cantidad: dashboardData.lotesEnProceso.conteos.trilla_count || 0 },
            { tipo: 'Tueste', cantidad: dashboardData.lotesEnProceso.conteos.tueste_count || 0 },
            { tipo: 'Molienda', cantidad: dashboardData.lotesEnProceso.conteos.molienda_count || 0 },
            { tipo: 'Empacado', cantidad: dashboardData.lotesEnProceso.conteos.empacado_count || 0 }
          ];
          dashboardData.tipoProcesoDataForChart = JSON.stringify(tipoProcesoData);
        }
      } catch (error) {
        console.error('Error al formatear datos para gráficos:', error);
      }

      // Renderizar la vista
      res.render('dashboard/index', dashboardData);

    } catch (error) {
      console.error('Error en dashboardController.index:', error);
      
      // En caso de error, renderizar con datos por defecto
      const errorData = {
        titulo: 'Dashboard | Toastem',
        usuario: req.session.usuario || { nombre: 'Usuario' },
        hideNavbar: false,
        error: 'Ocurrió un error al cargar el dashboard. Por favor, intenta de nuevo.',
        fincasUsuario: [],
        lotesStats: { 
          totalLotes: 0, 
          lotesActivos: 0, 
          lotesFinalizados: 0, 
          lotesCancelados: 0, 
          ultimosLotes: [] 
        },
        procesosStats: { 
          procesosPorMes: [], 
          estadoProcesos: [] 
        },
        lotesTerminadosPorTipo: { 
          pergamino: { cantidad: 0, total_kg: 0 }, 
          tostadoGrano: { cantidad: 0, total_kg: 0 }, 
          tostadoMolido: { cantidad: 0, total_kg: 0 } 
        },
        lotesEnProceso: { 
          despulpado: [], 
          lavado: [], 
          secado: [], 
          clasificacion: [],
          trilla: [], 
          tueste: [], 
          molienda: [], 
          empacado: [],
          conteos: {
            despulpado_count: 0,
            fermentacion_lavado_count: 0,
            secado_count: 0,
            clasificacion_count: 0,
            trilla_count: 0,
            tueste_count: 0,
            molienda_count: 0,
            empacado_count: 0
          }
        },
        resumenVentas: { 
          pasilla: { kg: 0, total: 0 }, 
          pergamino: { kg: 0, total: 0 }, 
          tostadoGrano: { kg: 0, total: 0 }, 
          tostadoMolido: { kg: 0, total: 0 } 
        },
        productosEmpacados: {
          grano: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
          molido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
          pasillaMolido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 }
        },
        procesosDataForChart: '[]',
        estadoProcesosDataForChart: '[]',
        tipoProcesoDataForChart: '[]'
      };

      res.render('dashboard/index', errorData);
    }
  }

  async redirigirAFincas(req, res) {
    res.redirect('/fincas/gestionar');
  }
}

module.exports = new DashboardController();
