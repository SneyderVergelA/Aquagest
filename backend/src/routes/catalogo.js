const router = require('express').Router();
const { pool } = require('../db');
const { ROLES, error, permitir, faltan } = require('../auth');

router.get('/servicios', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM servicio ORDER BY valor');
  res.json(filas);
});

router.get('/adicionales', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM adicionales ORDER BY nombre');
  res.json(filas);
});

// Lavaderos que usan AquaGest (para el mapa)
router.get('/lavaderos', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM lavaderos ORDER BY nombre');
  res.json(filas);
});

router.post('/lavaderos', permitir(ROLES.ADMIN), async (req, res) => {
  const f = faltan(req.body, ['nombre', 'direccion', 'latitud', 'longitud']);
  if (f.length) throw error(400, 'Nombre, dirección y coordenadas son obligatorios');
  const { nombre, direccion, telefono, latitud, longitud } = req.body;
  if (isNaN(Number(latitud)) || isNaN(Number(longitud))) throw error(400, 'Coordenadas no válidas');
  const [r] = await pool.query(
    'INSERT INTO lavaderos (nombre, direccion, telefono, latitud, longitud) VALUES (?,?,?,?,?)',
    [nombre.trim(), direccion.trim(), telefono || null, Number(latitud), Number(longitud)]
  );
  res.status(201).json({ message: 'Lavadero creado', id_lavadero: r.insertId });
});

module.exports = router;
