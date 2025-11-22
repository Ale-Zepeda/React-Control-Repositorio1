// Crea un usuario admin por defecto si no existe
const { pool } = require('../db');
const bcrypt = require('bcryptjs');

async function getRolId(nombre) {
  const [rows] = await pool.query('SELECT idRol FROM Roles WHERE nombre=?', [nombre]);
  return rows[0]?.idRol;
}

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';

  // Asegura seeds de Roles/Nivel básicos
  await pool.query("INSERT INTO Roles (nombre) VALUES ('admin'),('profesor'),('tutor'),('alumno') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)");
  await pool.query("INSERT INTO Nivel (nivel) VALUES ('Primaria') ON DUPLICATE KEY UPDATE nivel=VALUES(nivel)");

  const [exists] = await pool.query('SELECT idUsuario FROM Usuarios WHERE email=?', [email]);
  if (exists.length) {
    console.log('Admin ya existe');
    return;
  }
  const idRol = await getRolId('admin');
  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    'INSERT INTO Usuarios (nombre,Ap,Am,calle,colonia,numero,cp,telefono,email,idNivel,idRol,password_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    ['Admin','Sys','Root','Calle','Centro','0','00000','0000000000',email,1,idRol,hash]
  );
  console.log('Admin creado con id', r.insertId, 'credenciales:', email, password);
}

main().then(() => process.exit(0)).catch((e)=>{console.error(e);process.exit(1);});
