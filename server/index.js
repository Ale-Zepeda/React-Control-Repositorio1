const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'controlescolar'
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('✅ Conectado a la base de datos MySQL');
});

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Control Escolar funcionando correctamente',
    version: '1.0.0',
    database: 'controlescolar'
  });
});

// Ruta de prueba para verificar conexión a BD
app.get('/api/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS resultado', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la base de datos', details: err });
    }
    res.json({ 
      message: 'Conexión a BD exitosa',
      resultado: results[0]
    });
  });
});

// Rutas de autenticación
app.use('/api/auth', require('./src/routes/auth'));

// Rutas para las entidades principales
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/alumnos', require('./src/routes/alumnos'));
app.use('/api/grupos', require('./src/routes/grupos'));
app.use('/api/avisos', require('./src/routes/avisos'));
app.use('/api/materias', require('./src/routes/materias'));
app.use('/api/calificaciones', require('./src/routes/calificaciones'));
app.use('/api/talleres', require('./src/routes/talleres'));
app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/niveles', require('./src/routes/niveles'));
app.use('/api/asistencias', require('./src/routes/asistencias'));

// Rutas del sistema QR
app.use('/api/qr', require('./src/routes/qr'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Base de datos: controlescolar`);
});

module.exports = app;