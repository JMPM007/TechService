CREATE DATABASE IF NOT EXISTS techservice_db;
USE techservice_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'TECNICO', 'CLIENTE') NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL UNIQUE,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    direccion VARCHAR(200) NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    especialidad VARCHAR(100) NOT NULL,
    estado ENUM('DISPONIBLE', 'OCUPADO', 'INACTIVO') NOT NULL DEFAULT 'DISPONIBLE',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NULL,
    tipo VARCHAR(50) NOT NULL,
    marca VARCHAR(100) NULL,
    modelo VARCHAR(100) NOT NULL,
    motivo_ingreso TEXT NULL,
    procesador VARCHAR(100) NULL,
    memoria_ram VARCHAR(50) NULL,
    almacenamiento VARCHAR(100) NULL,
    tarjeta_grafica VARCHAR(100) NULL,
    sistema_operativo VARCHAR(100) NULL,
    estado_fisico TEXT NULL,
    accesorios TEXT NULL,
    observaciones TEXT NULL,
    estado ENUM('RECIBIDO', 'EN_REVISION', 'REPARADO', 'ENTREGADO') NOT NULL DEFAULT 'RECIBIDO',
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordenes_servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_orden VARCHAR(30) NULL UNIQUE,
    equipo_id INT NOT NULL,
    tecnico_id INT NULL,
    motivo_ingreso TEXT NULL,
    tipo_servicio VARCHAR(80) NULL,
    prioridad ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    estado ENUM(
        'RECIBIDA',
        'PENDIENTE',
        'EN_REVISION',
        'EN_REPARACION',
        'EN_PROCESO',
        'EN_ESPERA_REPUESTO',
        'REPARADA',
        'COMPLETADO',
        'ENTREGADA',
        'CERRADA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'RECIBIDA',
    costo_estimado DECIMAL(12, 2) NOT NULL DEFAULT 0,
    abono_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0,
    observaciones_recepcion TEXT NULL,
    observaciones_cierre TEXT NULL,
    fecha_asignacion TIMESTAMP NULL,
    fecha_cierre TIMESTAMP NULL,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ordenes_equipo_id (equipo_id),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE RESTRICT,
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS historial_estados_orden (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL,
    estado_anterior VARCHAR(30) NULL,
    estado_nuevo VARCHAR(30) NOT NULL,
    usuario_id INT NOT NULL,
    observacion TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_historial_orden_fecha (orden_id, creado_en, id),
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS diagnosticos_orden (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL UNIQUE,
    tecnico_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    falla_encontrada TEXT NOT NULL,
    fecha_diagnostico DATETIME NOT NULL,
    recomendaciones TEXT NULL,
    procedimientos TEXT NULL,
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orden_id INT NOT NULL UNIQUE,
    creado_por INT NOT NULL,
    estado ENUM('PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orden_id) REFERENCES ordenes_servicio(id) ON DELETE RESTRICT,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS cotizacion_conceptos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    tipo ENUM('SERVICIO', 'MANO_OBRA', 'REPUESTO') NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    observaciones TEXT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    CHECK (cantidad > 0),
    CHECK (precio_unitario >= 0)
);
