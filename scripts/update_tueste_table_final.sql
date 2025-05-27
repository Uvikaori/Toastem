USE toastem_db;

-- Crear tabla temporal para almacenar los datos existentes
CREATE TABLE IF NOT EXISTS `tueste_temp` AS 
SELECT * FROM `tueste`;

-- Renombrar la tabla actual (en lugar de eliminarla)
RENAME TABLE `tueste` TO `tueste_old`;

-- Crear la tabla con la estructura correcta que espera el código
CREATE TABLE `tueste` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_lote` int NOT NULL,
  `fecha_tueste` date NOT NULL,
  `peso_inicial` decimal(10,2) DEFAULT NULL,
  
  -- Campos para pergamino
  `peso_pergamino_inicial` decimal(10,2) DEFAULT NULL,
  `tipo_calidad_pergamino` enum('Premium','Normal') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nivel_tueste_pergamino` enum('Alto','Medio','Bajo') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_tueste_pergamino` date DEFAULT NULL,
  `peso_pergamino_final` decimal(10,2) DEFAULT NULL,
  
  -- Campos para pasilla
  `peso_pasilla_inicial` decimal(10,2) DEFAULT NULL,
  `tipo_calidad_pasilla` enum('Baja') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Baja',
  `nivel_tueste_pasilla` enum('Alto') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'Alto',
  `fecha_tueste_pasilla` date DEFAULT NULL,
  `peso_pasilla_final` decimal(10,2) DEFAULT NULL,
  
  -- Campos generales
  `peso_final` decimal(10,2) DEFAULT NULL,
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_estado_proceso` int DEFAULT '1',
  
  PRIMARY KEY (`id`),
  KEY `id_lote` (`id_lote`),
  KEY `id_estado_proceso` (`id_estado_proceso`),
  CONSTRAINT `tueste_ibfk_1` FOREIGN KEY (`id_lote`) REFERENCES `lotes` (`id`),
  CONSTRAINT `tueste_ibfk_2` FOREIGN KEY (`id_estado_proceso`) REFERENCES `estados_proceso` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar los datos desde la tabla temporal a la nueva estructura
INSERT INTO `tueste` (
  `id`,
  `id_lote`, 
  `fecha_tueste`, 
  `peso_inicial`,
  `peso_pergamino_inicial`, 
  `tipo_calidad_pergamino`, 
  `nivel_tueste_pergamino`, 
  `fecha_tueste_pergamino`, 
  `peso_pergamino_final`,
  `peso_pasilla_inicial`,
  `tipo_calidad_pasilla`,
  `nivel_tueste_pasilla`,
  `fecha_tueste_pasilla`,
  `peso_pasilla_final`,
  `peso_final`, 
  `observaciones`, 
  `id_estado_proceso`
)
SELECT 
  `id`,
  `id_lote`, 
  `fecha_tueste`, 
  `peso_inicial`,
  CASE WHEN `tipo_cafe` = 'Pergamino' THEN `peso_pergamino_inicial` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pergamino' THEN `tipo_calidad` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pergamino' THEN `nivel_tueste` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pergamino' THEN `fecha_tueste` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pergamino' THEN `peso_pergamino_final` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pasilla' THEN `peso_pasilla_inicial` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pasilla' THEN 'Baja' ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pasilla' THEN 'Alto' ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pasilla' THEN `fecha_tueste` ELSE NULL END,
  CASE WHEN `tipo_cafe` = 'Pasilla' THEN `peso_pasilla_final` ELSE NULL END,
  `peso_final`,
  `observaciones`,
  `id_estado_proceso`
FROM `tueste_temp`;

-- Actualizar las referencias en molienda
UPDATE `molienda` SET `id_tueste` = (
  SELECT `id` FROM `tueste` WHERE `id_lote` = (
    SELECT `id_lote` FROM `tueste_old` WHERE `id` = `molienda`.`id_tueste`
  )
);

-- Actualizar las referencias en empacado
UPDATE `empacado` SET `id_tueste` = (
  SELECT `id` FROM `tueste` WHERE `id_lote` = (
    SELECT `id_lote` FROM `tueste_old` WHERE `id` = `empacado`.`id_tueste`
  )
) 
WHERE `id_tueste` IS NOT NULL;

-- Actualizar la vista vista_flujo_lote para que use los nuevos campos
DROP VIEW IF EXISTS `vista_flujo_lote`; 

CREATE VIEW `vista_flujo_lote` AS
SELECT
    `l`.`id` AS `lote_id`,
    `l`.`codigo` AS `lote_codigo`,
    `l`.`fecha_recoleccion` AS `fecha_recoleccion`,
    `l`.`peso_inicial` AS `lote_peso_inicial`,
    `l`.`tipo_recoleccion` AS `tipo_recoleccion`,
    `l`.`tipo_cafe` AS `tipo_cafe`,
    `df`.`nombre` AS `destino_final`,
    `l`.`fecha_finalizacion` AS `fecha_finalizacion`,
    `l`.`observaciones` AS `lote_observaciones`,
    `l`.`id_estado_proceso` AS `lote_estado`,
    `l`.`fecha_registro` AS `fecha_registro`,
    `tv`.`nombre` AS `tipo_venta`,
    `v`.`fecha_venta` AS `fecha_venta`,
    `v`.`cantidad` AS `cantidad_vendida`,
    `d`.`fecha_remojo` AS `fecha_remojo`,
    `d`.`fecha_despulpado` AS `fecha_despulpado`,
    `d`.`peso_inicial` AS `despulpado_peso_inicial`,
    `d`.`peso_final` AS `despulpado_peso_final`,
    `d`.`peso_despues` AS `despulpado_peso_despues`,
    `d`.`id_estado_proceso` AS `despulpado_id_estado_proceso`,
    `d`.`observaciones` AS `despulpado_observaciones`,
    `fl`.`fecha_inicio_fermentacion` AS `fecha_inicio_fermentacion`,
    `fl`.`fecha_lavado` AS `fecha_lavado`,
    `fl`.`peso_inicial` AS `fermentacion_peso_inicial`,
    `fl`.`peso_final` AS `fermentacion_peso_final`,
    `fl`.`id_estado_proceso` AS `fermentacion_id_estado_proceso`,
    `fl`.`observaciones` AS `fermentacion_observaciones`,
    `z`.`fecha_zarandeo` AS `fecha_zarandeo`,
    `z`.`peso_inicial` AS `zarandeo_peso_inicial`,
    `z`.`peso_final` AS `zarandeo_peso_final`,
    `z`.`id_estado_proceso` AS `zarandeo_id_estado_proceso`,
    `z`.`observaciones` AS `zarandeo_observaciones`,
    `s`.`fecha_inicio` AS `secado_fecha_inicio`,
    `s`.`fecha_fin` AS `secado_fecha_fin`,
    `s`.`peso_inicial` AS `secado_peso_inicial`,
    `s`.`peso_final` AS `secado_peso_final`,
    `s`.`metodo_secado` AS `secado_metodo`,
    `s`.`humedad_inicial` AS `secado_humedad_inicial`,
    `s`.`decision_venta` AS `secado_decision_venta`,
    `s`.`fecha_decision` AS `secado_fecha_decision`,
    `s`.`id_estado_proceso` AS `secado_id_estado_proceso`,
    `s`.`observaciones` AS `secado_observaciones`,
    `c`.`fecha_clasificacion` AS `fecha_clasificacion`,
    `c`.`peso_inicial` AS `clasificacion_peso_inicial`,
    `c`.`peso_total` AS `clasificacion_peso_total`,
    `c`.`peso_pergamino` AS `clasificacion_peso_pergamino`,
    `c`.`peso_pasilla` AS `clasificacion_peso_pasilla`,
    `c`.`id_estado_proceso` AS `clasificacion_id_estado_proceso`,
    `c`.`observaciones` AS `clasificacion_observaciones`,
    `t`.`fecha_trilla` AS `fecha_trilla`,
    `t`.`peso_pergamino_inicial` AS `trilla_peso_pergamino_inicial`,
    `t`.`peso_pasilla_inicial` AS `trilla_peso_pasilla_inicial`,
    `t`.`peso_pergamino_final` AS `trilla_peso_pergamino_final`,
    `t`.`peso_pasilla_final` AS `trilla_peso_pasilla_final`,
    `t`.`peso_final` AS `trilla_peso_final`,
    `t`.`id_estado_proceso` AS `trilla_id_estado_proceso`,
    `t`.`observaciones` AS `trilla_observaciones`,
    `tu`.`fecha_tueste` AS `fecha_tueste`,
    `tu`.`peso_inicial` AS `tueste_peso_inicial`,
    `tu`.`peso_final` AS `tueste_peso_final`,
    
    -- Campos nuevos para pergamino
    `tu`.`peso_pergamino_inicial` AS `tueste_peso_pergamino_inicial`,
    `tu`.`tipo_calidad_pergamino` AS `tueste_tipo_calidad_pergamino`,
    `tu`.`nivel_tueste_pergamino` AS `tueste_nivel_tueste_pergamino`,
    `tu`.`fecha_tueste_pergamino` AS `tueste_fecha_pergamino`,
    `tu`.`peso_pergamino_final` AS `tueste_peso_pergamino_final`,
    
    -- Campos nuevos para pasilla
    `tu`.`peso_pasilla_inicial` AS `tueste_peso_pasilla_inicial`,
    `tu`.`tipo_calidad_pasilla` AS `tueste_tipo_calidad_pasilla`,
    `tu`.`nivel_tueste_pasilla` AS `tueste_nivel_tueste_pasilla`,
    `tu`.`fecha_tueste_pasilla` AS `tueste_fecha_pasilla`,
    `tu`.`peso_pasilla_final` AS `tueste_peso_pasilla_final`,
    
    `tu`.`id_estado_proceso` AS `tueste_id_estado_proceso`,
    `tu`.`observaciones` AS `tueste_observaciones`,
    `m`.`fecha_molienda` AS `fecha_molienda`,
    `m`.`peso_inicial` AS `molienda_peso_inicial`,
    `m`.`peso_final` AS `molienda_peso_final`,
    `m`.`es_grano` AS `molienda_es_grano`,
    `m`.`tipo_molienda` AS `molienda_tipo_molienda`,
    `m`.`cantidad` AS `molienda_cantidad`,
    `m`.`id_estado_proceso` AS `molienda_id_estado_proceso`,
    `m`.`observaciones` AS `molienda_observaciones`,
    `e`.`fecha_empacado` AS `fecha_empacado`,
    `e`.`peso_inicial` AS `empacado_peso_inicial`,
    `e`.`peso_empacado` AS `empacado_peso_empacado`,
    `e`.`total_empaques` AS `empacado_total_empaques`,
    `e`.`tipo_producto_empacado` AS `empacado_tipo_producto`,
    `e`.`id_tueste` AS `empacado_id_tueste`,
    `e`.`id_molienda` AS `empacado_id_molienda`,
    `e`.`id_estado_proceso` AS `empacado_id_estado_proceso`,
    `e`.`observaciones` AS `empacado_observaciones`,
    `cc`.`fecha_evaluacion` AS `fecha_evaluacion`,
    `cc`.`peso_inicial` AS `control_calidad_peso_inicial`,
    `cc`.`peso_final` AS `control_calidad_peso_final`,
    `cc`.`color_grano` AS `control_calidad_color_grano`,
    `cc`.`uniformidad` AS `control_calidad_uniformidad`,
    `cc`.`defectos` AS `control_calidad_defectos`,
    `cc`.`olor` AS `control_calidad_olor`,
    `cc`.`apariencia` AS `control_calidad_apariencia`,
    `cc`.`calificacion` AS `control_calidad_calificacion`,
    `cc`.`id_estado_proceso` AS `control_calidad_id_estado_proceso`,
    `cc`.`observaciones` AS `control_calidad_observaciones`
FROM
    `lotes` `l`
    LEFT JOIN `destinos_finales` `df` ON `l`.`id_destino_final` = `df`.`id`
    LEFT JOIN `ventas` `v` ON `l`.`id` = `v`.`id_lote`
    LEFT JOIN `tipos_venta` `tv` ON `v`.`id_tipo_venta` = `tv`.`id`
    LEFT JOIN `despulpado` `d` ON `l`.`id` = `d`.`id_lote`
    LEFT JOIN `fermentacion_lavado` `fl` ON `l`.`id` = `fl`.`id_lote`
    LEFT JOIN `zarandeo` `z` ON `l`.`id` = `z`.`id_lote`
    LEFT JOIN `secado` `s` ON `l`.`id` = `s`.`id_lote`
    LEFT JOIN `clasificacion` `c` ON `l`.`id` = `c`.`id_lote`
    LEFT JOIN `trilla` `t` ON `l`.`id` = `t`.`id_lote`
    LEFT JOIN `tueste` `tu` ON `l`.`id` = `tu`.`id_lote`
    LEFT JOIN `molienda` `m` ON `tu`.`id` = `m`.`id_tueste`
    LEFT JOIN `empacado` `e` ON `l`.`id` = `e`.`id_lote`
    LEFT JOIN `control_calidad` `cc` ON `l`.`id` = `cc`.`id_lote`;

-- Eliminar las tablas temporales
DROP TABLE IF EXISTS `tueste_temp`;
-- No eliminamos tueste_old aún como medida de seguridad
-- DROP TABLE IF EXISTS `tueste_old`;

-- Mensaje de finalización
SELECT 'La actualización de la tabla tueste se ha completado correctamente. Se ha conservado la tabla original como tueste_old por seguridad.' AS 'Mensaje'; 