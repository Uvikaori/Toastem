USE toastem_db;


DROP VIEW IF EXISTS `vista_flujo_lote`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_flujo_lote` AS 
SELECT 
  `l`.`id` AS `lote_id`, 
  `l`.`codigo` AS `lote_codigo`, 
  `l`.`fecha_recoleccion` AS `fecha_recoleccion`, 
  `l`.`peso_inicial` AS `lote_peso_inicial`, 
  `df`.`nombre` AS `destino_final`, 
  `l`.`fecha_finalizacion` AS `fecha_finalizacion`, 
  `tv`.`nombre` AS `tipo_venta`, 
  `v`.`fecha_venta` AS `fecha_venta`, 
  `v`.`cantidad` AS `cantidad_vendida`, 
  
  -- Despulpado
  `d`.`fecha_remojo` AS `fecha_remojo`, 
  `d`.`fecha_despulpado` AS `fecha_despulpado`, 
  `d`.`peso_inicial` AS `despulpado_peso_inicial`, 
  `d`.`peso_final` AS `despulpado_peso_final`, 
  `d`.`id_estado_proceso` AS `despulpado_id_estado_proceso`, 
  
  -- Fermentación y Lavado
  `fl`.`fecha_inicio_fermentacion` AS `fecha_inicio_fermentacion`, 
  `fl`.`fecha_lavado` AS `fecha_lavado`, 
  `fl`.`peso_inicial` AS `fermentacion_peso_inicial`, 
  `fl`.`peso_final` AS `fermentacion_peso_final`, 
  `fl`.`id_estado_proceso` AS `fermentacion_id_estado_proceso`, 
  
  -- Zarandeo
  `z`.`fecha_zarandeo` AS `fecha_zarandeo`, 
  `z`.`peso_inicial` AS `zarandeo_peso_inicial`, 
  `z`.`peso_final` AS `zarandeo_peso_final`, 
  `z`.`id_estado_proceso` AS `zarandeo_id_estado_proceso`, 
  
  -- Secado
  `s`.`fecha_inicio` AS `secado_fecha_inicio`, 
  `s`.`fecha_fin` AS `secado_fecha_fin`, 
  `s`.`peso_inicial` AS `secado_peso_inicial`, 
  `s`.`peso_final` AS `secado_peso_final`, 
  `s`.`decision_venta` AS `secado_decision_venta`, 
  `s`.`fecha_decision` AS `secado_fecha_decision`, 
  `s`.`id_estado_proceso` AS `secado_id_estado_proceso`, 
  
  -- Clasificación (actualizado)
  `c`.`fecha_clasificacion` AS `fecha_clasificacion`, 
  `c`.`peso_inicial` AS `clasificacion_peso_inicial`, 
  `c`.`peso_total` AS `clasificacion_peso_total`, 
  `c`.`peso_pergamino` AS `clasificacion_peso_pergamino`, 
  `c`.`peso_pasilla` AS `clasificacion_peso_pasilla`, 
  `c`.`id_estado_proceso` AS `clasificacion_id_estado_proceso`, 
  
  -- Trilla
  `t`.`fecha_trilla` AS `fecha_trilla`, 
  `t`.`peso_inicial` AS `trilla_peso_inicial`, 
  `t`.`peso_final` AS `trilla_peso_final`, 
  `t`.`id_estado_proceso` AS `trilla_id_estado_proceso`, 
  
  -- Tueste
  `tu`.`fecha_tueste` AS `fecha_tueste`, 
  `tu`.`peso_inicial` AS `tueste_peso_inicial`, 
  `tu`.`peso_final` AS `tueste_peso_final`, 
  `tu`.`tipo_calidad` AS `tueste_tipo_calidad`, 
  `tu`.`nivel_tueste` AS `tueste_nivel_tueste`, 
  `tu`.`id_estado_proceso` AS `tueste_id_estado_proceso`, 
  
  -- Molienda
  `m`.`fecha_molienda` AS `fecha_molienda`, 
  `m`.`peso_inicial` AS `molienda_peso_inicial`, 
  `m`.`peso_final` AS `molienda_peso_final`, 
  `m`.`es_grano` AS `molienda_es_grano`, 
  `m`.`tipo_molienda` AS `molienda_tipo_molienda`, 
  `m`.`id_estado_proceso` AS `molienda_id_estado_proceso`, 
  
  -- Empacado (actualizado)
  `e`.`fecha_empacado` AS `fecha_empacado`, 
  `e`.`peso_inicial` AS `empacado_peso_inicial`,
  `e`.`peso_empacado` AS `empacado_peso_empacado`, 
  `e`.`total_empaques` AS `empacado_total_empaques`, 
  `e`.`tipo_producto_empacado` AS `empacado_tipo_producto`, 
  `e`.`id_estado_proceso` AS `empacado_id_estado_proceso`, 
  
  -- Control de Calidad
  `cc`.`fecha_evaluacion` AS `fecha_evaluacion`, 
  `cc`.`peso_inicial` AS `control_calidad_peso_inicial`, 
  `cc`.`peso_final` AS `control_calidad_peso_final`, 
  `cc`.`color_grano` AS `control_calidad_color_grano`, 
  `cc`.`uniformidad` AS `control_calidad_uniformidad`, 
  `cc`.`defectos` AS `control_calidad_defectos`, 
  `cc`.`olor` AS `control_calidad_olor`, 
  `cc`.`apariencia` AS `control_calidad_apariencia`, 
  `cc`.`calificacion` AS `control_calidad_calificacion`, 
  `cc`.`id_estado_proceso` AS `control_calidad_id_estado_proceso` 
FROM 
  `lotes` `l` 
  LEFT JOIN `destinos_finales` `df` ON (`l`.`id_destino_final` = `df`.`id`) 
  LEFT JOIN `ventas` `v` ON (`l`.`id` = `v`.`id_lote`) 
  LEFT JOIN `tipos_venta` `tv` ON (`v`.`id_tipo_venta` = `tv`.`id`) 
  LEFT JOIN `despulpado` `d` ON (`l`.`id` = `d`.`id_lote`) 
  LEFT JOIN `fermentacion_lavado` `fl` ON (`l`.`id` = `fl`.`id_lote`) 
  LEFT JOIN `zarandeo` `z` ON (`l`.`id` = `z`.`id_lote`) 
  LEFT JOIN `secado` `s` ON (`l`.`id` = `s`.`id_lote`) 
  LEFT JOIN `clasificacion` `c` ON (`l`.`id` = `c`.`id_lote`) 
  LEFT JOIN `trilla` `t` ON (`l`.`id` = `t`.`id_lote`) 
  LEFT JOIN `tueste` `tu` ON (`l`.`id` = `tu`.`id_lote`) 
  LEFT JOIN `molienda` `m` ON (`tu`.`id` = `m`.`id_tueste`) 
  LEFT JOIN `empacado` `e` ON (`l`.`id` = `e`.`id_lote`) 
  LEFT JOIN `control_calidad` `cc` ON (`l`.`id` = `cc`.`id_lote`); 