const router = require('express').Router();
const { pool } = require('../db');
const { ROLES, error, faltan } = require('../auth');

const RE_PLACA = /^[A-Za-z0-9-]{5,10}$/;
const quitarPrefijo = (foto) => (foto ? String(foto).replace(/^data:image\/\w+;base64,/, '') : null);

// Cliente: sus vehículos. Empleado/Admin: ?cliente=ID (con foto) o todos (sin foto, más liviano)
router.get('/vehiculos', async (req, res) => {
  const esCliente = req.user.rol === ROLES.CLIENTE;
  const clienteId = esCliente ? req.user.id : req.query.cliente ? Number(req.query.cliente) : null;
  const columnas = clienteId
    ? 'v.*'
    : 'v.id_vehiculo, v.fk_pk_id_usuario, v.tipo_vehiculo, v.marca, v.placa, (v.foto IS NOT NULL) AS tiene_foto';
  const [filas] = await pool.query(
    `SELECT ${columnas}, CONCAT(u.nombre, ' ', u.apellido) AS cliente
     FROM vehiculos v JOIN usuarios u ON u.id_usuario = v.fk_pk_id_usuario
     ${clienteId ? 'WHERE v.fk_pk_id_usuario = ?' : ''} ORDER BY v.id_vehiculo DESC`,
    clienteId ? [clienteId] : []
  );
  res.json(filas);
});

router.get('/vehiculos/:id', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [Number(req.params.id)]);
  const v = filas[0];
  if (!v) throw error(404, 'Vehículo no encontrado');
  if (req.user.rol === ROLES.CLIENTE && v.fk_pk_id_usuario !== req.user.id) throw error(403, 'No tienes permiso para ver este vehículo');
  res.json(v);
});

// Registro de vehículo con foto opcional (base64 guardado como texto)
router.post('/vehiculos', async (req, res) => {
  const esCliente = req.user.rol === ROLES.CLIENTE;
  const duenoId = esCliente ? req.user.id : Number(req.body.fk_pk_id_usuario);
  if (!duenoId) throw error(400, 'Indica a qué cliente pertenece el vehículo');
  if (faltan(req.body, ['placa']).length) throw error(400, 'La placa es obligatoria');

  const placa = String(req.body.placa).trim().toUpperCase();
  if (!RE_PLACA.test(placa)) throw error(400, 'Revisa el formato de la placa');
  const [dueno] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND fk_pk_id_rol = ?', [duenoId, ROLES.CLIENTE]);
  if (!dueno.length) throw error(404, 'El cliente no existe');
  const [existe] = await pool.query('SELECT id_vehiculo FROM vehiculos WHERE placa = ?', [placa]);
  if (existe.length) throw error(409, 'Esa placa ya está registrada');

  const [r] = await pool.query(
    'INSERT INTO vehiculos (fk_pk_id_usuario, tipo_vehiculo, marca, placa, foto) VALUES (?,?,?,?,?)',
    [duenoId, req.body.tipo_vehiculo || 'Automóvil', (req.body.marca || '').trim(), placa, quitarPrefijo(req.body.foto)]
  );
  res.status(201).json({ message: 'Vehículo registrado', id_vehiculo: r.insertId });
});

// Actualiza marca, tipo o foto (dueño, empleado o admin)
router.put('/vehiculos/:id', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [Number(req.params.id)]);
  const v = filas[0];
  if (!v) throw error(404, 'Vehículo no encontrado');
  if (req.user.rol === ROLES.CLIENTE && v.fk_pk_id_usuario !== req.user.id) throw error(403, 'No tienes permiso para editar este vehículo');
  const sets = [];
  const params = [];
  if (req.body.marca !== undefined) { sets.push('marca = ?'); params.push(String(req.body.marca).trim()); }
  if (req.body.tipo_vehiculo) { sets.push('tipo_vehiculo = ?'); params.push(req.body.tipo_vehiculo); }
  if (req.body.foto !== undefined) { sets.push('foto = ?'); params.push(quitarPrefijo(req.body.foto)); }
  if (!sets.length) throw error(400, 'No hay nada para actualizar');
  await pool.query(`UPDATE vehiculos SET ${sets.join(', ')} WHERE id_vehiculo = ?`, [...params, v.id_vehiculo]);
  res.json({ message: 'Vehículo actualizado' });
});

module.exports = router;
