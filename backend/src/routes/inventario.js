const router = require('express').Router();
const { pool, transaccion } = require('../db');
const { ROLES, error, permitir, faltan } = require('../auth');

const STAFF = [ROLES.ADMIN, ROLES.EMPLEADO];
const TIPOS = ['Insumo', 'Venta'];

router.get('/productos', permitir(...STAFF), async (req, res) => {
  const [filas] = await pool.query(
    'SELECT *, (cantidad <= stock_minimo) AS bajo FROM productos ORDER BY tipo, nombre'
  );
  res.json(filas.map((p) => ({ ...p, bajo: !!p.bajo })));
});

router.post('/productos', permitir(ROLES.ADMIN), async (req, res) => {
  if (faltan(req.body, ['nombre', 'unidad_medida']).length) throw error(400, 'Nombre y unidad de medida son obligatorios');
  const b = req.body;
  const tipo = TIPOS.includes(b.tipo) ? b.tipo : 'Insumo';
  const cantidad = Number(b.cantidad || 0);
  const precio = Number(b.precio || 0);
  if (cantidad < 0 || precio < 0 || isNaN(cantidad) || isNaN(precio)) throw error(400, 'Cantidad y precio no pueden ser negativos');
  if (tipo === 'Venta' && !(precio > 0)) throw error(400, 'Un producto para vender necesita un precio');

  const id = await transaccion(async (conn) => {
    const [r] = await conn.query(
      'INSERT INTO productos (nombre, descripcion, cantidad, unidad_medida, tipo, precio, stock_minimo) VALUES (?,?,?,?,?,?,?)',
      [b.nombre.trim(), (b.descripcion || '').trim(), cantidad, b.unidad_medida.trim(), tipo, precio, Number(b.stock_minimo || 0)]
    );
    if (cantidad > 0) {
      await conn.query(
        "INSERT INTO movimientos_inventario (fk_pk_id_producto, tipo, cantidad, fk_pk_id_usuario, nota) VALUES (?, 'Entrada', ?, ?, 'Stock inicial')",
        [r.insertId, cantidad, req.user.id]
      );
    }
    return r.insertId;
  });
  res.status(201).json({ message: 'Producto creado', id_productos: id });
});

router.put('/productos/:id', permitir(ROLES.ADMIN), async (req, res) => {
  const id = Number(req.params.id);
  const [filas] = await pool.query('SELECT id_productos FROM productos WHERE id_productos = ?', [id]);
  if (!filas.length) throw error(404, 'Producto no encontrado');
  const b = req.body;
  const sets = [];
  const params = [];
  for (const campo of ['nombre', 'descripcion', 'unidad_medida']) {
    if (b[campo] !== undefined) { sets.push(`${campo} = ?`); params.push(String(b[campo]).trim()); }
  }
  if (b.tipo !== undefined) {
    if (!TIPOS.includes(b.tipo)) throw error(400, 'Tipo de producto no válido');
    sets.push('tipo = ?'); params.push(b.tipo);
  }
  for (const campo of ['precio', 'stock_minimo']) {
    if (b[campo] !== undefined) {
      if (isNaN(Number(b[campo])) || Number(b[campo]) < 0) throw error(400, 'Valores no válidos');
      sets.push(`${campo} = ?`); params.push(Number(b[campo]));
    }
  }
  if (!sets.length) throw error(400, 'No hay nada para actualizar');
  await pool.query(`UPDATE productos SET ${sets.join(', ')} WHERE id_productos = ?`, [...params, id]);
  res.json({ message: 'Producto actualizado' });
});

// Entrada = suma al inventario | Uso = descuenta lo gastado en el lavado
router.post('/productos/:id/movimiento', permitir(...STAFF), async (req, res) => {
  const id = Number(req.params.id);
  const { tipo, nota } = req.body;
  const cantidad = Number(req.body.cantidad);
  if (!['Entrada', 'Uso'].includes(tipo)) throw error(400, 'El movimiento debe ser Entrada o Uso');
  if (!(cantidad > 0)) throw error(400, 'La cantidad debe ser mayor a 0');

  const nuevoStock = await transaccion(async (conn) => {
    const [[prod]] = await conn.query('SELECT * FROM productos WHERE id_productos = ? FOR UPDATE', [id]);
    if (!prod) throw error(404, 'Producto no encontrado');
    if (tipo === 'Uso') {
      if (prod.tipo !== 'Insumo') throw error(400, 'El uso solo aplica a insumos de lavado. Los productos para vender se descuentan en la factura');
      if (Number(prod.cantidad) < cantidad) throw error(409, `Stock insuficiente: quedan ${prod.cantidad} ${prod.unidad_medida}`);
    }
    const delta = tipo === 'Entrada' ? cantidad : -cantidad;
    await conn.query('UPDATE productos SET cantidad = cantidad + ? WHERE id_productos = ?', [delta, id]);
    await conn.query(
      'INSERT INTO movimientos_inventario (fk_pk_id_producto, tipo, cantidad, fk_pk_id_usuario, nota) VALUES (?,?,?,?,?)',
      [id, tipo, cantidad, req.user.id, nota ? String(nota).slice(0, 150) : null]
    );
    return Number(prod.cantidad) + delta;
  });
  res.json({ message: tipo === 'Entrada' ? 'Stock agregado' : 'Uso descontado del inventario', cantidad: nuevoStock });
});

// Historial de movimientos (?producto=ID)
router.get('/movimientos', permitir(...STAFF), async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.producto) { where = 'WHERE m.fk_pk_id_producto = ?'; params.push(Number(req.query.producto)); }
  const [filas] = await pool.query(
    `SELECT m.id_movimiento, m.tipo, m.cantidad, m.nota, m.fecha, m.fk_pk_id_cita,
            p.nombre AS producto, p.unidad_medida, CONCAT(u.nombre, ' ', u.apellido) AS usuario
     FROM movimientos_inventario m
     JOIN productos p ON p.id_productos = m.fk_pk_id_producto
     LEFT JOIN usuarios u ON u.id_usuario = m.fk_pk_id_usuario
     ${where} ORDER BY m.id_movimiento DESC LIMIT 150`,
    params
  );
  res.json(filas);
});

module.exports = router;
