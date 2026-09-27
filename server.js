const express = require('express');
const path = require('path');
const generarReporte = require('./modulos/alertas');

const app = express();
const PUERTO_SERVIDOR = 3000;

// Sirve los archivos estáticos (HTML, CSS, JS del frontend) desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint que el frontend va a consultar para obtener los datos actuales
app.get('/api/reporte', (req, res) => {
  try {
    const reporte = generarReporte();
    res.json(reporte);
  } catch (error) {
    console.error('Error generando el reporte:', error);
    res.status(500).json({ error: 'Error interno generando el reporte' });
  }
});

app.listen(PUERTO_SERVIDOR, () => {
  console.log(`Security Monitor corriendo en http://localhost:${PUERTO_SERVIDOR}`);
});