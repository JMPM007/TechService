CREATE DATABASE IF NOT EXISTS techservice_db;
USE techservice_db;

CREATE TABLE IF NOT EXISTS usuarios(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM ("ADMIN", "TECNICO", "CLIENTE") NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes(  
    id INT AUTO_INCREMENT PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    tipo_equipo VARCHAR(50) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    procesador VARCHAR(100) NULL,
    memoria_ram VARCHAR(50) NULL,
    almacenamiento VARCHAR(100) NULL,
    tarjeta_grafica VARCHAR(100) NULL,
    sistema_operativo VARCHAR(100) NULL,
    estado_fisico TEXT NULL,
    accesorios TEXT NULL,
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordenes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_orden VARCHAR(30) UNIQUE NOT NULL,
    equipo_id INT NOT NULL,
    tecnico_id INT NULL,
    motivo_ingreso TEXT NOT NULL,
    tipo_servicio ENUM(
        'Mantenimiento Preventivo',
        'Mantenimiento Correctivo',
        'Diagnóstico Técnico',
        'Garantía',
        'Instalación Hardware/Software'
    ) NOT NULL,
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    estado ENUM(
        'PENDIENTE',
        'EN_PROCESO',
        'EN_ESPERA_REPUESTO',
        'COMPLETADO',
        'ENTREGADO',
        'CANCELADO'
    ) NOT NULL DEFAULT 'PENDIENTE',
    costo_estimado DECIMAL(10, 2) DEFAULT 0.00,
    abono_inicial DECIMAL(10, 2) DEFAULT 0.00,
    observaciones_recepcion TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
