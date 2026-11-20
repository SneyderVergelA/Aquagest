const router = require('express').Router();
const { pool } = require('../db');
const { ROLES, error, permitir } = require('../auth');

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Resumen para la pantalla de Estadísticas (?desde=YYYY-MM-DD&hasta=YYYY-MM-DD)
router.get('/reportes/resumen', permitir(ROLES.ADMIN), async (req, res) => {
  const { desde, hasta } = req.query;
  if (!RE_FECHA.test(desde || '') || !RE_FECHA.test(hasta || '')) throw error(400, 'Indica las fechas desde y hasta');
  const rango = [desde, hasta];

  const [[ingresos]] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN estado_pago = 'Pagado' THEN total END), 0) AS pagado,
       COALESCE(SUM(CASE WHEN estado_pago = 'Pendiente' AND estado <> 'Cancelada' THEN total END), 0) AS pendiente
     FROM citas WHERE fecha BETWEEN ? AND ? AND estado <> 'Cancelada'`,
    rango
  );
  const [porEstado] = await pool.query(
    'SELECT estado, COUNT(*) AS cantidad FROM citas WHERE fecha BETWEEN ? AND ? GROUP BY estado',
    rango
  );
  const [serviciosTop] = await pool.query(
    `SELECT s.nombre, COUNT(*) AS cantidad FROM citas c JOIN servicio s ON s.id_servicio = c.fk_pk_id_servicio
     WHERE c.fecha BETWEEN ? AND ? AND c.estado <> 'Cancelada' GROUP BY s.id_servicio ORDER BY cantidad DESC LIMIT 5`,
    rango
  );
  const [productosVendidos] = await pool.query(
    `SELECT p.nombre, p.unidad_medida, SUM(cp.cantidad) AS cantidad, SUM(cp.subtotal) AS total
     FROM cita_productos cp
     JOIN citas c ON c.id_cita = cp.fk_pk_id_cita
     JOIN productos p ON p.id_productos = cp.fk_pk_id_producto
     WHERE c.fecha BETWEEN ? AND ? AND c.estado <> 'Cancelada' GROUP BY p.id_productos ORDER BY total DESC LIMIT 5`,
    rango
  );
  const [bajoStock] = await pool.query(
    'SELECT nombre, cantidad, unidad_medida, stock_minimo FROM productos WHERE cantidad <= stock_minimo ORDER BY cantidad'
  );
  const [[totales]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM usuarios WHERE fk_pk_id_rol = ?) AS clientes,
            (SELECT COUNT(*) FROM vehiculos) AS vehiculos`,
    [ROLES.CLIENTE]
  );
  res.json({ ingresos, por_estado: porEstado, servicios_top: serviciosTop, productos_vendidos: productosVendidos, bajo_stock: bajoStock, totales });
});

module.exports = router;
