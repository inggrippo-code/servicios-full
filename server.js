// server.js - VERSIÓN FINAL INTEGRADA (CORS + SEGURIDAD + CRUD COMPLETO)

require('dotenv').config(); 
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors'); // Agregado para permitir peticiones externas (Toma de datos)
const { connectDB, query } = require('./db.js');

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); // PERMITE QUE TU APP SE CONECTE DESDE CUALQUIER LUGAR
app.use(express.json()); // PERMITE LEER JSON EN EL BODY

const PORT = process.env.PORT || 3001;

// ------------------------------------------------------------------
// --- RUTAS DE USUARIOS ---
// ------------------------------------------------------------------

// 1. Registro
app.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body; 
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds); 
        const queryText = 'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, nombre, email;';
        const result = await query(queryText, [nombre, email, hashedPassword]); 
        res.status(201).json({ message: 'Usuario registrado!', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'Email ya registrado.' });
        res.status(500).json({ message: 'Error interno.', detail: error.message });
    }
});

// 2. Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await query('SELECT * FROM usuarios WHERE email = $1;', [email]); 
        if (result.rowCount === 0) return res.status(401).json({ message: 'Usuario no encontrado.' });
        
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ message: 'Login exitoso.', userId: user.id, nombre: user.nombre });
        } else {
            res.status(401).json({ message: 'Contraseña incorrecta.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el login.' });
    }
});

// 3. Obtener todos los usuarios
// Esta es la llave para mostrar el Frontis de SERVICIOS FULL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/usuarios', async (req, res) => {
    try {
        const result = await query('SELECT id, nombre, email, fecha_registro FROM usuarios ORDER BY id ASC;');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar usuarios.' });
    }
});

// 4. Actualizar Usuario (Lógica Dinámica)
app.put('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { nombre, email, password } = req.body;
        if (!nombre && !email && !password) return res.status(400).json({ message: 'Nada que actualizar.' });

        let updateClauses = [];
        let queryValues = [];
        let valueIndex = 1;

        if (nombre) { updateClauses.push(`nombre = $${valueIndex++}`); queryValues.push(nombre); }
        if (email) { updateClauses.push(`email = $${valueIndex++}`); queryValues.push(email); }
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            updateClauses.push(`password = $${valueIndex++}`); queryValues.push(hashed);
        }

        queryValues.push(userId); 
        const queryText = `UPDATE usuarios SET ${updateClauses.join(', ')} WHERE id = $${valueIndex} RETURNING id, nombre;`;
        const result = await query(queryText, queryValues);
        
        if (result.rowCount === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        res.status(200).json({ message: 'Actualizado!', usuario: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar.' });
    }
});

// ------------------------------------------------------------------
// --- RUTAS DE SERVICIOS ---
// ------------------------------------------------------------------

// 5. Crear Servicio
app.post('/servicios', async (req, res) => {
    try {
        const { nombre, descripcion, precio, categoria } = req.body;
        if (!nombre || !precio) return res.status(400).json({ message: 'Nombre y precio requeridos.' });
        
        const queryText = 'INSERT INTO servicios (nombre, descripcion, precio, categoria) VALUES ($1, $2, $3, $4) RETURNING *;';
        const result = await query(queryText, [nombre, descripcion, parseFloat(precio), categoria]); 
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear servicio.' });
    }
});

// 6. Obtener Servicios
app.get('/servicios', async (req, res) => {
    try {
        const result = await query('SELECT * FROM servicios ORDER BY id ASC;');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener servicios.' });
    }
});

// 7. Eliminar Servicio
app.delete('/servicios/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM servicios WHERE id = $1 RETURNING id;', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'No encontrado.' });
        res.status(200).json({ message: 'Servicio eliminado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar.' });
    }
});

// ------------------------------------------------------------------
// --- INICIO DEL SERVIDOR ---
// ------------------------------------------------------------------

async function startServer() {
    try {
        await connectDB(); 
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor listo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error("⛔ Error al iniciar servidor:", error.message);
        process.exit(1); 
    }
}


startServer();
