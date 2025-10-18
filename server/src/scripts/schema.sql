-- schema.sql para controlescolar (incluye password_hash y seeds mínimos)

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE SCHEMA IF NOT EXISTS `controlescolar` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `controlescolar`;

CREATE TABLE IF NOT EXISTS `Nivel` (
  `idNivel` INT NOT NULL AUTO_INCREMENT,
  `nivel` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idNivel`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Roles` (
  `idRol` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(20) NOT NULL UNIQUE,
  PRIMARY KEY (`idRol`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Grupo` (
  `idGrupo` INT NOT NULL AUTO_INCREMENT,
  `grado` VARCHAR(20) NOT NULL,
  `turno` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`idGrupo`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Materia` (
  `idMateria` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `semestre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idMateria`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Usuarios` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `Ap` VARCHAR(50) NOT NULL,
  `Am` VARCHAR(50) NOT NULL,
  `calle` VARCHAR(50) NOT NULL,
  `colonia` VARCHAR(45) NOT NULL,
  `numero` VARCHAR(10) NOT NULL,
  `cp` VARCHAR(10) NOT NULL,
  `telefono` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `idNivel` INT NOT NULL,
  `idRol` INT NOT NULL,
  `password_hash` VARCHAR(255) NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `uk_usuarios_email` (`email`),
  KEY `idx_usuarios_nivel` (`idNivel`),
  KEY `idx_usuarios_rol` (`idRol`),
  CONSTRAINT `fk_usuarios_nivel` FOREIGN KEY (`idNivel`) REFERENCES `Nivel`(`idNivel`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`idRol`) REFERENCES `Roles`(`idRol`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Alumnos` (
  `idAlumnos` INT NOT NULL AUTO_INCREMENT,
  `idUsuarios` INT NOT NULL,
  `idGrupo` INT NOT NULL,
  PRIMARY KEY (`idAlumnos`),
  UNIQUE KEY `uk_alumnos_usuario` (`idUsuarios`),
  KEY `idx_alumnos_grupo` (`idGrupo`),
  CONSTRAINT `fk_alumnos_usuarios` FOREIGN KEY (`idUsuarios`) REFERENCES `Usuarios`(`idUsuario`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_alumnos_grupo` FOREIGN KEY (`idGrupo`) REFERENCES `Grupo`(`idGrupo`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Tutor` (
  `idTutor` INT NOT NULL AUTO_INCREMENT,
  `idUsuario` INT NOT NULL,
  `idAlumno` INT NOT NULL,
  PRIMARY KEY (`idTutor`),
  KEY `idx_tutor_usuario` (`idUsuario`),
  KEY `idx_tutor_alumno` (`idAlumno`),
  CONSTRAINT `fk_tutor_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuarios`(`idUsuario`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_tutor_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `Alumnos`(`idAlumnos`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Avisos` (
  `idAvisos` INT NOT NULL AUTO_INCREMENT,
  `mensaje` VARCHAR(200) NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `idGrupo` INT NOT NULL,
  PRIMARY KEY (`idAvisos`),
  KEY `idx_avisos_grupo` (`idGrupo`),
  CONSTRAINT `fk_avisos_grupo` FOREIGN KEY (`idGrupo`) REFERENCES `Grupo`(`idGrupo`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Calificaciones` (
  `idCalificaciones` INT NOT NULL AUTO_INCREMENT,
  `idMateria` INT NOT NULL,
  `idAlumno` INT NOT NULL,
  `calificacion` DECIMAL(5,2) NOT NULL,
  `periodo` TINYINT NOT NULL,
  PRIMARY KEY (`idCalificaciones`),
  UNIQUE KEY `uk_calif_alumno_materia_periodo` (`idAlumno`,`idMateria`,`periodo`),
  KEY `idx_calif_materia` (`idMateria`),
  CONSTRAINT `fk_calif_materia` FOREIGN KEY (`idMateria`) REFERENCES `Materia`(`idMateria`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_calif_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `Alumnos`(`idAlumnos`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Talleres` (
  `idTalleres` INT NOT NULL AUTO_INCREMENT,
  `nombreT` VARCHAR(45) NOT NULL,
  `profesor` VARCHAR(45) NOT NULL,
  `idAlumno` INT NOT NULL,
  PRIMARY KEY (`idTalleres`),
  KEY `idx_talleres_alumno` (`idAlumno`),
  CONSTRAINT `fk_talleres_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `Alumnos`(`idAlumnos`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `AvisosGrupo` (
  `idAvisosGrupo` INT NOT NULL AUTO_INCREMENT,
  `idAlumno` INT NOT NULL,
  `mensaje` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`idAvisosGrupo`),
  KEY `idx_avisosgrupo_alumno` (`idAlumno`),
  CONSTRAINT `fk_avisosgrupo_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `Alumnos`(`idAlumnos`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `QR_Alumno` (
  `idQRAlumno` INT NOT NULL AUTO_INCREMENT,
  `QR` VARCHAR(255) NULL,
  `idAlumno` INT NOT NULL,
  PRIMARY KEY (`idQRAlumno`),
  KEY `idx_qr_alumno` (`idAlumno`),
  CONSTRAINT `fk_qr_alumno` FOREIGN KEY (`idAlumno`) REFERENCES `Alumnos`(`idAlumnos`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `Notificaciones` (
  `idNotificaciones` INT NOT NULL AUTO_INCREMENT,
  `idTutor` INT NOT NULL,
  `idQRAlumno` INT NOT NULL,
  `mensaje` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`idNotificaciones`),
  KEY `idx_notif_tutor` (`idTutor`),
  KEY `idx_notif_qr` (`idQRAlumno`),
  CONSTRAINT `fk_notif_tutor` FOREIGN KEY (`idTutor`) REFERENCES `Tutor`(`idTutor`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_notif_qr` FOREIGN KEY (`idQRAlumno`) REFERENCES `QR_Alumno`(`idQRAlumno`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO `Roles` (`nombre`) VALUES ('admin'), ('profesor'), ('tutor'), ('alumno')
  ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);
INSERT INTO `Nivel` (`nivel`) VALUES ('Primaria'), ('Secundaria'), ('Preparatoria')
  ON DUPLICATE KEY UPDATE nivel=VALUES(nivel);
INSERT INTO `Grupo` (`grado`,`turno`) VALUES ('1', 'Matutino')
  ON DUPLICATE KEY UPDATE grado=VALUES(grado), turno=VALUES(turno);
INSERT INTO `Materia` (`nombre`,`semestre`) VALUES ('Matemáticas','1')
  ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), semestre=VALUES(semestre);

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
