USE techservice_db;

INSERT INTO usuarios (nombre, email, password, rol) VALUES
("Admin general", "admin@techservices.com", "$2a$10$7R3v5K8qGz9yL1mX2nP3o.Y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n", "ADMIN"),
("Tecnico prueba", "tecnico@techservices.com", "$2a$10$7R3v5K8qGz9yL1mX2nP3o.Y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n", "TECNICO")
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO clientes (cedula, nombre, direccion, telefono, email) VALUES
("100123456", "Juan Barrios", "Calle 10 # 20-30", "3004112899", "carlos@gmail.com"),
("100987654", "Andrea Rodriguez", "Carrera 7 # 45-34", "3045702349", "andrea@gmail.com")
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO equipos (id, cliente_id, numero_serie, tipo_equipo, marca, modelo, procesador, memoria_ram, almacenamiento, tarjeta_grafica, sistema_operativo, estado_fisico, accesorios, observaciones) VALUES
(1, 1, 'SN-LEN-88231', 'Portátil', 'Lenovo', 'ThinkPad T14 Gen 2', 'Intel Core i7-1165G7 @ 2.80GHz', '16 GB DDR4', '512 GB SSD NVMe M.2', 'Intel Iris Xe Graphics', 'Windows 11 Pro 64-bit', 'Buen estado estético, ligeros desgastes de uso en las esquinas inferiores.', 'Cargador Lenovo 65W Tipo C original, Mouse Logitech inalámbrico', 'El cliente indica lentitud ocasional al iniciar.'),
(2, 1, 'SN-ASUS-94112', 'Portátil Gamer', 'ASUS', 'ROG Strix G15', 'AMD Ryzen 7 5800H @ 3.20GHz', '32 GB DDR4 (2x16GB)', '1 TB SSD PCIe Gen3', 'NVIDIA GeForce RTX 3060 6GB GDDR6', 'Windows 11 Home', 'Excelente estado físico, sin golpes ni rayones visibles.', 'Cargador original ASUS 230W, maletín acolchado', 'Requiere mantenimiento térmico preventivo y cambio de pasta térmica.'),
(3, 2, 'SN-DELL-33091', 'Computador de Mesa', 'Dell', 'OptiPlex 7090 Tower', 'Intel Core i5-11500 @ 2.70GHz', '16 GB DDR4', '256 GB SSD + 1 TB HDD SATA', 'Intel UHD Graphics 750', 'Windows 10 Pro 64-bit', 'Chasis en óptimas condiciones, polvo acumulado en rejillas de ventilación.', 'Cable de poder AC', 'Equipo de oficina para diagnóstico por reinicios repentinos.')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO ordenes_servicio (id, codigo_orden, equipo_id, tecnico_id, motivo_ingreso, tipo_servicio, prioridad, estado, costo_estimado, abono_inicial, observaciones_recepcion) VALUES
(1, 'OS-2026-0001', 1, 2, 'El equipo presenta lentitud extrema al abrir programas pesados y se calienta.', 'Mantenimiento Preventivo', 'MEDIA', 'EN_PROCESO', 120000.00, 50000.00, 'Se recibe con cargador original tipo C. Equipo enciende correctamente.'),
(2, 'OS-2026-0002', 2, 2, 'Mantenimiento preventivo general y cambio de pasta térmica por altas temperaturas en juegos.', 'Mantenimiento Preventivo', 'ALTA', 'PENDIENTE', 180000.00, 0.00, 'Se recibe con cargador y maletín en excelentes condiciones.')
ON DUPLICATE KEY UPDATE id = id;