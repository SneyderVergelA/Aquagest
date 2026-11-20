require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { iniciarDB } = require('./src/db');
const { autenticar } = require('./src/auth');

const app = express();

app.use(cors());
// Las fotos de los vehículos viajan como texto base64, por eso el límite alto.
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use((req, res, next) => { console.log(`${new Date().toLocaleTimeString()}  ${req.method} ${req.url}`); next(); });
// Express 5 deja req.body sin definir cuando no llega cuerpo
app.use((req, res, next) => { req.body = req.body || {}; next(); });

app.get('/', (req, res) => res.send('API AquaGest funcionando'));

// Rutas públicas: registro de clientes, inicio de sesión y recuperación
app.use(require('./src/routes/auth'));

// Todo lo que sigue exige sesión (token JWT
app.use(autenticar);
app.use(require('./src/routes/usuarios'));
app.use(require('./src/routes/catalogo'));
app.use(require('./src/routes/vehiculos'));
app.use(require('./src/routes/citas'));
app.use(require('./src/routes/inventario'));
app.use(require('./src/routes/reportes'));

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));

// Manejo central de errores
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La imagen es demasiado grande' });
  }
  if (!err.publico) console.error(err);
  res.status(err.status || 500).json({ message: err.publico || 'Error en el servidor' });
});

const PORT = Number(process.env.PORT || 3100);

iniciarDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
      console.log('Conexión exitosa a la base de datos');
    });
  })
  .catch((e) => {
    console.error('No se pudo conectar a la base de datos:', e.message);
    console.error('Revisa que MySQL esté encendido en XAMPP y que hayas importado mysql.sql');
    process.exit(1);
  });
