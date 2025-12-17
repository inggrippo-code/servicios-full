// db.js - VERSIÓN CON AUTO-CREACIÓN DE TABLAS

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        rejectUnauthorized: false
    }
});

async function connectDB() {
    try {
        const client = await pool.connect();
        console.log('✅ Conexión exitosa a la base de datos remota de Render!');
        
        // --- ESTO CREA TUS TABLAS AUTOMÁTICAMENTE ---
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100),
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS servicios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10,2) NOT NULL,
                categoria VARCHAR(50)
            );
        `);
        console.log('✅ Tablas verificadas/creadas correctamente.');
        
        client.release(); 
    } catch (err) {
        console.error('❌ Error de conexión o creación de tablas:', err.stack);
        process.exit(1); 
    }
}

module.exports = {
    connectDB,
    query: (text, params) => pool.query(text, params),
    pool 
};
