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

      // Actualizar los datos del dashboard antes de mostrarlos
      await dashboardDAO.actualizarDashboardCompleto(usuario.id);

      // Objeto para almacenar datos del dashboard
      let dashboardData = {
        titulo: 'Dashboard | Toastem',
        usuario,
        hideNavbar: false,
        error: null,
        fincasUsuario: [],
        lotesStats: { totalLotes: 0, lotesActivos: 0, lotesFinalizados: 0, lotesCancelados: 0, ultimosLotes: [] },
        procesosStats: { procesosPorMes: [], estadoProcesos: [] },
        lotesTerminadosPorTipo: { pergamino: {}, tostadoGrano: {}, tostadoMolido: {} },
        lotesEnProceso: { despulpado: [], lavado: [], secado: [], trilla: [], tueste: [], molienda: [], conteos: {} },
        resumenVentas: { pasilla: {}, pergamino: {}, tostadoGrano: {}, tostadoMolido: {} },
        procesosDataForChart: '[]',
        estadoProcesosDataForChart: '[]',
        tipoProcesoDataForChart: '[]'
      };

      try {
        // Obtener todas las fincas del usuario
        dashboardData.fincasUsuario = await fincaDAO.getFincasByUserId(usuario.id);
      } catch (error) {
        console.error('Error al cargar fincas del usuario:', error);
      }
      
      try {
        // Obtener estadísticas usando el DAO
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
        // Obtener datos específicos para el dashboard actualizado
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
        // Generar datos para gráficos
        const procesosDataForChart = this.prepararDatosProcesosChart(dashboardData.procesosStats.procesosPorMes || []);
        const estadoProcesosDataForChart = this.prepararDatosEstadoProcesosChart(dashboardData.procesosStats.estadoProcesos || []);
        const tipoProcesoDataForChart = this.prepararDatosTipoProcesoChart(dashboardData.lotesEnProceso.conteos || {});

        dashboardData.procesosDataForChart = JSON.stringify(procesosDataForChart);
        dashboardData.estadoProcesosDataForChart = JSON.stringify(estadoProcesosDataForChart);
        dashboardData.tipoProcesoDataForChart = JSON.stringify(tipoProcesoDataForChart);
      } catch (error) {
        console.error('Error al preparar datos para gráficos:', error);
      }

      res.render('dashboard/index', dashboardData);
    } catch (error) {
      console.error('Error al cargar el dashboard:', error);
      req.flash('error', 'Error al cargar el dashboard: ' + error.message);
      
      // En lugar de redirigir, renderizamos el dashboard con un mensaje de error
      res.render('dashboard/index', {
        titulo: 'Dashboard | Toastem',
        usuario: req.session.usuario,
        error: 'Error al cargar el dashboard: ' + error.message,
        hideNavbar: false,
        fincasUsuario: [],
        lotesStats: { totalLotes: 0, lotesActivos: 0, lotesFinalizados: 0, lotesCancelados: 0, ultimosLotes: [] },
        procesosStats: { procesosPorMes: [], estadoProcesos: [] },
        lotesTerminadosPorTipo: { pergamino: {}, tostadoGrano: {}, tostadoMolido: {} },
        lotesEnProceso: { despulpado: [], lavado: [], secado: [], trilla: [], tueste: [], molienda: [], conteos: {} },
        resumenVentas: { pasilla: {}, pergamino: {}, tostadoGrano: {}, tostadoMolido: {} },
        procesosDataForChart: '[]',
        estadoProcesosDataForChart: '[]',
        tipoProcesoDataForChart: '[]'
      });
    }
  }

  prepararDatosProcesosChart(procesosPorMes) {
    // Convertir meses a formato legible
    return procesosPorMes.map(item => {
      const [year, month] = item.mes.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return {
        mes: `${monthNames[parseInt(month) - 1]} ${year}`,
        cantidad: item.cantidad
      };
    });
  }

  prepararDatosEstadoProcesosChart(estadoProcesos) {
    // Devolver datos formatados para el gráfico de estado
    return estadoProcesos;
  }

  prepararDatosTipoProcesoChart(conteos) {
    return [
      { 
        proceso: 'Despulpado', 
        cantidad: conteos.despulpado_count || 0 
      },
      { 
        proceso: 'Lavado', 
        cantidad: conteos.lavado_count || 0 
      },
      { 
        proceso: 'Secado', 
        cantidad: conteos.secado_count || 0 
      },
      { 
        proceso: 'Trilla', 
        cantidad: conteos.trilla_count || 0 
      },
      { 
        proceso: 'Tueste', 
        cantidad: conteos.tueste_count || 0 
      },
      { 
        proceso: 'Molienda', 
        cantidad: conteos.molienda_count || 0 
      }
    ];
  }

  async redirigirAFincas(req, res) {
    res.redirect('/fincas/gestionar');
  }
}

module.exports = new DashboardController();
