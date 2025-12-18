const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- RUTA PARA REGISTRAR PRESTADORES ---
// Importante: Aquí definimos que el usuario nace con 'verificado: false'
app.post('/registro', (req, res) => {
    const { tipo, nombre, email, celular, ciudad, servicio, resena } = req.body;
    
    const nuevoUsuario = { 
        tipo, 
        nombre, 
        email, 
        celular, 
        ciudad, 
        servicio, 
        resena: resena || "Sin reseña", 
        calificacion: "Buena",
        verificado: false // Obliga a que tú lo valides manualmente después
    };

    const linea = JSON.stringify(nuevoUsuario) + "\n";
    
    fs.appendFile('usuarios.txt', linea, (err) => {
        if (err) {
            console.error("Error al escribir:", err);
            return res.status(500).send("Error al guardar registro.");
        }
        res.send("Registro recibido correctamente.");
    });
});

// --- RUTA PARA CALIFICAR ---
// Permite que los usuarios voten y el cambio quede grabado en el archivo TXT
app.post('/calificar', (req, res) => {
    const { email, nuevaCalif } = req.body;
    
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Error al leer datos.");
        
        let lineas = data.trim().split('\n');
        const nuevasLineas = lineas.map(linea => {
            let u = JSON.parse(linea);
            if (u.email === email) {
                u.calificacion = nuevaCalif; // Actualizamos la nota
            }
            return JSON.stringify(u);
        });

        fs.writeFile('usuarios.txt', nuevasLineas.join('\n') + '\n', (err) => {
            if (err) return res.status(500).send("Error al guardar calificación.");
            res.send("Calificación actualizada.");
        });
    });
});

// --- RUTA PARA ENVIAR DATOS AL BUSCADOR ---
app.get('/usuarios-datos', (req, res) => {
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) return res.json([]);
        try {
            const lineas = data.trim().split('\n').map(l => JSON.parse(l));
            res.json(lineas);
        } catch (e) {
            res.json([]);
        }
    });
});

// --- RUTA DE INICIO ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de Servicios Full corriendo en puerto ${PORT}`);
});
