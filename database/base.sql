USE techservice_db;

INSERT INTO usuarios (nombre, email, password, rol) VALUES
("Admin general", "admin@techservices.com", "$2a$10$7R3v5K8qGz9yL1mX2nP3o.Y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n", "ADMIN"),
("Tecnico prueba", "tecnico@techservices.com", "$2a$10$7R3v5K8qGz9yL1mX2nP3o.Y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n", "TECNICO")
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO clientes (cedula, nombre, direccion, telefono, email) VALUES
("100123456", "Juan Barrios", "Calle 10 # 20-30", "3004112899", "carlos@gmail.com"),
("100987654", "Andrea Rodriguez", "Carrera 7 # 45-12", "3045702349", "andrea@gmail.com")
ON DUPLICATE KEY UPDATE id = id;