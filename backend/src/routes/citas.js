const router = require('express').Router();
const { pool, transaccion } = require('../db');
const { ROLES, error, permitir, faltan } = require('../auth');

// Reglas del negocio (propuesta): franjas de 30 min entre 8:00 y 17:00,
// cancelar/reprogramar con mínimo 10 horas de anticipación, un vehículo por operario a la vez.
const SLOTS = [];
for (let h = 8; h < 17; h++) {
  SLOTS.push(`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`);
}
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORAS_MIN_ANTICIPACION = 10;
const TRANSICIONES = { Pendiente: ['En proceso'], 'En proceso': ['Terminada'] };

const fechaHora = (fecha, hora) => new Date(`${fecha}T${hora}:00`);

const SELECT_CITA = `
  SELECT c.id_cita, c.fecha, c.hora, c.estado, c.estado_pago, c.total, c.valor_servicio, c.placa, c.marca, c.observaciones,
         c.fk_pk_id_usuario, c.fk_pk_id_empleado, c.fk_pk_id_servicio, c.fk_pk_id_vehiculo,
         s.nombre AS servicio, v.tipo_vehiculo,
         CONCAT(u.nombre, ' ', u.apellido) AS cliente, u.tipo_documento AS cliente_tipo_doc,
         u.numero_documento AS cliente_documento, u.telefono AS cliente_telefono, u.correo AS cliente_correo,
         CONCAT(e.nombre, ' ', e.apellido) AS empleado
  FROM citas c
  JOIN servicio s ON s.id_servicio = c.fk_pk_id_servicio
  JOIN usuarios u ON u.id_usuario = c.fk_pk_id_usuario
  LEFT JOIN usuarios e ON e.id_usuario = c.fk_pk_id_empleado
  LEFT JOIN vehiculos v ON v.id_vehiculo = c.fk_pk_id_vehiculo`;

const limpiarCita = (c) => ({ ...c, hora: String(c.hora).slice(0, 5) });

async function obtenerCita(id, db = pool) {
  const n = Number(id);
  if (!Number.isInteger(n)) throw error(404, 'Cita no encontrada');
  const [filas] = await db.query(`${SELECT_CITA} WHERE c.id_cita = ?`, [n]);
  if (!filas.length) throw error(404, 'Cita no encontrada');
  return limpiarCita(filas[0]);
}

function comprobarAcceso(user, cita) {
  if (user.rol === ROLES.CLIENTE && cita.fk_pk_id_usuario !== user.id) {
    throw error(403, 'No tienes permiso para ver esta cita');
  }
}

function validarSlot(fecha, hora) {
  if (!RE_FECHA.test(fecha || '') || isNaN(fechaHora(fecha, '00:00'))) throw error(400, 'Fecha no válida');
  if (!SLOTS.includes(hora)) throw error(400, 'La hora debe ser una franja de 30 minutos entre 8:00 y 17:00');
  if (fechaHora(fecha, hora) <= new Date()) throw error(400, 'Escoge una fecha y hora futuras');
}

function exigirAnticipacion(cita) {
  const horas = (fechaHora(cita.fecha, cita.hora) - new Date()) / 3600000;
  if (horas < HORAS_MIN_ANTICIPACION) {
    throw error(409, `Solo puedes cancelar o reprogramar con mínimo ${HORAS_MIN_ANTICIPACION} horas de anticipación`);
  }
}

// Operario libre en esa franja; entre varios, el que tenga menos citas ese día
async function buscarEmpleadoLibre(db, fecha, hora, excluirCita = 0) {
  const [filas] = await db.query(
    `SELECT u.id_usuario FROM usuarios u
     WHERE u.fk_pk_id_rol = ? AND u.id_usuario NOT IN (
       SELECT c.fk_pk_id_empleado FROM citas c
       WHERE c.fecha = ? AND c.hora = ? AND c.estado <> 'Cancelada'
         AND c.fk_pk_id_empleado IS NOT NULL AND c.id_cita <> ?)
     ORDER BY (SELECT COUNT(*) FROM citas c2 WHERE c2.fk_pk_id_empleado = u.id_usuario
               AND c2.fecha = ? AND c2.estado <> 'Cancelada'), u.id_usuario
     LIMIT 1`,
    [ROLES.EMPLEADO, fecha, hora, excluirCita, fecha]
  );
  return filas[0] ? filas[0].id_usuario : null;
}

async function recalcularTotal(conn, idCita) {
  await conn.query(
    `UPDATE citas c SET c.total = c.valor_servicio
       + COALESCE((SELECT SUM(a.valor) FROM cita_adicionales a WHERE a.fk_pk_id_cita = c.id_cita), 0)
       + COALESCE((SELECT SUM(p.subtotal) FROM cita_productos p WHERE p.fk_pk_id_cita = c.id_cita), 0)
     WHERE c.id_cita = ?`,
    [idCita]
  );
}

// ---------- Listado y disponibilidad ----------

router.get('/citas', async (req, res) => {
  const where = [];
  const params = [];
  if (req.user.rol === ROLES.CLIENTE) {
    where.push('c.fk_pk_id_usuario = ?');
    params.push(req.user.id);
  }
  if (req.query.desde && RE_FECHA.test(req.query.desde)) { where.push('c.fecha >= ?'); params.push(req.query.desde); }
  if (req.query.hasta && RE_FECHA.test(req.query.hasta)) { where.push('c.fecha <= ?'); params.push(req.query.hasta); }
  const [filas] = await pool.query(
    `${SELECT_CITA} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.fecha, c.hora LIMIT 500`,
    params
  );
  res.json(filas.map(limpiarCita));
});

// Franjas del día con su disponibilidad (?excluir=ID ignora esa cita al reprogramar)
router.get('/citas/disponibilidad', async (req, res) => {
  const { fecha } = req.query;
  if (!RE_FECHA.test(fecha || '') || isNaN(fechaHora(fecha, '00:00'))) throw error(400, 'Fecha no válida');
  const [[{ n: empleados }]] = await pool.query('SELECT COUNT(*) AS n FROM usuarios WHERE fk_pk_id_rol = ?', [ROLES.EMPLEADO]);
  const [ocupadas] = await pool.query(
    `SELECT TIME_FORMAT(hora, '%H:%i') AS hora, COUNT(*) AS n FROM citas
     WHERE fecha = ? AND estado <> 'Cancelada' AND id_cita <> ? GROUP BY hora`,
    [fecha, Number(req.query.excluir) || 0]
  );
  const mapa = {};
  ocupadas.forEach((o) => { mapa[o.hora] = o.n; });
  const ahora = new Date();
  res.json(
    SLOTS.map((hora) => {
      const libres = Math.max(empleados - (mapa[hora] || 0), 0);
      return { hora, libres, disponible: libres > 0 && fechaHora(fecha, hora) > ahora };
    })
  );
});

// ---------- Crear ----------

router.post('/citas', async (req, res) => {
  const b = req.body;
  const esCliente = req.user.rol === ROLES.CLIENTE;
  const clienteId = esCliente ? req.user.id : Number(b.fk_pk_id_usuario);
  if (!clienteId) throw error(400, 'Indica el cliente de la cita');
  if (faltan(b, ['fecha', 'hora', 'fk_pk_id_servicio', 'fk_pk_id_vehiculo']).length) {
    throw error(400, 'Completa servicio, vehículo, fecha y hora');
  }
  validarSlot(b.fecha, b.hora);

  const [[servicio]] = await pool.query('SELECT * FROM servicio WHERE id_servicio = ?', [Number(b.fk_pk_id_servicio)]);
  if (!servicio) throw error(404, 'Servicio no encontrado');
  const [[vehiculo]] = await pool.query('SELECT * FROM vehiculos WHERE id_vehiculo = ? AND fk_pk_id_usuario = ?', [Number(b.fk_pk_id_vehiculo), clienteId]);
  if (!vehiculo) throw error(404, 'El vehículo no pertenece a este cliente');

  const ids = Array.isArray(b.adicionales) ? [...new Set(b.adicionales.map(Number))].filter(Boolean) : [];
  let adicionales = [];
  if (ids.length) {
    [adicionales] = await pool.query('SELECT * FROM adicionales WHERE id_adicional IN (?)', [ids]);
  }

  const idCita = await transaccion(async (conn) => {
    const empleado = await buscarEmpleadoLibre(conn, b.fecha, b.hora);
    if (!empleado) throw error(409, 'Esa franja ya no tiene cupo, escoge otra hora');
    const total = Number(servicio.valor) + adicionales.reduce((s, a) => s + Number(a.valor), 0);
    const [r] = await conn.query(
      `INSERT INTO citas (fk_pk_id_usuario, fk_pk_id_servicio, fk_pk_id_vehiculo, fk_pk_id_empleado, fecha, hora,
                          observaciones, placa, marca, valor_servicio, total)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [clienteId, servicio.id_servicio, vehiculo.id_vehiculo, empleado, b.fecha, b.hora, (b.observaciones || '').slice(0, 200) || null,
       vehiculo.placa, vehiculo.marca || '', servicio.valor, total]
    );
    for (const a of adicionales) {
      await conn.query('INSERT INTO cita_adicionales (fk_pk_id_cita, fk_pk_id_adicional, valor) VALUES (?,?,?)', [r.insertId, a.id_adicional, a.valor]);
    }
    return r.insertId;
  });
  res.status(201).json({ message: 'Cita agendada', id_cita: idCita });
});

// ---------- Detalle ----------

router.get('/citas/:id', async (req, res) => {
  const cita = await obtenerCita(req.params.id);
  comprobarAcceso(req.user, cita);
  const [adicionales] = await pool.query(
    `SELECT a.id_adicional, a.nombre, ca.valor FROM cita_adicionales ca
     JOIN adicionales a ON a.id_adicional = ca.fk_pk_id_adicional WHERE ca.fk_pk_id_cita = ?`,
    [cita.id_cita]
  );
  const [productos] = await pool.query(
    `SELECT p.id_productos, p.nombre, p.unidad_medida, cp.cantidad, cp.precio_unitario, cp.subtotal
     FROM cita_productos cp JOIN productos p ON p.id_productos = cp.fk_pk_id_producto WHERE cp.fk_pk_id_cita = ?`,
    [cita.id_cita]
  );
  let vehiculo_foto = null;
  if (cita.fk_pk_id_vehiculo) {
    const [v] = await pool.query('SELECT foto FROM vehiculos WHERE id_vehiculo = ?', [cita.fk_pk_id_vehiculo]);
    vehiculo_foto = v[0] ? v[0].foto : null;
  }
  res.json({ ...cita, adicionales, productos, vehiculo_foto });
});

// ---------- Cancelar y reprogramar ----------

router.put('/citas/:id/cancelar', permitir(ROLES.CLIENTE, ROLES.ADMIN), async (req, res) => {
  const cita = await obtenerCita(req.params.id);
  comprobarAcceso(req.user, cita);
  if (cita.estado !== 'Pendiente') throw error(409, 'Solo se pueden cancelar citas pendientes');
  if (req.user.rol === ROLES.CLIENTE) exigirAnticipacion(cita);
  await pool.query("UPDATE citas SET estado = 'Cancelada' WHERE id_cita = ?", [cita.id_cita]);
  res.json({ message: 'Cita cancelada' });
});

router.put('/citas/:id/reprogramar', permitir(ROLES.CLIENTE, ROLES.ADMIN), async (req, res) => {
  const cita = await obtenerCita(req.params.id);
  comprobarAcceso(req.user, cita);
  if (cita.estado !== 'Pendiente') throw error(409, 'Solo se pueden reprogramar citas pendientes');
  if (req.user.rol === ROLES.CLIENTE) exigirAnticipacion(cita);
  const { fecha, hora } = req.body;
  validarSlot(fecha, hora);
  await transaccion(async (conn) => {
    const empleado = await buscarEmpleadoLibre(conn, fecha, hora, cita.id_cita);
    if (!empleado) throw error(409, 'Esa franja ya no tiene cupo, escoge otra hora');
    await conn.query('UPDATE citas SET fecha = ?, hora = ?, fk_pk_id_empleado = ? WHERE id_cita = ?', [fecha, hora, empleado, cita.id_cita]);
  });
  res.json({ message: 'Cita reprogramada' });
});

// ---------- Estado del servicio (empleado / admin) ----------

router.put('/citas/:id/estado', permitir(ROLES.ADMIN, ROLES.EMPLEADO), async (req, res) => {
  const cita = await obtenerCita(req.params.id);
  const nuevo = req.body.estado;
  if (!(TRANSICIONES[cita.estado] || []).includes(nuevo)) {
    throw error(409, `No se puede pasar de "${cita.estado}" a "${nuevo}"`);
  }
  await pool.query('UPDATE citas SET estado = ? WHERE id_cita = ?', [nuevo, cita.id_cita]);
  res.json({ message: `Servicio ${nuevo === 'En proceso' ? 'iniciado' : 'finalizado'}` });
});

// ---------- Productos vendidos en la factura (descuentan inventario) ----------

router.post('/citas/:id/productos', permitir(ROLES.ADMIN, ROLES.EMPLEADO), async (req, res) => {
  const idCita = Number(req.params.id);
  const idProducto = Number(req.body.fk_pk_id_producto);
  const cantidad = Number(req.body.cantidad);
  if (!idProducto || !(cantidad > 0)) throw error(400, 'Indica el producto y una cantidad mayor a 0');

  await transaccion(async (conn) => {
    const [[cita]] = await conn.query('SELECT * FROM citas WHERE id_cita = ? FOR UPDATE', [idCita]);
    if (!cita) throw error(404, 'Cita no encontrada');
    if (!['En proceso', 'Terminada'].includes(cita.estado)) throw error(409, 'Inicia el servicio antes de agregar productos');
    if (cita.estado_pago === 'Pagado') throw error(409, 'La factura ya está pagada');

    const [[prod]] = await conn.query('SELECT * FROM productos WHERE id_productos = ? FOR UPDATE', [idProducto]);
    if (!prod || prod.tipo !== 'Venta') throw error(404, 'Producto para venta no encontrado');
    if (Number(prod.cantidad) < cantidad) throw error(409, `Stock insuficiente: quedan ${prod.cantidad} ${prod.unidad_medida}`);

    await conn.query('UPDATE productos SET cantidad = cantidad - ? WHERE id_productos = ?', [cantidad, idProducto]);
    await conn.query(
      `INSERT INTO cita_productos (fk_pk_id_cita, fk_pk_id_producto, cantidad, precio_unitario, subtotal) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad), subtotal = subtotal + VALUES(subtotal)`,
      [idCita, idProducto, cantidad, prod.precio, cantidad * Number(prod.precio)]
    );
    await conn.query(
      "INSERT INTO movimientos_inventario (fk_pk_id_producto, tipo, cantidad, fk_pk_id_usuario, fk_pk_id_cita, nota) VALUES (?, 'Venta', ?, ?, ?, ?)",
      [idProducto, cantidad, req.user.id, idCita, `Venta en factura #${idCita}`]
    );
    await recalcularTotal(conn, idCita);
  });
  res.status(201).json({ message: 'Producto agregado a la factura' });
});

router.delete('/citas/:id/productos/:idProducto', permitir(ROLES.ADMIN, ROLES.EMPLEADO), async (req, res) => {
  const idCita = Number(req.params.id);
  const idProducto = Number(req.params.idProducto);
  await transaccion(async (conn) => {
    const [[cita]] = await conn.query('SELECT * FROM citas WHERE id_cita = ? FOR UPDATE', [idCita]);
    if (!cita) throw error(404, 'Cita no encontrada');
    if (cita.estado_pago === 'Pagado') throw error(409, 'La factura ya está pagada');
    const [[linea]] = await conn.query('SELECT * FROM cita_productos WHERE fk_pk_id_cita = ? AND fk_pk_id_producto = ?', [idCita, idProducto]);
    if (!linea) throw error(404, 'Ese producto no está en la factura');
    await conn.query('UPDATE productos SET cantidad = cantidad + ? WHERE id_productos = ?', [linea.cantidad, idProducto]);
    await conn.query('DELETE FROM cita_productos WHERE fk_pk_id_cita = ? AND fk_pk_id_producto = ?', [idCita, idProducto]);
    await conn.query(
      "INSERT INTO movimientos_inventario (fk_pk_id_producto, tipo, cantidad, fk_pk_id_usuario, fk_pk_id_cita, nota) VALUES (?, 'Entrada', ?, ?, ?, ?)",
      [idProducto, linea.cantidad, req.user.id, idCita, `Devolución de factura #${idCita}`]
    );
    await recalcularTotal(conn, idCita);
  });
  res.json({ message: 'Producto retirado de la factura' });
});

// ---------- Pago (solo admin) ----------

router.put('/citas/:id/pago', permitir(ROLES.ADMIN), async (req, res) => {
  const cita = await obtenerCita(req.params.id);
  const nuevo = req.body.estado_pago;
  if (!['Pendiente', 'Pagado'].includes(nuevo)) throw error(400, 'Estado de pago no válido');
  if (cita.estado === 'Cancelada') throw error(409, 'La cita está cancelada');
  if (nuevo === 'Pagado' && cita.estado !== 'Terminada') throw error(409, 'Finaliza el servicio antes de marcar el pago');
  await pool.query('UPDATE citas SET estado_pago = ? WHERE id_cita = ?', [nuevo, cita.id_cita]);
  res.json({ message: `Factura marcada como ${nuevo.toLowerCase()}` });
});

module.exports = router;
