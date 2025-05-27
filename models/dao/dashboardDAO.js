const db = require('../../config/database');

class DashboardDAO {
  /**
   * Obtiene estadísticas de lotes para un usuario específico
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas de lotes
   */
  async obtenerEstadisticasLotes(userId) {
    try {
      // Usamos la caché del dashboard en lugar de múltiples consultas complejas
      const [stats] = await db.query(`
        SELECT * FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato IN ('lotes_total', 'lotes_activos', 'lotes_finalizados', 'lotes_cancelados')
      `, [userId]);

      if (!stats || stats.length === 0) {
        // Si no hay datos en caché, forzamos la actualización
        await db.query('CALL actualizar_estadisticas_lotes(?)', [userId]);
        
        // Y volvemos a consultar
        const [updatedStats] = await db.query(`
          SELECT * FROM dashboard_cache 
          WHERE id_usuario = ? 
          AND tipo_dato IN ('lotes_total', 'lotes_activos', 'lotes_finalizados', 'lotes_cancelados')
        `, [userId]);
        
        stats = updatedStats;
      }

      // Convertir el resultado a un objeto más simple
      const statsObj = {
        totalLotes: 0,
        lotesActivos: 0, 
        lotesFinalizados: 0,
        lotesCancelados: 0
      };
      
      stats.forEach(item => {
        if (item.tipo_dato === 'lotes_total') statsObj.totalLotes = Number(item.valor_numerico);
        if (item.tipo_dato === 'lotes_activos') statsObj.lotesActivos = Number(item.valor_numerico);
        if (item.tipo_dato === 'lotes_finalizados') statsObj.lotesFinalizados = Number(item.valor_numerico);
        if (item.tipo_dato === 'lotes_cancelados') statsObj.lotesCancelados = Number(item.valor_numerico);
      });

      // Obtener los últimos 5 lotes
      const [ultimosLotes] = await db.query(`
        SELECT l.*, ep.nombre as estado_nombre, f.nombre as finca_nombre
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
        WHERE f.id_usuario = ?
        ORDER BY l.fecha_registro DESC
        LIMIT 5
      `, [userId]);

      statsObj.ultimosLotes = ultimosLotes;

      return statsObj;
    } catch (error) {
      console.error('Error al obtener estadísticas de lotes:', error);
      // Si hay error, devolvemos un objeto vacío con la estructura esperada
      return {
        totalLotes: 0,
        lotesActivos: 0,
        lotesFinalizados: 0,
        lotesCancelados: 0,
        ultimosLotes: []
      };
    }
  }

  /**
   * Obtiene estadísticas de procesos para un usuario específico
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas de procesos
   */
  async obtenerEstadisticasProcesos(userId) {
    try {
      // Obtener procesos por mes de la caché
      const [procesosPorMes] = await db.query(`
        SELECT clave as mes, valor_numerico as cantidad
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'lotes_por_mes'
        ORDER BY clave ASC
        LIMIT 12
      `, [userId]);

      if (!procesosPorMes || procesosPorMes.length === 0) {
        // Si no hay datos en caché, forzamos la actualización
        await db.query('CALL actualizar_lotes_por_mes(?)', [userId]);
        
        // Y volvemos a consultar
        const [updatedProcesosPorMes] = await db.query(`
          SELECT clave as mes, valor_numerico as cantidad
          FROM dashboard_cache 
          WHERE id_usuario = ? 
          AND tipo_dato = 'lotes_por_mes'
          ORDER BY clave ASC
          LIMIT 12
        `, [userId]);
        
        procesosPorMes = updatedProcesosPorMes;
      }

      // Obtener estado de procesos de la caché
      const [estadoProcesos] = await db.query(`
        SELECT valor_texto as estado, valor_numerico as cantidad
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'lotes_por_estado'
        ORDER BY valor_numerico DESC
      `, [userId]);

      if (!estadoProcesos || estadoProcesos.length === 0) {
        // Si no hay datos en caché, forzamos la actualización
        await db.query('CALL actualizar_lotes_por_estado(?)', [userId]);
        
        // Y volvemos a consultar
        const [updatedEstadoProcesos] = await db.query(`
          SELECT valor_texto as estado, valor_numerico as cantidad
          FROM dashboard_cache 
          WHERE id_usuario = ? 
          AND tipo_dato = 'lotes_por_estado'
          ORDER BY valor_numerico DESC
        `, [userId]);
        
        estadoProcesos = updatedEstadoProcesos;
      }

      return {
        procesosPorMes,
        estadoProcesos
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de procesos:', error);
      return {
        procesosPorMes: [],
        estadoProcesos: []
      };
    }
  }

  /**
   * Obtiene los lotes terminados clasificados por tipo de producto final
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Lotes terminados por tipo
   */
  async obtenerLotesTerminadosPorTipo(userId) {
    try {
      // Obtener datos de la caché
      const [tipoLotes] = await db.query(`
        SELECT clave as tipo, json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'lotes_terminados_tipo'
      `, [userId]);

      if (!tipoLotes || tipoLotes.length === 0) {
        // Si no hay datos en caché, forzamos la actualización
        await db.query('CALL actualizar_lotes_terminados_tipo(?)', [userId]);
        
        // Y volvemos a consultar
        const [updatedTipoLotes] = await db.query(`
          SELECT clave as tipo, json_data
          FROM dashboard_cache 
          WHERE id_usuario = ? 
          AND tipo_dato = 'lotes_terminados_tipo'
        `, [userId]);
        
        tipoLotes = updatedTipoLotes;
      }

      // Convertir a objeto
      const result = {
        pergamino: { cantidad: 0, total_kg: 0 },
        tostadoGrano: { cantidad: 0, total_kg: 0 },
        tostadoMolido: { cantidad: 0, total_kg: 0 }
      };

      tipoLotes.forEach(item => {
        const data = JSON.parse(item.json_data);
        
        if (item.tipo === 'Pergamino') {
          result.pergamino = { 
            cantidad: data.cantidad, 
            total_kg: data.total_kg 
          };
        } 
        else if (item.tipo === 'TostadoGrano') {
          result.tostadoGrano = { 
            cantidad: data.cantidad, 
            total_kg: data.total_kg 
          };
        }
        else if (item.tipo === 'TostadoMolido') {
          result.tostadoMolido = { 
            cantidad: data.cantidad, 
            total_kg: data.total_kg 
          };
        }
      });

      return result;
    } catch (error) {
      console.error('Error al obtener lotes terminados por tipo:', error);
      return {
        pergamino: { cantidad: 0, total_kg: 0 },
        tostadoGrano: { cantidad: 0, total_kg: 0 },
        tostadoMolido: { cantidad: 0, total_kg: 0 }
      };
    }
  }

  /**
   * Obtiene los lotes en proceso agrupados por tipo de proceso
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Lotes en proceso por tipo
   */
  async obtenerLotesEnProceso(userId) {
    try {
      // Obtener conteos de procesos de la caché
      const [conteos] = await db.query(`
        SELECT json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'conteos_procesos'
        LIMIT 1
      `, [userId]);

      if (!conteos || conteos.length === 0) {
        // Si no hay datos en caché, forzamos la actualización
        await db.query('CALL actualizar_conteos_procesos(?)', [userId]);
        
        // Y volvemos a consultar
        const [updatedConteos] = await db.query(`
          SELECT json_data
          FROM dashboard_cache 
          WHERE id_usuario = ? 
          AND tipo_dato = 'conteos_procesos'
          LIMIT 1
        `, [userId]);
        
        conteos = updatedConteos;
      }

      // Obtener lotes en proceso de despulpado
      const [despulpado] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, d.fecha_remojo as fecha_inicio, d.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN despulpado d ON l.id = d.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND d.id_estado_proceso = 2
        ORDER BY d.fecha_remojo DESC
        LIMIT 5
      `, [userId]);

      // Obtener lotes en proceso de lavado
      const [lavado] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, lav.fecha_inicio_fermentacion as fecha_inicio, lav.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN fermentacion_lavado lav ON l.id = lav.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND lav.id_estado_proceso = 2
        ORDER BY lav.fecha_inicio_fermentacion DESC
        LIMIT 5
      `, [userId]);

      // Obtener lotes en proceso de secado
      const [secado] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, s.fecha_inicio, s.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN secado s ON l.id = s.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND s.id_estado_proceso = 2
        ORDER BY s.fecha_inicio DESC
        LIMIT 5
      `, [userId]);

      // Obtener lotes en proceso de trilla
      const [trilla] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, tr.fecha_trilla as fecha_inicio, tr.peso_pergamino_inicial as peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN trilla tr ON l.id = tr.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND tr.id_estado_proceso = 2
        ORDER BY tr.fecha_trilla DESC
        LIMIT 5
      `, [userId]);

      // Obtener lotes en proceso de tueste
      const [tueste] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, t.fecha_tueste as fecha_inicio, t.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN tueste t ON l.id = t.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND t.id_estado_proceso = 2
        ORDER BY t.fecha_tueste DESC
        LIMIT 5
      `, [userId]);

      // Obtener lotes en proceso de molienda
      const [molienda] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, m.fecha_molienda as fecha_inicio, m.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN tueste t ON l.id = t.id_lote
        JOIN molienda m ON t.id = m.id_tueste
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND m.id_estado_proceso = 2
        ORDER BY m.fecha_molienda DESC
        LIMIT 5
      `, [userId]);

      // Convertir los conteos de JSON a objeto
      const conteosObj = conteos.length > 0 ? JSON.parse(conteos[0].json_data) : {
        despulpado_count: 0,
        lavado_count: 0,
        secado_count: 0,
        trilla_count: 0,
        tueste_count: 0,
        molienda_count: 0
      };

      return {
        despulpado: despulpado || [],
        lavado: lavado || [],
        secado: secado || [],
        trilla: trilla || [],
        tueste: tueste || [],
        molienda: molienda || [],
        conteos: conteosObj
      };
    } catch (error) {
      console.error('Error al obtener lotes en proceso:', error);
      throw error;
    }
  }

  /**
   * Obtiene resumen de ventas por tipo de producto
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Ventas por tipo de producto
   */
  async obtenerResumenVentas(userId) {
    try {
      // Simular datos de ventas (completar cuando exista la tabla de ventas)
      return {
        pasilla: { kg: 0, total: 0 },
        pergamino: { kg: 0, total: 0 },
        tostadoGrano: { kg: 0, total: 0 },
        tostadoMolido: { kg: 0, total: 0 }
      };
    } catch (error) {
      console.error('Error al obtener resumen de ventas:', error);
      return {
        pasilla: { kg: 0, total: 0 },
        pergamino: { kg: 0, total: 0 },
        tostadoGrano: { kg: 0, total: 0 },
        tostadoMolido: { kg: 0, total: 0 }
      };
    }
  }
  
  /**
   * Actualiza todos los datos del dashboard para un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} - Éxito de la operación
   */
  async actualizarDashboardCompleto(userId) {
    try {
      await db.query('CALL actualizar_dashboard_completo(?)', [userId]);
      return true;
    } catch (error) {
      console.error('Error al actualizar el dashboard completo:', error);
      return false;
    }
  }
}

module.exports = new DashboardDAO(); 