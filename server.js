const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// 1. Ruta para registrar nuevos usuarios
app.post('/registro', (req, res) => {
    const { tipo, nombre, email, celular, ciudad, servicio, resena, experiencia, referencias } = req.body;
    const nuevoUsuario = { 
        tipo, nombre, email, celular, ciudad, servicio, 
        resena: resena || "Sin reseña", 
        experiencia: experiencia || "Sin datos", 
        referencias: referencias || "Sin referencias",
        calificacion: "Buena" 
    };
    const linea = JSON.stringify(nuevoUsuario) + "\n";
    fs.appendFile('usuarios.txt', linea, (err) => {
        if (err) return res.status(500).send("Error al guardar");
        res.send("¡Usuario registrado con éxito!");
    });
});

// 2. Ruta para obtener los datos
app.get('/usuarios-datos', (req, res) => {
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err || !data) return res.json([]);
        try {
            const lista = data.trim().split("\n").map(linea => JSON.parse(linea));
            res.json(lista);
        } catch (e) { res.json([]); }
    });
});

// 3. NUEVA RUTA: Para guardar la calificación permanente
app.post('/calificar', (req, res) => {
    const { email, nuevaCalif } = req.body;
    fs.readFile('usuarios.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).send("Error al leer");
        
        let usuarios = data.trim().split("\n").map(linea => JSON.parse(linea));
        
        // Buscamos al prestador por su email y actualizamos su nota
        usuarios = usuarios.map(u => {
            if (u.email === email) {
                u.calificacion = nuevaCalif;
            }
            return u;
        });

        // Guardamos todo de nuevo en el archivo
        const nuevoContenido = usuarios.map(u => JSON.stringify(u)).join("\n") + "\n";
        fs.writeFile('usuarios.txt', nuevoContenido, (err) => {
            if (err) return res.status(500).send("Error al actualizar");
            res.send("Calificación guardada");
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor SERVICIOS FULL activo"));
