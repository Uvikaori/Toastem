-- Vista para estadísticas generales de lotes
CREATE OR REPLACE VIEW vista_estadisticas_lotes AS
SELECT 
    f.id_usuario,
    COUNT(*) as total_lotes,
    SUM(CASE WHEN l.id_estado_proceso = 2 THEN 1 ELSE 0 END) as lotes_activos,
    SUM(CASE WHEN l.id_estado_proceso = 3 THEN 1 ELSE 0 END) as lotes_finalizados,
    SUM(CASE WHEN l.id_estado_proceso = 4 THEN 1 ELSE 0 END) as lotes_cancelados
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
GROUP BY f.id_usuario;

-- Vista para lotes por mes
CREATE OR REPLACE VIEW vista_lotes_por_mes AS
SELECT 
    f.id_usuario,
    DATE_FORMAT(l.fecha_registro, '%Y-%m') AS mes,
    COUNT(*) as cantidad
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
GROUP BY f.id_usuario, DATE_FORMAT(l.fecha_registro, '%Y-%m')
ORDER BY mes ASC;

-- Vista para lotes por estado
CREATE OR REPLACE VIEW vista_lotes_por_estado AS
SELECT 
    f.id_usuario,
    ep.nombre as estado,
    COUNT(*) as cantidad
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
GROUP BY f.id_usuario, l.id_estado_proceso;

-- Vista para lotes terminados por tipo
CREATE OR REPLACE VIEW vista_lotes_terminados_tipo AS
SELECT 
    f.id_usuario,
    'Pergamino' as tipo,
    COUNT(*) as cantidad,
    SUM(COALESCE(s.peso_final, 0)) as total_kg
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN secado s ON l.id = s.id_lote
LEFT JOIN tueste t ON l.id = t.id_lote
WHERE l.id_estado_proceso = 3 
AND s.id_estado_proceso = 3
AND (t.id IS NULL OR t.id_estado_proceso = 1)
GROUP BY f.id_usuario

UNION ALL

SELECT 
    f.id_usuario,
    'TostadoGrano' as tipo,
    COUNT(*) as cantidad,
    SUM(COALESCE(t.peso_pergamino_final, 0)) as total_kg
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN tueste t ON l.id = t.id_lote
LEFT JOIN molienda m ON t.id = m.id_tueste
WHERE l.id_estado_proceso = 3 
AND t.id_estado_proceso = 3
AND (m.id IS NULL OR m.id_estado_proceso = 1)
GROUP BY f.id_usuario

UNION ALL

SELECT 
    f.id_usuario,
    'TostadoMolido' as tipo,
    COUNT(*) as cantidad,
    SUM(COALESCE(m.peso_final, 0)) as total_kg
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN tueste t ON l.id = t.id_lote
JOIN molienda m ON t.id = m.id_tueste
WHERE l.id_estado_proceso = 3 
AND m.id_estado_proceso = 3
GROUP BY f.id_usuario;

-- Vista para conteo de lotes en proceso por tipo
CREATE OR REPLACE VIEW vista_conteo_procesos AS
SELECT 
    f.id_usuario,
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
WHERE l.id_estado_proceso = 2
GROUP BY f.id_usuario;

-- Vista para lotes en proceso de despulpado
CREATE OR REPLACE VIEW vista_lotes_despulpado AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    d.fecha_remojo as fecha_inicio, d.peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN despulpado d ON l.id = d.id_lote
WHERE l.id_estado_proceso = 2 
AND d.id_estado_proceso = 2
ORDER BY d.fecha_remojo DESC;

-- Vista para lotes en proceso de lavado
CREATE OR REPLACE VIEW vista_lotes_lavado AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    lav.fecha_inicio_fermentacion as fecha_inicio, lav.peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN fermentacion_lavado lav ON l.id = lav.id_lote
WHERE l.id_estado_proceso = 2 
AND lav.id_estado_proceso = 2
ORDER BY lav.fecha_inicio_fermentacion DESC;

-- Vista para lotes en proceso de secado
CREATE OR REPLACE VIEW vista_lotes_secado AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    s.fecha_inicio, s.peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN secado s ON l.id = s.id_lote
WHERE l.id_estado_proceso = 2 
AND s.id_estado_proceso = 2
ORDER BY s.fecha_inicio DESC;

-- Vista para lotes en proceso de trilla
CREATE OR REPLACE VIEW vista_lotes_trilla AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    tr.fecha_trilla as fecha_inicio, tr.peso_pergamino_inicial as peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN trilla tr ON l.id = tr.id_lote
WHERE l.id_estado_proceso = 2 
AND tr.id_estado_proceso = 2
ORDER BY tr.fecha_trilla DESC;

-- Vista para lotes en proceso de tueste
CREATE OR REPLACE VIEW vista_lotes_tueste AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    t.fecha_tueste as fecha_inicio, t.peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN tueste t ON l.id = t.id_lote
WHERE l.id_estado_proceso = 2 
AND t.id_estado_proceso = 2
ORDER BY t.fecha_tueste DESC;

-- Vista para lotes en proceso de molienda
CREATE OR REPLACE VIEW vista_lotes_molienda AS
SELECT 
    l.id, l.codigo, f.id as id_finca, f.id_usuario, f.nombre as finca, 
    m.fecha_molienda as fecha_inicio, m.peso_inicial
FROM lotes l
JOIN fincas f ON l.id_finca = f.id
JOIN tueste t ON l.id = t.id_lote
JOIN molienda m ON t.id = m.id_tueste
WHERE l.id_estado_proceso = 2 
AND m.id_estado_proceso = 2
ORDER BY m.fecha_molienda DESC; 