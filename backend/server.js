// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const clienteRoutes = require('./src/routes/clienteRoutes'); // Importamos nuestras rutas

const app = express();
const PORT = 3000;

// Le dice a Express cómo convertir BigInt a JSON: simplemente conviértelo a un string.
app.set('json replacer', (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
);

// Middlewares
app.use(cors()); // Habilita CORS
app.use(express.json()); // Permite que el servidor entienda JSON

// Ruta principal de la API
app.use('/api/clientes', clienteRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend de MesaLista corriendo en http://localhost:${PORT}`);
});