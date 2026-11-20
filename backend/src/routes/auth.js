const router = require('express').Router();
const { pool } = require('../db');
const { ROLES, error, firmar, hashear, verificar, esBcrypt, limpiarUsuario, faltan } = require('../auth');

const CAMPOS_REGISTRO = ['nombre', 'apellido', 'tipo_documento', 'numero_documento', 'genero', 'correo', 'contrasena', 'telefono'];

// REGISTRO: cualquier persona crea su cuenta, siempre con rol Cliente
router.post('/registro', async (req, res) => {
  const f = faltan(req.body, CAMPOS_REGISTRO);
  if (f.length) throw error(400, 'Todos los campos son obligatorios');
  const { nombre, apellido, tipo_documento, numero_documento, genero, correo, contrasena, telefono } = req.body;
  if (String(contrasena).length < 6) throw error(400, 'La contraseña debe tener mínimo 6 caracteres');
  if (!String(correo).includes('@')) throw error(400, 'Escribe un correo válido');

  const [existe] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ? OR numero_documento = ?', [correo.trim(), String(numero_documento).trim()]);
  if (existe.length) throw error(409, 'El correo o número de documento ya están registrados');

  const hash = await hashear(contrasena);
  const [r] = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, genero, correo, telefono, contrasena, fk_pk_id_rol)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [nombre.trim(), apellido.trim(), tipo_documento, String(numero_documento).trim(), genero, correo.trim(), String(telefono).trim(), hash, ROLES.CLIENTE]
  );
  const [[usuario]] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [r.insertId]);
  res.status(201).json({ message: 'Cuenta creada exitosamente', token: firmar(usuario), usuario: limpiarUsuario(usuario) });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  if (!correo || !contrasena) throw error(400, 'Correo y contraseña son obligatorios');

  const [filas] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [String(correo).trim()]);
  const usuario = filas[0];
  if (!usuario || !(await verificar(contrasena, usuario.contrasena))) {
    throw error(401, 'Correo o contraseña incorrectos');
  }
  // Si la contraseña estaba en texto plano, se cifra en el primer ingreso
  if (!esBcrypt(usuario.contrasena)) {
    await pool.query('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?', [await hashear(contrasena), usuario.id_usuario]);
  }
  res.json({ message: 'Bienvenido', token: firmar(usuario), usuario: limpiarUsuario(usuario) });
});

// RECUPERAR: sin servicio de correo, se valida con el número de documento
router.post('/recuperar', async (req, res) => {
  const { correo, numero_documento, nueva_contrasena } = req.body;
  if (!correo || !numero_documento || !nueva_contrasena) throw error(400, 'Completa todos los campos');
  if (String(nueva_contrasena).length < 6) throw error(400, 'La contraseña debe tener mínimo 6 caracteres');

  const [filas] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ? AND numero_documento = ?', [String(correo).trim(), String(numero_documento).trim()]);
  if (!filas.length) throw error(404, 'El correo y el documento no coinciden con ninguna cuenta');
  await pool.query('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?', [await hashear(nueva_contrasena), filas[0].id_usuario]);
  res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión' });
});

module.exports = router;
