const app = express();
const express = require('express');
const fs = require('fs');
const path = require('path');
const port = 3030;

app.get('/', (req, res) => {
    fs.readFile(path.join(__dirname, '../data', 'DUCT2.json'), 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'No se pudo leer el archivo JSON' });
      }
      // Envía el JSON como respuesta
      res.json(JSON.parse(data));
    });
  });


// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor API escuchando en http://localhost:${port}`);
});
