// server.js - VERSIÓN FINAL CORREGIDA Y OPTIMIZADA

// Carga las variables de entorno del archivo .env
require('dotenv').config(); 
// Importa los módulos esenciales
const express = require('express');
const app = express(); // Inicializa la aplicación Express

// Importa el módulo para hashear/comparar contraseñas
const bcrypt = require('bcrypt');

// ** IMPORTACIÓN CLAVE: Importa las funciones de DB desde db.js **
const { connectDB, query } = require('./db.js'); // Importamos connectDB y query

// --- MIDDLEWARES (Configuraciones Intermedias) ---

// 1. CORRECCIÓN CRÍTICA: Permite a Express leer el cuerpo de las peticiones en formato JSON.
// DEBE IR AQUÍ, ANTES DE CUALQUIER RUTA QUE USE req.body.
app.use(express.json()); 

// --- CONFIGURACIÓN DE PUERTO ---
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------
// --- RUTAS DE LA APLICACIÓN (Endpoints) ---
// ------------------------------------------------------------------

// 1. Ruta de Prueba Base
app.get('/', (req, res) => {
    res.send('Bienvenido al Marketplace de Servicios. DB Conectada.');
});

// 2. RUTA DE REGISTRO DE USUARIOS (POST) - CON HASHEO SEGURO
app.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body; 
        
        // La verificación de campos ya funciona gracias a la corrección del middleware.
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios: nombre, email o password.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); 
        
        const queryText = 'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id;';
        // USO CORRECTO DE LA FUNCIÓN DE DB: await query(...)
        const result = await query(queryText, [nombre, email, hashedPassword]); 

        res.status(201).json({
            message: 'Usuario registrado con éxito!',
            userId: result.rows[0].id
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }
        
        console.error('❌ Error FATAL en la Base de Datos (Registro):', error);
        res.status(500).json({ 
            message: 'Error FATAL interno del servidor (Diagnóstico SQL).',
            db_error_code: error.code, 
            db_error_detail: error.detail || error.message
        });
    }
});

// 3. RUTA PARA OBTENER TODOS LOS USUARIOS (GET)
app.get('/usuarios', async (req, res) => {
    try {
        const queryText = 'SELECT id, nombre, email, fecha_registro FROM usuarios ORDER BY id ASC;';
        const result = await query(queryText);

        res.status(200).json({
            message: 'Lista de usuarios recuperada con éxito.',
            total: result.rowCount,
            usuarios: result.rows
        });

    } catch (error) {
        console.error('❌ Error al obtener la lista de usuarios:', error);
        res.status(500).json({
            message: 'Error interno del servidor al consultar usuarios.',
            db_error_detail: error.message
        });
    }
});

// 4. RUTA PARA OBTENER UN USUARIO POR ID (GET /usuarios/:id)
app.get('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const queryText = 'SELECT id, nombre, email, fecha_registro FROM usuarios WHERE id = $1;';
        const result = await query(queryText, [userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: 'Usuario recuperado con éxito.',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al buscar usuario por ID:', error);
        res.status(500).json({
            message: 'Error interno del servidor al consultar usuario.',
            db_error_detail: error.message
        });
    }
});

// 5. RUTA PARA ACTUALIZAR UN USUARIO (PUT /usuarios/:id)
app.put('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { nombre, email, password } = req.body;
        
        if (!nombre && !email && !password) {
            return res.status(400).json({ message: 'Se debe proporcionar al menos el nombre, email o password para actualizar.' });
        }

        let updateClauses = [];
        let queryValues = [];
        let valueIndex = 1;

        if (nombre) {
            updateClauses.push(`nombre = $${valueIndex++}`);
            queryValues.push(nombre);
        }
        if (email) {
            updateClauses.push(`email = $${valueIndex++}`);
            queryValues.push(email);
        }
        if (password) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds); 
            updateClauses.push(`password = $${valueIndex++}`);
            queryValues.push(hashedPassword);
        }

        queryValues.push(userId); 

        const queryText = `UPDATE usuarios SET ${updateClauses.join(', ')} WHERE id = $${valueIndex} RETURNING id, nombre, email;`;
        const result = await query(queryText, queryValues);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
        }

        res.status(200).json({
            message: 'Usuario actualizado con éxito.',
            usuario: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'El nuevo email ya está en uso por otro usuario.' });
        }

        console.error('❌ Error al actualizar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor al actualizar usuario.',
            db_error_detail: error.message
        });
    }
});

// 6. RUTA PARA ELIMINAR UN USUARIO (DELETE /usuarios/:id)
app.delete('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const queryText = 'DELETE FROM usuarios WHERE id = $1 RETURNING id;';
        const result = await query(queryText, [userId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
        }

        res.status(200).json({
            message: 'Usuario eliminado con éxito.',
            userId: userId
        });

    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({
            message: 'Error interno del servidor al eliminar usuario.',
            db_error_detail: error.message
        });
    }
});

// 7A. RUTA PARA CREAR UN NUEVO SERVICIO (POST /servicios)
app.post('/servicios', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria } = req.body;

        if (!nombre || !precio) {
            return res.status(400).json({ message: 'Faltan campos obligatorios: nombre y precio.' });
        }
        
        const precioNumerico = parseFloat(precio);

        const queryText = `
            INSERT INTO "servicios" (nombre, descripcion, precio, categoria) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, nombre, precio;
        `;
        
        const result = await query(queryText, [nombre, descripcion, precioNumerico, categoria]); 

        res.status(201).json({
            message: 'Servicio creado con éxito.',
            servicio: result.rows[0]
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Ya existe un servicio con ese nombre.' });
        }

        console.error('❌ Error al crear el servicio:', error);
        res.status(500).json({
            message: 'Error interno del servidor al crear el servicio.',
            db_error_detail: error.message
        });
    }
});

// 7B. RUTA PARA INICIO DE SESIÓN (LOGIN)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar el usuario por email
        const queryText = 'SELECT id, nombre, password FROM usuarios WHERE email = $1;';
        const result = await query(queryText, [email]); 

        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'Autenticación fallida: Email no encontrado.' });
        }

        const user = result.rows[0];
        const hashedPassword = user.password; 

        // 2. Comparar la contraseña proporcionada con el hash guardado
        const match = await bcrypt.compare(password, hashedPassword);

        if (match) {
            // Éxito: La contraseña coincide con el hash
            res.status(200).json({
                message: 'Login exitoso. ¡La seguridad con bcrypt funciona!',
                userId: user.id,
                nombre: user.nombre
            });
        } else {
            // Falla: La contraseña no coincide
            res.status(401).json({ message: 'Autenticación fallida: Contraseña incorrecta.' });
        }

    } catch (error) {
        console.error('❌ Error en el proceso de login:', error);
        res.status(500).json({
            message: 'Error interno del servidor durante la autenticación.',
            db_error_detail: error.message
        });
    }
});

// --- RUTAS CRUD ADICIONALES PARA SERVICIOS ---

// 8. RUTA PARA OBTENER TODOS LOS SERVICIOS (GET /servicios)
app.get('/servicios', async (req, res) => {
    try {
        const queryText = 'SELECT id, nombre, descripcion, precio, categoria FROM servicios ORDER BY id ASC;';
        const result = await query(queryText);

        res.status(200).json({
            message: 'Lista de servicios recuperada con éxito.',
            total: result.rowCount,
            servicios: result.rows
        });
    } catch (error) {
        console.error('❌ Error al obtener la lista de servicios:', error);
        res.status(500).json({ message: 'Error interno del servidor al consultar servicios.' });
    }
});

// 9. RUTA PARA OBTENER UN SERVICIO POR ID (GET /servicios/:id)
app.get('/servicios/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const queryText = 'SELECT id, nombre, descripcion, precio, categoria FROM servicios WHERE id = $1;';
        const result = await query(queryText, [serviceId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }

        res.status(200).json({
            message: 'Servicio recuperado con éxito.',
            servicio: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error al buscar servicio por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al consultar servicio.' });
    }
});

// 10. RUTA PARA ACTUALIZAR UN SERVICIO (PUT /servicios/:id)
app.put('/servicios/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const { nombre, descripcion, precio, categoria } = req.body;
        
        let updateClauses = [];
        let queryValues = [];
        let valueIndex = 1;

        if (nombre) { updateClauses.push(`nombre = $${valueIndex++}`); queryValues.push(nombre); }
        if (descripcion) { updateClauses.push(`descripcion = $${valueIndex++}`); queryValues.push(descripcion); }
        if (precio) { updateClauses.push(`precio = $${valueIndex++}`); queryValues.push(precio); }
        if (categoria) { updateClauses.push(`categoria = $${valueIndex++}`); queryValues.push(categoria); }

        if (updateClauses.length === 0) {
            return res.status(400).json({ message: 'Se debe proporcionar al menos un campo para actualizar.' });
        }

        queryValues.push(serviceId); 

        const queryText = `UPDATE servicios SET ${updateClauses.join(', ')} WHERE id = $${valueIndex} RETURNING id, nombre;`;
        const result = await query(queryText, queryValues);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado para actualizar.' });
        }

        res.status(200).json({
            message: 'Servicio actualizado con éxito.',
            servicio: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error al actualizar servicio:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar servicio.' });
    }
});

// 11. RUTA PARA ELIMINAR UN SERVICIO (DELETE /servicios/:id)
app.delete('/servicios/:id', async (req, res) => {
    try {
        const serviceId = req.params.id;
        const queryText = 'DELETE FROM servicios WHERE id = $1 RETURNING id;';
        const result = await query(queryText, [serviceId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado para eliminar.' });
        }

        res.status(200).json({
            message: 'Servicio eliminado con éxito.',
            serviceId: serviceId
        });

    } catch (error) {
        console.error('❌ Error al eliminar servicio:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar servicio.' });
    }
});


// ***************************************************************
// ** PUNTO CRÍTICO: INICIO DEL SERVIDOR (AWAIT DB CONNECTION) **
// ***************************************************************

async function startServer() {
    try {
        // --- 🥇 PASO CLAVE: ESPERAR LA CONEXIÓN A LA DB ---
        await connectDB(); 
        
        // 2. Si la conexión es exitosa, iniciar el servidor Express
        app.listen(PORT, () => {
            console.log(`🚀 Servidor Express iniciado y escuchando en el puerto: ${PORT}`);
            console.log(`Ruta: http://localhost:${PORT}`);
        });

    } catch (error) {
        // Si la conexión falla, se lanza un error y el servidor no se inicia.
        console.error("⛔ No se pudo iniciar el servidor. Error FATAL al conectar la DB. Asegúrese que PostgreSQL esté activo.", error.message);
        process.exit(1); // Detiene el proceso de Node.js
    }
}

// Iniciar todo el proceso de la aplicación
startServer();