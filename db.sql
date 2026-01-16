-- ============================================
-- SCRIPT COMPLETO PARA BASE DE DATOS GYM
-- Incluye creación de tablas e inserción de datos genéricos
-- ============================================

-- Crear la base de datos
DROP DATABASE IF EXISTS gym_db;
CREATE DATABASE gym_db;
USE gym_db;

-- ============================================
-- 1. CREACIÓN DE TABLAS
-- ============================================

CREATE TABLE roles (
    id_role INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_role INT NOT NULL,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    PASSWORD VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_role) REFERENCES roles(id_role)
);

CREATE TABLE miembros (
    id_miembro INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    sexo ENUM('M','F','Otro'),
    peso_inicial DECIMAL(5,2),
    estatura DECIMAL(4,2),
    fecha_registro DATE,
    estado ENUM('Activo','Inactivo'),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE membresias (
    id_membresia INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    duracion_meses INT,
    precio DECIMAL(10,2)
);

CREATE TABLE miembro_membresia (
    id_mm INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT,
    id_membresia INT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado ENUM('Activa','Vencida','Cancelada'),
    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro),
    FOREIGN KEY (id_membresia) REFERENCES membresias(id_membresia)
);

CREATE TABLE pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT,
    monto DECIMAL(10,2),
    metodo_pago ENUM('Efectivo','Tarjeta','Transferencia','Simulado'),
    concepto VARCHAR(100),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
);

CREATE TABLE asistencias (
    id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT,
    fecha DATE,
    hora_entrada TIME,
    hora_salida TIME,
    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
);

CREATE TABLE correos_enviados (
    id_correo INT AUTO_INCREMENT PRIMARY KEY,
    asunto VARCHAR(150),
    mensaje TEXT,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('Individual','Masivo')
);

CREATE TABLE correo_miembro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_correo INT,
    id_miembro INT,
    FOREIGN KEY (id_correo) REFERENCES correos_enviados(id_correo),
    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
);

CREATE TABLE progreso_fisico (
    id_progreso INT AUTO_INCREMENT PRIMARY KEY,
    id_miembro INT,
    peso DECIMAL(5,2),
    bmi DECIMAL(5,2),
    cintura DECIMAL(5,2),
    cadera DECIMAL(5,2),
    fecha_registro DATE,
    FOREIGN KEY (id_miembro) REFERENCES miembros(id_miembro)
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    precio DECIMAL(10,2),
    stock INT
);

CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2)
);

CREATE TABLE detalle_venta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT,
    id_producto INT,
    cantidad INT,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE gastos (
    id_gasto INT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(100),
    monto DECIMAL(10,2),
    fecha DATE
);

-- ============================================
-- 2. INSERCIÓN DE DATOS GENÉRICOS
-- ============================================

-- Insertar roles
INSERT INTO roles (nombre) VALUES
('Administrador'),
('Entrenador'),
('Recepcionista'),
('Miembro');

-- Insertar usuarios (contraseñas son "password123" encriptadas)
INSERT INTO usuarios (id_role, nombre, email, PASSWORD, activo) VALUES
(1, 'Carlos Admin', 'admin@gym.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(2, 'María Entrenadora', 'maria@gym.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(2, 'Juan Pérez', 'juan@gym.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(3, 'Ana Recepción', 'ana@gym.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Luis Miembro', 'luis@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Sofía Gómez', 'sofia@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Miguel Torres', 'miguel@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Elena Ruiz', 'elena@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Roberto Díaz', 'roberto@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
(4, 'Carolina Vega', 'carolina@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

-- Insertar miembros
INSERT INTO miembros (id_usuario, telefono, fecha_nacimiento, sexo, peso_inicial, estatura, fecha_registro, estado) VALUES
(5, '555-0101', '1990-05-15', 'M', 78.5, 1.75, '2023-01-10', 'Activo'),
(6, '555-0102', '1992-08-22', 'F', 62.3, 1.65, '2023-02-15', 'Activo'),
(7, '555-0103', '1988-03-30', 'M', 85.0, 1.80, '2023-03-05', 'Activo'),
(8, '555-0104', '1995-11-10', 'F', 58.7, 1.60, '2023-04-12', 'Inactivo'),
(9, '555-0105', '1993-07-18', 'M', 92.1, 1.82, '2023-05-20', 'Activo'),
(10, '555-0106', '1991-12-05', 'F', 65.4, 1.68, '2023-06-08', 'Activo'),
(NULL, '555-0107', '1985-09-25', 'M', 88.3, 1.78, '2023-07-14', 'Activo'),
(NULL, '555-0108', '1994-04-12', 'F', 70.2, 1.70, '2023-08-19', 'Inactivo'),
(NULL, '555-0109', '1989-06-30', 'M', 95.5, 1.85, '2023-09-22', 'Activo'),
(NULL, '555-0110', '1996-02-14', 'F', 55.8, 1.62, '2023-10-30', 'Activo');

-- Insertar membresías
INSERT INTO membresias (nombre, duracion_meses, precio) VALUES
('Básica Mensual', 1, 30.00),
('Premium Mensual', 1, 50.00),
('Básica Anual', 12, 300.00),
('Premium Anual', 12, 550.00),
('Estudiante', 1, 25.00),
('Familiar', 1, 80.00),
('VIP', 1, 100.00);

-- Insertar relaciones miembro-membresía
INSERT INTO miembro_membresia (id_miembro, id_membresia, fecha_inicio, fecha_fin, estado) VALUES
(1, 2, '2024-01-01', '2024-02-01', 'Activa'),
(2, 1, '2024-01-15', '2024-02-15', 'Activa'),
(3, 3, '2024-01-01', '2025-01-01', 'Activa'),
(4, 5, '2023-04-12', '2023-05-12', 'Vencida'),
(5, 2, '2024-01-20', '2024-02-20', 'Activa'),
(6, 1, '2024-01-10', '2024-02-10', 'Activa'),
(7, 4, '2024-01-05', '2025-01-05', 'Activa'),
(8, 6, '2023-08-19', '2023-09-19', 'Vencida'),
(9, 2, '2024-01-25', '2024-02-25', 'Activa'),
(10, 1, '2024-01-18', '2024-02-18', 'Activa');

-- Insertar pagos
INSERT INTO pagos (id_miembro, monto, metodo_pago, concepto) VALUES
(1, 50.00, 'Tarjeta', 'Pago membresía Premium Mensual'),
(2, 30.00, 'Efectivo', 'Pago membresía Básica Mensual'),
(3, 300.00, 'Transferencia', 'Pago membresía Básica Anual'),
(1, 50.00, 'Tarjeta', 'Renovación membresía'),
(4, 25.00, 'Efectivo', 'Pago membresía Estudiante'),
(5, 50.00, 'Tarjeta', 'Pago membresía Premium Mensual'),
(6, 30.00, 'Efectivo', 'Pago membresía Básica Mensual'),
(7, 550.00, 'Transferencia', 'Pago membresía Premium Anual'),
(8, 80.00, 'Tarjeta', 'Pago membresía Familiar'),
(9, 50.00, 'Efectivo', 'Pago membresía Premium Mensual'),
(10, 30.00, 'Tarjeta', 'Pago membresía Básica Mensual');

-- Insertar asistencias (últimos 30 días)
INSERT INTO asistencias (id_miembro, fecha, hora_entrada, hora_salida) VALUES
(1, CURDATE() - INTERVAL 1 DAY, '08:30:00', '10:15:00'),
(1, CURDATE() - INTERVAL 3 DAY, '09:00:00', '11:00:00'),
(1, CURDATE() - INTERVAL 5 DAY, '17:00:00', '18:30:00'),
(2, CURDATE() - INTERVAL 2 DAY, '07:00:00', '08:45:00'),
(2, CURDATE() - INTERVAL 4 DAY, '18:00:00', '19:30:00'),
(3, CURDATE(), '10:00:00', '12:00:00'),
(3, CURDATE() - INTERVAL 2 DAY, '16:00:00', '17:45:00'),
(5, CURDATE() - INTERVAL 1 DAY, '12:00:00', '13:30:00'),
(6, CURDATE() - INTERVAL 3 DAY, '19:00:00', '20:15:00'),
(7, CURDATE() - INTERVAL 4 DAY, '08:00:00', '09:30:00'),
(9, CURDATE() - INTERVAL 2 DAY, '17:30:00', '19:00:00'),
(10, CURDATE() - INTERVAL 1 DAY, '09:30:00', '11:00:00');

-- Insertar correos enviados
INSERT INTO correos_enviados (asunto, mensaje, tipo) VALUES
('Bienvenida al Gimnasio', '¡Bienvenido a nuestro gimnasio! Esperamos que disfrutes de nuestras instalaciones.', 'Individual'),
('Promoción Especial', 'Aprovecha nuestra promoción especial de verano. 20% de descuento en todas las membresías.', 'Masivo'),
('Recordatorio de Pago', 'Tu membresía está próxima a vencer. Por favor, renueva tu membresía.', 'Individual'),
('Nuevas Clases', 'Hemos agregado nuevas clases de spinning y yoga. ¡Inscríbete ahora!', 'Masivo'),
('Feliz Cumpleaños', '¡Feliz cumpleaños! Te regalamos un día gratis en el gimnasio.', 'Individual');

-- Insertar relación correo-miembro
INSERT INTO correo_miembro (id_correo, id_miembro) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(3, 4),
(3, 8),
(4, 1),
(4, 2),
(4, 3),
(4, 5),
(4, 6),
(4, 7),
(4, 9),
(4, 10),
(5, 1),
(5, 6);

-- Insertar progreso físico
INSERT INTO progreso_fisico (id_miembro, peso, bmi, cintura, cadera, fecha_registro) VALUES
(1, 75.5, 24.7, 85.0, 95.0, CURDATE() - INTERVAL 30 DAY),
(1, 74.2, 24.2, 83.5, 94.0, CURDATE() - INTERVAL 15 DAY),
(1, 72.8, 23.8, 82.0, 93.0, CURDATE()),
(2, 60.5, 22.2, 70.0, 95.0, CURDATE() - INTERVAL 30 DAY),
(2, 60.0, 22.0, 69.5, 94.5, CURDATE()),
(3, 82.5, 25.5, 90.0, 100.0, CURDATE() - INTERVAL 45 DAY),
(3, 81.0, 25.0, 88.5, 99.0, CURDATE()),
(5, 89.5, 27.0, 95.0, 105.0, CURDATE() - INTERVAL 60 DAY),
(5, 87.0, 26.3, 92.5, 103.0, CURDATE()),
(6, 63.0, 22.3, 72.0, 96.0, CURDATE());

-- Insertar productos
INSERT INTO productos (nombre, precio, stock) VALUES
('Proteína Whey 2kg', 45.99, 15),
('Creatina 300g', 25.50, 30),
('Shaker', 8.99, 50),
('Toalla Deportiva', 12.75, 40),
('Botella Agua 1L', 2.50, 100),
('Barra Proteica x12', 18.99, 25),
('BCAA 300g', 32.99, 20),
('Guantes Gimnasio', 15.99, 35),
('Cinturón Pesas', 29.99, 10),
('Bebida Isotónica', 3.25, 60);

-- Insertar ventas
INSERT INTO ventas (fecha, total) VALUES
(CURDATE() - INTERVAL 5 DAY, 98.47),
(CURDATE() - INTERVAL 3 DAY, 45.50),
(CURDATE() - INTERVAL 2 DAY, 12.75),
(CURDATE() - INTERVAL 1 DAY, 33.98),
(CURDATE(), 25.50);

-- Insertar detalles de venta
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, subtotal) VALUES
(1, 1, 1, 45.99),
(1, 6, 1, 18.99),
(1, 4, 1, 12.75),
(1, 10, 3, 9.75),
(1, 8, 1, 15.99),
(2, 2, 1, 25.50),
(2, 3, 1, 8.99),
(2, 10, 2, 6.50),
(2, 5, 2, 5.00),
(3, 4, 1, 12.75),
(4, 7, 1, 32.99),
(5, 2, 1, 25.50);

-- Insertar gastos
INSERT INTO gastos (descripcion, monto, fecha) VALUES
('Pago Luz', 350.00, CURDATE() - INTERVAL 30 DAY),
('Mantenimiento Equipos', 120.00, CURDATE() - INTERVAL 25 DAY),
('Sueldo Entrenador', 800.00, CURDATE() - INTERVAL 15 DAY),
('Compra Suplementos', 450.00, CURDATE() - INTERVAL 10 DAY),
('Limpieza', 200.00, CURDATE() - INTERVAL 7 DAY),
('Agua', 80.00, CURDATE() - INTERVAL 5 DAY),
('Internet', 60.00, CURDATE() - INTERVAL 3 DAY),
('Marketing', 300.00, CURDATE() - INTERVAL 1 DAY);