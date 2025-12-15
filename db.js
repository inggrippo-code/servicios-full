// db.js

// PASO 1: Cargar las variables de entorno (.env)
require('dotenv').config();

// PASO 2: Importar la conexión (usamos Pool, que es la práctica estándar para APIs en producción)
const { Pool } = require('pg');

// PASO 3: Configurar el Pool usando la URL de Render (DATABASE_URL)
const pool = new Pool({
    // Render utiliza esta variable única que contiene usuario, password, host, y nombre de la DB
    connectionString: process.env.DATABASE_URL, 
    ssl: {
        // Render requiere esta configuración SSL para conexiones seguras
        // Esto le dice a tu API que confíe en el certificado de seguridad de Render
        rejectUnauthorized: false
    }
});

// PASO 4: Función para verificar la conexión
async function connectDB() {
    try {
        // Intenta obtener un cliente del pool para verificar que la conexión se inicia correctamente
        const client = await pool.connect();
        client.release(); // Libera el cliente
        console.log('✅ Conexión exitosa a la base de datos remota de Render!');
    } catch (err) {
        // Muestra el error si no puede conectar
        console.error('❌ Error de conexión a la base de datos remota:', err.stack);
        process.exit(1); // Detiene la aplicación si la conexión falla
    }
}

// PASO 5: Exportar la función de conexión y el método para ejecutar consultas
module.exports = {
    connectDB,
    // Otros archivos usarán esta función para ejecutar queries.
    query: (text, params) => pool.query(text, params),
    pool // Exportar el pool crudo si es necesario
};