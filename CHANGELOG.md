# Cambios Realizados - Corrección de nombre de columna

## Resumen de Cambios
1. Se renombró la columna `idUsuarios` a `idUsuario` en la tabla `alumnos` para mantener consistencia con la tabla `usuarios`.
2. Se actualizaron todas las referencias en el código para usar el nuevo nombre de columna.

## Archivos Modificados
- `models/Alumno.js`: Actualización de propiedades y queries
- `models/Tutor.js`: Actualización de JOINs y referencias
- `models/Calificacion.js`: Actualización de JOINs
- `models/Grupo.js`: Actualización de JOINs
- `controllers/authController.js`: Actualización de queries
- `services/usuarioService.js`: Actualización de referencias
- `index.js`: Actualización de múltiples queries y JOINs

## Base de Datos
Se ejecutó el siguiente cambio en la estructura:
```sql
ALTER TABLE alumnos CHANGE COLUMN idUsuarios idUsuario INT;
```

## Verificación
Para verificar los cambios:
1. El servidor arranca correctamente
2. Los endpoints funcionan como se espera
3. La estructura de la tabla alumnos muestra la columna correcta

## Verificación Local
Para verificar localmente:
1. Ejecutar el servidor: `cd server && npm run dev`
2. Probar los siguientes endpoints:
   - GET /api/alumnos
   - GET /api/debug-alumno/{id}
   - POST /api/auth/login (con credenciales de alumno)