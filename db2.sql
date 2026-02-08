/* CREACIÓN DE LA BASE DE DATOS */
CREATE DATABASE IF NOT EXISTS `gym_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `gym_db`;

/* CONFIGURACIÓN INICIAL */
SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

-- -----------------------------------------------------
-- 1. Tabla: roles (Sin dependencias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 2. Tabla: usuarios (Depende de roles)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `id_role` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `PASSWORD` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `id_role` (`id_role`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `roles` (`id_role`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 3. Tabla: miembros (Depende de usuarios y usuarios(entrenadores))
-- -----------------------------------------------------
DROP TABLE IF EXISTS `miembros`;
CREATE TABLE `miembros` (
  `id_miembro` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_entrenador` int(11) DEFAULT NULL, -- CAMPO NUEVO
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` enum('M','F','Otro') DEFAULT NULL,
  `peso_inicial` decimal(5,2) DEFAULT NULL,
  `estatura` decimal(4,2) DEFAULT NULL,
  `fecha_registro` date DEFAULT NULL,
  `estado` enum('Activo','Inactivo') DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_miembro`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_entrenador` (`id_entrenador`), -- INDEX NUEVO
  CONSTRAINT `miembros_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `miembros_ibfk_2` FOREIGN KEY (`id_entrenador`) REFERENCES `usuarios` (`id_usuario`) -- RELACIÓN NUEVA
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 4. Tabla: membresias (Sin dependencias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `membresias`;
CREATE TABLE `membresias` (
  `id_membresia` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  `duracion_meses` int(11) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_membresia`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 5. Tabla: productos (Sin dependencias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 6. Tabla: ventas (Sin dependencias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ventas`;
CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `total` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_venta`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 7. Tabla: correos_enviados (Sin dependencias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `correos_enviados`;
CREATE TABLE `correos_enviados` (
  `id_correo` int(11) NOT NULL AUTO_INCREMENT,
  `asunto` varchar(150) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo` enum('Individual','Masivo') DEFAULT NULL,
  PRIMARY KEY (`id_correo`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 9. Tabla: asistencias (Depende de miembros)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `asistencias`;
CREATE TABLE `asistencias` (
  `id_asistencia` int(11) NOT NULL AUTO_INCREMENT,
  `id_miembro` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora_entrada` time DEFAULT NULL,
  `hora_salida` time DEFAULT NULL,
  PRIMARY KEY (`id_asistencia`),
  KEY `id_miembro` (`id_miembro`),
  CONSTRAINT `asistencias_ibfk_1` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 10. Tabla: pagos (Depende de miembros)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `pagos`;
CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_miembro` int(11) DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `metodo_pago` enum('Efectivo','Tarjeta','Transferencia','Simulado') DEFAULT NULL,
  `concepto` varchar(100) DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_pago`),
  KEY `id_miembro` (`id_miembro`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 11. Tabla: progreso_fisico (Depende de miembros)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `progreso_fisico`;
CREATE TABLE `progreso_fisico` (
  `id_progreso` int(11) NOT NULL AUTO_INCREMENT,
  `id_miembro` int(11) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `grasa_corporal` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de grasa corporal',
  `masa_muscular` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de masa muscular',
  `agua_corporal` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de agua corporal',
  `masa_osea` decimal(5,2) DEFAULT NULL COMMENT 'Kilogramos de masa ósea',
  `cintura` decimal(5,2) DEFAULT NULL,
  `cadera` decimal(5,2) DEFAULT NULL,
  `pecho` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia de pecho en cm',
  `brazo_derecho` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia brazo derecho en cm',
  `brazo_izquierdo` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia brazo izquierdo en cm',
  `muslo_derecho` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia muslo derecho en cm',
  `muslo_izquierdo` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia muslo izquierdo en cm',
  `pantorrilla` decimal(5,2) DEFAULT NULL COMMENT 'Circunferencia pantorrilla en cm',
  `fecha_registro` date DEFAULT NULL,
  `notas` text DEFAULT NULL COMMENT 'Notas adicionales del progreso',
  PRIMARY KEY (`id_progreso`),
  KEY `id_miembro` (`id_miembro`),
  CONSTRAINT `progreso_fisico_ibfk_1` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 12. Tabla: rutinas (Depende de miembros)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `rutinas`;
CREATE TABLE `rutinas` (
  `id_rutina` int(11) NOT NULL AUTO_INCREMENT,
  `id_miembro` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `activa` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_rutina`),
  KEY `idx_rutinas_miembro` (`id_miembro`),
  CONSTRAINT `rutinas_ibfk_1` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 13. Tabla: rutina_dias (Depende de rutinas)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `rutina_dias`;
CREATE TABLE `rutina_dias` (
  `id_rutina_dia` int(11) NOT NULL AUTO_INCREMENT,
  `id_rutina` int(11) NOT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') DEFAULT NULL,
  `grupo_muscular` varchar(100) DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  PRIMARY KEY (`id_rutina_dia`),
  KEY `idx_rutina_dias_rutina` (`id_rutina`),
  CONSTRAINT `rutina_dias_ibfk_1` FOREIGN KEY (`id_rutina`) REFERENCES `rutinas` (`id_rutina`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 14. Tabla: rutina_ejercicios (Depende de rutina_dias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `rutina_ejercicios`;
CREATE TABLE `rutina_ejercicios` (
  `id_rutina_ejercicio` int(11) NOT NULL AUTO_INCREMENT,
  `id_rutina_dia` int(11) NOT NULL,
  `nombre_ejercicio` varchar(150) NOT NULL,
  `series` varchar(10) DEFAULT '3',
  `repeticiones` varchar(10) DEFAULT '12',
  `peso` varchar(20) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  PRIMARY KEY (`id_rutina_ejercicio`),
  KEY `idx_rutina_ejercicios_dia` (`id_rutina_dia`),
  CONSTRAINT `rutina_ejercicios_ibfk_1` FOREIGN KEY (`id_rutina_dia`) REFERENCES `rutina_dias` (`id_rutina_dia`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 15. Tabla: miembro_membresia (Depende de miembros y membresias)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `miembro_membresia`;
CREATE TABLE `miembro_membresia` (
  `id_mm` int(11) NOT NULL AUTO_INCREMENT,
  `id_miembro` int(11) DEFAULT NULL,
  `id_membresia` int(11) DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `estado` enum('Activa','Vencida','Cancelada') DEFAULT NULL,
  PRIMARY KEY (`id_mm`),
  KEY `id_miembro` (`id_miembro`),
  KEY `id_membresia` (`id_membresia`),
  CONSTRAINT `miembro_membresia_ibfk_1` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`),
  CONSTRAINT `miembro_membresia_ibfk_2` FOREIGN KEY (`id_membresia`) REFERENCES `membresias` (`id_membresia`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 16. Tabla: correo_miembro (Depende de correos_enviados y miembros)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `correo_miembro`;
CREATE TABLE `correo_miembro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_correo` int(11) DEFAULT NULL,
  `id_miembro` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_correo` (`id_correo`),
  KEY `id_miembro` (`id_miembro`),
  CONSTRAINT `correo_miembro_ibfk_1` FOREIGN KEY (`id_correo`) REFERENCES `correos_enviados` (`id_correo`),
  CONSTRAINT `correo_miembro_ibfk_2` FOREIGN KEY (`id_miembro`) REFERENCES `miembros` (`id_miembro`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------
-- 17. Tabla: detalle_venta (Depende de ventas y productos)
-- -----------------------------------------------------
DROP TABLE IF EXISTS `detalle_venta`;
CREATE TABLE `detalle_venta` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `id_venta` int(11) DEFAULT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_venta` (`id_venta`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`),
  CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/* FINALIZACIÓN */
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;