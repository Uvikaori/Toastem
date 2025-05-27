-- Tabla de caché para el dashboard
CREATE TABLE `dashboard_cache` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `tipo_dato` varchar(50) NOT NULL COMMENT 'Tipo de estadística (lotes_total, lotes_activos, etc.)',
  `clave` varchar(50) DEFAULT NULL COMMENT 'Clave opcional para agrupar o clasificar',
  `valor_numerico` decimal(10,2) DEFAULT NULL,
  `valor_texto` varchar(255) DEFAULT NULL,
  `json_data` JSON DEFAULT NULL COMMENT 'Datos en formato JSON para almacenar estructuras complejas',
  `ultima_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_tipo` (`id_usuario`, `tipo_dato`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Procedimiento para actualizar las estadísticas de lotes
DELIMITER //

CREATE PROCEDURE actualizar_estadisticas_lotes(IN p_id_usuario INT)
BEGIN
    DECLARE v_total INT;
    DECLARE v_activos INT;
    DECLARE v_finalizados INT;
    DECLARE v_cancelados INT;
    
    -- Calcular estadísticas
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN l.id_estado_proceso = 2 THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN l.id_estado_proceso = 3 THEN 1 ELSE 0 END) AS finalizados,
        SUM(CASE WHEN l.id_estado_proceso = 4 THEN 1 ELSE 0 END) AS cancelados
    INTO v_total, v_activos, v_finalizados, v_cancelados
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    WHERE f.id_usuario = p_id_usuario;
    
    -- Eliminar estadísticas anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato IN ('lotes_total', 'lotes_activos', 'lotes_finalizados', 'lotes_cancelados');
    
    -- Insertar nuevas estadísticas
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, valor_numerico)
    VALUES
        (p_id_usuario, 'lotes_total', v_total),
        (p_id_usuario, 'lotes_activos', v_activos),
        (p_id_usuario, 'lotes_finalizados', v_finalizados),
        (p_id_usuario, 'lotes_cancelados', v_cancelados);
END //

-- Procedimiento para actualizar lotes por estado
CREATE PROCEDURE actualizar_lotes_por_estado(IN p_id_usuario INT)
BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_por_estado';
    
    -- Insertar nuevos datos
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, valor_texto)
    SELECT 
        f.id_usuario,
        'lotes_por_estado',
        l.id_estado_proceso,
        COUNT(*),
        ep.nombre
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
    WHERE f.id_usuario = p_id_usuario
    GROUP BY f.id_usuario, l.id_estado_proceso, ep.nombre;
END //

-- Procedimiento para actualizar lotes por mes
CREATE PROCEDURE actualizar_lotes_por_mes(IN p_id_usuario INT)
BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_por_mes';
    
    -- Insertar nuevos datos
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, valor_texto)
    SELECT 
        f.id_usuario,
        'lotes_por_mes',
        DATE_FORMAT(l.fecha_registro, '%Y-%m'),
        COUNT(*),
        DATE_FORMAT(l.fecha_registro, '%Y-%m')
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    WHERE f.id_usuario = p_id_usuario
    GROUP BY f.id_usuario, DATE_FORMAT(l.fecha_registro, '%Y-%m')
    ORDER BY DATE_FORMAT(l.fecha_registro, '%Y-%m') DESC
    LIMIT 12;
END //

-- Procedimiento para actualizar lotes terminados por tipo
CREATE PROCEDURE actualizar_lotes_terminados_tipo(IN p_id_usuario INT)
BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_terminados_tipo';
    
    -- Pergamino
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo',
        'Pergamino',
        COUNT(*),
        JSON_OBJECT(
            'cantidad', COUNT(*),
            'total_kg', COALESCE(SUM(s.peso_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN secado s ON l.id = s.id_lote
    LEFT JOIN tueste t ON l.id = t.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND s.id_estado_proceso = 3
    AND (t.id IS NULL OR t.id_estado_proceso = 1)
    GROUP BY f.id_usuario;
    
    -- Tostado en Grano
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo',
        'TostadoGrano',
        COUNT(*),
        JSON_OBJECT(
            'cantidad', COUNT(*),
            'total_kg', COALESCE(SUM(t.peso_pergamino_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    LEFT JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND t.id_estado_proceso = 3
    AND (m.id IS NULL OR m.id_estado_proceso = 1)
    GROUP BY f.id_usuario;
    
    -- Tostado Molido
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo',
        'TostadoMolido',
        COUNT(*),
        JSON_OBJECT(
            'cantidad', COUNT(*),
            'total_kg', COALESCE(SUM(m.peso_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste t ON l.id = t.id_lote
    JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3 
    AND m.id_estado_proceso = 3
    GROUP BY f.id_usuario;
END //

-- Procedimiento para actualizar conteos de procesos
CREATE PROCEDURE actualizar_conteos_procesos(IN p_id_usuario INT)
BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'conteos_procesos';
    
    -- Insertar nuevos datos
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, json_data)
    SELECT 
        f.id_usuario,
        'conteos_procesos',
        JSON_OBJECT(
            'despulpado_count', SUM(CASE WHEN d.id_estado_proceso = 2 THEN 1 ELSE 0 END),
            'lavado_count', SUM(CASE WHEN lav.id_estado_proceso = 2 THEN 1 ELSE 0 END),
            'secado_count', SUM(CASE WHEN s.id_estado_proceso = 2 THEN 1 ELSE 0 END),
            'trilla_count', SUM(CASE WHEN tr.id_estado_proceso = 2 THEN 1 ELSE 0 END),
            'tueste_count', SUM(CASE WHEN t.id_estado_proceso = 2 THEN 1 ELSE 0 END),
            'molienda_count', SUM(CASE WHEN m.id_estado_proceso = 2 THEN 1 ELSE 0 END)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    LEFT JOIN despulpado d ON l.id = d.id_lote
    LEFT JOIN fermentacion_lavado lav ON l.id = lav.id_lote
    LEFT JOIN secado s ON l.id = s.id_lote
    LEFT JOIN trilla tr ON l.id = tr.id_lote
    LEFT JOIN tueste t ON l.id = t.id_lote
    LEFT JOIN molienda m ON t.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario 
    AND l.id_estado_proceso = 2
    GROUP BY f.id_usuario;
END //

-- Procedimiento principal para actualizar todas las estadísticas
CREATE PROCEDURE actualizar_dashboard_completo(IN p_id_usuario INT)
BEGIN
    CALL actualizar_estadisticas_lotes(p_id_usuario);
    CALL actualizar_lotes_por_estado(p_id_usuario);
    CALL actualizar_lotes_por_mes(p_id_usuario);
    CALL actualizar_lotes_terminados_tipo(p_id_usuario);
    CALL actualizar_conteos_procesos(p_id_usuario);
END //

-- Trigger para actualizar el dashboard cuando se modifica un lote
CREATE TRIGGER trig_actualizar_dashboard_lote_insert
AFTER INSERT ON lotes
FOR EACH ROW
BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT id_usuario INTO v_id_usuario 
    FROM fincas 
    WHERE id = NEW.id_finca;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END //

CREATE TRIGGER trig_actualizar_dashboard_lote_update
AFTER UPDATE ON lotes
FOR EACH ROW
BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT id_usuario INTO v_id_usuario 
    FROM fincas 
    WHERE id = NEW.id_finca;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END //

CREATE TRIGGER trig_actualizar_dashboard_lote_delete
AFTER DELETE ON lotes
FOR EACH ROW
BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT id_usuario INTO v_id_usuario 
    FROM fincas 
    WHERE id = OLD.id_finca;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END //

DELIMITER ; 