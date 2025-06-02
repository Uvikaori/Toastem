-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 02, 2025 at 08:20 PM
-- Server version: 8.0.39
-- PHP Version: 8.2.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `toastem_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_conteos_procesos_activos` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'conteos_procesos_activos';
    
    -- Insertar nuevos datos
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, json_data)
    SELECT 
        f.id_usuario,
        'conteos_procesos_activos',
        JSON_OBJECT(
            'despulpado_count', COUNT(DISTINCT CASE WHEN d.id_estado_proceso = 2 THEN d.id_lote ELSE NULL END),
            'fermentacion_lavado_count', COUNT(DISTINCT CASE WHEN fl.id_estado_proceso = 2 THEN fl.id_lote ELSE NULL END),
            'secado_count', COUNT(DISTINCT CASE WHEN s.id_estado_proceso = 2 THEN s.id_lote ELSE NULL END),
            'clasificacion_count', COUNT(DISTINCT CASE WHEN cla.id_estado_proceso = 2 THEN cla.id_lote ELSE NULL END),
            'trilla_count', COUNT(DISTINCT CASE WHEN tr.id_estado_proceso = 2 THEN tr.id_lote ELSE NULL END),
            'tueste_count', COUNT(DISTINCT CASE WHEN tu.id_estado_proceso = 2 THEN tu.id_lote ELSE NULL END),
            'molienda_count', COUNT(DISTINCT CASE WHEN m.id_estado_proceso = 2 THEN m.id_tueste ELSE NULL END),
            'empacado_count', COUNT(DISTINCT CASE WHEN e.id_estado_proceso = 2 THEN e.id_lote ELSE NULL END)
        )
    FROM fincas f
    LEFT JOIN lotes l ON f.id = l.id_finca AND l.id_estado_proceso = 2
    LEFT JOIN despulpado d ON l.id = d.id_lote AND d.id_estado_proceso = 2
    LEFT JOIN fermentacion_lavado fl ON l.id = fl.id_lote AND fl.id_estado_proceso = 2
    LEFT JOIN secado s ON l.id = s.id_lote AND s.id_estado_proceso = 2
    LEFT JOIN clasificacion cla ON l.id = cla.id_lote AND cla.id_estado_proceso = 2
    LEFT JOIN trilla tr ON l.id = tr.id_lote AND tr.id_estado_proceso = 2
    LEFT JOIN tueste tu ON l.id = tu.id_lote AND tu.id_estado_proceso = 2
    LEFT JOIN molienda m ON tu.id = m.id_tueste AND m.id_estado_proceso = 2
    LEFT JOIN empacado e ON l.id = e.id_lote AND e.id_estado_proceso = 2 AND e.es_historico = 0
    WHERE f.id_usuario = p_id_usuario
    GROUP BY f.id_usuario;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_dashboard_completo` (IN `p_id_usuario` INT)   BEGIN
    CALL actualizar_estadisticas_lotes(p_id_usuario);
    CALL actualizar_lotes_por_estado(p_id_usuario);
    CALL actualizar_lotes_por_mes(p_id_usuario);
    CALL actualizar_lotes_terminados_tipo(p_id_usuario);
    CALL actualizar_conteos_procesos_activos(p_id_usuario);
    CALL actualizar_resumen_ventas(p_id_usuario);
    CALL actualizar_empacado_disponible(p_id_usuario);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_empacado_disponible` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'empacado_disponible';
    
    -- Insertar datos de empacado disponible
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'empacado_disponible',
        e.tipo_producto_empacado,
        SUM(e.peso_empacado),
        JSON_OBJECT(
            'cantidad_empaques', SUM(e.total_empaques),
            'peso_total', SUM(e.peso_empacado),
            'lotes_count', COUNT(DISTINCT l.id)
        )
    FROM fincas f
    JOIN lotes l ON f.id = l.id_finca
    JOIN empacado e ON l.id = e.id_lote
    LEFT JOIN ventas v ON l.id = v.id_lote AND v.detalle_producto_vendido = e.tipo_producto_empacado
    WHERE f.id_usuario = p_id_usuario
    AND e.id_estado_proceso = 3  -- Empacado completado
    AND e.es_historico = 0       -- No es un registro histórico
    AND (v.id IS NULL OR v.cantidad < e.peso_empacado) -- Sin venta o con venta parcial
    GROUP BY f.id_usuario, e.tipo_producto_empacado
    HAVING SUM(e.peso_empacado) > 0;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_estadisticas_lotes` (IN `p_id_usuario` INT)   BEGIN
    DECLARE v_total INT DEFAULT 0;
    DECLARE v_activos INT DEFAULT 0;
    DECLARE v_finalizados INT DEFAULT 0;
    DECLARE v_cancelados INT DEFAULT 0;
    
    -- Calcular estadísticas
    SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN l.id_estado_proceso IN (1, 2) THEN 1 ELSE 0 END) AS activos,
        SUM(CASE WHEN l.id_estado_proceso IN (3, 5) THEN 1 ELSE 0 END) AS finalizados,
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_lotes_por_estado` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_por_estado';
    
    -- Insertar nuevos datos
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, valor_texto)
    SELECT 
        f.id_usuario,
        'lotes_por_estado',
        CAST(l.id_estado_proceso AS CHAR),
        COUNT(*),
        ep.nombre
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN estados_proceso ep ON l.id_estado_proceso = ep.id
    WHERE f.id_usuario = p_id_usuario
    GROUP BY f.id_usuario, l.id_estado_proceso, ep.nombre;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_lotes_por_mes` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_por_mes';
    
    -- Insertar nuevos datos de los últimos 12 meses
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
    AND l.fecha_registro >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY f.id_usuario, DATE_FORMAT(l.fecha_registro, '%Y-%m')
    ORDER BY DATE_FORMAT(l.fecha_registro, '%Y-%m') DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_lotes_terminados_tipo` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'lotes_terminados_tipo_disponible';
    
    -- Pergamino disponible (Secado terminado, no tostado aún)
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo_disponible',
        'Pergamino',
        COUNT(DISTINCT l.id),
        JSON_OBJECT(
            'cantidad_lotes', COUNT(DISTINCT l.id),
            'total_kg_disponible', COALESCE(SUM(s.peso_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN secado s ON l.id = s.id_lote
    LEFT JOIN tueste tu ON l.id = tu.id_lote AND tu.id_estado_proceso != 4
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3
    AND s.id_estado_proceso = 3
    AND (tu.id IS NULL OR tu.id_estado_proceso = 1)
    GROUP BY f.id_usuario
    HAVING COUNT(DISTINCT l.id) > 0;
    
    -- Tostado en Grano disponible (Tueste terminado, no molido aún)
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo_disponible',
        'TostadoGrano',
        COUNT(DISTINCT l.id),
        JSON_OBJECT(
            'cantidad_lotes', COUNT(DISTINCT l.id),
            'total_kg_disponible', COALESCE(SUM(tu.peso_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste tu ON l.id = tu.id_lote
    LEFT JOIN molienda m ON tu.id = m.id_tueste AND m.id_estado_proceso != 4
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3
    AND tu.id_estado_proceso = 3
    AND (m.id IS NULL OR m.id_estado_proceso = 1)
    GROUP BY f.id_usuario
    HAVING COUNT(DISTINCT l.id) > 0;
    
    -- Tostado Molido disponible (Molienda terminada)
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, clave, valor_numerico, json_data)
    SELECT 
        f.id_usuario,
        'lotes_terminados_tipo_disponible',
        'TostadoMolido',
        COUNT(DISTINCT l.id),
        JSON_OBJECT(
            'cantidad_lotes', COUNT(DISTINCT l.id),
            'total_kg_disponible', COALESCE(SUM(m.peso_final), 0)
        )
    FROM lotes l
    JOIN fincas f ON l.id_finca = f.id
    JOIN tueste tu ON l.id = tu.id_lote
    JOIN molienda m ON tu.id = m.id_tueste
    WHERE f.id_usuario = p_id_usuario
    AND l.id_estado_proceso = 3
    AND tu.id_estado_proceso = 3
    AND m.id_estado_proceso = 3
    GROUP BY f.id_usuario
    HAVING COUNT(DISTINCT l.id) > 0;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `actualizar_resumen_ventas` (IN `p_id_usuario` INT)   BEGIN
    -- Eliminar datos anteriores
    DELETE FROM dashboard_cache 
    WHERE id_usuario = p_id_usuario 
    AND tipo_dato = 'resumen_ventas';
    
    -- Insertar resumen de ventas de los últimos 30 días
    INSERT INTO dashboard_cache (id_usuario, tipo_dato, json_data)
    SELECT 
        f.id_usuario,
        'resumen_ventas',
        JSON_OBJECT(
            'pergamino', JSON_OBJECT(
                'kg', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 1 THEN v.cantidad ELSE 0 END), 0),
                'total', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 1 THEN v.cantidad * v.precio_kg ELSE 0 END), 0)
            ),
            'tostadoGrano', JSON_OBJECT(
                'kg', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Grano' THEN v.cantidad ELSE 0 END), 0),
                'total', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Grano' THEN v.cantidad * v.precio_kg ELSE 0 END), 0)
            ),
            'tostadoMolido', JSON_OBJECT(
                'kg', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Molido' THEN v.cantidad ELSE 0 END), 0),
                'total', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Molido' THEN v.cantidad * v.precio_kg ELSE 0 END), 0)
            ),
            'pasillaMolido', JSON_OBJECT(
                'kg', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Pasilla Molido' THEN v.cantidad ELSE 0 END), 0),
                'total', COALESCE(SUM(CASE WHEN v.id_tipo_venta = 2 AND v.detalle_producto_vendido = 'Pasilla Molido' THEN v.cantidad * v.precio_kg ELSE 0 END), 0)
            ),
            'fecha_inicio', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y-%m-%d'),
            'fecha_fin', DATE_FORMAT(NOW(), '%Y-%m-%d')
        )
    FROM fincas f
    JOIN lotes l ON f.id = l.id_finca
    JOIN ventas v ON l.id = v.id_lote
    WHERE f.id_usuario = p_id_usuario
    AND v.fecha_venta >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY f.id_usuario;

    -- Si no hay ventas en los últimos 30 días, insertamos estructura vacía
    IF NOT EXISTS (SELECT 1 FROM dashboard_cache WHERE id_usuario = p_id_usuario AND tipo_dato = 'resumen_ventas') THEN
        INSERT INTO dashboard_cache (id_usuario, tipo_dato, json_data)
        VALUES (
            p_id_usuario,
            'resumen_ventas',
            JSON_OBJECT(
                'pergamino', JSON_OBJECT('kg', 0, 'total', 0),
                'tostadoGrano', JSON_OBJECT('kg', 0, 'total', 0),
                'tostadoMolido', JSON_OBJECT('kg', 0, 'total', 0),
                'pasillaMolido', JSON_OBJECT('kg', 0, 'total', 0),
                'fecha_inicio', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 30 DAY), '%Y-%m-%d'),
                'fecha_fin', DATE_FORMAT(NOW(), '%Y-%m-%d')
            )
        );
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `clasificacion`
--

CREATE TABLE `clasificacion` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_clasificacion` datetime NOT NULL,
  `peso_total` decimal(10,2) DEFAULT NULL,
  `peso_pergamino` decimal(10,2) DEFAULT NULL,
  `peso_pasilla` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clasificacion`
--

INSERT INTO `clasificacion` (`id`, `id_lote`, `peso_inicial`, `fecha_clasificacion`, `peso_total`, `peso_pergamino`, `peso_pasilla`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 40.00, '2025-05-20 00:00:00', 40.00, 20.00, 15.00, NULL, 3),
(2, 7, 71.50, '2025-05-20 16:00:00', 71.50, 50.00, 21.50, NULL, 3),
(3, 8, 46.00, '2025-05-29 16:00:00', 46.00, 36.00, 10.00, NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `control_calidad`
--

CREATE TABLE `control_calidad` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_evaluacion` date NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `color_grano` enum('Claro','Medio','Oscuro') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `uniformidad` enum('Uniforme','Poco uniforme','No uniforme') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `defectos` enum('Ninguno','Pocos','Muchos') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `olor` enum('Bueno','Normal','Malo') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `apariencia` enum('Buena','Normal','Mala') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `calificacion` int NOT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_cache`
--

CREATE TABLE `dashboard_cache` (
  `id` int NOT NULL,
  `id_usuario` int NOT NULL,
  `tipo_dato` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tipo de estadística (lotes_total, lotes_activos, etc.)',
  `clave` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Clave opcional para agrupar o clasificar',
  `valor_numerico` decimal(10,2) DEFAULT NULL,
  `valor_texto` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `json_data` json DEFAULT NULL COMMENT 'Datos en formato JSON para almacenar estructuras complejas',
  `ultima_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dashboard_cache`
--

INSERT INTO `dashboard_cache` (`id`, `id_usuario`, `tipo_dato`, `clave`, `valor_numerico`, `valor_texto`, `json_data`, `ultima_actualizacion`) VALUES
(1, 6, 'lotes_total', NULL, 4.00, NULL, NULL, '2025-06-02 20:08:53'),
(2, 6, 'lotes_activos', NULL, 1.00, NULL, NULL, '2025-06-02 20:08:53'),
(3, 6, 'lotes_finalizados', NULL, 3.00, NULL, NULL, '2025-06-02 20:08:53'),
(4, 6, 'lotes_cancelados', NULL, 0.00, NULL, NULL, '2025-06-02 20:08:53'),
(5, 6, 'lotes_por_estado', '3', 1.00, 'Terminado', NULL, '2025-06-02 20:08:53'),
(6, 6, 'lotes_por_estado', '5', 2.00, 'Finalizado', NULL, '2025-06-02 20:08:53'),
(7, 6, 'lotes_por_estado', '2', 1.00, 'En progreso', NULL, '2025-06-02 20:08:53'),
(8, 6, 'lotes_por_mes', '2025-05', 4.00, '2025-05', NULL, '2025-06-02 20:08:53'),
(9, 6, 'lotes_terminados_tipo_disponible', 'TostadoGrano', 1.00, NULL, '{\"cantidad_lotes\": 1, \"total_kg_disponible\": 32.50}', '2025-06-02 20:08:53'),
(10, 6, 'conteos_procesos_activos', NULL, NULL, NULL, '{\"secado_count\": 0, \"trilla_count\": 0, \"tueste_count\": 0, \"molienda_count\": 0, \"despulpado_count\": 0, \"clasificacion_count\": 0, \"fermentacion_lavado_count\": 0}', '2025-06-02 20:08:53');

-- --------------------------------------------------------

--
-- Table structure for table `despulpado`
--

CREATE TABLE `despulpado` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_remojo` datetime NOT NULL,
  `fecha_despulpado` datetime NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `peso_despues` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `despulpado`
--

INSERT INTO `despulpado` (`id`, `id_lote`, `peso_inicial`, `fecha_remojo`, `fecha_despulpado`, `peso_final`, `peso_despues`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 50.00, '2025-05-15 14:24:00', '2025-05-15 18:00:00', 45.00, NULL, 'Salio mucho café sin pepa', 3),
(2, 2, 50.00, '2025-05-15 14:24:00', '2025-05-15 18:00:00', 45.00, NULL, 'Salio mucho café sin pepa', 3),
(3, 6, 230.00, '2025-05-21 21:26:00', '2025-05-21 22:27:00', 60.00, NULL, 'no', 3),
(4, 7, 80.00, '2025-05-16 10:46:00', '2025-05-16 15:46:00', 75.00, NULL, '\n[CORRECCIÓN COMPLETADA] 25/5/2025, 10:46:54', 3),
(5, 8, 100.00, '2025-05-25 09:42:00', '2025-05-25 00:42:00', 48.00, NULL, '', 3);

-- --------------------------------------------------------

--
-- Table structure for table `destinos_finales`
--

CREATE TABLE `destinos_finales` (
  `id` int NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `destinos_finales`
--

INSERT INTO `destinos_finales` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Proceso completo', 'El lote sigue todo el proceso hasta el empacado'),
(2, 'Venta como pergamino', 'El lote se vende después del secado'),
(3, 'Venta como tostado (grano)', 'El lote se vende tostado en grano'),
(4, 'Venta como molido', 'El lote se vende molido');

-- --------------------------------------------------------

--
-- Table structure for table `empacado`
--

CREATE TABLE `empacado` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_empacado` date NOT NULL,
  `peso_empacado` decimal(10,2) NOT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1',
  `es_historico` tinyint(1) NOT NULL DEFAULT '0',
  `id_tueste` int DEFAULT NULL,
  `id_molienda` int DEFAULT NULL,
  `total_empaques` int NOT NULL DEFAULT '1' COMMENT 'Número total de empaques generados',
  `tipo_producto_empacado` enum('Grano','Molido','Pasilla Molido') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Grano' COMMENT 'Tipo de producto empacado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `empacado`
--

INSERT INTO `empacado` (`id`, `id_lote`, `peso_inicial`, `fecha_empacado`, `peso_empacado`, `observaciones`, `id_estado_proceso`, `es_historico`, `id_tueste`, `id_molienda`, `total_empaques`, `tipo_producto_empacado`) VALUES
(1, 8, 15.00, '2025-06-02', 15.00, '', 3, 0, NULL, NULL, 30, 'Grano'),
(2, 8, 20.30, '2025-06-02', 20.00, '', 3, 0, NULL, 4, 40, 'Molido'),
(3, 8, 15.00, '2025-06-02', 15.00, '', 1, 0, NULL, 3, 30, 'Grano'),
(4, 8, 20.30, '2025-06-02', 20.00, '', 1, 0, NULL, 4, 40, 'Molido'),
(5, 8, 9.40, '2025-06-02', 9.00, '', 1, 0, NULL, 5, 18, 'Pasilla Molido'),
(6, 8, 15.00, '2025-06-02', 15.00, '', 1, 0, NULL, 3, 30, 'Grano'),
(7, 8, 20.30, '2025-06-02', 20.00, '', 1, 0, NULL, 4, 40, 'Molido'),
(8, 8, 9.40, '2025-06-02', 9.00, '', 1, 0, NULL, 5, 18, 'Pasilla Molido'),
(9, 8, 0.30, '2025-06-02', 0.30, '', 1, 0, NULL, 4, 1, 'Molido'),
(10, 8, 0.40, '2025-06-02', 0.40, '', 1, 0, NULL, 5, 1, 'Pasilla Molido'),
(11, 8, 15.00, '2025-06-02', 15.00, '', 1, 0, NULL, 3, 30, 'Grano'),
(12, 8, 20.30, '2025-06-02', 20.00, '', 1, 0, NULL, 4, 40, 'Molido'),
(13, 8, 9.40, '2025-06-02', 9.00, '', 1, 0, NULL, 5, 18, 'Pasilla Molido'),
(14, 8, 0.30, '2025-06-02', 0.30, '', 1, 0, NULL, 4, 1, 'Molido'),
(15, 8, 0.40, '2025-06-02', 0.40, '', 1, 0, NULL, 5, 1, 'Pasilla Molido');

--
-- Triggers `empacado`
--
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_empacado_delete` AFTER DELETE ON `empacado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = OLD.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_empacado_insert` AFTER INSERT ON `empacado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_empacado_update` AFTER UPDATE ON `empacado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `estados_proceso`
--

CREATE TABLE `estados_proceso` (
  `id` int NOT NULL,
  `nombre` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `estados_proceso`
--

INSERT INTO `estados_proceso` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Por hacer', 'Proceso aún no iniciado'),
(2, 'En progreso', 'Proceso en ejecución'),
(3, 'Terminado', 'Proceso completado'),
(4, 'Cancelado', 'Proceso cancelado'),
(5, 'Finalizado', 'Proceso finalizado y producto vendido');

-- --------------------------------------------------------

--
-- Table structure for table `fermentacion_lavado`
--

CREATE TABLE `fermentacion_lavado` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_inicio_fermentacion` datetime NOT NULL,
  `fecha_lavado` datetime NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fermentacion_lavado`
--

INSERT INTO `fermentacion_lavado` (`id`, `id_lote`, `peso_inicial`, `fecha_inicio_fermentacion`, `fecha_lavado`, `peso_final`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 45.00, '2025-05-16 10:51:00', '2025-05-17 04:51:00', 41.99, 'Mucha hoja', 3),
(2, 7, 75.00, '2025-05-17 16:00:00', '2025-05-17 17:40:00', 75.00, '\n[CORRECCIÓN COMPLETADA] 25/5/2025, 12:40:19', 3),
(3, 8, 48.00, '2025-05-25 15:00:00', '2025-05-26 12:00:00', 47.00, '', 3);

-- --------------------------------------------------------

--
-- Table structure for table `fincas`
--

CREATE TABLE `fincas` (
  `id` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ubicacion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_municipio_vereda` int DEFAULT NULL,
  `id_usuario` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fincas`
--

INSERT INTO `fincas` (`id`, `nombre`, `ubicacion`, `id_municipio_vereda`, `id_usuario`) VALUES
(2, 'El Sol', 'Puerta Morada', 35, 6),
(3, 'El Paraiso', 'Puerta Con Sangre De Borrego', 16, 7),
(4, 'La Piscina', 'La Del Borracho En La Esquina', 1, 7),
(5, 'La Cuesta', 'Km 125', 35, 8),
(6, 'Abc', 'Ladera', 36, 9),
(7, 'La Persevarancia', '', 9, 6);

-- --------------------------------------------------------

--
-- Table structure for table `lotes`
--

CREATE TABLE `lotes` (
  `id` int NOT NULL,
  `codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `id_usuario` int NOT NULL,
  `id_finca` int DEFAULT NULL,
  `fecha_recoleccion` date NOT NULL,
  `peso_inicial` decimal(10,2) NOT NULL,
  `tipo_recoleccion` enum('Selectiva','General') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tipo_cafe` enum('Rojo','Amarillo','Mezcla') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_destino_final` int DEFAULT '1',
  `id_estado_proceso` int DEFAULT '1',
  `id_proceso_actual` int DEFAULT NULL,
  `fecha_finalizacion` date DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lotes`
--

INSERT INTO `lotes` (`id`, `codigo`, `id_usuario`, `id_finca`, `fecha_recoleccion`, `peso_inicial`, `tipo_recoleccion`, `tipo_cafe`, `observaciones`, `id_destino_final`, `id_estado_proceso`, `id_proceso_actual`, `fecha_finalizacion`, `fecha_registro`) VALUES
(2, 'F2-L1746561376894', 6, 2, '2025-05-06', 50.00, 'Selectiva', 'Mezcla', '', 1, 3, 8, NULL, '2025-05-06 21:56:17'),
(3, 'F3-L1746727435329', 7, 3, '2025-02-22', 100.00, 'General', 'Rojo', 'Lleno de cucarachas.', 1, 2, 1, NULL, '2025-05-08 20:03:55'),
(4, 'F3-L1746727674609', 7, 3, '2025-02-15', 50.00, 'Selectiva', 'Amarillo', 'Todo podrido', 1, 2, 1, NULL, '2025-05-08 20:07:55'),
(5, 'F5-L1746728849693', 8, 5, '2025-05-08', 50.00, 'Selectiva', 'Mezcla', 'Plantas con broca', 1, 2, 1, NULL, '2025-05-08 20:27:30'),
(6, 'F6-L1747846558769', 9, 6, '2024-09-24', 230.00, 'Selectiva', 'Rojo', 'ninguna', 1, 2, 3, NULL, '2025-05-21 18:55:59'),
(7, 'F2-L1748113017079', 6, 2, '2025-05-15', 80.00, 'Selectiva', 'Mezcla', '', 1, 5, NULL, '2025-06-02', '2025-05-24 20:56:57'),
(8, 'F2-L1748192274739', 6, 2, '2025-05-25', 100.00, 'Selectiva', 'Rojo', '', 1, 5, NULL, '2025-06-02', '2025-05-25 18:57:55'),
(9, 'F7-L1748715771908', 6, 7, '2025-05-18', 70.00, 'Selectiva', 'Mezcla', '', 1, 2, 1, NULL, '2025-05-31 20:22:52');

--
-- Triggers `lotes`
--
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_lote_delete` AFTER DELETE ON `lotes` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    IF OLD.id_finca IS NOT NULL THEN
      SELECT id_usuario INTO v_id_usuario FROM fincas WHERE id = OLD.id_finca;
      IF v_id_usuario IS NOT NULL THEN
          CALL actualizar_dashboard_completo(v_id_usuario);
      END IF;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_lote_insert` AFTER INSERT ON `lotes` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    SELECT id_usuario INTO v_id_usuario FROM fincas WHERE id = NEW.id_finca;
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_lote_update` AFTER UPDATE ON `lotes` FOR EACH ROW BEGIN
    DECLARE v_id_usuario_old INT;
    DECLARE v_id_usuario_new INT;
    SELECT id_usuario INTO v_id_usuario_new FROM fincas WHERE id = NEW.id_finca;
    IF OLD.id_finca IS NOT NULL THEN
      SELECT id_usuario INTO v_id_usuario_old FROM fincas WHERE id = OLD.id_finca;
    END IF;

    IF v_id_usuario_new IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario_new);
    END IF;
    IF v_id_usuario_old IS NOT NULL AND (v_id_usuario_new IS NULL OR v_id_usuario_new != v_id_usuario_old) THEN
        CALL actualizar_dashboard_completo(v_id_usuario_old);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `molienda`
--

CREATE TABLE `molienda` (
  `id` int NOT NULL,
  `id_tueste` int NOT NULL,
  `tipo_cafe` enum('Pergamino','Pasilla') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_molienda` date NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `es_grano` tinyint(1) NOT NULL DEFAULT '0',
  `tipo_molienda` enum('Granulado','Fino') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `molienda`
--

INSERT INTO `molienda` (`id`, `id_tueste`, `tipo_cafe`, `peso_inicial`, `fecha_molienda`, `peso_final`, `es_grano`, `tipo_molienda`, `cantidad`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 'Pergamino', 35.30, '2025-06-01', 35.30, 0, 'Fino', 35.30, '[Café Pergamino] [REINICIADO] 2025-06-01 21:28:36', 1),
(2, 2, 'Pasilla', 9.40, '2025-06-01', 9.40, 0, 'Fino', 9.40, '[Café Pasilla] [REINICIADO] 2025-06-01 21:30:54', 1),
(3, 2, 'Pergamino', 15.00, '2025-06-01', 15.00, 1, NULL, 15.00, '[Modificación: 1/6/2025, 10:13:09 p. m.] [Pergamino en Grano]', 3),
(4, 2, 'Pergamino', 20.30, '2025-06-01', 20.30, 0, 'Fino', 20.30, '[Modificación: 1/6/2025, 10:13:09 p. m.] [Pergamino Molido Fino]', 3),
(5, 2, 'Pasilla', 9.40, '2025-06-01', 9.40, 0, 'Fino', 9.40, '[Modificación: 1/6/2025, 10:13:09 p. m.] [Pasilla Molida Fino]', 3);

-- --------------------------------------------------------

--
-- Table structure for table `municipio_vereda`
--

CREATE TABLE `municipio_vereda` (
  `id` int NOT NULL,
  `codigo_ver` int NOT NULL COMMENT 'Número de 8 dígitos',
  `nom_dep` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nomb_mpio` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nombre_ver` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `cod_dpto` int NOT NULL COMMENT 'Número de 2 dígitos',
  `dptompio` int NOT NULL COMMENT 'Número de 5 dígitos (código departamento + municipio)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `municipio_vereda`
--

INSERT INTO `municipio_vereda` (`id`, `codigo_ver`, `nom_dep`, `nomb_mpio`, `nombre_ver`, `cod_dpto`, `dptompio`) VALUES
(1, 25245001, 'CUNDINAMARCA', 'EL COLEGIO', 'ANTIOQUIA', 25, 25245),
(2, 25245002, 'CUNDINAMARCA', 'EL COLEGIO', 'ARCADIA', 25, 25245),
(3, 25245003, 'CUNDINAMARCA', 'EL COLEGIO', 'CAMPOS', 25, 25245),
(4, 25245004, 'CUNDINAMARCA', 'EL COLEGIO', 'CARMELO', 25, 25245),
(5, 25245005, 'CUNDINAMARCA', 'EL COLEGIO', 'CUCUTA', 25, 25245),
(6, 25245006, 'CUNDINAMARCA', 'EL COLEGIO', 'EL PORVENIR', 25, 25245),
(7, 25245007, 'CUNDINAMARCA', 'EL COLEGIO', 'EL TIGRE', 25, 25245),
(8, 25245008, 'CUNDINAMARCA', 'EL COLEGIO', 'EL TRIUNFO', 25, 25245),
(9, 25245009, 'CUNDINAMARCA', 'EL COLEGIO', 'ENTRERIOS', 25, 25245),
(10, 25245010, 'CUNDINAMARCA', 'EL COLEGIO', 'FRANCIA', 25, 25245),
(11, 25245011, 'CUNDINAMARCA', 'EL COLEGIO', 'GRANJAS', 25, 25245),
(12, 25245012, 'CUNDINAMARCA', 'EL COLEGIO', 'GUACACHA', 25, 25245),
(13, 25245013, 'CUNDINAMARCA', 'EL COLEGIO', 'HONDURAS', 25, 25245),
(14, 25245014, 'CUNDINAMARCA', 'EL COLEGIO', 'JUNCA', 25, 25245),
(15, 25245015, 'CUNDINAMARCA', 'EL COLEGIO', 'LA FLECHA', 25, 25245),
(16, 25245016, 'CUNDINAMARCA', 'EL COLEGIO', 'LA VICTORIA', 25, 25245),
(17, 25245017, 'CUNDINAMARCA', 'EL COLEGIO', 'LA VIRGINIA', 25, 25245),
(18, 25245018, 'CUNDINAMARCA', 'EL COLEGIO', 'LAS PALMAS', 25, 25245),
(19, 25245019, 'CUNDINAMARCA', 'EL COLEGIO', 'LUCERNA', 25, 25245),
(20, 25245020, 'CUNDINAMARCA', 'EL COLEGIO', 'MARSELLA', 25, 25245),
(21, 25245021, 'CUNDINAMARCA', 'EL COLEGIO', 'MISIONES', 25, 25245),
(22, 25245022, 'CUNDINAMARCA', 'EL COLEGIO', 'PITALA', 25, 25245),
(23, 25245023, 'CUNDINAMARCA', 'EL COLEGIO', 'PRADILLA', 25, 25245),
(24, 25245024, 'CUNDINAMARCA', 'EL COLEGIO', 'SAN JOSÉ', 25, 25245),
(25, 25245025, 'CUNDINAMARCA', 'EL COLEGIO', 'SAN PEDRO', 25, 25245),
(26, 25245026, 'CUNDINAMARCA', 'EL COLEGIO', 'SAN RAMON', 25, 25245),
(27, 25245027, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTA CRUZ', 25, 25245),
(28, 25245028, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTA ISABEL', 25, 25245),
(29, 25245029, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTA MARTHA', 25, 25245),
(30, 25245030, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTA RITA', 25, 25245),
(31, 25245031, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTO DOMINGO', 25, 25245),
(32, 25245032, 'CUNDINAMARCA', 'EL COLEGIO', 'SANTO TOMAS', 25, 25245),
(33, 25245033, 'CUNDINAMARCA', 'EL COLEGIO', 'SEVILLA', 25, 25245),
(34, 25245034, 'CUNDINAMARCA', 'EL COLEGIO', 'SOLEDAD', 25, 25245),
(35, 25245035, 'CUNDINAMARCA', 'EL COLEGIO', 'SUBIA', 25, 25245),
(36, 25245036, 'CUNDINAMARCA', 'EL COLEGIO', 'TRINIDAD', 25, 25245),
(37, 25245037, 'CUNDINAMARCA', 'EL COLEGIO', 'TRUJILLO', 25, 25245),
(38, 25245038, 'CUNDINAMARCA', 'EL COLEGIO', 'ZADEN', 25, 25245);

-- --------------------------------------------------------

--
-- Table structure for table `precios_cafe`
--

CREATE TABLE `precios_cafe` (
  `id` int NOT NULL,
  `fecha` date NOT NULL,
  `precio_kg` decimal(10,2) NOT NULL,
  `fuente` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `preguntas_seguridad`
--

CREATE TABLE `preguntas_seguridad` (
  `id` int NOT NULL,
  `pregunta` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `preguntas_seguridad`
--

INSERT INTO `preguntas_seguridad` (`id`, `pregunta`) VALUES
(1, '¿Cuál fue el nombre de tu primera mascota?'),
(2, '¿En qué ciudad naciste?'),
(3, '¿Cuál es el nombre de tu madre?'),
(4, '¿Cuál fue tu primer colegio?'),
(5, '¿Cuál es tu color favorito?');

-- --------------------------------------------------------

--
-- Table structure for table `procesos`
--

CREATE TABLE `procesos` (
  `id` int NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `orden` int NOT NULL COMMENT 'Orden en el flujo del proceso'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `procesos`
--

INSERT INTO `procesos` (`id`, `nombre`, `descripcion`, `orden`) VALUES
(1, 'Recolección', 'Proceso de recolección del café', 1),
(2, 'Despulpado', 'Proceso de despulpado del café', 2),
(3, 'Fermentación y Lavado', 'Proceso de fermentación y lavado del café', 3),
(4, 'Zarandeo', 'Proceso de zarandeo del café', 4),
(5, 'Secado', 'Proceso de secado del café', 5),
(6, 'Clasificación', 'Proceso de clasificación del café', 6),
(7, 'Trilla', 'Proceso de trilla del café', 7),
(8, 'Tueste', 'Proceso de tueste del café', 8),
(9, 'Molienda', 'Proceso de molienda del café (opcional)', 9),
(10, 'Empacado', 'Proceso de empacado del café', 10),
(11, 'Control de Calidad', 'Proceso de control de calidad del café', 11);

-- --------------------------------------------------------

--
-- Table structure for table `secado`
--

CREATE TABLE `secado` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `metodo_secado` enum('Secado al sol','Secado mecánico','Secado por vía húmeda (con cereza)') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `humedad_inicial` decimal(5,2) DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `decision_venta` tinyint(1) DEFAULT '0',
  `fecha_decision` datetime DEFAULT NULL,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `secado`
--

INSERT INTO `secado` (`id`, `id_lote`, `peso_inicial`, `fecha_inicio`, `metodo_secado`, `humedad_inicial`, `fecha_fin`, `peso_final`, `observaciones`, `decision_venta`, `fecha_decision`, `id_estado_proceso`) VALUES
(1, 2, 40.00, '2025-05-18 15:48:00', 'Secado al sol', NULL, '2025-05-19 17:49:00', 40.00, '', 0, NULL, 3),
(2, 7, 72.00, '2025-05-18 10:00:00', 'Secado al sol', NULL, '2025-05-20 15:11:00', 71.50, '', 1, '2025-05-25 15:11:26', 3),
(3, 8, 46.50, '2025-05-27 08:00:00', 'Secado al sol', NULL, '2025-05-29 15:00:00', 46.00, '', 0, NULL, 3);

--
-- Triggers `secado`
--
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_secado` AFTER INSERT ON `secado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote;
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_secado_delete` AFTER DELETE ON `secado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = OLD.id_lote;
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_secado_update` AFTER UPDATE ON `secado` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote; -- o OLD.id_lote si el id_lote no puede cambiar
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `seguimiento_secado`
--

CREATE TABLE `seguimiento_secado` (
  `id` int NOT NULL,
  `id_secado` int NOT NULL,
  `fecha` datetime NOT NULL COMMENT 'Fecha y hora del seguimiento',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `temperatura` decimal(5,2) DEFAULT NULL COMMENT 'Temperatura en grados Celsius',
  `humedad` decimal(5,2) DEFAULT NULL COMMENT 'Humedad relativa en porcentaje'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seguimiento_secado`
--

INSERT INTO `seguimiento_secado` (`id`, `id_secado`, `fecha`, `observaciones`, `temperatura`, `humedad`) VALUES
(1, 3, '2025-05-28 16:37:00', 'Aun esta humedo', 25.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tipos_producto`
--

CREATE TABLE `tipos_producto` (
  `id` int NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tipos_producto`
--

INSERT INTO `tipos_producto` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Pergamino', 'Café en pergamino'),
(2, 'Grano', 'Café empacado en grano'),
(3, 'Molido', 'Café empacado molido');

-- --------------------------------------------------------

--
-- Table structure for table `tipos_venta`
--

CREATE TABLE `tipos_venta` (
  `id` int NOT NULL,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tipos_venta`
--

INSERT INTO `tipos_venta` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Pergamino', 'Venta de café en pergamino (después del secado)'),
(2, 'Empacado', 'Venta de café empacado (grano o molido)');

-- --------------------------------------------------------

--
-- Table structure for table `trilla`
--

CREATE TABLE `trilla` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_pergamino_inicial` decimal(10,2) NOT NULL COMMENT 'Peso de pergamino que viene de clasificación',
  `peso_pasilla_inicial` decimal(10,2) NOT NULL COMMENT 'Peso de pasilla que viene de clasificación',
  `peso_pergamino_final` decimal(10,2) NOT NULL COMMENT 'Peso final de pergamino después de trilla',
  `peso_pasilla_final` decimal(10,2) NOT NULL COMMENT 'Peso final de pasilla después de trilla',
  `fecha_trilla` datetime NOT NULL,
  `peso_final` decimal(10,2) NOT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `trilla`
--

INSERT INTO `trilla` (`id`, `id_lote`, `peso_pergamino_inicial`, `peso_pasilla_inicial`, `peso_pergamino_final`, `peso_pasilla_final`, `fecha_trilla`, `peso_final`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 35.00, 0.00, 33.00, 0.00, '2025-05-20 00:00:00', 33.00, '', 3),
(2, 7, 50.00, 21.50, 49.00, 21.00, '2025-05-21 08:00:00', 70.00, '', 3),
(3, 8, 36.00, 10.00, 35.50, 9.50, '2025-05-30 08:00:00', 45.00, '[CORRECCIÓN] Proceso reiniciado para corrección de datos: 1&#x2F;6&#x2F;2025, 16:59:21\n[ACTUALIZADO] 1/6/2025, 18:14:18', 3),
(4, 8, 36.00, 10.00, 35.50, 9.50, '2025-05-30 08:00:00', 45.00, '[CORRECCIÓN] Proceso reiniciado para corrección de datos: 1&#x2F;6&#x2F;2025, 16:59:21', 3),
(5, 8, 36.00, 10.00, 35.50, 9.50, '2025-05-30 08:00:00', 45.00, '[CORRECCIÓN] Proceso reiniciado para corrección de datos: 1&#x2F;6&#x2F;2025, 16:59:21', 3),
(6, 8, 36.00, 10.00, 35.50, 9.50, '2025-05-30 08:00:00', 45.00, '[CORRECCIÓN] Proceso reiniciado para corrección de datos: 1&#x2F;6&#x2F;2025, 16:59:21', 3);

-- --------------------------------------------------------

--
-- Table structure for table `tueste`
--

CREATE TABLE `tueste` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `tipo_cafe` enum('Pergamino','Pasilla') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Tipo de café a tostar (pergamino o pasilla)',
  `peso_pergamino_inicial` decimal(10,2) DEFAULT NULL COMMENT 'Peso pergamino inicial',
  `peso_pasilla_inicial` decimal(10,2) DEFAULT NULL COMMENT 'Peso pasilla inicial',
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `tipo_calidad` enum('Premium','Normal','Baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_tueste` date NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `nivel_tueste` enum('Alto','Medio','Bajo') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `peso_pergamino_final` decimal(10,2) DEFAULT NULL COMMENT 'Peso pergamino después del tueste',
  `peso_pasilla_final` decimal(10,2) DEFAULT NULL COMMENT 'Peso pasilla después del tueste',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tueste`
--

INSERT INTO `tueste` (`id`, `id_lote`, `tipo_cafe`, `peso_pergamino_inicial`, `peso_pasilla_inicial`, `peso_inicial`, `tipo_calidad`, `fecha_tueste`, `peso_final`, `nivel_tueste`, `peso_pergamino_final`, `peso_pasilla_final`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 'Pergamino', 33.00, 0.00, 33.00, 'Normal', '2025-05-21', 32.50, 'Medio', 32.50, 0.00, '', 3),
(2, 8, 'Pergamino', 35.50, 9.50, 45.00, 'Premium', '2025-06-01', 44.70, 'Medio', 35.30, 9.40, NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `id_pregunta_seguridad` int DEFAULT NULL,
  `respuesta_seguridad` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `id_pregunta_seguridad`, `respuesta_seguridad`, `fecha_registro`) VALUES
(6, 'Andres Diaz', 'andresd@gmail.com', '$2b$10$CakDz.ISDMA92NLyBqUWq.PbS0LnjB2ThYSuFu6nfhkSCq6Px70IW', 5, 'azul', '2025-05-06 19:15:33'),
(7, 'Sergio Diaz', 'Sergiod9122@gmail.com', '$2b$10$DSG5FdByQYBwETzcOq/pJu8xjNBhxcbWodSeLpo/Iz.LOBQfQZ8jy', 1, 'Uvi', '2025-05-08 19:56:00'),
(8, 'Adriana Moreno', 'adrianam@gmail.com', '$2b$10$Bxtrz4eS.yIwgERdvg1ONeSfhWnwB5ho74PwRPe.0tnRRN9f3ohMW', 5, 'rojo', '2025-05-08 20:25:59'),
(9, 'Danny Moreno', 'danny@gmail.com', '$2b$10$1HuonbYwPU5mBr6xi26ey.yfXa3QNpH0ewHBPIUdOXCDZoa.C3hJ2', 2, 'bogota', '2025-05-21 18:54:04'),
(10, 'Daniela Moreno', 'daniela@gmail.com', '$2b$10$kQ66UUWAtxHOBBVJddOuYuWKE4K.eoRUb2VdA/bZyJdObdY4YAos6', 5, 'rosa', '2025-05-21 19:24:19'),
(11, 'Andrea Gómez', 'gomez@gmail.com', '$2b$10$o/yDgaHFO8uR3ekEq2tNVOkqhFaQeEHj6R2oKEMJ1R48/b7zMPzCm', 5, 'verde', '2025-05-31 20:14:15');

-- --------------------------------------------------------

--
-- Table structure for table `ventas`
--

CREATE TABLE `ventas` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `fecha_venta` date NOT NULL,
  `id_tipo_venta` int NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_kg` decimal(10,2) NOT NULL,
  `comprador` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `detalle_producto_vendido` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Ej: Pergamino, Grano, Molido, Pasilla Molido'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ventas`
--

INSERT INTO `ventas` (`id`, `id_lote`, `fecha_venta`, `id_tipo_venta`, `cantidad`, `precio_kg`, `comprador`, `observaciones`, `detalle_producto_vendido`) VALUES
(1, 7, '2025-06-02', 1, 71.50, 50000.00, 'Fedecafe', '', NULL),
(2, 8, '2025-06-02', 2, 60.00, 86.00, 'Fedecafe', '', 'Grano'),
(3, 8, '2025-06-02', 2, 60.00, 150.00, 'Fedecafe', NULL, 'Grano'),
(4, 8, '2025-06-02', 2, 80.00, 180.00, 'Fedecafe', NULL, 'Molido'),
(5, 8, '2025-06-02', 2, 27.00, 120.00, 'Fedecafe', NULL, 'Pasilla Molido');

--
-- Triggers `ventas`
--
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_venta_delete` AFTER DELETE ON `ventas` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = OLD.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_venta_insert` AFTER INSERT ON `ventas` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trig_actualizar_dashboard_venta_update` AFTER UPDATE ON `ventas` FOR EACH ROW BEGIN
    DECLARE v_id_usuario INT;
    
    -- Obtener el ID del usuario propietario de la finca
    SELECT f.id_usuario INTO v_id_usuario 
    FROM lotes l JOIN fincas f ON l.id_finca = f.id 
    WHERE l.id = NEW.id_lote;
    
    IF v_id_usuario IS NOT NULL THEN
        CALL actualizar_dashboard_completo(v_id_usuario);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `vista_flujo_lote`
-- (See below for the actual view)
--
CREATE TABLE `vista_flujo_lote` (
`cantidad_vendida` decimal(10,2)
,`clasificacion_id_estado_proceso` int
,`clasificacion_observaciones` text
,`clasificacion_peso_inicial` decimal(10,2)
,`clasificacion_peso_pasilla` decimal(10,2)
,`clasificacion_peso_pergamino` decimal(10,2)
,`clasificacion_peso_total` decimal(10,2)
,`control_calidad_apariencia` enum('Buena','Normal','Mala')
,`control_calidad_calificacion` int
,`control_calidad_color_grano` enum('Claro','Medio','Oscuro')
,`control_calidad_defectos` enum('Ninguno','Pocos','Muchos')
,`control_calidad_id_estado_proceso` int
,`control_calidad_observaciones` text
,`control_calidad_olor` enum('Bueno','Normal','Malo')
,`control_calidad_peso_final` decimal(10,2)
,`control_calidad_peso_inicial` decimal(10,2)
,`control_calidad_uniformidad` enum('Uniforme','Poco uniforme','No uniforme')
,`despulpado_id_estado_proceso` int
,`despulpado_observaciones` text
,`despulpado_peso_despues` decimal(10,2)
,`despulpado_peso_final` decimal(10,2)
,`despulpado_peso_inicial` decimal(10,2)
,`destino_final` varchar(50)
,`empacado_id_estado_proceso` int
,`empacado_id_molienda` int
,`empacado_id_tueste` int
,`empacado_observaciones` text
,`empacado_peso_empacado` decimal(10,2)
,`empacado_peso_inicial` decimal(10,2)
,`empacado_tipo_producto` enum('Grano','Molido','Pasilla Molido')
,`empacado_total_empaques` int
,`fecha_clasificacion` datetime
,`fecha_despulpado` datetime
,`fecha_empacado` date
,`fecha_evaluacion` date
,`fecha_finalizacion` date
,`fecha_inicio_fermentacion` datetime
,`fecha_lavado` datetime
,`fecha_molienda` date
,`fecha_recoleccion` date
,`fecha_registro` datetime
,`fecha_remojo` datetime
,`fecha_trilla` datetime
,`fecha_venta` date
,`fecha_zarandeo` datetime
,`fermentacion_id_estado_proceso` int
,`fermentacion_observaciones` text
,`fermentacion_peso_final` decimal(10,2)
,`fermentacion_peso_inicial` decimal(10,2)
,`lote_codigo` varchar(20)
,`lote_estado` int
,`lote_id` int
,`lote_observaciones` text
,`lote_peso_inicial` decimal(10,2)
,`lote_tipo_cafe_general` enum('Rojo','Amarillo','Mezcla')
,`molienda_cantidad` decimal(10,2)
,`molienda_es_grano` tinyint(1)
,`molienda_id_estado_proceso` int
,`molienda_observaciones` text
,`molienda_peso_final` decimal(10,2)
,`molienda_peso_inicial` decimal(10,2)
,`molienda_tipo_molienda` enum('Granulado','Fino')
,`secado_decision_venta` tinyint(1)
,`secado_fecha_decision` datetime
,`secado_fecha_fin` datetime
,`secado_fecha_inicio` datetime
,`secado_humedad_inicial` decimal(5,2)
,`secado_id_estado_proceso` int
,`secado_metodo` enum('Secado al sol','Secado mecánico','Secado por vía húmeda (con cereza)')
,`secado_observaciones` text
,`secado_peso_final` decimal(10,2)
,`secado_peso_inicial` decimal(10,2)
,`tipo_recoleccion` enum('Selectiva','General')
,`tipo_venta` varchar(50)
,`trilla_id_estado_proceso` int
,`trilla_observaciones` text
,`trilla_peso_final` decimal(10,2)
,`trilla_peso_pasilla_final` decimal(10,2)
,`trilla_peso_pasilla_inicial` decimal(10,2)
,`trilla_peso_pergamino_final` decimal(10,2)
,`trilla_peso_pergamino_inicial` decimal(10,2)
,`tueste_fecha_general` date
,`tueste_fecha_tueste_pasilla` date
,`tueste_fecha_tueste_pergamino` date
,`tueste_id_estado_proceso` int
,`tueste_nivel_tueste_pasilla` varchar(5)
,`tueste_nivel_tueste_pergamino` varchar(5)
,`tueste_observaciones` text
,`tueste_peso_final_general` decimal(10,2)
,`tueste_peso_inicial_general` decimal(10,2)
,`tueste_peso_pasilla_final_especifico` decimal(10,2)
,`tueste_peso_pasilla_inicial_especifico` decimal(10,2)
,`tueste_peso_pergamino_final_especifico` decimal(10,2)
,`tueste_peso_pergamino_inicial_especifico` decimal(10,2)
,`tueste_tipo_cafe_procesado` enum('Pergamino','Pasilla')
,`tueste_tipo_calidad_pasilla` varchar(7)
,`tueste_tipo_calidad_pergamino` varchar(7)
,`venta_detalle_producto` varchar(100)
,`zarandeo_id_estado_proceso` int
,`zarandeo_observaciones` text
,`zarandeo_peso_final` decimal(10,2)
,`zarandeo_peso_inicial` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `zarandeo`
--

CREATE TABLE `zarandeo` (
  `id` int NOT NULL,
  `id_lote` int NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  `fecha_zarandeo` datetime NOT NULL,
  `peso_final` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `zarandeo`
--

INSERT INTO `zarandeo` (`id`, `id_lote`, `peso_inicial`, `fecha_zarandeo`, `peso_final`, `observaciones`, `id_estado_proceso`) VALUES
(1, 2, 41.99, '2025-05-14 10:53:00', 40.00, '', 3),
(2, 7, 75.00, '2025-05-18 08:00:00', 72.00, '', 3),
(3, 8, 47.00, '2025-05-26 16:00:00', 46.50, '', 3);

-- --------------------------------------------------------

--
-- Structure for view `vista_flujo_lote`
--
DROP TABLE IF EXISTS `vista_flujo_lote`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_flujo_lote`  AS SELECT `l`.`id` AS `lote_id`, `l`.`codigo` AS `lote_codigo`, `l`.`fecha_recoleccion` AS `fecha_recoleccion`, `l`.`peso_inicial` AS `lote_peso_inicial`, `l`.`tipo_recoleccion` AS `tipo_recoleccion`, `l`.`tipo_cafe` AS `lote_tipo_cafe_general`, `df`.`nombre` AS `destino_final`, `l`.`fecha_finalizacion` AS `fecha_finalizacion`, `l`.`observaciones` AS `lote_observaciones`, `l`.`id_estado_proceso` AS `lote_estado`, `l`.`fecha_registro` AS `fecha_registro`, `tv`.`nombre` AS `tipo_venta`, `v`.`fecha_venta` AS `fecha_venta`, `v`.`cantidad` AS `cantidad_vendida`, `v`.`detalle_producto_vendido` AS `venta_detalle_producto`, `d`.`fecha_remojo` AS `fecha_remojo`, `d`.`fecha_despulpado` AS `fecha_despulpado`, `d`.`peso_inicial` AS `despulpado_peso_inicial`, `d`.`peso_final` AS `despulpado_peso_final`, `d`.`peso_despues` AS `despulpado_peso_despues`, `d`.`id_estado_proceso` AS `despulpado_id_estado_proceso`, `d`.`observaciones` AS `despulpado_observaciones`, `fl`.`fecha_inicio_fermentacion` AS `fecha_inicio_fermentacion`, `fl`.`fecha_lavado` AS `fecha_lavado`, `fl`.`peso_inicial` AS `fermentacion_peso_inicial`, `fl`.`peso_final` AS `fermentacion_peso_final`, `fl`.`id_estado_proceso` AS `fermentacion_id_estado_proceso`, `fl`.`observaciones` AS `fermentacion_observaciones`, `z`.`fecha_zarandeo` AS `fecha_zarandeo`, `z`.`peso_inicial` AS `zarandeo_peso_inicial`, `z`.`peso_final` AS `zarandeo_peso_final`, `z`.`id_estado_proceso` AS `zarandeo_id_estado_proceso`, `z`.`observaciones` AS `zarandeo_observaciones`, `s`.`fecha_inicio` AS `secado_fecha_inicio`, `s`.`fecha_fin` AS `secado_fecha_fin`, `s`.`peso_inicial` AS `secado_peso_inicial`, `s`.`peso_final` AS `secado_peso_final`, `s`.`metodo_secado` AS `secado_metodo`, `s`.`humedad_inicial` AS `secado_humedad_inicial`, `s`.`decision_venta` AS `secado_decision_venta`, `s`.`fecha_decision` AS `secado_fecha_decision`, `s`.`id_estado_proceso` AS `secado_id_estado_proceso`, `s`.`observaciones` AS `secado_observaciones`, `c`.`fecha_clasificacion` AS `fecha_clasificacion`, `c`.`peso_inicial` AS `clasificacion_peso_inicial`, `c`.`peso_total` AS `clasificacion_peso_total`, `c`.`peso_pergamino` AS `clasificacion_peso_pergamino`, `c`.`peso_pasilla` AS `clasificacion_peso_pasilla`, `c`.`id_estado_proceso` AS `clasificacion_id_estado_proceso`, `c`.`observaciones` AS `clasificacion_observaciones`, `t`.`fecha_trilla` AS `fecha_trilla`, `t`.`peso_pergamino_inicial` AS `trilla_peso_pergamino_inicial`, `t`.`peso_pasilla_inicial` AS `trilla_peso_pasilla_inicial`, `t`.`peso_pergamino_final` AS `trilla_peso_pergamino_final`, `t`.`peso_pasilla_final` AS `trilla_peso_pasilla_final`, `t`.`peso_final` AS `trilla_peso_final`, `t`.`id_estado_proceso` AS `trilla_id_estado_proceso`, `t`.`observaciones` AS `trilla_observaciones`, `tu`.`tipo_cafe` AS `tueste_tipo_cafe_procesado`, `tu`.`fecha_tueste` AS `tueste_fecha_general`, `tu`.`peso_inicial` AS `tueste_peso_inicial_general`, `tu`.`peso_final` AS `tueste_peso_final_general`, `tu`.`peso_pergamino_inicial` AS `tueste_peso_pergamino_inicial_especifico`, `tu`.`peso_pergamino_final` AS `tueste_peso_pergamino_final_especifico`, `tu`.`peso_pasilla_inicial` AS `tueste_peso_pasilla_inicial_especifico`, `tu`.`peso_pasilla_final` AS `tueste_peso_pasilla_final_especifico`, (case when (`tu`.`tipo_cafe` = 'Pergamino') then `tu`.`tipo_calidad` else NULL end) AS `tueste_tipo_calidad_pergamino`, (case when (`tu`.`tipo_cafe` = 'Pergamino') then `tu`.`nivel_tueste` else NULL end) AS `tueste_nivel_tueste_pergamino`, (case when (`tu`.`tipo_cafe` = 'Pergamino') then `tu`.`fecha_tueste` else NULL end) AS `tueste_fecha_tueste_pergamino`, (case when (`tu`.`tipo_cafe` = 'Pasilla') then `tu`.`tipo_calidad` else NULL end) AS `tueste_tipo_calidad_pasilla`, (case when (`tu`.`tipo_cafe` = 'Pasilla') then `tu`.`nivel_tueste` else NULL end) AS `tueste_nivel_tueste_pasilla`, (case when (`tu`.`tipo_cafe` = 'Pasilla') then `tu`.`fecha_tueste` else NULL end) AS `tueste_fecha_tueste_pasilla`, `tu`.`id_estado_proceso` AS `tueste_id_estado_proceso`, `tu`.`observaciones` AS `tueste_observaciones`, `m`.`fecha_molienda` AS `fecha_molienda`, `m`.`peso_inicial` AS `molienda_peso_inicial`, `m`.`peso_final` AS `molienda_peso_final`, `m`.`es_grano` AS `molienda_es_grano`, `m`.`tipo_molienda` AS `molienda_tipo_molienda`, `m`.`cantidad` AS `molienda_cantidad`, `m`.`id_estado_proceso` AS `molienda_id_estado_proceso`, `m`.`observaciones` AS `molienda_observaciones`, `e`.`fecha_empacado` AS `fecha_empacado`, `e`.`peso_inicial` AS `empacado_peso_inicial`, `e`.`peso_empacado` AS `empacado_peso_empacado`, `e`.`total_empaques` AS `empacado_total_empaques`, `e`.`tipo_producto_empacado` AS `empacado_tipo_producto`, `e`.`id_tueste` AS `empacado_id_tueste`, `e`.`id_molienda` AS `empacado_id_molienda`, `e`.`id_estado_proceso` AS `empacado_id_estado_proceso`, `e`.`observaciones` AS `empacado_observaciones`, `cc`.`fecha_evaluacion` AS `fecha_evaluacion`, `cc`.`peso_inicial` AS `control_calidad_peso_inicial`, `cc`.`peso_final` AS `control_calidad_peso_final`, `cc`.`color_grano` AS `control_calidad_color_grano`, `cc`.`uniformidad` AS `control_calidad_uniformidad`, `cc`.`defectos` AS `control_calidad_defectos`, `cc`.`olor` AS `control_calidad_olor`, `cc`.`apariencia` AS `control_calidad_apariencia`, `cc`.`calificacion` AS `control_calidad_calificacion`, `cc`.`id_estado_proceso` AS `control_calidad_id_estado_proceso`, `cc`.`observaciones` AS `control_calidad_observaciones` FROM (((((((((((((`lotes` `l` left join `destinos_finales` `df` on((`l`.`id_destino_final` = `df`.`id`))) left join `ventas` `v` on((`l`.`id` = `v`.`id_lote`))) left join `tipos_venta` `tv` on((`v`.`id_tipo_venta` = `tv`.`id`))) left join `despulpado` `d` on((`l`.`id` = `d`.`id_lote`))) left join `fermentacion_lavado` `fl` on((`l`.`id` = `fl`.`id_lote`))) left join `zarandeo` `z` on((`l`.`id` = `z`.`id_lote`))) left join `secado` `s` on((`l`.`id` = `s`.`id_lote`))) left join `clasificacion` `c` on((`l`.`id` = `c`.`id_lote`))) left join `trilla` `t` on((`l`.`id` = `t`.`id_lote`))) left join `tueste` `tu` on((`l`.`id` = `tu`.`id_lote`))) left join `molienda` `m` on((`tu`.`id` = `m`.`id_tueste`))) left join `empacado` `e` on(((`l`.`id` = `e`.`id_lote`) and (`e`.`es_historico` = false)))) left join `control_calidad` `cc` on((`l`.`id` = `cc`.`id_lote`))) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clasificacion`
--
ALTER TABLE `clasificacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `control_calidad`
--
ALTER TABLE `control_calidad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `dashboard_cache`
--
ALTER TABLE `dashboard_cache`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario_tipo` (`id_usuario`,`tipo_dato`);

--
-- Indexes for table `despulpado`
--
ALTER TABLE `despulpado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `destinos_finales`
--
ALTER TABLE `destinos_finales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indexes for table `empacado`
--
ALTER TABLE `empacado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_tueste` (`id_tueste`),
  ADD KEY `id_molienda` (`id_molienda`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `estados_proceso`
--
ALTER TABLE `estados_proceso`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fermentacion_lavado`
--
ALTER TABLE `fermentacion_lavado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `fincas`
--
ALTER TABLE `fincas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_usuario_nombre_vereda` (`id_usuario`,`nombre`,`id_municipio_vereda`),
  ADD KEY `id_municipio_vereda` (`id_municipio_vereda`);

--
-- Indexes for table `lotes`
--
ALTER TABLE `lotes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_finca` (`id_finca`),
  ADD KEY `id_destino_final` (`id_destino_final`),
  ADD KEY `fk_lotes_estado_proceso` (`id_estado_proceso`),
  ADD KEY `fk_lotes_proceso_actual` (`id_proceso_actual`);

--
-- Indexes for table `molienda`
--
ALTER TABLE `molienda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_tueste` (`id_tueste`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `municipio_vereda`
--
ALTER TABLE `municipio_vereda`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `dptompio` (`dptompio`,`codigo_ver`);

--
-- Indexes for table `precios_cafe`
--
ALTER TABLE `precios_cafe`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `preguntas_seguridad`
--
ALTER TABLE `preguntas_seguridad`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `procesos`
--
ALTER TABLE `procesos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orden` (`orden`);

--
-- Indexes for table `secado`
--
ALTER TABLE `secado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `seguimiento_secado`
--
ALTER TABLE `seguimiento_secado`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_secado` (`id_secado`);

--
-- Indexes for table `tipos_producto`
--
ALTER TABLE `tipos_producto`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indexes for table `tipos_venta`
--
ALTER TABLE `tipos_venta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indexes for table `trilla`
--
ALTER TABLE `trilla`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `tueste`
--
ALTER TABLE `tueste`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_pregunta_seguridad` (`id_pregunta_seguridad`);

--
-- Indexes for table `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_tipo_venta` (`id_tipo_venta`);

--
-- Indexes for table `zarandeo`
--
ALTER TABLE `zarandeo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_lote` (`id_lote`),
  ADD KEY `id_estado_proceso` (`id_estado_proceso`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clasificacion`
--
ALTER TABLE `clasificacion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `control_calidad`
--
ALTER TABLE `control_calidad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dashboard_cache`
--
ALTER TABLE `dashboard_cache`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `despulpado`
--
ALTER TABLE `despulpado`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `destinos_finales`
--
ALTER TABLE `destinos_finales`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `empacado`
--
ALTER TABLE `empacado`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `estados_proceso`
--
ALTER TABLE `estados_proceso`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `fermentacion_lavado`
--
ALTER TABLE `fermentacion_lavado`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `fincas`
--
ALTER TABLE `fincas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `lotes`
--
ALTER TABLE `lotes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `molienda`
--
ALTER TABLE `molienda`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `municipio_vereda`
--
ALTER TABLE `municipio_vereda`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `precios_cafe`
--
ALTER TABLE `precios_cafe`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `preguntas_seguridad`
--
ALTER TABLE `preguntas_seguridad`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `procesos`
--
ALTER TABLE `procesos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `secado`
--
ALTER TABLE `secado`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `seguimiento_secado`
--
ALTER TABLE `seguimiento_secado`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tipos_producto`
--
ALTER TABLE `tipos_producto`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tipos_venta`
--
ALTER TABLE `tipos_venta`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `trilla`
--
ALTER TABLE `trilla`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tueste`
--
ALTER TABLE `tueste`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `zarandeo`
--
ALTER TABLE `zarandeo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `clasificacion`
--
ALTER TABLE `clasificacion`
  ADD CONSTRAINT `clasificacion_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `clasificacion_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `control_calidad`
--
ALTER TABLE `control_calidad`
  ADD CONSTRAINT `control_calidad_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `control_calidad_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `despulpado`
--
ALTER TABLE `despulpado`
  ADD CONSTRAINT `despulpado_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `despulpado_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `empacado`
--
ALTER TABLE `empacado`
  ADD CONSTRAINT `empacado_ibfk_1` FOREIGN KEY (`id_tueste`) REFERENCES `tueste` (`id`),
  ADD CONSTRAINT `empacado_ibfk_2` FOREIGN KEY (`id_molienda`) REFERENCES `molienda` (`id`),
  ADD CONSTRAINT `empacado_ibfk_4` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `fermentacion_lavado`
--
ALTER TABLE `fermentacion_lavado`
  ADD CONSTRAINT `fermentacion_lavado_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `fermentacion_lavado_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `fincas`
--
ALTER TABLE `fincas`
  ADD CONSTRAINT `fincas_ibfk_2` FOREIGN KEY (`id_municipio_vereda`) REFERENCES `municipio_vereda` (`id`),
  ADD CONSTRAINT `fk_fincas_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lotes`
--
ALTER TABLE `lotes`
  ADD CONSTRAINT `fk_lotes_estado_proceso` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`),
  ADD CONSTRAINT `fk_lotes_proceso_actual` FOREIGN KEY (`id_proceso_actual`) REFERENCES `procesos` (`id`),
  ADD CONSTRAINT `lotes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `lotes_ibfk_2` FOREIGN KEY (`id_finca`) REFERENCES `fincas` (`id`),
  ADD CONSTRAINT `lotes_ibfk_3` FOREIGN KEY (`id_destino_final`) REFERENCES `destinos_finales` (`id`);

--
-- Constraints for table `molienda`
--
ALTER TABLE `molienda`
  ADD CONSTRAINT `molienda_ibfk_1` FOREIGN KEY (`id_tueste`) REFERENCES `tueste` (`id`),
  ADD CONSTRAINT `molienda_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `secado`
--
ALTER TABLE `secado`
  ADD CONSTRAINT `secado_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `secado_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `seguimiento_secado`
--
ALTER TABLE `seguimiento_secado`
  ADD CONSTRAINT `seguimiento_secado_ibfk_1` FOREIGN KEY (`id_secado`) REFERENCES `secado` (`id`);

--
-- Constraints for table `trilla`
--
ALTER TABLE `trilla`
  ADD CONSTRAINT `trilla_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `trilla_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `tueste`
--
ALTER TABLE `tueste`
  ADD CONSTRAINT `tueste_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `tueste_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_pregunta_seguridad`) REFERENCES `preguntas_seguridad` (`id`);

--
-- Constraints for table `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`id_tipo_venta`) REFERENCES `tipos_venta` (`id`);

--
-- Constraints for table `zarandeo`
--
ALTER TABLE `zarandeo`
  ADD CONSTRAINT `zarandeo_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  ADD CONSTRAINT `zarandeo_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
