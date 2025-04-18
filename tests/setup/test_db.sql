-- Crear la base de datos de prueba
CREATE DATABASE IF NOT EXISTS toastem_test_db;
USE toastem_test_db;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    pregunta_seguridad VARCHAR(255) NOT NULL,
    respuesta_seguridad VARCHAR(255) NOT NULL,
    nombre_finca VARCHAR(255) NOT NULL,
    ubicacion_finca VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de preguntas de seguridad
CREATE TABLE IF NOT EXISTS preguntas_seguridad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta VARCHAR(255) NOT NULL
);

-- Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires BIGINT,
    data TEXT
);

-- Insertar preguntas de seguridad predefinidas
INSERT INTO preguntas_seguridad (pregunta) VALUES 
('¿Cuál es el nombre de tu primera mascota?'),
('¿En qué ciudad naciste?'),
('¿Cuál es tu color favorito?'),
('¿Cuál es el nombre de tu mejor amigo de la infancia?'),
('¿Cuál fue tu primer coche?'); 