-- Tablas para el sistema de códigos QR
-- Ejecutar en la base de datos controlescolar

-- Tabla para códigos QR de alumnos (ajustada a estructura existente)
CREATE TABLE IF NOT EXISTS QR_Alumno (
    idQR INT PRIMARY KEY AUTO_INCREMENT,
    idAlumnos INT NOT NULL,
    codigoQR VARCHAR(255) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaExpiracion DATE NULL,
    FOREIGN KEY (idAlumnos) REFERENCES alumnos(idAlumnos) ON DELETE CASCADE
);

-- Tabla para registrar entradas/salidas
CREATE TABLE IF NOT EXISTS AsistenciaQR (
    idAsistencia INT PRIMARY KEY AUTO_INCREMENT,
    idAlumnos INT NOT NULL,
    tipoMovimiento ENUM('entrada', 'salida') NOT NULL,
    fechaHora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispositivoScanner VARCHAR(100) DEFAULT 'Scanner-01',
    ubicacion VARCHAR(100) DEFAULT 'Entrada Principal',
    FOREIGN KEY (idAlumnos) REFERENCES alumnos(idAlumnos) ON DELETE CASCADE
);

-- Tabla para notificaciones enviadas
CREATE TABLE IF NOT EXISTS NotificacionesEnviadas (
    idNotificacion INT PRIMARY KEY AUTO_INCREMENT,
    idAlumnos INT NOT NULL,
    idTutor INT NOT NULL,
    tipoMovimiento ENUM('entrada', 'salida') NOT NULL,
    mensaje TEXT NOT NULL,
    fechaEnvio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodoEnvio ENUM('sms', 'whatsapp', 'email', 'push') NOT NULL,
    estadoEnvio ENUM('pendiente', 'enviado', 'error') DEFAULT 'pendiente',
    FOREIGN KEY (idAlumnos) REFERENCES alumnos(idAlumnos) ON DELETE CASCADE,
    FOREIGN KEY (idTutor) REFERENCES tutor(idTutor) ON DELETE CASCADE
);

-- Índices para mejor performance (sin IF NOT EXISTS para compatibilidad)
CREATE INDEX idx_qr_alumno ON QR_Alumno(idAlumnos);
CREATE INDEX idx_qr_codigo ON QR_Alumno(codigoQR);
CREATE INDEX idx_asistencia_alumno ON AsistenciaQR(idAlumnos);
CREATE INDEX idx_asistencia_fecha ON AsistenciaQR(fechaHora);
CREATE INDEX idx_notificaciones_tutor ON NotificacionesEnviadas(idTutor);

-- Datos de prueba (opcional)
-- Asegúrate de que estos IDs existan en tus tablas

-- Generar QR para el primer alumno (cambiar por ID real)
-- INSERT INTO QR_Alumno (idAlumno, codigoQR) 
-- SELECT 1, CONCAT('ALU1', UPPER(LEFT(MD5(RAND()), 8)))
-- WHERE EXISTS (SELECT 1 FROM Alumnos WHERE idAlumno = 1)
-- LIMIT 1;

-- Verificación de tablas creadas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_ROWS as 'Filas',
    CREATE_TIME as 'Creada'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'controlescolar' 
AND TABLE_NAME IN ('QR_Alumno', 'AsistenciaQR', 'NotificacionesEnviadas');