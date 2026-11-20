const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aquagest',
};

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE y TIME llegan como texto: 'YYYY-MM-DD' y 'HH:MM:SS'
  decimalNumbers: true, // DECIMAL llega como número
});

// Comprueba la conexión y sube el límite de paquete de MySQL para poder
// guardar fotos en base64 (XAMPP trae 1 MB por defecto).
async function iniciarDB() {
  const conn = await mysql.createConnection(config);
  try {
    try {
      await conn.query('SET GLOBAL max_allowed_packet = 67108864');
    } catch (e) {
      console.warn('Aviso: no se pudo subir max_allowed_packet. Si las fotos fallan, súbelo en my.ini (ver README).');
    }
    await conn.query('SELECT 1');
  } finally {
    await conn.end();
  }
}

async function transaccion(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { pool, iniciarDB, transaccion };
