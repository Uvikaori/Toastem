-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS toastem_db;
USE toastem_db;

-- Tabla para preguntas de seguridad predefinidas
CREATE TABLE preguntas_seguridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta VARCHAR(255) NOT NULL
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    id_pregunta_seguridad INT,
    respuesta_seguridad VARCHAR(255) NOT NULL,
    -- nombre_finca VARCHAR(100) NOT NULL,
    -- ubicacion_finca VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pregunta_seguridad) REFERENCES preguntas_seguridad(id)
);

-- Eliminar datos de finca de tabla usuarios, si existiese
ALTER TABLE usuarios
DROP COLUMN nombre_finca,
DROP COLUMN ubicacion_finca;

-- Tabla de fincas (para posible expansión futura)
CREATE TABLE fincas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- Tabla de lotes
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    id_usuario INT NOT NULL,
    id_finca INT,
    fecha_recoleccion DATE NOT NULL,
    peso_inicial DECIMAL(10,2) NOT NULL,
    tipo_cafe ENUM('Rojo', 'Amarillo', 'Mezcla') NOT NULL,
    tipo_recoleccion ENUM('Selectiva', 'General') NOT NULL,
    observaciones TEXT,
    estado ENUM('Recolectado', 'Despulpado', 'Lavado', 'Zarandeado', 'En Secado', 'Seco', 'Clasificado', 'Trillado', 'Tostado', 'Molido', 'Empacado') DEFAULT 'Recolectado',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_finca) REFERENCES fincas(id)
);

-- Tabla para el proceso de despulpado
CREATE TABLE despulpado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_remojo DATETIME NOT NULL,
    fecha_despulpado DATETIME NOT NULL,
    peso_despues DECIMAL(10,2),
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de fermentación y lavado
CREATE TABLE fermentacion_lavado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_inicio_fermentacion DATETIME NOT NULL,
    fecha_lavado DATETIME NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de zarandeo
CREATE TABLE zarandeo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_zarandeo DATETIME NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de secado
CREATE TABLE secado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    metodo_secado ENUM('Sol', 'Malla') NOT NULL,
    humedad_inicial DECIMAL(5,2),
    fecha_fin DATETIME,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para seguimiento diario de secado (opcional)
CREATE TABLE seguimiento_secado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_secado INT NOT NULL,
    fecha DATE NOT NULL,
    condiciones_climaticas VARCHAR(255),
    observaciones TEXT,
    FOREIGN KEY (id_secado) REFERENCES secado(id)
);

-- Tabla para clasificación del café
CREATE TABLE clasificacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_clasificacion DATE NOT NULL,
    peso_cafe_bueno DECIMAL(10,2) NOT NULL,
    peso_cafe_negro DECIMAL(10,2) DEFAULT 0,
    peso_cafe_partido DECIMAL(10,2) DEFAULT 0,
    peso_cafe_amarillo DECIMAL(10,2) DEFAULT 0,
    peso_cafe_brocado DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de trilla
CREATE TABLE trilla (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_trilla DATE NOT NULL,
    peso_premium DECIMAL(10,2) DEFAULT 0,
    peso_normal DECIMAL(10,2) DEFAULT 0,
    peso_bajo DECIMAL(10,2) DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de tueste
CREATE TABLE tueste (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    tipo_calidad ENUM('Premium', 'Normal', 'Baja') NOT NULL,
    fecha_tueste DATE NOT NULL,
    nivel_tueste ENUM('Alto', 'Medio', 'Bajo') NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para el proceso de molienda (opcional)
CREATE TABLE molienda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tueste INT NOT NULL,
    fecha_molienda DATE NOT NULL,
    tipo_molienda ENUM('Granulado', 'Fino') NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_tueste) REFERENCES tueste(id)
);

-- Tabla para el proceso de empacado (opcional)
CREATE TABLE empacado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_empacado DATE NOT NULL,
    tipo_empaque VARCHAR(100) NOT NULL,
    peso_empacado DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para evaluación de calidad (opcional)
CREATE TABLE control_calidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_evaluacion DATE NOT NULL,
    color_grano ENUM('Claro', 'Medio', 'Oscuro') NOT NULL,
    uniformidad ENUM('Uniforme', 'Poco uniforme', 'No uniforme') NOT NULL,
    defectos ENUM('Ninguno', 'Pocos', 'Muchos') NOT NULL,
    olor ENUM('Bueno', 'Normal', 'Malo') NOT NULL,
    apariencia ENUM('Buena', 'Normal', 'Mala') NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id)
);

-- Tabla para almacenar el precio del café (actualizado diariamente)
CREATE TABLE precios_cafe (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    precio_kg DECIMAL(10,2) NOT NULL,
    fuente VARCHAR(255) NOT NULL
);

-- Insertar preguntas de seguridad predefinidas
INSERT INTO preguntas_seguridad (pregunta) VALUES 
('¿Cuál fue el nombre de tu primera mascota?'),
('¿En qué ciudad naciste?'),
('¿Cuál es el nombre de tu madre?'),
('¿Cuál fue tu primer colegio?'),
('¿Cuál es tu color favorito?');

-- Crear la base de datos (Si no existe)
CREATE DATABASE IF NOT EXISTS toastem_db;
USE toastem_db;

-- Crear tabla de procesos
CREATE TABLE procesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    orden INT NOT NULL UNIQUE COMMENT 'Orden en el flujo del proceso'
);

INSERT INTO procesos (nombre, descripcion, orden) VALUES 
('Recolección', 'Proceso de recolección del café', 1),
('Despulpado', 'Proceso de despulpado del café', 2),
('Fermentación y Lavado', 'Proceso de fermentación y lavado del café', 3),
('Zarandeo', 'Proceso de zarandeo del café', 4),
('Secado', 'Proceso de secado del café', 5),
('Clasificación', 'Proceso de clasificación del café', 6),
('Trilla', 'Proceso de trilla del café', 7),
('Tueste', 'Proceso de tueste del café', 8),
('Molienda', 'Proceso de molienda del café (opcional)', 9),
('Empacado', 'Proceso de empacado del café', 10),
('Control de Calidad', 'Proceso de control de calidad del café', 11);

-- Crear tabla de estados de proceso
CREATE TABLE estados_proceso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    descripcion VARCHAR(100)
);

INSERT INTO estados_proceso (nombre, descripcion) VALUES 
('Por hacer', 'Proceso aún no iniciado'),
('En progreso', 'Proceso en ejecución'),
('Terminado', 'Proceso completado'),
('Cancelado', 'Proceso cancelado'),
('Finalizado', 'Proceso finalizado y producto vendido');

-- Crear tabla municipio_vereda
CREATE TABLE municipio_vereda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dptompio INT(5) NOT NULL COMMENT 'Número de 5 dígitos (código departamento + municipio)',
    codigo_ver INT(8) NOT NULL COMMENT 'Número de 8 dígitos',
    nom_dep VARCHAR(100) NOT NULL,
    nomb_mpio VARCHAR(100) NOT NULL,
    nombre_ver VARCHAR(100) NOT NULL,
    cod_dpto INT(2) NOT NULL COMMENT 'Número de 2 dígitos',
    UNIQUE KEY (dptompio, codigo_ver)
);

-- Modificar tabla fincas para relacionar con municipio_vereda
ALTER TABLE fincas
ADD COLUMN id_municipio_vereda INT,
ADD FOREIGN KEY (id_municipio_vereda) REFERENCES municipio_vereda(id);

-- Modificar tabla molienda para relacionar con tueste
ALTER TABLE molienda
CHANGE COLUMN id_tueste id_tueste INT NOT NULL,
ADD COLUMN es_grano BOOLEAN NOT NULL DEFAULT FALSE AFTER fecha_molienda;

-- Modificar tabla empacado para relacionar con tueste y molienda
ALTER TABLE empacado
DROP FOREIGN KEY empacado_ibfk_1;

ALTER TABLE empacado
ADD COLUMN id_tueste INT,
ADD COLUMN id_molienda INT,
ADD FOREIGN KEY (id_tueste) REFERENCES tueste(id),
ADD FOREIGN KEY (id_molienda) REFERENCES molienda(id),
ADD CONSTRAINT chk_empacado_origen CHECK (
    (id_tueste IS NOT NULL AND id_molienda IS NULL) OR
    (id_tueste IS NULL AND id_molienda IS NOT NULL)
);

-- Modificar tabla clasificacion (desde db_setup.sql)
ALTER TABLE clasificacion
DROP COLUMN peso_cafe_negro,
DROP COLUMN peso_cafe_partido,
DROP COLUMN peso_cafe_amarillo,
DROP COLUMN peso_cafe_brocado;

-- Modificar tabla clasificacion (adiciones)
ALTER TABLE clasificacion
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_total DECIMAL(10,2) AFTER fecha_clasificacion,
ADD COLUMN peso_pergamino DECIMAL(10,2) AFTER peso_total,
ADD COLUMN peso_pasilla DECIMAL(10,2) AFTER peso_pergamino,
ADD COLUMN peso_otro VARCHAR(255) AFTER peso_pasilla;

-- Añadir estado_proceso y pesos inicial/final a las tablas de procesos individuales
ALTER TABLE despulpado
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_despulpado;

ALTER TABLE fermentacion_lavado
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_lavado;

ALTER TABLE zarandeo
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_zarandeo;

ALTER TABLE secado
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_fin;

ALTER TABLE trilla
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_trilla;

ALTER TABLE tueste
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_tueste;

ALTER TABLE molienda
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_tueste,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_molienda;

ALTER TABLE empacado
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_empacado;

ALTER TABLE control_calidad
ADD COLUMN id_estado_proceso INT DEFAULT 1,
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id),
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_evaluacion;

-- Crear tablas de referencia
CREATE TABLE tipos_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO tipos_venta (nombre, descripcion) VALUES
('Pergamino', 'Venta de café en pergamino'),
('Trillado', 'Venta de café trillado (verde)'),
('Tostado', 'Venta de café tostado'),
('Molido', 'Venta de café molido');

CREATE TABLE destinos_finales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO destinos_finales (nombre, descripcion) VALUES
('Proceso completo', 'El lote sigue todo el proceso hasta el empacado'),
('Venta como pergamino', 'El lote se vende después del secado'),
('Venta como tostado (grano)', 'El lote se vende tostado en grano'), 
('Venta como molido', 'El lote se vende molido');

CREATE TABLE tipos_producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

INSERT INTO tipos_producto (nombre, descripcion) VALUES
('Pergamino', 'Café en pergamino'),
('Grano', 'Café empacado en grano'),
('Molido', 'Café empacado molido');

-- Modificar tabla ventas
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    fecha_venta DATE NOT NULL,
    id_tipo_venta INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_kg DECIMAL(10,2) NOT NULL,
    comprador VARCHAR(100),
    observaciones TEXT,
    FOREIGN KEY (id_lote) REFERENCES lotes(id),
    FOREIGN KEY (id_tipo_venta) REFERENCES tipos_venta(id)
);

-- Modificar tabla lotes
ALTER TABLE lotes
ADD COLUMN id_destino_final INT DEFAULT 1,
ADD COLUMN fecha_finalizacion DATE,
FOREIGN KEY (id_destino_final) REFERENCES destinos_finales(id),
DROP COLUMN estado,
DROP COLUMN tipo_cafe; -- Eliminar la columna ENUM anterior

-- Modificar tabla secado
ALTER TABLE secado
ADD COLUMN decision_venta BOOLEAN DEFAULT FALSE,
ADD COLUMN fecha_decision DATETIME;
-- No necesitamos una tabla tipos_decision, ya que es un simple booleano

-- Modificar tabla empacado
ALTER TABLE empacado
ADD COLUMN id_tipo_producto INT NOT NULL DEFAULT 1,
ADD FOREIGN KEY (id_tipo_producto) REFERENCES tipos_producto(id),
DROP COLUMN tipo_empaque; -- Eliminar la columna VARCHAR anterior

