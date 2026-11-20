const router = require('express').Router();
const { pool, transaccion } = require('../db');
const { ROLES, error, permitir, hashear, limpiarUsuario, faltan } = require('../auth');

const CAMPOS_USUARIO = ['nombre', 'apellido', 'tipo_documento', 'numero_documento', 'genero', 'correo', 'telefono'];
const COLUMNAS = `u.id_usuario, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.genero, u.correo, u.telefono, u.fk_pk_id_rol, r.nombre_rol`;
const RE_PLACA = /^[A-Za-z0-9-]{5,10}$/;

// Perfil de quien tiene la sesión abierta
router.get('/perfil', async (req, res) => {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [req.user.id]);
  if (!filas.length) throw error(404, 'Usuario no encontrado');
  res.json(limpiarUsuario(filas[0]));
});

// ADMIN: lista de usuarios (opcional ?rol=1|2|3)
router.get('/usuarios', permitir(ROLES.ADMIN), async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.rol) {
    where = 'WHERE u.fk_pk_id_rol = ?';
    params.push(Number(req.query.rol));
  }
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS} FROM usuarios u JOIN rol r ON r.id_rol = u.fk_pk_id_rol ${where} ORDER BY u.fk_pk_id_rol, u.nombre`,
    params
  );
  res.json(filas);
});

// ADMIN: crea cuentas de cualquier rol
router.post('/usuarios', permitir(ROLES.ADMIN), async (req, res) => {
  const f = faltan(req.body, [...CAMPOS_USUARIO, 'contrasena', 'fk_pk_id_rol']);
  if (f.length) throw error(400, 'Todos los campos son obligatorios');
  const b = req.body;
  if (![1, 2, 3].includes(Number(b.fk_pk_id_rol))) throw error(400, 'Rol no válido');
  if (String(b.contrasena).length < 6) throw error(400, 'La contraseña debe tener mínimo 6 caracteres');

  const [existe] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ? OR numero_documento = ?', [b.correo.trim(), String(b.numero_documento).trim()]);
  if (existe.length) throw error(409, 'El correo o número de documento ya están registrados');

  const [r] = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, genero, correo, telefono, contrasena, fk_pk_id_rol)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [b.nombre.trim(), b.apellido.trim(), b.tipo_documento, String(b.numero_documento).trim(), b.genero, b.correo.trim(), String(b.telefono).trim(), await hashear(b.contrasena), Number(b.fk_pk_id_rol)]
  );
  res.status(201).json({ message: 'Usuario creado', id_usuario: r.insertId });
});

// ADMIN: edita datos, rol y (opcional) restablece la contraseña
router.put('/usuarios/:id', permitir(ROLES.ADMIN), async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body;
  const [filas] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id]);
  if (!filas.length) throw error(404, 'Usuario no encontrado');
  if (id === req.user.id && b.fk_pk_id_rol && Number(b.fk_pk_id_rol) !== ROLES.ADMIN) {
    throw error(400, 'No puedes quitarte a ti mismo el rol de administrador');
  }
  const sets = [];
  const params = [];
  for (const campo of ['nombre', 'apellido', 'telefono', 'genero']) {
    if (b[campo] !== undefined && String(b[campo]).trim() !== '') {
      sets.push(`${campo} = ?`);
      params.push(String(b[campo]).trim());
    }
  }
  if (b.fk_pk_id_rol !== undefined) {
    if (![1, 2, 3].includes(Number(b.fk_pk_id_rol))) throw error(400, 'Rol no válido');
    sets.push('fk_pk_id_rol = ?');
    params.push(Number(b.fk_pk_id_rol));
  }
  if (b.contrasena) {
    if (String(b.contrasena).length < 6) throw error(400, 'La contraseña debe tener mínimo 6 caracteres');
    sets.push('contrasena = ?');
    params.push(await hashear(b.contrasena));
  }
  if (!sets.length) throw error(400, 'No hay nada para actualizar');
  await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id_usuario = ?`, [...params, id]);
  res.json({ message: 'Usuario actualizado' });
});

// EMPLEADO / ADMIN: lista de clientes con su cantidad de vehículos
router.get('/clientes', permitir(ROLES.ADMIN, ROLES.EMPLEADO), async (req, res) => {
  const [filas] = await pool.query(
    `SELECT ${COLUMNAS}, (SELECT COUNT(*) FROM vehiculos v WHERE v.fk_pk_id_usuario = u.id_usuario) AS vehiculos
     FROM usuarios u JOIN rol r ON r.id_rol = u.fk_pk_id_rol
     WHERE u.fk_pk_id_rol = ? ORDER BY u.nombre, u.apellido`,
    [ROLES.CLIENTE]
  );
  res.json(filas);
});

// EMPLEADO / ADMIN: registra un cliente y su vehículo en un solo paso.
// La contraseña inicial es el número de documento (el cliente puede cambiarla desde "Recuperar").
router.post('/clientes', permitir(ROLES.ADMIN, ROLES.EMPLEADO), async (req, res) => {
  const f = faltan(req.body, [...CAMPOS_USUARIO, 'placa']);
  if (f.length) throw error(400, 'Completa todos los campos obligatorios');
  const b = req.body;
  const placa = String(b.placa).trim().toUpperCase();
  if (!RE_PLACA.test(placa)) throw error(400, 'Revisa el formato de la placa');
  if (String(b.numero_documento).trim().length < 6) throw error(400, 'El documento debe tener mínimo 6 caracteres');

  const [existe] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ? OR numero_documento = ?', [b.correo.trim(), String(b.numero_documento).trim()]);
  if (existe.length) throw error(409, 'El correo o número de documento ya están registrados');
  const [placaExiste] = await pool.query('SELECT id_vehiculo FROM vehiculos WHERE placa = ?', [placa]);
  if (placaExiste.length) throw error(409, 'Esa placa ya está registrada');

  const hash = await hashear(String(b.numero_documento).trim());
  const foto = b.foto ? String(b.foto).replace(/^data:image\/\w+;base64,/, '') : null;

  const resultado = await transaccion(async (conn) => {
    const [u] = await conn.query(
      `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, genero, correo, telefono, contrasena, fk_pk_id_rol)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [b.nombre.trim(), b.apellido.trim(), b.tipo_documento, String(b.numero_documento).trim(), b.genero, b.correo.trim(), String(b.telefono).trim(), hash, ROLES.CLIENTE]
    );
    const [v] = await conn.query(
      'INSERT INTO vehiculos (fk_pk_id_usuario, tipo_vehiculo, marca, placa, foto) VALUES (?,?,?,?,?)',
      [u.insertId, b.tipo_vehiculo || 'Automóvil', (b.marca || '').trim(), placa, foto]
    );
    return { id_usuario: u.insertId, id_vehiculo: v.insertId };
  });
  res.status(201).json({ message: 'Cliente registrado. Su contraseña inicial es su número de documento', ...resultado });
});

module.exports = router;
