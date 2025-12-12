// db.js

// PASO 1: Cargar las variables de entorno (.env)
// Esto debe ejecutarse primero para que 'process.env' funcione
require('dotenv').config();

// PASO 2: Importar el cliente de PostgreSQL
const { Client } = require('pg');

// PASO 3: Configurar el cliente usando las variables del .env
const client = new Client({
    user: process.env.DB_USER,      // => postgres
    host: process.env.DB_HOST,      // => localhost
    database: process.env.DB_NAME,  // => marketplacedb
    password: process.env.DB_PASSWORD, // => g4473
    port: process.env.DB_PORT       // => 5432
});

// PASO 4: Función para establecer la conexión
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Conexión exitosa a la base de datos marketplacedb!');
        // Opcional: Una consulta de prueba
        // const res = await client.query('SELECT NOW()');
        // console.log('Hora del servidor de DB:', res.rows[0].now);
        
    } catch (err) {
        // Muestra el error si no puede conectar (revisa que PostgreSQL esté corriendo)
        console.error('❌ Error de conexión a la base de datos:', err.stack);
        process.exit(1); // Detiene la aplicación si la conexión falla
    }
}

// PASO 5: Exportar la función de conexión y el cliente
// De esta manera, otros archivos (como server.js) podrán usar estas funciones.
module.exports = {
    connectDB,
    query: (text, params) => client.query(text, params), // Para ejecutar consultas
    client // Exportar el cliente crudo si es necesario
};

// Se puede llamar a connectDB() aquí o en server.js.
// Lo haremos en server.js para asegurar que el servidor espere la conexión.