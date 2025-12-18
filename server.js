require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { connectDB, query } = require('./db.js');

const app = express();
app.use(cors());
app.use(express.json());

// --- MÁSCARA COMERCIAL: SERVICIOS FULL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- RUTAS DE USUARIOS ---
app.get('/usuarios', async (req, res) => {
    try {
        const result = await query('SELECT id, nombre, email, fecha_registro FROM usuarios ORDER BY id ASC;');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener usuarios');
    }
});

// --- RUTAS DE SERVICIOS ---
app.get('/servicios', async (req, res) => {
    try {
        const result = await query('SELECT * FROM servicios ORDER BY id ASC;');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener servicios');
    }
});

// --- INICIO DEL SERVIDOR ---
async function startServer() {
    try {
        await connectDB();
        const PORT = process.env.PORT || 10000;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
    }
}

startServer();
