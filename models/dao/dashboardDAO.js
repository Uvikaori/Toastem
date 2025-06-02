const db = require('../../config/database');

class DashboardDAO {
  /**
   * Obtiene estadísticas de lotes para un usuario específico
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Estadísticas de lotes
   */
  async obtenerEstadisticasLotes(userId) {
    try {
      // Primero actualizamos la caché
      await this.actualizarDashboardCompleto(userId);
      
      // Obtenemos las estadísticas de la caché
      const [stats] = await db.query(`
        SELECT * FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato IN ('lotes_total', 'lotes_activos', 'lotes_finalizados', 'lotes_cancelados')
      `, [userId]);

      // Convertir el resultado a un objeto más simple
      const statsObj = {
        totalLotes: 0,
        lotesActivos: 0, 
        lotesFinalizados: 0,
        lotesCancelados: 0
      };
      
      if (stats && stats.length > 0) {
        stats.forEach(item => {
          const valor = Number(item.valor_numerico) || 0;
          if (item.tipo_dato === 'lotes_total') statsObj.totalLotes = valor;
          if (item.tipo_dato === 'lotes_activos') statsObj.lotesActivos = valor;
          if (item.tipo_dato === 'lotes_finalizados') statsObj.lotesFinalizados = valor;
          if (item.tipo_dato === 'lotes_cancelados') statsObj.lotesCancelados = valor;
        });
      }

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

      statsObj.ultimosLotes = ultimosLotes || [];
      return statsObj;
    } catch (error) {
      console.error('Error al obtener estadísticas de lotes:', error);
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
        ORDER BY clave DESC
        LIMIT 12
      `, [userId]);

      // Obtener estado de procesos de la caché
      const [estadoProcesos] = await db.query(`
        SELECT valor_texto as estado, valor_numerico as cantidad
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'lotes_por_estado'
        ORDER BY valor_numerico DESC
      `, [userId]);

      return {
        procesosPorMes: procesosPorMes || [],
        estadoProcesos: estadoProcesos || []
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
        AND tipo_dato = 'lotes_terminados_tipo_disponible'
      `, [userId]);

      // Convertir a objeto
      const result = {
        pergamino: { cantidad: 0, total_kg: 0 },
        tostadoGrano: { cantidad: 0, total_kg: 0 },
        tostadoMolido: { cantidad: 0, total_kg: 0 }
      };

      if (tipoLotes && tipoLotes.length > 0) {
        tipoLotes.forEach(item => {
          let parsed_data = null;
          
          if (item.json_data) {
            try {
              if (typeof item.json_data === 'object') {
                parsed_data = item.json_data;
              } else if (typeof item.json_data === 'string') {
                parsed_data = JSON.parse(item.json_data);
              }
            } catch (e) {
              console.error('Error al parsear JSON:', e);
            }
          }

          if (parsed_data) {
            const cantidad = Number(parsed_data.cantidad_lotes) || 0;
            const total_kg = Number(parsed_data.total_kg_disponible) || 0;
            
            if (item.tipo === 'Pergamino') {
              result.pergamino = { cantidad, total_kg };
            } else if (item.tipo === 'TostadoGrano') {
              result.tostadoGrano = { cantidad, total_kg };
            } else if (item.tipo === 'TostadoMolido') {
              result.tostadoMolido = { cantidad, total_kg };
            }
          }
        });
      }

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
        AND tipo_dato = 'conteos_procesos_activos'
        LIMIT 1
      `, [userId]);

      // Obtener lotes específicos en proceso para cada tipo
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

      const [clasificacion] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, cla.fecha_clasificacion as fecha_inicio, cla.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN clasificacion cla ON l.id = cla.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND cla.id_estado_proceso = 2
        ORDER BY cla.fecha_clasificacion DESC
        LIMIT 5
      `, [userId]);

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

      const [empacado] = await db.query(`
        SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, e.fecha_empacado as fecha_inicio, e.peso_inicial
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN empacado e ON l.id = e.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 2 
        AND e.id_estado_proceso = 2
        AND e.es_historico = 0
        ORDER BY e.fecha_empacado DESC
        LIMIT 5
      `, [userId]);

      // Convertir los conteos de JSON a objeto
      let conteosObj = {
        despulpado_count: 0,
        fermentacion_lavado_count: 0,
        secado_count: 0,
        clasificacion_count: 0,
        trilla_count: 0,
        tueste_count: 0,
        molienda_count: 0,
        empacado_count: 0
      };

      if (conteos && conteos.length > 0 && conteos[0].json_data) {
        try {
          const raw_json_data = conteos[0].json_data;
          let parsed_conteos_data = null;
          
          if (typeof raw_json_data === 'object') {
            parsed_conteos_data = raw_json_data;
          } else if (typeof raw_json_data === 'string') {
            parsed_conteos_data = JSON.parse(raw_json_data);
          }
          
          if (parsed_conteos_data) {
            conteosObj = { ...conteosObj, ...parsed_conteos_data };
          }
        } catch (e) {
          console.error('Error al parsear conteos:', e);
        }
      }

      return {
        despulpado: despulpado || [],
        lavado: lavado || [],
        secado: secado || [],
        clasificacion: clasificacion || [],
        trilla: trilla || [],
        tueste: tueste || [],
        molienda: molienda || [],
        empacado: empacado || [],
        conteos: conteosObj
      };
    } catch (error) {
      console.error('Error al obtener lotes en proceso:', error);
      return {
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
      };
    }
  }

  /**
   * Obtiene resumen de ventas por tipo de producto
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Ventas por tipo de producto
   */
  async obtenerResumenVentas(userId) {
    try {
      // Obtener datos de la caché
      const [resumen] = await db.query(`
        SELECT json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'resumen_ventas'
        LIMIT 1
      `, [userId]);

      // Valores por defecto
      let resultado = {
        pasilla: { kg: 0, total: 0 },
        pergamino: { kg: 0, total: 0 },
        tostadoGrano: { kg: 0, total: 0 },
        tostadoMolido: { kg: 0, total: 0 }
      };

      // Procesar el JSON si existe
      if (resumen && resumen.length > 0 && resumen[0].json_data) {
        try {
          const raw_json_data = resumen[0].json_data;
          let parsed_data = null;
          
          if (typeof raw_json_data === 'object') {
            parsed_data = raw_json_data;
          } else if (typeof raw_json_data === 'string') {
            parsed_data = JSON.parse(raw_json_data);
          }
          
          if (parsed_data) {
            // Extraer datos de cada tipo de producto
            if (parsed_data.pergamino) {
              resultado.pergamino = {
                kg: Number(parsed_data.pergamino.kg) || 0,
                total: Number(parsed_data.pergamino.total) || 0
              };
            }
            
            if (parsed_data.tostadoGrano) {
              resultado.tostadoGrano = {
                kg: Number(parsed_data.tostadoGrano.kg) || 0,
                total: Number(parsed_data.tostadoGrano.total) || 0
              };
            }
            
            if (parsed_data.tostadoMolido) {
              resultado.tostadoMolido = {
                kg: Number(parsed_data.tostadoMolido.kg) || 0,
                total: Number(parsed_data.tostadoMolido.total) || 0
              };
            }
            
            if (parsed_data.pasillaMolido) {
              resultado.pasilla = {
                kg: Number(parsed_data.pasillaMolido.kg) || 0,
                total: Number(parsed_data.pasillaMolido.total) || 0
              };
            }
          }
        } catch (e) {
          console.error('Error al parsear resumen de ventas:', e);
        }
      }

      return resultado;
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
   * Obtiene información sobre los productos empacados disponibles
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} - Información de productos empacados
   */
  async obtenerEmpacadoDisponible(userId) {
    try {
      // Obtener datos de la caché
      const [empacadoData] = await db.query(`
        SELECT clave as tipo_producto, valor_numerico, json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'empacado_disponible'
      `, [userId]);

      // Estructura para almacenar resultados
      const resultado = {
        grano: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        molido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        pasillaMolido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 }
      };

      // Procesar cada registro
      if (empacadoData && empacadoData.length > 0) {
        empacadoData.forEach(item => {
          let parsed_data = null;
          
          if (item.json_data) {
            try {
              if (typeof item.json_data === 'object') {
                parsed_data = item.json_data;
              } else if (typeof item.json_data === 'string') {
                parsed_data = JSON.parse(item.json_data);
              }
            } catch (e) {
              console.error('Error al parsear JSON de empacado:', e);
            }
          }

          if (parsed_data) {
            const cantidad_empaques = Number(parsed_data.cantidad_empaques) || 0;
            const peso_total = Number(parsed_data.peso_total) || 0;
            const lotes_count = Number(parsed_data.lotes_count) || 0;
            
            if (item.tipo_producto === 'Grano') {
              resultado.grano = { cantidad_empaques, peso_total, lotes_count };
            } else if (item.tipo_producto === 'Molido') {
              resultado.molido = { cantidad_empaques, peso_total, lotes_count };
            } else if (item.tipo_producto === 'Pasilla Molido') {
              resultado.pasillaMolido = { cantidad_empaques, peso_total, lotes_count };
            }
          }
        });
      }

      return resultado;
    } catch (error) {
      console.error('Error al obtener información de empacado disponible:', error);
      return {
        grano: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        molido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        pasillaMolido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 }
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