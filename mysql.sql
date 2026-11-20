-- ============================================================
-- AquaGest - Base de datos (MariaDB 10.4 de XAMPP / MySQL 8)
-- Cómo importarla: phpMyAdmin > Importar > elegir este archivo.
-- OJO: borra y vuelve a crear las tablas (si ya tenías datos, se reemplazan por los de abajo).
-- Novedades frente a la versión anterior:
--   * vehiculos (con foto en base64), lavaderos (mapa), cita_productos y movimientos_inventario
--   * productos: tipo (Insumo/Venta), precio y stock mínimo
--   * Datos de ejemplo: 10 registros por tabla (excepto rol, que solo tiene los 3 roles)
--   * citas: estado, estado de pago (Pendiente/Pagado), operario asignado y valor del servicio
-- ============================================================

CREATE DATABASE IF NOT EXISTS `aquagest` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `aquagest`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `movimientos_inventario`;
DROP TABLE IF EXISTS `cita_productos`;
DROP TABLE IF EXISTS `cita_adicionales`;
DROP TABLE IF EXISTS `citas`;
DROP TABLE IF EXISTS `vehiculos`;
DROP TABLE IF EXISTS `lavaderos`;
DROP TABLE IF EXISTS `productos`;
DROP TABLE IF EXISTS `adicionales`;
DROP TABLE IF EXISTS `servicio`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `rol`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- Roles y usuarios
-- --------------------------------------------------------

CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(20) NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `rol` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(2, 'Empleado'),
(3, 'Cliente');

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `apellido` varchar(30) NOT NULL,
  `tipo_documento` varchar(10) NOT NULL,
  `numero_documento` varchar(15) NOT NULL,
  `genero` varchar(10) NOT NULL,
  `correo` varchar(50) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `fk_pk_id_rol` int(11) NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `numero_documento` (`numero_documento`),
  UNIQUE KEY `correo` (`correo`),
  KEY `fk_pk_id_rol` (`fk_pk_id_rol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`fk_pk_id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `apellido`, `tipo_documento`, `numero_documento`, `genero`, `correo`, `telefono`, `contrasena`, `fk_pk_id_rol`) VALUES
(1, 'Admin', 'Gómez', 'CC', '1012345678', 'Masculino', 'admin@gmail.com', '3001234567', '123456', 1),
(2, 'Empleado', 'Martínez', 'CC', '1023456789', 'Femenino', 'empleado@gmail.com', '3012345678', '123456', 2),
(3, 'Cliente', 'Rodríguez', 'CC', '1034567890', 'Masculino', 'cliente@gmail.com', '3023456789', '123456', 3),
(4, 'Andrea', 'López', 'CC', '1045678901', 'Femenino', 'andrea@gmail.com', '3034567890', '123456', 3),
(5, 'Juan', 'Pérez', 'TI', '1056789012', 'Masculino', 'juan@gmail.com', '3045678901', '123456', 3),
(6, 'sneyder', 'vergel', 'CC', '101232', 'Masculino', 'sneydervergel@gmail.com', '320393', '123456', 1),
(7, 'Pedro', 'Sánchez', 'CC', '1067890123', 'Masculino', 'pedro@aquagest.com', '3056789012', '123456', 2),
(8, 'Valentina', 'Castro', 'CC', '1078901234', 'Femenino', 'valentina@gmail.com', '3067890123', '123456', 3),
(9, 'Santiago', 'Herrera', 'CE', '1089012345', 'Masculino', 'santiago@gmail.com', '3078901234', '123456', 3),
(10, 'Daniela', 'Ruiz', 'CC', '1090123456', 'Femenino', 'daniela@gmail.com', '3089012345', '123456', 3);

-- --------------------------------------------------------
-- Catálogo: servicios, adicionales y lavaderos (mapa)
-- --------------------------------------------------------

CREATE TABLE `servicio` (
  `id_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_servicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `servicio` (`id_servicio`, `nombre`, `descripcion`, `valor`) VALUES
(1, 'Lavado exterior', 'Carrocería, rines y secado', 15000.00),
(2, 'Lavado completo', 'Exterior, interior, aspirado y llantas', 30000.00),
(3, 'Lavado de motor', 'Desengrase y lavado del motor', 25000.00),
(4, 'Polichado', 'Pulido y brillo de la pintura', 60000.00),
(5, 'Lavado de chasis', 'Limpieza de la parte inferior del vehículo', 20000.00),
(6, 'Lavado de tapicería', 'Limpieza profunda de asientos y alfombras', 45000.00),
(7, 'Lavado express', 'Lavado rápido exterior sin secado detallado', 10000.00),
(8, 'Encerado', 'Aplicación de cera con brillo duradero', 35000.00),
(9, 'Desinfección interior', 'Higienización del habitáculo', 28000.00),
(10, 'Lavado de moto', 'Lavado completo para motocicletas', 12000.00);

CREATE TABLE `adicionales` (
  `id_adicional` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_adicional`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `adicionales` (`id_adicional`, `nombre`, `descripcion`, `valor`) VALUES
(1, 'Aromatizante', 'Aroma para el interior', 3000.00),
(2, 'Cera protectora', 'Capa de cera sobre la pintura', 10000.00),
(3, 'Limpieza de tapicería', 'Lavado profundo de asientos', 25000.00),
(4, 'Brillo de llantas', 'Acabado brillante en las llantas', 5000.00),
(5, 'Limpieza de vidrios interiores', 'Vidrios y espejos por dentro', 4000.00),
(6, 'Protector de plásticos', 'Restaura el tablero y los plásticos', 8000.00),
(7, 'Desodorizante de ambiente', 'Eliminación de malos olores', 6000.00),
(8, 'Lavado de tapetes', 'Tapetes de caucho y de tela', 7000.00),
(9, 'Limpieza de cuero', 'Limpieza e hidratación de asientos en cuero', 22000.00),
(10, 'Tratamiento antilluvia', 'Repelente de agua para los vidrios', 15000.00);

-- Coordenadas de ejemplo en Bogotá: cámbialas por las de tus sedes reales.
CREATE TABLE `lavaderos` (
  `id_lavadero` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `direccion` varchar(120) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `latitud` decimal(10,7) NOT NULL,
  `longitud` decimal(10,7) NOT NULL,
  PRIMARY KEY (`id_lavadero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `lavaderos` (`id_lavadero`, `nombre`, `direccion`, `telefono`, `latitud`, `longitud`) VALUES
(1, 'AquaGest Sede Principal', 'Cra 7 # 32-16, Bogotá', '3001234567', 4.6182000, -74.0689000),
(2, 'AquaGest Chapinero', 'Cl 57 # 13-40, Bogotá', '3012345678', 4.6451000, -74.0630000),
(3, 'AquaGest Usaquén', 'Cra 7 # 119-14, Bogotá', '3023456789', 4.6982000, -74.0306000),
(4, 'AquaGest Suba', 'Cl 145 # 91-19, Bogotá', '3034567890', 4.7410000, -74.0836000),
(5, 'AquaGest Kennedy', 'Cra 78K # 38-40 Sur, Bogotá', '3045678901', 4.6285000, -74.1473000),
(6, 'AquaGest Fontibón', 'Cl 17 # 99-10, Bogotá', '3056789012', 4.6697000, -74.1427000),
(7, 'AquaGest Teusaquillo', 'Cra 24 # 39-60, Bogotá', '3067890123', 4.6406000, -74.0875000),
(8, 'AquaGest Engativá', 'Cl 80 # 95-30, Bogotá', '3078901234', 4.7020000, -74.1100000),
(9, 'AquaGest Bosa', 'Cra 80 # 65-20 Sur, Bogotá', '3089012345', 4.6090000, -74.1850000),
(10, 'AquaGest Cedritos', 'Cl 147 # 12-50, Bogotá', '3090123456', 4.7240000, -74.0390000);

-- --------------------------------------------------------
-- Vehículos (la foto se guarda como texto base64, sin el prefijo "data:image...")
-- --------------------------------------------------------

CREATE TABLE `vehiculos` (
  `id_vehiculo` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pk_id_usuario` int(11) NOT NULL,
  `tipo_vehiculo` varchar(20) NOT NULL DEFAULT 'Automóvil',
  `marca` varchar(30) NOT NULL DEFAULT '',
  `placa` varchar(10) NOT NULL,
  `foto` longtext DEFAULT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_vehiculo`),
  UNIQUE KEY `placa` (`placa`),
  KEY `fk_pk_id_usuario` (`fk_pk_id_usuario`),
  CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`fk_pk_id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `vehiculos` (`id_vehiculo`, `fk_pk_id_usuario`, `tipo_vehiculo`, `marca`, `placa`) VALUES
(1, 4, 'Automóvil', 'Chevrolet', 'ABC123'),
(2, 5, 'Motocicleta', 'Yamaha', 'DEF45G'),
(3, 4, 'Camioneta', 'Renault', 'GHI789'),
(4, 5, 'Automóvil', 'Mazda', 'JKL012'),
(5, 8, 'Motocicleta', 'Honda', 'MNO34P'),
(6, 8, 'Automóvil', 'Kia', 'QRS567'),
(7, 9, 'Camioneta', 'Toyota', 'TUV890'),
(8, 9, 'Motocicleta', 'Suzuki', 'WXY12Z'),
(9, 10, 'Automóvil', 'Hyundai', 'BCD345'),
(10, 10, 'Camión', 'Ford', 'EFG678');

-- --------------------------------------------------------
-- Inventario: Insumo = se usa en el lavado | Venta = se vende al cliente
-- --------------------------------------------------------

CREATE TABLE `productos` (
  `id_productos` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(100) NOT NULL DEFAULT '',
  `cantidad` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unidad_medida` varchar(20) NOT NULL,
  `tipo` enum('Insumo','Venta') NOT NULL DEFAULT 'Insumo',
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id_productos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `productos` (`id_productos`, `nombre`, `descripcion`, `cantidad`, `unidad_medida`, `tipo`, `precio`, `stock_minimo`) VALUES
(1, 'Champú para vehículos', 'Champú concentrado', 19.00, 'litros', 'Insumo', 0.00, 3.00),
(2, 'Cera protectora', 'Cera para la pintura', 5.00, 'unidades', 'Insumo', 0.00, 2.00),
(3, 'Paños de microfibra', 'Secado y brillo', 36.00, 'unidades', 'Insumo', 0.00, 6.00),
(4, 'Limpiavidrios', 'Para vidrios y espejos', 6.00, 'litros', 'Insumo', 0.00, 2.00),
(5, 'Desengrasante', 'Para motor y rines', 2.00, 'litros', 'Insumo', 0.00, 2.00),
(6, 'Crema polichadora', 'Crema para pulir la pintura', 18.00, 'unidades', 'Venta', 18000.00, 3.00),
(7, 'Aromatizante para auto', 'Colgante de aroma', 26.00, 'unidades', 'Venta', 5000.00, 5.00),
(8, 'Paño microfibra (venta)', 'Paño para el cliente', 17.00, 'unidades', 'Venta', 8000.00, 5.00),
(9, 'Shampoo para auto (venta)', 'Shampoo de 500 ml', 11.00, 'unidades', 'Venta', 15000.00, 3.00),
(10, 'Brillo para llantas (venta)', 'Spray para llantas', 8.00, 'unidades', 'Venta', 12000.00, 2.00);

-- --------------------------------------------------------
-- Citas = turnos + factura (el número de factura es el id_cita)
-- --------------------------------------------------------

CREATE TABLE `citas` (
  `id_cita` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pk_id_usuario` int(11) NOT NULL,
  `fk_pk_id_servicio` int(11) NOT NULL,
  `fk_pk_id_vehiculo` int(11) DEFAULT NULL,
  `fk_pk_id_empleado` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `observaciones` varchar(200) DEFAULT NULL,
  `placa` varchar(10) NOT NULL,
  `marca` varchar(30) NOT NULL DEFAULT '',
  `estado` enum('Pendiente','En proceso','Terminada','Cancelada') NOT NULL DEFAULT 'Pendiente',
  `estado_pago` enum('Pendiente','Pagado') NOT NULL DEFAULT 'Pendiente',
  `valor_servicio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `creada_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cita`),
  KEY `fk_pk_id_usuario` (`fk_pk_id_usuario`),
  KEY `fk_pk_id_servicio` (`fk_pk_id_servicio`),
  KEY `fk_pk_id_vehiculo` (`fk_pk_id_vehiculo`),
  KEY `fk_pk_id_empleado` (`fk_pk_id_empleado`),
  KEY `fecha_hora` (`fecha`,`hora`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`fk_pk_id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`fk_pk_id_servicio`) REFERENCES `servicio` (`id_servicio`),
  CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`fk_pk_id_vehiculo`) REFERENCES `vehiculos` (`id_vehiculo`),
  CONSTRAINT `citas_ibfk_4` FOREIGN KEY (`fk_pk_id_empleado`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `citas` (`id_cita`, `fk_pk_id_usuario`, `fk_pk_id_servicio`, `fk_pk_id_vehiculo`, `fk_pk_id_empleado`, `fecha`, `hora`, `observaciones`, `placa`, `marca`, `estado`, `estado_pago`, `valor_servicio`, `total`) VALUES
(1, 4, 2, 1, 2, '2026-10-26', '09:00:00', NULL, 'ABC123', 'Chevrolet', 'Terminada', 'Pagado', 30000.00, 66000.00),
(2, 5, 1, 2, 3, '2026-10-26', '10:30:00', 'Revisar el espejo izquierdo', 'DEF45G', 'Yamaha', 'Terminada', 'Pagado', 15000.00, 40000.00),
(3, 8, 4, 6, 7, '2026-10-27', '14:00:00', 'Rayones leves en el capó', 'QRS567', 'Kia', 'Terminada', 'Pendiente', 60000.00, 103000.00),
(4, 9, 3, 7, 2, '2026-10-28', '11:00:00', NULL, 'TUV890', 'Toyota', 'Terminada', 'Pagado', 25000.00, 51000.00),
(5, 10, 2, 9, 3, '2026-10-28', '15:30:00', 'Cancelada por el cliente', 'BCD345', 'Hyundai', 'Cancelada', 'Pendiente', 30000.00, 30000.00),
(6, 4, 2, 3, 7, '2026-10-29', '08:30:00', NULL, 'GHI789', 'Renault', 'En proceso', 'Pendiente', 30000.00, 50000.00),
(7, 5, 7, 4, 2, '2026-10-29', '16:00:00', NULL, 'JKL012', 'Mazda', 'Pendiente', 'Pendiente', 10000.00, 14000.00),
(8, 8, 10, 5, 3, '2026-10-30', '09:30:00', NULL, 'MNO34P', 'Honda', 'Pendiente', 'Pendiente', 12000.00, 16000.00),
(9, 9, 6, 7, 7, '2026-10-31', '10:00:00', 'Manchas en el asiento trasero', 'TUV890', 'Toyota', 'Pendiente', 'Pendiente', 45000.00, 52000.00),
(10, 10, 8, 9, 2, '2026-11-02', '14:30:00', NULL, 'BCD345', 'Hyundai', 'Pendiente', 'Pendiente', 35000.00, 60000.00);

CREATE TABLE `cita_adicionales` (
  `fk_pk_id_cita` int(11) NOT NULL,
  `fk_pk_id_adicional` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`fk_pk_id_cita`,`fk_pk_id_adicional`),
  KEY `fk_pk_id_adicional` (`fk_pk_id_adicional`),
  CONSTRAINT `cita_adicionales_ibfk_1` FOREIGN KEY (`fk_pk_id_cita`) REFERENCES `citas` (`id_cita`) ON DELETE CASCADE,
  CONSTRAINT `cita_adicionales_ibfk_2` FOREIGN KEY (`fk_pk_id_adicional`) REFERENCES `adicionales` (`id_adicional`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cita_adicionales` (`fk_pk_id_cita`, `fk_pk_id_adicional`, `valor`) VALUES
(1, 1, 3000.00),
(1, 2, 10000.00),
(2, 4, 5000.00),
(3, 2, 10000.00),
(6, 1, 3000.00),
(7, 5, 4000.00),
(8, 5, 4000.00),
(9, 8, 7000.00),
(10, 2, 10000.00),
(10, 10, 15000.00);

-- Productos vendidos al cliente dentro de una factura
CREATE TABLE `cita_productos` (
  `fk_pk_id_cita` int(11) NOT NULL,
  `fk_pk_id_producto` int(11) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`fk_pk_id_cita`,`fk_pk_id_producto`),
  KEY `fk_pk_id_producto` (`fk_pk_id_producto`),
  CONSTRAINT `cita_productos_ibfk_1` FOREIGN KEY (`fk_pk_id_cita`) REFERENCES `citas` (`id_cita`) ON DELETE CASCADE,
  CONSTRAINT `cita_productos_ibfk_2` FOREIGN KEY (`fk_pk_id_producto`) REFERENCES `productos` (`id_productos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cita_productos` (`fk_pk_id_cita`, `fk_pk_id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 6, 1.00, 18000.00, 18000.00),
(1, 7, 1.00, 5000.00, 5000.00),
(2, 8, 1.00, 8000.00, 8000.00),
(2, 10, 1.00, 12000.00, 12000.00),
(3, 6, 1.00, 18000.00, 18000.00),
(3, 9, 1.00, 15000.00, 15000.00),
(4, 7, 2.00, 5000.00, 10000.00),
(4, 8, 2.00, 8000.00, 16000.00),
(6, 10, 1.00, 12000.00, 12000.00),
(6, 7, 1.00, 5000.00, 5000.00);

-- Historial: Entrada (suma), Uso (descuenta lo gastado), Venta (descuenta lo vendido)
CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL AUTO_INCREMENT,
  `fk_pk_id_producto` int(11) NOT NULL,
  `tipo` enum('Entrada','Uso','Venta') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `fk_pk_id_usuario` int(11) DEFAULT NULL,
  `fk_pk_id_cita` int(11) DEFAULT NULL,
  `nota` varchar(150) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_pk_id_producto` (`fk_pk_id_producto`),
  KEY `fk_pk_id_usuario` (`fk_pk_id_usuario`),
  KEY `fk_pk_id_cita` (`fk_pk_id_cita`),
  CONSTRAINT `mov_ibfk_1` FOREIGN KEY (`fk_pk_id_producto`) REFERENCES `productos` (`id_productos`),
  CONSTRAINT `mov_ibfk_2` FOREIGN KEY (`fk_pk_id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `mov_ibfk_3` FOREIGN KEY (`fk_pk_id_cita`) REFERENCES `citas` (`id_cita`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `movimientos_inventario` (`id_movimiento`, `fk_pk_id_producto`, `tipo`, `cantidad`, `fk_pk_id_usuario`, `fk_pk_id_cita`, `nota`, `fecha`) VALUES
(1, 1, 'Entrada', 10.00, 1, NULL, 'Compra al proveedor', '2026-10-20 08:15:00'),
(2, 1, 'Uso', 3.00, 2, 1, 'Lavado completo', '2026-10-26 09:05:00'),
(3, 2, 'Uso', 1.00, 7, 3, 'Aplicación de cera protectora', '2026-10-27 14:10:00'),
(4, 3, 'Entrada', 12.00, 1, NULL, 'Reposición de paños', '2026-10-22 10:00:00'),
(5, 4, 'Uso', 2.00, 2, NULL, 'Limpieza general de vidrios', '2026-10-23 16:20:00'),
(6, 6, 'Venta', 1.00, 2, 1, 'Venta en factura #1', '2026-10-26 09:40:00'),
(7, 7, 'Venta', 1.00, 2, 1, 'Venta en factura #1', '2026-10-26 09:41:00'),
(8, 10, 'Venta', 1.00, 3, 2, 'Venta en factura #2', '2026-10-26 11:00:00'),
(9, 9, 'Venta', 1.00, 7, 3, 'Venta en factura #3', '2026-10-27 14:50:00'),
(10, 6, 'Entrada', 5.00, 6, NULL, 'Reposición de stock', '2026-10-25 09:30:00');
