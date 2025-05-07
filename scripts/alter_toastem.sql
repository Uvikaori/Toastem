USE toastem_db;

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

CREATE TABLE municipio_vereda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_ver INT(8) NOT NULL COMMENT 'Número de 8 dígitos',
    nom_dep VARCHAR(100) NOT NULL,
    nomb_mpio VARCHAR(100) NOT NULL, 
    nombre_ver VARCHAR(100) NOT NULL,
    cod_dpto INT(2) NOT NULL COMMENT 'Número de 2 dígitos',
    dptompio INT(5) NOT NULL COMMENT 'Número de 5 dígitos (código departamento + municipio)'
    UNIQUE KEY (dptompio, codigo_ver) 
);

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

-- Bloque 2: Modificación de Tablas Existentes (Sin añadir FKs todavía donde sea posible)

-- Modificar tabla fincas
ALTER TABLE fincas
ADD COLUMN id_municipio_vereda INT;
-- La FK se añade en el Bloque 4

-- Modificar tabla molienda
ALTER TABLE molienda
CHANGE COLUMN id_tueste id_tueste INT NOT NULL,
ADD COLUMN es_grano BOOLEAN NOT NULL DEFAULT FALSE AFTER fecha_molienda;
-- Asume que la tabla molienda y tueste existen del setup inicial

-- Modificar tabla empacado (Manejo de FKs)
-- Asumiendo que la FK 'empacado_ibfk_1' existe y referencia a 'lotes'
ALTER TABLE empacado DROP FOREIGN KEY empacado_ibfk_1;
-- Añadir columnas nuevas
ALTER TABLE empacado
ADD COLUMN id_tueste INT,
ADD COLUMN id_molienda INT,
ADD COLUMN id_tipo_producto INT NOT NULL DEFAULT 1 AFTER peso_empacado, -- Reubicado para agrupar
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones, -- Reubicado para agrupar
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote, -- Nombre de columna id_lote puede variar si se eliminó FK
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_empacado;
-- Eliminar columna antigua
ALTER TABLE empacado DROP COLUMN tipo_empaque;
-- La FK a tipos_producto, estados_proceso y la CHECK se añaden en el Bloque 4

-- Modificar tabla clasificacion
ALTER TABLE clasificacion
DROP COLUMN peso_cafe_negro,
DROP COLUMN peso_cafe_partido,
DROP COLUMN peso_cafe_amarillo,
DROP COLUMN peso_cafe_brocado;

ALTER TABLE clasificacion
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones, -- Reubicado
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_total DECIMAL(10,2) AFTER fecha_clasificacion, -- Renombrado de peso_cafe_bueno? Verificar setup inicial
ADD COLUMN peso_pergamino DECIMAL(10,2) AFTER peso_total,
ADD COLUMN peso_pasilla DECIMAL(10,2) AFTER peso_pergamino,
ADD COLUMN peso_otro VARCHAR(255) AFTER peso_pasilla;
-- La FK a estados_proceso se añade en el Bloque 4

-- Modificar tabla lotes
ALTER TABLE lotes
ADD COLUMN id_destino_final INT DEFAULT 1 AFTER observaciones, -- Reubicado
ADD COLUMN fecha_finalizacion DATE AFTER id_destino_final; -- Reubicado
-- Eliminar columnas antiguas
ALTER TABLE lotes DROP COLUMN estado;
ALTER TABLE lotes DROP COLUMN tipo_cafe;
-- La FK a destinos_finales se añade en el Bloque 4

-- Modificar tabla secado
ALTER TABLE secado
ADD COLUMN decision_venta BOOLEAN DEFAULT FALSE AFTER observaciones, -- Reubicado
ADD COLUMN fecha_decision DATETIME AFTER decision_venta; -- Reubicado

-- Bloque 3: Añadir Columnas de Estado y Peso a Tablas de Procesos Individuales

ALTER TABLE despulpado
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_despulpado; -- Asume que peso_despues se elimina o renombra

ALTER TABLE fermentacion_lavado
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_lavado;

ALTER TABLE zarandeo
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_zarandeo;

ALTER TABLE secado -- Ya modificada en Bloque 2, añadir más columnas
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER fecha_decision,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_fin;

ALTER TABLE trilla
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_trilla; -- Asume que los pesos premium/normal/bajo se eliminan o esto es adicional

ALTER TABLE tueste
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote, -- Verificar si id_lote o id_trilla es la referencia correcta
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_tueste;

ALTER TABLE molienda -- Ya modificada en Bloque 2, añadir más columnas
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_tueste,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_molienda; -- Asume que 'cantidad' se elimina o renombra

ALTER TABLE control_calidad
ADD COLUMN id_estado_proceso INT DEFAULT 1 AFTER observaciones,
ADD COLUMN peso_inicial DECIMAL(10,2) AFTER id_lote,
ADD COLUMN peso_final DECIMAL(10,2) AFTER fecha_evaluacion;

-- Bloque 4: Añadir Claves Foráneas y Constraints
-- Se añaden al final para asegurar que todas las tablas y columnas referenciadas existen.

-- FK para fincas
ALTER TABLE fincas
ADD FOREIGN KEY (id_municipio_vereda) REFERENCES municipio_vereda(id);

-- FKs y Check para empacado
ALTER TABLE empacado
    ADD FOREIGN KEY (id_tueste) REFERENCES tueste(id);

ALTER TABLE empacado
    ADD FOREIGN KEY (id_molienda) REFERENCES molienda(id);

ALTER TABLE empacado
    ADD FOREIGN KEY (id_tipo_producto) REFERENCES tipos_producto(id);

ALTER TABLE empacado
    ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);

-- Añadir la constraint CHECK por separado
ALTER TABLE empacado
    ADD CONSTRAINT chk_empacado_origen CHECK (
        (id_tueste IS NOT NULL AND id_molienda IS NULL) OR
        (id_tueste IS NULL AND id_molienda IS NOT NULL)
    );
-- FK para clasificacion
ALTER TABLE clasificacion
ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);

-- FK para lotes
ALTER TABLE lotes
ADD FOREIGN KEY (id_destino_final) REFERENCES destinos_finales(id);

-- FKs para Tablas de Procesos Individuales (referencia a estados_proceso)
ALTER TABLE despulpado ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE fermentacion_lavado ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE zarandeo ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE secado ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE trilla ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE tueste ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
ALTER TABLE molienda ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);
-- empacado ya tiene la FK añadida arriba
ALTER TABLE control_calidad ADD FOREIGN KEY (id_estado_proceso) REFERENCES estados_proceso(id);


-- Bloque 5: Creación de la tabla Ventas 

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