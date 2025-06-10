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
      // Obtener datos directamente de las tablas para garantizar datos actualizados
      // 1. Datos de lotes vendidos como pergamino
      const [pergaminoData] = await db.query(`
        SELECT 
          COUNT(DISTINCT l.id) as cantidad,
          COALESCE(SUM(v.cantidad), 0) as total_kg
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN ventas v ON l.id = v.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 5
        AND v.detalle_producto_vendido = 'Pergamino'
      `, [userId]);
      
      // 2. Datos de lotes con café tostado en grano
      const [granoData] = await db.query(`
        SELECT 
          COUNT(DISTINCT l.id) as cantidad,
          COALESCE(SUM(v.cantidad), 0) as total_kg
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN ventas v ON l.id = v.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 5
        AND v.detalle_producto_vendido = 'Grano'
      `, [userId]);
      
      // 3. Datos de lotes con café tostado molido
      const [molidoData] = await db.query(`
        SELECT 
          COUNT(DISTINCT l.id) as cantidad,
          COALESCE(SUM(v.cantidad), 0) as total_kg
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        JOIN ventas v ON l.id = v.id_lote
        WHERE f.id_usuario = ? 
        AND l.id_estado_proceso = 5
        AND v.detalle_producto_vendido = 'Molido'
      `, [userId]);
      
      // Fallback a la caché si las consultas directas no retornan resultados
      const [tipoLotes] = await db.query(`
        SELECT clave as tipo, json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'lotes_terminados_tipo_disponible'
      `, [userId]);

      // Inicializar el objeto de resultado
      const result = {
        pergamino: { cantidad: 0, total_kg: 0 },
        tostadoGrano: { cantidad: 0, total_kg: 0 },
        tostadoMolido: { cantidad: 0, total_kg: 0 }
      };

      // Usar los datos directos si están disponibles
      if (pergaminoData && pergaminoData.length > 0) {
        result.pergamino = {
          cantidad: Number(pergaminoData[0].cantidad) || 0,
          total_kg: Number(pergaminoData[0].total_kg) || 0
        };
      }
      
      if (granoData && granoData.length > 0) {
        result.tostadoGrano = {
          cantidad: Number(granoData[0].cantidad) || 0,
          total_kg: Number(granoData[0].total_kg) || 0
        };
      }
      
      if (molidoData && molidoData.length > 0) {
        result.tostadoMolido = {
          cantidad: Number(molidoData[0].cantidad) || 0,
          total_kg: Number(molidoData[0].total_kg) || 0
        };
      }
      
      // Fallback a la caché solo si los datos directos no tienen valores
      if (result.pergamino.cantidad === 0 && result.tostadoGrano.cantidad === 0 && result.tostadoMolido.cantidad === 0 && tipoLotes && tipoLotes.length > 0) {
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
      // Obtener conteos directamente de las tablas para garantizar datos actualizados
      const [conteosDirectos] = await db.query(`
        SELECT 
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM despulpado d 
            WHERE d.id_lote = l.id AND d.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS despulpado_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM fermentacion_lavado fl 
            WHERE fl.id_lote = l.id AND fl.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS fermentacion_lavado_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM secado s 
            WHERE s.id_lote = l.id AND s.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS secado_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM clasificacion c 
            WHERE c.id_lote = l.id AND c.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS clasificacion_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM trilla t 
            WHERE t.id_lote = l.id AND t.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS trilla_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM tueste t 
            WHERE t.id_lote = l.id AND t.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS tueste_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM tueste t JOIN molienda m ON t.id = m.id_tueste
            WHERE t.id_lote = l.id AND m.id_estado_proceso = 2
          ) THEN 1 ELSE 0 END) AS molienda_count,
          
          SUM(CASE WHEN EXISTS (
            SELECT 1 FROM empacado e 
            WHERE e.id_lote = l.id AND e.id_estado_proceso = 2 AND e.es_historico = 0
          ) THEN 1 ELSE 0 END) AS empacado_count
        
        FROM lotes l
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? AND l.id_estado_proceso = 2
      `, [userId]);

      // Fallback a la caché solo si la consulta directa no retornó resultados
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

      // Inicializar el objeto de conteos
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

      // Usar los conteos directos si están disponibles
      if (conteosDirectos && conteosDirectos.length > 0) {
        const direct = conteosDirectos[0];
        conteosObj = {
          despulpado_count: Number(direct.despulpado_count) || 0,
          fermentacion_lavado_count: Number(direct.fermentacion_lavado_count) || 0,
          secado_count: Number(direct.secado_count) || 0,
          clasificacion_count: Number(direct.clasificacion_count) || 0,
          trilla_count: Number(direct.trilla_count) || 0,
          tueste_count: Number(direct.tueste_count) || 0,
          molienda_count: Number(direct.molienda_count) || 0,
          empacado_count: Number(direct.empacado_count) || 0
        };
      } 
      // Fallback a la caché solo si los conteos directos no tienen datos
      else if (conteos && conteos.length > 0 && conteos[0].json_data) {
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
      // Consultar directamente las ventas de los últimos 30 días
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
      
      // Ventas de Pergamino
      const [ventasPergamino] = await db.query(`
        SELECT 
          COALESCE(SUM(v.cantidad), 0) as kg,
          COALESCE(SUM(v.cantidad * v.precio_kg), 0) as total
        FROM ventas v
        JOIN lotes l ON v.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND v.fecha_venta >= ?
        AND v.detalle_producto_vendido = 'Pergamino'
      `, [userId, fechaLimiteStr]);
      
      // Ventas de Grano
      const [ventasGrano] = await db.query(`
        SELECT 
          COALESCE(SUM(v.cantidad), 0) as kg,
          COALESCE(SUM(v.cantidad * v.precio_kg), 0) as total
        FROM ventas v
        JOIN lotes l ON v.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND v.fecha_venta >= ?
        AND v.detalle_producto_vendido = 'Grano'
      `, [userId, fechaLimiteStr]);
      
      // Ventas de Molido
      const [ventasMolido] = await db.query(`
        SELECT 
          COALESCE(SUM(v.cantidad), 0) as kg,
          COALESCE(SUM(v.cantidad * v.precio_kg), 0) as total
        FROM ventas v
        JOIN lotes l ON v.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND v.fecha_venta >= ?
        AND v.detalle_producto_vendido = 'Molido'
      `, [userId, fechaLimiteStr]);
      
      // Ventas de Pasilla
      const [ventasPasilla] = await db.query(`
        SELECT 
          COALESCE(SUM(v.cantidad), 0) as kg,
          COALESCE(SUM(v.cantidad * v.precio_kg), 0) as total
        FROM ventas v
        JOIN lotes l ON v.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND v.fecha_venta >= ?
        AND v.detalle_producto_vendido = 'Pasilla Molido'
      `, [userId, fechaLimiteStr]);
      
      // Fallback a la caché si las consultas directas no retornan resultados
      const [resumen] = await db.query(`
        SELECT json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'resumen_ventas'
        LIMIT 1
      `, [userId]);

      // Inicializar valores por defecto
      let resultado = {
        pasilla: { kg: 0, total: 0 },
        pergamino: { kg: 0, total: 0 },
        tostadoGrano: { kg: 0, total: 0 },
        tostadoMolido: { kg: 0, total: 0 }
      };

      // Usar los datos directos si están disponibles
      if (ventasPergamino && ventasPergamino.length > 0) {
        resultado.pergamino = {
          kg: Number(ventasPergamino[0].kg) || 0,
          total: Number(ventasPergamino[0].total) || 0
        };
      }
      
      if (ventasGrano && ventasGrano.length > 0) {
        resultado.tostadoGrano = {
          kg: Number(ventasGrano[0].kg) || 0,
          total: Number(ventasGrano[0].total) || 0
        };
      }
      
      if (ventasMolido && ventasMolido.length > 0) {
        resultado.tostadoMolido = {
          kg: Number(ventasMolido[0].kg) || 0,
          total: Number(ventasMolido[0].total) || 0
        };
      }
      
      if (ventasPasilla && ventasPasilla.length > 0) {
        resultado.pasilla = {
          kg: Number(ventasPasilla[0].kg) || 0,
          total: Number(ventasPasilla[0].total) || 0
        };
      }
      
      // Fallback a la caché solo si los datos directos no tienen valores significativos
      const totalDirecto = 
        resultado.pergamino.kg + 
        resultado.tostadoGrano.kg + 
        resultado.tostadoMolido.kg + 
        resultado.pasilla.kg;
        
      if (totalDirecto < 0.01 && resumen && resumen.length > 0 && resumen[0].json_data) {
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
      // Consultar directamente los productos empacados disponibles
      // 1. Datos de café en grano
      const [granoData] = await db.query(`
        SELECT 
          COALESCE(SUM(e.total_empaques), 0) as cantidad_empaques,
          COALESCE(SUM(e.peso_empacado), 0) as peso_total,
          COUNT(DISTINCT e.id_lote) as lotes_count
        FROM empacado e
        JOIN lotes l ON e.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND e.id_estado_proceso = 3
        AND e.es_historico = 0
        AND e.tipo_producto_empacado = 'Grano'
        AND NOT EXISTS (
          SELECT 1 FROM ventas v 
          WHERE v.id_lote = l.id 
          AND v.detalle_producto_vendido = 'Grano'
        )
      `, [userId]);
      
      // 2. Datos de café molido
      const [molidoData] = await db.query(`
        SELECT 
          COALESCE(SUM(e.total_empaques), 0) as cantidad_empaques,
          COALESCE(SUM(e.peso_empacado), 0) as peso_total,
          COUNT(DISTINCT e.id_lote) as lotes_count
        FROM empacado e
        JOIN lotes l ON e.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND e.id_estado_proceso = 3
        AND e.es_historico = 0
        AND e.tipo_producto_empacado = 'Molido'
        AND NOT EXISTS (
          SELECT 1 FROM ventas v 
          WHERE v.id_lote = l.id 
          AND v.detalle_producto_vendido = 'Molido'
        )
      `, [userId]);
      
      // 3. Datos de pasilla molido
      const [pasillaData] = await db.query(`
        SELECT 
          COALESCE(SUM(e.total_empaques), 0) as cantidad_empaques,
          COALESCE(SUM(e.peso_empacado), 0) as peso_total,
          COUNT(DISTINCT e.id_lote) as lotes_count
        FROM empacado e
        JOIN lotes l ON e.id_lote = l.id
        JOIN fincas f ON l.id_finca = f.id
        WHERE f.id_usuario = ? 
        AND e.id_estado_proceso = 3
        AND e.es_historico = 0
        AND e.tipo_producto_empacado = 'Pasilla Molido'
        AND NOT EXISTS (
          SELECT 1 FROM ventas v 
          WHERE v.id_lote = l.id 
          AND v.detalle_producto_vendido = 'Pasilla Molido'
        )
      `, [userId]);
      
      // Fallback a la caché solo si las consultas directas no retornan resultados
      const [empacadoData] = await db.query(`
        SELECT clave as tipo_producto, valor_numerico, json_data
        FROM dashboard_cache 
        WHERE id_usuario = ? 
        AND tipo_dato = 'empacado_disponible'
      `, [userId]);

      // Inicializar estructura para almacenar resultados
      const resultado = {
        grano: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        molido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 },
        pasillaMolido: { cantidad_empaques: 0, peso_total: 0, lotes_count: 0 }
      };

      // Usar los datos directos si están disponibles
      if (granoData && granoData.length > 0) {
        resultado.grano = {
          cantidad_empaques: Number(granoData[0].cantidad_empaques) || 0,
          peso_total: Number(granoData[0].peso_total) || 0,
          lotes_count: Number(granoData[0].lotes_count) || 0
        };
      }
      
      if (molidoData && molidoData.length > 0) {
        resultado.molido = {
          cantidad_empaques: Number(molidoData[0].cantidad_empaques) || 0,
          peso_total: Number(molidoData[0].peso_total) || 0,
          lotes_count: Number(molidoData[0].lotes_count) || 0
        };
      }
      
      if (pasillaData && pasillaData.length > 0) {
        resultado.pasillaMolido = {
          cantidad_empaques: Number(pasillaData[0].cantidad_empaques) || 0,
          peso_total: Number(pasillaData[0].peso_total) || 0,
          lotes_count: Number(pasillaData[0].lotes_count) || 0
        };
      }
      
      // Fallback a la caché solo si los datos directos no tienen valores significativos
      const totalDirecto = 
        resultado.grano.cantidad_empaques + 
        resultado.molido.cantidad_empaques + 
        resultado.pasillaMolido.cantidad_empaques;
        
      if (totalDirecto < 1 && empacadoData && empacadoData.length > 0) {
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