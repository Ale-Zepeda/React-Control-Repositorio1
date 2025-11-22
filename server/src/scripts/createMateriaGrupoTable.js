const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function createMateriaGrupoTable() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'create-materia-grupo.sql'), 'utf8');
        await db.query(sql);
        console.log('Tabla materia_grupo creada exitosamente');
    } catch (err) {
        console.error('Error creando tabla materia_grupo:', err);
    }
}

createMateriaGrupoTable();