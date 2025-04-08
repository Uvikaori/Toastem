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
    nombre_finca VARCHAR(100) NOT NULL,
    ubicacion_finca VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pregunta_seguridad) REFERENCES preguntas_seguridad(id)
);

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
    tipo_cafe ENUM('Rojo', 'Amarillo') NOT NULL,
    tipo_recoleccion ENUM('Selectiva', 'General', 'Striping') NOT NULL,
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


