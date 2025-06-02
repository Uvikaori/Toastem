-- Añadir columna tipo_cafe a la tabla molienda
ALTER TABLE molienda ADD COLUMN tipo_cafe ENUM('Pergamino', 'Pasilla') DEFAULT NULL AFTER id_tueste;

-- Modificar la columna tipo_molienda para aceptar los valores correctos
ALTER TABLE molienda MODIFY COLUMN tipo_molienda ENUM('Granulado','Fino') NOT NULL; 