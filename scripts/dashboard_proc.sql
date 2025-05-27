DELIMITER //

CREATE PROCEDURE obtener_datos_dashboard(IN p_id_usuario INT)
BEGIN
    -- Declarar variables para almacenar resultados
    DECLARE v_total_lotes INT DEFAULT 0;
    DECLARE v_lotes_activos INT DEFAULT 0;
    DECLARE v_lotes_finalizados INT DEFAULT 0;
    DECLARE v_lotes_cancelados INT DEFAULT 0;
    
    -- Obtener estadísticas de lotes
    SELECT 
        COUNT(*) AS total_lotes,
        SUM(CASE WHEN l.id_estado_proceso = 2 THEN 1 ELSE 0 END) AS lotes_activos,
        SUM(CASE WHEN l.id_estado_proceso = 3 THEN 1 ELSE 0 END) AS lotes_finalizados,
        SUM(CASE WHEN l.id_estado_proceso = 4 THEN 1 ELSE 0 END) AS lotes_cancelados
    INTO v_total_lotes, v_lotes_activos, v_lotes_finalizados, v_lotes_cancelados
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    WHERE f.id_usuario = p_id_usuario;
    
    -- Devolver estadísticas de lotes
    SELECT 
        v_total_lotes AS total_lotes,
        v_lotes_activos AS lotes_activos,
        v_lotes_finalizados AS lotes_finalizados,
        v_lotes_cancelados AS lotes_cancelados;
    
    -- Devolver los últimos 5 lotes
    SELECT l.*, ep.nombre as estado_nombre, f.nombre as finca_nombre
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
    WHERE f.id_usuario = p_id_usuario
    ORDER BY l.fecha_registro DESC
    LIMIT 5;
    
    -- Devolver datos de procesos por mes
    SELECT 
        DATE_FORMAT(l.fecha_registro, '%Y-%m') AS mes,
        COUNT(*) as cantidad
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    WHERE f.id_usuario = p_id_usuario
    GROUP BY DATE_FORMAT(l.fecha_registro, '%Y-%m')
    ORDER BY mes ASC
    LIMIT 12;
    
    -- Devolver datos de estado de procesos
    SELECT 
        ep.nombre as estado,
        COUNT(*) as cantidad
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
    WHERE f.id_usuario = p_id_usuario
    GROUP BY l.id_estado_proceso
    ORDER BY cantidad DESC;
    
    -- Devolver lotes terminados por tipo
    SELECT 
        'Pergamino' as tipo,
        COUNT(*) as cantidad,
        COALESCE(SUM(s.peso_final), 0) as total_kg
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN secado s ON l.id = s.id_lote
    LEFT JOIN tueste t ON l.id = t.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND s.id_estado_proceso = 3
    AND (t.id IS NULL OR t.id_estado_proceso = 1);
    
    SELECT 
        'TostadoGrano' as tipo,
        COUNT(*) as cantidad,
        COALESCE(SUM(t.peso_pergamino_final), 0) as total_kg
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    LEFT JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND t.id_estado_proceso = 3
    AND (m.id IS NULL OR m.id_estado_proceso = 1);
    
    SELECT 
        'TostadoMolido' as tipo,
        COUNT(*) as cantidad,
        COALESCE(SUM(m.peso_final), 0) as total_kg
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND m.id_estado_proceso = 3;
    
    -- Devolver conteos de lotes en proceso
    SELECT 
        SUM(CASE WHEN d.id_estado_proceso = 2 THEN 1 ELSE 0 END) as despulpado_count,
        SUM(CASE WHEN lav.id_estado_proceso = 2 THEN 1 ELSE 0 END) as lavado_count,
        SUM(CASE WHEN s.id_estado_proceso = 2 THEN 1 ELSE 0 END) as secado_count,
        SUM(CASE WHEN tr.id_estado_proceso = 2 THEN 1 ELSE 0 END) as trilla_count,
        SUM(CASE WHEN t.id_estado_proceso = 2 THEN 1 ELSE 0 END) as tueste_count,
        SUM(CASE WHEN m.id_estado_proceso = 2 THEN 1 ELSE 0 END) as molienda_count
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    LEFT JOIN despulpado d ON l.id = d.id_lote
    LEFT JOIN fermentacion_lavado lav ON l.id = lav.id_lote
    LEFT JOIN secado s ON l.id = s.id_lote
    LEFT JOIN trilla tr ON l.id = tr.id_lote
    LEFT JOIN tueste t ON l.id = t.id_lote
    LEFT JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario 
    AND l.id_estado_proceso = 2;
    
    -- Devolver lotes en proceso de despulpado
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, d.fecha_remojo as fecha_inicio, d.peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN despulpado d ON l.id = d.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND d.id_estado_proceso = 2
    ORDER BY d.fecha_remojo DESC
    LIMIT 5;
    
    -- Devolver lotes en proceso de lavado
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, lav.fecha_inicio_fermentacion as fecha_inicio, lav.peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN fermentacion_lavado lav ON l.id = lav.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND lav.id_estado_proceso = 2
    ORDER BY lav.fecha_inicio_fermentacion DESC
    LIMIT 5;
    
    -- Devolver lotes en proceso de secado
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, s.fecha_inicio, s.peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN secado s ON l.id = s.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND s.id_estado_proceso = 2
    ORDER BY s.fecha_inicio DESC
    LIMIT 5;
    
    -- Devolver lotes en proceso de trilla
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, tr.fecha_trilla as fecha_inicio, tr.peso_pergamino_inicial as peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN trilla tr ON l.id = tr.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND tr.id_estado_proceso = 2
    ORDER BY tr.fecha_trilla DESC
    LIMIT 5;
    
    -- Devolver lotes en proceso de tueste
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, t.fecha_tueste as fecha_inicio, t.peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND t.id_estado_proceso = 2
    ORDER BY t.fecha_tueste DESC
    LIMIT 5;
    
    -- Devolver lotes en proceso de molido
    SELECT l.id, l.codigo, f.id as id_finca, f.nombre as finca, m.fecha_molienda as fecha_inicio, m.peso_inicial
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 2 
    AND m.id_estado_proceso = 2
    ORDER BY m.fecha_molienda DESC
    LIMIT 5;
END //

DELIMITER ; 